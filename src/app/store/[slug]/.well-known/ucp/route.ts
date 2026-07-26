import { NextResponse } from "next/server";
import { loadStore } from "@/lib/studio/storeRepo";

/**
 * GET /store/[slug]/.well-known/ucp — the store's agent-commerce profile.
 *
 * UCP (Google + Shopify + Microsoft) is the converging discovery standard: an
 * agent fetches a profile to learn what the merchant supports before trying to
 * transact. This profile declares ONLY what is genuinely implemented —
 * catalog + structured order-intent, with checkout escalating to the store's
 * own hosted page (`continue_url`), which is the minimal honest posture for an
 * indie merchant. Nothing here claims a payment capability we don't have.
 *
 * Served per store because a hosted store lives at /store/<slug>; a store on
 * its own custom domain would serve the same document at the domain root.
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await loadStore(slug);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  const origin = new URL(req.url).origin;
  const base = `${origin}/store/${slug}`;

  return NextResponse.json(
    {
      ucp_version: "2026-04-08",
      profile: "merchant",
      merchant: {
        name: s.store.brand.fullName,
        mark: s.store.brand.name,
        url: base,
        contact: `orders@${s.store.brand.domain}`,
        merchant_of_record: s.store.brand.fullName,
        currency: "EUR",
      },
      capabilities: {
        catalog: {
          supported: true,
          feed: `${base}/feed.jsonl`,
          feed_tsv: `${base}/feed.tsv`,
          catalog: `${base}/agent-catalog.json`,
          product_url_template: `${base}/p/{sku}`,
        },
        // Honest: we accept a structured order intent and confirm it. We do not
        // hold payment credentials — payment escalates to the merchant page.
        order_intent: {
          supported: true,
          endpoint: `${origin}/api/store/${slug}/order`,
          method: "POST",
          content_type: "application/json",
          body: ["sku", "qty", "name", "email", "address"],
          returns: ["orderId", "status", "total", "confirmation"],
        },
        checkout: {
          supported: true,
          mode: "escalate",
          continue_url: `${base}/checkout?sku={sku}`,
          guest: true,
          captcha: false,
          account_required: false,
        },
        payment: { supported: false, note: "Orders are received and confirmed; payment instructions follow. No card data is accepted by protocol." },
        mcp: { supported: true, endpoint: `${base}/mcp`, transport: "http-jsonrpc" },
        // Two things an agent needs before it commits: what the thing IS, and
        // how this seller has actually behaved. Both are declared, both measured.
        provenance: {
          supported: true,
          fields: ["material", "origin", "madeBy", "leadTime", "care", "warranty", "weight", "dimensions"],
          note: "Declared per product where known; an undeclared attribute is absent rather than guessed. Filterable via the MCP search_products tool (madeBy, origin).",
        },
        seller_record: {
          supported: true,
          endpoint: `${base}/.well-known/seller-record.json`,
          basis: "this store's own order ledger",
          third_party_attested: false,
        },
      },
      policies: {
        shipping: s.manifest.ships ?? "EU · 3–5 business days",
        returns: s.manifest.returns ?? "30 days, unopened",
        terms_url: `${base}/terms`,
        shipping_url: `${base}/shipping`,
      },
      generator: "PDR Commerce",
    },
    { headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } },
  );
}
