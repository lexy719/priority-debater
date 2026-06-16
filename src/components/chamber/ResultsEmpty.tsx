"use client";

/**
 * /results empty state — rendered when there is NO validated idea on file
 * (or the synthesis engine is unreachable). Nothing is faked: no score, no
 * charts, no verdict. The eight report sections render locked, and the page
 * funnels the user into running a validation.
 */

import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import {
  Activity, TrendingUp, AlertTriangle, Target, DollarSign,
  Route as RouteIcon, Users, Zap, Lock, ArrowRight, RefreshCw,
} from "lucide-react";

const LOCKED_SECTIONS = [
  { n: "§01", label: "OVERVIEW",    icon: Activity,      sub: "Verdict, score math, strengths & risks" },
  { n: "§02", label: "MARKET",      icon: TrendingUp,    sub: "TAM / SAM / SOM, timing, regions" },
  { n: "§03", label: "RISK",        icon: AlertTriangle, sub: "Ranked register, kill factors, matrix" },
  { n: "§04", label: "COMPETITION", icon: Target,        sub: "Named competitors, gaps, positioning" },
  { n: "§05", label: "FINANCIALS",  icon: DollarSign,    sub: "Projections, unit economics, pricing" },
  { n: "§06", label: "ROADMAP",     icon: RouteIcon,     sub: "Phases, quick wins, partners, channels" },
  { n: "§07", label: "PERSONAS",    icon: Users,         sub: "Buying committee, interviews, experiments" },
  { n: "§08", label: "ACTIONS",     icon: Zap,           sub: "Prioritized 90-day operating plan" },
];

const IDLE_TICKER = [
  "[SYS] NO VALIDATION ON FILE",
  "[RPT] DOSSIER LOCKED — AWAITING IDEA",
  "[PNL] FIVE ADVISORS ON STANDBY",
  "[SCR] VIABILITY — / 100",
];

