import { motion } from "framer-motion";
import {
  BarChart3,
  Target,
  TrendingUp,
  Swords,
  Wallet,
  Map,
  Users,
  ListChecks,
  ShieldCheck,
  Share2,
  ArrowRight,
} from "lucide-react";
import { reveal, viewport } from "./anim";

const SECTIONS = [
  { code: "§01", icon: BarChart3, title: "Overview", desc: "Verdict, score, risk band, one-line call." },
  { code: "§02", icon: Target, title: "Market", desc: "TAM / SAM / SOM, sized with sources." },
  { code: "§03", icon: TrendingUp, title: "Risk", desc: "Where it breaks, ranked by severity." },
  { code: "§04", icon: Swords, title: "Competition", desc: "Honest competitor map, positioning gaps." },
  { code: "§05", icon: Wallet, title: "Financials", desc: "Unit economics, burn, break-even." },
  { code: "§06", icon: Map, title: "Roadmap", desc: "MVP slices, build order, sequencing." },
  { code: "§07", icon: Users, title: "Personas", desc: "Ideal customer profile, buyer triggers." },
  { code: "§08", icon: ListChecks, title: "Actions", desc: "Prioritized 30-day operating plan." },
];

export const Dossier = () => {
  return (
    <section
      id="dossier"
      data-testid="dossier-section"
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
              04 — The Dossier
            </span>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl uppercase leading-[0.88]">
              Every chart earns<br />
              <span className="bg-[#007aff] text-white px-2">its place.</span>
            </h2>
          </div>
          <p className="text-black/60 font-body leading-relaxed max-w-md lg:pb-2">
            Eight sections, each generated for your idea by the synthesis engine.
            Never filler, never a fake member. The report shows an honest empty
            state, not false numbers.
          </p>
        </motion.div>

        <div
          data-testid="dossier-bento-grid"
          className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {SECTIONS.map((s, i) => (
            <motion.div
              key={s.code}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              variants={reveal}
              className="group bg-white border-[1.5px] border-black p-5 shadow-hard-sm hover:-translate-x-1 hover:-translate-y-1 hover:shadow-hard transition-[transform,box-shadow] duration-100"
            >
              <div className="flex items-center justify-between">
                <s.icon size={22} strokeWidth={1.75} className="text-black" />
                <span className="font-mono text-[10px] text-black/35">{s.code}</span>
              </div>
              <h3 className="mt-6 font-body font-bold uppercase text-sm tracking-wide">{s.title}</h3>
              <p className="mt-1.5 text-xs text-black/55 font-body leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* trust strip */}
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          {[
            { icon: ShieldCheck, title: "Audited, traceable score", desc: "Every metric links back to a source. Inspect the working, not just the verdict." },
            { icon: Share2, title: "Built to be shared", desc: "Export a clean PDF dossier your cofounders and investors can actually read." },
          ].map((b) => (
            <motion.div
              key={b.title}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              variants={reveal}
              className="flex gap-4 bg-black text-white p-6 border-[1.5px] border-black"
            >
              <b.icon size={26} strokeWidth={1.75} className="text-[#32d74b] shrink-0" />
              <div>
                <h3 className="font-body font-bold uppercase text-sm tracking-wide">{b.title}</h3>
                <p className="mt-1 text-xs text-white/55 font-body leading-relaxed">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="#pricing"
            data-testid="dossier-sample-cta"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] bg-black text-white px-6 py-3.5 border-[1.5px] border-black hover:bg-white hover:text-black transition-colors"
          >
            See a sample dossier <ArrowRight size={15} />
          </a>
          <a
            href="#pricing"
            data-testid="dossier-generate-cta"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] bg-[#ff3b30] text-white px-6 py-3.5 border-[1.5px] border-black hover:bg-black transition-colors"
          >
            Generate mine <ArrowRight size={15} />
          </a>
        </div>
      </div>
    </section>
  );
};
