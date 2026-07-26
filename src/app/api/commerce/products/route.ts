import { NextResponse } from "next/server";
import { addProduct, restoreProduct, retireProduct, updateProduct } from "@/lib/studio/catalogOps";
import { loadStore } from "@/lib/studio/storeRepo";

/**
 * Website management — the catalog behind the live storefront.
 * GET    ?slug=                              → the catalog as stored
 * POST   {slug, name, description, price, …} → add a product
 * PUT    {slug, sku, op:"update"|"retire"|"restore", price?, stock?, …}
 *
 * Every write lands in the same published-store document that the SSR
 * storefront, JSON-LD, product feeds, llms.txt and the MCP tools read, so
 * agents see the change on their next fetch. There is no delete — a product is
 * retired so its URL keeps answering.
 *
 * (Not to be confused with /api/commerce/catalog, which READS an external
 * store through a connector.)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  const s = await loadStore(slug);
  if (!s) return NextResponse.json({ ok: false, error: "store not found" }, { status: 404 });
  return NextResponse.json({ ok: true, products: s.store.products }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  let body: { slug?: string; name?: string; description?: string; price?: string; category?: string; stock?: number; provenance?: Record<string, unknown>; kind?: string; unit?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const r = await addProduct(String(body.slug ?? ""), {
    name: String(body.name ?? ""), description: String(body.description ?? ""),
    price: String(body.price ?? ""), category: body.category, stock: body.stock, provenance: body.provenance,
    kind: body.kind, unit: body.unit,
  });
  return r.ok ? NextResponse.json(r) : NextResponse.json(r, { status: 400 });
}

export async function PUT(req: Request) {
  let body: { slug?: string; sku?: string; op?: string; price?: string; stock?: number; description?: string; category?: string; availability?: string; provenance?: Record<string, unknown>; kind?: string; unit?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const slug = String(body.slug ?? "");
  const sku = String(body.sku ?? "");
  const op = String(body.op ?? "update");
  const r = op === "retire" ? await retireProduct(slug, sku)
    : op === "restore" ? await restoreProduct(slug, sku)
    : await updateProduct(slug, sku, { price: body.price, stock: body.stock, description: body.description, category: body.category, availability: body.availability, provenance: body.provenance, kind: body.kind, unit: body.unit });
  return r.ok ? NextResponse.json(r) : NextResponse.json(r, { status: 400 });
}
