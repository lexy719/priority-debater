"use client";

/**
 * PD Commerce — "AI Visibility Ops" workspace views.
 * Query monitor, Competitor radar, Fixes library, Video studio. All driven by
 * the real CommerceReport. Trend/history is honestly labelled "baseline" because
 * weekly snapshots (Layer 2) aren't wired yet — we never fabricate movement.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Wrench } from "lucide-react";
import type { CommerceSnapshot } from "@/lib/commerce/client-store";
import type { BuyerQuery, CommerceReport } from "@/lib/commerce/types";
import { MiniSpark, ShareBars, VisibilityRadar } from "./workspace-charts";

export type WorkspaceView = "dashboard" | "queries" | "competitors" | "fixes" | "video" | "agent";

/* ───────────────────────── shared ───────────────────────── */

export function toneColor(n: number): string {
  if (n >= 70) return "var(--success)";
  if (n >= 55) return "var(--data)";
  if (n >= 40) return "var(--warn)";
  return "var(--danger)";
}

export type QStatus = "WON" | "LOST" | "MIXED";
export function queryStatus(q: BuyerQuery): QStatus {
  if (q.intent === "BRAND" && q.verdict) return q.verdict === "RECOMMENDED" ? "WON" : q.verdict === "AVOID" ? "LOST" : "MIXED";
  return q.namedYou ? "WON" : "LOST";
}
export function statusColor(s: QStatus): string {
  return s === "WON" ? "var(--success)" : s === "MIXED" ? "var(--warn)" : "var(--danger)";
}
function statusPill(s: QStatus): string {
  return s === "WON" ? "ip-pill-success" : s === "MIXED" ? "ip-pill-warn" : "ip-pill-danger";
}

/** Panel with a black title bar + cream body — the workspace's core surface. */
export function Panel({ title, aside, children, className = "" }: { title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 border border-border bg-surface ${className}`}>
      <div className="flex items-center justify-between bg-ink px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-foreground">
        <span>{title}</span>
        {aside != null && <span className="text-ink-foreground/50">{aside}</span>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/** Share-of-voice rows: competitors + the store, sorted by share desc. */
export function shareOfVoice(r: CommerceReport) {
  const total = r.shock.queriesTested || 5;
  const rows = [
    ...r.competitors.map((c) => ({ name: c.name, share: c.score, won: c.mentions, you: false })),
    { name: r.storeName, share: r.scores.ai.score, won: r.shock.timesNamed, you: true },
  ];
  return { rows: rows.sort((a, b) => b.share - a.share), total };
}

function agentHref(r: CommerceReport, extra = ""): string {
  return `/commerce/agent?reportId=${encodeURIComponent(r.shareId)}${extra}`;
}

/* ───────────────────────── §01 Query monitor ───────────────────────── */

export function QueryMonitor({ report, setView, snaps = [] }: { report: CommerceReport; setView: (v: WorkspaceView) => void; snaps?: CommerceSnapshot[] }) {
  const [filter, setFilter] = useState<"ALL" | QStatus>("ALL");
  const [sel, setSel] = useState(() => report.buyerQueries.findIndex((q) => queryStatus(q) === "WON"));
  const selected = report.buyerQueries[sel] ?? report.buyerQueries[0];

  const filtered = report.buyerQueries
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => filter === "ALL" || queryStatus(q) === filter);

  return (
    <div className="space-y-4">
      <Panel
        title="QUERIES · BASELINE"
        aside={
          <span className="flex gap-1">
            {(["ALL", "WON", "LOST", "MIXED"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-1.5 ${filter === f ? "bg-ink-foreground text-ink" : "hover:text-ink-foreground"}`}
              >
                {f}
              </button>
            ))}
          </span>
        }
      >
        <div className="divide-y divide-border">
          {filtered.map(({ q, i }) => {
            const s = queryStatus(q);
            return (
              <button key={i} onClick={() => setSel(i)} className="flex w-full items-center gap-4 py-3.5 text-left hover:bg-background">
                <span className="h-9 w-0.5 shrink-0" style={{ background: statusColor(s) }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] text-foreground">“{q.query}”</span>
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {q.intent} · <span style={{ color: statusColor(s) }}>{q.namedYou ? `named${q.yourRank ? ` #${q.yourRank}` : ""}` : s === "MIXED" ? "mixed" : "not named"}</span> · tracked today
                  </span>
                </span>
                <span className="shrink-0">
                  <MiniSpark values={snaps.map((sn) => sn.q?.[q.query]).filter((v): v is number => typeof v === "number")} />
                </span>
                <span className={`${statusPill(s)} ip-pill`}>{s}</span>
                <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
              </button>
            );
          })}
          {filtered.length === 0 && <p className="py-6 text-center text-[13px] text-muted-foreground">No {filter.toLowerCase()} queries.</p>}
        </div>
      </Panel>

      {selected && (
        <Panel title={`SELECTED · ${selected.query.slice(0, 48)}`} aside={`${selected.competitors.length} co-mentions`}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="NAMED YOU" value={selected.namedYou ? "YES" : "NO"} color={selected.namedYou ? "var(--success)" : "var(--danger)"} />
            <Stat label="YOUR POSITION" value={selected.yourRank ? `#${selected.yourRank}` : "—"} />
            <Stat label="CO-MENTIONS" value={selected.competitors.slice(0, 3).map((c) => c.name).join(" · ") || "—"} small />
          </div>
          {selected.reasoning && (
            <div className="mt-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">LATEST ANSWER · CHATGPT</div>
              <p className="mt-2 border-l-2 border-data pl-3 text-[14px] italic leading-relaxed text-foreground/80">“{selected.reasoning}”</p>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => setView("video")} className="bg-signal-blue px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-white hover:opacity-90">
              Turn into video →
            </button>
            <Link href={agentHref(report, `&ask=${encodeURIComponent(`Help me win the query "${selected.query}"`)}`)} className="border border-border px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] hover:bg-ink hover:text-ink-foreground">
              Open in agent
            </Link>
          </div>
        </Panel>
      )}
    </div>
  );
}

