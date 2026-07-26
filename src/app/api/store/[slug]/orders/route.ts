import { NextResponse } from "next/server";
import { ownedStore } from "@/lib/commerce/owner";
import { loadOrdersSummary } from "@/lib/studio/orderRepo";

/**
 * GET /api/store/[slug]/orders — real order aggregates for the ADS console.
 * Together with /traffic this closes the loop: agents reading the store AND
 * orders they place, measured, not simulated. No buyer PII leaves the repo.
 */

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const own = await ownedStore(slug);
  if (!own.ok) return NextResponse.json({ ok: false, error: own.error }, { status: own.status });
  const s = await loadOrdersSummary(slug);
  return NextResponse.json({ ok: true, slug, ...s }, { headers: { "cache-control": "no-store" } });
}
