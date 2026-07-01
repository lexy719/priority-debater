"use client";

/**
 * /brand-kit — Stage 04 of the flow.
 *
 * Ports the Emergent BrandKit design and wires it to the (extended)
 * /api/brand-kit route: name, pronunciation, alternates, rationale, taglines,
 * one-liner, boilerplate, palette, typography, voice and do/don't — all
 * generated from the user's validated idea. The monogram reuses the existing
 * LogoMark SVG; the wordmark renders the real generated name.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Quote, Check, X } from "lucide-react";
import { FlowNav } from "@/components/flow/FlowNav";
import { FlowTicker } from "@/components/flow/FlowTicker";
import { FlowFooter } from "@/components/flow/FlowFooter";
import { FlowStatusBanner } from "@/components/flow/FlowStatusBanner";
import { FlowGuard } from "@/components/flow/FlowGuard";
import { CopyButton } from "@/components/flow/CopyButton";
import { Label, Card } from "@/components/flow/primitives";
import { reveal, viewport } from "@/components/flow/anim";
import { useFlowPayload } from "@/lib/flow/useFlowPayload";
import { FLOW_CACHE } from "@/lib/flow/useFlowIdea";
import { BRAND as MOCK_BRAND } from "@/lib/flow/flowMock";
import { useGoogleFonts, fontStack } from "@/components/studio/useGoogleFonts";
import { LogoImageButton } from "@/components/studio/LogoImageButton";
import type { BrandKitFull } from "@/lib/flow/types";

/* Raw shape the /api/brand-kit route returns (only the bits we read here). */
type RawBrand = {
  projectCode?: string;
  pronunciation?: string;
  alternates?: string[];
  rationale?: string;
  taglines?: string[];
  oneLiner?: string;
  boilerplateShort?: string;
  boilerplateLong?: string;
  dos?: string[];
  donts?: string[];
  brandKit?: {
    palette?: { name?: string; hex?: string; role?: string }[];
    typography?: Record<string, { family?: string; role?: string; sample?: string }>;
    voice?: { tag?: string; body?: string }[];
  };
};

function resolveBrand(data: RawBrand | null): BrandKitFull {
  const fb = MOCK_BRAND;
  if (!data) return fb;

  const palette =
    Array.isArray(data.brandKit?.palette) && data.brandKit!.palette!.length
      ? data.brandKit!.palette!.map((c, i) => ({
          name: c?.name || fb.palette[i]?.name || "Token",
          hex: c?.hex || fb.palette[i]?.hex || "#0a0a0a",
          note: c?.role || fb.palette[i]?.note || "General use",
        }))
      : fb.palette;

  const typo = data.brandKit?.typography;
  const type =
    typo && typeof typo === "object"
      ? Object.entries(typo).map(([key, t], i) => ({
          role: t?.role || fb.type[i]?.role || key,
          font: t?.family || fb.type[i]?.font || "Inter",
          note: t?.sample || fb.type[i]?.note || "",
        }))
      : fb.type;

  const voice =
    Array.isArray(data.brandKit?.voice) && data.brandKit!.voice!.length
      ? data.brandKit!.voice!.map((v, i) => ({
          p: v?.tag || fb.voice[i]?.p || "Principle",
          d: v?.body || fb.voice[i]?.d || "",
        }))
      : fb.voice;

  return {
    name: data.projectCode || fb.name,
    pronunciation: data.pronunciation || fb.pronunciation,
    alternates: data.alternates?.length ? data.alternates : fb.alternates,
    rationale: data.rationale || fb.rationale,
    taglines: data.taglines?.length ? data.taglines : fb.taglines,
    oneLiner: data.oneLiner || fb.oneLiner,
    boilerplateShort: data.boilerplateShort || fb.boilerplateShort,
    boilerplateLong: data.boilerplateLong || fb.boilerplateLong,
    palette,
    type,
    voice,
    dos: data.dos?.length ? data.dos : fb.dos,
    donts: data.donts?.length ? data.donts : fb.donts,
  };
}

