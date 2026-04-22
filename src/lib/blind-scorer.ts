import OpenAI from "openai";

/**
 * Blind scoring pipeline — a second model independently scores the idea
 * to cross-validate the primary report's scores.
 *
 * Flow:
 * 1. Primary model (GPT-4.1) generates the full report with scores.
 * 2. After streaming completes, this module sends ONLY the raw idea
 *    (topic + position + context) to OpenAI with a scoring-only prompt.
 * 3. Both sets of scores are reconciled → final scores + confidence.
 */

export interface BlindScores {
  problemSolutionFit: number;
  marketOpportunity: number;
  competitiveEdge: number;
  businessModel: number;
  teamExecution: number;
  timingTrends: number;
  viability: number;
}

export interface ScoringReconciliation {
  /** Final reconciled scores (weighted average, primary biased) */
  final: BlindScores;
  /** Primary model's raw scores */
  primary: BlindScores;
  /** Blind scorer's raw scores */
  blind: BlindScores;
  /** Per-category delta (absolute) */
  deltas: Record<string, number>;
  /** Overall confidence: "high" (all <8), "medium" (some 8-15), "low" (any >15) */
  confidence: "high" | "medium" | "low";
  /** Max divergence across all categories */
  maxDelta: number;
}

const BLIND_SCORER_PROMPT = `You are a startup idea scoring engine. You receive a raw startup idea and must score it on exactly 6 dimensions plus an overall viability score.

**SCORING RULES:**
- Each dimension: integer 0–100.
- Be HARSH and REALISTIC. Most unvalidated text-only ideas land 35–62 overall.
- 70+ requires unusually clear evidence of market, differentiation, and economics in the text.
- 85+ from text alone is essentially impossible.
- If the pitch is vague, generic, or low-effort (e.g. "idk", gibberish, one word) → score ALL categories 15–30.
- If no team/execution info is mentioned → cap Team & Execution at 45.
- If no competitive differentiation → cap Competitive Edge at 50.
- Viability = round(arithmetic mean of the 6 scores), ±5 max with written justification.

**OUTPUT FORMAT (JSON only, no markdown, no explanation):**
{"problemSolutionFit":N,"marketOpportunity":N,"competitiveEdge":N,"businessModel":N,"teamExecution":N,"timingTrends":N,"viability":N}`;

/**
 * Call OpenAI to get blind scores for a startup idea.
 * Returns null if OpenAI is unavailable or fails (graceful degradation).
 */
export async function getBlindScores(
  topic: string,
  position: string,
  context: string,
): Promise<BlindScores | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const userPrompt = [
    `**Startup idea:** "${topic}"`,
    position ? `**Why the founder believes it works:** ${position}` : "",
    context ? `**Additional context:** ${context}` : "",
    "",
    "Score this idea now. Return ONLY the JSON object.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: BLIND_SCORER_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_completion_tokens: 200,
    });
    const text = completion.choices[0]?.message?.content?.trim() ?? "";

    // Parse JSON — strip markdown code fences if present
    const cleaned = text.replace(/^```json?\s*|```\s*$/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // Validate all required fields are numbers 0-100
    const fields: (keyof BlindScores)[] = [
      "problemSolutionFit",
      "marketOpportunity",
      "competitiveEdge",
      "businessModel",
      "teamExecution",
      "timingTrends",
      "viability",
    ];
    for (const f of fields) {
      const v = parsed[f];
      if (typeof v !== "number" || v < 0 || v > 100) return null;
    }

    return parsed as BlindScores;
  } catch {
    // OpenAI failed — graceful degradation, primary scores stand alone
    return null;
  }
}

/**
 * Extract the primary model's scores from the generated report text.
 */
export function extractPrimaryScores(reportText: string): BlindScores | null {
  const extract = (label: string): number | null => {
    const re100 = new RegExp(
      `${label}[:\\s]*\\[?(\\d+(?:\\.\\d+)?)\\]?\\s*\\/\\s*100\\b`,
      "i",
    );
    const m = reportText.match(re100);
    return m ? Math.round(parseFloat(m[1])) : null;
  };

  const psf = extract("Problem.?Solution Fit");
  const mo = extract("Market Opportunity");
  const ce = extract("Competitive Edge");
  const bm = extract("Business Model");
  const te = extract("Team.*Execution");
  const tt = extract("Timing.*Trends");

  // Viability score from header
  const viabMatch = reportText.match(
    /###\s*Viability Score\s*:?\s*\*?\*?\s*\[?(\d+(?:\.\d+)?)\]?\s*\/\s*100/i,
  );
  const viab = viabMatch ? Math.round(parseFloat(viabMatch[1])) : null;

  if (psf == null || mo == null || ce == null || bm == null || te == null || tt == null || viab == null) {
    return null;
  }

  return {
    problemSolutionFit: psf,
    marketOpportunity: mo,
    competitiveEdge: ce,
    businessModel: bm,
    teamExecution: te,
    timingTrends: tt,
    viability: viab,
  };
}

/**
 * Reconcile primary and blind scores.
 * Primary gets 60% weight, blind gets 40% — primary wrote the full analysis
 * so it has more context, but blind keeps it honest.
 */
export function reconcileScores(
  primary: BlindScores,
  blind: BlindScores,
): ScoringReconciliation {
  const PRIMARY_WEIGHT = 0.6;
  const BLIND_WEIGHT = 0.4;

  const blend = (p: number, b: number): number =>
    Math.round(p * PRIMARY_WEIGHT + b * BLIND_WEIGHT);

  const fields: (keyof Omit<BlindScores, "viability">)[] = [
    "problemSolutionFit",
    "marketOpportunity",
    "competitiveEdge",
    "businessModel",
    "teamExecution",
    "timingTrends",
  ];

  const final: Record<string, number> = {};
  const deltas: Record<string, number> = {};
  let maxDelta = 0;

  for (const f of fields) {
    final[f] = blend(primary[f], blind[f]);
    const d = Math.abs(primary[f] - blind[f]);
    deltas[f] = d;
    if (d > maxDelta) maxDelta = d;
  }

  // Viability = mean of reconciled category scores
  const catValues = fields.map((f) => final[f]);
  final.viability = Math.round(catValues.reduce((a, b) => a + b, 0) / catValues.length);

  const viabDelta = Math.abs(primary.viability - blind.viability);
  deltas.viability = viabDelta;
  if (viabDelta > maxDelta) maxDelta = viabDelta;

  const confidence: "high" | "medium" | "low" =
    maxDelta <= 8 ? "high" : maxDelta <= 15 ? "medium" : "low";

  return {
    final: final as unknown as BlindScores,
    primary,
    blind,
    deltas,
    confidence,
    maxDelta,
  };
}