function Stat({ label, value, color, small }: { label: string; value: string; color?: string; small?: boolean }) {
  return (
    <div className="border border-border bg-background p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display ${small ? "text-base" : "text-3xl"} tabular-nums`} style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}

/* ───────────────────────── §02 Competitor radar ───────────────────────── */

export function CompetitorRadar({ report, snaps = [] }: { report: CommerceReport; snaps?: CommerceSnapshot[] }) {
  const { rows, total } = shareOfVoice(report);
  const lost = report.buyerQueries.filter((q) => queryStatus(q) === "LOST");
  const prev = snaps.length >= 2 ? snaps[snaps.length - 2] : null;
  const prevShare = (r: { name: string; you: boolean }) => (r.you ? prev?.ai : prev?.comp[r.name]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="SHARE OF AI VOICE" aside={`across ${total} queries · 1 model`}>
          <ShareBars rows={rows} />
        </Panel>
        <Panel title="VISIBILITY SHAPE" aside="where AI can / can't see you">
          <VisibilityRadar report={report} />
        </Panel>
      </div>

      <Panel title="TRACKED RIVALS" aside={`${report.competitors.length} rivals`}>
        <table className="w-full text-left">
          <thead>
            <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <th className="pb-2 font-normal">Brand</th>
              <th className="pb-2 text-right font-normal">Share</th>
              <th className="pb-2 text-right font-normal">Won queries</th>
              <th className="pb-2 text-right font-normal">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r, i) => {
              const ps = prevShare(r);
              const d = ps != null ? r.share - ps : null;
              return (
                <tr key={i} className={r.you ? "bg-danger/5" : ""}>
                  <td className="py-3 text-[14px]" style={r.you ? { color: "var(--danger)" } : undefined}>
                    {r.name}{r.you && <span className="ml-1 font-mono text-[10px] text-muted-foreground">(you)</span>}
                  </td>
                  <td className="py-3 text-right font-mono tabular-nums">{r.share}</td>
                  <td className="py-3 text-right font-mono tabular-nums text-muted-foreground">{r.won}/{total}</td>
                  <td className="py-3 text-right font-mono text-[11px]">
                    {d == null || d === 0 ? (
                      <span className="text-muted-foreground">— flat</span>
                    ) : (
                      <span style={{ color: d > 0 ? "var(--success)" : "var(--danger)" }}>{d > 0 ? "↗ gaining" : "↘ losing"} {d > 0 ? "+" : ""}{d}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      {lost.length > 0 && (
        <Panel title="WHERE THEY BEAT YOU">
          <div className="grid gap-3 sm:grid-cols-2">
            {lost.map((q, i) => (
              <div key={i} className="border border-border bg-background p-4">
                <span className="ip-pill ip-pill-danger">LOST</span>
                <p className="mt-2 text-[14px] text-foreground">“{q.query}”</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  Won by {q.competitors[0]?.name ?? report.topCompetitor ?? "a rival"} · named ahead of you
                </p>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ───────────────────────── §06 Fixes library ───────────────────────── */

export function FixesLibrary({ report }: { report: CommerceReport }) {
  const totalLift = report.fixes.reduce((s, f) => s + f.impactPts, 0);
  const tagFor = (channel: string) => (channel === "AI" || channel === "CONTENT" ? "CONTENT" : channel === "GOOGLE" ? "TECHNICAL" : channel === "AGENT" ? "TECHNICAL" : "SCHEMA");

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        {report.fixes.map((f, i) => (
          <div key={f.id} className="border border-border bg-surface p-5" style={i === 0 ? { borderColor: "var(--warn)" } : undefined}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] tabular-nums text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className="ip-pill ip-pill-muted">{tagFor(f.channel)}</span>
                {(f.type === "buying_guide" || f.type === "comparison_page" || f.type === "faq_schema") && <span className="ip-pill ip-pill-success">AGENT-BUILDABLE</span>}
              </div>
              <div className="text-right">
                <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">LIFT</div>
                <div className="font-display text-3xl tabular-nums text-success">{f.impact.replace(/[^0-9+]/g, "") || `+${f.impactPts}`}</div>
                <div className="font-mono text-[9px] text-muted-foreground">PTS</div>
              </div>
            </div>
            <h3 className="mt-3 font-display text-2xl">{f.outcome}</h3>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">{f.explanation}</p>
            <div className="mt-4 flex items-center gap-4">
              <Link href={agentHref(report, `&fix=${encodeURIComponent(f.id)}`)} className="flex items-center gap-1.5 bg-ink px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ink-foreground hover:opacity-90">
                <Wrench className="size-3" /> Build fix
              </Link>
              <Link href={agentHref(report, `&fix=${encodeURIComponent(f.id)}`)} className="border border-border px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] hover:bg-ink hover:text-ink-foreground">Preview</Link>
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Snooze</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <Panel title="IMPACT STACK">
          <div className="space-y-3">
            {report.fixes.map((f) => (
              <div key={f.id}>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="truncate pr-2 text-foreground/80">{f.outcome}</span>
                  <span className="font-mono tabular-nums text-success">+{f.impactPts}</span>
                </div>
                <div className="mt-1 h-1.5 bg-surface-2">
                  <div className="h-full bg-success" style={{ width: `${Math.min(100, (f.impactPts / 22) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <span>Projected score</span>
            <span className="tabular-nums text-foreground">{report.scores.overall} → {Math.min(100, report.scores.overall + totalLift)}</span>
          </div>
        </Panel>
        <Panel title="HOW FIXES SHIP">
          <ol className="space-y-2.5 text-[13px] text-muted-foreground">
            {["Click Build fix", "PD Agent opens with context pre-loaded", "Approve the draft", "Copy/publish, then re-scan"].map((s, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center bg-ink font-mono text-[10px] text-ink-foreground">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  );
}

/* ───────────────────────── Video studio ───────────────────────── */

const VIDEO_CONCEPTS = (rival: string) => [
  { tag: "WINNING QUERY", name: "hook-led", angle: "Lead with the AI quote that names you" },
  { tag: "AI AGREES", name: "proof", angle: "Show the receipts — reviews + the AI answer" },
  { tag: `VS ${rival.toUpperCase()}`, name: "compare", angle: `Head-to-head against ${rival}` },
  { tag: "REAL CUSTOMERS", name: "UGC", angle: "Creator-style, phone-shot feel" },
];

export function VideoStudio({ report }: { report: CommerceReport }) {
  // BRIEF first — you write the brief, THEN generate. Videos never auto-appear.
  const [stage, setStage] = useState<"brief" | "variants" | "distribute">("brief");
  const [variant, setVariant] = useState(0);

  const win = useMemo(
    () => report.buyerQueries.find((q) => queryStatus(q) === "WON" && q.reasoning) ?? report.buyerQueries.find((q) => q.reasoning) ?? report.buyerQueries[0],
    [report],
  );
  const rival = report.topCompetitor ?? "the leader";
  const defaultGoal = `Convert AI-named visibility into short-form proof: show ${report.storeName} vs. ${rival} for ${report.category || "your category"}, with the AI quote on screen.`;

  const [source, setSource] = useState<"winning" | "product" | "scratch">("winning");
  const [goal, setGoal] = useState(defaultGoal);
  const [format, setFormat] = useState("9:16 Reel");
  const [duration, setDuration] = useState("0:15");
  const [tone, setTone] = useState("Bold / mono");
  const [count, setCount] = useState(4);

  function pickSource(id: "winning" | "product" | "scratch") {
    setSource(id);
    if (id === "winning") setGoal(defaultGoal);
    else if (id === "scratch") setGoal("");
  }

  const credits = count * 2;
  const renderSecs = count * 11;
  const aspectClass = format.startsWith("1:1") ? "aspect-square" : format.startsWith("16:9") ? "aspect-video" : "aspect-[9/16]";
  const fmtShort = format.split(" ")[0];
  const concepts = VIDEO_CONCEPTS(rival);
  const displayVariants = Array.from({ length: Math.max(1, Math.min(8, count)) }, (_, i) => concepts[i % concepts.length]);
  const sel = displayVariants[Math.min(variant, displayVariants.length - 1)];

  const script = win
    ? `[0:00] HOOK · on-screen quote\n> "${(win.reasoning || "").slice(0, 90)}…" — ChatGPT\n\n[0:03] PROOF · split-screen\n${report.storeName} ${report.category} | ${rival}\n\n[0:08] PAYOFF · UGC clip\nReal customer using the product. Caption: "AI agrees."\n\n[${duration.replace(":", ":")}] CTA · logo lockup + url\n${report.url.replace(/^https?:\/\//, "")}`
    : "Run a scan with a winning query to auto-draft a script.";

  const SOURCES: { id: "winning" | "product" | "scratch"; title: string; sub: string }[] = [
    { id: "winning", title: "A winning query", sub: "Pulled from report" },
    { id: "product", title: "A product", sub: "From your catalog" },
    { id: "scratch", title: "Scratch", sub: "Empty brief" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 border border-border bg-surface p-1 font-mono text-[10px] uppercase tracking-[0.14em]">
          {(["brief", "variants", "distribute"] as const).map((s, i) => (
            <button key={s} onClick={() => setStage(s)} className={`px-3 py-1.5 ${stage === s ? "bg-ink text-ink-foreground" : "text-muted-foreground"}`}>
              C{i + 1} · {s}
            </button>
          ))}
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">scripts pulled from your winning queries</span>
      </div>

      {/* ── C1 · BRIEF (default) ── */}
      {stage === "brief" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 space-y-4">
            <Panel title="START FROM">
              <div className="grid gap-3 sm:grid-cols-3">
                {SOURCES.map((s) => {
                  const on = source === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => pickSource(s.id)}
                      className={`border p-4 text-left transition-colors ${on ? "border-ink bg-ink text-ink-foreground" : "border-border bg-background hover:border-ink"}`}
                    >
                      <div className="font-mono text-[13px] font-bold">{s.title}</div>
                      <div className={`mt-1 font-mono text-[9px] uppercase tracking-[0.14em] ${on ? "text-ink-foreground/55" : "text-muted-foreground"}`}>{s.sub}</div>
                    </button>
                  );
                })}
              </div>

              {source === "winning" && win && (
                <div className="ip-card-success mt-4 p-4">
                  <span className="ip-pill ip-pill-success">Pulled from report</span>
                  <p className="mt-2 font-mono text-[14px] font-bold text-foreground">
                    “{win.query}” · <span className="text-success">{win.yourRank ? `named #${win.yourRank}` : "recommended"}</span>
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">Named by ChatGPT in your live buyer test{report.live ? "" : " (simulated)"}</p>
                </div>
              )}
              {source === "product" && (
                <p className="mt-4 border border-dashed border-border p-4 font-mono text-[12px] text-muted-foreground">Connect Shopify to pick a product from your catalog — coming soon.</p>
              )}
            </Panel>

            <Panel title="CAMPAIGN GOAL">
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
                placeholder="Describe the campaign…"
                className="w-full resize-none border border-border bg-background p-3 font-mono text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-data focus:outline-none"
              />
              <div className="mt-4 grid gap-3 border border-dashed border-border p-4 sm:grid-cols-4">
                <Field label="Format" value={format} onChange={setFormat} options={["9:16 Reel", "1:1 Square", "16:9 Wide"]} />
                <Field label="Duration" value={duration} onChange={setDuration} options={["0:15", "0:30", "0:45"]} />
                <Field label="Tone" value={tone} onChange={setTone} options={["Bold / mono", "Friendly", "Premium"]} />
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Variants</div>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={count}
                    onChange={(e) => setCount(Math.max(1, Math.min(8, Number(e.target.value) || 1)))}
                    className="mt-1 h-10 w-full border border-border bg-background px-2 font-mono text-[13px] text-foreground focus:border-data focus:outline-none"
                  />
                </div>
              </div>
            </Panel>

            <button
              onClick={() => { setVariant(0); setStage("variants"); }}
              disabled={!goal.trim()}
              className="w-full bg-signal-blue py-4 font-mono text-[13px] font-bold uppercase tracking-[0.12em] text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              ✦ Generate {count} video{count === 1 ? "" : "s"} →
            </button>
          </div>

          <div className="space-y-4">
            <Panel title="WHY THIS WORKS">
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                PD already knows what AI says about you. The studio writes scripts from your <strong className="text-foreground">real winning queries</strong> — not generic prompts.
              </p>
              <ol className="mt-4 space-y-2 text-[13px]">
                {["Use a real AI quote as the hook", "Layer side-by-side proof vs. rival", "Drive social signal → higher AI visibility"].map((t, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="font-mono font-bold text-data">{i + 1}.</span>
                    <span className="text-foreground/80">{t}</span>
                  </li>
                ))}
              </ol>
            </Panel>
            <Panel title="ESTIMATED COST">
              <CostRow label={`${count} videos`} value={`~0:${String(renderSecs).padStart(2, "0")} to render`} />
              <CostRow label="Credits" value={`${credits} credits`} />
              <CostRow label="Predicted lift" value="+6 visibility pts" />
            </Panel>
          </div>
        </div>
      )}

      {/* ── C2 · VARIANTS ── */}
      {stage === "variants" && (
        <>
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <span>{count} variant{count === 1 ? "" : "s"} · {tone}</span>
            <button onClick={() => setStage("brief")} className="hover:text-foreground">← back to brief</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {displayVariants.map((v, i) => (
              <button
                key={i}
                onClick={() => setVariant(i)}
                className={`flex ${aspectClass} flex-col justify-between border bg-ink p-3 text-left text-ink-foreground ${variant === i ? "border-data" : "border-border"}`}
                style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 8px, transparent 8px 16px)" }}
              >
                <span className="self-start bg-signal-blue px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-paper">{v.tag}</span>
                <span>
                  <span className="block font-mono text-[12px] font-bold uppercase">V{i + 1} · {v.name}</span>
                  <span className="block font-mono text-[10px] text-ink-foreground/50">{duration} · {fmtShort}</span>
                </span>
              </button>
            ))}
          </div>

          <Panel title={`SELECTED · V${variant + 1} ${sel.name}`} aside="render: connect a video key (coming soon)">
            <p className="mb-3 text-[13px] text-muted-foreground">{sel.angle}.</p>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap border-l-2 border-data bg-background px-4 py-3 font-mono text-[12px] leading-relaxed text-foreground">{script}</pre>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={agentHref(report, `&ask=${encodeURIComponent(`Write a ${sel.name} short-form video ad script for me`)}`)} className="bg-ink px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ink-foreground hover:opacity-90">
                Generate full script in agent →
              </Link>
              <button onClick={() => setStage("distribute")} className="border border-border px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] hover:bg-ink hover:text-ink-foreground">Continue to distribute →</button>
            </div>
          </Panel>
        </>
      )}

      {/* ── C3 · DISTRIBUTE ── */}
      {stage === "distribute" && (
        <Panel title="C3 · DISTRIBUTE" aside="auto-posting coming soon">
          <p className="max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            Connect your socials and PD will schedule and post these variants for you — TikTok, Instagram Reels, YouTube
            Shorts — then track which one wins back AI visibility.
          </p>
          <div className="mt-5 border border-data/50 p-5 text-center">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-data">◉ CONNECT YOUR SOCIALS TO AUTO-POST</div>
            <button disabled className="mt-3 inline-flex cursor-not-allowed items-center gap-2 border border-border px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Connect socials → (coming soon)
            </button>
          </div>
        </Panel>
      )}
    </div>
  );
}

function Field({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-10 w-full border border-border bg-background px-2 font-mono text-[13px] text-foreground focus:border-data focus:outline-none">
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function CostRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 last:border-0">
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      <span className="font-mono text-[13px] text-foreground">{value}</span>
    </div>
  );
}
