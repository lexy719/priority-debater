import { guardAndSpend, guardFailResponse, refund } from "@/lib/credits/server";
import { higgsfieldConfigured, higgsfieldStatusNote, imageParams, imagePath, submitGeneration } from "@/lib/studio/higgsfield";

export const runtime = "nodejs";

/**
 * POST /api/studio/higgsfield/image — submit a logo (text-to-image) generation.
 * Costs credits (logo_image). Returns a job id; poll /api/studio/higgsfield/status.
 * 503 until the HIGGSFIELD_KEY_ID / HIGGSFIELD_KEY_SECRET pair is set.
 */
export async function POST(request: Request) {
  if (!higgsfieldConfigured()) {
    return Response.json(
      { error: "not_configured", message: higgsfieldStatusNote() },
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
    const job = await submitGeneration(imagePath(), imageParams({ prompt }));
    return Response.json({ id: job.id, status: job.status, url: job.url });
  } catch (error) {
    await refund("logo_image");
    const message = error instanceof Error ? error.message : "Logo generation failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
