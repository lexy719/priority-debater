import { ArrowRight, ArrowUpRight, Activity } from "lucide-react";

const ROWS = [
  { code: "INV", name: "The Investor", score: 5.4, color: "var(--c-red)", chipInk: false },
  { code: "CUS", name: "The Customer", score: 7.1, color: "var(--c-blue)", chipInk: false },
  { code: "OPS", name: "The Operator", score: 6.2, color: "var(--c-green)", chipInk: true },
  { code: "ADV", name: "The Adversary", score: 4.0, color: "var(--c-yellow)", chipInk: true },
  { code: "MEN", name: "The Mentor", score: 6.8, color: "rgba(245,244,240,0.55)", chipInk: false },
];

function SegBar({ value, color }: { value: number; color: string }) {
  const total = 14;
  const filled = Math.round((value / 10) * total);
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="h-3 flex-1"
          style={{ background: i < filled ? color : "rgba(255,255,255,0.10)" }}
        />
      ))}
    </div>
  );
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-ink/15 bg-paper grid-paper">
      <div className="mx-auto max-w-[1120px] px-6 pt-12 pb-16 lg:px-8 lg:pt-16 lg:pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left */}
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-ink px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-paper">
                Stress-test mode
              </span>
              <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/70">
                <span className="h-1.5 w-1.5 rounded-full bg-signal-green" /> Verdict engine online
              </span>
            </div>

            <h1 className="mt-6 font-display text-[clamp(2.75rem,6vw,5.75rem)] leading-[0.85] tracking-[-0.01em] text-ink">
              Debate your <br />
              startup idea <br />
              until it <br />
              <span className="hl-red">breaks</span>
              <span className="text-signal-red">_</span>
            </h1>

            <p className="mt-8 max-w-lg text-base leading-relaxed text-ink/75">
              Five ruthless AI advisors. One investor-grade report. Zero sugar-coating.
              <br />
              Find out if your idea survives the panel — <strong className="text-ink">in 120 seconds.</strong>
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3.5">
              <a
                href="#validate"
                className="group inline-flex items-center gap-3 bg-signal-red px-6 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-paper transition-colors hover:bg-ink"
              >
                Validate my idea
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#chamber"
                className="group inline-flex items-center gap-3 border-2 border-ink px-6 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-ink shadow-[5px_5px_0_0_var(--color-ink)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                See the Chamber
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>5 agents</span>
              <span className="text-ink/25">·</span>
              <span>7 rounds</span>
              <span className="text-ink/25">·</span>
              <span>120s synthesis</span>
              <span className="text-ink/25">·</span>
              <span className="text-signal-green">No card required</span>
            </div>
          </div>

          {/* Right — PANEL_VERDICT.JSON artifact */}
          <div className="lg:col-span-5">
            <div className="border border-ink bg-[#0c0c0c] text-paper shadow-[0_24px_70px_-24px_rgba(0,0,0,0.55)]">
              {/* header */}
              <div className="flex items-center justify-between border-b border-paper/10 px-4 py-3">
                <span className="flex items-center gap-2 font-mono text-[11px] text-paper/85">
                  <Activity className="h-3.5 w-3.5 text-signal-green" /> PANEL_VERDICT.JSON
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-signal-green">
                  <span className="h-1.5 w-1.5 rounded-full bg-signal-green" /> Live
                </span>
              </div>

              {/* pitch quote */}
              <div className="border-b border-paper/10 px-4 py-3 font-mono text-[11px] leading-relaxed text-paper/45">
                <span className="text-signal-green">&gt;</span> &quot;A copilot for product ops teams that
                auto-writes PRDs from Linear + Notion + Slack.&quot;
              </div>

              {/* rows */}
              <div className="space-y-3 px-4 py-4">
                {ROWS.map((r) => (
                  <div key={r.code} className="grid grid-cols-[34px_84px_1fr_24px] items-center gap-3">
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

              {/* verdict footer */}
              <div className="flex items-end justify-between border-t border-paper/10 px-4 py-4">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-paper/40">Synthesis verdict</div>
                  <div className="mt-1 font-display text-3xl uppercase tracking-wide text-paper">Conditional</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-5xl leading-none text-signal-red">6.0</div>
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-signal-red">High risk</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
