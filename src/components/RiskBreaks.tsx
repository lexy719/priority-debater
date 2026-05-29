import { ArrowRight } from "lucide-react";
import { Eyebrow } from "./primitives";

const axes = [
  { k: "Problem Fit", v: 82, tone: "text-signal-green" },
  { k: "Market Pull", v: 68, tone: "text-paper" },
  { k: "Timing", v: 74, tone: "text-paper" },
  { k: "Business Model", v: 48, tone: "text-signal-red" },
  { k: "Competition", v: 44, tone: "text-signal-red" },
  { k: "Execution Edge", v: 58, tone: "text-paper" },
];

const deliverables = [
  { n: "01", t: "Verdict Score", b: "GO, Caution, or No-Go — a single defensible call backed by a visible 8-axis model." },
  { n: "02", t: "Risk Radar", b: "Assumptions ranked by likelihood, blast radius, and the evidence you're still missing." },
  { n: "03", t: "5-Persona Debate", b: "Investor, customer, operator, adversary, and mentor — each in character, on the record." },
  { n: "04", t: "Proof Sprint", b: "The smallest test that can flip the decision. Shipped with every report." },
];

export function RiskBreaks() {
  return (
    <section className="border-b border-paper/10 bg-ink text-paper grid-paper-dark">
      <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Eyebrow index="04" label="/ Risk Analysis" className="mb-8 text-paper/60" />
            <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.95] tracking-[-0.02em] text-paper">
              Where it <br />
              <span className="hl-red">breaks.</span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pt-24">
            <p className="max-w-md text-[14px] leading-relaxed text-paper/70">
              Every report surfaces the assumptions investors test first, the trades behind market fit, and the open risk gaps that make scaling dangerous.
            </p>
          </div>
        </div>

        <div className="mt-14 border border-paper/15">
          <div className="grid grid-cols-1 gap-px bg-paper/15 sm:grid-cols-2 lg:grid-cols-3">
            {axes.map((a) => (
              <div key={a.k} className="bg-ink p-6">
                <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper/55">
                  {a.k}
                </div>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className={`font-display text-5xl ${a.tone}`}>{a.v}</span>
                  <span className="font-mono text-xs text-paper/40">/ 100</span>
                </div>
                <div className="mt-4 h-1.5 w-full bg-paper/10">
                  <div className={`h-full ${a.v < 50 ? "bg-signal-red" : a.v < 70 ? "bg-signal-amber" : "bg-signal-green"}`} style={{ width: `${a.v}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-px border-t border-paper/15 bg-paper/15 lg:grid-cols-[200px_1fr_280px]">
            <div className="bg-ink p-6">
              <div className="font-display text-5xl text-paper">62</div>
              <div className="mt-2 inline-flex border border-signal-amber px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-signal-amber">
                ● Caution
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/40">
                Verdict Score · / 100
              </div>
            </div>
            <div className="bg-ink p-6">
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper/55">
                Case #017 · Sample Report
              </div>
              <h3 className="mt-2 font-display text-2xl text-paper">LINDEN — RIDESHARE FOR ELDERS</h3>
              <p className="mt-3 text-[13px] leading-relaxed text-paper/65">
                The buyer pain is real — but unit economics are brutal and Uber Health is already circling.
              </p>
            </div>
            <a href="#sample" className="group flex flex-col justify-between bg-signal-red p-6 text-ink transition-colors hover:bg-paper">
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink/70">
                Full Report
              </div>
              <div className="mt-6 flex items-center justify-between font-display text-lg uppercase">
                See the dossier
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </div>
            </a>
          </div>
        </div>

        {/* output */}
        <div id="sample" className="mt-24 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Eyebrow index="04.5" label="/ Output" className="mb-8 text-paper/60" />
            <h2 className="font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.95] tracking-[-0.02em] text-paper">
              What ships <br />
              <span className="hl-red">in the envelope.</span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pt-20">
            <p className="max-w-md text-[14px] leading-relaxed text-paper/70">
              Four artifacts. One envelope. Each one defensible on its own, devastating in combination.
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-px border border-paper/15 bg-paper/15 sm:grid-cols-2 lg:grid-cols-4">
          {deliverables.map((d) => (
            <div key={d.n} className="group bg-ink p-6 transition-colors hover:bg-[oklch(0.2_0.01_60)]">
              <span className="grid h-9 w-9 place-items-center bg-signal-red text-ink">
                <span className="font-mono text-[10px]">{d.n}</span>
              </span>
              <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/45">
                Deliverable {d.n}
              </div>
              <h3 className="mt-1 font-display text-lg uppercase text-paper">{d.t}</h3>
              <p className="mt-3 text-[13px] leading-relaxed text-paper/65">{d.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}