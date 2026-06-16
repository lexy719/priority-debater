import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { reveal, viewport } from "./anim";

const FAQS = [
  {
    q: "Is this really useful before I have a product?",
    a: "That's exactly when it's most useful. The panel pressure-tests the idea, the market and the economics before you spend months building. Validate the thesis, then build the thing that survives.",
  },
  {
    q: "How adversarial is 'adversarial', exactly?",
    a: "The Adversary's entire job is to argue why your idea dies — citing comparable failures and structural weaknesses. The other four push back. You watch the debate and respond. Nothing gets a free pass.",
  },
  {
    q: "How is the score calculated?",
    a: "Each agent scores 0–10 across its domain (economics, demand, execution, defensibility, narrative). The synthesis engine weights and reconciles them into one verdict with a risk band. Every number is traceable.",
  },
  {
    q: "Is any of the data faked?",
    a: "No. Market sizes and competitor data are pulled from web-enriched sources and cited. When evidence is thin, the report says so with an honest empty state rather than inventing numbers.",
  },
  {
    q: "Can I share or export the report?",
    a: "Yes. Every dossier exports to a clean PDF built to be read by cofounders and investors — verdict, charts, risk flags and a 30-day action plan included.",
  },
  {
    q: "What happens to my pitch?",
    a: "Your pitch stays private to your account. We don't train public models on it, and you can delete it at any time. Every debate transcript is logged for your own audit, not shared.",
  },
];

export const Faq = () => {
  const [open, setOpen] = useState(0);

  return (
    <section
      id="faq"
      data-testid="faq-section"
      className="bg-[#f4f4f0] grid-bg py-24 lg:py-32 border-b-[1.5px] border-black"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-12 gap-12">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={reveal}
          className="lg:col-span-4"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-black/40">
            07 — Common objections
          </span>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl uppercase leading-[0.9]">
            The panel<br />debates{" "}
            <span className="bg-[#ffd60a] text-black px-2">itself, too.</span>
          </h2>
          <p className="mt-6 text-sm text-black/55 font-body leading-relaxed max-w-xs">
            The honest answers to the questions you'd ask before trusting a verdict.
          </p>
        </motion.div>

        <div className="lg:col-span-8 border-t-[1.5px] border-black">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                data-testid={`faq-accordion-item-${i}`}
                className="border-b-[1.5px] border-black"
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  data-testid={`faq-trigger-${i}`}
                  className="w-full flex items-center justify-between gap-6 py-5 text-left group"
                >
                  <span className="font-body font-bold uppercase text-sm sm:text-base tracking-wide group-hover:text-[#ff3b30] transition-colors">
                    {item.q}
                  </span>
                  <span className="shrink-0 w-7 h-7 grid place-items-center border-[1.5px] border-black font-mono">
                    {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 pr-12 text-sm text-black/65 font-body leading-relaxed">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
