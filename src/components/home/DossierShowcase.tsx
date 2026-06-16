"use client";

/**
 * DossierShowcase — "Every chart earns its place." Matches the Emergent print:
 * cream band, header + paragraph, a 4×2 grid of section cards, two dark proof
 * rows (audited score / built to be shared), then the sample + generate CTAs.
 */

import Link from "next/link";
import {
  Activity, TrendingUp, AlertTriangle, Target, DollarSign,
  Route as RouteIcon, Users, Zap, ArrowUpRight, ArrowRight, Globe, Share2, Sliders,
} from "lucide-react";
import { Eyebrow } from "@/components/primitives";

const SECTIONS = [
  { n: "§01", label: "Overview", icon: Activity, sub: "Audited verdict, score math, Score Lab" },
  { n: "§02", label: "Market", icon: TrendingUp, sub: "TAM/SAM/SOM, timing, seasonality, regions" },
  { n: "§03", label: "Risk", icon: AlertTriangle, sub: "Ranked register, kill factors, 5×5 matrix" },
  { n: "§04", label: "Competition", icon: Target, sub: "Named competitors, gaps, positioning quad" },
  { n: "§05", label: "Financials", icon: DollarSign, sub: "Projections, unit economics, break-even" },
  { n: "§06", label: "Roadmap", icon: RouteIcon, sub: "3 phases, quick wins, partners, channels" },
  { n: "§07", label: "Personas", icon: Users, sub: "Buying committee, interviews, experiments" },
  { n: "§08", label: "Actions", icon: Zap, sub: "Prioritized 90-day operating plan" },
];

export function DossierShowcase() {
  return (
    <section id="report" className="scroll-mt-20 border-b border-ink/15 bg-paper-2 grid-paper">
      <div className="mx-auto max-w-[1120px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Eyebrow index="— 04" label="The Dossier" className="mb-8" />
            <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.92] tracking-[-0.02em] text-ink">
              Every chart earns <br />
              <span className="hl-blue">its place.</span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pt-16">
            <p className="max-w-md text-[15px] leading-relaxed text-ink/70">
              Eight sections, each generated for <em>your</em> idea by its own pass of the
              synthesis engine — never template filler. No idea on file? You get an honest
              empty state, not fake numbers.
            </p>
          </div>
        </div>

        {/* 8-card grid */}
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.n}
                className="group border border-ink bg-card p-5 shadow-[5px_5px_0_0_var(--color-ink)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <span className="grid h-9 w-9 place-items-center border border-ink text-ink">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{s.n}</span>
                </div>
                <div className="mt-4 font-display text-lg uppercase text-ink">{s.label}</div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink/60">{s.sub}</p>
              </div>
            );
          })}
        </div>

        {/* dark proof rows */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-4 bg-ink p-5 text-paper">
            <span className="grid h-10 w-10 shrink-0 place-items-center bg-signal-green text-ink">
              <Globe className="h-4 w-4" />
            </span>
            <div>
              <div className="font-display text-sm uppercase tracking-wide">Audited, trackable score</div>
              <p className="mt-1 text-[12px] leading-relaxed text-paper/65">
                Deterministic rubric (Σ score × weight), web-enriched with cited sources. Drag any
                dimension in the Score Lab — the prose can never drift from the number.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-ink p-5 text-paper">
            <span className="grid h-10 w-10 shrink-0 place-items-center bg-signal-blue text-ink">
              <Share2 className="h-4 w-4" />
            </span>
            <div>
              <div className="font-display text-sm uppercase tracking-wide">Built to be shared</div>
              <p className="mt-1 text-[12px] leading-relaxed text-paper/65">
                Stable share link, downloadable scorecard image, and your debate transcript folded
                straight into the dossier.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/resultstest"
            className="group inline-flex items-center gap-3 bg-ink px-7 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-paper transition-colors hover:bg-signal-blue hover:text-ink"
          >
            See a sample dossier
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <a
            href="#validate"
            className="group inline-flex items-center gap-3 border border-ink px-7 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Generate mine
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <span className="ml-auto hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:flex">
            <Sliders className="h-3.5 w-3.5 text-signal-red" /> No fake data — ever
          </span>
        </div>
      </div>
    </section>
  );
}
