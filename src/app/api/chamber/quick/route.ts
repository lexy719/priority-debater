/**
 * POST /api/chamber/quick
 * ─────────────────────────────────────────────────────────────────────────
 * Quick Cross (§7) — the low-commitment entry point. The founder picks ONE
 * seat and gets that panelist's single hardest challenge plus an honest quick
 * read on the idea, for a fraction of a full Chamber's credits. It's a gut-check
 * and a teaser for the full five-seat, seven-round session.
 *
 * Request:  { idea, personaId, grounding? }
 * Response: { challenge, read, lean: "intrigued" | "skeptical" | "hostile" }
 * ─────────────────────────────────────────────────────────────────────────
 */

import { CHAMBER_AGENTS, isChamberId } from "@/lib/chamber-personas";
import { formatGrounding, sanitizeGrounding } from "@/lib/chamber-grounding";
import { sanitizeCalibration, formatCalibration } from "@/lib/chamber-calibration";
import { guardAndSpend, guardFailResponse, refund } from "@/lib/credits/server";
import { runAgentJSON, hasOpenAIKey, clampStr as clamp } from "@/lib/agents/run";

export const maxDuration = 60;

type Lean = "intrigued" | "skeptical" | "hostile";

export async function POST(request: Request) {
  const guard = await guardAndSpend("quick_cross");
  if (!guard.ok) return guardFailResponse(guard);
  try {
    if (!hasOpenAIKey()) { await refund("quick_cross"); return Response.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 }); }

    const body = (await request.json()) as { idea?: string; personaId?: string; grounding?: unknown; calibration?: unknown };
    const idea = clamp(body.idea, 600);
    const grounding = formatGrounding(sanitizeGrounding(body.grounding));
    const calibration = sanitizeCalibration(body.calibration);
    if (!isChamberId(body.personaId)) { await refund("quick_cross"); return Response.json({ error: "Invalid persona id." }, { status: 400 }); }
    if (!idea) { await refund("quick_cross"); return Response.json({ error: "Missing idea." }, { status: 400 }); }

    const agent = CHAMBER_AGENTS[body.personaId];

    const parsed = await runAgentJSON<{ challenge?: string; read?: string; lean?: string }>({
      system: agent.systemPrompt,
      temperature: 0.6,
      user: `A founder wants a fast gut-check from YOU alone — one pass, no full debate. Their idea:
"""
${idea}
"""
${grounding}
${formatCalibration(calibration, agent.id)}

From YOUR axis (${agent.axis}), give them the single hardest thing they'd have to answer, then your honest quick read. Don't hedge. Return EXACTLY this JSON:
{
  "challenge": "your one sharpest question/attack on this idea, in your voice. 1-3 sentences, <=360 chars.",
  "read": "your honest quick take — would this survive YOUR line of questioning? <=240 chars.",
  "lean": "intrigued OR skeptical OR hostile — your gut lean after one pass"
}`,
    });

    if (!parsed) { await refund("quick_cross"); return Response.json({ error: "No read produced." }, { status: 502 }); }

    const challenge = clamp(parsed.challenge, 420);
    if (!challenge) { await refund("quick_cross"); return Response.json({ error: "Empty challenge." }, { status: 502 }); }
    const lean: Lean = parsed.lean === "intrigued" || parsed.lean === "hostile" ? parsed.lean : "skeptical";

    return Response.json({ challenge, read: clamp(parsed.read, 300), lean, balance: guard.balance });
  } catch (e) {
    console.error("chamber/quick error:", e);
    await refund("quick_cross");
    return Response.json({ error: "Failed to run Quick Cross." }, { status: 500 });
  }
}
