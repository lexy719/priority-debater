"use client";

/**
 * CreditsPageView — the page behind the credit badge. Shows the live balance,
 * exactly what each AI action costs, the top-up packs, and recent history.
 * "Get pack" starts a real Stripe Checkout; on any failure it surfaces an honest
 * retry note rather than a dead flow.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins, ArrowRight, Check, Sparkles, Loader2 } from "lucide-react";
import { CREDIT_COSTS, CREDIT_PACKS, SIGNUP_GRANT, type CreditAction } from "@/lib/credits/costs";
import { useCreditsState } from "@/components/credits/CreditsProvider";
import type { LedgerEntry } from "@/components/account/AccountView";

const ACTION_LABELS: Record<CreditAction, string> = {
  validation: "Idea validation",
  debate: "Chamber debate",
  brand_kit: "Brand kit",
  launch_kit: "Launch kit",
  campaign: "Campaign",
  landing: "Landing page",
  pitch: "Pitch deck",
  rescore: "Re-score",
  hd_voice: "HD tribunal voice",
};

const ACTION_NOTE: Partial<Record<CreditAction, string>> = {
  hd_voice: "per spoken turn",
};

function reasonLabel(r: string): string {
  if (r === "signup_grant") return "Signup bonus";
  if (r.startsWith("refund")) return "Refund";
  if (r.startsWith("pack") || r.startsWith("topup") || r.startsWith("grant")) return "Top-up";
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

type Props = {
  configured: boolean;
  authed: boolean;
  balance: number | null;
  ledger: LedgerEntry[];
};

export function CreditsPageView({ configured, authed, balance, ledger }: Props) {
  const [betaPack, setBetaPack] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [checkoutMsg, setCheckoutMsg] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);
  const { refresh } = useCreditsState();

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("checkout");
    if (p === "success") {
      setCheckoutMsg({ tone: "ok", text: "Payment complete — your credits have been added." });
      void refresh();
      window.history.replaceState({}, "", "/credits");
    } else if (p === "cancel") {
      setCheckoutMsg({ tone: "warn", text: "Checkout canceled — no charge was made." });
      window.history.replaceState({}, "", "/credits");
    }
  }, [refresh]);

  async function buyPack(packId: string) {
    if (buying) return;
    setBuying(packId);
    try {
      const res = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      if (res.status === 401) {
        window.location.href = "/login?next=/credits";
        return;
      }
      const j = await res.json();
      if (res.ok && j.url) {
        window.location.href = j.url as string;
        return;
      }
      // 503 (beta) or any error → show the honest beta note inline.
      setBetaPack(packId);
    } catch {
      setBetaPack(packId);
    } finally {
      setBuying(null);
    }
  }

  return (
    <main className="mx-auto max-w-[980px] px-5 py-16 sm:py-20">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">§ Credits</p>
      <h1 className="mt-2 font-display text-4xl uppercase leading-[0.95] sm:text-5xl">
        Fuel for the <span className="bg-[#ff3b30] px-2">engine.</span>
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60">
        Every account starts with {SIGNUP_GRANT} free credits. Spend them on validations, debates and
        the studio — top up only when you want more.
      </p>

      {checkoutMsg && (
        <div
          className={`mt-6 border px-4 py-3 text-sm ${
            checkoutMsg.tone === "ok"
              ? "border-[#32d74b]/40 bg-[#32d74b]/10 text-[#32d74b]"
              : "border-[#ffd60a]/40 bg-[#ffd60a]/10 text-[#ffd60a]"
          }`}
        >
          {checkoutMsg.text}
        </div>
      )}

      {/* balance / signup */}
      <div className="mt-10 grid gap-4 sm:grid-cols-[1.2fr_1fr]">
        <div className="border border-white/15 bg-white/[0.03] p-6">
          {authed ? (
            <>
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                <Coins className="h-3 w-3" /> Your balance
              </div>
              <div className="mt-1 font-display text-6xl text-[#ff3b30]">{balance ?? "—"}</div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">credits available</div>
            </>
          ) : (
            <>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Start free</div>
              <div className="mt-1 font-display text-6xl text-[#ff3b30]">{SIGNUP_GRANT}</div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">credits on signup</div>
              {configured && (
                <Link
                  href="/signup?next=/credits"
                  className="mt-4 inline-flex items-center gap-2 bg-[#ff3b30] px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black"
                >
                  Claim your credits <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </>
          )}
        </div>
        <div className="border border-[#ffd60a]/40 bg-[#ffd60a]/10 p-6">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#ffd60a]">
            <Sparkles className="h-3 w-3" /> Need more?
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-white/70">
            Top up with a one-time pack below (never expires), or go Pro for a monthly credit
            allowance plus premium features.
          </p>
        </div>
      </div>

      {/* what credits buy */}
      <section className="mt-12">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">What your credits buy</h2>
        <div className="mt-3 grid grid-cols-2 gap-px border border-white/15 bg-white/10 sm:grid-cols-3">
          {(Object.keys(CREDIT_COSTS) as CreditAction[]).map((k) => (
            <div key={k} className="flex items-center justify-between gap-2 bg-[#0a0a0a] px-4 py-3">
              <span className="text-sm text-white/80">
                {ACTION_LABELS[k]}
                {ACTION_NOTE[k] && <span className="block text-[10px] text-white/35">{ACTION_NOTE[k]}</span>}
              </span>
              <span className="font-mono text-sm text-[#ff3b30]">{CREDIT_COSTS[k]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* top-up packs */}
      <section className="mt-12">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Top-up packs</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {CREDIT_PACKS.map((p, i) => {
            const popular = i === 1;
            return (
              <div
                key={p.id}
                className={`relative flex flex-col border p-6 ${
                  popular ? "border-[#ff3b30] bg-[#ff3b30]/[0.06]" : "border-white/15 bg-white/[0.03]"
                }`}
              >
                {popular && (
                  <span className="absolute -top-2.5 left-6 bg-[#ff3b30] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white">
                    Best value
                  </span>
                )}
                <div className="font-display text-xl uppercase">{p.name}</div>
                <div className="mt-3 font-display text-4xl text-[#ff3b30]">{p.credits}</div>
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">credits</div>
                <div className="mt-3 text-sm text-white/70">{p.priceLabel} · one-time, never expires</div>
                <button
                  onClick={() => buyPack(p.id)}
                  disabled={buying === p.id}
                  className="mt-5 inline-flex items-center justify-center gap-2 border border-white/25 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/85 transition-colors hover:bg-white hover:text-black disabled:opacity-50"
                >
                  {buying === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : `Get ${p.name}`}
                </button>
                {betaPack === p.id && (
                  <p className="mt-3 text-[11px] leading-relaxed text-[#ff3b30]">
                    Couldn&apos;t start checkout. Please make sure you&apos;re signed in and try again.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* history */}
      {authed && (
        <section className="mt-12">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Recent activity</h2>
          <div className="mt-3 border border-white/15">
            {ledger.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-white/40">No activity yet.</p>
            ) : (
              <ul className="divide-y divide-white/10">
                {ledger.map((e, i) => (
                  <li key={i} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                    <span className="text-white/80">{reasonLabel(e.reason)}</span>
                    <span className="flex items-center gap-4">
                      <span className="font-mono text-[11px] text-white/40">{fmtDate(e.created_at)}</span>
                      <span className={`w-12 text-right font-mono ${e.delta >= 0 ? "text-[#32d74b]" : "text-[#ff3b30]"}`}>
                        {e.delta >= 0 ? "+" : ""}
                        {e.delta}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6 text-sm">
        <Link href="/account" className="inline-flex items-center gap-1.5 text-white/70 underline underline-offset-4 hover:text-white">
          <Check className="h-3.5 w-3.5" /> Manage account
        </Link>
        <Link href="/commerce" className="inline-flex items-center gap-1.5 text-white/70 underline underline-offset-4 hover:text-white">
          Try the AI Commerce audit <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </main>
  );
}