export default function ResultsEmpty({
  variant = "no-idea",
  idea,
  onRetry,
}: {
  variant?: "no-idea" | "engine-down";
  idea?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="chamber-scope min-h-screen bg-background text-foreground">
      <IdleTicker />
      <TopBar />

      {/* Hero — honest empty state, no numbers */}
      <section className="relative bg-ink text-ink-foreground border-y border-ink grid-bg-ink">
        <div className="mx-auto max-w-[1480px] px-4 md:px-8 py-16 grid lg:grid-cols-[1.4fr_1fr] gap-12">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-6 text-[10px] tracking-widest text-ink-foreground/60">
              <span className="px-2 py-1 border border-ink-foreground/40 text-ink-foreground/70">○ STANDBY</span>
              <span>§00 / VALIDATION REPORT</span>
            </div>
            <h1 className="text-display text-4xl md:text-6xl lg:text-7xl text-ink-foreground">
              {variant === "engine-down" ? (
                <>The engine is <span className="hl-red">unreachable.</span></>
              ) : (
                <>No dossier. No verdict. <span className="hl-red">Yet.</span></>
              )}
            </h1>
            <p className="mt-8 max-w-xl text-sm text-ink-foreground/70 leading-relaxed">
              {variant === "engine-down"
                ? "Your idea is on file, but the synthesis engine couldn't generate the report. Nothing here is faked — retry when the engine is back."
                : "Every score, chart and headline on this page is generated from your idea. Until you run a validation, there is nothing to show — and we won't invent it."}
            </p>
            {variant === "engine-down" && idea && (
              <p className="mt-4 max-w-xl text-xs text-ink-foreground/50 leading-relaxed border-l-2 border-data pl-3">
                <span className="text-data tracking-widest">IDEA ON FILE · </span>{idea}
              </p>
            )}
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              {variant === "engine-down" && onRetry ? (
                <>
                  <button onClick={onRetry} className="px-6 py-4 bg-accent text-accent-foreground font-display text-sm tracking-widest hover:opacity-90 flex items-center justify-center gap-2">
                    <RefreshCw className="size-4" /> RETRY GENERATION
                  </button>
                  <Link href="/" className="px-6 py-4 border border-ink-foreground/40 text-ink-foreground font-display text-sm tracking-widest hover:bg-ink-foreground/5 flex items-center justify-center gap-2">
                    RUN A NEW VALIDATION <ArrowRight className="size-4" />
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/" className="px-6 py-4 bg-accent text-accent-foreground font-display text-sm tracking-widest hover:opacity-90 flex items-center justify-center gap-2">
                    RUN A VALIDATION <ArrowRight className="size-4" />
                  </Link>
                  <Link href="/debate" className="px-6 py-4 border border-ink-foreground/40 text-ink-foreground font-display text-sm tracking-widest hover:bg-ink-foreground/5 flex items-center justify-center gap-2">
                    OR ENTER THE DEBATE CHAMBER
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Empty score panel — dashes, not numbers */}
          <div className="border border-ink-foreground/25 bg-ink-foreground/5 p-6 self-start">
            <div className="text-[10px] tracking-widest text-ink-foreground/55 mb-3">OVERALL VIABILITY SCORE</div>
            <div className="flex items-end gap-4">
              <div className="font-display text-[5.5rem] sm:text-[8rem] leading-none text-ink-foreground/25">—</div>
              <div className="text-ink-foreground/40 mb-4 text-xl">/ 100</div>
            </div>
            <div className="mt-2 text-xs text-ink-foreground/40">NO DATA · AWAITING VALIDATION</div>
            <div className="mt-6 h-24 border border-dashed border-ink-foreground/20 grid place-items-center">
              <span className="text-[10px] tracking-widest text-ink-foreground/35">SCORE PROGRESSION RENDERS HERE</span>
            </div>
            <div className="mt-6 grid grid-cols-3 border border-ink-foreground/20">
              {["VERDICT", "CONFIDENCE", "RANK"].map((k) => (
                <div key={k} className="p-4 border-r last:border-r-0 border-ink-foreground/20">
                  <div className="text-[10px] tracking-widest mb-2 text-ink-foreground/45">{k}</div>
                  <div className="font-display text-2xl text-ink-foreground/25">—</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Locked sections */}
      <section className="mx-auto max-w-[1480px] px-4 md:px-8 py-16">
        <div className="text-center mb-8">
          <span className="ip-section-label tabular-nums">00 / 08 &nbsp;·&nbsp; REPORT SECTIONS — LOCKED</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {LOCKED_SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.n} className="ip-card p-5 relative overflow-hidden group">
                <div className="flex items-start justify-between">
                  <div className="ip-chip ip-chip-lg opacity-60"><Icon className="size-5" /></div>
                  <Lock className="size-3.5 text-muted-foreground/50" />
                </div>
                <div className="mt-4 text-[10px] tracking-widest text-muted-foreground">{s.n}</div>
                <div className="font-display text-xl mt-1 text-foreground/45">{s.label}</div>
                <div className="text-[11px] text-muted-foreground/70 mt-2 leading-relaxed">{s.sub}</div>
                <div className="mt-4 h-1.5 bg-muted/60 relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-0 bg-accent transition-all" />
                </div>
                <div className="text-[9px] tracking-widest text-muted-foreground/60 mt-1.5">UNLOCKS AFTER VALIDATION</div>
              </div>
            );
          })}
        </div>
      </section>

      <IdleTicker />
    </div>
  );
}

function IdleTicker() {
  return (
    <div className="chamber-ticker bg-ink text-ink-foreground border-y border-ink overflow-hidden">
      <div className="chamber-ticker-track flex gap-10 py-2 text-[10px] tracking-[0.2em] whitespace-nowrap">
        {[...IDLE_TICKER, ...IDLE_TICKER, ...IDLE_TICKER].map((s, i) => (
          <span key={i} className="flex items-center gap-3">
            <span className="text-ink-foreground/60">{s}</span>
            <span className="text-ink-foreground/30">//</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function TopBar() {
  return <SiteNav subtitle="Report · No data" />;
}
