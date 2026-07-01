"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bot,
  DollarSign,
  FileJson,
  Globe,
  Route as RouteIcon,
  Search,
  Share2,
  ShoppingCart,
  Sliders,
  Target,
  TrendingUp,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { Eyebrow } from "@/components/primitives";
import { useFork } from "@/components/home/ForkContext";

const VALIDATION_SECTIONS = [
  { n: "01", label: "Overview", icon: Activity, sub: "Audited verdict, score math, Score Lab" },
  { n: "02", label: "Market", icon: TrendingUp, sub: "TAM/SAM/SOM, timing, seasonality, regions" },
  { n: "03", label: "Risk", icon: AlertTriangle, sub: "Ranked register, kill factors, 5x5 matrix" },
  { n: "04", label: "Competition", icon: Target, sub: "Named competitors, gaps, positioning quad" },
  { n: "05", label: "Financials", icon: DollarSign, sub: "Projections, unit economics, break-even" },
  { n: "06", label: "Roadmap", icon: RouteIcon, sub: "3 phases, quick wins, partners, channels" },
  { n: "07", label: "Personas", icon: Users, sub: "Buying committee, interviews, experiments" },
  { n: "08", label: "Actions", icon: Zap, sub: "Prioritized 90-day operating plan" },
];

const COMMERCE_SECTIONS = [
  { n: "01", label: "Visibility", icon: Bot, sub: "AI commerce score, category median, rank label" },
  { n: "02", label: "Models", icon: Search, sub: "ChatGPT, Claude and Gemini buyer answers" },
  { n: "03", label: "Catalogue", icon: ShoppingCart, sub: "Schema, product feed and page-readiness checks" },
  { n: "04", label: "Competitors", icon: Target, sub: "Stores agents recommend instead of you" },
  { n: "05", label: "Offsite", icon: Globe, sub: "Reviews, authority, citations and social proof" },
  { n: "06", label: "Fixes", icon: Wrench, sub: "Prioritized agent-readiness actions" },
  { n: "07", label: "Files", icon: FileJson, sub: "llms.txt, schema, feed and crawler rules" },
  { n: "08", label: "Re-check", icon: Activity, sub: "Run again after publishing the fixes" },
];

export function DossierShowcase() {
  const { fork } = useFork();
  const commerce = fork === "commerce";
  const sections = commerce ? COMMERCE_SECTIONS : VALIDATION_SECTIONS;

  return (
    <section id="report" className="scroll-mt-20 border-b border-ink/15 bg-paper-2 grid-paper">
      <div className="mx-auto max-w-[1120px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Eyebrow index="04" label={commerce ? "The Commerce Report" : "The Dossier"} className="mb-8" />
            <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.92] tracking-[-0.02em] text-ink">
              {commerce ? (
                <>
                  Every agent signal <br />
                  <span className="hl-blue">has a fix.</span>
                </>
              ) : (
                <>
                  Every chart earns <br />
                  <span className="hl-blue">its place.</span>
                </>
              )}
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pt-16">
            <p className="max-w-md text-[15px] leading-relaxed text-ink/70">
              {commerce
                ? "Eight commerce modules score the real store URL, show where AI agents lose trust, and route the merchant straight into installable fixes."
                : "Eight sections, each generated for your idea by its own pass of the synthesis engine: never template filler. No idea on file means an honest empty state, not fake numbers."}
            </p>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((s) => {
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

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-4 bg-ink p-5 text-paper">
            <span className={`grid h-10 w-10 shrink-0 place-items-center text-ink ${commerce ? "bg-signal-blue" : "bg-signal-green"}`}>
              <Globe className="h-4 w-4" />
            </span>
            <div>
              <div className="font-display text-sm uppercase tracking-wide">
                {commerce ? "Live URL, readable outputs" : "Audited, trackable score"}
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-paper/65">
                {commerce
                  ? "The default report stays visible as demo content until the store URL returns live signals, then the same modules re-render from that store."
                  : "Deterministic rubric, web-enriched with cited sources. Drag any dimension in the Score Lab: the prose can never drift from the number."}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-ink p-5 text-paper">
            <span className="grid h-10 w-10 shrink-0 place-items-center bg-signal-blue text-ink">
              <Share2 className="h-4 w-4" />
            </span>
            <div>
              <div className="font-display text-sm uppercase tracking-wide">
                {commerce ? "Built to be fixed" : "Built to be shared"}
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-paper/65">
                {commerce
                  ? "The report leads directly into the toolkit: llms.txt, schema, crawler rules and product-feed artifacts for the same URL."
                  : "Stable share link, downloadable scorecard image, and your debate transcript folded straight into the dossier."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href={commerce ? "/commerce" : "/resultstest"}
            className="group inline-flex items-center gap-3 bg-ink px-7 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-paper transition-colors hover:bg-signal-blue hover:text-ink"
          >
            {commerce ? "Run a store audit" : "See a sample dossier"}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <a
            href={commerce ? "/commerce" : "#validate"}
            className="group inline-flex items-center gap-3 border border-ink px-7 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            {commerce ? "Open dashboard" : "Generate mine"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <span className="ml-auto hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:flex">
            <Sliders className="h-3.5 w-3.5 text-signal-red" /> {commerce ? "Demo only before URL" : "No fake data - ever"}
          </span>
        </div>
      </div>
    </section>
  );
}
