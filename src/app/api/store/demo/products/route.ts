/**
 * GET /api/store/demo/products
 * A browsable product endpoint for AI agents — the "backend" of the autonomous
 * store. Supports the queries an agent actually makes:
 *   ?category=Subscription   ?maxPrice=20   ?q=decaf   ?available=true
 * Returns structured products (product intelligence), not HTML.
 */

import { DEMO_STORE } from "@/lib/studio/demoStore";

export function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category")?.toLowerCase();
  const maxPrice = url.searchParams.get("maxPrice");
  const q = url.searchParams.get("q")?.toLowerCase();
  const availableOnly = url.searchParams.get("available") === "true";

  let items = DEMO_STORE.products.map((p) => ({
    id: p.sku,
    name: p.name,
    description: p.description,
    category: p.category,
    price: p.price,
    priceValue: p.priceValue,
    currency: p.currency || "EUR",
    availability: p.availability || "InStock",
    forAudience: DEMO_STORE.brand.audience,
  }));

  if (category) items = items.filter((p) => p.category?.toLowerCase() === category);
  if (maxPrice != null && maxPrice !== "") items = items.filter((p) => (p.priceValue ?? Infinity) <= Number(maxPrice));
  if (q) items = items.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(q));
  if (availableOnly) items = items.filter((p) => p.availability === "InStock");

  return Response.json(
    { business: DEMO_STORE.brand.fullName, count: items.length, query: { category, maxPrice, q, availableOnly }, products: items },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60" } },
  );
}
