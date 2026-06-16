"use client";

import Link from "next/link";
import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import {
  AlertTriangle, TrendingUp, Target, Users, Zap, Shield, Route as RouteIcon, CheckCircle2,
  ArrowRight, Skull, ChevronRight, Activity, DollarSign, Flame, Share2, Globe, Link2, Gavel, Download,
} from "lucide-react";
import { DEFAULT_REPORT, type Report, type Tone, type Severity, type Priority } from "@/components/chamber/report";
import ScoreAnatomy from "@/components/chamber/ScoreAnatomy";
import { SiteNav } from "@/components/SiteNav";
import { JourneyStepper } from "@/components/flow/JourneyStepper";

/* ============================= CONFIG ============================= */

const TABS = [
  { id: "overview",   n: "§01", label: "OVERVIEW",   icon: Activity },
  { id: "market",     n: "§02", label: "MARKET",     icon: TrendingUp },
  { id: "risk",       n: "§03", label: "RISK",       icon: AlertTriangle },
  { id: "competition",n: "§04", label: "COMPETITION",icon: Target },
  { id: "revenue",    n: "§05", label: "FINANCIALS", icon: DollarSign },
  { id: "roadmap",    n: "§06", label: "ROADMAP",    icon: RouteIcon },
  { id: "audience",   n: "§07", label: "PERSONAS",   icon: Users },
  { id: "actions",    n: "§08", label: "ACTIONS",    icon: Zap },
] as const;

type TabId = (typeof TABS)[number]["id"];

const COLOR = {
  accent: "#2563eb",
  accentDim: "#93c5fd",
  danger: "#e23a2e",
  warn:   "#d98a06",
  success:"#119464",
  grid:   "#2563eb1f",
  text:   "#1e1b2e",
  muted:  "#6b6580",
};

/* ============================= SCORECARD EXPORT ============================= */

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

const VAR_HEX: Record<string, string> = { success: "#119464", accent: "#2563eb", warn: "#d98a06", danger: "#e23a2e" };

