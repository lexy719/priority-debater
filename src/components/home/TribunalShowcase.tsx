"use client";

import Link from "next/link";
import { ArrowRight, Bot, Crosshair, Gavel, Mic, Search, ShoppingBag, Volume2 } from "lucide-react";
import { useFork } from "@/components/home/ForkContext";
import { CHAMBER_AGENTS, CHAMBER_IDS } from "@/lib/chamber-personas";

const SEAT = {
  vk: "var(--c-red)",
  mr: "var(--c-blue)",
  ht: "var(--c-green)",
  lv: "var(--c-yellow)",
  es: "var(--c-magenta)",
} as const;

const COMMERCE_AGENTS = [
  { name: "ChatGPT", role: "The default buyer's pick", note: "Where most shoppers ask first.", color: "var(--c-green)" },
  { name: "Claude", role: "Reads your trust & policy", note: "Weighs returns, shipping, proof.", color: "var(--c-blue)" },
  { name: "Gemini", role: "Search-grounded answer", note: "Pulls live results into the reply.", color: "var(--c-yellow)" },
];

export function TribunalShowcase() {
  const { fork } = useFork();
  const commerce = fork === "commerce";

  return (
    <section id="chamber" className="scroll-mt-20 relative overflow-hidden border-b border-paper/10 bg-ink text-paper grid-paper-dark">
      <div className="relative mx-auto max-w-[1120px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="mb-7 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-paper/45">
              <span>{commerce ? "03 / The AI shoppers" : "03 / The Chamber"}</span>
              <span className={`flex items-center gap-1.5 border px-2 py-0.5 ${commerce ? "border-signal-blue/60 text-signal-blue" : "border-signal-red/60 text-signal-red"}`}>
                {commerce ? <Search className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                {commerce ? "They decide" : "They speak"}
              </span>
            </div>
            <h2 className="font-display text-[clamp(2.75rem,7vw,6rem)] leading-[0.9] tracking-[-0.02em]">
              {commerce ? (
                <>
                  Three models. <br />
                  One question: <br />
                  <span className="hl-blue">do they name you?</span>
                </>
              ) : (
                <>
                  Five agents. <br />
                  Five voices. <br />
                  <span className="hl-red">One verdict.</span>
                </>
              )}
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-[15px] leading-relaxed text-paper/65">
              {commerce
                ? "ChatGPT, Claude and Gemini are the new shop window. We run the exact questions your buyers ask through all three and capture, word for word, whether the sale comes to you — or to the competitor they keep naming instead."
                : "Not a chatbot wearing five hats: five separate AI agents, each with its own personality, attack axis and synthesized voice. They read the live transcript, build on each other's objections, judge every defense you type, and rule on your idea out loud."}
            </p>
          </div>
        </div>

        {commerce ? (
          <div className="mt-14 grid grid-cols-1 gap-px border border-paper/15 bg-paper/15 sm:grid-cols-3">
            {COMMERCE_AGENTS.map((a, i) => (
              <div key={a.name} className="group flex min-h-[240px] flex-col bg-ink p-6 transition-colors hover:bg-paper/[0.04]">
                <div className="flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center" style={{ background: a.color }}>
                    <Bot className="h-5 w-5 text-ink" />
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/35">Model 0{i + 1}</span>
                </div>
                <div className="mt-6 font-display text-2xl uppercase leading-none text-paper">{a.name}</div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: a.color }}>
                  {a.role}
                </div>
                <p className="mt-3 text-[12.5px] leading-relaxed text-paper/55">{a.note}</p>
                <div className="mt-auto flex items-center gap-2 pt-5 font-mono text-[9px] uppercase tracking-[0.16em] text-paper/40">
                  <span className="h-1 w-1 rounded-full" style={{ background: a.color }} /> Ask · read the answer · rank you
                </div>
              </div>
            ))}
          </div>
        ) : (
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
                    Own voice / own axis
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Link
            href={commerce ? "/commerce" : "/#validate"}
            className={`group inline-flex items-center gap-3 px-7 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-paper transition-colors hover:bg-paper hover:text-ink ${
              commerce ? "bg-signal-blue" : "bg-signal-red"
            }`}
          >
            {commerce ? "Audit your store" : "Validate my idea"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50">
            {commerce ? (
              <>
                <span className="flex items-center gap-2"><ShoppingBag className="h-3.5 w-3.5 text-signal-blue" /> Buyer prompts</span>
                <span className="flex items-center gap-2"><Crosshair className="h-3.5 w-3.5 text-signal-red" /> Competitor rank</span>
                <span className="flex items-center gap-2"><Gavel className="h-3.5 w-3.5 text-signal-amber" /> Fix verdict</span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-2"><Volume2 className="h-3.5 w-3.5 text-signal-blue" /> Spoken attacks</span>
                <span className="flex items-center gap-2"><Crosshair className="h-3.5 w-3.5 text-signal-red" /> Live cross-examination</span>
                <span className="flex items-center gap-2"><Gavel className="h-3.5 w-3.5 text-signal-amber" /> Verdict card</span>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
