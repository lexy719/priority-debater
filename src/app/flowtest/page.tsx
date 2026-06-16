/**
 * /flowtest — LOCKED mock preview of the studio flow.
 *
 * Dev-only (404 in production) and fully self-contained: it renders sample
 * studio data for a visual reference and DOES NOT touch sessionStorage. It used
 * to seed a fake validated session, which leaked mock data into the real app
 * (every studio/results page then thought a fake idea was validated). That
 * seeding is gone — nothing here can unlock or pollute a live session.
 */

import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";

const SAMPLE = {
  idea: "AI legal-document drafting for Iberian law firms",
  thesis:
    "Court-ready first drafts of contracts and NDAs in minutes, in native PT/ES legal language, grounded in the firm's own templates.",
  score: 61,
  verdict: "CAUTION",
  confidence: "MED",
  market: { tam: "€60M", sam: "€18M", som: "€2.2M" },
  pricing: "€89 / seat / mo",
  stages: [
    { n: "02", label: "Results", note: "Investor-grade dossier + score lab" },
    { n: "03", label: "Debate", note: "The Chamber — 5-persona stress test" },
    { n: "04", label: "Brand Kit", note: "Name, palette, voice, taglines" },
    { n: "05", label: "Launch Kit", note: "Product page, 3 channels, outreach pack" },
    { n: "06", label: "Campaign", note: "4 video ad cuts + storyboards" },
    { n: "07", label: "Landing", note: "Conversion page — HTML / WP / Shopify" },
    { n: "08", label: "Ship", note: "24-hour launch checklist" },
  ],
};

export default function FlowTestPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div data-testid="flow-test-page" className="min-h-screen bg-[#f4f4f0] text-black">
      <SiteNav subtitle="Mock preview · locked" />

      <main className="mx-auto max-w-[1100px] px-5 py-16 lg:px-8">
        <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-black/45">
          <Lock className="h-3.5 w-3.5" /> §TEST / Locked mock preview — dev only
        </span>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl uppercase leading-[0.95]">
          Studio flow,{" "}
          <span className="bg-black text-white px-2">mock data only.</span>
        </h1>
        <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-black/65">
          A static reference of the post-validation studio. It does <strong>not</strong> write to your
          session, unlock any gate, or affect the live app — the real pages only ever populate from a
          genuine validation. This page is hidden in production.
        </p>

        {/* sample idea + audited score */}
        <div className="mt-10 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <div className="border-[1.5px] border-black bg-white p-6 shadow-hard-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40">Sample idea</span>
            <h2 className="mt-2 font-display text-2xl uppercase leading-tight">{SAMPLE.idea}</h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-black/70">{SAMPLE.thesis}</p>
            <div className="mt-4 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[0.16em]">
              <span className="border border-black/20 px-2 py-1">TAM {SAMPLE.market.tam}</span>
              <span className="border border-black/20 px-2 py-1">SAM {SAMPLE.market.sam}</span>
              <span className="border border-black/20 px-2 py-1">SOM {SAMPLE.market.som}</span>
              <span className="border border-black/20 px-2 py-1">{SAMPLE.pricing}</span>
            </div>
          </div>
          <div className="border-[1.5px] border-black bg-white p-6 shadow-hard-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40">Audited score (sample)</span>
            <div className="mt-2 flex items-end gap-3">
              <span className="font-display text-6xl leading-none text-[#d98a06]">{SAMPLE.score}</span>
              <span className="mb-2 font-mono text-xs text-black/50">/ 100</span>
            </div>
            <div className="mt-3 flex gap-2 font-mono text-[10px] uppercase tracking-[0.16em]">
              <span className="bg-[#d98a06] text-black px-2 py-1">{SAMPLE.verdict}</span>
              <span className="border border-black/20 px-2 py-1">Confidence {SAMPLE.confidence}</span>
            </div>
          </div>
        </div>

        {/* stages — display only, locked (no links, no seeding) */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE.stages.map((s) => (
            <div
              key={s.label}
              className="flex flex-col justify-between border-[1.5px] border-black/30 bg-white/60 p-5"
            >
              <div className="flex items-start justify-between">
                <span className="font-display text-3xl text-black/15">{s.n}</span>
                <Lock className="h-3.5 w-3.5 text-black/30" />
              </div>
              <div className="mt-4">
                <h3 className="font-body font-bold text-base uppercase tracking-wide">{s.label}</h3>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-black/45">{s.note}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-black/40">
          To see the real, populated pages: run a validation from the homepage.
        </p>
      </main>
    </div>
  );
}
