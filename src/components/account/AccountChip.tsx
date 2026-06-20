"use client";

/**
 * AccountChip — the navbar avatar. Renders only when signed in (the CreditBadge
 * already shows a "Sign in" chip when logged out), linking to the profile.
 */

import Link from "next/link";
import { useCreditsState } from "@/components/credits/CreditsProvider";

export function AccountChip() {
  const { state } = useCreditsState();
  if (!state.configured || !state.authed) return null;

  const base = (state.name || state.email || "U").trim();
  const init =
    base
      .split(/[\s@.]+/)
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <Link
      href="/account"
      title={state.email ?? "Account"}
      aria-label="Account"
      data-testid="account-chip"
      className="grid h-9 w-9 place-items-center border border-white/25 bg-white/[0.04] font-mono text-[11px] font-bold uppercase text-white/85 transition-colors hover:border-white/60 hover:text-white"
    >
      {init}
    </Link>
  );
}
