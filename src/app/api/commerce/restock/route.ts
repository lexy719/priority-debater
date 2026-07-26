import { NextResponse } from "next/server";
import { recordActivity } from "@/lib/studio/activityRepo";
import { loadStore, saveStore } from "@/lib/studio/storeRepo";

/**
 * POST /api/commerce/restock — { slug, sku, qty } adds units to a SKU.
 * The Operations Agent's replenishment action: stock rises, availability
 * returns to InStock, the storefront + feed tell agents immediately, and the
 * move lands in the ledger.
 */

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { slug?: string; sku?: string; qty?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const slug = String(body.slug ?? "");
  const sku = String(body.sku ?? "");
  const qty = Math.max(1, Math.min(500, Number(body.qty) || 12));
  if (!slug || !sku) return NextResponse.json({ ok: false, error: "slug and sku required" }, { status: 400 });

  const s = await loadStore(slug);
  const p = s?.store.products.find((x) => x.sku === sku);
  if (!s || !p) return NextResponse.json({ ok: false, error: "sku not found" }, { status: 404 });

  p.stock = (p.stock ?? 0) + qty;
  if (p.availability === "OutOfStock") p.availability = "InStock";
  await saveStore(s);
  await recordActivity(slug, "OPERATIONS", `Restocked ${p.name} +${qty} → ${p.stock} units${p.availability === "InStock" ? " · available to agents again" : ""}`);
  return NextResponse.json({ ok: true, sku, stock: p.stock, availability: p.availability });
}
