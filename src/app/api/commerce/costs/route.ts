import { NextResponse } from "next/server";
import { recordActivity } from "@/lib/studio/activityRepo";
import { loadCosts, saveCosts, type CostMap } from "@/lib/studio/costRepo";

/**
 * GET  /api/commerce/costs?slug=  → the per-SKU unit costs on file.
 * POST /api/commerce/costs        → { slug, costs: { sku: unitCost } } saves them,
 *                                   unlocking margin/COGS in the Finance view.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  return NextResponse.json({ ok: true, costs: await loadCosts(slug) }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  let body: { slug?: string; costs?: CostMap };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const slug = String(body.slug ?? "");
  if (!slug || typeof body.costs !== "object" || !body.costs) return NextResponse.json({ ok: false, error: "slug and costs required" }, { status: 400 });
  try {
    const costs = await saveCosts(slug, body.costs);
    await recordActivity(slug, "SYSTEM", `Unit costs updated for ${Object.keys(costs).length} SKU(s) — margin now computed from real cost data`);
    return NextResponse.json({ ok: true, costs });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
