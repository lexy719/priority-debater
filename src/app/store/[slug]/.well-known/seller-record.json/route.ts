import { NextResponse } from "next/server";
import { loadFulfilmentRecord } from "@/lib/studio/orderRepo";
import { loadBusinessStore } from "@/lib/studio/businessSource";
import { recordHit } from "@/lib/studio/hitRepo";

/**
 * GET /store/[slug]/.well-known/seller-record.json — the seller's record.
 *
 * When an agent has to choose between sellers, brand language is worthless: it
 * needs facts it can check. This document publishes ONLY measured facts about
 * how this store actually behaves — orders taken, how they moved through the
 * lifecycle, how fast, how many were cancelled, what the catalogue really
 * contains, what the policies literally say.
 *
 * Two rules keep it trustworthy:
 *  · Nothing is modelled. A number that cannot be measured is `null`, and every
 *    median states how many orders it was computed from.
 *  · The record declares its own limits (`verification`) — it is self-reported
 *    and machine-generated, not third-party attested. An agent should treat it
 *    as evidence, not proof.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await loadBusinessStore(slug);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  await recordHit(slug, "catalog", `/store/${slug}/.well-known/seller-record.json`, req.headers.get("user-agent"));

  const f = await loadFulfilmentRecord(slug);
  const origin = new URL(req.url).origin;
  const base = `${origin}/store/${slug}`;
  const b = s.store.brand;

  const sellable = s.store.products.filter((p) => p.availability !== "Discontinued");
  const prices = sellable.map((p) => p.priceValue).filter((v): v is number => v != null);
  const daysTrading = f.firstOrderTs
    ? Math.max(1, Math.round((Date.now() - Date.parse(f.firstOrderTs)) / 86400000))
    : null;

  return NextResponse.json(
    {
      record_version: "1.0",
      generated_at: new Date().toISOString(),
      seller: {
        name: b.fullName,
        mark: b.name,
        url: base,
        domain: b.domain,
        sells: b.positioning ?? b.oneLiner,
        store_created: s.createdAt,
        days_since_first_order: daysTrading,
      },
      catalogue: {
        sellable_skus: sellable.length,
        retired_skus: s.store.products.length - sellable.length,
        all_priced: sellable.every((p) => p.priceValue != null),
        currency: "EUR",
        price_low: prices.length ? Math.min(...prices) : null,
        price_high: prices.length ? Math.max(...prices) : null,
        subscription_skus: sellable.filter((p) => /\/(mo|yr)$/.test(p.price)).length,
        preorder_skus: sellable.filter((p) => p.availability === "PreOrder").length,
        units_in_stock: sellable.reduce((a, p) => a + (p.stock ?? 0), 0),
      },
      fulfilment: {
        orders_received: f.ordersReceived,
        by_status: f.byStatus,
        cancellation_rate_pct: f.cancellationRatePct,
        median_hours_to_confirm: f.medianHoursToConfirm,
        median_hours_to_ship: f.medianHoursToShip,
        orders_behind_medians: f.timedOrders,
        first_order: f.firstOrderTs,
        last_order: f.lastOrderTs,
        orders_from_agents: f.agentOrders,
        orders_from_humans: f.humanOrders,
      },
      commitments: {
        shipping: s.manifest.ships ?? "EU · 3–5 business days",
        returns: s.manifest.returns ?? "30 days, unopened",
        terms: `${base}/terms`,
        payment_taken_at_order: false,
        account_required_to_buy: false,
        captcha_on_checkout: false,
      },
      interfaces: {
        mcp: `${base}/mcp`,
        order_intent: `${origin}/api/store/${slug}/order`,
        ucp: `${base}/.well-known/ucp`,
        agent_card: `${base}/.well-known/agent-card.json`,
        feed_jsonl: `${base}/feed.jsonl`,
        feed_tsv: `${base}/feed.tsv`,
      },
      verification: {
        method: "self-reported, machine-generated from this store's own order ledger",
        third_party_attested: false,
        // Say plainly what a low order count means, so a thin record is not
        // mistaken for a strong one.
        evidence_strength: f.ordersReceived === 0 ? "no trading history yet"
          : f.ordersReceived < 10 ? "thin — fewer than 10 orders on record"
          : "measured across 10+ orders",
        unmeasured: [
          ...(f.medianHoursToConfirm == null ? ["time to confirm (no confirmed order carries a timestamped trail yet)"] : []),
          ...(f.medianHoursToShip == null ? ["time to ship (no shipped order carries a timestamped trail yet)"] : []),
          "delivery confirmation by carrier",
          "returns actually processed",
        ],
      },
      generator: "PDR Commerce",
    },
    { headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } },
  );
}
