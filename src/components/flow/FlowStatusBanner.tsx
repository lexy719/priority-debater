"use client";

import { RefreshCw, AlertTriangle, Sparkles } from "lucide-react";
import type { PayloadStatus } from "@/lib/flow/useFlowPayload";

type FlowStatusBannerProps = {
  status: PayloadStatus;
  /** What this stage is generating, e.g. "launch kit". */
  noun: string;
  onRegenerate?: () => void;
};

/**
 * Thin banner under the FlowNav that tells the user whether they're seeing
 * AI output generated from their idea, a sample, or a live generation in flight.
 * (Studio pages are gated by FlowGuard, so a pure no-idea demo never renders here.)
 */
export function FlowStatusBanner({ status, noun, onRegenerate }: FlowStatusBannerProps) {
  if (status === "loading") {
    return (
      <div className="flex items-center gap-3 border-b-[1.5px] border-black bg-[#ffd60a] px-5 lg:px-8 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-black">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        Generating your {noun} from the validated idea…
      </div>
    );
  }

  if (status === "fallback") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-black bg-[#0a0a0a] px-5 lg:px-8 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-white">
        <span className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-[#ff3b30]" />
          Couldn&apos;t reach the AI engine — showing a sample {noun}.
        </span>
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            className="border border-white/40 px-3 py-1 text-[10px] tracking-[0.18em] hover:bg-white hover:text-black transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // ready (live)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-black bg-[#32d74b]/15 px-5 lg:px-8 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-black">
      <span className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-[#32d74b]" />
        Generated from your validated idea.
      </span>
      {onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex items-center gap-1.5 border border-black/30 hover:border-black px-3 py-1 text-[10px] tracking-[0.18em] transition-colors"
        >
          <RefreshCw className="h-3 w-3" /> Regenerate
        </button>
      )}
    </div>
  );
}
