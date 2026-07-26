import { NextResponse } from "next/server";
import { buildAgentCatalog } from "@/lib/studio/aiStorefront";
import { recordHit } from "@/lib/studio/hitRepo";
import { loadBusinessStore } from "@/lib/studio/businessSource";

/** Machine-readable agent catalog (product intelligence) for the published store. */
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await loadBusinessStore(slug);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  await recordHit(slug, "catalog", `/store/${slug}/agent-catalog.json`, req.headers.get("user-agent"));
  const base = `/store/${slug}`;
  const catalog = {
    ...buildAgentCatalog(s.store),
    endpoints: {
      catalog: `${base}/agent-catalog.json`,
      feed: `${base}/feed.jsonl`,
      feedTsv: `${base}/feed.tsv`,
      llms: `${base}/llms.txt`,
      sitemap: `${base}/sitemap.xml`,
      mcp: { url: `${base}/mcp`, transport: "http-jsonrpc", tools: ["search_products", "get_product", "place_order"] },
      ucp: `${base}/.well-known/ucp`,
      agentCard: `${base}/.well-known/agent-card.json`,
      order: { method: "POST", url: `/api/store/${slug}/order`, contentType: "application/json", body: ["sku", "qty", "name", "email", "address"], returns: ["orderId", "status", "total", "confirmation"] },
      checkout: `${base}/checkout?sku=<sku>`,
    },
    policies: {
      shipping: s.manifest.ships ?? "EU · 3–5 business days",
      returns: s.manifest.returns ?? "30 days, unopened",
      shippingUrl: `${base}/shipping`,
      termsUrl: `${base}/terms`,
      payment: "no payment at order time — order-intent checkout; merchant of record: " + s.store.brand.fullName,
    },
  };
  return NextResponse.json(catalog, {
    headers: { "cache-control": "no-store", "access-control-allow-origin": "*" },
  });
}
