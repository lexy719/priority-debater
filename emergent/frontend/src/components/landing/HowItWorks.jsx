import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { reveal, viewport } from "./anim";

const POINTS = [
  "Five perspectives, scored 0–10: investor, customer, operator, adversary, mentor.",
  "Context-aware: addressable market, use-cases, evidence support.",
  "No “trust us” — every claim is traceable to source.",
];

export const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      data-testid="how-it-works-section"
      className="bg-[#0a0a0a] grid-bg-dark text-white py-24 lg:py-32 border-b-[1.5px] border-black"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-14 items-center">
        <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={reveal}>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
            02 — Input
          </span>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl uppercase leading-[0.9]">
            Drop the pitch.<br />
            The panel handles{" "}
            <span className="bg-[#ffd60a] text-black px-2">the rest.</span>
          </h2>
          <p className="mt-6 max-w-lg text-white/60 font-body leading-relaxed">
            Tell us what you&apos;re building, who pays, and why now. The panel
            turns it into a structured stress-test, then the synthesis engine
            writes your dossier.
          </p>

          <ul className="mt-8 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-3 text-sm text-white/75 font-body">
                <Check size={18} className="text-[#32d74b] shrink-0 mt-0.5" />
                <span>{p}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-2">
            {["~2 min", "No card required", "Audited scoring", "Honest empty states"].map((t) => (
              <span
                key={t}
                className="font-mono text-[10px] uppercase tracking-[0.15em] border border-white/20 text-white/50 px-3 py-1.5"
              >
                {t}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Terminal mock */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={reveal}
          data-testid="terminal-input-mock"
          className="border border-white/20 bg-black shadow-[6px_6px_0_0_#ff3b30]"
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/15">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#ff3b30]" />
              <span className="w-2.5 h-2.5 bg-[#ffd60a]" />
              <span className="w-2.5 h-2.5 bg-[#32d74b]" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              pitch.txt
            </span>
          </div>
          <div className="p-5 font-mono text-[13px] leading-relaxed text-white/80 min-h-[260px]">
            <p className="text-white/40"># describe your idea</p>
            <p className="mt-3">
              <span className="text-[#32d74b]">$</span> We&apos;re building an AI
              that drafts investor updates from your
            </p>
            <p>&nbsp;&nbsp;product analytics in one click. Target: seed-stage</p>
            <p>&nbsp;&nbsp;founders who hate writing.</p>
            <p className="mt-3 text-[#007aff]">→ market: who exactly pays?</p>
            <p className="text-white/90">
              &nbsp;&nbsp;Seed &amp; Series-A founders, ~40k in EU/US
              <span className="cursor-blink text-[#32d74b]">▋</span>
            </p>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/15">
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.15em]">
              420 / 2000 chars
            </span>
            <button
              data-testid="terminal-run-button"
              className="font-mono text-[10px] uppercase tracking-[0.2em] bg-[#ff3b30] text-white px-4 py-2 hover:bg-white hover:text-black transition-colors"
            >
              Run validation →
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
