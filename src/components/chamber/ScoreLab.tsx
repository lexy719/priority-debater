"use client";

/**
 * ScoreLab — the interactive heart of /results. Every dimension is a live
 * slider; the headline viability score and verdict recompute instantly using
 * the SAME formula the audited engine uses (overall = Σ score×weight). It
 * shows founders exactly where the leverage is — and lets them PROVE a gap to
 * trigger a real, audited re-score (the Fix-It loop).
 *
 * "What-if" dragging is local and deterministic (offline). "Prove it" calls
 * /api/rescore, which re-runs scoreIdeaV2 with the new evidence folded in.
 */

import { useMemo, useState } from "react";
import { Sliders, RotateCcw, Sparkles, TrendingUp, Loader2, Check, X, Lock } from "lucide-react";
import type { Report, Tone } from "@/components/chamber/report";

type Dim = Report["overview"]["dims"][number];

const weightOf = (d: Dim) => Number(d.weight.replace(/[^0-9.]/g, "")) || 0;
const headlineOf = (dims: Dim[]) => Math.round(dims.reduce((a, d) => a + d.value * weightOf(d), 0) / 100);
const toneOf = (v: number): Tone => (v >= 70 ? "success" : v >= 55 ? "accent" : v >= 40 ? "warn" : "danger");
const toneClass: Record<Tone, string> = { success: "text-success", accent: "text-accent", warn: "text-warn", danger: "text-danger" };
const toneBg: Record<Tone, string> = { success: "bg-success", accent: "bg-accent", warn: "bg-warn", danger: "bg-danger" };

function verdictFor(score: number): { label: string; tone: Tone } {
  if (score >= 70) return { label: "GO", tone: "success" };
  if (score >= 50) return { label: "CAUTION", tone: "warn" };
  return { label: "NO-GO", tone: "danger" };
}

