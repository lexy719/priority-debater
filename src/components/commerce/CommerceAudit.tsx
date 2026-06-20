"use client";

/**
 * AI Commerce Audit — the second path.
 *
 * Ported from the lovable prototype (`lovable/src/routes/commerce.tsx`) into the
 * live app. The static mock is replaced by a real flow: the Hero URL field POSTs
 * to `/api/commerce/audit` and every module re-renders from the returned
 * `CommerceAuditReport`. Before a real audit runs we show `DEMO_REPORT` (the
 * exact approved numbers) behind a "DEMO" banner.
 */

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  DEMO_REPORT,
  type CommerceAuditReport,
  type Tone,
} from "@/lib/commerce/audit-scoring";
import { Panel, PaperPanel, Tag, Ticker, ScoreBar, signalVar } from "@/components/commerce/atoms";

export function CommerceAudit() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<CommerceAuditReport>(DEMO_REPORT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAudit(e?: FormEvent) {
    e?.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/commerce/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Audit failed.");
      setReport(data as CommerceAuditReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#0c0c0f] text-[#f5f4f0]">
      {report.demo && (
        <div className="border-b border-white/12 bg-[color:var(--signal-amber)]/15 px-4 py-2 text-center text-[10px] uppercase tracking-[0.25em] text-[color:var(--signal-amber)]">
          ● Demo content — run an audit on your store to see live numbers
        </div>
      )}

      <Hero
        report={report}
        url={url}
        setUrl={setUrl}
        loading={loading}
        error={error}
        onSubmit={runAudit}
      />

      <RealityStrip report={report} />

      <Ticker tone="red" items={tickerItems(report)} />

      <Module1 report={report} />
      <Module2 report={report} />
      <Module3 report={report} />
      <Module4 report={report} />
      <Module5 report={report} />
      <Module6 report={report} />
      <OffsiteSection report={report} />
      <Module7 report={report} />
      <Module8 report={report} />
      <Roadmap />

      <Footer />
    </div>
  );
}

function tickerItems(r: CommerceAuditReport): string[] {
  const sub = (id: string) => r.subScores.find((s) => s.id === id)?.value ?? 0;
  return [
    `AI VISIBILITY ${r.overall}/100`,
    `AGENT READINESS ${sub("agent")}`,
    `GEO SCORE ${sub("geo")}`,
    `AI RECOMMENDATION ${sub("ai_rec")}`,
    `RANK ${r.rankLabel}`,
    `VERDICT ${r.verdict.toUpperCase()}`,
    `SCHEMA ${sub("schema")}`,
  ];
}

/* ---------------- hero ---------------- */

function Hero({
  report,
  url,
  setUrl,
  loading,
  error,
  onSubmit,
}: {
  report: CommerceAuditReport;
  url: string;
  setUrl: (v: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e?: FormEvent) => void;
}) {
  const delta = report.overall - report.categoryMedian;
  return (
    <section id="audit" className="relative overflow-hidden border-b border-white/12">
      <div className="absolute inset-0 bg-grid-dark opacity-60" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-white/55">
              <span className="bg-[color:var(--signal-red)] px-1.5 py-0.5 text-white">● Audit ready</span>
              <span>02 / commerce / agentic visibility report</span>
            </div>
            <h1 className="font-display text-5xl leading-[0.9] sm:text-7xl md:text-8xl">
              <span className="block">YOUR STORE IS</span>
              <span className="block">
                <span className="highlight-red">INVISIBLE</span> TO AI.
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-sm leading-relaxed text-white/55">
              Eight modules. One agent-grade report. We score how ChatGPT, Claude, and Gemini see
              your catalog, simulate how buyer-agents shop it, and ship the fixes that close the gap
              with the competitor they keep recommending instead of you.
            </p>

            <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 items-center border border-white/15 bg-[#141417]">
                <span className="px-3 text-[11px] uppercase tracking-[0.2em] text-white/55">URL</span>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-store.com"
                  className="flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/35"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 bg-[color:var(--signal-red)] px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-white transition-opacity disabled:opacity-60"
              >
                {loading ? "Asking the AI…" : "Run AI audit →"}
              </button>
            </form>
            {error && (
              <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[color:var(--signal-red)]">
                {error}
              </p>
            )}
            {!report.demo && (
              <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-white/45">
                Report for <span className="text-white">{report.storeName}</span>
                {!report.reachable && " — couldn't reach the site, showing a simulated preview"}
              </p>
            )}

            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/12 pt-6 text-[11px] uppercase tracking-[0.2em]">
              <div>
                <div className="text-white/55">Verdict</div>
                <div className="mt-1" style={{ color: signalVar(report.verdictTone) }}>
                  ▲ {report.verdict}
                </div>
              </div>
              <div>
                <div className="text-white/55">Confidence</div>
                <div className="mt-1 text-white">{report.confidence.toUpperCase()}</div>
              </div>
              <div>
                <div className="text-white/55">Rank</div>
                <div className="mt-1 text-white">{report.rankLabel}</div>
              </div>
            </div>
          </div>

          {/* score card */}
          <Panel label="Overall AI commerce score">
            <div className="flex items-baseline gap-4">
              <div className="font-display text-7xl text-[color:var(--signal-blue)] sm:text-8xl">
                {report.overall}
              </div>
              <div className="text-sm text-white/55">/ 100</div>
            </div>
            <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/55">
              {delta >= 0 ? "+" : "−"}
              {Math.abs(delta)} vs category median ({report.categoryMedian})
            </div>

            <div className="mt-8 space-y-4">
              {report.subScores.map((s) => (
                <ScoreBar key={s.id} label={s.label} value={s.value} tone={s.tone} />
              ))}
            </div>

            <div className="mt-6 grid grid-cols-4 gap-2 text-center text-[10px] uppercase tracking-[0.18em] text-white/55">
              {report.stages.map((s) => (
                <div
                  key={s.label}
                  className={`border border-white/12 py-2 ${s.reached ? "bg-[color:var(--signal-blue)]/15" : ""}`}
                >
                  {s.label}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

/* ---------------- reality-check strip ---------------- */

function RealityStrip({ report }: { report: CommerceAuditReport }) {
  const bt = report.buyerTest;
  const live = report.buyerTestLive;
  const headline = live
    ? `You appeared in ${bt.mentionedRuns} of ${bt.totalRuns} AI buyer answers`
    : "Run a live audit to see who AI recommends";
  return (
    <section className="border-b border-white/12 bg-[#141417]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-8">
        <div className="flex items-center gap-4">
          <span
            className="font-display text-4xl sm:text-5xl"
            style={{ color: live && bt.mentionRate >= 40 ? "var(--signal-green)" : "var(--signal-red)" }}
          >
            {live ? `${bt.mentionRate}%` : "—"}
          </span>
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/55">Live AI buyer test</div>
            <div className="font-display text-xl text-white sm:text-2xl">{headline}</div>
          </div>
        </div>
        <a
          href="#simulation"
          className="inline-flex items-center gap-2 border border-white/20 px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] text-white/80 hover:border-white/50 hover:text-white"
        >
          See the transcripts ↓
        </a>
      </div>
    </section>
  );
}

/* ---------------- MODULE 1 — Audit ---------------- */

function Module1({ report }: { report: CommerceAuditReport }) {
  return (
    <PaperPanel
      label="Module 01 / AI Visibility Audit"
      index="01 / 08"
      title={<>HOW THE MODELS <span className="highlight-red">SEE YOUR STORE.</span></>}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {report.subScores.slice(0, 3).map((s) => (
          <div key={s.id} className="border border-[color:var(--paper-foreground)]/15 bg-white/60 p-6">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--paper-foreground)]/60">
              {s.label}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-6xl text-[color:var(--paper-foreground)]">{s.value}</span>
              <span className="text-sm text-[color:var(--paper-foreground)]/60">/100</span>
            </div>
            <div className="mt-4 h-1 w-full bg-[color:var(--paper-foreground)]/10">
              <div className="h-full" style={{ width: `${s.value}%`, backgroundColor: signalVar(s.tone) }} />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[color:var(--paper-foreground)]/70">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 border border-[color:var(--paper-foreground)]/15 bg-white/60">
        <div className="flex items-center justify-between border-b border-[color:var(--paper-foreground)]/15 px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-[color:var(--paper-foreground)]/60">
          <span>Competitor analysis</span>
          <span>{report.competitors.length} stores ranked</span>
        </div>
        <div className="divide-y divide-[color:var(--paper-foreground)]/10 text-sm">
          {report.competitors.map((c) => (
            <div
              key={c.name}
              className={`grid grid-cols-[1fr_auto_2fr_auto] items-center gap-4 px-5 py-3 ${
                c.you ? "bg-[color:var(--signal-red)]/10" : ""
              }`}
            >
              <div className="font-medium">{c.name}</div>
              <div className="font-display text-2xl">{c.score}</div>
              <div className="text-xs text-[color:var(--paper-foreground)]/70">{c.why}</div>
              <div className="h-1 w-24 bg-[color:var(--paper-foreground)]/10">
                <div className="h-full bg-[color:var(--signal-blue)]" style={{ width: `${c.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PaperPanel>
  );
}

/* ---------------- MODULE 2 — Monitor ---------------- */

function Module2({ report }: { report: CommerceAuditReport }) {
  const trend = report.trend;
  const max = Math.max(80, ...trend.map((t) => t.v));
  const cur = trend[trend.length - 1]?.v ?? 0;
  const last = trend[trend.length - 2]?.v ?? cur;
  const baseline = trend[0]?.v ?? cur;
  return (
    <section className="border-b border-white/12 bg-[#0c0c0f]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-6 text-[10px] uppercase tracking-[0.22em] text-white/55">
          <span>— Module 02 / AI Visibility Monitor</span>
          <span>02 / 08</span>
        </div>
        <h2 className="font-display text-4xl leading-[0.95] text-white sm:text-6xl md:text-7xl">
          TRACK THE NUMBER <span className="highlight-red">EVERY MONTH.</span>
        </h2>
        <p className="mt-4 max-w-xl text-sm text-white/55">
          Projected trajectory — monitoring starts logging your real score from this audit forward,
          so you can watch the fixes move the number.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
          <Panel label="Visibility trend">
            <div className="flex items-baseline gap-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/55">This month</div>
              <div className="font-display text-6xl text-[color:var(--signal-blue)]">{cur}</div>
              <div className="text-[color:var(--signal-green)] text-sm">
                {cur - last >= 0 ? "+" : ""}
                {cur - last}
              </div>
            </div>
            <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/55">
              Last month: {last} / six-month baseline: {baseline}
            </div>

            <div className="mt-6 flex h-40 items-end gap-3">
              {trend.map((m, i) => (
                <div key={m.m} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full"
                    style={{
                      height: `${(m.v / max) * 100}%`,
                      backgroundColor: i === trend.length - 1 ? "var(--signal-red)" : "var(--signal-blue)",
                      opacity: i === trend.length - 1 ? 1 : 0.55,
                    }}
                  />
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/55">{m.m}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel label="Per-model visibility">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {report.perModel.map((p) => (
                <div key={p.name} className="border border-white/12 p-4">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/55">{p.name}</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <div className="font-display text-4xl">{p.cur}</div>
                    <div className="text-[color:var(--signal-green)] text-xs">+{p.cur - p.prev}</div>
                  </div>
                  <ScoreBar label="vs last month" value={p.cur} prev={p.prev} />
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-white/12 pt-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/55">
                Competitor movement (30d)
              </div>
              <div className="mt-3 space-y-2 text-sm">
                {report.competitorMovement.map((c) => (
                  <div key={c.n} className="flex items-center justify-between border-l-2 border-white/12 pl-3">
                    <span className="text-white/55">{c.n}</span>
                    <span
                      className={
                        c.d > 0 ? "text-[color:var(--signal-red)]" : "text-[color:var(--signal-green)]"
                      }
                    >
                      {c.d > 0 ? "▲" : "▼"} {Math.abs(c.d)} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

/* ---------------- MODULE 3 — Content Optimizer (product content) ---------------- */

const GENERATORS = [
  { t: "Generate FAQ", sub: "20 questions from real buyer intent", tone: "red" as Tone },
  { t: "Generate Comparison Page", sub: "You vs top 3 competitors", tone: "blue" as Tone },
  { t: "Generate Buying Guide", sub: "Long-form, model-friendly", tone: "amber" as Tone },
  { t: "Generate Product Schema", sub: "JSON-LD per SKU", tone: "green" as Tone },
  { t: "Generate Collection Page", sub: "Hub for category intent", tone: "blue" as Tone },
  { t: "Generate Spec Sheet", sub: "Structured product attributes", tone: "red" as Tone },
];

function Module3({ report }: { report: CommerceAuditReport }) {
  const toolkitHref = report.demo
    ? "/commerce/toolkit"
    : `/commerce/toolkit?url=${encodeURIComponent(report.url)}`;
  return (
    <PaperPanel
      label="Module 03 / AI Content Optimizer"
      index="03 / 08"
      title={<>ONE CLICK. <span className="highlight-red">REAL CONTENT.</span></>}
    >
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-[color:var(--paper-foreground)]/70">
        Stop reading &quot;your FAQ is weak.&quot; Generate the actual files — schema, llms.txt, feed,
        buying guide — built from your real store, ready to paste.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GENERATORS.map((i) => (
          <Link
            key={i.t}
            href={toolkitHref}
            className="group flex flex-col items-start gap-3 border border-[color:var(--paper-foreground)]/15 bg-white/60 p-5 text-left transition hover:bg-white"
          >
            <Tag tone={i.tone}>Generate</Tag>
            <div className="font-display text-2xl text-[color:var(--paper-foreground)]">{i.t}</div>
            <div className="text-xs text-[color:var(--paper-foreground)]/70">{i.sub}</div>
            <div className="mt-auto pt-3 text-[11px] uppercase tracking-[0.22em] text-[color:var(--signal-red)]">
              ⚡ Open toolkit →
            </div>
          </Link>
        ))}
      </div>
    </PaperPanel>
  );
}

/* ---------------- MODULE 4 — Shopping Feed ---------------- */

function Module4({ report }: { report: CommerceAuditReport }) {
  return (
    <section className="border-b border-white/12 bg-[#0c0c0f]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-6 text-[10px] uppercase tracking-[0.22em] text-white/55">
          <span>— Module 04 / AI Shopping Feed</span>
          <span>04 / 08</span>
        </div>
        <h2 className="font-display text-4xl leading-[0.95] text-white sm:text-6xl md:text-7xl">
          A CATALOG <span className="highlight-red">AGENTS CAN READ.</span>
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
          <Panel label="Feed status">
            <div className="space-y-4">
              {report.feedStatus.map((r) => (
                <div key={r.l} className="flex items-center justify-between border-b border-white/12 pb-3 text-sm">
                  <div className="text-white/55 text-xs uppercase tracking-[0.18em]">{r.l}</div>
                  <Tag tone={r.tone}>{r.v}</Tag>
                </div>
              ))}
            </div>
            <button className="mt-6 w-full bg-[color:var(--signal-red)] px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-white">
              Regenerate AI feed
            </button>
          </Panel>

          <Panel label="Generated example">
            <pre className="overflow-auto bg-black/40 p-4 text-[12px] leading-relaxed text-[color:var(--signal-blue)]">
              <code>{report.feedExampleJson}</code>
            </pre>
            <div className="mt-3 text-[10px] uppercase tracking-[0.2em] text-white/55">
              Emitted at /feed.json + /llms.txt
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

/* ---------------- MODULE 5 — Competitor Intelligence ---------------- */

function Module5({ report }: { report: CommerceAuditReport }) {
  return (
    <PaperPanel
      label="Module 05 / AI Competitor Intelligence"
      index="05 / 08"
      title={<>WHY THE MODELS <span className="highlight-red">PREFER THEM.</span></>}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="border border-[color:var(--paper-foreground)]/15 bg-white/60 p-5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--paper-foreground)]/60">
            ChatGPT mention share (last 30d)
          </div>
          <div className="mt-5 space-y-4">
            {report.mentionShare.map((m) => (
              <div key={m.n}>
                <div className="flex items-baseline justify-between text-sm">
                  <span
                    className={
                      m.you ? "font-medium text-[color:var(--signal-red)]" : "text-[color:var(--paper-foreground)]"
                    }
                  >
                    {m.n}
                  </span>
                  <span className="font-display text-2xl">{m.v}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full bg-[color:var(--paper-foreground)]/10">
                  <div className="h-full" style={{ width: `${m.v}%`, backgroundColor: signalVar(m.tone) }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[color:var(--paper-foreground)]/15 bg-white/60 p-5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--paper-foreground)]/60">
            Why competitors win
          </div>
          <ul className="mt-5 divide-y divide-[color:var(--paper-foreground)]/10 text-sm">
            {report.competitorReasons.map((r) => (
              <li key={r.r} className="flex items-center justify-between py-3">
                <span>{r.r}</span>
                <Tag tone={r.weight === "high" ? "red" : r.weight === "med" ? "amber" : "neutral"}>
                  {r.weight}
                </Tag>
              </li>
            ))}
          </ul>
          <button className="mt-6 w-full border border-[color:var(--paper-foreground)]/30 px-4 py-3 text-[11px] uppercase tracking-[0.22em] hover:bg-[color:var(--paper-foreground)] hover:text-[color:var(--paper)]">
            Generate counter-content plan →
          </button>
        </div>
      </div>
    </PaperPanel>
  );
}

/* ---------------- MODULE 6 — Live AI Buyer Test ---------------- */

function LiveBadge({ live, agents }: { live: boolean; agents: string[] }) {
  if (live) {
    return (
      <span className="inline-flex items-center gap-2 border border-[color:var(--signal-green)]/40 bg-[color:var(--signal-green)]/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[color:var(--signal-green)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--signal-green)]" />
        Live — {agents.join(" · ") || "AI"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 border border-[color:var(--signal-amber)]/40 bg-[color:var(--signal-amber)]/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[color:var(--signal-amber)]">
      Simulated preview — add an AI key for a live test
    </span>
  );
}

function Module6({ report }: { report: CommerceAuditReport }) {
  const bt = report.buyerTest;
  const live = report.buyerTestLive;
  const [activeIdx, setActiveIdx] = useState(0);
  const active = bt.queries[activeIdx] ?? bt.queries[0];
  if (!active) return null;
  const youWins = active.youMentioned;
  return (
    <section id="simulation" className="border-b border-white/12 bg-[#0c0c0f]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-6 text-[10px] uppercase tracking-[0.22em] text-white/55">
          <span>— Module 06 / Live AI Buyer Test</span>
          <span>06 / 08</span>
        </div>
        <h2 className="font-display text-4xl leading-[0.95] text-white sm:text-6xl md:text-7xl">
          WE ASKED THE AI <span className="highlight-red">WHERE TO BUY.</span>
        </h2>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <LiveBadge live={live} agents={bt.agentsUsed} />
          {live && (
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/55">
              You were named in{" "}
              <span className="text-white">
                {bt.mentionedRuns}/{bt.totalRuns}
              </span>{" "}
              answers ({bt.mentionRate}%)
            </span>
          )}
        </div>
        <p className="mt-4 max-w-xl text-sm text-white/55">
          {live
            ? "Real buyer questions, replayed live through the AI assistants your customers actually use. Below is what they said, verbatim — and whether they named you."
            : "This is a simulated preview. Run an audit with an AI provider key configured to see the verbatim answers real assistants give your buyers."}
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          <div className="space-y-2">
            {bt.queries.map((q, i) => {
              const isActive = i === activeIdx;
              return (
                <button
                  key={q.query}
                  onClick={() => setActiveIdx(i)}
                  className={`flex w-full items-center gap-3 border px-3 py-3 text-left text-sm transition ${
                    isActive
                      ? "border-[color:var(--signal-red)] bg-[color:var(--signal-red)]/10"
                      : "border-white/12 bg-[#141417] hover:border-white/30"
                  }`}
                >
                  <span className="text-xl">{q.emoji}</span>
                  <span className="flex-1">
                    <span className="block text-white">{q.label}</span>
                    <span className="block truncate text-[11px] text-white/55">{q.query}</span>
                  </span>
                  <span
                    className="text-[10px]"
                    style={{ color: q.youMentioned ? "var(--signal-green)" : "var(--signal-red)" }}
                  >
                    {q.youMentioned ? "✓" : "✕"}
                  </span>
                </button>
              );
            })}
          </div>

          <Panel label={`Buyer query: ${active.label}`}>
            <div className="border-l-2 border-[color:var(--signal-blue)] pl-4 text-sm italic text-white/55">
              &quot;{active.query}&quot;
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="border border-white/12 bg-[#141417] p-4">
                <div className="text-[10px] uppercase tracking-[0.22em] text-white/55">AI&apos;s top pick</div>
                <div className="mt-2 font-display text-3xl text-white">{active.topBrand}</div>
              </div>
              <div
                className={`border p-4 ${
                  youWins
                    ? "border-[color:var(--signal-green)] bg-[color:var(--signal-green)]/10"
                    : "border-[color:var(--signal-red)] bg-[color:var(--signal-red)]/10"
                }`}
              >
                <div className="text-[10px] uppercase tracking-[0.22em] text-white/55">Your store</div>
                <div
                  className="mt-2 font-display text-3xl"
                  style={{ color: youWins ? "var(--signal-green)" : "var(--signal-red)" }}
                >
                  {youWins ? "Named ✓" : "Not named ✕"}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-white/12 pt-4 text-[11px] uppercase tracking-[0.2em] text-white/55">
              {live ? "What each AI said (verbatim)" : "Live transcript"}
            </div>
            {active.agentLines.length > 0 ? (
              <div className="mt-3 space-y-3 text-xs">
                {active.agentLines.map((line) => (
                  <div key={line.agent} className="border-l border-white/12 pl-3">
                    <div className="text-[color:var(--signal-blue)]">{line.agent}</div>
                    <div className="mt-1 leading-relaxed text-white/70">{line.snippet}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 border border-dashed border-white/15 px-4 py-6 text-center text-xs text-white/45">
                No live answer captured. Configure an AI provider key and re-run to see verbatim
                recommendations here.
              </div>
            )}
          </Panel>
        </div>

        {bt.topCompetitors.length > 0 && (
          <div className="mt-8 border border-white/12 bg-[#141417]">
            <div className="border-b border-white/12 px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-white/55">
              Who the AI recommends instead
            </div>
            <div className="divide-y divide-white/10">
              {bt.topCompetitors.map((c) => (
                <div key={c.name} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-white">{c.name}</span>
                  <span className="text-white/55">
                    {c.count} {c.count === 1 ? "mention" : "mentions"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- MODULE 7 — Commerce Readiness ---------------- */

function Module7({ report }: { report: CommerceAuditReport }) {
  const pass = report.readiness.filter((c) => c.status === "pass").length;
  const total = report.readiness.length;
  const score = Math.round((pass / total) * 100);
  return (
    <PaperPanel
      label="Module 07 / AI Commerce Readiness"
      index="07 / 08"
      title={<>THE AGENT-CHECKOUT <span className="highlight-red">CHECKLIST.</span></>}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_2fr]">
        <div className="border border-[color:var(--paper-foreground)]/15 bg-white/60 p-6 text-center">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--paper-foreground)]/60">
            Readiness score
          </div>
          <div className="mt-4 font-display text-7xl text-[color:var(--signal-red)]">{score}</div>
          <div className="mt-1 text-sm text-[color:var(--paper-foreground)]/60">/ 100</div>
          <div className="mt-6 text-xs text-[color:var(--paper-foreground)]/70">
            {pass} of {total} checks pass. Agents will skip checkout on {total - pass} surfaces.
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {report.readiness.map((c) => {
            const tone: Tone = c.status === "pass" ? "green" : c.status === "warn" ? "amber" : "red";
            const symbol = c.status === "pass" ? "✓" : c.status === "warn" ? "~" : "✕";
            return (
              <li
                key={c.k}
                className="flex items-center justify-between border border-[color:var(--paper-foreground)]/15 bg-white/60 px-4 py-3 text-sm"
              >
                <span>{c.k}</span>
                <Tag tone={tone}>
                  {symbol} {c.status}
                </Tag>
              </li>
            );
          })}
        </ul>
      </div>
    </PaperPanel>
  );
}

/* ---------------- MODULE 8 — Fix Everything ---------------- */

function Module8({ report }: { report: CommerceAuditReport }) {
  const toolkitHref = report.demo
    ? "/commerce/toolkit"
    : `/commerce/toolkit?url=${encodeURIComponent(report.url)}`;
  return (
    <section className="border-b border-white/12 bg-[#0c0c0f]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-6 text-[10px] uppercase tracking-[0.22em] text-white/55">
          <span>— Module 08 / Fix Everything</span>
          <span>08 / 08</span>
        </div>
        <h2 className="font-display text-4xl leading-[0.95] text-white sm:text-6xl md:text-7xl">
          DON&apos;T REPORT. <span className="highlight-red">SHIP THE FIX.</span>
        </h2>
        <p className="mt-4 max-w-xl text-sm text-white/55">
          Every finding ends in a real file. The Toolkit writes the llms.txt, schema, AI-crawler
          rules, and product feed — built from your actual store. You copy, you publish, the score
          moves.
        </p>

        <div className="mt-10 overflow-hidden border border-white/12">
          <div className="grid grid-cols-[1.4fr_1.4fr_auto_auto] items-center gap-4 border-b border-white/12 bg-[#141417]/60 px-4 py-3 text-[10px] uppercase tracking-[0.22em] text-white/55">
            <span>Issue</span>
            <span>Action</span>
            <span>Impact</span>
            <span className="text-right">Fix</span>
          </div>
          {report.fixes.map((f) => (
            <div
              key={f.issue}
              className="grid grid-cols-[1.4fr_1.4fr_auto_auto] items-center gap-4 border-b border-white/12 bg-[#141417] px-4 py-4 text-sm last:border-b-0"
            >
              <span className="text-white">{f.issue}</span>
              <span className="text-white/55">→ {f.action}</span>
              <Tag tone="green">{f.impact}</Tag>
              <Link
                href={toolkitHref}
                className="justify-self-end bg-[color:var(--signal-red)] px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white"
              >
                Generate ⚡
              </Link>
            </div>
          ))}
        </div>

        <Link
          href={toolkitHref}
          className="mt-6 inline-flex items-center gap-2 border-2 border-[color:var(--signal-red)] px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-white hover:bg-[color:var(--signal-red)]"
        >
          Open the Fix Toolkit <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

/* ---------------- Off-site authority ---------------- */

function OffsiteSection({ report }: { report: CommerceAuditReport }) {
  const o = report.offsite;
  const toolkitHref = report.demo
    ? "/commerce/toolkit"
    : `/commerce/toolkit?url=${encodeURIComponent(report.url)}`;
  return (
    <section className="border-b border-white/12 bg-[#0c0c0f]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-6 text-[10px] uppercase tracking-[0.22em] text-white/55">
          <span>— Off-site authority / where AI sources its picks</span>
          <span>A / 01</span>
        </div>
        <h2 className="font-display text-4xl leading-[0.95] text-white sm:text-6xl md:text-7xl">
          AI ASKS THE INTERNET, <span className="highlight-red">NOT JUST YOU.</span>
        </h2>
        <p className="mt-4 max-w-2xl text-sm text-white/55">
          Perfect on-site schema won&apos;t win the recommendation if AI sees your rivals reviewed
          and cited everywhere and you nowhere. This is the half of the game that happens off your
          store — and it&apos;s where most small businesses are invisible.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.6fr]">
          <Panel label="Authority score">
            <div className="flex items-baseline gap-4">
              <div className="font-display text-7xl" style={{ color: signalVar(toneOf(o.score)) }}>
                {o.score}
              </div>
              <div className="text-sm text-white/55">/ 100</div>
            </div>
            <div className="mt-6 space-y-3 text-sm">
              <FactRow label="Review platform" value={o.reviewPlatform || "None detected"} good={!!o.reviewPlatform} />
              <FactRow label="Review markup" value={o.reviewsMarkedUp ? "Present" : "Missing"} good={o.reviewsMarkedUp} />
              <FactRow label="Blog / content" value={o.hasBlog ? "Found" : "None found"} good={o.hasBlog} />
              <FactRow label="Social profiles" value={String(o.socialCount)} good={o.socialCount >= 2} />
            </div>
          </Panel>

          <Panel label="Your off-site plan">
            <ul className="space-y-3">
              {o.actions.map((a) => (
                <li key={a.label} className="flex items-start gap-3 border-b border-white/10 pb-3 last:border-0">
                  <span
                    className="mt-0.5 text-sm"
                    style={{ color: a.done ? "var(--signal-green)" : "var(--signal-red)" }}
                  >
                    {a.done ? "✓" : "✕"}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm text-white">{a.label}</span>
                    <span className="block text-[11px] text-white/55">{a.hint}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href={toolkitHref}
              className="mt-6 inline-flex items-center gap-2 border-2 border-[color:var(--signal-red)] px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-white hover:bg-[color:var(--signal-red)]"
            >
              Get the outreach kit <ArrowRight className="h-4 w-4" />
            </Link>
          </Panel>
        </div>
      </div>
    </section>
  );
}

function toneOf(value: number): Tone {
  if (value < 40) return "red";
  if (value < 60) return "amber";
  if (value < 80) return "blue";
  return "green";
}

function FactRow({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-2">
      <span className="text-[11px] uppercase tracking-[0.18em] text-white/55">{label}</span>
      <span style={{ color: good ? "var(--signal-green)" : "var(--signal-amber)" }}>{value}</span>
    </div>
  );
}

/* ---------------- Roadmap ---------------- */

function Roadmap() {
  const columns = [
    {
      when: "Now",
      tone: "red" as Tone,
      blurb: "Win the recommendation layer. This is where the money is.",
      items: ["AI Visibility Audit", "Competitor Intelligence", "AI Recommendation Score", "Buyer Agent Simulation", "GEO Optimization"],
    },
    {
      when: "Later",
      tone: "amber" as Tone,
      blurb: "Make your catalog buyable by agents, not just findable.",
      items: ["AI Commerce Readiness", "Merchant Feeds", "Agent Catalogs"],
    },
    {
      when: "Much Later",
      tone: "blue" as Tone,
      blurb: "Once agents own the funnel end-to-end.",
      items: ["Autonomous Checkout", "Agent Payments"],
    },
  ];
  return (
    <section id="roadmap" className="border-b border-white/12 bg-[#0c0c0f]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-6 text-[10px] uppercase tracking-[0.22em] text-white/55">
          <span>— Roadmap / Where the money is</span>
          <span>R / 03</span>
        </div>
        <h2 className="font-display text-4xl leading-[0.95] text-white sm:text-6xl md:text-7xl">
          WIN THE <span className="highlight-red">RECOMMENDATION LAYER</span> FIRST.
        </h2>
        <p className="mt-4 max-w-2xl text-sm text-white/55">
          Agentic checkout is loud. Agentic discovery is where small businesses actually lose sales
          today — because models recommend someone else. We sequence the work accordingly.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {columns.map((col) => (
            <div
              key={col.when}
              className="flex flex-col border border-white/12 bg-[#141417]"
              style={{ borderTop: `3px solid ${signalVar(col.tone)}` }}
            >
              <div className="flex items-center justify-between border-b border-white/12 px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-white/55">
                <span style={{ color: signalVar(col.tone) }}>● {col.when}</span>
                <span className="font-mono opacity-50">//</span>
              </div>
              <div className="p-5">
                <p className="text-xs leading-relaxed text-white/55">{col.blurb}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {col.items.map((it, i) => (
                    <li key={it} className="flex items-center gap-3 border-b border-white/10 pb-2 last:border-0">
                      <span className="font-mono text-[10px]" style={{ color: signalVar(col.tone) }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-white">{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 border border-white/12 bg-[#141417] px-5 py-4 text-xs uppercase tracking-[0.2em] text-white/55">
          <span className="text-[color:var(--signal-red)]">Thesis ▸</span> The money is in helping small
          businesses win the recommendation layer — before anyone needs agentic checkout.
        </div>
      </div>
    </section>
  );
}

/* ---------------- footer ---------------- */

function Footer() {
  return (
    <>
      <section className="border-b border-white/12 bg-[#0c0c0f]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-20">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.4fr_auto]">
            <h2 className="font-display text-4xl leading-[0.95] text-white sm:text-5xl md:text-6xl">
              RE-RUN THE AUDIT WITH <span className="highlight-red">THE FIXES SHIPPED</span>
              <br />
              AND WATCH THE SCORE MOVE.
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="#audit"
                className="inline-flex items-center gap-2 bg-[color:var(--signal-red)] px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-white"
              >
                Run another audit <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
      <Ticker
        items={[
          "PRIORITY DEBATER / COMMERCE",
          "8 MODULES",
          "AGENTIC VISIBILITY",
          "AI RECOMMENDATION LAYER",
          "AUDIT · MONITOR · SIMULATE · FIX",
        ]}
      />
    </>
  );
}
