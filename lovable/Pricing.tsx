import { ArrowRight, Check, Star } from "lucide-react";
import { Eyebrow, Tag } from "./primitives";

const tiers = [
  {
    name: "Starter",
    price: "€19",
    credits: "150 credits",
    tag: "Validate before you build.",
    features: ["3 AI startup validations", "Full TAM / SAM / SOM", "Competitor map", "Viability + risk flags", "PDF export"],
    popular: false,
  },
  {
    name: "Builder",
    price: "€49",
    credits: "700 credits",
    tag: "Most flexible plan.",
    features: ["10 validations", "GO / NO-GO decision report", "ICP + positioning strategy", "Brand strategy preview", "Unlimited persona debates", "Pricing strategy preview"],
    popular: true,
  },
  {
    name: "Founder",
    price: "€99",
    credits: "1,500 credits",
    tag: "Best value.",
    features: ["25 validations + 2 market deep-dives", "2 full investor business plans", "Brand strategy + visual identity", "GTM strategy + landing copy", "Marketing concept suite", "MVP roadmap"],
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-b border-ink/15 bg-paper-2">
      <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Eyebrow index="04" label="/ Pricing" className="mb-8" />
            <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.95] tracking-[-0.02em] text-ink">
              Fair. Blunt. <br />
              <span className="hl-blue">Cheaper than a consultant.</span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pt-24">
            <p className="max-w-md text-[14px] leading-relaxed text-ink/70">
              Start with 70 free credits. No card. No subscription. Credits never expire.
            </p>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px border border-ink bg-ink/15 lg:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col p-8 ${t.popular ? "bg-paper" : "bg-paper"}`}
            >
              {t.popular && (
                <div className="absolute -top-3 left-8">
                  <Tag tone="blue">
                    <Star className="h-3 w-3 fill-current" /> Popular
                  </Tag>
                </div>
              )}
              <div className="flex items-start justify-between">
                <span className="font-display text-xl uppercase text-ink">{t.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t.tag}
                </span>
              </div>
              <div className="mt-6 font-display text-6xl leading-none text-ink">{t.price}</div>
              <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {t.credits}
              </div>
              <div className="my-6 h-px w-full bg-ink/15" />
              <ul className="flex-1 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13px] text-ink/80">
                    <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${t.popular ? "text-signal-blue" : "text-signal-red"}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#cta"
                className={`group mt-8 inline-flex items-center justify-center gap-2 border border-ink px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.2em] transition-all ${
                  t.popular ? "bg-ink text-paper hover:bg-signal-red hover:border-signal-red" : "bg-paper text-ink hover:bg-ink hover:text-paper"
                }`}
              >
                Get {t.name}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}