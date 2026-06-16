/**
 * POST /api/chamber/ask
 * ─────────────────────────────────────────────────────────────────────────
 * Two-way debate. Instead of only defending, the founder can interrogate a
 * panellist directly ("Vera, what would change your mind on CAC?"). The
 * addressed agent answers IN CHARACTER, grounded in the audited report, with
 * no scoring and no follow-up attack — a genuine exchange, not another volley.
 *
 * Request:  { idea, personaId, question, history: [{ who, body }], grounding? }
 * Response: { answer: string }
 * ─────────────────────────────────────────────────────────────────────────
 */

import OpenAI from "openai";
import { CHAMBER_AGENTS, isChamberId } from "@/lib/chamber-personas";
import { formatGrounding, sanitizeGrounding } from "@/lib/chamber-grounding";
import { requireAuth, guardFailResponse } from "@/lib/credits/server";

export const maxDuration = 60;

type HistoryItem = { who: string; body: string };

function clamp(v: unknown, max: number): string {
  return String(v ?? "").slice(0, max).trim();
}

function renderHistory(history: HistoryItem[]): string {
  if (!history.length) return "(start of session)";
  return history
    .map((h) => {
      const name = h.who === "you" ? "FOUNDER" : isChamberId(h.who) ? CHAMBER_AGENTS[h.who].name.toUpperCase() : h.who.toUpperCase();
      return `${name}: ${clamp(h.body, 400)}`;
    })
    .join("\n");
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return guardFailResponse(auth);
  try {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) return Response.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });

    const body = (await request.json()) as {
      idea?: string; personaId?: string; question?: string; history?: HistoryItem[]; grounding?: unknown;
    };

    const idea = clamp(body.idea, 600);
    const question = clamp(body.question, 700);
    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
    const grounding = formatGrounding(sanitizeGrounding(body.grounding));

    if (!isChamberId(body.personaId)) return Response.json({ error: "Invalid persona id." }, { status: 400 });
    if (!question) return Response.json({ error: "Missing question." }, { status: 400 });

    const agent = CHAMBER_AGENTS[body.personaId];
    const openai = new OpenAI({ apiKey: key });

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.6,
      max_completion_tokens: 320,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: agent.systemPrompt },
        {
          role: "user",
          content: `Idea under review: ${idea}
${grounding}

Recent exchanges in the chamber:
${renderHistory(history)}

The founder turns to YOU directly and asks:
"""
${question}
"""

Answer them honestly, in YOUR voice and from YOUR axis (${agent.axis}). This is a real exchange — not an attack. If they ask what would change your mind, tell them the specific evidence that would. If they push back well, concede the point. Stay sharp but fair. <=320 chars.

Return EXACTLY this JSON:
{ "answer": "your spoken reply to the founder" }`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    let answer = "";
    try {
      const parsed = JSON.parse(raw.replace(/^```json\s*|```$/g, "").trim());
      answer = clamp(parsed?.answer, 420);
    } catch { /* leave empty */ }

    if (!answer) return Response.json({ error: "No answer produced." }, { status: 502 });
    return Response.json({ answer });
  } catch (e) {
    console.error("chamber/ask error:", e);
    return Response.json({ error: "Failed to answer." }, { status: 500 });
  }
}
