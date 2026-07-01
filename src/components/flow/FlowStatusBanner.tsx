"use client";

import { RefreshCw, AlertTriangle, Sparkles, Lock, Coins } from "lucide-react";
import type { PayloadStatus, FallbackReason } from "@/lib/flow/useFlowPayload";

type FlowStatusBannerProps = {
  status: PayloadStatus;
  /** What this stage is generating, e.g. "launch kit". */
  noun: string;
  /** Why we fell back (auth / credits / engine / demo). Drives the CTA. */
  reason?: FallbackReason;
  onRegenerate?: () => void;
};

/**
 * Thin banner under the FlowNav that tells the user whether they're seeing
 * AI output generated from their idea, a sample, or a live generation in flight.
 *
 * On fallback it surfaces WHY (sign in / out of credits / engine down) so a
 * logged-out or out-of-credits user gets an actionable next step instead of
 * mistaking the sample for a hardcoded mockup.
 */
export function FlowStatusBanner({ status, noun, reason, onRegenerate }: FlowStatusBannerProps) {
  if (status === "loading") {
    return (
      <div className="flex items-center gap-3 border-b-[1.5px] border-black bg-[#ffd60a] px-5 lg:px-8 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-black">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        Generating your {noun} from the validated idea…
      </div>
    );
  }

  if (status === "fallback") {
    // No validated idea on file — pure preview.
    if (reason === "demo") {
      return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-black bg-[#0a0a0a] px-5 lg:px-8 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-white">
          <span className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#ffd60a]" />
            Sample {noun} — validate an idea to build your own.
          </span>
          <a
            href="/debate"
            className="border border-white/40 px-3 py-1 text-[10px] tracking-[0.18em] hover:bg-white hover:text-black transition-colors"
          >
            Validate an idea
          </a>
        </div>
      );
    }

    // Sign-in required — generation needs an account.
    if (reason === "auth") {
      return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-black bg-[#0a0a0a] px-5 lg:px-8 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-white">
          <span className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-[#ffd60a]" />
            Sample {noun} — sign in to generate it from your idea.
          </span>
          <a
            href="/login"
            className="border border-white/40 px-3 py-1 text-[10px] tracking-[0.18em] hover:bg-white hover:text-black transition-colors"
          >
            Sign in
          </a>
        </div>
      );
    }

    // Out of credits — generation is metered.
    if (reason === "credits") {
      return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-black bg-[#0a0a0a] px-5 lg:px-8 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-white">
          <span className="flex items-center gap-2">
            <Coins className="h-3.5 w-3.5 text-[#ffd60a]" />
            Sample {noun} — out of credits. Top up to generate your own.
          </span>
          <a
            href="/credits"
            className="border border-white/40 px-3 py-1 text-[10px] tracking-[0.18em] hover:bg-white hover:text-black transition-colors"
          >
            Get credits
          </a>
        </div>
      );
    }

    // Engine down / network / parse error — retryable.
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
