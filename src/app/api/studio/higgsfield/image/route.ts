import { guardAndSpend, guardFailResponse, refund } from "@/lib/credits/server";
import { higgsfieldConfigured, submitGeneration, imageBody } from "@/lib/studio/higgsfield";

export const runtime = "nodejs";

/**
 * POST /api/studio/higgsfield/image — submit a logo (text-to-image) generation.
 * Costs credits (logo_image). Returns a job id; poll /api/studio/higgsfield/status.
 * 503 until HIGGSFIELD_API_KEY is set.
 */
export async function POST(request: Request) {
  if (!higgsfieldConfigured()) {
    return Response.json(
      { error: "not_configured", message: "Logo generation isn't live yet — add HIGGSFIELD_API_KEY." },
      { status: 503 },
    );
  }

  let body: { prompt?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const prompt = String(body.prompt ?? "").trim();
  if (!prompt) return Response.json({ error: "Missing prompt." }, { status: 400 });

  const guard = await guardAndSpend("logo_image");
  if (!guard.ok) return guardFailResponse(guard);

  try {
    const job = await submitGeneration(imageBody({ prompt }));
    return Response.json({ id: job.id, status: job.status, url: job.url });
  } catch (error) {
    await refund("logo_image");
    const message = error instanceof Error ? error.message : "Logo generation failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
