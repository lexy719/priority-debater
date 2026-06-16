import { motion } from "framer-motion";
import { ArrowRight, Activity } from "lucide-react";

const AGENTS = [
  { code: "INV", name: "The Investor", color: "#ff3b30", score: 5.4, bars: 6 },
  { code: "CUS", name: "The Customer", color: "#007aff", score: 7.1, bars: 8 },
  { code: "OPS", name: "The Operator", color: "#32d74b", score: 6.2, bars: 7 },
  { code: "ADV", name: "The Adversary", color: "#ffd60a", score: 4.0, bars: 4 },
  { code: "MEN", name: "The Mentor", color: "#a3a3a3", score: 6.8, bars: 7 },
];

export const Hero = () => {
  return (
    <section
      id="top"
      data-testid="hero-section"
      className="relative grid-bg bg-[#f4f4f0] pt-28 lg:pt-36 pb-20 border-b-[1.5px] border-black overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-12 gap-12 items-center">
        {/* Left */}
        <div className="lg:col-span-7">
          <div className="flex items-center gap-3 mb-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] bg-black text-white px-2 py-1">
              Stress-test mode
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-black/50 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#32d74b] rounded-full animate-pulse" />
              Verdict engine online
            </span>
          </div>

          <h1 className="font-display text-[clamp(2.75rem,7.5vw,6.5rem)] leading-[0.98] uppercase tracking-tight">
            Debate your <br />
            startup idea <br />
            until it{" "}
            <span className="whitespace-nowrap">
              <span className="inline-block bg-[#ff3b30] text-white px-3 -rotate-1">
                breaks
              </span>
              <span className="text-[#ff3b30]">_</span>
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-base sm:text-lg text-black/70 font-body leading-relaxed">
            Five ruthless AI advisors. One investor-grade report. Zero
            sugar-coating. Find out if your idea survives the panel —{" "}
            <span className="text-black font-semibold">in 120 seconds.</span>
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="/brand-kit"
              data-testid="hero-primary-cta"
              className="group inline-flex items-center gap-2 bg-[#ff3b30] text-white font-mono text-xs uppercase tracking-[0.2em] px-7 py-4 border-[1.5px] border-black shadow-hard-sm hover:bg-black active:shadow-none active:translate-x-1 active:translate-y-1 transition-[box-shadow,transform,background-color] duration-100"
            >
              Validate my idea
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#chamber"
              data-testid="hero-secondary-cta"
              className="inline-flex items-center gap-2 bg-white text-black font-mono text-xs uppercase tracking-[0.2em] px-7 py-4 border-[1.5px] border-black shadow-hard-sm hover:bg-black hover:text-white active:shadow-none active:translate-x-1 active:translate-y-1 transition-[box-shadow,transform,background-color,color] duration-100"
            >
              Enter the chamber
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] text-black/45">
            <span>5 agents</span>
            <span>·</span>
            <span>7 rounds</span>
            <span>·</span>
            <span>120s synthesis</span>
            <span>·</span>
            <span className="text-[#32d74b]">No card required</span>
          </div>
        </div>

        {/* Right — scoring panel mock */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5"
        >
          <div className="bg-[#0a0a0a] border-[1.5px] border-black shadow-hard text-white">
            {/* header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/15">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
                <Activity size={12} className="text-[#32d74b]" /> panel_verdict.json
              </span>
              <span className="font-mono text-[10px] text-white/30">live</span>
            </div>

            {/* pitch line */}
            <div className="px-4 py-3 border-b border-white/10">
              <p className="font-mono text-[11px] text-white/40 leading-relaxed">
                <span className="text-[#32d74b]">›</span> &ldquo;A copilot for product ops teams that auto-writes PRDs from Linear + Notion + Slack.&rdquo;
              </p>
            </div>

            {/* agent rows */}
            <div className="divide-y divide-white/10">
              {AGENTS.map((a) => (
                <div key={a.code} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="font-mono text-[10px] font-bold px-1.5 py-0.5"
                    style={{ background: a.color, color: a.color === "#ffd60a" ? "#000" : "#fff" }}
                  >
                    {a.code}
                  </span>
                  <span className="font-body text-xs text-white/70 w-24 shrink-0">{a.name}</span>
                  <div className="flex gap-0.5 flex-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <span
                        key={i}
                        className="h-3 flex-1"
                        style={{ background: i < a.bars ? a.color : "rgba(255,255,255,0.08)" }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[11px] text-white/80 w-8 text-right">{a.score}</span>
                </div>
              ))}
            </div>

            {/* verdict */}
            <div className="flex items-center justify-between px-4 py-4 bg-white/[0.03] border-t border-white/15">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">Synthesis verdict</p>
                <p className="font-display text-3xl mt-1">CONDITIONAL</p>
              </div>
              <div className="text-right">
                <p className="font-display text-4xl text-white">6.0</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#ff3b30]">High risk</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