export default function BrandKitPage() {
  const { flow, data, status, reason, regenerate } = useFlowPayload<RawBrand | null>({
    endpoint: "/api/brand-kit",
    cacheKey: FLOW_CACHE.brandKit,
    fallback: null,
    buildBody: (f) => ({
      setup: { topic: f.input.topic, position: f.input.position, context: f.input.context },
      validationContent: f.input.validationContent,
      // Seed the brand from what the Chamber exposed, so voice + competitor
      // guardrails answer the panel's unresolved gaps instead of the raw pitch.
      debateBrief: f.debate?.brief || undefined,
    }),
  });

  const brand = useMemo(() => resolveBrand(data), [data]);
  const idea = flow.idea;

  const cardBg = brand.palette[0]?.hex || "#6B1F2A";
  const cardText = brand.palette[1]?.hex || "#F3EEE3";
  const chipBg = brand.palette[3]?.hex || brand.palette[2]?.hex || "#C8A24B";

  // Actually load + render the AI-chosen fonts so the kit is a live preview.
  const displayFont = brand.type[0]?.font;
  useGoogleFonts(brand.type.map((t) => t.font));

  const logoPrompt = `Minimalist iconic vector logo for "${brand.name}", a brand for ${idea.title}. ${brand.rationale} Flat, modern, memorable mark; palette ${brand.palette
    .slice(0, 3)
    .map((c) => c.hex)
    .join(", ")}; centered on a plain background, crisp, no lettering artifacts.`;

  return (
    <FlowGuard stage="brand">
    <div data-testid="brand-kit-page" className="bg-[#f4f4f0] min-h-screen">
      <FlowNav current="brand" subtitle="v1.0 / 2026 — Brand Kit" />
      <FlowStatusBanner status={status} reason={reason} noun="brand kit" onRegenerate={regenerate} />

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
              Your idea survived the panel. Before you chase customers, it needs a name they can
              say, a voice they trust, and a look that doesn&apos;t scream &ldquo;weekend project&rdquo;.
            </p>
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="border border-white/20 p-4">
              <Label>
                <span className="text-white/40">Idea under build</span>
              </Label>
              <p className="mt-2 font-body text-sm text-white/80 leading-relaxed">{idea.pitch}</p>
              <div className="mt-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.15em]">
                {flow.hasMetrics && (
                  <span className="bg-[#ffd60a] text-black px-2 py-1">Score {idea.viability}</span>
                )}
                <span className="text-white/50">{idea.verdict}</span>
              </div>
            </div>

            {/* Carried over from the Chamber — the gap the panel left open now
                seeds this brand, so the identity answers it instead of ignoring it. */}
            {flow.debate?.gaps?.length ? (
              <div className="border border-[#ff3b30]/50 bg-[#ff3b30]/[0.06] p-4">
                <Label>
                  <span className="text-[#ff3b30]">Carried from the Chamber</span>
                </Label>
                <p className="mt-2 font-body text-sm text-white/80 leading-relaxed">
                  The panel left <span className="text-white font-bold">{flow.debate.gaps[0].axis.toLowerCase()}</span>{" "}
                  unresolved. This brand is built to answer it.
                </p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/45">
                  Survival {flow.debate.survival.toFixed(1)}/10 · {flow.debate.gaps.length} open gap
                  {flow.debate.gaps.length > 1 ? "s" : ""}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <main className="max-w-[1400px] mx-auto px-5 lg:px-8 py-16 lg:py-20 space-y-6">
        {/* §01 Name + wordmark */}
        <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={reveal}>
          <Label>§01 / The name</Label>
          <div className="mt-4 grid lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-end gap-4 flex-wrap">
                  <span
                    className="text-6xl sm:text-7xl uppercase tracking-tight leading-none"
                    style={{ fontFamily: fontStack(displayFont, "var(--app-font-display)") }}
                  >
                    {brand.name}
                  </span>
                  <span className="font-mono text-[11px] text-black/45 mb-2">{brand.pronunciation}</span>
                </div>
                <p className="mt-5 text-sm text-black/70 font-body leading-relaxed max-w-xl">{brand.rationale}</p>
              </div>
              <div className="mt-6 flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/40">Also considered:</span>
                {brand.alternates.map((a) => (
                  <span key={a} className="font-mono text-[10px] uppercase tracking-[0.15em] border border-black/30 px-2 py-1">
                    {a}
                  </span>
                ))}
              </div>
            </Card>

            {/* Wordmark / monogram — real Monogram SVG + generated name */}
            <Card className="lg:col-span-5 border-black flex flex-col" style={{ background: cardBg, color: cardText }}>
              <Label>
                <span style={{ color: cardText, opacity: 0.5 }}>Wordmark · monogram</span>
              </Label>
              <div className="flex-1 grid place-items-center py-10">
                <div className="text-center">
                  <span
                    className="grid place-items-center mx-auto w-20 h-20 text-5xl leading-none pt-1"
                    style={{ background: chipBg, color: cardBg, fontFamily: fontStack(displayFont, "var(--app-font-display)") }}
                  >
                    {brand.name.charAt(0) || "·"}
                  </span>
                  <p
                    className="mt-4 text-3xl uppercase tracking-tight"
                    style={{ fontFamily: fontStack(displayFont, "var(--app-font-display)") }}
                  >
                    {brand.name}
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.3em] mt-1" style={{ color: cardText, opacity: 0.6 }}>
                    {idea.title.slice(0, 36)}
                  </p>
                  <div className="mt-5">
                    <LogoImageButton prompt={logoPrompt} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* §02 Voice in one line */}
        <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={reveal}>
          <Label>§02 / Voice in one line</Label>
          <div className="mt-4 grid lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/40 mb-3">Tagline options</p>
              <ul className="space-y-3">
                {brand.taglines.map((t, i) => (
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
                <p className="font-display text-xl sm:text-2xl uppercase leading-tight tracking-tight">{brand.oneLiner}</p>
              </div>
              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                {[
                  { k: "Boilerplate · short", v: brand.boilerplateShort, id: "short" },
                  { k: "Boilerplate · long", v: brand.boilerplateLong, id: "long" },
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

        {/* §03 Look & feel */}
        <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={reveal}>
          <Label>§03 / Look &amp; feel</Label>
          <div className="mt-4 grid lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/40 mb-4">Color palette</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {brand.palette.map((c) => (
                  <div key={c.hex + c.name} className="border border-black/15">
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
                {brand.type.map((t) => (
                  <div key={t.role + t.font} className="border-b border-black/10 pb-3 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="font-body font-bold text-sm">{t.font}</span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-black/40">{t.role}</span>
                    </div>
                    {/* live sample rendered in the actual generated font */}
                    <p className="mt-2 text-2xl leading-tight text-black" style={{ fontFamily: fontStack(t.font) }}>
                      {brand.name}
                    </p>
                    <p className="text-sm leading-snug text-black/70" style={{ fontFamily: fontStack(t.font) }}>
                      Ag — the quick brown fox jumps over 0123
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </motion.div>

        {/* §04 Voice & tone */}
        <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={reveal}>
          <Label>§04 / Voice &amp; tone</Label>
          <div className="mt-4 grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 grid sm:grid-cols-3 gap-4">
              {brand.voice.map((v, i) => (
                <Card key={v.p + i} className="flex flex-col">
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
                    {brand.dos.map((d) => (
                      <li key={d} className="flex gap-2 text-xs font-body text-black/70">
                        <Check size={14} className="text-[#32d74b] shrink-0 mt-0.5" /> {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ff3b30] mb-3">Never this</p>
                  <ul className="space-y-2">
                    {brand.donts.map((d) => (
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

      <FlowTicker reverse />
      <FlowFooter />
    </div>
    </FlowGuard>
  );
}
