"use client";

/**
 * /commerce/billing — the trust-critical page (§4.9).
 *
 * Header derives EVERYTHING from computeBillingRecord() over attribution_events
 * — billing is never stored (§1.5). The ledger table is listBillableEvents():
 * every row is a real order id with its layer chip, source and the exact 8%
 * line, and the footer reconciles to the performance fee exactly. Layer-3
 * events are shown in a separate dimmed "never billed" section.
 */

import { useMemo, useState } from "react";
import { CommerceShell } from "@/components/commerce/Shell";
import { useCommerceStore } from "@/lib/commerce/data/useCommerceStore";
import {
  computeBillingRecord,
  listBillableEvents,
  periodOf,
  PERFORMANCE_FEE_RATE,
} from "@/lib/commerce/data/store";

function shiftPeriod(period: string, delta: number): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export default function BillingPage() {
  const s = useCommerceStore();
  const [period, setPeriod] = useState(() => periodOf(new Date().toISOString()));

  const billing = useMemo(
    () => (s.store ? computeBillingRecord(s.store.id, period) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s.store, period, s.attributionEvents],
  );
  const events = useMemo(
    () => (s.store ? listBillableEvents(s.store.id, period) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s.store, period, s.attributionEvents],
  );
  const layer3 = s.attributionEvents.filter((e) => e.period === period && e.layer === 3);

  if (s.loading) return <CommerceShell><div className="p-10 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">Loading…</div></CommerceShell>;
  if (!s.store || !billing) {
    return (
      <CommerceShell>
        <div className="mx-auto max-w-[860px] px-6 py-24 font-mono text-[12px] text-white/60">
          No store connected — billing derives from a connected store&apos;s attribution ledger.
        </div>
      </CommerceShell>
    );
  }

  const rawFee = billing.billable_revenue * PERFORMANCE_FEE_RATE;
  const capPct = billing.capped_at ? Math.min(100, (rawFee / billing.capped_at) * 100) : 0;
  const capClose = billing.capped_at !== null && capPct >= 75;

  return (
    <CommerceShell isDemo={s.isDemo} onDemoCleared={s.refresh}>
      <div className="mx-auto max-w-[1120px] px-5 py-8 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
              Billing — every euro traceable to a real order
            </div>
            <h1 className="mt-2 font-display text-[clamp(1.75rem,4vw,3rem)] uppercase leading-[0.95]">
              €{billing.total} <span className="text-white/40">/ {period}</span>
            </h1>
          </div>
          <div className="flex items-center gap-px bg-fk-ink-border font-mono text-[11px]">
            <button type="button" onClick={() => setPeriod((p) => shiftPeriod(p, -1))} className="cursor-pointer border-0 bg-fk-card-dark px-3 py-2 text-white/60 hover:text-white" style={{ transition: "none", borderRadius: 0 }}>←</button>
            <span className="bg-fk-card-dark px-4 py-2 text-fk-cream">{period}</span>
            <button type="button" onClick={() => setPeriod((p) => shiftPeriod(p, 1))} className="cursor-pointer border-0 bg-fk-card-dark px-3 py-2 text-white/60 hover:text-white" style={{ transition: "none", borderRadius: 0 }}>→</button>
          </div>
        </div>

        {/* Derived record */}
        <div className="mt-8 grid gap-px bg-fk-ink-border sm:grid-cols-4">
          {[
            { l: "Plan", v: `${billing.plan} — €${billing.base_fee}/mo base` },
            { l: "AI-attributed revenue (L1+L2)", v: `€${billing.billable_revenue}` },
            { l: `Performance fee (${Math.round(PERFORMANCE_FEE_RATE * 100)}%)`, v: `€${billing.performance_fee}` },
            { l: "Total this period", v: `€${billing.total}` },
          ].map((c) => (
            <div key={c.l} className="bg-fk-card-dark p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">{c.l}</div>
              <div className="mt-2 font-mono text-lg text-fk-cream">{c.v}</div>
            </div>
          ))}
        </div>

        {/* Growth cap indicator (§4.9 + §8 cap warning) */}
        {billing.capped_at !== null && (
          <div className="mt-6 border border-fk-ink-border p-4">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em]">
              <span className="text-white/45">Performance-fee cap — €{billing.capped_at}/mo</span>
              <span style={{ color: capClose ? "var(--fk-amber)" : "rgba(255,255,255,0.45)" }}>
                €{Math.round(rawFee)} of €{billing.capped_at}
              </span>
            </div>
            <div className="mt-3 h-2 w-full bg-fk-ink-border">
              <div className="h-full" style={{ width: `${capPct}%`, background: capClose ? "var(--fk-amber)" : "var(--fk-blue)" }} />
            </div>
            {capClose && (
              <p className="mt-3 font-mono text-[11px] text-fk-amber">
                Heads-up: you&apos;re approaching the cap. Above it, everything else this month is fee-free — no surprise bill.
              </p>
            )}
          </div>
        )}

        {/* The ledger */}
        <section className="mt-10">
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
            Ledger — the {events.length} orders behind the €{billing.performance_fee} fee
          </div>
          {events.length === 0 ? (
            <p className="mt-4 font-mono text-[12px] text-white/45">No billable AI-attributed orders this period.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse font-mono text-[12px]">
                <thead>
                  <tr className="border-b border-fk-ink-border text-left text-[10px] uppercase tracking-[0.18em] text-white/40">
                    <th className="py-2 pr-4">Order</th>
                    <th className="py-2 pr-4">Layer</th>
                    <th className="py-2 pr-4">Source</th>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4 text-right">Attributed €</th>
                    <th className="py-2 text-right">{Math.round(PERFORMANCE_FEE_RATE * 100)}% line</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id} className="border-b border-fk-ink-border/60 text-white/75">
                      <td className="py-2 pr-4 text-fk-cream">{e.order_id}</td>
                      <td className="py-2 pr-4">
                        <span className="px-1.5 py-0.5 text-[9px] uppercase" style={{ background: e.layer === 1 ? "var(--fk-green)" : "var(--fk-blue)", color: e.layer === 1 ? "#000" : "#fff" }}>
                          L{e.layer}
                        </span>
                      </td>
                      <td className="py-2 pr-4">{e.source ?? "—"}</td>
                      <td className="py-2 pr-4 text-white/50">{e.occurred_at.slice(0, 10)}</td>
                      <td className="py-2 pr-4 text-right">€{e.incremental_revenue.toFixed(2)}</td>
                      <td className="py-2 text-right">€{(e.incremental_revenue * PERFORMANCE_FEE_RATE).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="text-fk-cream">
                    <td colSpan={4} className="py-3 text-[10px] uppercase tracking-[0.18em] text-white/45">
                      Reconciliation — Σ orders × {Math.round(PERFORMANCE_FEE_RATE * 100)}%{billing.capped_at !== null ? `, capped at €${billing.capped_at}` : ""}
                    </td>
                    <td className="py-3 text-right">€{billing.billable_revenue.toFixed(2)}</td>
                    <td className="py-3 text-right">€{billing.performance_fee.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        {/* Layer-3 — shown, dimmed, never billed */}
        {layer3.length > 0 && (
          <section className="mt-10 opacity-60">
            <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
              Directional impact (layer 3) — shown for context, never billed
            </div>
            <div className="mt-4 space-y-px bg-fk-ink-border">
              {layer3.map((e) => (
                <div key={e.id} className="flex items-center justify-between bg-fk-card-dark p-3 font-mono text-[12px] text-white/50">
                  <span>{e.order_id} · {e.source ?? "estimate"}</span>
                  <span>€{e.incremental_revenue.toFixed(2)} — not billed</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </CommerceShell>
  );
}
