"use client";

/**
 * PremiumLock — the paywall shown when a free user hits a premium-gated feature.
 * Reusable across the Fix Toolkit, HD voice, exports, etc. Routes to /pricing
 * (upgrade) or /login when sign-in is required first.
 */

import Link from "next/link";
import { Lock, ArrowRight, Check } from "lucide-react";

export function PremiumLock({
  title = "This is a Pro feature",
  message = "Upgrade to unlock it.",
  perks = [],
  needsLogin = false,
}: {
  title?: string;
  message?: string;
  perks?: string[];
  needsLogin?: boolean;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center border border-[#ff3b30]/40 bg-[#ff3b30]/10">
        <Lock className="h-6 w-6 text-[#ff3b30]" />
      </div>
      <h2 className="mt-6 font-display text-3xl uppercase leading-[0.95] text-white sm:text-4xl">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/60">{message}</p>

      {perks.length > 0 && (
        <ul className="mx-auto mt-6 inline-flex flex-col gap-2 text-left text-[13px]">
          {perks.map((p) => (
            <li key={p} className="flex items-start gap-2 text-white/75">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#32d74b]" /> {p}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {needsLogin && (
          <Link
            href="/login?next=/pricing"
            className="inline-flex items-center gap-2 border border-white/25 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/85 hover:bg-white hover:text-black"
          >
            Sign in
          </Link>
        )}
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 bg-[#ff3b30] px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-black"
        >
          {needsLogin ? "See plans" : "Upgrade to Pro"} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
