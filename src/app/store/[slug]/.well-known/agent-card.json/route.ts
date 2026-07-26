import { NextResponse } from "next/server";
import { loadStore } from "@/lib/studio/storeRepo";

/**
 * GET /store/[slug]/.well-known/agent-card.json — the store's agent card.
 *
 * The short "who are you and what can you do" document an agent reads first:
 * identity, skills, and the endpoints behind them. Complements the UCP profile
 * (capabilities) and the MCP endpoint (execution).
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await loadStore(slug);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  const origin = new URL(req.url).origin;
  const base = `${origin}/store/${slug}`;
  const b = s.store.brand;

  return NextResponse.json(
    {
      name: b.fullName,
      description: b.oneLiner,
      url: base,
      provider: { organization: b.fullName, url: base },
      version: "1.0",
      audience: b.audience ?? "general",
      skills: [
        { id: "browse-catalog", name: "Browse the catalogue", description: `List every product with price and availability (${s.store.products.length} SKUs).`, endpoint: `${base}/agent-catalog.json` },
        { id: "product-intelligence", name: "Read a product spec", description: "Full description, price, availability, policies for one SKU.", endpoint: `${base}/p/{sku}` },
        { id: "price-availability", name: "Check price and stock", description: "Structured Offer data with live availability.", endpoint: `${base}/feed.jsonl` },
        { id: "place-order", name: "Place an order", description: "Structured order intent; returns an order id and confirmation URL.", endpoint: `${origin}/api/store/${slug}/order` },
        { id: "seller-record", name: "Check the seller's record", description: "Measured fulfilment history — orders taken, lifecycle counts, median hours to confirm and ship, cancellation rate — with its own limits declared.", endpoint: `${base}/.well-known/seller-record.json` },
      ],
      interfaces: {
        mcp: `${base}/mcp`,
        ucp: `${base}/.well-known/ucp`,
        seller_record: `${base}/.well-known/seller-record.json`,
        feed_jsonl: `${base}/feed.jsonl`,
        feed_tsv: `${base}/feed.tsv`,
        llms_txt: `${base}/llms.txt`,
        sitemap: `${base}/sitemap.xml`,
      },
      policies: {
        shipping: s.manifest.ships ?? "EU · 3–5 business days",
        returns: s.manifest.returns ?? "30 days, unopened",
        terms: `${base}/terms`,
      },
      generator: "PDR Commerce",
    },
    { headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } },
  );
}
