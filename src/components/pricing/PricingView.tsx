"use client";

/**
 * PricingView — the /pricing hub. One simple model: everything runs on credits.
 * Start with free credits, see what each action costs, and top up with a pack
 * when you want more. No subscriptions, no tiers. Packs go through Stripe Checkout.
 */

import { useState } from "react";
import { Loader2, Coins } from "lucide-react";
import { CREDIT_COSTS, CREDIT_PACKS, SIGNUP_GRANT, type CreditAction } from "@/lib/credits/costs";

type Props = { authed: boolean; balance: number | null };

const ACTION_LABELS: Record<CreditAction, string> = {
  validation: "Validate an idea (5-agent panel)",
  debate: "Chamber debate",
  debate_revise: "Chamber revision (re-enter)",
  quick_cross: "Quick Cross (one seat)",
  rescore: "Re-score",
  brand_kit: "Brand kit",
  launch_kit: "Launch kit",
  campaign: "Ad campaign",
  landing: "Landing page",
  pitch: "Pitch deck",
  commerce_scan: "AI visibility report (unlock)",
  commerce_rescan: "Weekly re-scan",
  commerce_agent_action: "PD Agent action (generate + push)",
  commerce_agent_chat: "PD Agent message",
  logo_image: "AI logo image",
  ad_video: "AI video ad (Higgsfield)",
  hd_voice: "HD tribunal voice (per line)",
};

export function PricingView({ authed, balance }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function buyPack(packId: string) {
    if (busy) return;
    if (!authed) {
      window.location.href = "/login?next=/pricing";
      return;
    }
    setBusy(packId);
    setError(false);
    try {
      const res = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      if (res.status === 401) {
        window.location.href = "/login?next=/pricing";
        return;
      }
      const j = await res.json();
      if (res.ok && j.url) {
        window.location.href = j.url as string;
        return;
      }
      setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  }

  const actions = Object.keys(CREDIT_COSTS) as CreditAction[];

  return (
    <main className="mx-auto max-w-[1100px] px-5 py-16 sm:py-20">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">§ Pricing</p>
      <h1 className="mt-2 font-display text-4xl uppercase leading-[0.95] sm:text-5xl">
        Simple. Runs on <span className="bg-[#ff3b30] px-2">credits.</span>
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60">
        Every account starts with {SIGNUP_GRANT} free credits — no card. Each action costs credits;
        top up with a one-time pack whenever you want more. No subscriptions, no plans to manage.
        {balance !== null && <span className="text-white"> You have {balance} credits.</span>}
      </p>

      {error && (
        <div className="mt-6 border border-[#ff3b30]/40 bg-[#ff3b30]/10 px-4 py-3 text-sm text-[#ff3b30]">
          Couldn&apos;t start checkout. Please make sure you&apos;re signed in and try again.
        </div>
      )}

      {/* packs */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {CREDIT_PACKS.map((p, i) => {
          const featured = i === 1;
          return (
            <div
              key={p.id}
              className={`relative flex flex-col border bg-white/[0.03] p-6 ${
                featured ? "border-[#ff3b30]" : "border-white/15"
              }`}
            >
              {featured && (
                <span className="absolute -top-3 left-6 bg-[#ff3b30] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white">
                  Best value
                </span>
              )}
              <div className="font-display text-2xl uppercase">{p.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-5xl text-[#ff3b30]">{p.credits}</span>
                <span className="text-sm text-white/40">credits</span>
              </div>
              <div className="mt-1 text-[13px] text-white/55">{p.priceLabel} · one-time, never expires</div>
              <button
                onClick={() => buyPack(p.id)}
                disabled={busy === p.id}
                className={`mt-6 flex items-center justify-center gap-2 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] disabled:opacity-50 ${
                  featured
                    ? "bg-[#ff3b30] text-white hover:bg-white hover:text-black"
                    : "border border-white/25 text-white/85 hover:bg-white hover:text-black"
                }`}
              >
                {busy === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : `Get ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* what credits buy */}
      <div className="mt-14">
        <h2 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          <Coins className="h-3.5 w-3.5" /> What each action costs
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-px border border-white/15 bg-white/10 sm:grid-cols-2">
          {actions.map((k) => (
            <div key={k} className="flex items-center justify-between gap-2 bg-[#0a0a0a] px-4 py-3">
              <span className="text-sm text-white/80">{ACTION_LABELS[k]}</span>
              <span className="font-mono text-sm text-[#ff3b30]">{CREDIT_COSTS[k]} cr</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
