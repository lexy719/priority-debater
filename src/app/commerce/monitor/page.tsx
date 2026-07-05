"use client";

/**
 * /commerce/monitor — trends, attribution, restock signals (§4.6, §12.3).
 *
 * Revenue is ALWAYS the primary axis — €-recovered over time (fk-blue), never
 * a visibility %. Attribution totals are broken down per layer with mono
 * confidence labels; layer 3 is marked "directional — never billed" (§1.5).
 * Restock signals reuse the same velocity model as Today's Actions.
 */

import { useMemo, useState } from "react";
import { CommerceShell } from "@/components/commerce/Shell";
import { useCommerceStore } from "@/lib/commerce/data/useCommerceStore";
import { getCredentials } from "@/lib/commerce/data/credentials";
import { syncAttribution } from "@/lib/commerce/attribution";
import { restockSignals } from "@/lib/commerce/actions";
import type { AttributionEvent } from "@/lib/commerce/data/types";

const WEEKS = 8;

function weeklyRecovered(events: AttributionEvent[]): { label: string; total: number }[] {
  const now = Date.now();
  const buckets: { label: string; total: number }[] = [];
  for (let w = WEEKS - 1; w >= 0; w--) {
    const start = now - (w + 1) * 7 * 86_400_000;
    const end = now - w * 7 * 86_400_000;
    const total = events
      .filter((e) => (e.layer === 1 || e.layer === 2))
      .filter((e) => {
        const t = Date.parse(e.occurred_at);
        return t >= start && t < end;
      })
      .reduce((s, e) => s + e.incremental_revenue, 0);
    buckets.push({ label: new Date(end).toISOString().slice(5, 10), total: Math.round(total) });
  }
  return buckets;
}

const LAYER_META: { layer: 1 | 2 | 3; name: string; confidence: string; billable: boolean }[] = [
  { layer: 1, name: "Direct agent checkout", confidence: "Ground truth — order metadata", billable: true },
  { layer: 2, name: "Referral-matched", confidence: "Strong — AI-surface referrer, last-non-direct click", billable: true },
  { layer: 3, name: "Incrementality estimate", confidence: "Directional — never billed", billable: false },
];

