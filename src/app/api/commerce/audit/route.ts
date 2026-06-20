import { auditStore, normalizeUrl } from "@/lib/commerce/audit-scoring";
import { guardAndSpend, guardFailResponse, refund } from "@/lib/credits/server";

// The live buyer test fans out to OpenAI/Anthropic/Gemini with web search, so
// allow more head-room than the default serverless timeout.
export const maxDuration = 60;

/**
 * POST /api/commerce/audit — score a store's AI/agent visibility. Costs credits
 * (commerce_audit). The default DEMO report shown before a run is client-side
 * and free; this route only fires on a real submitted URL.
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
    return Response.json(
      { error: "Enter a valid store URL (e.g. your-store.com)." },
      { status: 400 },
    );
  }

  const guard = await guardAndSpend("commerce_audit");
  if (!guard.ok) return guardFailResponse(guard);

  try {
    return Response.json(await auditStore({ url: normalized.url }));
  } catch (error) {
    await refund("commerce_audit");
    const message = error instanceof Error ? error.message : "Audit failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
