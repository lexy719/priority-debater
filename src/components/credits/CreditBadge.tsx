"use client";

/**
 * CreditBadge — the navbar balance pill, now sourced from the SERVER via
 * CreditsProvider (not localStorage). Three states:
 *   - not configured        → render nothing (pre-launch)
 *   - configured, signed out → "Sign in" chip → /login
 *   - signed in              → live balance → /pricing (turns red when low)
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Coins } from "lucide-react";
import { useCreditsState } from "@/components/credits/CreditsProvider";
import { CREDIT_COSTS } from "@/lib/credits/costs";

const CHEAPEST = Math.min(...Object.values(CREDIT_COSTS));

export function CreditBadge() {
  const { state } = useCreditsState();
  const prev = useRef<number | null>(null);
  const [delta, setDelta] = useState<number | null>(null);

  // Pulse + show a floating ±N whenever the balance changes (spend or top-up).
  useEffect(() => {
    const b = state.balance;
    if (b === null) return;
    if (prev.current !== null && b !== prev.current) {
      const d = b - prev.current;
      setDelta(d);
      const t = setTimeout(() => setDelta(null), 900);
      prev.current = b;
      return () => clearTimeout(t);
    }
    prev.current = b;
  }, [state.balance]);

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
      href="/credits"
      title={low ? "Out of credits — top up to keep going" : `${balance} credits remaining`}
      data-testid="credit-badge"
      className={`relative inline-flex items-center gap-1.5 border px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition-colors ${
        low
          ? "border-[#ff3b30] text-[#ff3b30] hover:bg-[#ff3b30] hover:text-white"
          : "border-white/25 text-white/85 hover:border-white/60"
      }`}
    >
      <Coins className="h-3.5 w-3.5" />
      <span key={balance} className={delta !== null ? "credit-pulse" : undefined}>
        {balance}
      </span>
      <span className="hidden sm:inline text-white/40">cr</span>
      {delta !== null && delta !== 0 && (
        <span
          className={`credit-float pointer-events-none absolute -top-3 right-1 text-[11px] font-bold ${
            delta > 0 ? "text-[#32d74b]" : "text-[#ff3b30]"
          }`}
        >
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}
    </Link>
  );
}
