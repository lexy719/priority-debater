import { ArrowRight, Check, Star } from "lucide-react";
import { Eyebrow } from "./primitives";

const tiers = [
  {
    name: "Starter",
    price: "€19",
    credits: "150 credits",
    tag: "Validate before you build.",
    features: ["3 AI startup validations", "Full TAM / SAM / SOM", "Competitor map", "Viability + risk flags", "Shareable dossier"],
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
    features: ["25 validations + 2 deep-dives", "2 full investor business plans", "Brand strategy + visual identity", "GTM strategy + landing copy", "Marketing concept suite", "MVP roadmap"],
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 border-b border-ink/15 bg-paper grid-paper">
      <div className="mx-auto max-w-[1120px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="grid items-start gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Eyebrow index="— 06" label="Pricing" className="mb-8" />
            <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.92] tracking-[-0.02em] text-ink">
              Fair. Blunt. <br />
              <span className="hl-blue">Cheaper than a consultant.</span>
            </h2>
          </div>
          <div className="lg:col-span-5">
            <div className="border-2 border-ink bg-signal-yellow p-6 shadow-[6px_6px_0_0_var(--color-ink)]">
              <div className="font-display text-2xl uppercase tracking-wide text-ink">Start free.</div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink/80">
                Every account gets 50 free credits — no card to begin. Upgrade to a monthly plan or
                top up anytime. See full plans on the pricing page.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-px border-2 border-ink bg-ink lg:grid-cols-3">
          {tiers.map((t) => (
            <div key={t.name} className={`relative flex flex-col p-8 ${t.popular ? "bg-signal-yellow text-ink" : "bg-paper text-ink"}`}>
              {t.popular && (
                <div className="absolute -top-3 left-8">
                  <span className="inline-flex items-center gap-1.5 bg-ink px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-signal-yellow">
                    <Star className="h-3 w-3 fill-current" /> Most flexible
                  </span>
                </div>
              )}
              <div className="flex items-start justify-between">
                <span className="font-display text-xl uppercase">{t.name}</span>
                <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${t.popular ? "text-ink/60" : "text-muted-foreground"}`}>
                  {t.tag}
                </span>
              </div>
              <div className="mt-6 font-display text-6xl leading-none">{t.price}</div>
              <div className={`mt-2 font-mono text-[11px] uppercase tracking-[0.22em] ${t.popular ? "text-ink/60" : "text-muted-foreground"}`}>
                {t.credits}
              </div>
              <div className={`my-6 h-px w-full ${t.popular ? "bg-ink/25" : "bg-ink/15"}`} />
              <ul className="flex-1 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13px]">
                    <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${t.popular ? "text-ink" : "text-signal-red"}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/pricing"
                className={`group mt-8 inline-flex items-center justify-center gap-2 px-5 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-colors ${
                  t.popular
                    ? "bg-ink text-paper hover:bg-signal-red"
                    : "bg-signal-red text-paper hover:bg-ink"
                }`}
              >
                Choose plan
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
