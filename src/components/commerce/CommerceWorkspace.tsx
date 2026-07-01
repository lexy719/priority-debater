"use client";

/**
 * PD Commerce report — built on the idea-validator results layout (ResultsChamber)
 * for 1:1 visual cohesion: SiteNav TopBar → scrolling ticker → score Hero →
 * sticky §NN tab-pills → stacked sections → "next move" band, all on the cream
 * chamber surface. Reuses the workspace view components + recharts + the embedded
 * co-founder agent. Trend/deltas come from the local snapshot history.
 */

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bot, Clapperboard, LayoutGrid, RefreshCw, Search, Share2, Target, Wrench } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { useCreditsState } from "@/components/credits/CreditsProvider";
import { appendSnapshot, getSnapshots, saveLocalReport, type CommerceSnapshot } from "@/lib/commerce/client-store";
import type { CommerceReport } from "@/lib/commerce/types";
import { AgentChat } from "./AgentChat";
import { ChannelBars, TrendArea } from "./workspace-charts";
import { CompetitorRadar, FixesLibrary, Panel, QueryMonitor, shareOfVoice, toneColor, VideoStudio, type WorkspaceView } from "./workspace-views";

const TABS: { id: WorkspaceView; n: string; label: string; icon: typeof LayoutGrid }[] = [
  { id: "dashboard", n: "§01", label: "Overview", icon: LayoutGrid },
  { id: "queries", n: "§02", label: "Queries", icon: Search },
  { id: "competitors", n: "§03", label: "Competitors", icon: Target },
  { id: "fixes", n: "§04", label: "Fixes", icon: Wrench },
  { id: "video", n: "§05", label: "Studio", icon: Clapperboard },
  { id: "agent", n: "§06", label: "Co-founder", icon: Bot },
];

function useCountUp(target: number, ms = 1000) {
  const [v, setV] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, ms]);
  return v;
}

export function CommerceWorkspace({
  report,
  locked,
  unlocking,
  onUnlock,
}: {
  report: CommerceReport;
  locked: boolean;
  unlocking: boolean;
  onUnlock: () => void;
}) {
  const [view, setView] = useState<WorkspaceView>("dashboard");
  const [snaps, setSnaps] = useState<CommerceSnapshot[]>([]);
  const [rescanning, setRescanning] = useState(false);
  const { setBalance } = useCreditsState();

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("view") as WorkspaceView | null;
    if (v && TABS.some((t) => t.id === v)) setView(v);
  }, []);

  useEffect(() => {
    setSnaps(getSnapshots(report.url));
  }, [report.url]);

  function go(v: WorkspaceView) {
    setView(v);
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("view", v);
      window.history.replaceState({}, "", u.toString());
      window.scrollTo(0, 0);
    } catch {
      /* ignore */
    }
  }

  async function rescan() {
    if (rescanning) return;
    setRescanning(true);
    try {
      const res = await fetch("/api/commerce/rescan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: report.url }),
      });
      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(`/commerce/results?r=${report.shareId}`)}`;
        return;
      }
      if (res.status === 402) {
        window.location.href = "/credits";
        return;
      }
      const data = (await res.json()) as { report?: CommerceReport; balance?: number | null };
      if (data.report) {
        saveLocalReport(data.report);
        appendSnapshot(data.report);
        if (typeof data.balance === "number") setBalance(data.balance);
        window.location.href = `/commerce/results?r=${data.report.shareId}`;
      }
    } finally {
      setRescanning(false);
    }
  }

  return (
    <div className="chamber-scope min-h-screen bg-background text-foreground">
      {/* TopBar */}
      <SiteNav
        subtitle="PD Commerce"
        actions={
          <div className="flex items-center gap-2">
            <ShareButton report={report} />
            <button
              onClick={rescan}
              disabled={rescanning}
              className="flex items-center gap-1.5 bg-signal-blue px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <RefreshCw className={`size-3 ${rescanning ? "animate-spin" : ""}`} /> {rescanning ? "Scanning…" : "Re-scan"}
            </button>
          </div>
        }
      />

      <Ticker report={report} />
      <Hero report={report} snaps={snaps} />
      <ExecBand report={report} go={go} />
      <TabBar view={view} go={go} />

      {locked && view !== "agent" && (
        <div className="mx-auto mt-4 flex max-w-[1180px] flex-wrap items-center justify-between gap-3 border border-signal-blue bg-signal-blue/10 px-4 py-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-foreground">Free preview — unlock to save this report & track it weekly · 15 cr</span>
          <button onClick={onUnlock} disabled={unlocking} className="bg-signal-blue px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-paper disabled:opacity-60">
            {unlocking ? "Unlocking…" : "Unlock →"}
          </button>
        </div>
      )}

      {view === "agent" ? (
        <div className="mt-4">
          <AgentChat embeddedReport={report} />
        </div>
      ) : (
        <main className="mx-auto max-w-[1180px] px-4 pb-24 pt-6 md:px-8">
          {view === "dashboard" && <Overview report={report} go={go} snaps={snaps} />}
          {view === "queries" && <QueryMonitor report={report} setView={go} snaps={snaps} />}
          {view === "competitors" && <CompetitorRadar report={report} snaps={snaps} />}
          {view === "fixes" && <FixesLibrary report={report} />}
          {view === "video" && <VideoStudio report={report} />}
        </main>
      )}

      {view !== "agent" && <NextMove report={report} go={go} />}
    </div>
  );
}

/* ───────────────────────── chrome ───────────────────────── */

function ShareButton({ report }: { report: CommerceReport }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(`${window.location.origin}/commerce/results?r=${report.shareId}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* ignore */
        }
      }}
      className="flex items-center gap-1.5 border border-white/30 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-white hover:text-black"
    >
      <Share2 className="size-3" /> {copied ? "Copied" : "Share"}
    </button>
  );
}

