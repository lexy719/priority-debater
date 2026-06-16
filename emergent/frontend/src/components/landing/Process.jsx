import { motion } from "framer-motion";
import { PenLine, ShieldHalf, FileText } from "lucide-react";
import { reveal, viewport } from "./anim";

const STEPS = [
  {
    n: "01",
    icon: PenLine,
    title: "Pitch it",
    desc: "One screen. Describe what you're building, who pays, and why now. 60 seconds to enter the chamber.",
  },
  {
    n: "02",
    icon: ShieldHalf,
    title: "Survive the chamber",
    desc: "Five agents debate across seven rounds — attack, defend, synthesize. Every word logged and traceable.",
  },
  {
    n: "03",
    icon: FileText,
    title: "Get the dossier",
    desc: "An investor-grade report with audited scores, risk flags and a 30-day plan. Shareable, exportable.",
  },
];

export const Process = () => {
  return (
    <section
      data-testid="process-section"
      className="bg-[#f4f4f0] grid-bg py-24 lg:py-32 border-b-[1.5px] border-black"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={reveal}>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-black/40">
            05 — How it works
          </span>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl uppercase leading-[0.9]">
            Idea in.{" "}
            <span className="bg-[#ff3b30] text-white px-2">Verdict out.</span>
          </h2>
        </motion.div>

        <div className="mt-14 grid md:grid-cols-3 border-t-[1.5px] border-black">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              variants={reveal}
              className="relative p-8 border-b-[1.5px] border-black md:border-b-0 md:border-r-[1.5px] last:border-r-0 group hover:bg-white transition-colors duration-150"
            >
              <div className="flex items-start justify-between">
                <span className="font-display text-6xl text-black/10 group-hover:text-[#ff3b30] transition-colors duration-150 leading-none">
                  {s.n}
                </span>
                <s.icon size={26} strokeWidth={1.75} className="text-black mt-2" />
              </div>
              <h3 className="mt-8 font-body font-bold uppercase text-lg tracking-wide">{s.title}</h3>
              <p className="mt-3 text-sm text-black/60 font-body leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
