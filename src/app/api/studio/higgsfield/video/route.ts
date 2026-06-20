import { guardAndSpend, guardFailResponse, refund } from "@/lib/credits/server";
import { higgsfieldConfigured, submitGeneration, videoBody } from "@/lib/studio/higgsfield";

export const runtime = "nodejs";

/**
 * POST /api/studio/higgsfield/video — submit a campaign ad video for generation.
 * Costs credits (ad_video). Returns a Higgsfield job id; the client polls
 * /api/studio/higgsfield/status. 503 until HIGGSFIELD_API_KEY is configured.
 */
export async function POST(request: Request) {
  if (!higgsfieldConfigured()) {
    return Response.json(
      { error: "not_configured", message: "Video generation isn't live yet — add HIGGSFIELD_API_KEY." },
      { status: 503 },
    );
  }

  let body: { prompt?: string; aspect?: string; durationSec?: number; inputImage?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const prompt = String(body.prompt ?? "").trim();
  if (!prompt) return Response.json({ error: "Missing prompt." }, { status: 400 });

  const guard = await guardAndSpend("ad_video");
  if (!guard.ok) return guardFailResponse(guard);

  try {
    const job = await submitGeneration(
      videoBody({ prompt, aspect: body.aspect, durationSec: body.durationSec, inputImage: body.inputImage }),
    );
    return Response.json({ id: job.id, status: job.status, url: job.url });
  } catch (error) {
    await refund("ad_video");
    const message = error instanceof Error ? error.message : "Video generation failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
