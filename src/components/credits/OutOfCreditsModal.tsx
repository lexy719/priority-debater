"use client";

/**
 * OutOfCreditsModal — the gate shown when a metered action can't be afforded.
 * On-brand with the chamber (ink panel, signal-red, mono labels). The "top up"
 * CTA points at pricing today; it becomes the Stripe checkout entry later.
 */

import Link from "next/link";
import { useEffect } from "react";
import { Coins, X, ArrowRight } from "lucide-react";
import { CREDIT_COSTS, SIGNUP_GRANT, type CreditAction } from "@/lib/credits/costs";

const LABELS: Partial<Record<CreditAction, string>> = {
  validation: "run a validation",
  debate: "enter the chamber",
  brand_kit: "generate a brand kit",
  launch_kit: "generate a launch kit",
  campaign: "generate a campaign",
  landing: "build a landing page",
  pitch: "build a pitch deck",
  rescore: "re-score with evidence",
};

export function OutOfCreditsModal({
  action,
  balance,
  onClose,
}: {
  action: CreditAction;
  balance: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const cost = CREDIT_COSTS[action];
  const label = LABELS[action] ?? "use this feature";

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md border border-white/20 bg-[#0a0a0a] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/15 px-5 py-3">
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#ff3b30]">
            <Coins className="h-3.5 w-3.5" /> Out of credits
          </span>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-7">
          <h3 className="font-display text-2xl leading-tight">
            You need <span className="text-[#ff3b30]">{cost} credits</span> to {label}.
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-white/65">
            You have <strong className="text-white">{balance}</strong> left. New accounts start
            with {SIGNUP_GRANT}. Top up to keep pressure-testing — every
            validation and debate runs five live AI agents.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/pricing"
              onClick={onClose}
              className="group inline-flex flex-1 items-center justify-center gap-2 bg-[#ff3b30] px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-black"
            >
              Top up credits
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center border border-white/25 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-white"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
