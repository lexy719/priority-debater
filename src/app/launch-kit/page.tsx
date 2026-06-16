"use client";

/**
 * /launch-kit — Stage 05 of the flow.
 *
 * Ports the Emergent LaunchKit and wires it to /api/launch-kit: product-page
 * copy + pricing, 3 acquisition channels, 20 cold messages, 5 Reddit posts,
 * 5 X hooks and offer framing — all generated from the validated idea (and the
 * brand name from the cached brand kit).
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Megaphone, Mail, MessageSquare, Hash, Tag, Zap } from "lucide-react";
import { FlowNav } from "@/components/flow/FlowNav";
import { FlowTicker } from "@/components/flow/FlowTicker";
import { FlowFooter } from "@/components/flow/FlowFooter";
import { FlowStatusBanner } from "@/components/flow/FlowStatusBanner";
import { FlowGuard } from "@/components/flow/FlowGuard";
import { CopyButton } from "@/components/flow/CopyButton";
import { Label, Card } from "@/components/flow/primitives";
import { reveal, viewport } from "@/components/flow/anim";
import { useFlowPayload } from "@/lib/flow/useFlowPayload";
import { FLOW_CACHE, readFlowCache } from "@/lib/flow/useFlowIdea";
import {
  PRODUCT_PAGE,
  ACQUISITION,
  COLD_MESSAGES,
  REDDIT_POSTS,
  X_HOOKS,
  OFFER,
} from "@/lib/flow/flowMock";
import type { LaunchKitPayload } from "@/lib/flow/types";

const FALLBACK: LaunchKitPayload = {
  productPage: PRODUCT_PAGE,
  acquisition: ACQUISITION,
  coldMessages: COLD_MESSAGES,
  redditPosts: REDDIT_POSTS,
  xHooks: X_HOOKS,
  offer: OFFER,
};

const OUTREACH_TABS = [
  { id: "cold", label: "20 Cold messages", icon: Mail },
  { id: "reddit", label: "5 Reddit posts", icon: Hash },
  { id: "x", label: "5 X / Twitter hooks", icon: MessageSquare },
] as const;

type TabId = (typeof OUTREACH_TABS)[number]["id"];

export default function LaunchKitPage() {
  const [tab, setTab] = useState<TabId>("cold");

  const { flow, data, status, regenerate } = useFlowPayload<LaunchKitPayload>({
    endpoint: "/api/launch-kit",
    cacheKey: FLOW_CACHE.launchKit,
    fallback: FALLBACK,
    buildBody: (f) => {
      const cachedBrand = readFlowCache<{ projectCode?: string }>(FLOW_CACHE.brandKit, f.input.topic);
      return { ...f.input, brandName: cachedBrand?.projectCode || f.idea.brandName };
    },
  });

  const pp = data.productPage;
  const brandName = readFlowCache<{ projectCode?: string }>(FLOW_CACHE.brandKit, flow.input.topic)?.projectCode || flow.idea.brandName;

  return (
    <FlowGuard stage="launch">
    <div data-testid="launch-kit-page" className="bg-[#f4f4f0] min-h-screen">
      <FlowNav current="launch" subtitle="v1.0 / 2026 — Launch Kit" />
      <FlowStatusBanner status={status} noun="launch kit" onRegenerate={regenerate} />

      {/* Hero */}
      <section className="bg-[#0a0a0a] grid-bg-dark text-white py-16 lg:py-20 border-b-[1.5px] border-black">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-8 grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
              Stage 05 / Launch Kit — the execution bridge
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl uppercase leading-[0.92]">
              Idea validated.{" "}
              <span className="bg-[#ff3b30] text-white px-2">now go get paid.</span>
            </h1>
            <p className="mt-5 max-w-xl text-white/60 font-body leading-relaxed">
              Insight doesn&apos;t pay. Customers do. Everything below is built to be copy-pasted and
              shipped — your goal is your first paying user in{" "}
              <span className="text-white font-semibold">the next 24 hours.</span>
            </p>
          </div>
          <div className="lg:col-span-4 grid grid-cols-2 gap-3">
            {[
              { k: "Ship-in-24h", v: "READY", c: "#32d74b" },
              { k: "Channels", v: String(data.acquisition.length), c: "#007aff" },
              { k: "Outreach assets", v: String(data.coldMessages.length + data.redditPosts.length + data.xHooks.length), c: "#ffd60a" },
              { k: "Founding offer", v: "10 SPOTS", c: "#ff3b30" },
            ].map((m) => (
              <div key={m.k} className="border border-white/20 p-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">{m.k}</p>
                <p className="font-display text-2xl mt-1" style={{ color: m.c }}>{m.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-[1400px] mx-auto px-5 lg:px-8 py-16 lg:py-20 space-y-10">
        {/* §01 Product page copy */}
        <motion.section initial="hidden" whileInView="show" viewport={viewport} variants={reveal}>
          <Label>§01 / Product page — real copy</Label>
          <div className="mt-4 grid lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-7">
              <div className="space-y-5">
                <div className="border border-black/15 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-black/40">Headline</span>
                    <CopyButton text={pp.headline} testid="copy-headline" />
                  </div>
                  <p className="font-display text-3xl uppercase tracking-tight leading-none">{pp.headline}</p>
                  <p className="mt-3 text-sm text-black/70 font-body leading-relaxed">{pp.subhead}</p>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {pp.valueProps.map((vp, i) => (
                    <div key={i} className="border border-black/15 p-3">
                      <span className="font-display text-2xl text-[#ff3b30]">0{i + 1}</span>
                      <h4 className="font-body font-bold text-sm mt-1">{vp.title}</h4>
                      <p className="text-xs text-black/60 font-body mt-1 leading-relaxed">{vp.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* live preview */}
            <Card className="lg:col-span-5 bg-[#0a0a0a] border-black text-white">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/50">Product page · preview</span>
              <div className="mt-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#ffd60a]">{brandName}</span>
                <h3 className="mt-3 font-display text-3xl uppercase leading-none">{pp.headline}</h3>
                <p className="mt-3 text-xs text-white/70 font-body leading-relaxed">{pp.subhead}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="bg-[#ffd60a] text-black font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2.5">{pp.primaryCta}</span>
                  <span className="border border-white/40 font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2.5">{pp.secondaryCta}</span>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {pp.pricing.map((p) => (
                    <div key={p.name} className={`p-2.5 border ${p.featured ? "border-[#ffd60a] bg-[#ffd60a]/10" : "border-white/20"}`}>
                      <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/50">{p.name}</p>
                      <p className="font-display text-xl mt-1">{p.price}</p>
                      <p className="font-mono text-[8px] text-white/45">{p.per || p.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </motion.section>

        {/* §02 Acquisition plan */}
        <motion.section initial="hidden" whileInView="show" viewport={viewport} variants={reveal}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Label>§02 / Acquisition plan — exactly 3 channels</Label>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-black/40 flex items-center gap-1.5">
              <Megaphone size={13} /> 3 channels, not 10 — focus is the strategy
            </span>
          </div>
          <div className="mt-4 grid lg:grid-cols-3 gap-6">
            {data.acquisition.map((c) => (
              <Card key={c.n} className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="font-display text-4xl text-black/10">{c.n}</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] bg-black text-white px-2 py-1">Channel</span>
                </div>
                <h3 className="mt-3 font-body font-bold text-base uppercase tracking-wide">{c.channel}</h3>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#ff3b30]">{c.target}</p>
                <p className="mt-3 text-xs text-black/60 font-body leading-relaxed">{c.why}</p>
                <div className="mt-3 border-t border-black/10 pt-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-black/40">Cadence</p>
                  <p className="text-xs text-black/70 font-body mt-1">{c.cadence}</p>
                </div>
                <div className="mt-3 border border-black/15 bg-[#f4f4f0] p-3 flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-black/40">Sample message</span>
                    <CopyButton text={c.sample} testid={`copy-channel-${c.n}`} />
                  </div>
                  <p className="text-xs text-black/70 font-body leading-relaxed whitespace-pre-line">{c.sample}</p>
                </div>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* §03 Outreach pack */}
        <motion.section initial="hidden" whileInView="show" viewport={viewport} variants={reveal}>
          <Label>§03 / First outreach pack — ready to send</Label>
          <div className="mt-4 flex flex-wrap gap-2">
            {OUTREACH_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                data-testid={`outreach-tab-${t.id}`}
                className={`inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2.5 border-[1.5px] border-black transition-colors ${
                  tab === t.id ? "bg-black text-white" : "bg-white hover:bg-black hover:text-white"
                }`}
              >
                <t.icon size={13} /> {t.label}
              </button>
            ))}
          </div>

          <div className="mt-5">
            {tab === "cold" && (
              <div className="grid md:grid-cols-2 gap-3" data-testid="outreach-cold-list">
                {data.coldMessages.map((m, i) => (
                  <div key={i} className="bg-white border-[1.5px] border-black p-4 flex gap-3">
                    <span className="font-display text-2xl text-black/15 leading-none w-8 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs text-black/75 font-body leading-relaxed">{m}</p>
                      <div className="mt-2 flex justify-end">
                        <CopyButton text={m} testid={`copy-cold-${i}`} />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="bg-[#ffd60a] border-[1.5px] border-black p-4 flex items-center gap-3 md:col-span-2">
                  <Zap size={18} />
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em]">
                    Swap {"{name}"} and {"{firm}"} per prospect. Send the first 10 today — replies before perfection.
                  </p>
                </div>
              </div>
            )}

            {tab === "reddit" && (
              <div className="grid md:grid-cols-2 gap-3" data-testid="outreach-reddit-list">
                {data.redditPosts.map((p, i) => (
                  <div key={i} className="bg-white border-[1.5px] border-black p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#ff3b30]">{p.sub}</span>
                      <CopyButton text={`${p.title}\n\n${p.body}`} testid={`copy-reddit-${i}`} />
                    </div>
                    <h4 className="mt-2 font-body font-bold text-sm leading-snug">{p.title}</h4>
                    <p className="mt-2 text-xs text-black/60 font-body leading-relaxed">{p.body}</p>
                  </div>
                ))}
              </div>
            )}

            {tab === "x" && (
              <div className="space-y-3" data-testid="outreach-x-list">
                {data.xHooks.map((h, i) => (
                  <div key={i} className="bg-white border-[1.5px] border-black p-4 flex items-start justify-between gap-4">
                    <p className="font-body text-sm text-black/80 leading-relaxed">{h}</p>
                    <CopyButton text={h} testid={`copy-x-${i}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>

        {/* §04 Offer framing */}
        <motion.section initial="hidden" whileInView="show" viewport={viewport} variants={reveal}>
          <Label>§04 / Offer framing — make it irresistible</Label>
          <div className="mt-4 grid lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-5 bg-black text-white border-black">
              <Tag size={22} className="text-[#ffd60a]" />
              <h3 className="mt-4 font-display text-2xl uppercase leading-tight">Founding 10</h3>
              <p className="mt-3 text-sm text-white/70 font-body leading-relaxed">{data.offer.founding}</p>
              <div className="mt-5 border-t border-white/15 pt-4 space-y-3">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">Urgency</p>
                  <p className="text-xs text-white/70 font-body mt-1">{data.offer.urgency}</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#32d74b]">Risk reversal</p>
                  <p className="text-xs text-white/70 font-body mt-1">{data.offer.guarantee}</p>
                </div>
              </div>
            </Card>
            <Card className="lg:col-span-7">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/40">Beta invite script</span>
                <CopyButton text={data.offer.beta} testid="copy-beta" />
              </div>
              <div className="border border-black/15 bg-[#f4f4f0] p-4">
                <p className="text-sm text-black/75 font-body leading-relaxed whitespace-pre-line">{data.offer.beta}</p>
              </div>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.15em] text-black/40">
                Where to use it: warmest 10 contacts first → channel 01 DMs → channel 03 email step 2.
              </p>
            </Card>
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
            <h2 className="font-display text-3xl sm:text-4xl uppercase leading-none">You can ship this in 24 hours.</h2>
            <p className="mt-2 text-white/80 font-body text-sm">
              Now let&apos;s drive traffic to it — an AI video ad campaign, ready to launch.
            </p>
          </div>
          <a
            href="/campaign"
            data-testid="launch-to-campaign-cta"
            className="group shrink-0 inline-flex items-center gap-2 bg-black text-white font-mono text-xs uppercase tracking-[0.2em] px-7 py-4 border-[1.5px] border-black hover:bg-white hover:text-black transition-colors"
          >
            Build the campaign
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