/** Render a 1200×675 share scorecard (SVG → PNG, offline) and download it. */
function downloadScorecard(report: Report) {
  const s = report.score;
  const tone = s.value >= 70 ? "success" : s.value >= 55 ? "accent" : s.value >= 40 ? "warn" : "danger";
  const color = VAR_HEX[tone];
  const idea = report.meta.idea.replace(/^"|"$/g, "");
  const ideaClip = idea.length > 96 ? idea.slice(0, 93) + "…" : idea;
  const top = [...report.overview.dims].sort((a, b) => b.value - a.value).slice(0, 6);
  const rows = top.map((d, i) => {
    const y = 320 + i * 56;
    const c = d.value >= 70 ? VAR_HEX.success : d.value >= 55 ? VAR_HEX.accent : d.value >= 40 ? VAR_HEX.warn : VAR_HEX.danger;
    return `
      <text x="80" y="${y}" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#f5f4f0">${escapeXml(d.k)}</text>
      <rect x="640" y="${y - 16}" width="320" height="10" rx="5" fill="#2a2833"/>
      <rect x="640" y="${y - 16}" width="${Math.round((d.value / 100) * 320)}" height="10" rx="5" fill="${c}"/>
      <text x="990" y="${y}" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="${c}">${d.value}</text>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
    <rect width="1200" height="675" fill="#14121c"/>
    <rect width="1200" height="6" fill="${color}"/>
    <text x="80" y="84" font-family="Arial, sans-serif" font-size="16" letter-spacing="4" fill="#8a8a92">PRIORITY DEBATER · VALIDATION REPORT</text>
    <text x="80" y="150" font-family="Arial, sans-serif" font-size="40" font-weight="800" fill="#f5f4f0">${escapeXml(s.verdict)}</text>
    <text x="80" y="200" font-family="Arial, sans-serif" font-size="22" fill="#c7c7cf">${escapeXml(ideaClip)}</text>
    <text x="1050" y="150" font-family="Arial, sans-serif" font-size="150" font-weight="800" fill="${color}" text-anchor="middle">${s.value}</text>
    <text x="1050" y="186" font-family="Arial, sans-serif" font-size="20" fill="#8a8a92" text-anchor="middle">/ 100 · ${escapeXml(String(s.confidence))} CONF</text>
    <line x1="80" y1="250" x2="1120" y2="250" stroke="#2a2833" stroke-width="2"/>
    <text x="80" y="290" font-family="Arial, sans-serif" font-size="15" letter-spacing="3" fill="#8a8a92">RUBRIC DIMENSIONS</text>
    ${rows}
    <text x="80" y="650" font-family="Arial, sans-serif" font-size="16" fill="#8a8a92">${s.webSearchUsed ? "WEB-ENRICHED · AUDITED SCORE" : "AUDITED SCORE"}${s.fromDebate ? " · DEBATE-TESTED" : ""}</text>
    <text x="1120" y="650" font-family="Arial, sans-serif" font-size="16" fill="#8a8a92" text-anchor="end">prioritydebater.app</text>
  </svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200; canvas.height = 675;
    canvas.getContext("2d")!.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob((png) => {
      if (!png) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(png);
      a.download = `validation-scorecard-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}

/* ============================= PAGE ============================= */

export default function ResultsChamber({
  report: initialReport = DEFAULT_REPORT, shareId,
}: { report?: Report; shareId?: string; idea?: string; position?: string; context?: string }) {
  const [tab, setTab] = useState<TabId>("overview");
  const report = initialReport;

  return (
    <div className="chamber-scope min-h-screen bg-background text-foreground">
      <TopBar shareId={shareId} report={report} />
      <Ticker items={report.ticker} />
      <Hero report={report} />
      <ExecSummaryBand data={report.execSummary} />
      <TabBar tab={tab} setTab={setTab} />
      <main className="mx-auto max-w-[1480px] px-4 md:px-8 pb-32">
        {tab === "overview"    && <Overview data={report.overview} score={report.score.value} scoreMeta={report.score} report={report} />}
        {tab === "market"      && <Market data={report.market} />}
        {tab === "risk"        && <Risk data={report.risk} />}
        {tab === "competition" && <Competition data={report.competition} />}
        {tab === "revenue"     && <Financials data={report.financials} />}
        {tab === "roadmap"     && <Roadmap data={report.roadmap} />}
        {tab === "audience"    && <Audience data={report.audience} />}
        {tab === "actions"     && <Actions data={report.actions} />}
      </main>
      <NextDebateBand data={report.nextDebate} />
      <Ticker items={report.ticker} />
    </div>
  );
}


/* ============================= LIGHT/DARK BANDS ============================= */

function ExecSummaryBand({ data }: { data: Report["execSummary"] }) {
  return (
    <section className="bg-background border-b border-border">
      <div className="mx-auto max-w-[1480px] px-4 md:px-8 py-16 grid lg:grid-cols-[1fr_2fr] gap-12">
        <div>
          <div className="text-[10px] tracking-widest text-muted-foreground mb-3">— 02 / EXECUTIVE SUMMARY</div>
          <h2 className="text-display text-4xl md:text-5xl text-foreground">
            {data.headlineHead}{" "}
            <span className="hl-red">{data.headlineHl}</span> {data.headlineTail}
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 border border-border">
          {data.cards.map((c, i) => (
            <div key={c.k} className={`bg-surface p-5 ${i < data.cards.length - 1 ? "border-r border-border" : ""}`}>
              <div className="text-[10px] tracking-widest text-muted-foreground">{c.k}</div>
              <div className="font-display text-2xl mt-2">{c.v}</div>
              <div className="text-xs text-muted-foreground mt-2 leading-relaxed">{c.note}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NextDebateBand({ data }: { data: Report["nextDebate"] }) {
  return (
    <section className="bg-ink text-ink-foreground border-y border-ink grid-bg-ink">
      <div className="mx-auto max-w-[1480px] px-4 md:px-8 py-20 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div>
          <div className="text-[10px] tracking-widest text-ink-foreground/55 mb-3">— 09 / NEXT MOVE</div>
          <h2 className="text-display text-3xl md:text-5xl text-ink-foreground max-w-3xl">
            {data.headlineHead}{" "}
            <span className="hl-red">{data.headlineHl}</span>{" "}
            {data.headlineTail}
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto print:hidden">
          <Link href="/debate" className="px-6 py-4 bg-accent text-accent-foreground font-display text-sm tracking-widest hover:opacity-90 flex items-center justify-center gap-2">
            {data.primaryCta} <ArrowRight className="size-4" />
          </Link>
          <button onClick={() => window.print()} className="px-6 py-4 border border-ink-foreground/40 text-ink-foreground font-display text-sm tracking-widest hover:bg-ink-foreground/5">
            {data.secondaryCta}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ============================= CHROME ============================= */

function Ticker({ items }: { items: Report["ticker"] }) {
  const toneCls = (t: string) =>
    t === "accent" ? "border-accent text-accent" :
    t === "warn"   ? "border-warn text-warn" :
    t === "success"? "border-success text-success" :
                     "border-data text-data";
  return (
    <div className="chamber-ticker bg-ink text-ink-foreground border-y border-ink overflow-hidden print:hidden">
      <div className="chamber-ticker-track flex gap-10 py-2 text-[10px] tracking-[0.2em] whitespace-nowrap">
        {[...items, ...items, ...items].map((s, i) => (
          <span key={i} className="flex items-center gap-3">
            <span className={`px-1.5 py-0.5 border ${toneCls(s.tone)}`}>[{s.tag}]</span>
            <span className="text-ink-foreground/80">{s.txt}</span>
            <span className="text-ink-foreground/30">//</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function TopBar({ shareId, report }: { shareId?: string; report: Report }) {
  const [copied, setCopied] = useState(false);
  const onShare = async () => {
    if (!shareId) return;
    const url = `${window.location.origin}/results?r=${shareId}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  const onDownloadCard = () => downloadScorecard(report);
  return (
    <div className="print:hidden">
      <SiteNav
        subtitle={report.meta.version}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={onDownloadCard} className="hidden sm:flex items-center gap-1.5 border border-white/30 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white hover:bg-white hover:text-black transition-colors">
              <Download className="size-3" /> Scorecard
            </button>
            {shareId && (
              <button onClick={onShare} className="flex items-center gap-1.5 border border-white/30 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white hover:bg-white hover:text-black transition-colors">
                <Share2 className="size-3" /> {copied ? "Copied" : "Share"}
              </button>
            )}
            <Link href="/#validate" className="bg-[#ff3b30] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white hover:bg-white hover:text-black transition-colors">
              + Re-run
            </Link>
          </div>
        }
      />
      <JourneyStepper current="results" />
    </div>
  );
}

function Hero({ report }: { report: Report }) {
  const { meta, score, hero } = report;
  return (
    <section className="relative bg-ink text-ink-foreground border-y border-ink grid-bg-ink">
      <div className="mx-auto max-w-[1480px] px-4 md:px-8 py-16 grid lg:grid-cols-[1.4fr_1fr] gap-12">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-6 text-[10px] tracking-widest text-ink-foreground/60">
            <span className="px-2 py-1 border border-success text-success">{meta.stressTestLabel}</span>
            <span>§01 / VALIDATION REPORT</span>
            <span>{meta.submittedAt}</span>
          </div>
          <h1 className="text-display text-4xl md:text-6xl lg:text-7xl text-ink-foreground">
            {hero.titleHead}{" "}
            <span className="hl-red">{hero.titleHl}</span>
          </h1>
          <p className="mt-8 max-w-xl text-sm text-ink-foreground/70 leading-relaxed">{hero.intro}</p>
          <p className="mt-4 max-w-xl text-xs text-ink-foreground/50 leading-relaxed border-l-2 border-data pl-3">
            <span className="text-data tracking-widest">IDEA UNDER REVIEW · </span>{meta.idea}
          </p>
          <div className="mt-8 grid grid-cols-3 max-w-2xl border border-ink-foreground/25">
            <Stat label="VERDICT"    value={score.verdict}    tone="warn" dark />
            <Stat label="CONFIDENCE" value={score.confidence} dark />
            <Stat label="RANK"       value={score.rank}       sub={score.rankSub} dark />
          </div>
        </div>
        <ScoreBig score={score} />
      </div>
    </section>
  );
}

function Stat({ label, value, sub, tone, dark }: { label: string; value: string; sub?: string; tone?: Tone; dark?: boolean }) {
  const color = tone === "warn" ? "text-warn" : tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : (dark ? "text-ink-foreground" : "text-foreground");
  const labelCls = dark ? "text-ink-foreground/55" : "text-muted-foreground";
  const subCls = dark ? "text-ink-foreground/50" : "text-muted-foreground";
  const borderCls = dark ? "border-ink-foreground/20" : "border-border";
  return (
    <div className={`p-4 border-r last:border-r-0 ${borderCls}`}>
      <div className={`text-[10px] tracking-widest mb-2 ${labelCls}`}>{label}</div>
      <div className={`font-display text-2xl ${color} flex items-center gap-2`}>
        {tone === "warn" && <AlertTriangle className="size-5" />}
        {value}
      </div>
      {sub && <div className={`text-[10px] mt-1 ${subCls}`}>{sub}</div>}
    </div>
  );
}

/** Count-up animation for the hero score. */
function useCountUp(target: number, ms = 1100) {
  const [v, setV] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(Math.round(target * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, ms]);
  return v;
}

function ScoreBig({ score }: { score: Report["score"] }) {
  const data = score.progression.map((p) => ({ s: p.stage, v: p.value }));
  const delta = score.value - score.rubricMean;
  const shown = useCountUp(score.value);
  return (
    <div className="border border-ink-foreground/25 bg-ink-foreground/5 p-6 self-start">
      <div className="text-[10px] tracking-widest text-ink-foreground/55 mb-3">OVERALL VIABILITY SCORE</div>
      <div className="flex items-end gap-4">
        <div className="font-display text-[5.5rem] sm:text-[8rem] leading-none text-data tabular-nums">{shown}</div>
        <div className="text-ink-foreground/55 mb-4 text-xl">/ 100</div>
      </div>
      <div className={`mt-2 text-xs ${delta >= 0 ? "text-success" : "text-danger"}`}>
        {delta >= 0 ? "+" : ""}{delta} vs RUBRIC MEAN ({score.rubricMean})
      </div>
      <div className="mt-6 h-24">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
            <Line type="monotone" dataKey="v" stroke="var(--data)" strokeWidth={2} dot={false} />
            <XAxis dataKey="s" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, 100]} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TabBar({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  return (
    <nav className="sticky top-4 z-30 px-4 md:px-8 mt-6 mb-2">
      <div className="mx-auto max-w-fit">
        <div className="flex items-center gap-1 rounded-full border border-ink/40 bg-ink/95 backdrop-blur-md p-1.5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.5)] overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium tracking-wide transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-b from-accent to-accent/80 text-accent-foreground shadow-[0_4px_14px_-2px] shadow-accent/50 ring-1 ring-accent/60"
                    : "text-ink-foreground/70 hover:text-ink-foreground hover:bg-white/5"
                }`}
              >
                <Icon className="size-3.5" />
                <span className="font-display tracking-wider">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/* ============================= REUSABLE ============================= */

function SectionHeader({ n, label, title, hl, body }: { n: string; label: string; title: string; hl?: string; body: string }) {
  // IdeaProof-style: centered page indicator + chip + title + body
  const num = n.replace(/[^0-9]/g, "").padStart(2, "0");
  return (
    <div className="py-10">
      <div className="text-center mb-6">
        <span className="ip-section-label tabular-nums">{num} / 08 &nbsp;·&nbsp; {label}</span>
      </div>
      <div className="ip-card p-7 md:p-9">
        <div className="flex items-start gap-4">
          <div className="ip-chip ip-chip-lg">
            <SectionIcon label={label} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {title} {hl && <span className="text-accent">{hl}</span>}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-3xl">{body}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionIcon({ label }: { label: string }) {
  const L = label.toUpperCase();
  if (L.includes("MARKET"))      return <TrendingUp className="size-5" />;
  if (L.includes("RISK") || L.includes("BREAK")) return <AlertTriangle className="size-5" />;
  if (L.includes("COMPET"))      return <Target className="size-5" />;
  if (L.includes("FINANC") || L.includes("REVENUE")) return <DollarSign className="size-5" />;
  if (L.includes("ROAD") || L.includes("EXEC")) return <RouteIcon className="size-5" />;
  if (L.includes("PERSONA") || L.includes("AUDIENCE")) return <Users className="size-5" />;
  if (L.includes("ACTION"))      return <Zap className="size-5" />;
  return <Activity className="size-5" />;
}

function Card({ children, label, sub, className = "" }: { children: React.ReactNode; label?: string; sub?: string; className?: string }) {
  return (
    <div className={`ip-card ${className}`}>
      {label && (
        <div className="px-5 pt-5 pb-3 flex items-baseline justify-between">
          <div>
            <div className="ip-section-label">{label}</div>
            {sub && <div className="text-lg font-bold mt-1 text-foreground">{sub}</div>}
          </div>
        </div>
      )}
      <div className="p-5 pt-2">{children}</div>
    </div>
  );
}

function KV({ k, v, tone }: { k: string; v: string; tone?: Tone }) {
  const c = tone === "success" ? "text-success" : tone === "warn" ? "text-warn" : tone === "danger" ? "text-danger" : "text-foreground";
  return (
    <div className="rounded-xl bg-surface-2/60 border border-border p-3">
      <div className="text-[10px] tracking-widest text-muted-foreground font-semibold">{k}</div>
      <div className={`text-lg font-bold mt-1 ${c}`}>{v}</div>
    </div>
  );
}

function UnitRow({ label, v, tone }: { label: string; v: string; tone?: Tone }) {
  const c = tone === "success" ? "text-success" : tone === "warn" ? "text-warn" : tone === "danger" ? "text-danger" : "text-foreground";
  return (
    <li className="flex justify-between items-baseline border-b border-border pb-2">
      <span className="text-[10px] tracking-widest text-muted-foreground font-semibold">{label}</span>
      <span className={`text-lg font-bold ${c}`}>{v}</span>
    </li>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="ip-section-label">{k}</div>
      <div className="mt-1 leading-relaxed text-sm">{v}</div>
    </div>
  );
}

const sevBorder = (s: Severity) =>
  s === "HIGH" ? "ip-pill-danger" : s === "MED" ? "ip-pill-warn" : "ip-pill-success";

const sevBg = (s: Severity) =>
  s === "HIGH" ? "bg-danger" : s === "MED" ? "bg-warn" : "bg-success";

const toneFill = (t: Tone) =>
  t === "success" ? COLOR.success : t === "warn" ? COLOR.warn : t === "danger" ? COLOR.danger : COLOR.accent;

/* ============================= SCORE PROVENANCE ============================= */

function ScoreProvenance({ score }: { score: Report["score"] }) {
  // Only renders for engine-anchored reports (rationale present).
  if (!score.rationale) return null;
  const evidenceTone =
    score.evidenceLevel === "rich" ? "text-success" :
    score.evidenceLevel === "thin" ? "text-danger" : "text-warn";
  return (
    <div className="mt-6 grid lg:grid-cols-[1.6fr_1fr] gap-4">
      <Card label="HOW THIS SCORE WAS REACHED" sub="AUDITED · TRACEABLE">
        <p className="text-sm text-foreground leading-relaxed">{score.rationale}</p>
        <div className="mt-4 grid sm:grid-cols-3 gap-3 text-xs">
          <div className="border border-border p-3">
            <div className="text-[10px] tracking-widest text-muted-foreground">RECOMMENDATION</div>
            <div className="font-display text-base mt-1">{score.recommendation ?? "—"}</div>
          </div>
          <div className="border border-border p-3">
            <div className="text-[10px] tracking-widest text-muted-foreground">EVIDENCE LEVEL</div>
            <div className={`font-display text-base mt-1 uppercase ${evidenceTone}`}>{score.evidenceLevel ?? "—"}</div>
          </div>
          <div className="border border-border p-3">
            <div className="text-[10px] tracking-widest text-muted-foreground">DATA</div>
            <div className="font-display text-base mt-1 flex items-center gap-1.5">
              {score.webSearchUsed ? <><Globe className="size-3.5 text-success" /> LIVE WEB</> : "MODEL ONLY"}
            </div>
          </div>
        </div>
        {score.fromDebate && (
          <div className="mt-3 inline-flex items-center gap-2 text-[10px] tracking-widest text-accent border border-accent/40 px-2 py-1">
            <Gavel className="size-3" /> FOLDED IN YOUR LIVE DEBATE TRANSCRIPT
          </div>
        )}
        {score.oneAsk && (
          <div className="mt-4 border-l-2 border-warn pl-3">
            <div className="text-[10px] tracking-widest text-warn mb-1">THE ONE THING THAT WOULD MOVE THIS SCORE MOST</div>
            <div className="text-sm">{score.oneAsk}</div>
          </div>
        )}
      </Card>
      <Card label="SOURCES & ASSUMPTIONS" sub={score.webSearchUsed ? "LIVE CITATIONS" : "STATED ASSUMPTIONS"}>
        {score.sources && score.sources.length > 0 ? (
          <ul className="space-y-2 mb-4">
            {score.sources.map((s, i) => (
              <li key={i} className="flex gap-2 items-start text-xs">
                <Link2 className="size-3 text-accent shrink-0 mt-0.5" />
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline break-all leading-snug">
                  {s.title || s.url}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-muted-foreground mb-4">No live sources — score is from category knowledge. Add web-search credits for cited data.</div>
        )}
        {score.assumptions && score.assumptions.length > 0 && (
          <ul className="space-y-2 border-t border-border pt-3">
            {score.assumptions.slice(0, 4).map((a, i) => (
              <li key={i} className="text-xs">
                <span className="text-[10px] tracking-widest text-muted-foreground uppercase">{a.area}</span>
                <div className="leading-snug">{a.claim}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">→ {a.evidenceToLock}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ============================= OVERVIEW ============================= */

/**
 * Print-only static score breakdown. The on-screen Score Lab is interactive
 * (sliders), which prints as frozen controls; this renders the same data as a
 * clean table so the exported PDF reads like an audited report, not a UI.
 */
function ScoreBreakdownPrint({ dims, score }: { dims: Report["overview"]["dims"]; score: number }) {
  return (
    <div className="hidden print:block mt-6 border border-border">
      <div className="px-4 py-2 border-b border-border flex items-center justify-between">
        <span className="text-[10px] tracking-widest text-muted-foreground">SCORE BREAKDOWN · BY DIMENSION</span>
        <span className="text-[10px] tracking-widest text-muted-foreground">HEADLINE {score}/100</span>
      </div>
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-border text-[9px] tracking-widest text-muted-foreground">
            <th className="px-4 py-2 font-normal">DIMENSION</th>
            <th className="px-4 py-2 font-normal">WEIGHT</th>
            <th className="px-4 py-2 font-normal">SCORE</th>
            <th className="px-4 py-2 font-normal">NOTE</th>
          </tr>
        </thead>
        <tbody>
          {dims.map((d) => (
            <tr key={d.k} className="border-b border-border/60 align-top">
              <td className="px-4 py-2 font-semibold whitespace-nowrap">{d.k}</td>
              <td className="px-4 py-2 text-muted-foreground">{d.weight}</td>
              <td className="px-4 py-2 font-display">{d.value}/100</td>
              <td className="px-4 py-2 text-muted-foreground leading-snug">{d.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Overview({ data, score, scoreMeta, report }: {
  data: Report["overview"]; score: number; scoreMeta: Report["score"];
  report: Report;
}) {
  return (
    <>
      <SectionHeader n="§01" label="EXECUTIVE SUMMARY" title="THE VERDICT," hl="IN ONE PAGE." body={data.sectionBody} />
      <ScoreProvenance score={scoreMeta} />
      {/* Interactive anatomy is on-screen only; print gets a clean static breakdown. */}
      <div className="print:hidden">
        <ScoreAnatomy report={report} />
      </div>
      <ScoreBreakdownPrint dims={data.dims} score={score} />

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card label="SHOULD YOU PROCEED?" className="lg:col-span-2">
          <div className="flex items-start gap-5">
            <div className="size-16 shrink-0 grid place-items-center border-2 border-warn">
              <AlertTriangle className="size-8 text-warn" />
            </div>
            <div>
              <div className="font-display text-3xl mb-2">{data.proceedHeadline}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {data.proceedBodyBefore}
                <span className="text-danger">{data.proceedDangerWord}</span>
                {data.proceedBodyAfter}
              </p>
            </div>
          </div>
        </Card>
        <Card label="KEY METRICS">
          <div className="grid grid-cols-2 gap-3 text-xs">
            {data.keyMetrics.map((m) => <KV key={m.k} k={m.k} v={m.v} tone={m.tone} />)}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card label="TOP 3 STRENGTHS">
          <ul className="space-y-3">
            {data.strengths.map((s) => (
              <li key={s.title} className="flex gap-3 items-start">
                <div className="mt-1.5 size-2 bg-success shrink-0" />
                <div><div className="text-sm font-semibold">{s.title}</div><div className="text-xs text-muted-foreground">{s.sub}</div></div>
              </li>
            ))}
          </ul>
        </Card>
        <Card label="TOP 3 RISKS">
          <ul className="space-y-3">
            {data.risks.map((r) => (
              <li key={r.title} className="flex gap-3 items-start">
                <div className={`mt-1.5 size-2 shrink-0 ${sevBg(r.sev)}`} />
                <div className="flex-1"><div className="text-sm font-semibold">{r.title}</div></div>
                <span className={`text-[10px] px-2 py-0.5 border ${sevBorder(r.sev)}`}>{r.sev}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

    </>
  );
}

/* ============================= MARKET ============================= */

function Market({ data }: { data: Report["market"] }) {
  return (
    <>
      <SectionHeader n="§02" label="MARKET" title={data.titleHead} hl={data.titleHl} body={data.sectionBody} />

      <Card label="MARKET GROWTH PROJECTION" sub="TAM / SAM / SOM FROM REPORT ASSUMPTIONS" className="mt-6">
        <div className="flex justify-end mb-2"><span className="text-[10px] px-2 py-1 border border-warn text-warn">{data.cagrBadge}</span></div>
        <div className="h-80">
          <ResponsiveContainer>
            <AreaChart data={data.growth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="tam" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLOR.accent} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={COLOR.accent} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sam" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLOR.danger} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COLOR.danger} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={COLOR.grid} strokeDasharray="2 4" />
              <XAxis dataKey="y" stroke={COLOR.muted} tick={{ fontSize: 11 }} />
              <YAxis stroke={COLOR.muted} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #1a1a2a", color: "#1a1a2a" }} />
              <Area type="monotone" dataKey="tam" stroke={COLOR.accent} fill="url(#tam)" strokeWidth={2} name="TAM ($B)" />
              <Area type="monotone" dataKey="sam" stroke={COLOR.danger} fill="url(#sam)" strokeWidth={2} name="SAM ($M)" />
              <Area type="monotone" dataKey="som" stroke={COLOR.text} fill="none" strokeWidth={2} name="SOM ($M)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {data.drivers.map((d) => (
          <div key={d.cat} className="ip-card p-4">
            <div className="flex justify-between text-[10px] tracking-widest mb-3">
              <span className="text-muted-foreground">{d.cat}</span>
              <span className="text-success">{d.pts}</span>
            </div>
            <p className="font-display text-sm leading-tight">{d.txt}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-4">
        <Card label="MARKET STAGE">
          <div className="font-display text-3xl text-accent">{data.stage.label}</div>
          <div className="text-xs text-muted-foreground mt-2">{data.stage.note}</div>
        </Card>
        <Card label="SEASONALITY">
          <div className="font-display text-3xl">{data.seasonality.label}</div>
          <div className="text-xs text-muted-foreground mt-2">{data.seasonality.note}</div>
        </Card>
        <Card label="GROWTH DRIVERS">
          <ul className="text-xs space-y-2 mt-1">
            {data.growthDrivers.map((g) => (
              <li key={g} className="flex gap-2"><Flame className="size-3 text-warn shrink-0 mt-0.5"/> {g}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card label="MARKET STAGE" sub="LIFECYCLE · TIMING · GEOGRAPHY" className="mt-4">
        <div className="space-y-8">
          <div>
            <div className="text-[10px] tracking-widest text-muted-foreground mb-4">▲ MATURITY</div>
            <div className="relative">
              <div className="absolute left-0 right-0 top-3 h-px bg-border-strong" />
              <div className="relative grid grid-cols-4 gap-2">
                {data.maturity.stages.map((s) => {
                  const active = s === data.maturity.current;
                  return (
                    <div key={s} className="flex flex-col items-center text-center">
                      <div className={`size-6 rounded-full border-2 ${active ? "bg-accent border-accent shadow-[0_0_0_4px] shadow-accent/20" : "bg-background border-border-strong"}`} />
                      <div className={`mt-2 text-xs font-display tracking-wide ${active ? "text-accent" : "text-muted-foreground"}`}>{s}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-4 leading-relaxed">{data.maturity.note}</div>
          </div>

          <div>
            <div className="text-[10px] tracking-widest text-muted-foreground mb-3">▦ SEASONALITY</div>
            <div className="grid grid-cols-12 gap-1.5">
              {data.calendar.map((c, i) => {
                const cls = c.intensity === 2 ? "bg-accent/80 text-accent-foreground border-accent" :
                            c.intensity === 1 ? "bg-accent/15 text-foreground border-accent/30" :
                                                "bg-muted/40 text-muted-foreground border-border";
                return (
                  <div key={i} className={`border ${cls} h-10 grid place-items-center font-display text-sm`}>{c.m}</div>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground mt-3 leading-relaxed">{data.seasonality.note}</div>
          </div>

          <div>
            <div className="text-[10px] tracking-widest text-muted-foreground mb-3">⊕ TARGET REGIONS</div>
            <ul className="divide-y divide-border border border-border">
              {data.regions.map((r) => {
                const tone = r.status === "PRIMARY"   ? "border-accent text-accent bg-accent/10" :
                             r.status === "SECONDARY" ? "border-border text-foreground bg-surface" :
                                                        "border-warn/40 text-warn bg-warn/5";
                const bar  = r.status === "PRIMARY"   ? "bg-accent" :
                             r.status === "SECONDARY" ? "bg-foreground/50" : "bg-warn";
                return (
                  <li key={r.name} className="flex items-center gap-4 px-4 py-3 hover:bg-surface/60">
                    <div className={`w-1 self-stretch ${bar}`} />
                    <div className="flex-1">
                      <div className="font-display text-sm">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{r.note}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-1 border tracking-widest font-bold ${tone}`}>{r.status}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Card>
    </>
  );
}

/* ============================= RISK ============================= */

function Risk({ data }: { data: Report["risk"] }) {
  const counts = data.risks.reduce<Record<Severity, number>>((acc, r) => {
    acc[r.sev] = (acc[r.sev] ?? 0) + 1; return acc;
  }, { HIGH: 0, MED: 0, LOW: 0 });

  return (
    <>
      <SectionHeader n="§03" label="RISK" title={data.titleHead} hl={data.titleHl} body={data.sectionBody} />

      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-4 mt-6">
        <Card label="RISK RADAR" sub="6 RUBRIC DIMENSIONS · 100 − SCORE">
          <div className="h-80">
            <ResponsiveContainer>
              <RadarChart data={data.radar}>
                <PolarGrid stroke={COLOR.grid} />
                <PolarAngleAxis dataKey="axis" tick={{ fill: COLOR.muted, fontSize: 10 }} />
                <PolarRadiusAxis stroke={COLOR.grid} tick={{ fill: COLOR.muted, fontSize: 9 }} />
                <Radar dataKey="v" stroke={COLOR.danger} fill={COLOR.danger} fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-muted-foreground mt-2">Each spike is 100 − category score. Bigger = more risk.</div>
        </Card>

        <Card label="KILL FACTORS" sub="EVENTS THAT TERMINATE THE THESIS">
          <ul className="space-y-3">
            {data.killers.map((k, i) => (
              <li key={i} className="flex gap-4 items-start ip-card-danger p-4">
                <Skull className="size-6 text-danger shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-[10px] tracking-widest text-danger">KILLER #{i + 1}</div>
                  <div className="text-sm mt-1">{k}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="ip-card mt-4">
        <div className="px-5 py-4 border-b border-border flex justify-between">
          <div>
            <div className="text-[10px] tracking-widest text-muted-foreground">RANKED RISK REGISTER</div>
            <div className="font-display text-lg mt-1">{data.risks.length} RISKS · PROBABILITY × IMPACT</div>
          </div>
          <div className="flex gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="size-2 bg-danger"/>HIGH {counts.HIGH}</span>
            <span className="flex items-center gap-1"><span className="size-2 bg-warn"/>MED {counts.MED}</span>
            <span className="flex items-center gap-1"><span className="size-2 bg-success"/>LOW {counts.LOW}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[640px]">
          <thead className="text-[10px] tracking-widest text-muted-foreground">
            <tr className="border-b border-border"><th className="text-left p-3">SEV</th><th className="text-left p-3">CATEGORY</th><th className="text-left p-3">RISK</th><th className="text-left p-3">MITIGATION</th><th className="text-left p-3 w-44">PROB × IMPACT</th></tr>
          </thead>
          <tbody>
            {data.risks.map((r) => (
              <tr key={r.title} className="border-b border-border align-top hover:bg-surface-2/40">
                <td className="p-3"><span className={`px-2 py-1 text-[10px] font-bold tracking-wider border ${sevBorder(r.sev)}`}>● {r.sev}</span></td>
                <td className="p-3 text-muted-foreground tracking-widest text-[10px]">{r.cat}</td>
                <td className="p-3"><div className="font-display text-sm">{r.title}</div><div className="text-muted-foreground text-[11px] mt-1 max-w-md">{r.desc}</div></td>
                <td className="p-3 max-w-sm text-[11px]"><div className="text-success flex gap-1.5"><ArrowRight className="size-3 mt-0.5 shrink-0"/>{r.mit}</div></td>
                <td className="p-3">
                  <div className="text-[10px] text-muted-foreground mb-1">PROB {r.prob}%</div>
                  <div className="h-1 bg-muted"><div className="h-full bg-warn" style={{ width: `${r.prob}%` }}/></div>
                  <div className="text-[10px] text-muted-foreground mt-2 mb-1">IMPACT {r.imp}%</div>
                  <div className="h-1 bg-muted"><div className="h-full bg-danger" style={{ width: `${r.imp}%` }}/></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <Card label="RISK MATRIX" sub="PROBABILITY × IMPACT · TOP-RIGHT = MITIGATION PRIORITY" className="mt-4">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
          <div>
            <div className="relative aspect-square w-full max-w-md mx-auto">
              <div className="absolute inset-0 grid grid-cols-5 grid-rows-5">
                {Array.from({ length: 25 }, (_, i) => {
                  const col = i % 5;
                  const row = 4 - Math.floor(i / 5);
                  const score = (col + 1) * (row + 1);
                  const bg = score >= 16 ? "bg-danger/15" :
                             score >= 9  ? "bg-warn/15" :
                             score >= 4  ? "bg-success/10" :
                                           "bg-muted/30";
                  return <div key={i} className={`${bg} border border-border/60`} />;
                })}
              </div>
              {data.matrix.map((r, i) => {
                const left = ((r.prob - 1) / 4) * 100;
                const bottom = ((r.imp - 1) / 4) * 100;
                const dot = r.tone === "danger" ? "bg-danger" : r.tone === "warn" ? "bg-warn" : r.tone === "success" ? "bg-success" : "bg-accent";
                return (
                  <div key={i}
                    className="absolute -translate-x-1/2 translate-y-1/2 flex items-center gap-1.5"
                    style={{ left: `calc(10% + ${left * 0.8}%)`, bottom: `calc(10% + ${bottom * 0.8}%)` }}>
                    <div className={`size-3.5 rounded-full ${dot} ring-2 ring-background shadow-md`} />
                    <span className="text-[9px] tracking-widest text-foreground/80 bg-background/80 px-1 rounded">{r.tag}</span>
                  </div>
                );
              })}
              <div className="absolute -bottom-6 left-0 right-0 text-center text-[10px] tracking-widest text-muted-foreground">PROBABILITY →</div>
              <div className="absolute -left-6 top-0 bottom-0 grid place-items-center text-[10px] tracking-widest text-muted-foreground" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>↑ IMPACT</div>
            </div>
          </div>
          <ul className="space-y-2">
            {data.matrix.map((r) => {
              const dot = r.tone === "danger" ? "bg-danger" : r.tone === "warn" ? "bg-warn" : r.tone === "success" ? "bg-success" : "bg-accent";
              return (
                <li key={r.name} className="flex items-center gap-3 ip-card px-3 py-2">
                  <div className={`size-2.5 rounded-full ${dot}`} />
                  <span className="text-[10px] tracking-widest text-muted-foreground w-12">{r.tag}</span>
                  <span className="flex-1 text-xs">{r.name}</span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">P{r.prob} · I{r.imp}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </Card>

      <Card label="CAUTIONARY TALES" sub="FOUNDERS WHO FAILED IN THIS SPACE" className="mt-4">
        <div className="grid md:grid-cols-3 gap-3">
          {data.tales.map((t) => (
            <div key={t.who} className="ip-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Skull className="size-4 text-danger" />
                <div className="font-display text-sm">{t.who}</div>
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">{t.what}</div>
              <div className="border-t border-border pt-3">
                <div className="text-[10px] tracking-widest text-warn mb-1">LESSON</div>
                <div className="text-xs leading-relaxed">{t.lesson}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

/* ============================= COMPETITION ============================= */

function Competition({ data }: { data: Report["competition"] }) {
  return (
    <>
      <SectionHeader n="§04" label="COMPETITION" title={data.titleHead} hl={data.titleHl} body={data.sectionBody} />

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <Card label="POSITIONING QUADRANT" sub="AUTONOMY × TRACTION">
          <div className="h-80">
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid stroke={COLOR.grid} strokeDasharray="2 4" />
                <XAxis type="number" dataKey="x" domain={[0, 100]} stroke={COLOR.muted} tick={{ fontSize: 10 }} label={{ value: "AUTONOMY →", position: "bottom", fill: COLOR.muted, fontSize: 10 }} />
                <YAxis type="number" dataKey="y" domain={[0, 100]} stroke={COLOR.muted} tick={{ fontSize: 10 }} label={{ value: "TRACTION →", angle: -90, position: "left", fill: COLOR.muted, fontSize: 10 }} />
                <ReferenceLine x={50} stroke={COLOR.grid} />
                <ReferenceLine y={50} stroke={COLOR.grid} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #1a1a2a", color: "#1a1a2a" }} />
                <Scatter data={data.quad}>
                  {data.quad.map((p, i) => (
                    <Cell key={i} fill={p.isYou ? COLOR.danger : COLOR.text} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {data.quad.map((p) => (
              <span key={p.name} className={`text-[10px] px-2 py-1 border ${p.isYou ? "border-danger text-danger" : "border-border"}`}>{p.name}</span>
            ))}
          </div>
        </Card>

        <Card label="HEAD-TO-HEAD" sub="GAP ANALYSIS">
          <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[420px]">
            <thead className="text-[10px] tracking-widest text-muted-foreground">
              <tr className="border-b border-border"><th className="text-left p-2">COMPETITOR</th><th className="text-left p-2">PRICE</th><th className="text-right p-2">TRACTION</th></tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.name} className="border-b border-border">
                  <td className="p-2">
                    <div className={`font-display text-sm ${r.isYou ? "text-accent" : ""}`}>{r.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{r.focus}</div>
                  </td>
                  <td className="p-2 text-[11px]">{r.price}</td>
                  <td className="p-2 text-right w-28">
                    <div className="text-[10px] text-muted-foreground">{r.trac}</div>
                    <div className="h-1 bg-muted mt-1"><div className="h-full" style={{ width: `${r.trac}%`, background: r.isYou ? COLOR.accent : COLOR.text }}/></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      </div>

      <Card label="DETAILED GAP ANALYSIS" sub="STRENGTH · WEAKNESS · YOUR OPENING" className="mt-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.rows.filter((r) => !r.isYou).map((r) => (
            <div key={r.name} className="border border-border p-4 space-y-3">
              <div className="font-display text-lg flex items-center gap-2">
                {r.name}
                {r.url && (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:opacity-70" title="Source">
                    <Link2 className="size-3.5" />
                  </a>
                )}
              </div>
              <div>
                <div className="text-[10px] tracking-widest text-success">STRENGTH</div>
                <div className="text-xs mt-1">{r.strength}</div>
              </div>
              <div>
                <div className="text-[10px] tracking-widest text-danger">WEAKNESS</div>
                <div className="text-xs mt-1">{r.weakness}</div>
              </div>
              <div>
                <div className="text-[10px] tracking-widest text-accent">YOUR OPENING</div>
                <div className="text-xs mt-1 text-muted-foreground">{r.gap}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

/* ============================= FINANCIALS ============================= */

function Financials({ data }: { data: Report["financials"] }) {
  return (
    <>
      <SectionHeader n="§05" label="FINANCIALS" title={data.titleHead} hl={data.titleHl} body={data.sectionBody} />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        {data.summary.map((s) => <KV key={s.k} k={s.k} v={s.v} tone={s.tone} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card label="STARTUP COSTS">
          <div className="flex items-start gap-4">
            <div className="size-12 grid place-items-center border-2 border-accent">
              <DollarSign className="size-6 text-accent" />
            </div>
            <div>
              <div className="font-display text-3xl text-accent">{data.startup.range}</div>
              <div className="text-xs text-muted-foreground mt-2 leading-relaxed">{data.startup.note}</div>
            </div>
          </div>
        </Card>
        <Card label="EXIT OPPORTUNITY">
          <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
            <div>
              <div className="text-[10px] tracking-widest text-success">ESTIMATED EXIT VALUE</div>
              <div className="font-display text-3xl text-success mt-1">{data.exit.value}</div>
              <div className="text-xs text-muted-foreground mt-2 leading-relaxed">{data.exit.note}</div>
            </div>
            <div className="border-l border-border pl-4">
              <div className="text-[10px] tracking-widest text-muted-foreground">TIMELINE</div>
              <div className="font-display text-2xl mt-1">{data.exit.timeline}</div>
            </div>
          </div>
        </Card>
      </div>


      <Card label="REVENUE — BEST / BASE / WORST" sub="EUR THOUSANDS · 5-YEAR PROJECTION" className="mt-4">
        <div className="h-96">
          <ResponsiveContainer>
            <BarChart data={data.projections} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid stroke={COLOR.grid} strokeDasharray="2 4" />
              <XAxis dataKey="y" stroke={COLOR.muted} tick={{ fontSize: 11 }} />
              <YAxis stroke={COLOR.muted} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #1a1a2a", color: "#1a1a2a" }} />
              <Bar dataKey="worst" fill={COLOR.danger}  name="WORST" />
              <Bar dataKey="base"  fill={COLOR.accent}  name="BASE" />
              <Bar dataKey="best"  fill={COLOR.success} name="BEST" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-4 mt-3 text-[10px] tracking-widest">
          <span className="flex items-center gap-2"><span className="size-3 bg-danger"/>WORST CASE</span>
          <span className="flex items-center gap-2"><span className="size-3 bg-accent"/>BASE CASE</span>
          <span className="flex items-center gap-2"><span className="size-3 bg-success"/>BEST CASE</span>
          <span className="ml-auto text-muted-foreground">{data.breakEvenLabel}</span>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-4 mt-4">
        <Card label="UNIT ECONOMICS">
          <ul className="space-y-4 text-xs">
            {data.unitEcon.map((u) => <UnitRow key={u.label} label={u.label} v={u.v} tone={u.tone} />)}
          </ul>
        </Card>

        <Card label="REVENUE MODEL · 3-TIER LADDER">
          <div className="grid md:grid-cols-3 gap-3">
            {data.tiers.map((t) => (
              <div key={t.name} className={`border p-5 relative ${t.anchor ? "border-accent bg-accent/5" : "border-border"}`}>
                {t.anchor && <span className="absolute -top-2 right-3 text-[9px] bg-accent text-accent-foreground px-2 py-0.5 tracking-widest font-bold">★ ANCHOR</span>}
                <div className="text-[10px] tracking-widest text-muted-foreground">{t.name}</div>
                <div className="font-display text-3xl mt-2">{t.price}{t.perUnitSuffix && <span className="text-base text-muted-foreground">{t.perUnitSuffix}</span>}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{t.users} users</div>
                <ul className="mt-4 space-y-2 text-xs">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2"><CheckCircle2 className="size-3 text-accent shrink-0 mt-0.5"/>{f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card label="BREAK-EVEN TIMELINE" sub="MONTHLY BURN VS REVENUE" className="mt-4">
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={data.breakEven}>
              <CartesianGrid stroke={COLOR.grid} strokeDasharray="2 4" />
              <XAxis dataKey="m" stroke={COLOR.muted} tick={{ fontSize: 9 }} interval={2}/>
              <YAxis stroke={COLOR.muted} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #1a1a2a", color: "#1a1a2a" }} />
              <Line type="monotone" dataKey="revenue" stroke={COLOR.accent}  strokeWidth={2} dot={false} name="REVENUE €K"/>
              <Line type="monotone" dataKey="burn"    stroke={COLOR.danger}  strokeWidth={2} dot={false} strokeDasharray="4 4" name="BURN €K"/>
              <ReferenceLine x={data.breakEvenMarkX} stroke={COLOR.success} strokeDasharray="4 4" label={{ value: data.breakEvenMarkLabel, fill: COLOR.success, fontSize: 10, position: "top" }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card label="REVENUE MODEL" className="mt-4">
        <div className="text-sm font-display leading-snug">{data.revenueModel.headline}</div>
        <ul className="mt-4 grid md:grid-cols-3 gap-2">
          {data.revenueModel.bullets.map((b) => (
            <li key={b} className="ip-card p-3 text-xs leading-relaxed">{b}</li>
          ))}
        </ul>
      </Card>
    </>
  );
}

/* ============================= ROADMAP ============================= */

function Roadmap({ data }: { data: Report["roadmap"] }) {
  return (
    <>
      <SectionHeader n="§06" label="ROADMAP" title={data.titleHead} hl={data.titleHl} body={data.sectionBody} />

      <div className="relative mt-6">
        <div className="absolute left-0 right-0 top-12 h-px bg-border-strong hidden lg:block" />
        <div className="grid lg:grid-cols-3 gap-4 relative">
          {data.phases.map((p, i) => (
            <div key={p.tag} className="ip-card relative">
              <div className="absolute -top-3 left-5 size-6 bg-background border border-border-strong grid place-items-center text-[10px] font-display">{String(i + 1).padStart(2, "0")}</div>
              <div className="p-5 border-b border-border">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] tracking-widest text-muted-foreground">{p.tag}</span>
                  <span className="text-[10px] tracking-widest text-accent">{p.window}</span>
                </div>
                <div className="font-display text-3xl mt-2">{p.title}</div>
                <div className="text-xs text-muted-foreground mt-2">{p.goal}</div>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <div className="text-[10px] tracking-widest text-accent mb-2">MILESTONES</div>
                  <ul className="space-y-2 text-xs">
                    {p.milestones.map((m) => <li key={m} className="flex gap-2"><ChevronRight className="size-3 text-accent shrink-0 mt-0.5"/>{m}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] tracking-widest text-success mb-2">SUCCESS METRICS</div>
                  <ul className="space-y-1 text-xs">
                    {p.kpi.map((k) => <li key={k} className="flex gap-2 text-success"><Target className="size-3 shrink-0 mt-0.5"/>{k}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] tracking-widest text-warn mb-2">DEPENDENCIES</div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {p.deps.map((d) => <li key={d} className="flex gap-2"><Shield className="size-3 shrink-0 mt-0.5 text-warn"/>{d}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card label="QUICK WINS · DO THESE IN WEEK 1" className="mt-4">
        <ol className="grid md:grid-cols-2 gap-3">
          {data.quickWins.map((w, i) => (
            <li key={w} className="flex gap-3 border border-border p-3 items-start">
              <span className="font-display text-2xl text-accent">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-sm">{w}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card label="PARTNERS" sub="WHO YOU NEED ON YOUR SIDE">
          <ul className="space-y-2">
            {data.partners.map((p) => (
              <li key={p.name} className="flex items-start gap-3 ip-card p-3">
                <div className="size-8 shrink-0 grid place-items-center ip-card-tint">
                  <Shield className="size-4 text-accent" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-display text-sm">{p.name}</div>
                    <span className="text-[9px] tracking-widest text-accent">{p.role}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">{p.note}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card label="DISTRIBUTION CHANNELS" sub="HOW CUSTOMERS WILL FIND YOU">
          <ul className="space-y-2">
            {data.channels.map((c) => (
              <li key={c.name} className="flex items-start gap-3 ip-card p-3">
                <ArrowRight className="size-4 text-accent shrink-0 mt-1" />
                <div className="flex-1">
                  <div className="font-display text-sm">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{c.note}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

/* ============================= PERSONAS ============================= */

function Audience({ data }: { data: Report["audience"] }) {
  return (
    <>
      <SectionHeader n="§07" label="PERSONAS" title={data.titleHead} hl={data.titleHl} body={data.sectionBody} />

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        {data.personas.map((p) => (
          <div key={p.name} className="ip-card">
            <div className={`p-5 border-b border-border ${p.tone === "danger" ? "bg-danger/10" : p.tone === "success" ? "bg-success/10" : p.tone === "warn" ? "bg-warn/10" : "bg-accent/10"}`}>
              <div className="font-display text-xl">{p.name}</div>
              <div className="text-[10px] tracking-widest text-muted-foreground mt-1">{p.firm}</div>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <Field k="PAIN"            v={p.pain} />
              <Field k="JOBS-TO-BE-DONE" v={p.jtbd} />
              <div>
                <div className="text-[10px] tracking-widest text-danger mb-2">PAIN POINTS</div>
                <ul className="space-y-1.5">
                  {p.painPoints.map((pp) => (
                    <li key={pp} className="flex gap-2 text-xs"><span className="text-danger shrink-0">×</span>{pp}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[10px] tracking-widest text-muted-foreground mb-2">CURRENT SOLUTIONS</div>
                <ul className="space-y-1.5">
                  {p.currentSolutions.map((cs) => (
                    <li key={cs} className="flex gap-2 text-xs"><span className="text-muted-foreground shrink-0">·</span>{cs}</li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><div className="text-[10px] tracking-widest text-muted-foreground">BUDGET</div><div className="font-display text-sm mt-1">{p.budget}</div></div>
                <div><div className="text-[10px] tracking-widest text-muted-foreground">WTP</div><div className="font-display text-sm mt-1 text-accent">{p.wtp}</div></div>
              </div>
              <div>
                <div className="text-[10px] tracking-widest text-success mb-2">TRIGGERS</div>
                <div className="flex flex-wrap gap-1">{p.triggers.map((t) => <span key={t} className="text-[10px] px-2 py-1 border border-border">{t}</span>)}</div>
              </div>
              <div>
                <div className="text-[10px] tracking-widest text-danger mb-2">OBJECTIONS</div>
                <div className="flex flex-wrap gap-1">{p.objections.map((t) => <span key={t} className="text-[10px] px-2 py-1 border border-danger/40 text-danger">{t}</span>)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card label="DISCOVERY" sub="KEY INTERVIEW QUESTIONS">
          <ul className="space-y-3">
            {data.interviewQuestions.map((q, i) => (
              <li key={q} className="flex gap-3 ip-card p-3 items-start">
                <span className="font-display text-sm text-accent tabular-nums shrink-0">Q{String(i + 1).padStart(2, "0")}</span>
                <span className="text-xs leading-relaxed">{q}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card label="RUN THESE" sub="VALIDATION EXPERIMENTS">
          <ul className="space-y-3">
            {data.experiments.map((e) => (
              <li key={e.title} className="ip-card-tint p-4">
                <div className="flex gap-2 items-start">
                  <Zap className="size-4 text-accent shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">{e.title}</div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                  <div><div className="tracking-widest text-muted-foreground">TIMELINE</div><div className="font-display text-foreground mt-0.5">{e.timeline}</div></div>
                  <div><div className="tracking-widest text-muted-foreground">BUDGET</div><div className="font-display text-foreground mt-0.5">{e.budget}</div></div>
                  <div><div className="tracking-widest text-muted-foreground">METRIC</div><div className="font-display text-foreground mt-0.5">{e.metric}</div></div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card label="MARKET INTELLIGENCE" sub="CONTEXT · PRECEDENTS · PIVOTS" className="mt-4">
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <div className="text-[10px] tracking-widest text-success mb-2 flex items-center gap-1.5"><CheckCircle2 className="size-3"/>SIMILAR SUCCESSES</div>
            <ul className="space-y-2">
              {data.intelligence.successes.map((s) => (
                <li key={s} className="ip-card-success p-3 text-xs leading-relaxed">{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] tracking-widest text-accent mb-2 flex items-center gap-1.5"><TrendingUp className="size-3"/>MARKET TRENDS</div>
            <ul className="space-y-2">
              {data.intelligence.trends.map((s) => (
                <li key={s} className="ip-card-tint p-3 text-xs leading-relaxed">{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] tracking-widest text-warn mb-2 flex items-center gap-1.5"><RouteIcon className="size-3"/>PIVOT EXAMPLES</div>
            <ul className="space-y-2">
              {data.intelligence.pivots.map((s) => (
                <li key={s} className="ip-card-warn p-3 text-xs leading-relaxed">{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </>
  );
}

/* ============================= ACTIONS ============================= */

function Actions({ data }: { data: Report["actions"] }) {
  const prioBorder = (p: Priority) =>
    p === "P0" ? "border-danger text-danger" :
    p === "P1" ? "border-warn text-warn" :
    p === "P2" ? "border-accent text-accent" :
                 "border-muted-foreground text-muted-foreground";
  return (
    <>
      <SectionHeader n="§08" label="ACTIONS" title={data.titleHead} hl={data.titleHl} body={data.sectionBody} />

      <div className="mt-6 ip-card divide-y divide-border">
        {data.items.map((a, i) => (
          <div key={a.title} className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[60px_120px_140px_1fr_100px] gap-3 md:gap-4 px-4 md:px-5 py-4 items-start md:items-center hover:bg-surface-2/40">
            <div className="font-display text-xl md:text-2xl text-muted-foreground">{String(i + 1).padStart(2, "0")}</div>
            <div className="md:order-none">
              <div className="flex items-center gap-2 mb-1 md:hidden">
                <span className={`text-[10px] px-2 py-0.5 border tracking-widest font-bold ${prioBorder(a.p)}`}>● {a.p}</span>
                <span className="text-[10px] tracking-widest text-muted-foreground">{a.w}</span>
              </div>
              <div className="font-display text-base">{a.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{a.detail}</div>
            </div>
            <div className="hidden md:block">
              <span className={`text-[10px] px-2 py-1 border tracking-widest font-bold ${prioBorder(a.p)}`}>● {a.p}</span>
            </div>
            <div className="hidden md:block text-[10px] tracking-widest text-muted-foreground">{a.w}</div>
            <div className="text-[10px] tracking-widest text-right text-muted-foreground">{a.owner}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 border-2 border-accent bg-accent/5 p-8 text-center">
        <div className="text-[10px] tracking-widest text-accent mb-4">{data.bottomLineLabel}</div>
        <div className="font-display text-3xl md:text-5xl">{data.bottomLineHeadline}</div>
        <p className="text-sm text-muted-foreground mt-4 max-w-2xl mx-auto">{data.bottomLineBody}</p>
      </div>
    </>
  );
}
