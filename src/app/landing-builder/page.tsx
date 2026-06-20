"use client";

/**
 * /landing-builder — Stage 07 of the flow.
 *
 * Ports the Emergent LandingGen page. Instead of a hardcoded brand/product it
 * composes the export from the REAL generated brand name (cached brand kit) and
 * product-page copy (cached launch kit), so the live preview and the HTML /
 * WordPress / Shopify exports reflect the user's actual idea.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Monitor, Code2, Check } from "lucide-react";
import { FlowNav } from "@/components/flow/FlowNav";
import { FlowTicker } from "@/components/flow/FlowTicker";
import { FlowFooter } from "@/components/flow/FlowFooter";
import { FlowStatusBanner } from "@/components/flow/FlowStatusBanner";
import { FlowGuard } from "@/components/flow/FlowGuard";
import { CopyButton } from "@/components/flow/CopyButton";
import { Label } from "@/components/flow/primitives";
import { reveal, viewport } from "@/components/flow/anim";
import { useFlowIdea, FLOW_CACHE, readFlowCache } from "@/lib/flow/useFlowIdea";
import { ARCHETYPES, buildLandingHtml, type ArchetypeId } from "@/lib/flow/buildLandingHtml";
import { PRODUCT_PAGE } from "@/lib/flow/flowMock";
import type { ProductPage, LaunchKitPayload } from "@/lib/flow/types";

const EXPORT_TABS = [
  { id: "html", label: "Copy HTML" },
  { id: "wordpress", label: "WordPress" },
  { id: "shopify", label: "Shopify" },
] as const;

type ExportTab = (typeof EXPORT_TABS)[number]["id"];

const STEPS: Record<Exclude<ExportTab, "html">, string[]> = {
  wordpress: [
    "In your page/post editor, add a block → choose “Custom HTML”.",
    "Paste the full HTML below into the block.",
    "Set the page template to “Full width / No sidebar”, then Publish.",
  ],
  shopify: [
    "Online Store → Pages → Add page.",
    "Click the “< >” (Show HTML) icon in the content editor.",
    "Paste the HTML below, save, and set the page as your campaign landing URL.",
  ],
};

export default function LandingBuilderPage() {
  const flow = useFlowIdea();
  const [arch, setArch] = useState<ArchetypeId>("brutalist");
  const [tab, setTab] = useState<ExportTab>("html");

  // Pull real brand + product copy from the earlier stages' caches.
  const cachedBrand = readFlowCache<{
    projectCode?: string;
    brandKit?: { palette?: { hex?: string }[]; typography?: Record<string, { family?: string }> };
  }>(FLOW_CACHE.brandKit, flow.input.topic);

  const brandName = cachedBrand?.projectCode || flow.idea.brandName;
  const productPage: ProductPage =
    readFlowCache<LaunchKitPayload>(FLOW_CACHE.launchKit, flow.input.topic)?.productPage || PRODUCT_PAGE;

  // The landing adopts the generated brand's palette + fonts → it IS the brand.
  const palette = (cachedBrand?.brandKit?.palette ?? [])
    .map((c) => ({ hex: c?.hex ?? "" }))
    .filter((c) => c.hex);
  const typo = Object.values(cachedBrand?.brandKit?.typography ?? {});
  const brandTheme =
    palette.length || typo.length
      ? { palette, fonts: { head: typo[0]?.family, body: typo[1]?.family ?? typo[0]?.family } }
      : undefined;

  const html = useMemo(
    () => buildLandingHtml(arch, { name: brandName, productPage, brand: brandTheme }),
    [arch, brandName, productPage, brandTheme],
  );

  return (
    <FlowGuard stage="landing">
    <div data-testid="landing-gen-page" className="bg-[#f4f4f0] min-h-screen">
      <FlowNav current="landing" subtitle="v1.0 / 2026 — Landing Page" />
      <FlowStatusBanner status={flow.isDemo ? "fallback" : "ready"} noun="landing page" />

      {/* Hero */}
      <section className="bg-[#0a0a0a] grid-bg-dark text-white py-16 lg:py-20 border-b-[1.5px] border-black">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
            Stage 07 / Landing Page — your conversion surface
          </span>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl uppercase leading-[0.92]">
            Your conversion page.{" "}
            <span className="bg-[#ffd60a] text-black px-2">generated.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-white/60 font-body leading-relaxed">
            Built from your brand and product copy. Pick a style, preview it live, then ship it —
            host it as-is or paste the HTML straight into WordPress or Shopify.
          </p>
        </div>
      </section>

      <main className="max-w-[1400px] mx-auto px-5 lg:px-8 py-16 lg:py-20 space-y-10">
        {/* §01 Choose a style */}
        <motion.section initial="hidden" whileInView="show" viewport={viewport} variants={reveal}>
          <Label>§01 / Choose a style</Label>
          <div className="mt-4 grid sm:grid-cols-3 gap-4">
            {ARCHETYPES.map((a) => {
              const active = arch === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setArch(a.id)}
                  data-testid={`archetype-${a.id}`}
                  className={`text-left border-[1.5px] border-black p-5 transition-colors ${
                    active ? "bg-black text-white shadow-hard-sm" : "bg-white hover:bg-black/[0.03]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-body font-bold uppercase text-sm tracking-wide">{a.name}</h3>
                    {active && <Check size={16} className="text-[#32d74b]" />}
                  </div>
                  <p className={`mt-2 text-xs font-body leading-relaxed ${active ? "text-white/60" : "text-black/55"}`}>
                    {a.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* §02 Live preview */}
        <motion.section initial="hidden" whileInView="show" viewport={viewport} variants={reveal}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Label>§02 / Live preview</Label>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-black/40 flex items-center gap-1.5">
              <Monitor size={13} /> Real, rendered HTML — not a screenshot
            </span>
          </div>
          <div className="mt-4 bg-white border-[1.5px] border-black shadow-hard">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b-[1.5px] border-black bg-[#f4f4f0]">
              <span className="w-3 h-3 bg-[#ff3b30] border border-black" />
              <span className="w-3 h-3 bg-[#ffd60a] border border-black" />
              <span className="w-3 h-3 bg-[#32d74b] border border-black" />
              <span className="ml-3 font-mono text-[10px] text-black/45">
                {brandName.toLowerCase()}.com — {ARCHETYPES.find((a) => a.id === arch)?.name}
              </span>
            </div>
            <iframe
              data-testid="landing-preview"
              title="Landing page preview"
              srcDoc={html}
              className="w-full h-[600px] bg-white"
            />
          </div>
        </motion.section>

        {/* §03 Export & ship */}
        <motion.section initial="hidden" whileInView="show" viewport={viewport} variants={reveal}>
          <Label>§03 / Export &amp; ship</Label>
          <div className="mt-4 flex flex-wrap gap-2">
            {EXPORT_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                data-testid={`export-tab-${t.id}`}
                className={`inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2.5 border-[1.5px] border-black transition-colors ${
                  tab === t.id ? "bg-black text-white" : "bg-white hover:bg-black hover:text-white"
                }`}
              >
                <Code2 size={13} /> {t.label}
              </button>
            ))}
          </div>

          <div className="mt-4 bg-white border-[1.5px] border-black shadow-hard-sm p-5">
            {tab !== "html" && (
              <ol className="mb-4 space-y-2">
                {STEPS[tab].map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm font-body text-black/75">
                    <span className="font-display text-base text-[#ff3b30] leading-none">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            )}
            {tab === "html" && (
              <p className="mb-4 text-sm font-body text-black/65">
                A single self-contained <code className="font-mono text-xs bg-black/5 px-1">.html</code> file —
                fonts and styles inlined. Drop it on any host (Vercel, Netlify, S3) and it just works.
              </p>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/40">
                {tab === "html" ? "index.html" : "Paste this block"}
              </span>
              <CopyButton text={html} label="Copy HTML" testid="copy-landing-html" />
            </div>
            <pre className="bg-[#0a0a0a] text-white/80 text-[11px] font-mono leading-relaxed p-4 overflow-auto max-h-72 border border-black whitespace-pre-wrap">
              {html}
            </pre>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={reveal}
          className="bg-[#ff3b30] text-white border-[1.5px] border-black p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div>
            <h2 className="font-display text-3xl sm:text-4xl uppercase leading-none">Idea. Validated. Branded. Live.</h2>
            <p className="mt-2 text-white/80 font-body text-sm">
              One step left — the launch-day checklist that turns all of this into a running business.
            </p>
          </div>
          <a
            href="/ship"
            data-testid="landing-to-ship-cta"
            className="group shrink-0 inline-flex items-center gap-2 bg-black text-white font-mono text-xs uppercase tracking-[0.2em] px-7 py-4 border-[1.5px] border-black hover:bg-white hover:text-black transition-colors"
          >
            Go to launch day
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
