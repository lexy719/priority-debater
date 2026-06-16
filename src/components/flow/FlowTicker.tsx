"use client";

import { useFlowIdea } from "@/lib/flow/useFlowIdea";
import { TICKER as MOCK_TICKER } from "@/lib/flow/flowMock";
import type { FlowIdea, TickerItem } from "@/lib/flow/types";

function tickerFromIdea(idea: FlowIdea, hasMetrics: boolean): TickerItem[] {
  return [
    { tag: "IDEA", text: idea.title.toUpperCase().slice(0, 60), color: "#007aff" },
    {
      tag: "SCORE",
      text: hasMetrics ? `VIABILITY ${idea.viability}/100 · ${idea.verdict}` : "SCORE · AWAITING VALIDATION",
      color: "#ffd60a",
    },
    {
      tag: "MARKET",
      text: hasMetrics ? `TAM ${idea.tam} · SAM ${idea.sam} · SOM ${idea.som}` : "MARKET · PENDING SIZING",
      color: "#32d74b",
    },
    { tag: "BRAND", text: `IDENTITY · ${idea.brandName}`, color: "#ff3b30" },
    { tag: "LAUNCH", text: "SHIP-IN-24H KIT GENERATED", color: "#007aff" },
    { tag: "CAMPAIGN", text: "4 VIDEO AD CUTS · €500 TEST", color: "#32d74b" },
    { tag: "PAGE", text: "LANDING HTML EXPORTED · WP/SHOPIFY", color: "#ffd60a" },
  ];
}

type FlowTickerProps = { reverse?: boolean };

export function FlowTicker({ reverse = false }: FlowTickerProps) {
  const { idea, ready, isDemo, hasMetrics } = useFlowIdea();
  const base = ready && !isDemo ? tickerFromIdea(idea, hasMetrics) : MOCK_TICKER;
  const items = base.concat(base, base);

  return (
    <div
      data-testid="ticker-bar"
      className="bg-black overflow-hidden py-1.5 border-y border-white/15"
    >
      <div
        className="flex whitespace-nowrap animate-marquee"
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {items.map((it, i) => (
          <span
            key={i}
            className="flex items-center gap-2 px-4 font-mono text-[10px] uppercase tracking-[0.18em]"
          >
            <span className="px-1.5 py-0.5 text-[9px] font-bold text-black" style={{ background: it.color }}>
              {it.tag}
            </span>
            <span className="text-white/70">{it.text}</span>
            <span className="text-white/20">//</span>
          </span>
        ))}
      </div>
    </div>
  );
}
