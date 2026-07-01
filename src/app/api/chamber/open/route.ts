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

import { guardAndSpend, guardFailResponse, refund } from "@/lib/credits/server";
import { CHAMBER_AGENTS, CHAMBER_IDS, type ChamberAgent } from "@/lib/chamber-personas";
import { formatGrounding, sanitizeGrounding } from "@/lib/chamber-grounding";
import { sanitizeCalibration, formatCalibration, type Calibration } from "@/lib/chamber-calibration";
import { runAgentJSON, hasOpenAIKey, clampStr as clamp } from "@/lib/agents/run";

export const maxDuration = 60;

type Seat = { lens: string; attack: string; flaw: string; severity: "kill" | "warn" | "insight" };

async function openForAgent(agent: ChamberAgent, idea: string, grounding: string, calibration: Calibration | null): Promise<Seat | null> {
  const parsed = await runAgentJSON<{ lens?: string; attack?: string; flaw?: string; severity?: string }>({
    system: agent.systemPrompt,
    temperature: 0.7,
    user: `The founder has just entered the chamber with this idea:
"""
${idea}
"""
${grounding}
${formatCalibration(calibration, agent.id)}

Prepare your seat. Return EXACTLY this JSON:
{
  "lens": "your 1-line angle of attack on THIS specific idea (<=140 chars)",
  "attack": "your opening attack, spoken aloud to the founder, in your voice, probing your axis (${agent.axis}). 2-4 sentences, <=420 chars. End with a direct question.",
  "flaw": "the underlying weakness your attack is probing (<=140 chars)",
  "severity": "${agent.severity}"
}`,
  });
  if (!parsed) return null;
  const attack = clamp(parsed.attack, 600);
  if (!attack) return null;
  const sev = parsed.severity;
  return {
    lens: clamp(parsed.lens, 200),
    attack,
    flaw: clamp(parsed.flaw, 200),
    severity: sev === "kill" || sev === "warn" || sev === "insight" ? sev : agent.severity,
  };
}

export async function POST(request: Request) {
  // Entering the chamber is the metered "debate" action (charged once, here;
  // respond/ask within the session are free). A revision re-enters at the
  // discounted "debate_revise" rate since grounding is partially reused.
  const url = new URL(request.url);
  const action = url.searchParams.get("mode") === "revise" ? "debate_revise" as const : "debate" as const;
  const guard = await guardAndSpend(action);
  if (!guard.ok) return guardFailResponse(guard);
  try {
    if (!hasOpenAIKey()) { await refund(action); return Response.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 }); }

    const body = (await request.json()) as { idea?: string; grounding?: unknown; calibration?: unknown };
    const idea = clamp(body.idea, 600);
    if (!idea) { await refund(action); return Response.json({ error: "Missing idea." }, { status: 400 }); }

    const grounding = formatGrounding(sanitizeGrounding(body.grounding));
    const calibration = sanitizeCalibration(body.calibration);

    // One independent agent per seat, all in parallel — each armed with its own
    // track record + the founder's recurring blind spots (§8 feedback loop).
    const results = await Promise.all(
      CHAMBER_IDS.map(async (id) => [id, await openForAgent(CHAMBER_AGENTS[id], idea, grounding, calibration)] as const),
    );

    const seats: Record<string, Seat> = {};
    for (const [id, seat] of results) if (seat) seats[id] = seat;

    if (Object.keys(seats).length === 0) {
      await refund(action);
      return Response.json({ error: "All agents failed to arm." }, { status: 502 });
    }
    return Response.json({ seats, balance: guard.balance });
  } catch (e) {
    console.error("chamber/open error:", e);
    await refund(action);
    return Response.json({ error: "Failed to arm the chamber." }, { status: 500 });
  }
}
