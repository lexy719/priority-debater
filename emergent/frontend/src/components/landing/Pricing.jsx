import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { reveal, viewport } from "./anim";

const TIERS = [
  {
    id: "starter",
    name: "Starter",
    tag: "Most flexible",
    price: "€19",
    credits: "150 credits",
    featured: false,
    features: [
      "3 AI startup validations",
      "Full TAM / SAM / SOM",
      "Competitor map",
      "Visibility + risk flags",
      "PDF export",
    ],
  },
  {
    id: "builder",
    name: "Builder",
    tag: "Best value",
    price: "€49",
    credits: "700 credits",
    featured: true,
    features: [
      "10 validations",
      "GO / NO-GO decision report",
      "ICP + positioning strategy",
      "Brand strategy preview",
      "Unlimited personal debates",
      "Pricing strategy preview",
    ],
  },
  {
    id: "founder",
    name: "Founder",
    tag: "For the long haul",
    price: "€99",
    credits: "1,500 credits",
    featured: false,
    features: [
      "25 validations + 2 deep-dives",
      "2 full investor business plans",
      "GTM strategy + visual identity",
      "Marketing concept suite",
      "MVP roadmap",
    ],
  },
];

export const Pricing = () => {
  return (
    <section
      id="pricing"
      data-testid="pricing-section"
      className="bg-[#f4f4f0] grid-bg py-24 lg:py-32 border-b-[1.5px] border-black"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={reveal}
          className="grid lg:grid-cols-2 gap-8 items-end"
        >
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-black/40">
              06 — Pricing
            </span>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl uppercase leading-[0.88]">
              Fair. Blunt.<br />
              <span className="bg-[#007aff] text-white px-2">Cheaper than a consultant.</span>
            </h2>
          </div>
          <div className="bg-[#ffd60a] border-[1.5px] border-black p-5 shadow-hard-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1">Free during beta</p>
            <p className="text-sm font-body text-black/80 leading-relaxed">
              No card, no credits needed — run validations and debate on us. The
              tiers below are the planned pricing once billing goes live.
            </p>
          </div>
        </motion.div>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {TIERS.map((t, i) => (
            <motion.div
              key={t.id}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              variants={reveal}
              data-testid={`pricing-card-${t.id}`}
              className={`flex flex-col border-[1.5px] border-black p-7 shadow-hard ${
                t.featured ? "bg-[#ffd60a]" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-body font-bold uppercase tracking-wide text-lg">{t.name}</h3>
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] border border-black px-2 py-1">
                  {t.tag}
                </span>
              </div>
              <div className="mt-6 flex items-end gap-2">
                <span className="font-display text-6xl leading-none">{t.price}</span>
                <span className="font-mono text-[11px] text-black/50 mb-1.5">/mo</span>
              </div>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-black/60">
                {t.credits}
              </p>

              <ul className="mt-7 space-y-3 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-sm font-body text-black/75">
                    <Check size={17} className="text-[#ff3b30] shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                data-testid={`pricing-cta-${t.id}`}
                className={`mt-8 inline-flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] px-6 py-4 border-[1.5px] border-black transition-colors duration-100 ${
                  t.featured
                    ? "bg-black text-white hover:bg-white hover:text-black"
                    : "bg-[#ff3b30] text-white hover:bg-black"
                }`}
              >
                Start free → beta <ArrowRight size={15} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
