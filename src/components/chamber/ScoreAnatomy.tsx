"use client";

/**
 * ScoreAnatomy — the centerpiece of /results §01. A calm, static breakdown of
 * WHERE the audited verdict comes from (replaces the old draggable Score Lab).
 *
 *  1. Composition bar — each dimension is a segment whose width is its weighted
 *     contribution to the headline; the unproven remainder is shown faint. It
 *     answers "what is my 61 made of, and where is the missing 39?" instantly.
 *  2. Dimension rows — read-only, audited scores with weight + contribution.
 *  3. Biggest lever — the dimension where new evidence would move the score most.
 *
 * No interactivity by design: scores are audited and only change by re-running
 * the engine. Defending and strengthening the idea happens in the Chamber.
 */

import { useMemo } from "react";
import { Layers, TrendingUp, ShieldCheck } from "lucide-react";
import type { Report, Tone } from "@/components/chamber/report";

type Dim = Report["overview"]["dims"][number];

const weightOf = (d: Dim) => Number(d.weight.replace(/[^0-9.]/g, "")) || 0;
const contribOf = (d: Dim) => +((d.value * weightOf(d)) / 100).toFixed(1);
const toneOf = (v: number): Tone => (v >= 70 ? "success" : v >= 55 ? "accent" : v >= 40 ? "warn" : "danger");
const toneClass: Record<Tone, string> = { success: "text-success", accent: "text-accent", warn: "text-warn", danger: "text-danger" };
const toneVar: Record<Tone, string> = { success: "var(--success)", accent: "var(--accent)", warn: "var(--warn)", danger: "var(--danger)" };

function verdictFor(score: number): { label: string; tone: Tone } {
  if (score >= 70) return { label: "GO", tone: "success" };
  if (score >= 50) return { label: "CAUTION", tone: "warn" };
  return { label: "NO-GO", tone: "danger" };
}

export default function ScoreAnatomy({ report }: { report: Report }) {
  const dims = report.overview.dims;
  const score = report.score.value;
  const verdict = verdictFor(score);

  // Biggest lever = weight × remaining headroom (where a proven point moves the score most).
  const leverIdx = useMemo(() => {
    let best = -1, idx = 0;
    dims.forEach((d, i) => {
      const s = weightOf(d) * (100 - d.value);
      if (s > best) { best = s; idx = i; }
    });
    return idx;
  }, [dims]);
  const lever = dims[leverIdx];
  const leverGain = Math.round((weightOf(lever) * (Math.min(100, lever.value + 15) - lever.value)) / 100);

  const headroom = Math.max(0, 100 - dims.reduce((a, d) => a + contribOf(d), 0));

  return (
    <div className="mt-6 ip-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="ip-section-label flex items-center gap-2"><Layers className="size-3.5" /> SCORE ANATOMY · WHERE THE VERDICT COMES FROM</div>
          <div className="text-lg font-bold mt-1 text-foreground">
            What your <span className={toneClass[verdict.tone]}>{score}</span> is made of.
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
            Each dimension contributes a weighted slice of your headline score. The lit blocks are what you&apos;ve earned;
            the faint remainder is unproven headroom.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] tracking-widest text-muted-foreground">HEADLINE</div>
            <div className={`font-display text-5xl leading-none tabular-nums ${toneClass[verdict.tone]}`}>{score}</div>
          </div>
          <div className="border-l border-border pl-4">
            <div className="text-[10px] tracking-widest text-muted-foreground">VERDICT</div>
            <div className={`font-display text-2xl ${toneClass[verdict.tone]}`}>{verdict.label}</div>
          </div>
        </div>
      </div>

      {/* Composition bar */}
      <div className="mx-5 mb-5">
        <div className="flex items-end justify-between mb-1.5 text-[9px] tracking-widest text-muted-foreground">
          <span>SCORE COMPOSITION</span>
          <span>OUT OF 100</span>
        </div>
        <div className="flex h-9 w-full overflow-hidden border border-border bg-surface">
          {dims.map((d) => {
            const w = contribOf(d);
            if (w <= 0) return null;
            const t = toneOf(d.value);
            return (
              <div
                key={d.k}
                title={`${d.k}: contributes ${w} of ${score} (score ${d.value}, weight ${d.weight})`}
                className="group relative h-full border-r border-background/40 last:border-r-0 transition-opacity hover:opacity-90"
                style={{ width: `${w}%`, background: toneVar[t] }}
              >
                <span className="absolute inset-0 hidden items-center justify-center font-display text-[10px] text-background sm:flex">
                  {w >= 6 ? Math.round(w) : ""}
                </span>
              </div>
            );
          })}
          {headroom > 0 && (
            <div
              title={`Unproven headroom: ${Math.round(headroom)} points still on the table`}
              className="h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,color-mix(in_oklab,var(--muted-foreground)_22%,transparent)_5px,color-mix(in_oklab,var(--muted-foreground)_22%,transparent)_10px)]"
              style={{ width: `${headroom}%` }}
            />
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {dims.map((d) => (
            <span key={d.k} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="size-2" style={{ background: toneVar[toneOf(d.value)] }} />
              {d.k} <span className="text-foreground/70 font-medium">{contribOf(d)}</span>
            </span>
          ))}
          {headroom > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="size-2 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,color-mix(in_oklab,var(--muted-foreground)_40%,transparent)_2px,color-mix(in_oklab,var(--muted-foreground)_40%,transparent)_4px)]" />
              Headroom <span className="text-foreground/70 font-medium">{Math.round(headroom)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Biggest lever */}
      <div className="mx-5 mb-4 border border-accent/40 bg-accent/5 p-3 flex items-start gap-3">
        <TrendingUp className="size-4 text-accent shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="text-[10px] tracking-widest text-accent">BIGGEST LEVER · </span>
          <span className="font-semibold">{lever.k}</span> carries {lever.weight} weight and sits at {lever.value}/100 —
          the most unproven points on the board. Closing it ~15 pts would add <span className="text-accent font-bold">≈ +{leverGain}</span> to your headline.
        </div>
      </div>

      {/* Dimension rows — read-only audited scores */}
      <div className="px-5 pb-5 space-y-2.5">
        {dims.map((d, i) => {
          const isLever = i === leverIdx;
          const t = toneOf(d.value);
          return (
            <div key={d.k} className={`border p-3 ${isLever ? "border-accent/50 bg-accent/[0.03]" : "border-border"}`}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-display text-sm truncate">{d.k}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{d.weight}</span>
                  {isLever && <span className="text-[9px] tracking-widest text-accent border border-accent/40 px-1.5 py-0.5 shrink-0">LEVER</span>}
                </div>
                <div className="flex items-baseline gap-2 shrink-0">
                  <span className={`font-display text-lg tabular-nums ${toneClass[t]}`}>{d.value}</span>
                  <span className="text-[10px] text-muted-foreground">→ +{contribOf(d)} pts</span>
                </div>
              </div>
              {/* Read-only score bar */}
              <div className="h-2 w-full bg-surface border border-border overflow-hidden" role="img" aria-label={`${d.k} scored ${d.value} of 100`}>
                <div className="h-full" style={{ width: `${d.value}%`, background: toneVar[t] }} />
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug mt-2">{d.note}</p>
            </div>
          );
        })}
      </div>

      <div className="px-5 pb-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <span className="text-[10px] tracking-widest text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="size-3 text-success" /> SCORES ARE AUDITED & EVIDENCE-ANCHORED
        </span>
        <span className="text-[10px] tracking-widest text-muted-foreground ml-auto">
          STRENGTHEN THE WEAK AXES IN THE CHAMBER
        </span>
      </div>
    </div>
  );
}
