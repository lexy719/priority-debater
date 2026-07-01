/**
 * POST /api/chamber/debrief
 * ─────────────────────────────────────────────────────────────────────────
 * The warm beat after the ruling. Eduardo Salgado (the Mentor seat) steps out
 * of the adversarial frame and talks to the founder one-on-one: what to fix
 * first, what to ignore, and whether to revise-and-re-enter or move to Brand.
 *
 * No scoring, no attack, no credit charge (requireAuth only) — this is the one
 * place in the Chamber designed to feel supportive. Grounded in the REAL gaps
 * the panel left open, so the advice is about THIS debate, not generic comfort.
 *
 * Request:  { idea, survival, gaps: [{ axis, persona, status, quote }], grounding? }
 * Response: DebriefContent { opening, fixFirst, ignore, path, pathReason }
 * ─────────────────────────────────────────────────────────────────────────
 */

import { CHAMBER_AGENTS } from "@/lib/chamber-personas";
import { formatGrounding, sanitizeGrounding } from "@/lib/chamber-grounding";
import { requireAuth, guardFailResponse } from "@/lib/credits/server";
import { runAgentJSON, hasOpenAIKey, clampStr as clamp } from "@/lib/agents/run";
import type { DebriefContent } from "@/lib/chamber-handoff";

export const maxDuration = 60;

/** Coerce untrusted gaps from the client into a compact prompt block. */
function renderGaps(input: unknown): string {
  if (!Array.isArray(input) || input.length === 0) return "(the founder left no obvious axis open — the work now is proof, not patching)";
  return input
    .slice(0, 3)
    .map((g) => {
      const o = g as Record<string, unknown>;
      const axis = clamp(o.axis, 60);
      const persona = clamp(o.persona, 60);
      const status = clamp(o.status, 20);
      const quote = clamp(o.quote, 220);
      return `- ${axis} (${persona}, ${status}): "${quote}"`;
    })
    .join("\n");
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return guardFailResponse(auth);
  try {
    if (!hasOpenAIKey()) return Response.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });

    const body = (await request.json()) as {
      idea?: string; survival?: number; gaps?: unknown; grounding?: unknown;
    };

    const idea = clamp(body.idea, 600);
    const survival = typeof body.survival === "number" ? Math.max(0, Math.min(10, body.survival)) : 0;
    const gapsBlock = renderGaps(body.gaps);
    const grounding = formatGrounding(sanitizeGrounding(body.grounding));
    if (!idea) return Response.json({ error: "Missing idea." }, { status: 400 });

    const agent = CHAMBER_AGENTS.es;

    const parsed = await runAgentJSON<Partial<DebriefContent>>({
      system: agent.systemPrompt,
      temperature: 0.7,
      maxTokens: 500,
      user: `The debate is over. You are NO LONGER attacking — the founder is sitting across from you and the room has cleared. Drop the interrogation frame. This is the private debrief, mentor to founder. Be warm, plain, and specific. Volunteer your own scars where it helps. Never flatter emptily.

Idea: ${idea}
Final survival score: ${survival.toFixed(1)}/10
${grounding}

What the panel left UNRESOLVED (base your advice on these, not generic startup wisdom):
${gapsBlock}

Give them the version a friend who's been through it would give. Return EXACTLY this JSON:
{
  "opening": "2-3 warm, human sentences. Meet them where the score puts them — proud if they earned it, honest if they didn't.",
  "fixFirst": "The ONE thing to fix first, tied to the worst gap above. Concrete and doable this week. <=280 chars.",
  "ignore": "What NOT to over-index on — the noise vs the signal. <=220 chars.",
  "path": "revise OR proceed — 'revise' if a core axis will haunt every next stage, 'proceed' if the core held and they'll learn more by building.",
  "pathReason": "One sentence on why that path. <=200 chars."
}`,
    });

    if (!parsed) return Response.json({ error: "No debrief produced." }, { status: 502 });

    const opening = clamp(parsed.opening, 600);
    const fixFirst = clamp(parsed.fixFirst, 320);
    if (!opening || !fixFirst) return Response.json({ error: "Incomplete debrief." }, { status: 502 });

    const payload: DebriefContent = {
      opening,
      fixFirst,
      ignore: clamp(parsed.ignore, 260) || "Fix the gap that repeated. Let the rest go.",
      path: parsed.path === "revise" ? "revise" : "proceed",
      pathReason: clamp(parsed.pathReason, 240) || "",
    };
    return Response.json(payload);
  } catch (e) {
    console.error("chamber/debrief error:", e);
    return Response.json({ error: "Failed to produce debrief." }, { status: 500 });
  }
}
