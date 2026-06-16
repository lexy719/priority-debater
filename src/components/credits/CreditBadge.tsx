"use client";

/**
 * CreditBadge — the navbar balance pill, now sourced from the SERVER via
 * CreditsProvider (not localStorage). Three states:
 *   - not configured        → render nothing (pre-launch)
 *   - configured, signed out → "Sign in" chip → /login
 *   - signed in              → live balance → /pricing (turns red when low)
 */

import Link from "next/link";
import { Coins } from "lucide-react";
import { useCreditsState } from "@/components/credits/CreditsProvider";
import { CREDIT_COSTS } from "@/lib/credits/costs";

const CHEAPEST = Math.min(...Object.values(CREDIT_COSTS));

export function CreditBadge() {
  const { state } = useCreditsState();

  if (!state.configured) return null;

  if (!state.authed) {
    return (
      <Link
        href="/login"
        data-testid="credit-badge"
        className="inline-flex items-center gap-1.5 border border-white/25 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/85 transition-colors hover:border-white/60"
      >
        Sign in
      </Link>
    );
  }

  const balance = state.balance ?? 0;
  const low = balance < CHEAPEST;

  return (
    <Link
      href="/pricing"
      title={low ? "Out of credits — top up to keep going" : `${balance} credits remaining`}
      data-testid="credit-badge"
      className={`inline-flex items-center gap-1.5 border px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition-colors ${
        low
          ? "border-[#ff3b30] text-[#ff3b30] hover:bg-[#ff3b30] hover:text-white"
          : "border-white/25 text-white/85 hover:border-white/60"
      }`}
    >
      <Coins className="h-3.5 w-3.5" />
      <span>{balance}</span>
      <span className="hidden sm:inline text-white/40">cr</span>
    </Link>
  );
}
