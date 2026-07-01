import { normalizeUrl, runScan } from "@/lib/commerce/scan";
import { saveReport } from "@/lib/commerce/report-store";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";

// The live buyer test fans five queries through OpenAI web search, so allow more
// head-room than the default serverless timeout.
export const maxDuration = 60;

/**
 * POST /api/commerce/scan — run a free AI-visibility scan for a store URL.
 *
 * No auth and no charge: the report is free to RUN (the reverse trial shows the
 * full thing, then blurs client-side). Credits are only spent to UNLOCK it, via
 * /api/commerce/unlock. The scan is associated with the signed-in user when one
 * exists, otherwise saved as an anonymous preview (user_id = null).
 */
export async function POST(request: Request) {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const normalized = normalizeUrl(String(body.url ?? ""));
  if (!normalized) {
    return Response.json({ error: "Enter a valid store URL (e.g. your-store.com)." }, { status: 400 });
  }

  try {
    const report = await runScan(normalized.url);

    let userId: string | null = null;
    if (supabaseConfigured()) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        userId = user?.id ?? null;
      } catch {
        /* anonymous preview */
      }
    }

    await saveReport(report, userId).catch(() => {});
    return Response.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
