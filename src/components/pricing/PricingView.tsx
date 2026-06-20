"use client";

/**
 * PricingView — the /pricing hub: recurring premium plans + one-time credit
 * packs, all wired to Stripe Checkout (and the billing portal for managing an
 * active subscription). Degrades to an honest "beta" note until billing keys
 * are set.
 */

import { useEffect, useState } from "react";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { CREDIT_PACKS } from "@/lib/credits/costs";

type Props = { authed: boolean; currentPlan: string; balance: number | null };

export function PricingView({ authed, currentPlan, balance }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [beta, setBeta] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);

  useEffect(() => {
    const sub = new URLSearchParams(window.location.search).get("sub");
    if (sub === "cancel") {
      setNote({ tone: "warn", text: "Checkout canceled — no charge was made." });
      window.history.replaceState({}, "", "/pricing");
    }
  }, []);

  async function post(url: string, payload: object, key: string) {
    if (busy) return;
    if (!authed) {
      window.location.href = "/login?next=/pricing";
      return;
    }
    setBusy(key);
    setBeta(false);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      setBeta(true);
    } catch {
      setBeta(true);
    } finally {
      setBusy(null);
    }
  }

  const subscribe = (planId: string) => post("/api/billing/subscribe", { planId }, `plan:${planId}`);
  const buyPack = (packId: string) => post("/api/credits/checkout", { packId }, `pack:${packId}`);
  const manage = () => post("/api/billing/portal", {}, "portal");

  return (
    <main className="mx-auto max-w-[1100px] px-5 py-16 sm:py-20">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">§ Pricing</p>
      <h1 className="mt-2 font-display text-4xl uppercase leading-[0.95] sm:text-5xl">
        Pick your <span className="bg-[#ff3b30] px-2">plan.</span>
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60">
        Start free with 50 credits. Upgrade for the real AI Commerce audit, the Fix Toolkit, HD
        tribunal voice and a monthly credit allowance. Cancel anytime.
      </p>

      {note && (
        <div
          className={`mt-6 border px-4 py-3 text-sm ${
            note.tone === "ok"
              ? "border-[#32d74b]/40 bg-[#32d74b]/10 text-[#32d74b]"
              : "border-[#ffd60a]/40 bg-[#ffd60a]/10 text-[#ffd60a]"
          }`}
        >
          {note.text}
        </div>
      )}
      {beta && (
        <div className="mt-6 border border-[#ff3b30]/40 bg-[#ff3b30]/10 px-4 py-3 text-sm text-[#ff3b30]">
          Couldn&apos;t start checkout. Please make sure you&apos;re signed in and try again.
        </div>
      )}

      {/* subscription plans */}
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const isCurrent = currentPlan === p.id;
          const featured = p.id === "pro";
          return (
            <div
              key={p.id}
              className={`relative flex flex-col border bg-white/[0.03] p-6 ${
                featured ? "border-[#ff3b30]" : "border-white/15"
              }`}
            >
              {featured && (
                <span className="absolute -top-3 left-6 bg-[#ff3b30] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white">
                  Most popular
                </span>
              )}
              <div className="font-display text-2xl uppercase">{p.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-4xl text-[#ff3b30]">{p.priceLabel}</span>
                {p.premium && <span className="text-sm text-white/40">/mo</span>}
              </div>
              <p className="mt-1 text-[12px] text-white/50">{p.tagline}</p>

              <ul className="mt-5 flex-1 space-y-2 text-[13px]">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-white/75">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#32d74b]" /> {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {!p.premium ? (
                  <div className="border border-white/15 px-4 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
                    {isCurrent ? "Your plan" : "Free forever"}
                  </div>
                ) : isCurrent ? (
                  <button
                    onClick={manage}
                    disabled={busy === "portal"}
                    className="flex w-full items-center justify-center gap-2 border border-white/25 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/85 hover:bg-white hover:text-black disabled:opacity-50"
                  >
                    {busy === "portal" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Manage plan"}
                  </button>
                ) : (
                  <button
                    onClick={() => subscribe(p.id)}
                    disabled={busy === `plan:${p.id}`}
                    className={`flex w-full items-center justify-center gap-2 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] disabled:opacity-50 ${
                      featured
                        ? "bg-[#ff3b30] text-white hover:bg-white hover:text-black"
                        : "border border-white/25 text-white/85 hover:bg-white hover:text-black"
                    }`}
                  >
                    {busy === `plan:${p.id}` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        Get {p.name} <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* one-time packs */}
      <div className="mt-14">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          Or top up — one-time credit packs {balance !== null && <span>· {balance} credits now</span>}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {CREDIT_PACKS.map((p) => (
            <div key={p.id} className="flex items-center justify-between border border-white/15 bg-white/[0.03] p-4">
              <div>
                <div className="font-display text-xl">{p.name}</div>
                <div className="text-[12px] text-white/50">
                  {p.credits} credits · {p.priceLabel}
                </div>
              </div>
              <button
                onClick={() => buyPack(p.id)}
                disabled={busy === `pack:${p.id}`}
                className="inline-flex items-center gap-2 border border-white/25 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/85 hover:bg-white hover:text-black disabled:opacity-50"
              >
                {busy === `pack:${p.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Buy"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
