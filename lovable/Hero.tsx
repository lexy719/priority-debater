import { ArrowRight, ArrowUpRight, Star } from "lucide-react";
import { Dot, Eyebrow, Tag } from "./primitives";

const personas = [
  { code: "INV", label: "The Investor", sub: "Capital Efficiency", score: 6, tone: "bg-ink" },
  { code: "CUS", label: "The Customer", sub: "Willingness to pay", score: 5, tone: "bg-signal-red" },
  { code: "OPR", label: "The Operator", sub: "Execution risk", score: 7, tone: "bg-signal-blue" },
  { code: "ADV", label: "The Adversary", sub: "Competitive moat", score: 4, tone: "bg-signal-green" },
  { code: "MNT", label: "The Mentor", sub: "Founder-market fit", score: 8, tone: "bg-signal-amber" },
];

function ScoreBar({ value, tone }: { value: number; tone: string }) {
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className={`h-3 w-2.5 ${i < value ? tone : "bg-ink/10"}`}
        />
      ))}
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-ink/15 bg-paper grid-paper">
      <div className="mx-auto max-w-[1400px] px-6 pt-10 pb-20 lg:px-10 lg:pt-14 lg:pb-28">
        {/* meta row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-10">
          <div className="flex flex-wrap items-center gap-6 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <span className="flex items-center gap-2">
              <Dot color="red" />
              <span className="text-ink">Stress-Test Mode</span>
            </span>
            <span className="text-ink/30">/</span>
            <span>1,534 ideas debated · 7d</span>
            <span className="text-ink/30">/</span>
            <span className="text-signal-red">89% brutal</span>
          </div>
          <Tag tone="red">
            <Dot color="red" /> Live · 18:55
          </Tag>
        </div>

        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          {/* Left */}
          <div className="lg:col-span-7">
            <Eyebrow index="— 01" label="Verdict Engine" className="mb-8" />

            <h1 className="font-display text-[clamp(3.25rem,8vw,7.5rem)] leading-[0.92] tracking-[-0.03em] text-ink">
              Debate your <br />
              startup idea <br />
              until it <br />
              <span className="hl-red">breaks</span>
              <span className="text-signal-red">.</span>
            </h1>

            <p className="mt-10 max-w-xl text-lg leading-relaxed text-ink/80">
              Five ruthless AI advisors. One investor-grade report. Zero sugar-coating.
            </p>
            <p className="mt-3 max-w-xl text-lg leading-relaxed text-ink/70">
              Find out if your idea survives the panel — <strong className="text-ink">in 120 seconds.</strong>
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                id="validate"
                href="#input"
                className="group inline-flex items-center gap-3 border border-ink bg-ink px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-paper transition-all hover:bg-signal-red hover:border-signal-red"
              >
                Validate my idea
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#sample"
                className="group inline-flex items-center gap-3 border border-ink px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                See a real debate
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                No card · 120s
              </span>
            </div>

            <div className="mt-14 flex flex-wrap items-center gap-6">
              <div className="flex -space-x-1">
                {[
                  { i: "JM", c: "bg-signal-yellow" },
                  { i: "RK", c: "bg-signal-red text-paper" },
                  { i: "SN", c: "bg-signal-blue" },
                  { i: "AT", c: "bg-signal-green" },
                  { i: "LP", c: "bg-signal-amber" },
                ].map((p) => (
                  <span
                    key={p.i}
                    className={`grid h-7 w-7 place-items-center border border-ink font-mono text-[10px] ${p.c}`}
                  >
                    {p.i}
                  </span>
                ))}
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Used by <span className="hl-blue text-ink">3,400+ founders</span>
                <br />
                YC F24 · Antler · On Deck · Indie Hackers
              </p>
              <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <Star className="h-3 w-3 fill-signal-amber stroke-signal-amber" />
                Claude Sonnet 4.5
              </span>
            </div>
          </div>

          {/* Right — Debate room card */}
          <div className="relative lg:col-span-5">
            <div className="absolute right-3 -top-3 z-10 -rotate-2">
              <Tag tone="yellow">
                <Star className="h-3 w-3 fill-current" /> Claude Sonnet 4.5
              </Tag>
            </div>
            <div className="absolute -inset-x-2 inset-y-3 -rotate-[1.5deg] border border-ink/30 bg-paper-2" />
            <div className="relative border border-ink bg-card p-6 shadow-[8px_8px_0_0_var(--color-ink)]">
              <div className="flex items-center justify-between border-b border-ink/15 pb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                <span className="flex items-center gap-2 text-signal-red">
                  <Dot color="red" /> Debate room · Live · 00:42
                </span>
                <span>Session #4127</span>
              </div>

              <div className="pt-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Pitch
                </div>
                <p className="mt-2 font-serif text-lg leading-snug text-ink">
                  "A copilot for product ops teams that auto-writes PRDs from Linear + Notion + Slack."
                </p>
              </div>

              <div className="my-5 h-px w-full bg-ink/10" />

              <ul className="space-y-3.5">
                {personas.map((p) => (
                  <li key={p.code} className="grid grid-cols-[28px_1fr_auto] items-center gap-3">
                    <span className="grid h-6 w-7 place-items-center border border-ink/20 bg-paper font-mono text-[9px] uppercase tracking-wider text-ink">
                      {p.code}
                    </span>
                    <div className="leading-tight">
                      <div className="text-sm font-medium text-ink">{p.label}</div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                        {p.sub}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ScoreBar value={p.score} tone={p.tone} />
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {p.score}/10
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 border border-ink/15 bg-paper-2 p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal-red">
                  Objection · Customer
                </div>
                <p className="mt-2 font-mono text-xs leading-relaxed text-ink">
                  Why would a Series A buyer pay $42/seat when Linear is $8 and ships weekly?
                </p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-0 border border-ink/15">
                <div className="border-r border-ink/15 p-3">
                  <div className="-rotate-2 inline-block border border-ink/30 bg-paper px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Evidence-first · No vibes
                  </div>
                  <div className="mt-2 font-display text-base text-ink">CONDITIONAL</div>
                </div>
                <div className="border-r border-ink/15 p-3">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Score
                  </div>
                  <div className="mt-2 font-display text-2xl text-ink">
                    6.0<span className="ml-1 font-mono text-xs text-muted-foreground">/10</span>
                  </div>
                </div>
                <div className="p-3">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Risk
                  </div>
                  <div className="mt-2 font-display text-xl text-signal-red">HIGH</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}