export default function ScoreLab({
  report, idea, position, context, onApply,
}: {
  report: Report;
  idea: string; position?: string; context?: string;
  /** Persist a real re-score back into the parent report. */
  onApply: (dims: Dim[], score: number, meta: { recommendation?: string; rationale?: string }) => void;
}) {
  const baseline = report.overview.dims;
  const baseScore = report.score.value;
  const [draft, setDraft] = useState<Dim[]>(baseline);
  const [proving, setProving] = useState<number | null>(null);
  const [evidence, setEvidence] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [justScored, setJustScored] = useState<number | null>(null);

  const projected = headlineOf(draft);
  const delta = projected - baseScore;
  const dirty = draft.some((d, i) => d.value !== baseline[i].value);
  const pv = verdictFor(projected);
  const bv = verdictFor(baseScore);

  // Biggest lever = weight × remaining headroom (where a point moves the score most and there's room).
  const lever = useMemo(() => {
    let best = 0, idx = 0;
    baseline.forEach((d, i) => {
      const score = weightOf(d) * (100 - d.value);
      if (score > best) { best = score; idx = i; }
    });
    return baseline[idx];
  }, [baseline]);
  const leverGain = Math.round((weightOf(lever) * (Math.min(100, lever.value + 15) - lever.value)) / 100);

  const setVal = (i: number, v: number) =>
    setDraft((prev) => prev.map((d, j) => (j === i ? { ...d, value: v, tone: toneOf(v), contrib: +((v * weightOf(d)) / 100).toFixed(1) } : d)));

  const reset = () => setDraft(baseline);

  const submitProof = async (i: number) => {
    if (!evidence.trim()) return;
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/rescore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, position, context, evidence: evidence.trim(), dimensionLabel: baseline[i].k }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Re-score failed.");
      const newDims = data.dims as Dim[];
      const newScore = data.overall as number;
      onApply(newDims, newScore, { recommendation: data.recommendation, rationale: data.rationale });
      setDraft(newDims);
      setProving(null); setEvidence("");
      setJustScored(newScore);
      setTimeout(() => setJustScored(null), 2600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Re-score failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 ip-card">
      <div className="px-5 pt-5 pb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="ip-section-label flex items-center gap-2"><Sliders className="size-3.5" /> SCORE LAB · WHAT MOVES THE NEEDLE</div>
          <div className="text-lg font-bold mt-1 text-foreground">Drag a dimension. Watch your verdict move.</div>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
            The headline recomputes with the exact rubric formula. Then <span className="text-accent">prove a gap</span> with real evidence to trigger an audited re-score.
          </p>
        </div>

        {/* Live projected score */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] tracking-widest text-muted-foreground">{dirty ? "PROJECTED" : "CURRENT"}</div>
            <div className={`font-display text-5xl leading-none tabular-nums ${justScored != null ? "chamber-pop" : ""} ${toneClass[toneOf(projected)]}`}>
              {projected}
            </div>
            {dirty && (
              <div className={`text-[11px] mt-0.5 ${delta >= 0 ? "text-success" : "text-danger"}`}>
                {delta >= 0 ? "▲ +" : "▼ "}{delta} vs {baseScore}
              </div>
            )}
          </div>
          <div className="border-l border-border pl-4">
            <div className="text-[10px] tracking-widest text-muted-foreground">VERDICT</div>
            <div className={`font-display text-2xl ${toneClass[pv.tone]}`}>{pv.label}</div>
            {dirty && pv.label !== bv.label && (
              <div className="text-[10px] tracking-widest text-accent mt-0.5 flex items-center gap-1">
                <Sparkles className="size-3" /> FLIPS FROM {bv.label}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Biggest lever callout */}
      <div className="mx-5 mb-4 border border-accent/40 bg-accent/5 p-3 flex items-start gap-3">
        <TrendingUp className="size-4 text-accent shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="text-[10px] tracking-widest text-accent">BIGGEST LEVER · </span>
          <span className="font-semibold">{lever.k}</span> — it carries {lever.weight} weight and sits at {lever.value}/100.
          Closing it ~15 pts adds <span className="text-accent font-bold">≈ +{leverGain}</span> to your headline. Prove it first.
        </div>
      </div>

      {/* Dimension sliders */}
      <div className="px-5 pb-5 space-y-3">
        {draft.map((d, i) => {
          const isLever = d.k === lever.k;
          const moved = d.value !== baseline[i].value;
          return (
            <div key={d.k} className={`border p-3 ${isLever ? "border-accent/50" : "border-border"}`}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-display text-sm truncate">{d.k}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{d.weight}</span>
                  {isLever && <span className="text-[9px] tracking-widest text-accent border border-accent/40 px-1.5 py-0.5 shrink-0">LEVER</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`font-display text-lg tabular-nums ${toneClass[toneOf(d.value)]}`}>{d.value}</span>
                  {moved && <span className="text-[10px] text-muted-foreground">was {baseline[i].value}</span>}
                </div>
              </div>
              <input
                type="range" min={0} max={100} value={d.value}
                onChange={(e) => setVal(i, Number(e.target.value))}
                className="w-full chamber-range"
                style={{ accentColor: `var(--${toneOf(d.value)})` }}
                aria-label={`${d.k} score`}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] text-muted-foreground leading-snug pr-3 line-clamp-2">{d.note}</p>
                <button
                  onClick={() => { setProving(proving === i ? null : i); setEvidence(""); setError(""); }}
                  className="shrink-0 text-[10px] tracking-widest border border-border px-2 py-1 hover:bg-surface flex items-center gap-1">
                  {proving === i ? <><X className="size-3" /> CANCEL</> : <><Lock className="size-3" /> PROVE IT</>}
                </button>
              </div>

              {proving === i && (
                <div className="mt-3 border-t border-border pt-3">
                  <div className="text-[10px] tracking-widest text-accent mb-2">ADD REAL EVIDENCE FOR {d.k}</div>
                  <textarea
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value.slice(0, 1000))}
                    placeholder="e.g. 'Signed 3 LOIs at €89/seat from 50+ lawyer firms in Madrid; CAC €1.2k from the first cohort.' Numbers and named sources move the score."
                    className="w-full h-24 bg-surface border border-border p-3 text-sm focus:outline-none focus:border-accent resize-none"
                  />
                  {error && <div className="text-[11px] text-danger mt-2">{error}</div>}
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => submitProof(i)} disabled={busy || !evidence.trim()}
                      className="px-4 py-2 bg-accent text-accent-foreground font-display text-xs tracking-widest hover:opacity-90 disabled:opacity-40 flex items-center gap-2">
                      {busy ? <><Loader2 className="size-3.5 animate-spin" /> RE-SCORING…</> : <>RE-SCORE WITH THIS EVIDENCE</>}
                    </button>
                    <span className="text-[10px] tracking-widest text-muted-foreground">RUNS THE AUDITED ENGINE · MAY MOVE OTHER DIMENSIONS TOO</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-5 pb-5 flex flex-wrap items-center gap-3">
        {dirty && (
          <button onClick={reset} className="text-[10px] tracking-widest border border-border px-3 py-2 hover:bg-surface flex items-center gap-1.5">
            <RotateCcw className="size-3" /> RESET TO ACTUAL
          </button>
        )}
        {justScored != null && (
          <span className="text-[10px] tracking-widest text-success flex items-center gap-1.5">
            <Check className="size-3" /> RE-SCORED · HEADLINE NOW {justScored}
          </span>
        )}
        <span className="text-[10px] tracking-widest text-muted-foreground ml-auto">
          DRAGGING IS A PROJECTION · ONLY PROVEN EVIDENCE CHANGES YOUR REAL SCORE
        </span>
      </div>
    </div>
  );
}
