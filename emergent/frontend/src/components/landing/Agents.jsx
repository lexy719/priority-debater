import { motion } from "framer-motion";
import { reveal, viewport } from "./anim";

const AGENTS = [
  {
    seat: "01",
    initials: "VK",
    name: "Vera Klein",
    role: "The Investor",
    color: "#ff3b30",
    desc: "Unit economics, CAC/LTV, fundability, capital efficiency.",
  },
  {
    seat: "02",
    initials: "MR",
    name: "Marcus Reid",
    role: "The Customer",
    color: "#007aff",
    desc: "Buyer reality, switching cost, procurement, willingness to pay.",
  },
  {
    seat: "03",
    initials: "HT",
    name: "Hiro Tanaka",
    role: "The Operator",
    color: "#32d74b",
    desc: "Execution surface, scaling, org fit, growth moats, tech risk.",
  },
  {
    seat: "04",
    initials: "LV",
    name: "Dr. Lena Voss",
    role: "The Adversary",
    color: "#ffd60a",
    desc: "Thesis fatalism, defensibility, why this dies like the others.",
  },
  {
    seat: "05",
    initials: "ES",
    name: "Eduardo Salgado",
    role: "The Mentor",
    color: "#a78bfa",
    desc: "Compounding advantage, founder narrative, lessons from failure.",
  },
];

export const Agents = () => {
  return (
    <section
      id="chamber"
      data-testid="agents-section"
      className="bg-[#0a0a0a] grid-bg-dark text-white py-24 lg:py-32 border-b-[1.5px] border-black"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={reveal}>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
            03 — The Chamber
          </span>
          <div className="mt-5 grid lg:grid-cols-2 gap-8 items-end">
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl uppercase leading-[0.88]">
              Five agents.<br />
              Five voices.<br />
              <span className="bg-[#ff3b30] text-white px-2">One verdict.</span>
            </h2>
            <p className="text-white/60 font-body leading-relaxed max-w-md lg:pb-2">
              Not a chatbot wearing five hats — five separate AI agents, each with
              its own personality. They attack your idea, build on each other&apos;s
              objections, and rule on every defense you type.
            </p>
          </div>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {AGENTS.map((a, i) => (
            <motion.div
              key={a.seat}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              variants={reveal}
              data-testid={`agent-card-${i + 1}`}
              className="group relative bg-black border border-white/15 p-5 hover:border-transparent transition-colors duration-100"
              style={{ "--accent": a.color }}
            >
              <span
                className="absolute inset-0 border-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-100 pointer-events-none"
                style={{ borderColor: a.color }}
              />
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
                  Seat {a.seat}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
                  listening
                </span>
              </div>
              <div
                className="mt-6 w-12 h-12 grid place-items-center font-display text-xl"
                style={{ background: a.color, color: a.color === "#ffd60a" ? "#000" : "#fff" }}
              >
                {a.initials}
              </div>
              <h3 className="mt-4 font-body font-bold text-base leading-tight">{a.name}</h3>
              <p
                className="font-mono text-[10px] uppercase tracking-[0.18em] mt-1"
                style={{ color: a.color === "#ffd60a" ? "#ffd60a" : a.color }}
              >
                {a.role}
              </p>
              <p className="mt-4 text-xs text-white/50 font-body leading-relaxed">{a.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a
            href="#pricing"
            data-testid="agents-cta"
            className="font-mono text-[11px] uppercase tracking-[0.2em] bg-[#ff3b30] text-white px-6 py-3.5 border border-black hover:bg-white hover:text-black transition-colors"
          >
            Enter the chamber →
          </a>
          <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
            <span>Survive 7 rounds</span>
            <span>·</span>
            <span>5 shields</span>
            <span>·</span>
            <span>Every word logged</span>
          </div>
        </div>
      </div>
    </section>
  );
};
