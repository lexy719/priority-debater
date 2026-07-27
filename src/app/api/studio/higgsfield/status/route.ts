import { requireAuth } from "@/lib/credits/server";
import { getGeneration, higgsfieldConfigured, higgsfieldStatusNote } from "@/lib/studio/higgsfield";

export const runtime = "nodejs";

/** GET /api/studio/higgsfield/status?id=… — poll a Higgsfield generation. */
export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return Response.json({ error: "not_authenticated" }, { status: 401 });

  if (!higgsfieldConfigured()) {
    return Response.json({ error: "not_configured", message: higgsfieldStatusNote() }, { status: 503 });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) return Response.json({ error: "Missing id." }, { status: 400 });

  try {
    const job = await getGeneration(id);
    return Response.json(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Status check failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
