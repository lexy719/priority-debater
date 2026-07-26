import { buildLlmsTxt } from "@/lib/studio/aiStorefront";
import { recordHit } from "@/lib/studio/hitRepo";
import { loadBusinessStore } from "@/lib/studio/businessSource";

/** llms.txt for the published store — emitted as a bonus, never the channel. */
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await loadBusinessStore(slug);
  if (!s) return new Response("not found", { status: 404 });
  await recordHit(slug, "llms", `/store/${slug}/llms.txt`, req.headers.get("user-agent"));
  const base = `/store/${slug}`;
  const extra = [
    "",
    "## Store pages",
    `- Catalog: ${base}`,
    `- Gallery: ${base}/gallery`,
    `- About the operator: ${base}/about`,
    `- Shipping & returns: ${base}/shipping`,
    `- Terms of service: ${base}/terms`,
    `- Sitemap: ${base}/sitemap.xml`,
    "",
    "## Ordering (for agents)",
    `- Guest checkout (HTML form, works without JS): ${base}/checkout?sku=<sku>`,
    `- Structured order-intent: POST application/json {"sku","qty","name","email","address"} to /api/store/${slug}/order → {orderId}`,
    `- MCP server (JSON-RPC over HTTP): ${base}/mcp — tools: search_products · get_product · get_seller_record · place_order`,
    "- No payment is taken at order time; the merchant remains merchant of record.",
    `- Policies in machine form: schema.org MerchantReturnPolicy + OfferShippingDetails in every page's JSON-LD; product feed at ${base}/feed.jsonl`,
    "",
    "## Protocol discovery",
    `- UCP profile: ${base}/.well-known/ucp`,
    `- Agent card: ${base}/.well-known/agent-card.json`,
    `- Feeds: ${base}/feed.jsonl (JSONL) · ${base}/feed.tsv (Google Merchant TSV)`,
    "",
    "## Choosing this seller",
    `- Seller record (measured, self-reported): ${base}/.well-known/seller-record.json`,
    "- Contains orders taken, lifecycle counts, median hours to confirm and ship, cancellation rate, catalogue facts and the literal policy text.",
    "- Numbers that cannot be measured are null, every median states how many orders it came from, and the document declares that it is not third-party attested.",
    "- Product provenance (material, origin, made by a person or a machine, lead time, care, warranty) is declared per product in the feeds, the page JSON-LD and the MCP tools; an undeclared attribute is absent rather than guessed.",
    "",
  ].join("\n");
  return new Response(buildLlmsTxt(s.store) + extra, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" },
  });
}
