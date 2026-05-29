import { FileText, Gauge, Users } from "lucide-react";
import { Eyebrow } from "./primitives";

const steps = [
  {
    n: "01",
    kind: "Intake",
    icon: FileText,
    title: "A founder brief that forces the right detail.",
    body: "One dense hero pitch: what you are building, who pays, the pain, why now, and what is hard. The panel expands it into the same structured stress-test the API expects.",
  },
  {
    n: "02",
    kind: "Debate",
    icon: Users,
    title: "Five expert voices attack the same idea.",
    body: "Investor, customer, operator, adversary, and mentor each score the idea from their own angle. Agreement is earned, not assumed.",
  },
  {
    n: "03",
    kind: "Decision",
    icon: Gauge,
    title: "A verdict you can act on before Monday.",
    body: "You leave with a score, risk map, objection bank, evidence gaps, and a short next-step plan. The answer is not vague.",
  },
];

export function Engine() {
  return (
    <section id="personas" className="border-b border-ink/15 bg-paper grid-paper">
      <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <Eyebrow index="03" label="/ The Engine" className="mb-8" />
            <h2 className="font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.96] tracking-[-0.02em] text-ink">
              A decision room <br />
              <span className="hl-blue">with a pulse.</span>
            </h2>
            <p className="mt-8 max-w-md text-base leading-relaxed text-ink/70">
              Every section is designed to move the idea from instinct to evidence: fast validation, adversarial reasoning, and an output founders can use.
            </p>
          </div>

          <div className="lg:col-span-7 space-y-5">
            {steps.map(({ icon: Icon, ...s }) => (
              <div key={s.n} className="border border-ink bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-ink)]">
                <div className="flex items-start gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center border border-ink/30 bg-paper">
                    <Icon className="h-4 w-4 text-ink" />
                  </span>
                  <div className="flex-1">
                    <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                      <span className="text-signal-blue">{s.n}</span> <span className="text-ink/30">/</span> {s.kind}
                    </div>
                    <h3 className="mt-2 font-display text-lg uppercase leading-tight text-ink">
                      {s.title}
                    </h3>
                    <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink/75">{s.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* sample report */}
      <div className="border-t border-ink/15 bg-paper-2">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-6 py-24 lg:grid-cols-12 lg:px-10">
          <div className="lg:col-span-5">
            <Eyebrow index="03.5" label="/ Sample" className="mb-8" />
            <h2 className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-[0.96] tracking-[-0.02em] text-ink">
              A real report, <br /> in cold metrics.
            </h2>
            <p className="mt-8 max-w-md text-[14px] leading-relaxed text-ink/70">
              Every Idea Debater report ships with numbers a Tier-1 fund partner would recognize. No fluff. No vibes.
            </p>
          </div>
          <div className="lg:col-span-7">
            <div className="grid grid-cols-3 gap-px border border-ink bg-ink">
              {[
                { k: "Viability Score", v: "82", u: "/ 100" },
                { k: "Confidence", v: "HIGH", u: "" },
                { k: "TAM", v: "$2.1B", u: "global" },
                { k: "SAM", v: "$420M", u: "serviceable" },
                { k: "SOM", v: "$42M", u: "obtainable" },
                { k: "Competitors", v: "5", u: "named" },
              ].map((m) => (
                <div key={m.k} className="bg-card p-6">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {m.k}
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-3xl text-ink lg:text-4xl">{m.v}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {m.u}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}