import { getReportByShareId } from "@/lib/commerce/report-store";

/**
 * GET /api/commerce/report?shareId=… (or ?r=…) — fetch a stored report.
 *
 * Returns the FULL report plus its `unlocked` flag. The blur/paywall is a client
 * concern: a shared link (`?r=`) renders read-only without a paywall, while the
 * owner's own un-unlocked report blurs sections 1–6 until they spend credits.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shareId = (searchParams.get("shareId") || searchParams.get("r") || "").trim();
  if (!shareId) return Response.json({ error: "Missing report id." }, { status: 400 });

  const report = await getReportByShareId(shareId);
  if (!report) return Response.json({ error: "Report not found." }, { status: 404 });

  return Response.json({ report });
}
