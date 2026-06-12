/**
 * POST /api/chamber/open
 * ─────────────────────────────────────────────────────────────────────────
 * Arms the debate chamber for one idea. Spins up FIVE separate AI agents
 * (one per persona, each with its own system prompt / personality) in
 * parallel; each returns its lens on the idea, its opening attack and the
 * underlying flaw it is probing.
 *
 * Request:  { idea: string }
 * Response: { seats: { [personaId]: { lens, attack, flaw, severity } } }
 * ─────────────────────────────────────────────────────────────────────────
 */

import OpenAI from "openai";
import { CHAMBER_AGENTS, CHAMBER_IDS, type ChamberAgent } from "@/lib/chamber-personas";

export const maxDuration = 60;

type Seat = { lens: string; attack: string; flaw: string; severity: "kill" | "warn" | "insight" };

function clamp(v: unknown, max: number): string {
  return String(v ?? "").slice(0, max).trim();
}

async function openForAgent(openai: OpenAI, agent: ChamberAgent, idea: string): Promise<Seat | null> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.7,
      max_completion_tokens: 400,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: agent.systemPrompt },
        {
          role: "user",
          content: `The founder has just entered the chamber with this idea:
"""
${idea}
"""

Prepare your seat. Return EXACTLY this JSON:
{
  "lens": "your 1-line angle of attack on THIS specific idea (<=140 chars)",
  "attack": "your opening attack, spoken aloud to the founder, in your voice, probing your axis (${agent.axis}). 2-4 sentences, <=420 chars. End with a direct question.",
  "flaw": "the underlying weakness your attack is probing (<=140 chars)",
  "severity": "${agent.severity}"
}`,
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const parsed = JSON.parse(raw.replace(/^```json\s*|```$/g, "").trim());
    const attack = clamp(parsed?.attack, 600);
    if (!attack) return null;
    const sev = parsed?.severity;
    return {
      lens: clamp(parsed?.lens, 200),
      attack,
      flaw: clamp(parsed?.flaw, 200),
      severity: sev === "kill" || sev === "warn" || sev === "insight" ? sev : agent.severity,
    };
  } catch (e) {
    console.error(`chamber/open agent ${agent.id} failed:`, e instanceof Error ? e.message : e);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) return Response.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });

    const body = (await request.json()) as { idea?: string };
    const idea = clamp(body.idea, 600);
    if (!idea) return Response.json({ error: "Missing idea." }, { status: 400 });

    const openai = new OpenAI({ apiKey: key });

    // One independent agent per seat, all in parallel.
    const results = await Promise.all(
      CHAMBER_IDS.map(async (id) => [id, await openForAgent(openai, CHAMBER_AGENTS[id], idea)] as const),
    );

    const seats: Record<string, Seat> = {};
    for (const [id, seat] of results) if (seat) seats[id] = seat;

    if (Object.keys(seats).length === 0) {
      return Response.json({ error: "All agents failed to arm." }, { status: 502 });
    }
    return Response.json({ seats });
  } catch (e) {
    console.error("chamber/open error:", e);
    return Response.json({ error: "Failed to arm the chamber." }, { status: 500 });
  }
}