function Ticker({ report }: { report: CommerceReport }) {
  const items = report.buyerQueries.map((q) => ({
    tag: q.intent,
    txt: q.namedYou ? `${report.storeName} named` : `${q.competitors[0]?.name ?? "rivals"} named instead`,
    tone: q.namedYou ? "success" : "danger",
  }));
  const all = items.length ? items : [{ tag: "SCAN", txt: "AI visibility report", tone: "data" }];
  const cls = (t: string) => (t === "success" ? "border-success text-success" : t === "danger" ? "border-danger text-danger" : "border-data text-data");
  return (
    <div className="chamber-ticker overflow-hidden border-y border-ink bg-ink text-ink-foreground print:hidden">
      <div className="chamber-ticker-track flex gap-10 whitespace-nowrap py-2 text-[10px] tracking-[0.2em]">
        {[...all, ...all, ...all].map((s, i) => (
          <span key={i} className="flex items-center gap-3">
            <span className={`border px-1.5 py-0.5 ${cls(s.tone)}`}>[{s.tag}]</span>
            <span className="text-ink-foreground/80">{s.txt}</span>
            <span className="text-ink-foreground/30">//</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Hero({ report, snaps }: { report: CommerceReport; snaps: CommerceSnapshot[] }) {
  const { shock } = report;
  const overall = report.scores.overall;
  const shown = useCountUp(overall);
  const prev = snaps.length >= 2 ? snaps[snaps.length - 2] : null;
  const delta = prev ? overall - prev.overall : null;
  const ratio = shock.timesNamed > 0 ? Math.max(2, Math.round(shock.competitorTimesNamed / shock.timesNamed)) : 0;

  return (
    <section className="border-b border-ink bg-ink text-ink-foreground grid-bg-ink">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-4 py-14 md:px-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-3 text-[10px] tracking-widest text-ink-foreground/60">
            <span className="border border-data px-2 py-1 text-data">REAL BUYER TEST</span>
            <span>§01 / AI VISIBILITY REPORT</span>
            {!report.live && <span className="border border-warn px-2 py-1 text-warn">SIMULATED</span>}
          </div>
          <h1 className="text-display text-4xl text-ink-foreground md:text-6xl">
            {shock.headlineVariant === "zero" && (<>YOUR RIVALS <span className="hl-red">ANSWERED.</span> YOU DIDN'T.</>)}
            {shock.headlineVariant === "few" && (<>AI NAMED THEM <span className="hl-red">{ratio}× MORE</span> THAN YOU.</>)}
            {shock.headlineVariant === "some" && (<>YOU SHOWED UP — <span className="hl-red">SO DID {report.competitors.length} RIVALS.</span></>)}
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-ink-foreground/70">
            We asked ChatGPT five real buyer questions in your category and recorded which stores it recommended — and
            whether {report.storeName} made the list.
          </p>
          <p className="mt-4 max-w-xl border-l-2 border-data pl-3 text-xs leading-relaxed text-ink-foreground/50">
            <span className="tracking-widest text-data">STORE UNDER REVIEW · </span>
            {report.storeName}
            {report.category ? ` · ${report.category}` : ""}
            {report.country ? ` · ${report.country}` : ""}
          </p>
          <div className="mt-8 grid max-w-2xl grid-cols-3 border border-ink-foreground/25">
            <HeroStat label="QUERIES TESTED" value={String(shock.queriesTested)} />
            <HeroStat label="TIMES NAMED" value={String(shock.timesNamed)} color={shock.timesNamed === 0 ? "var(--danger)" : shock.timesNamed <= 3 ? "var(--warn)" : "var(--success)"} />
            <HeroStat label="RIVALS NAMED" value={String(shock.competitorTimesNamed)} />
          </div>
        </div>

        <div className="self-start border border-ink-foreground/25 bg-ink-foreground/5 p-6">
          <div className="mb-3 text-[10px] tracking-widest text-ink-foreground/55">AI VISIBILITY SCORE</div>
          <div className="flex items-end gap-3">
            <span className="font-display text-[5.5rem] leading-none tabular-nums sm:text-[7rem]" style={{ color: toneColor(overall) }}>{shown}</span>
            <span className="mb-4 text-xl text-ink-foreground/55">/ 100</span>
          </div>
          {delta == null ? (
            <div className="mt-1 text-xs tracking-widest text-ink-foreground/50">BASELINE · FIRST SCAN</div>
          ) : (
            <div className="mt-1 text-xs tracking-widest" style={{ color: delta >= 0 ? "var(--success)" : "var(--danger)" }}>
              {delta >= 0 ? "▲ +" : "▼ "}{delta} VS LAST SCAN
            </div>
          )}
          <div className="mt-6 space-y-3">
            {[{ k: "GOOGLE", v: report.scores.google.score }, { k: "AI", v: report.scores.ai.score }, { k: "AGENT", v: report.scores.agentReadiness.score }].map((c) => (
              <div key={c.k}>
                <div className="flex items-center justify-between text-[10px] tracking-widest text-ink-foreground/55">
                  <span>{c.k}</span>
                  <span className="tabular-nums text-ink-foreground/80">{c.v}</span>
                </div>
                <div className="mt-1 h-1.5 bg-ink-foreground/10">
                  <div className="h-full" style={{ width: `${c.v}%`, background: toneColor(c.v) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="border-r border-ink-foreground/20 p-4 last:border-r-0">
      <div className="mb-2 text-[10px] tracking-widest text-ink-foreground/55">{label}</div>
      <div className="font-display text-2xl tabular-nums" style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}

function ExecBand({ report, go }: { report: CommerceReport; go: (v: WorkspaceView) => void }) {
  const namedCount = report.buyerQueries.filter((q) => q.namedYou).length;
  const cards = [
    { k: "BUYER JOURNEYS WON", v: `${namedCount}/${report.buyerQueries.length}`, note: "Category leaders are named in 4–5 of 5.", to: "queries" as const },
    { k: "TOP RIVAL", v: report.topCompetitor ?? "—", note: "Named most often when buyers ask your category.", to: "competitors" as const },
    { k: "FIXES AVAILABLE", v: String(report.fixes.length), note: "Ranked by impact, built by your co-founder.", to: "fixes" as const },
  ];
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-4 py-12 md:px-8 lg:grid-cols-[1fr_2fr]">
        <div>
          <div className="mb-3 text-[10px] tracking-widest text-muted-foreground">— 02 / EXECUTIVE SUMMARY</div>
          <h2 className="text-display text-3xl text-foreground md:text-4xl">WHERE YOU STAND <span className="hl-red">RIGHT NOW.</span></h2>
        </div>
        <div className="grid border border-border sm:grid-cols-3">
          {cards.map((c, i) => (
            <button key={c.k} onClick={() => go(c.to)} className={`bg-surface p-5 text-left transition-colors hover:bg-background ${i < cards.length - 1 ? "border-b border-border sm:border-b-0 sm:border-r" : ""}`}>
              <div className="text-[10px] tracking-widest text-muted-foreground">{c.k}</div>
              <div className="mt-2 font-display text-xl leading-tight">{c.v}</div>
              <div className="mt-2 text-xs leading-relaxed text-muted-foreground">{c.note}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function TabBar({ view, go }: { view: WorkspaceView; go: (v: WorkspaceView) => void }) {
  return (
    <nav className="sticky top-4 z-30 mb-2 mt-6 px-4 md:px-8 print:hidden">
      <div className="mx-auto max-w-fit">
        <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-ink/40 bg-ink/95 p-1.5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-md">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = view === t.id;
            return (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${active ? "bg-ink-foreground text-ink" : "text-ink-foreground/60 hover:text-ink-foreground"}`}
              >
                <Icon className="size-3" />
                <span className="hidden sm:inline">{t.n}</span> {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function NextMove({ report, go }: { report: CommerceReport; go: (v: WorkspaceView) => void }) {
  return (
    <section className="border-y border-ink bg-ink text-ink-foreground grid-bg-ink print:hidden">
      <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-8 px-4 py-16 md:px-8 lg:flex-row lg:items-center">
        <div>
          <div className="mb-3 text-[10px] tracking-widest text-ink-foreground/55">— 07 / NEXT MOVE</div>
          <h2 className="text-display max-w-3xl text-3xl text-ink-foreground md:text-5xl">
            STOP LOSING THE ANSWER. <span className="hl-red">BUILD THE FIX WITH PD.</span>
          </h2>
        </div>
        <button
          onClick={() => go("agent")}
          className="flex items-center justify-center gap-2 bg-signal-blue px-6 py-4 font-mono text-sm font-bold uppercase tracking-widest text-paper transition-opacity hover:opacity-90"
        >
          Open your co-founder <ArrowRight className="size-4" />
        </button>
      </div>
    </section>
  );
}

/* ───────────────────────── §01 Overview ───────────────────────── */

function Overview({ report, go, snaps }: { report: CommerceReport; go: (v: WorkspaceView) => void; snaps: CommerceSnapshot[] }) {
  const { google, ai, agentReadiness } = report.scores;
  const channels = [{ k: "GOOGLE", v: google.score }, { k: "AI", v: ai.score }, { k: "AGENT", v: agentReadiness.score }];
  const weakest = [...channels].sort((a, b) => a.v - b.v)[0];
  const { rows, total } = shareOfVoice(report);
  const lostQ = report.buyerQueries.find((q) => !q.namedYou);
  const wonQ = report.buyerQueries.find((q) => q.namedYou);
  const topFix = report.fixes[0];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="VISIBILITY TREND" aside={`${snaps.length} scan${snaps.length === 1 ? "" : "s"}`}>
          {snaps.length >= 2 ? (
            <TrendArea snaps={snaps} />
          ) : (
            <div className="flex h-44 flex-col justify-center text-center">
              <span className="font-display text-4xl tabular-nums" style={{ color: toneColor(report.scores.overall) }}>{report.scores.overall}</span>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">First scan — your trend starts here</p>
              <p className="mt-1 text-[12px] text-muted-foreground">Re-scan and this chart fills in.</p>
            </div>
          )}
        </Panel>
        <Panel title="CHANNELS">
          <ChannelBars google={google.score} ai={ai.score} agent={agentReadiness.score} />
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            {weakest.k === "AGENT" ? "Agent reachability is your weak link. AI agents can't crawl your product feed." : `${weakest.k} is your weakest channel — biggest, fastest lift.`}
          </p>
          <button onClick={() => go("fixes")} className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-data hover:underline">Fix it →</button>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="WHO AI NAMES MOST" aside={`across ${total} queries`}>
          <div className="divide-y divide-border">
            {rows.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 py-2.5 ${r.you ? "bg-danger/5" : ""}`}>
                <span className="w-6 font-mono text-[11px] tabular-nums text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 truncate text-[14px]" style={r.you ? { color: "var(--danger)" } : undefined}>
                  {r.name}{r.you && <span className="ml-1 font-mono text-[10px] text-muted-foreground">(you)</span>}
                </span>
                <span className="font-mono text-[12px] tabular-nums text-muted-foreground">{r.won}/{total}</span>
                <span className="flex gap-0.5">
                  {Array.from({ length: total }).map((_, d) => (
                    <span key={d} className="size-1.5" style={{ background: d < r.won ? (r.you ? "var(--danger)" : "var(--data)") : "var(--surface-2)" }} />
                  ))}
                </span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="TODAY'S PRIORITIES">
          <div className="space-y-3">
            {topFix && <Priority tag={`FIX ${topFix.impact}`} tagCls="ip-pill-warn" title={topFix.outcome} cta="Build with PD →" onClick={() => go("agent")} />}
            {lostQ && <Priority tag="RISK" tagCls="ip-pill-danger" title={`Losing “${lostQ.query.slice(0, 44)}”`} cta="Investigate →" onClick={() => go("queries")} />}
            {wonQ && <Priority tag="WON" tagCls="ip-pill-success" title={`Turn “${wonQ.query.slice(0, 40)}” into a reel`} cta="Open studio →" onClick={() => go("video")} />}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Priority({ tag, tagCls, title, cta, onClick }: { tag: string; tagCls: string; title: string; cta: string; onClick: () => void }) {
  return (
    <div className="border border-border bg-background p-4">
      <span className={`${tagCls} ip-pill`}>{tag}</span>
      <p className="mt-2 text-[14px] leading-snug text-foreground">{title}</p>
      <button onClick={onClick} className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-data hover:underline">{cta}</button>
    </div>
  );
}
