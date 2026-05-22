/**
 * /api/debate/evaluate
 * ─────────────────────────────────────────────────────────────────────────
 * Evaluates ONE typed defence against ONE panellist challenge.
 *
 * Request:
 *   { idea, persona: { id, name, role, lens }, challenge, flaw, defence }
 *
 * Response:
 *   {
 *     strength:      1 | 2 | 3,         // shield rating
 *     reactionQuote: string,            // short in-character reaction (1-2 sentences)
 *     flawCaught:    string,            // distilled flaw remaining after the defence
 *     fix:           string,            // concrete "fail-proof fix" the founder should apply
 *   }
 *
 * The client should cache by hash of (idea + personaId + defence) so a
 * refresh / back-nav doesn't re-bill the same evaluation.
 * ─────────────────────────────────────────────────────────────────────────
 */

import OpenAI from "openai";

type Persona = { id: string; name: string; role: string; lens?: string };

type EvalResponse = {
  strength: 1 | 2 | 3;
  reactionQuote: string;
  flawCaught: string;
  fix: string;
};

function clamp(v: unknown, max: number): string {
  return String(v || "").slice(0, max).trim();
}

function fallbackEval(persona: Persona, flaw: string): EvalResponse {
  return {
    strength: 2,
    reactionQuote: `${persona.name.split(" ")[0]}: noted — but the underlying risk hasn't been removed. Show me the next layer of evidence.`,
    flawCaught: flaw || "Defence acknowledged but evidence layer is still thin.",
    fix: "Tighten the answer with a named source, a number, and a 30-day check that would prove the claim true.",
  };
}

function parseEvalResponse(raw: string, persona: Persona, flaw: string): EvalResponse {
  let parsed: any;
  try { parsed = JSON.parse(raw.replace(/^```json\s*|```$/g, "").trim()); }
  catch { return fallbackEval(persona, flaw); }

  const s = Number(parsed?.strength);
  const strength = (s === 1 || s === 2 || s === 3 ? s : 2) as 1 | 2 | 3;
  return {
    strength,
    reactionQuote: clamp(parsed?.reactionQuote, 320) || fallbackEval(persona, flaw).reactionQuote,
    flawCaught:    clamp(parsed?.flawCaught, 220)    || flaw || fallbackEval(persona, flaw).flawCaught,
    fix:           clamp(parsed?.fix, 240)           || fallbackEval(persona, flaw).fix,
  };
}

export async function POST(request: Request) {
  try {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) return Response.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });

    const body = (await request.json()) as {
      idea?: string; persona?: Persona; challenge?: string; flaw?: string; defence?: string;
    };
    const idea      = clamp(body.idea, 260);
    const challenge = clamp(body.challenge, 320);
    const flaw      = clamp(body.flaw, 200);
    const defence   = clamp(body.defence, 1200);
    const persona: Persona = {
      id:   clamp(body.persona?.id,   20)  || "panellist",
      name: clamp(body.persona?.name, 60)  || "Panellist",
      role: clamp(body.persona?.role, 60)  || "PANELLIST",
      lens: clamp(body.persona?.lens, 200) || undefined,
    };
    if (!defence)   return Response.json({ error: "Missing defence." }, { status: 400 });
    if (!challenge) return Response.json({ error: "Missing challenge." }, { status: 400 });

    const openai = new OpenAI({ apiKey: key });

    const systemPrompt =
      `You are ${persona.name}, ${persona.role}. You react to a founder's typed defence in your own voice. Return strict JSON only. No markdown.`;
    const userPrompt = `Idea under review: ${idea}
Your lens on this idea: ${persona.lens || "(not specified — use your role's default lens)"}

The challenge YOU just delivered was:
"${challenge}"

The underlying flaw you were probing:
${flaw || "(not specified)"}

The founder typed this defence:
"""
${defence}
"""

Score the defence and react. Return EXACTLY this JSON:

{
  "strength":      1 or 2 or 3,
  "reactionQuote": "1-2 short sentences in YOUR voice reacting to the defence. Concrete, not generic. <=240 chars.",
  "flawCaught":    "what risk still remains after the defence (<=180 chars)",
  "fix":           "one concrete next-step the founder should ship in <= 7 days to close the gap (<=200 chars)"
}

Scoring rubric:
- 3 = defence is concrete, contains numbers / named entities / verifiable evidence, and directly answers the challenge.
- 2 = defence is partial — directionally right but lacks a specific number, source, or kill criterion.
- 1 = defence is hand-wavy, defers the question, or restates the idea without evidence.

Rules:
- Stay in character. Use first person. Short sentences.
- No legal claims, no fabricated metrics — refer to the founder's own evidence.
- JSON only. No prose around it.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      temperature: 0.4,
      max_completion_tokens: 500,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    return Response.json(parseEvalResponse(raw, persona, flaw));
  } catch (e) {
    console.error("debate/evaluate error:", e);
    return Response.json({ error: "Failed to evaluate defence." }, { status: 500 });
  }
}
