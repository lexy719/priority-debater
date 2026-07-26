import { NextResponse } from "next/server";
import { ownedStore } from "@/lib/commerce/owner";
import { recordActivity } from "@/lib/studio/activityRepo";
import { loadStore, saveStore } from "@/lib/studio/storeRepo";

/**
 * POST /api/commerce/settings — { slug, ships?, returns? } edits the store
 * manifest. The storefront's policy pages + JSON-LD read the same record, so
 * agents see the change immediately.
 */

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { slug?: string; ships?: string; returns?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const slug = String(body.slug ?? "");
  const own = await ownedStore(slug);
  if (!own.ok) return NextResponse.json({ ok: false, error: own.error }, { status: own.status });
  const s = await loadStore(slug);
  if (!s) return NextResponse.json({ ok: false, error: "store not found" }, { status: 404 });
  if (typeof body.ships === "string" && body.ships.trim()) s.manifest.ships = body.ships.trim().slice(0, 120);
  if (typeof body.returns === "string" && body.returns.trim()) s.manifest.returns = body.returns.trim().slice(0, 120);
  await saveStore(s);
  await recordActivity(slug, "SYSTEM", `Settings updated — ships: "${s.manifest.ships}" · returns: "${s.manifest.returns}"`);
  return NextResponse.json({ ok: true, manifest: s.manifest });
}
