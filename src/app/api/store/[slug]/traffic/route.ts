import { NextResponse } from "next/server";
import { ownedStore } from "@/lib/commerce/owner";
import { loadTraffic } from "@/lib/studio/hitRepo";

/**
 * GET /api/store/[slug]/traffic — real agent-traffic aggregates for the ADS
 * console. The only non-simulated meter in the studio: counts of AI agents
 * (GPTBot, ClaudeBot, PerplexityBot, …) actually reading the published store.
 */

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const own = await ownedStore(slug);
  if (!own.ok) return NextResponse.json({ ok: false, error: own.error }, { status: own.status });
  const t = await loadTraffic(slug);
  return NextResponse.json({ ok: true, slug, ...t }, { headers: { "cache-control": "no-store" } });
}