export default function MonitorPage() {
  const s = useCommerceStore();
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [digest, setDigest] = useState<"email" | "whatsapp">("email");

  const weeks = useMemo(() => weeklyRecovered(s.attributionEvents), [s.attributionEvents]);
  const restock = useMemo(() => restockSignals(s.products, s.attributionEvents), [s.products, s.attributionEvents]);

  if (s.loading) return <CommerceShell><div className="p-10 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">Loading…</div></CommerceShell>;
  if (!s.store) {
    return (
      <CommerceShell>
        <div className="mx-auto max-w-[860px] px-6 py-24 font-mono text-[12px] text-white/60">
          No store connected — connect one from the Command Center first.
        </div>
      </CommerceShell>
    );
  }

  const credentials = getCredentials(s.store.id);
  const canSync = !s.isDemo && !!credentials && credentials.platform !== "generic";
  const max = Math.max(1, ...weeks.map((w) => w.total));
  const totalRecovered = Math.round(
    s.attributionEvents.filter((e) => e.layer !== 3).reduce((sum, e) => sum + e.incremental_revenue, 0),
  );

  async function sync() {
    if (!s.store || !credentials) return;
    setSyncing(true);
    const res = await syncAttribution(s.store, credentials);
    setSyncing(false);
    setSyncNote(res.ok ? `Synced — ${res.ordersSeen} orders read, ${res.eventsCreated} new AI-attributed` : res.detail ?? "Sync failed");
    s.refresh();
  }

  return (
    <CommerceShell isDemo={s.isDemo} onDemoCleared={s.refresh}>
      <div className="mx-auto max-w-[1400px] px-5 py-8 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">Monitor — {s.store.name}</div>
            <h1 className="mt-2 font-display text-[clamp(1.75rem,4vw,3rem)] uppercase leading-[0.95]">
              €{totalRecovered} recovered
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {canSync ? (
              <button
                type="button"
                onClick={() => void sync()}
                disabled={syncing}
                className="cursor-pointer border border-white/25 bg-transparent px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/80 hover:border-white hover:text-white disabled:opacity-50"
                style={{ transition: "none", borderRadius: 0 }}
              >
                {syncing ? "Syncing…" : "Sync orders"}
              </button>
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                {s.isDemo ? "Demo data — order sync disabled" : "Order sync needs a Shopify/Woo connection"}
              </span>
            )}
          </div>
        </div>
        {syncNote && <p className="mt-4 font-mono text-[12px] text-fk-blue">{syncNote}</p>}

        {/* €-recovered chart (fk-blue, hard edges, mono axis) */}
        <section className="mt-10 border border-fk-ink-border bg-fk-card-dark p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
            € recovered per week — layers 1 + 2 only
          </div>
          <div className="mt-6 flex h-[180px] items-end gap-px">
            {weeks.map((w) => (
              <div key={w.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="font-mono text-[10px] text-white/60">{w.total > 0 ? `€${w.total}` : ""}</div>
                <div
                  className="w-full"
                  style={{ background: "var(--fk-blue)", height: `${Math.max(2, (w.total / max) * 130)}px` }}
                />
                <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/35">{w.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Attribution breakdown per layer */}
        <section className="mt-8">
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
            Attribution breakdown — how confident each euro is
          </div>
          <div className="mt-4 grid gap-px bg-fk-ink-border md:grid-cols-3">
            {LAYER_META.map((meta) => {
              const events = s.attributionEvents.filter((e) => e.layer === meta.layer);
              const total = Math.round(events.reduce((sum, e) => sum + e.incremental_revenue, 0));
              return (
                <div key={meta.layer} className={`bg-fk-card-dark p-5 ${meta.billable ? "" : "opacity-60"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
                      Layer {meta.layer} — {meta.name}
                    </span>
                    <span
                      className="px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]"
                      style={meta.billable ? { background: "var(--fk-green)", color: "#000" } : { border: "1px solid var(--fk-amber)", color: "var(--fk-amber)" }}
                    >
                      {meta.billable ? "Billable" : "Never billed"}
                    </span>
                  </div>
                  <div className="mt-3 font-mono text-2xl text-fk-cream">€{total}</div>
                  <div className="mt-1 font-mono text-[10px] text-white/40">{events.length} events · {meta.confidence}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Restock signals (§12.3 — advisory, never auto-reorder) */}
        <section className="mt-8">
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
            Restock signals — AI-driven demand vs. stock (advisory)
          </div>
          {restock.length === 0 ? (
            <p className="mt-4 font-mono text-[12px] text-white/45">
              No restock risk detected. Unlocks meaningfully after 14 days of attributed sales
              with 5+ orders on a product (§1.6).
            </p>
          ) : (
            <div className="mt-4 space-y-px bg-fk-ink-border">
              {restock.map((r) => (
                <div key={r.product.id} className="flex flex-wrap items-center justify-between gap-3 bg-fk-card-dark p-4">
                  <span className="text-sm text-fk-cream">{r.product.title}</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--fk-blue)" }}>
                    {r.attributedOrders} AI orders · {r.estimate}
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">
            Assumes ~25 units in stock (no inventory feed connected) — advisory only, you order
          </p>
        </section>

        {/* Weekly digest preference */}
        <section className="mt-8 border border-fk-ink-border p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">Weekly digest</div>
          <p className="mt-3 max-w-lg font-mono text-[12px] leading-relaxed text-white/60">
            &quot;€{Math.round(totalRecovered / 4)} recovered this week. Top opportunity:{" "}
            {s.products.find((p) => (p.estimated_monthly_loss ?? 0) > 0)?.title ?? "run a scan"}.&quot;
          </p>
          <div className="mt-4 flex gap-px bg-fk-ink-border w-fit">
            {(["email", "whatsapp"] as const).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setDigest(ch)}
                className={`cursor-pointer border-0 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] ${
                  digest === ch ? "bg-fk-cream text-fk-black" : "bg-fk-card-dark text-white/50 hover:text-white"
                }`}
                style={{ transition: "none", borderRadius: 0 }}
              >
                {ch}
              </button>
            ))}
          </div>
          {digest === "whatsapp" && (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-fk-amber">
              WhatsApp delivery: provider not configured yet — TODO stub, email used meanwhile
            </p>
          )}
        </section>
      </div>
    </CommerceShell>
  );
}
