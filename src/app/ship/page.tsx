"use client";

/**
 * /ship — Stage 08 of the flow.
 *
 * Ports the Emergent Ship page. The checklist + progress are stateful; the
 * journey recap and summary read the real idea / brand / score from the
 * session. "Export full launch kit (PDF)" triggers window.print() (a real,
 * lightweight export of the page).
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Download, Rocket, ArrowUpRight } from "lucide-react";
import { FlowNav } from "@/components/flow/FlowNav";
import { FlowTicker } from "@/components/flow/FlowTicker";
import { FlowFooter } from "@/components/flow/FlowFooter";
import { FlowGuard } from "@/components/flow/FlowGuard";
import { Label } from "@/components/flow/primitives";
import { reveal, viewport } from "@/components/flow/anim";
import { useFlowIdea, FLOW_CACHE, readFlowCache } from "@/lib/flow/useFlowIdea";
import { JOURNEY } from "@/lib/flow/flowMock";

function buildChecklist(brand: string): string[] {
  const slug = brand.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return [
    "Publish the product page (headline + 3 value props + pricing live)",
    `Point a domain — ${slug}.com or try${slug}.com`,
    "Set up a booking link (Cal.com) for the 20-min pilot",
    "Load the cold messages into LinkedIn — send the first 10 today",
    "Schedule the X hooks + Reddit posts across the week",
    "DM the founding-10 offer to your 10 warmest contacts",
    "Wire a simple intake form (idea brief → email) — no backend needed yet",
    "Set up one inbox rule: every reply gets answered within 2 hours",
  ];
}

export default function ShipPage() {
  const flow = useFlowIdea();
  const idea = flow.idea;
  const brandName =
    readFlowCache<{ projectCode?: string }>(FLOW_CACHE.brandKit, flow.input.topic)?.projectCode || idea.brandName;

  const checklist = useMemo(() => buildChecklist(brandName), [brandName]);
  const journey = useMemo(
    () =>
      JOURNEY.map((j) =>
        j.stage === "Validate"
          ? { ...j, artifact: `6-dimension viability score · ${idea.viability}/100` }
          : j.stage === "Brand"
          ? { ...j, artifact: `${brandName} — name, palette, voice` }
          : j,
      ),
    [idea.viability, brandName],
  );

  const [done, setDone] = useState<number[]>([]);
  const toggle = (i: number) => setDone((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));
  const pct = Math.round((done.length / checklist.length) * 100);

  return (
    <FlowGuard stage="ship">
    <div data-testid="ship-page" className="bg-[#f4f4f0] min-h-screen">
      <FlowNav current="ship" subtitle="v1.0 / 2026 — Launch Day" />

      {/* Hero */}
      <section className="bg-[#0a0a0a] grid-bg-dark text-white py-16 lg:py-20 border-b-[1.5px] border-black">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
            Stage 08 / Ship — the idea is now a business
          </span>
          <h1 className="mt-4 font-display text-5xl sm:text-6xl lg:text-7xl uppercase leading-[0.9]">
            You&apos;re clear{" "}
            <span className="bg-[#32d74b] text-black px-2">to launch.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-white/60 font-body leading-relaxed">
            From a one-line idea to a named, validated, market-ready business with a
            customer-acquisition plan. Run the checklist below — most of it is done in an afternoon.
          </p>
        </div>
      </section>

      <main className="max-w-[1400px] mx-auto px-5 lg:px-8 py-16 lg:py-20 space-y-10">
        {/* §01 Checklist */}
        <motion.section initial="hidden" whileInView="show" viewport={viewport} variants={reveal}>
          <div className="flex items-end justify-between flex-wrap gap-3">
            <Label>§01 / 24-hour launch checklist</Label>
            <div className="flex items-center gap-3">
              <div className="w-40 h-2 bg-black/10 border border-black/20">
                <div className="h-full bg-[#32d74b] transition-all duration-300" style={{ width: `${pct}%` }} />
              </div>
              <span data-testid="checklist-progress" className="font-display text-2xl">{pct}%</span>
            </div>
          </div>
          <div className="mt-4 grid md:grid-cols-2 gap-3">
            {checklist.map((item, i) => {
              const checked = done.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  data-testid={`checklist-item-${i}`}
                  className={`text-left flex items-start gap-3 border-[1.5px] border-black p-4 transition-colors ${
                    checked ? "bg-[#32d74b]/15" : "bg-white hover:bg-black/[0.03]"
                  }`}
                >
                  <span
                    className={`grid place-items-center w-6 h-6 border-[1.5px] border-black shrink-0 ${
                      checked ? "bg-[#32d74b]" : "bg-white"
                    }`}
                  >
                    {checked && <Check size={14} className="text-black" />}
                  </span>
                  <span className={`font-body text-sm ${checked ? "line-through text-black/40" : "text-black/80"}`}>
                    {item}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* §02 Journey recap */}
        <motion.section initial="hidden" whileInView="show" viewport={viewport} variants={reveal}>
          <Label>§02 / The full pipeline — idea to launch</Label>
          <div className="mt-4 border-[1.5px] border-black bg-white">
            {journey.map((j, i) => (
              <a
                key={j.n}
                href={j.href}
                data-testid={`journey-${j.stage.toLowerCase()}`}
                className={`flex items-center gap-4 sm:gap-6 px-5 py-4 group hover:bg-black/[0.03] transition-colors ${
                  i < journey.length - 1 ? "border-b-[1.5px] border-black/15" : ""
                }`}
              >
                <span className="font-display text-3xl sm:text-4xl text-black/15 w-12 shrink-0">{j.n}</span>
                <span
                  className={`grid place-items-center w-6 h-6 shrink-0 ${
                    j.state === "current" ? "bg-[#ff3b30] text-white" : "bg-[#32d74b] text-black"
                  }`}
                >
                  <Check size={13} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-bold uppercase text-sm tracking-wide">{j.stage}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/45 truncate">{j.artifact}</p>
                </div>
                <ArrowUpRight size={16} className="text-black/30 group-hover:text-black transition-colors shrink-0" />
              </a>
            ))}
          </div>
        </motion.section>

        {/* §03 Summary + export */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={reveal}
          className="grid lg:grid-cols-12 gap-6"
        >
          <div className="lg:col-span-7 bg-black text-white border-[1.5px] border-black p-8">
            <Rocket size={26} className="text-[#ff3b30]" />
            <h2 className="mt-4 font-display text-3xl sm:text-4xl uppercase leading-none">
              {brandName} is ready to meet the market.
            </h2>
            <p className="mt-3 text-white/60 font-body text-sm leading-relaxed max-w-lg">
              {idea.pitch} {flow.hasMetrics ? `Validated at ${idea.viability}/100, branded` : "Validated and branded"},
              and packaged with a channel plan and outreach pack. The only thing left is to hit send.
            </p>
          </div>
          <div className="lg:col-span-5 bg-white border-[1.5px] border-black shadow-hard-sm p-8 flex flex-col justify-center gap-3">
            <button
              data-testid="ship-export-btn"
              onClick={() => typeof window !== "undefined" && window.print()}
              className="inline-flex items-center justify-center gap-2 bg-black text-white font-mono text-xs uppercase tracking-[0.2em] px-6 py-4 border-[1.5px] border-black hover:bg-white hover:text-black transition-colors"
            >
              <Download size={15} /> Export full launch kit (PDF)
            </button>
            <a
              href="/launch-kit"
              data-testid="ship-back-launch"
              className="inline-flex items-center justify-center gap-2 bg-white text-black font-mono text-xs uppercase tracking-[0.2em] px-6 py-4 border-[1.5px] border-black hover:bg-black hover:text-white transition-colors"
            >
              Back to launch kit
            </a>
          </div>
        </motion.div>
      </main>

      <FlowTicker reverse />
      <FlowFooter />
    </div>
    </FlowGuard>
  );
}
