"use client";

import { type MouseEvent } from "react";
import { Activity, ArrowRight, Store } from "lucide-react";
import { useFork, type Fork } from "@/components/home/ForkContext";

const ROWS = [
  { code: "INV", name: "The Investor", score: 5.4, color: "var(--c-red)", chipInk: false },
  { code: "CUS", name: "The Customer", score: 7.1, color: "var(--c-blue)", chipInk: false },
  { code: "OPS", name: "The Operator", score: 6.2, color: "var(--c-green)", chipInk: true },
  { code: "ADV", name: "The Adversary", score: 4.0, color: "var(--c-yellow)", chipInk: true },
  { code: "MEN", name: "The Mentor", score: 6.8, color: "rgba(245,244,240,0.55)", chipInk: false },
];

const AGENTS = [
  { name: "ChatGPT", rank: "names rival", color: "var(--c-orange)", ink: true },
  { name: "Claude", rank: "skips you", color: "var(--c-yellow)", ink: true },
  { name: "Gemini", rank: "mentions you", color: "var(--c-blue)", ink: false },
];

function SegBar({ value, color }: { value: number; color: string }) {
  const total = 14;
  const filled = Math.round((value / 10) * total);
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className="h-3 flex-1" style={{ background: i < filled ? color : "rgba(255,255,255,0.10)" }} />
      ))}
    </div>
  );
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function Hero() {
  const { fork, setFork } = useFork();
  const commerce = fork === "commerce";

  // Both hero CTAs scroll down to the live input section (#validate), switching
  // the fork first so it shows the right field: red idea pitch ↔ blue store URL.
  const jumpToInput = (target: Fork) => (e: MouseEvent) => {
    e.preventDefault();
    setFork(target);
    requestAnimationFrame(() =>
      document.getElementById("validate")?.scrollIntoView({ behavior: "smooth" }),
    );
  };

  return (
    <section id="top" className="relative overflow-hidden border-b border-ink/15 bg-paper grid-paper">
      <div className="mx-auto max-w-[1120px] px-6 pb-10 pt-7 lg:px-8 lg:pb-12 lg:pt-9">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-ink px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-paper">
                The Panel - OS for founders
              </span>
              <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/70">
                <span className="h-1.5 w-1.5 rounded-full bg-signal-green" /> Engine online
              </span>
            </div>

            <h1 className="mt-4 font-display text-[clamp(2rem,4.4vw,4rem)] leading-[0.86] tracking-[-0.01em] text-ink">
              {commerce ? (
                <>
                  Audit your <br />
                  store until <br />
                  AI agents <br />
                  <span className="hl-blue">recommend it</span>
                  <span className="text-signal-blue">_</span>
                </>
              ) : (
                <>
                  Debate your <br />
                  startup idea <br />
                  until it <br />
                  <span className="hl-red">breaks</span>
                  <span className="text-signal-red">_</span>
                </>
              )}
            </h1>

            <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-ink/75">
              Five ruthless AI advisors stress-test your pitch, or audit the store the AI agents
              will not recommend. Investor-grade, <strong className="text-ink">in 120 seconds.</strong>
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {commerce ? (
                <>
                  <a
                    href="#validate"
                    onClick={jumpToInput("commerce")}
                    className="group inline-flex items-center gap-2 bg-signal-blue px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-paper shadow-[4px_4px_0_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                  >
                    Audit my store <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </a>
                  <a
                    href="#validate"
                    onClick={jumpToInput("validate")}
                    className="inline-flex items-center gap-2 border-2 border-ink px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-ink hover:text-paper"
                  >
                    Validate an idea
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="#validate"
                    onClick={jumpToInput("validate")}
                    className="group inline-flex items-center gap-2 bg-signal-red px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-paper shadow-[4px_4px_0_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                  >
                    Validate my idea <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </a>
                  <a
                    href="#validate"
                    onClick={jumpToInput("commerce")}
                    className="inline-flex items-center gap-2 border-2 border-ink px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-ink hover:text-paper"
                  >
                    Audit my store
                  </a>
                </>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="text-signal-green">Start free - 50 credits</span>
              <span className="text-ink/25">/</span>
              <span>No card</span>
              <span className="text-ink/25">/</span>
              <span>{commerce ? "3 AI models" : "5 agents"}</span>
              <span className="text-ink/25">/</span>
              <span>{commerce ? "Live audit" : "120s verdict"}</span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="space-y-4">
              <div className="border border-ink bg-[#0c0c0c] text-paper shadow-[0_24px_70px_-24px_rgba(0,0,0,0.55)]">
                <div className="flex items-center justify-between border-b border-paper/10 px-4 py-3">
                  <span className="flex items-center gap-2 font-mono text-[11px] text-paper/85">
                    <Activity className="h-3.5 w-3.5 text-signal-green" /> PANEL_VERDICT.JSON
                  </span>
                  <span className="bg-signal-red px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-paper">
                    01 - Validate
                  </span>
                </div>
                <div className="border-b border-paper/10 px-4 py-2.5 font-mono text-[11px] leading-relaxed text-paper/45">
                  <span className="text-signal-green">&gt;</span> &quot;A copilot that auto-writes PRDs from Linear + Notion + Slack.&quot;
                </div>
                <div className="space-y-2.5 px-4 py-3.5">
                  {ROWS.map((r) => (
                    <div key={r.code} className="grid grid-cols-[34px_80px_1fr_24px] items-center gap-3">
                      <span
                        className="py-0.5 text-center font-mono text-[8px] font-bold uppercase tracking-wider"
                        style={{ background: r.color, color: r.chipInk ? "#000" : "#f5f4f0" }}
                      >
                        {r.code}
                      </span>
                      <span className="truncate font-mono text-[11px] text-paper/85">{r.name}</span>
                      <SegBar value={r.score} color={r.color} />
                      <span className="text-right font-mono text-[11px] text-paper/70">{fmt(r.score)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-end justify-between border-t border-paper/10 px-4 py-3.5">
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-paper/40">Synthesis verdict</div>
                    <div className="mt-1 font-display text-2xl uppercase tracking-wide text-paper">Conditional</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-4xl leading-none text-signal-red">6.0</div>
                    <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-signal-red">High risk</div>
                  </div>
                </div>
              </div>

              <div className="border border-ink bg-[#0c0c0c] text-paper shadow-[0_24px_70px_-24px_rgba(0,0,0,0.55)]">
                <div className="flex items-center justify-between border-b border-paper/10 px-4 py-3">
                  <span className="flex items-center gap-2 font-mono text-[11px] text-paper/85">
                    <Store className="h-3.5 w-3.5 text-signal-blue" /> STORE_AUDIT.JSON
                  </span>
                  <span className="bg-signal-blue px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-paper">
                    02 - Audit
                  </span>
                </div>
                <div className="flex items-end justify-between border-b border-paper/10 px-4 py-3">
                  <div>
                    <div className="font-display text-4xl leading-none text-signal-blue">47</div>
                    <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-paper/45">/100 AI visibility</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-paper/40">Recommended by</div>
                    <div className="mt-1 font-display text-xl uppercase text-paper">1 of 3 models</div>
                  </div>
                </div>
                <div className="px-4 py-2">
                  {AGENTS.map((a) => (
                    <div key={a.name} className="flex items-center justify-between border-b border-paper/[0.06] py-1.5 last:border-0">
                      <span className="font-mono text-[11px] text-paper/80">{a.name}</span>
                      <span
                        className="px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em]"
                        style={{ background: a.color, color: a.ink ? "#000" : "#f5f4f0" }}
                      >
                        {a.rank}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-paper/10 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/55">
                  <span className="text-signal-blue">-&gt;</span> 12 catalog fixes ready to ship
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
