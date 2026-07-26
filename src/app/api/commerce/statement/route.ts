import { NextResponse } from "next/server";
import { ownedStore } from "@/lib/commerce/owner";
import { buildStatement } from "@/lib/studio/statement";

/**
 * GET /api/commerce/statement?slug=&weeks=1 — the operator statement.
 *
 * Assembled fresh on every read from the same ledgers the OS writes as it
 * works, so the statement can never drift from what happened. Nothing is
 * stored: a statement is a VIEW of the record, not a second copy of it that
 * could disagree with the first.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") ?? "";
  const own = await ownedStore(slug);
  if (!own.ok) return NextResponse.json({ ok: false, error: own.error }, { status: own.status });
  const weeks = Number(url.searchParams.get("weeks") ?? "1");
  const statement = await buildStatement(slug, Number.isFinite(weeks) ? weeks : 1);
  if (!statement) return NextResponse.json({ ok: false, error: "store not found" }, { status: 404 });
  return NextResponse.json({ ok: true, statement }, { headers: { "cache-control": "no-store" } });
}
