import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { reveal, viewport } from "./anim";

export const FinalCta = () => {
  return (
    <section
      data-testid="final-cta-section"
      className="bg-[#0a0a0a] grid-bg-dark text-white py-28 lg:py-40 text-center overflow-hidden"
    >
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={reveal}
        className="max-w-6xl mx-auto px-6"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
          Final — the verdict awaits
        </span>
        <h2 className="mt-6 font-display uppercase leading-[0.95] text-[clamp(3rem,10vw,8rem)]">
          Ship the<br />idea that{" "}
          <span className="inline-block bg-[#ff3b30] text-white px-4 -rotate-1">
            survives
          </span>
          <span className="text-[#ff3b30]">_</span>
        </h2>
        <p className="mt-8 max-w-2xl mx-auto text-white/60 font-body leading-relaxed">
          Most founders confirm their bias. The bold ones run the debate first.
          120 seconds and you&apos;ll know which one you are.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="/brand-kit"
            data-testid="final-cta-button"
            className="group inline-flex items-center gap-2 bg-[#ff3b30] text-white font-mono text-xs uppercase tracking-[0.2em] px-8 py-4 border-[1.5px] border-white hover:bg-white hover:text-black transition-colors duration-100"
          >
            Validate my idea
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#chamber"
            data-testid="final-secondary-cta"
            className="inline-flex items-center gap-2 bg-transparent text-white font-mono text-xs uppercase tracking-[0.2em] px-8 py-4 border-[1.5px] border-white/30 hover:border-white transition-colors duration-100"
          >
            Enter the chamber →
          </a>
        </div>

        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">
          — No card — Free during beta —
        </p>
      </motion.div>
    </section>
  );
};
