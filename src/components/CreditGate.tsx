"use client";

/**
 * CreditGate — shown when an action needs the user to sign in or top up credits.
 * Everything runs on credits (no plans), so a 401 → sign in, a 402 → top up.
 */

import Link from "next/link";
import { Coins, LogIn, ArrowRight } from "lucide-react";

export function CreditGate({
  kind,
  message,
}: {
  kind: "login" | "credits";
  message: string;
}) {
  const isCredits = kind === "credits";
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center border border-[#ff3b30]/40 bg-[#ff3b30]/10">
        {isCredits ? <Coins className="h-6 w-6 text-[#ff3b30]" /> : <LogIn className="h-6 w-6 text-[#ff3b30]" />}
      </div>
      <h2 className="mt-6 font-display text-3xl uppercase leading-[0.95] text-white sm:text-4xl">
        {isCredits ? "Out of credits" : "Sign in to continue"}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-white/60">{message}</p>
      <div className="mt-8">
        <Link
          href={isCredits ? "/credits" : "/login?next=/commerce"}
          className="inline-flex items-center gap-2 bg-[#ff3b30] px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-black"
        >
          {isCredits ? "Top up credits" : "Sign in"} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
