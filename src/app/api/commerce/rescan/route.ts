import { normalizeUrl, runScan } from "@/lib/commerce/scan";
import { saveReport } from "@/lib/commerce/report-store";
import { guardAndSpend, guardFailResponse, refund } from "@/lib/credits/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";

export const maxDuration = 60;

/**
 * POST /api/commerce/rescan — re-run a store's scan to capture this week's data.
 *
 * Charges `commerce_rescan` (15 cr). Returns a fresh report; the client appends a
 * snapshot to its local history, which is what powers the trend lines + deltas.
 * (The first scan also seeds a snapshot, so trends appear from the 2nd scan on.)
 */
export async function POST(request: Request) {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const normalized = normalizeUrl(String(body.url ?? ""));
  if (!normalized) return Response.json({ error: "Missing store URL." }, { status: 400 });

  const guard = await guardAndSpend("commerce_rescan");
  if (!guard.ok) return guardFailResponse(guard);

  try {
    const report = await runScan(normalized.url);
    let userId: string | null = guard.userId;
    if (!userId && supabaseConfigured()) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        userId = user?.id ?? null;
      } catch {
        /* anon */
      }
    }
    await saveReport(report, userId).catch(() => {});
    return Response.json({ report, balance: guard.balance });
  } catch (error) {
    await refund("commerce_rescan");
    const message = error instanceof Error ? error.message : "Re-scan failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
