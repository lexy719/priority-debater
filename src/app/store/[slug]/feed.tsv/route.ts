import { isStocked } from "@/lib/studio/aiStorefront";
import { recordHit } from "@/lib/studio/hitRepo";
import { loadStore } from "@/lib/studio/storeRepo";

/**
 * GET /store/[slug]/feed.tsv — the catalogue in Google Merchant Center's
 * tab-delimited format, the one shape every feed programme ingests.
 *
 * Multi-standard by design: JSONL (OpenAI-style) at /feed.jsonl, TSV here.
 * Same measured truth in both — price and availability come from the live
 * store record, so a feed can never disagree with the product page.
 */

export const dynamic = "force-dynamic";

const COLS = [
  "id", "title", "description", "link", "image_link", "availability", "price",
  "material", "origin_country", "made_by", "lead_time", "kind", "pricing_unit",
  "condition", "brand", "identifier_exists", "product_type", "shipping_label", "custom_label_0",
] as const;

/** TSV cannot contain tabs or newlines in a field. */
const cell = (v: string | number | boolean) => String(v).replace(/[\t\r\n]+/g, " ").trim();

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await loadStore(slug);
  if (!s) return new Response("not found", { status: 404 });
  await recordHit(slug, "feed", `/store/${slug}/feed.tsv`, req.headers.get("user-agent"));

  const origin = new URL(req.url).origin;
  const base = `${origin}/store/${slug}`;
  // Retired products leave the buyable shelf; their pages stay online. Services
  // and access passes are excluded too: this is a MERCHANDISE feed, and a
  // Merchant Center row for an hour of consulting would be rejected — the JSONL
  // feed and the MCP tools carry those instead.
  const rows = s.store.products
    .filter((p) => p.availability !== "Discontinued" && (p.kind ?? "good") !== "service" && p.kind !== "access")
    .map((p) => {
    const avail = (p.availability ?? "InStock") === "PreOrder" ? "preorder"
      : (p.availability ?? "InStock") === "OutOfStock" || (isStocked(p.kind) && (p.stock ?? 1) <= 0) ? "out_of_stock" : "in_stock";
    return [
      p.sku ?? "", p.name, p.description, `${base}/p/${p.sku}`, `${base}/img/${p.sku}.svg`,
      avail,
      p.priceValue != null ? `${p.priceValue.toFixed(2)} ${p.currency ?? "EUR"}` : p.price,
      p.provenance?.material ?? "", p.provenance?.origin ?? "", p.provenance?.madeBy ?? "", p.provenance?.leadTime ?? "",
      p.kind ?? "good", p.unit ?? "item",
      "new", s.store.brand.name,
      // No registered GTINs for fabricated SKUs — declared, never faked.
      "no", p.category ?? "Product",
      s.manifest.ships ?? "EU",
      /\/(mo|yr)$/.test(p.price) ? "subscription" : "one-off",
    ].map(cell).join("\t");
  });

  const body = [COLS.join("\t"), ...rows].join("\n") + "\n";
  return new Response(body, {
    headers: {
      "content-type": "text/tab-separated-values; charset=utf-8",
      "content-disposition": `inline; filename="${slug}-merchant-feed.tsv"`,
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}
