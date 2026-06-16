/**
 * POST /api/chamber/respond
 * ─────────────────────────────────────────────────────────────────────────
 * One full debate exchange, powered by TWO separate AI agents:
 *
 *   1. The current speaker (their own system prompt) judges the founder's
 *      typed defence in character → strength 1-3, reaction quote, remaining
 *      flaw, fail-proof fix.
 *   2. The NEXT panellist (a different agent) reads the recent transcript
 *      and delivers their follow-up attack, building on what was just said.
 *
 * Request:
 *   {
 *     idea, speakerId, nextSpeakerId,
 *     challenge,            // the attack the founder is answering
 *     flaw,                 // what that attack was probing (optional)
 *     defence,              // founder's typed answer
 *     history: [{ who, body }]  // recent transcript tail (optional)
 *   }
 *
 * Response:
 *   {
 *     eval: { strength, reactionQuote, flawCaught, fix },
 *     next: { attack, flaw, severity }
 *   }
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
  // Within an already-paid debate session — require login, don't charge again.
  const auth = await requireAuth();
  if (!auth.ok) return guardFailResponse(auth);
  try {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) return Response.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });

    const body = (await request.json()) as {
      idea?: string; speakerId?: string; nextSpeakerId?: string;
      challenge?: string; flaw?: string; defence?: string; history?: HistoryItem[]; grounding?: unknown;
    };

    const idea = clamp(body.idea, 600);
    const challenge = clamp(body.challenge, 700);
    const flaw = clamp(body.flaw, 240);
    const defence = clamp(body.defence, 1400);
    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
    const grounding = formatGrounding(sanitizeGrounding(body.grounding));

    if (!isChamberId(body.speakerId) || !isChamberId(body.nextSpeakerId)) {
      return Response.json({ error: "Invalid persona id." }, { status: 400 });
    }
    if (!defence) return Response.json({ error: "Missing defence." }, { status: 400 });

    const judge = CHAMBER_AGENTS[body.speakerId];
    const attacker = CHAMBER_AGENTS[body.nextSpeakerId];
    const openai = new OpenAI({ apiKey: key });
    const transcript = renderHistory(history);

    // Agent #1 — the current speaker judges the defence in character.
    const judgeCall = openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.5,
      max_completion_tokens: 450,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: judge.systemPrompt },
        {
          role: "user",
          content: `Idea under review: ${idea}
${grounding}

Recent exchanges in the chamber:
${transcript}

The attack YOU just delivered:
"${challenge}"
${flaw ? `The flaw you were probing: ${flaw}` : ""}

The founder answered:
"""
${defence}
"""

Judge the defence. Scoring rubric (apply YOUR bias: ${judge.scoringBias}):
- 3 = concrete, contains numbers / named entities / verifiable evidence, directly answers you.
- 2 = directionally right but missing a specific number, source or kill criterion.
- 1 = hand-wavy, defers, or restates the idea without evidence.

Return EXACTLY this JSON:
{
  "strength": 1 or 2 or 3,
  "reactionQuote": "1-2 sentences in YOUR voice reacting to what the founder ACTUALLY said — quote their words back when useful. <=260 chars",
  "flawCaught": "the risk that still remains after this defence (<=180 chars)",
  "fix": "one concrete action the founder should ship within 7 days to close the gap (<=200 chars)"
}`,
        },
      ],
    });

    // Agent #2 — the next panellist prepares their attack off the live transcript.
    const attackCall = openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.75,
      max_completion_tokens: 450,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: attacker.systemPrompt },
        {
          role: "user",
          content: `Idea under review: ${idea}
${grounding}

Recent exchanges in the chamber (most recent last):
${transcript}
${judge.name.toUpperCase()}: ${challenge}
FOUNDER: ${defence}

${judge.name} has finished. The floor passes to YOU. Attack from YOUR axis (${attacker.axis}) — do not repeat ground already covered; build on or exploit what the founder just said when possible.

Return EXACTLY this JSON:
{
  "attack": "your attack, spoken to the founder, 2-4 short sentences ending in a direct question (<=420 chars)",
  "flaw": "the weakness this attack probes (<=140 chars)",
  "severity": "kill" or "warn" or "insight" — how lethal this line of attack is
}`,
        },
      ],
    });

    const [judgeRes, attackRes] = await Promise.allSettled([judgeCall, attackCall]);

    if (judgeRes.status === "rejected") console.error("chamber/respond judge agent failed:", judgeRes.reason instanceof Error ? judgeRes.reason.message : judgeRes.reason);
    if (attackRes.status === "rejected") console.error("chamber/respond attack agent failed:", attackRes.reason instanceof Error ? attackRes.reason.message : attackRes.reason);

    let evalOut: { strength: 1 | 2 | 3; reactionQuote: string; flawCaught: string; fix: string } | null = null;
    if (judgeRes.status === "fulfilled") {
      try {
        const parsed = JSON.parse((judgeRes.value.choices[0]?.message?.content ?? "").replace(/^```json\s*|```$/g, "").trim());
        const s = Number(parsed?.strength);
        evalOut = {
          strength: (s === 1 || s === 2 || s === 3 ? s : 2) as 1 | 2 | 3,
          reactionQuote: clamp(parsed?.reactionQuote, 320) || `${judge.name.split(" ")[0]}: noted — but the underlying risk hasn't moved. Bring evidence.`,
          flawCaught: clamp(parsed?.flawCaught, 220) || flaw,
          fix: clamp(parsed?.fix, 240) || "Back the claim with a named source, a number and a 30-day check.",
        };
      } catch { /* leave null */ }
    }

    let nextOut: { attack: string; flaw: string; severity: "kill" | "warn" | "insight" } | null = null;
    if (attackRes.status === "fulfilled") {
      try {
        const parsed = JSON.parse((attackRes.value.choices[0]?.message?.content ?? "").replace(/^```json\s*|```$/g, "").trim());
        const attack = clamp(parsed?.attack, 600);
        if (attack) {
          const sev = parsed?.severity;
          nextOut = {
            attack,
            flaw: clamp(parsed?.flaw, 200),
            severity: sev === "kill" || sev === "warn" || sev === "insight" ? sev : attacker.severity,
          };
        }
      } catch { /* leave null */ }
    }

    if (!evalOut && !nextOut) {
      return Response.json({ error: "Both agents failed." }, { status: 502 });
    }
    return Response.json({ eval: evalOut, next: nextOut });
  } catch (e) {
    console.error("chamber/respond error:", e);
    return Response.json({ error: "Failed to process the exchange." }, { status: 500 });
  }
}
