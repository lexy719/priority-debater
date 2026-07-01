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

import OpenAI from "openai";
import { CHAMBER_AGENTS, isChamberId } from "@/lib/chamber-personas";
import { formatGrounding, sanitizeGrounding } from "@/lib/chamber-grounding";
import { guardAndSpend, guardFailResponse, refund } from "@/lib/credits/server";

export const maxDuration = 60;

type Lean = "intrigued" | "skeptical" | "hostile";

function clamp(v: unknown, max: number): string {
  return String(v ?? "").slice(0, max).trim();
}

export async function POST(request: Request) {
  const guard = await guardAndSpend("quick_cross");
  if (!guard.ok) return guardFailResponse(guard);
  try {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) { await refund("quick_cross"); return Response.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 }); }

    const body = (await request.json()) as { idea?: string; personaId?: string; grounding?: unknown };
    const idea = clamp(body.idea, 600);
    const grounding = formatGrounding(sanitizeGrounding(body.grounding));
    if (!isChamberId(body.personaId)) { await refund("quick_cross"); return Response.json({ error: "Invalid persona id." }, { status: 400 }); }
    if (!idea) { await refund("quick_cross"); return Response.json({ error: "Missing idea." }, { status: 400 }); }

    const agent = CHAMBER_AGENTS[body.personaId];
    const openai = new OpenAI({ apiKey: key });

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.6,
      max_completion_tokens: 400,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: agent.systemPrompt },
        {
          role: "user",
          content: `A founder wants a fast gut-check from YOU alone — one pass, no full debate. Their idea:
"""
${idea}
"""
${grounding}

From YOUR axis (${agent.axis}), give them the single hardest thing they'd have to answer, then your honest quick read. Don't hedge. Return EXACTLY this JSON:
{
  "challenge": "your one sharpest question/attack on this idea, in your voice. 1-3 sentences, <=360 chars.",
  "read": "your honest quick take — would this survive YOUR line of questioning? <=240 chars.",
  "lean": "intrigued OR skeptical OR hostile — your gut lean after one pass"
}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    let parsed: { challenge?: string; read?: string; lean?: string } = {};
    try { parsed = JSON.parse(raw.replace(/^```json\s*|```$/g, "").trim()); }
    catch { await refund("quick_cross"); return Response.json({ error: "No read produced." }, { status: 502 }); }

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
