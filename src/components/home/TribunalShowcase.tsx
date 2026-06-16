"use client";

/**
 * TribunalShowcase — "Five agents. Five voices. One verdict." Matches the
 * Emergent print: dark band, header + paragraph, five seat cards (colored
 * icon, name, role), CTA into /debate. Sells the multi-agent voice feature.
 */

import Link from "next/link";
import { ArrowRight, Mic, Volume2, Crosshair, Gavel } from "lucide-react";
import { CHAMBER_AGENTS, CHAMBER_IDS } from "@/lib/chamber-personas";

const SEAT = {
  vk: "var(--c-red)",
  mr: "var(--c-blue)",
  ht: "var(--c-green)",
  lv: "var(--c-yellow)",
  es: "var(--c-magenta)",
} as const;

export function TribunalShowcase() {
  return (
    <section id="chamber" className="scroll-mt-20 relative overflow-hidden border-b border-paper/10 bg-ink text-paper grid-paper-dark">
      <div className="relative mx-auto max-w-[1120px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="mb-7 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-paper/45">
              <span>— 03 / The Chamber</span>
              <span className="flex items-center gap-1.5 border border-signal-red/60 px-2 py-0.5 text-signal-red">
                <Mic className="h-3 w-3" /> They speak
              </span>
            </div>
            <h2 className="font-display text-[clamp(2.75rem,7vw,6rem)] leading-[0.9] tracking-[-0.02em]">
              Five agents. <br />
              Five voices. <br />
              <span className="hl-red">One verdict.</span>
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-[15px] leading-relaxed text-paper/65">
              Not a chatbot wearing five hats — five separate AI agents, each with its own
              personality, attack axis and synthesized voice. They read the live transcript,
              build on each other&apos;s objections, judge every defense you type, and rule on
              your idea out loud.
            </p>
          </div>
        </div>

        {/* Five seat cards */}
        <div className="mt-14 grid grid-cols-1 gap-px border border-paper/15 bg-paper/15 sm:grid-cols-2 lg:grid-cols-5">
          {CHAMBER_IDS.map((id, i) => {
            const a = CHAMBER_AGENTS[id];
            const color = SEAT[id];
            return (
              <div key={id} className="group flex min-h-[210px] flex-col bg-ink p-5 transition-colors hover:bg-paper/[0.04]">
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center" style={{ background: color }}>
                    <span className="font-display text-base text-ink">{a.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/35">Seat 0{i + 1}</span>
                </div>
                <div className="mt-5 font-display text-lg uppercase leading-none text-paper">{a.name}</div>
                <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color }}>
                  {a.role}
                </div>
                <div className="mt-auto pt-4 font-mono text-[9px] uppercase tracking-[0.16em] text-paper/35">
                  Own voice · own axis
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Link
            href="/#validate"
            className="group inline-flex items-center gap-3 bg-signal-red px-7 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-paper transition-colors hover:bg-paper hover:text-ink"
          >
            Validate my idea
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50">
            <span className="flex items-center gap-2"><Volume2 className="h-3.5 w-3.5 text-signal-blue" /> Spoken attacks</span>
            <span className="flex items-center gap-2"><Crosshair className="h-3.5 w-3.5 text-signal-red" /> Live cross-examination</span>
            <span className="flex items-center gap-2"><Gavel className="h-3.5 w-3.5 text-signal-amber" /> Verdict card</span>
          </div>
        </div>
      </div>
    </section>
  );
}
