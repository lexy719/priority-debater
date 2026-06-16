import { motion } from "framer-motion";
import { ArrowRight, Quote, Check, X } from "lucide-react";
import { FlowNav } from "@/components/flow/FlowNav";
import { TickerBar } from "@/components/flow/TickerBar";
import { CopyButton } from "@/components/flow/CopyButton";
import { Footer } from "@/components/landing/Footer";
import { BRAND, IDEA } from "@/lib/flowData";
import { reveal, viewport } from "@/components/landing/anim";

const Label = ({ children }) => (
  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-black/40">{children}</span>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white border-[1.5px] border-black shadow-hard-sm p-6 ${className}`}>{children}</div>
);

export default function BrandKit() {
  return (
    <div data-testid="brand-kit-page" className="bg-[#f4f4f0] min-h-screen">
      <FlowNav current="brand" subtitle="v1.0 / 2026 — Brand Kit" />

      {/* Hero band */}
      <section className="bg-[#0a0a0a] grid-bg-dark text-white py-16 lg:py-20 border-b-[1.5px] border-black">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-8 grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
              Stage 04 / Brand Kit
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl uppercase leading-[0.92]">
              The identity.{" "}
              <span className="bg-[#ff3b30] text-white px-2">built to be remembered.</span>
            </h1>
            <p className="mt-5 max-w-xl text-white/60 font-body leading-relaxed">
              Your idea survived the panel. Before you chase customers, it needs a
              name they can say, a voice they trust, and a look that doesn&apos;t
              scream &ldquo;weekend project&rdquo;.
            </p>
          </div>
          <div className="lg:col-span-4">
            <div className="border border-white/20 p-4">
              <Label>
                <span className="text-white/40">Idea under build</span>
              </Label>
              <p className="mt-2 font-body text-sm text-white/80 leading-relaxed">{IDEA.pitch}</p>
              <div className="mt-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.15em]">
                <span className="bg-[#ffd60a] text-black px-2 py-1">Score {IDEA.viability}</span>
                <span className="text-white/50">{IDEA.verdict}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-[1400px] mx-auto px-5 lg:px-8 py-16 lg:py-20 space-y-6">
        {/* Name + wordmark */}
        <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={reveal}>
          <Label>§01 / The name</Label>
          <div className="mt-4 grid lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-end gap-4 flex-wrap">
                  <span className="font-display text-6xl sm:text-7xl uppercase tracking-tight">
                    {BRAND.name}
                  </span>
                  <span className="font-mono text-[11px] text-black/45 mb-2">{BRAND.pronunciation}</span>
                </div>
                <p className="mt-5 text-sm text-black/70 font-body leading-relaxed max-w-xl">
                  {BRAND.rationale}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/40">
                  Also considered:
                </span>
                {BRAND.alternates.map((a) => (
                  <span key={a} className="font-mono text-[10px] uppercase tracking-[0.15em] border border-black/30 px-2 py-1">
                    {a}
                  </span>
                ))}
              </div>
            </Card>

            {/* Wordmark / monogram mock */}
            <Card className="lg:col-span-5 bg-[#6B1F2A] border-black text-[#F3EEE3] flex flex-col">
              <Label>
                <span className="text-[#F3EEE3]/50">Wordmark · monogram</span>
              </Label>
              <div className="flex-1 grid place-items-center py-10">
                <div className="text-center">
                  <span className="grid place-items-center mx-auto w-20 h-20 bg-[#C8A24B] text-[#14110F] font-display text-4xl leading-none pt-1">
                    M
                  </span>
                  <p className="mt-4 font-display text-3xl uppercase tracking-tight">{BRAND.name}</p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#F3EEE3]/60 mt-1">
                    legal drafting, native
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Taglines + one-liner */}
        <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={reveal}>
          <Label>§02 / Voice in one line</Label>
          <div className="mt-4 grid lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/40 mb-3">
                Tagline options
              </p>
              <ul className="space-y-3">
                {BRAND.taglines.map((t, i) => (
                  <li key={t} className="flex items-center justify-between gap-3 border-b border-black/10 pb-3 last:border-0">
                    <span className={`font-body ${i === 0 ? "font-bold" : "text-black/70"}`}>
                      {i === 0 && <span className="text-[#ff3b30] mr-2">▶</span>}
                      {t}
                    </span>
                    <CopyButton text={t} testid={`copy-tagline-${i}`} />
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="lg:col-span-7">
              <div className="flex items-start gap-3">
                <Quote size={22} className="text-[#ff3b30] shrink-0" />
                <p className="font-display text-xl sm:text-2xl uppercase leading-tight tracking-tight">
                  {BRAND.oneLiner}
                </p>
              </div>
              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                {[
                  { k: "Boilerplate · short", v: BRAND.boilerplateShort, id: "short" },
                  { k: "Boilerplate · long", v: BRAND.boilerplateLong, id: "long" },
                ].map((b) => (
                  <div key={b.id} className="border border-black/15 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-black/40">{b.k}</span>
                      <CopyButton text={b.v} testid={`copy-${b.id}`} />
                    </div>
                    <p className="text-xs text-black/65 font-body leading-relaxed">{b.v}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Palette + Type */}
        <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={reveal}>
          <Label>§03 / Look &amp; feel</Label>
          <div className="mt-4 grid lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/40 mb-4">Color palette</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {BRAND.palette.map((c) => (
                  <div key={c.hex} className="border border-black/15">
                    <div className="h-16 border-b border-black/15" style={{ background: c.hex }} />
                    <div className="p-2">
                      <p className="font-body font-bold text-xs">{c.name}</p>
                      <p className="font-mono text-[9px] text-black/50">{c.hex}</p>
                      <p className="font-body text-[10px] text-black/45 mt-1 leading-tight">{c.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="lg:col-span-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/40 mb-4">Typography</p>
              <div className="space-y-4">
                {BRAND.type.map((t) => (
                  <div key={t.role} className="border-b border-black/10 pb-3 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="font-body font-bold text-sm">{t.font}</span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-black/40">{t.role}</span>
                    </div>
                    <p className="text-xs text-black/55 font-body mt-1">{t.note}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Voice & tone */}
        <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={reveal}>
          <Label>§04 / Voice &amp; tone</Label>
          <div className="mt-4 grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 grid sm:grid-cols-3 gap-4">
              {BRAND.voice.map((v, i) => (
                <Card key={v.p} className="flex flex-col">
                  <span className="font-display text-3xl text-black/10">0{i + 1}</span>
                  <h3 className="mt-2 font-body font-bold text-sm uppercase tracking-wide">{v.p}</h3>
                  <p className="mt-2 text-xs text-black/60 font-body leading-relaxed">{v.d}</p>
                </Card>
              ))}
            </div>
            <Card className="lg:col-span-5">
              <div className="grid grid-cols-2 gap-4 h-full">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#32d74b] mb-3">Say this</p>
                  <ul className="space-y-2">
                    {BRAND.dos.map((d) => (
                      <li key={d} className="flex gap-2 text-xs font-body text-black/70">
                        <Check size={14} className="text-[#32d74b] shrink-0 mt-0.5" /> {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ff3b30] mb-3">Never this</p>
                  <ul className="space-y-2">
                    {BRAND.donts.map((d) => (
                      <li key={d} className="flex gap-2 text-xs font-body text-black/50 line-through decoration-[#ff3b30]/60">
                        <X size={14} className="text-[#ff3b30] shrink-0 mt-0.5" /> {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={reveal}
          className="bg-black text-white border-[1.5px] border-black p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div>
            <h2 className="font-display text-3xl sm:text-4xl uppercase leading-none">
              Identity locked. Now the money path.
            </h2>
            <p className="mt-2 text-white/50 font-body text-sm">
              A brand doesn&apos;t pay rent. The Launch Kit turns it into your first customers.
            </p>
          </div>
          <a
            href="/launch-kit"
            data-testid="brand-to-launch-cta"
            className="group shrink-0 inline-flex items-center gap-2 bg-[#ff3b30] text-white font-mono text-xs uppercase tracking-[0.2em] px-7 py-4 border-[1.5px] border-white hover:bg-white hover:text-black transition-colors"
          >
            Build the launch kit
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
      </main>

      <TickerBar reverse />
      <Footer />
    </div>
  );
}
