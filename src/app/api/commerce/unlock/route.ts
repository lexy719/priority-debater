import { guardAndSpend, guardFailResponse, refund } from "@/lib/credits/server";
import { markUnlocked } from "@/lib/commerce/report-store";

/**
 * POST /api/commerce/unlock — spend 15 credits to permanently unlock a report.
 *
 * Charges `commerce_scan` via the shared guard (auth required once Supabase is
 * configured). On success the report is marked unlocked and claimed for the
 * user, so it never paywalls again for them. A failed persist refunds the spend.
 */
export async function POST(request: Request) {
  let body: { shareId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const shareId = String(body.shareId ?? "").trim();
  if (!shareId) return Response.json({ error: "Missing report id." }, { status: 400 });

  const guard = await guardAndSpend("commerce_scan");
  if (!guard.ok) return guardFailResponse(guard);

  // Demo / pre-launch (Supabase not configured): nothing to persist against a
  // user — acknowledge so local runs unlock without a backend.
  if (!guard.userId) {
    return Response.json({ ok: true, unlocked: true, balance: guard.balance });
  }

  try {
    const report = await markUnlocked(shareId, guard.userId);
    if (!report) {
      await refund("commerce_scan");
      return Response.json({ error: "Report not found." }, { status: 404 });
    }
    return Response.json({ ok: true, unlocked: true, report, balance: guard.balance });
  } catch {
    await refund("commerce_scan");
    return Response.json({ error: "Unlock failed." }, { status: 500 });
  }
}
