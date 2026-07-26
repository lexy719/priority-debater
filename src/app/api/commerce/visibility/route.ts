import { NextResponse } from "next/server";
import { auditVisibility, normalize } from "@/lib/commerce/visibility";
import { blobConfigured, getJson, putJson } from "@/lib/studio/blobStore";

/**
 * POST /api/commerce/visibility — audit ANY store URL for AI-shopper visibility.
 * GET  ?host=  → the last audit on file for that host (cached, cheap to re-open).
 *
 * The wedge product: free, honest, needs no API key (every finding is a real
 * HTTP observation). Results are cached per host so a shared report link stays
 * stable and repeated views cost nothing.
 */

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const cachePath = (host: string) => `visibility/${host.replace(/[^a-z0-9.-]/gi, "_")}.json`;

export async function GET(req: Request) {
  const host = new URL(req.url).searchParams.get("host") ?? "";
  if (!host) return NextResponse.json({ ok: false, error: "host required" }, { status: 400 });
  const cached = blobConfigured() ? await getJson(cachePath(host)) : null;
  return NextResponse.json({ ok: true, report: cached }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  let url = "";
  try { url = String((await req.json())?.url ?? ""); } catch { /* fall through */ }
  const n = normalize(url);
  if (!n) return NextResponse.json({ ok: false, error: "Enter a valid public store URL (e.g. example.com)" }, { status: 400 });

  const report = await auditVisibility(url);
  if (!report) return NextResponse.json({ ok: false, error: "Could not audit that URL" }, { status: 400 });

  if (blobConfigured()) {
    try { await putJson(cachePath(report.host), report); } catch { /* serve uncached */ }
  }
  return NextResponse.json({ ok: true, report });
}
