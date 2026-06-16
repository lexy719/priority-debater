import { scoreIdeaV2 } from "@/lib/agents/idea-scoring-v2";
import { requireAuth, guardFailResponse } from "@/lib/credits/server";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return guardFailResponse(auth);

  let body: { topic?: string; position?: string; context?: string };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const topic = String(body.topic ?? "").trim();
  if (!topic) {
    return Response.json({ error: "Missing topic." }, { status: 400 });
  }

  try {
    return Response.json(
      await scoreIdeaV2({
        topic,
        position: body.position,
        context: body.context,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scoring failed.";
    const status = /OPENAI_API_KEY/i.test(message) ? 503 : 500;
    return Response.json({ error: message }, { status });
  }
}
