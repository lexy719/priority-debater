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

import { CHAMBER_AGENTS, isChamberId } from "@/lib/chamber-personas";
import { formatGrounding, sanitizeGrounding } from "@/lib/chamber-grounding";
import { requireAuth, guardFailResponse } from "@/lib/credits/server";
import { runAgentJSON, hasOpenAIKey, clampStr as clamp } from "@/lib/agents/run";

export const maxDuration = 60;

type HistoryItem = { who: string; body: string };

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
    if (!hasOpenAIKey()) return Response.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });

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
    const transcript = renderHistory(history);

    // Two independent agents run in parallel: the current speaker judges the
    // defence; the next panellist prepares their follow-up attack.
    const [judgeParsed, attackParsed] = await Promise.all([
      // Agent #1 — the current speaker judges the defence in character.
      runAgentJSON<{ strength?: unknown; reactionQuote?: unknown; flawCaught?: unknown; fix?: unknown }>({
        system: judge.systemPrompt,
        temperature: 0.5,
        maxTokens: 450,
        user: `Idea under review: ${idea}
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
      }),
      // Agent #2 — the next panellist prepares their attack off the live transcript.
      runAgentJSON<{ attack?: unknown; flaw?: unknown; severity?: unknown }>({
        system: attacker.systemPrompt,
        temperature: 0.75,
        maxTokens: 450,
        user: `Idea under review: ${idea}
${grounding}

Recent exchanges in the chamber (most recent last):
${transcript}
${judge.name.toUpperCase()}: ${challenge}
FOUNDER: ${defence}

${judge.name} has finished. The floor passes to YOU. Attack from YOUR axis (${attacker.axis}) — do not repeat ground already covered; build on or exploit what the founder just said when possible.

You are one seat on a PANEL, not a lone interrogator. When a colleague's unresolved point compounds with yours, NAME them and stack on it — e.g. "${judge.name.split(" ")[0]}'s point about X isn't closed, and from my seat it's worse because…". Reference other panelists by first name where it sharpens the pressure. Never agree just to be agreeable.

Return EXACTLY this JSON:
{
  "attack": "your attack, spoken to the founder, 2-4 short sentences ending in a direct question (<=420 chars)",
  "flaw": "the weakness this attack probes (<=140 chars)",
  "severity": "kill" or "warn" or "insight" — how lethal this line of attack is
}`,
      }),
    ]);

    let evalOut: { strength: 1 | 2 | 3; reactionQuote: string; flawCaught: string; fix: string } | null = null;
    if (judgeParsed) {
      const s = Number(judgeParsed.strength);
      evalOut = {
        strength: (s === 1 || s === 2 || s === 3 ? s : 2) as 1 | 2 | 3,
        reactionQuote: clamp(judgeParsed.reactionQuote, 320) || `${judge.name.split(" ")[0]}: noted — but the underlying risk hasn't moved. Bring evidence.`,
        flawCaught: clamp(judgeParsed.flawCaught, 220) || flaw,
        fix: clamp(judgeParsed.fix, 240) || "Back the claim with a named source, a number and a 30-day check.",
      };
    }

    let nextOut: { attack: string; flaw: string; severity: "kill" | "warn" | "insight" } | null = null;
    if (attackParsed) {
      const attack = clamp(attackParsed.attack, 600);
      if (attack) {
        const sev = attackParsed.severity;
        nextOut = {
          attack,
          flaw: clamp(attackParsed.flaw, 200),
          severity: sev === "kill" || sev === "warn" || sev === "insight" ? sev : attacker.severity,
        };
      }
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
