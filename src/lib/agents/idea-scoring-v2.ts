import OpenAI from "openai";
import type { BlindScores } from "@/lib/blind-scorer";

export type Band = "weak" | "interesting" | "viable" | "strong" | "exceptional";
export type Recommendation = "proceed" | "proceed-cautiously" | "refine" | "pivot" | "reject";

export type DimensionId =
  | "problem_severity"
  | "market_size"
  | "monetization"
  | "execution_feasibility"
  | "competitive_advantage"
  | "distribution"
  | "innovation"
  | "founder_fit";

export interface DimensionScore {
  id: DimensionId;
  label: string;
  weight: number;
  score: number;
  band: Band;
  why: string;
  topGap: string;
  enriched: boolean;
}

export interface Assumption {
  area: "market" | "competition" | "pricing" | "regulatory" | "distribution" | "channels";
  claim: string;
  evidenceToLock: string;
  sourceUrl?: string;
  sourceTitle?: string;
}

export interface IdeaScoreV2 {
  overall: number;
  band: Band;
  recommendation: Recommendation;
  ideaQuality: number;
  executionDifficulty: number;
  founderAdvantageNeeded: "low" | "medium" | "high";
  dimensions: DimensionScore[];
  headlineRationale: string;
  topStrengths: string[];
  topRisks: string[];
  nextThreeMoves: string[];
  confidence: "low" | "medium" | "high";
  evidenceLevel: "thin" | "moderate" | "rich";
  assumptions: Assumption[];
  enrichmentReliance: "none" | "low" | "medium" | "high";
  oneAskFromFounder: string;
  webSearchUsed: boolean;
  sourcesConsulted: Array<{ url: string; title?: string }>;
  schemaVersion: 2 | 2.1 | 2.2;
}

export interface ScoreInput {
  topic: string;
  position?: string;
  context?: string;
}

export const DIMENSION_WEIGHTS: Record<DimensionId, number> = {
  problem_severity: 20,
  market_size: 15,
  monetization: 15,
  execution_feasibility: 15,
  competitive_advantage: 15,
  distribution: 10,
  innovation: 5,
  founder_fit: 5,
};

export const DIMENSION_LABELS: Record<DimensionId, string> = {
  problem_severity: "Problem Severity",
  market_size: "Market Size",
  monetization: "Monetization Potential",
  execution_feasibility: "Execution Feasibility",
  competitive_advantage: "Competitive Advantage / Moat",
  distribution: "Distribution Potential",
  innovation: "Innovation / Novelty",
  founder_fit: "Founder Fit",
};

const DIMENSION_IDS = Object.keys(DIMENSION_WEIGHTS) as DimensionId[];
const FOUNDER_ONLY = new Set<DimensionId>(["execution_feasibility", "founder_fit"]);

const SYSTEM_PROMPT = `You are a specialist startup-idea scoring engine with LIVE WEB SEARCH access.

Grade an early-stage idea on eight independent weighted dimensions, plus three decoupled signals: idea quality, execution difficulty, and founder advantage needed. Enrich category-level facts with live web search when available. Return one JSON object only.

Core calibration:
- Do not collapse everything into one number. Weak moat must not nuke an otherwise strong idea.
- Do not punish text-only pitches for not mentioning a team. If founder context is absent, Founder Fit is 50: unknown and neutral.
- Do not anchor on "most ideas land 35-62". Score each dimension on its own band, then weight-aggregate.
- Call out the single biggest gap per dimension.
- Use web search only for category-level facts: TAM, growth, named incumbents, typical pricing, regulatory tailwinds/headwinds, and standard channels.
- Never invent founder-specific facts: traction, LOIs, signed customers, team credentials, advisors, funding, or revenue only count when the founder explicitly states them.
- Execution Feasibility and Founder Fit are founder-only dimensions. Do not mark them enriched.

Bands:
- 0-30 weak: broken premise, no real buyer, or unworkable.
- 30-50 interesting: intuition only, real gaps, partial logic.
- 50-70 viable: coherent story, identifiable buyer, plausible economics.
- 70-85 strong: uncommonly clear wedge, market, or economics.
- 85-100 exceptional: rare quality, only when the pitch or context truly justifies it.

Dimensions:
1. problem_severity, 20%: pain frequency, urgency, willingness to pay now.
2. market_size, 15%: TAM/SAM/SOM and growth direction.
3. monetization, 15%: pricing power, repeatability, unit economics.
4. execution_feasibility, 15%: can a competent team build and ship it?
5. competitive_advantage, 15%: clone-resistance over 24 months. If no moat is stated, cap this dimension at 60, not 50. Better-than-incumbent execution can be a temporary moat.
6. distribution, 10%: how the company reaches buyers.
7. innovation, 5%: whether the approach materially changes something.
8. founder_fit, 5%: unfair founder advantages. If absent, score 50.

Decoupled signals:
- ideaQuality: 0-100, whether a top-1% operator could make this work. Base this mostly on problem, market, monetization, moat, and innovation.
- executionDifficulty: 0-100, higher means harder to ship and sell.
- founderAdvantageNeeded: low, medium, or high. Use high when executionDifficulty >= 75 or the wedge requires special access, credentials, or network.

Recommendation tiers:
- proceed: overall >= 85, or overall >= 70 with executionDifficulty < 80.
- proceed-cautiously: overall >= 70 with executionDifficulty >= 80, or 60-70 viable.
- refine: overall 50-70 with one or two weak dimensions.
- pivot: overall 30-50.
- reject: overall < 30.

Output exact JSON shape:
{
  "overall": 0,
  "band": "weak|interesting|viable|strong|exceptional",
  "recommendation": "proceed|proceed-cautiously|refine|pivot|reject",
  "ideaQuality": 0,
  "executionDifficulty": 0,
  "founderAdvantageNeeded": "low|medium|high",
  "dimensions": [
    {"id":"problem_severity","score":0,"why":"...","topGap":"...","enriched":true},
    {"id":"market_size","score":0,"why":"...","topGap":"...","enriched":true},
    {"id":"monetization","score":0,"why":"...","topGap":"...","enriched":true},
    {"id":"execution_feasibility","score":0,"why":"...","topGap":"...","enriched":false},
    {"id":"competitive_advantage","score":0,"why":"...","topGap":"...","enriched":true},
    {"id":"distribution","score":0,"why":"...","topGap":"...","enriched":true},
    {"id":"innovation","score":0,"why":"...","topGap":"...","enriched":true},
    {"id":"founder_fit","score":0,"why":"...","topGap":"...","enriched":false}
  ],
  "headlineRationale": "2-3 sentences",
  "topStrengths": ["...","..."],
  "topRisks": ["...","..."],
  "nextThreeMoves": [
    "7-day move with a measurable outcome",
    "30-day move with a measurable outcome",
    "60-day move with a measurable outcome"
  ],
  "confidence": "low|medium|high",
  "evidenceLevel": "thin|moderate|rich",
  "assumptions": [
    {
      "area": "market|competition|pricing|regulatory|distribution|channels",
      "claim": "the score-moving category fact",
      "evidenceToLock": "what the founder could provide to confirm it",
      "sourceUrl": "https://...",
      "sourceTitle": "publisher or page title"
    }
  ],
  "enrichmentReliance": "none|low|medium|high",
  "oneAskFromFounder": "single most score-moving founder-provided proof"
}

Rules:
- All scores are integers from 0 to 100.
- "why" and "topGap" must be specific to the idea, not boilerplate.
- overall = round(sum(score_i * weight_i) / 100).
- assumptions should include sourceUrl when live search was used for that claim.
- Return JSON only.`;

function clampText(value: unknown, max: number): string {
  return String(value ?? "").slice(0, max).trim();
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function webSearchEnabled(): boolean {
  return process.env.WEB_SEARCH_DISABLED !== "1";
}

function scoringModel(): string {
  return process.env.SCORING_MODEL?.trim() || "gpt-4o-mini";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function getOutputText(response: unknown): string {
  return String(asRecord(response).output_text ?? "").trim();
}

function collectResponseSources(response: unknown): {
  webSearchUsed: boolean;
  sourcesConsulted: Array<{ url: string; title?: string }>;
} {
  const output = asRecord(response).output;
  const sourcesConsulted: Array<{ url: string; title?: string }> = [];
  let webSearchUsed = false;

  if (!Array.isArray(output)) return { webSearchUsed, sourcesConsulted };

  for (const itemUnknown of output) {
    const item = asRecord(itemUnknown);
    if (item.type === "web_search_call") webSearchUsed = true;
    const content = item.content;
    if (!Array.isArray(content)) continue;

    for (const blockUnknown of content) {
      const block = asRecord(blockUnknown);
      const annotations = block.annotations;
      if (!Array.isArray(annotations)) continue;

      for (const annotationUnknown of annotations) {
        const annotation = asRecord(annotationUnknown);
        const url = typeof annotation.url === "string" ? annotation.url : "";
        if (annotation.type !== "url_citation" || !url) continue;
        if (sourcesConsulted.some((source) => source.url === url)) continue;
        const title = typeof annotation.title === "string" ? annotation.title : undefined;
        sourcesConsulted.push({ url, title });
      }
    }
  }

  return { webSearchUsed, sourcesConsulted };
}

export function scoreToBand(score: number): Band {
  if (score >= 85) return "exceptional";
  if (score >= 70) return "strong";
  if (score >= 50) return "viable";
  if (score >= 30) return "interesting";
  return "weak";
}

export function bandToRecommendation(band: Band, executionDifficulty: number): Recommendation {
  if (band === "exceptional") return "proceed";
  if (band === "strong") return executionDifficulty >= 80 ? "proceed-cautiously" : "proceed";
  if (band === "viable") return executionDifficulty >= 75 ? "refine" : "proceed-cautiously";
  if (band === "interesting") return "refine";
  return "pivot";
}

export async function scoreIdeaV2(input: ScoreInput): Promise<IdeaScoreV2> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("OPENAI_API_KEY is not configured.");

  const topic = clampText(input.topic, 500);
  const position = clampText(input.position, 2000);
  const context = clampText(input.context, 4000);
  if (!topic) throw new Error("Missing topic.");

  const userPrompt = [
    `Idea: ${topic}`,
    position ? `Why the founder believes it works:\n${position}` : "No position provided. Research the category, but do not invent founder facts.",
    context ? `Additional context:\n${context}` : "No context provided. Founder-specific facts are unknown and neutral.",
    "Score this idea now. Return only the JSON object.",
  ].join("\n\n");

  const openai = new OpenAI({ apiKey: key });

  let rawText = "";
  let webSearchUsed = false;
  let sourcesConsulted: Array<{ url: string; title?: string }> = [];

  if (webSearchEnabled()) {
    try {
      const response = await openai.responses.create({
        model: scoringModel(),
        instructions: SYSTEM_PROMPT,
        input: userPrompt,
        tools: [{ type: "web_search" }],
        max_output_tokens: 2400,
      });
      rawText = getOutputText(response);
      const responseMeta = collectResponseSources(response);
      webSearchUsed = responseMeta.webSearchUsed;
      sourcesConsulted = responseMeta.sourcesConsulted;
    } catch (error) {
      console.warn("[scoreIdeaV2] Responses API web search failed, falling back:", error);
    }
  }

  if (!rawText) {
    const completion = await openai.chat.completions.create({
      model: scoringModel(),
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT.replace(
            "with LIVE WEB SEARCH access",
            "without live web search access; score from category knowledge and do not include source URLs",
          ),
        },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.25,
      max_completion_tokens: 2200,
      response_format: { type: "json_object" },
    });
    rawText = completion.choices[0]?.message?.content?.trim() ?? "";
  }

  return parseAndRepairIdeaScoreV2(rawText, webSearchUsed, sourcesConsulted);
}

export function parseAndRepairIdeaScoreV2(
  raw: string,
  webSearchUsed = false,
  sourcesConsulted: Array<{ url: string; title?: string }> = [],
): IdeaScoreV2 {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(raw.replace(/^```json?\s*|```\s*$/g, "").trim());
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        parsed = {};
      }
    }
  }

  const inputDimensions = Array.isArray(parsed.dimensions) ? parsed.dimensions : [];
  const byId = new Map<string, Record<string, unknown>>();
  for (const dim of inputDimensions) {
    if (dim && typeof dim === "object" && "id" in dim) {
      byId.set(String(dim.id), dim as Record<string, unknown>);
    }
  }

  const dimensions: DimensionScore[] = DIMENSION_IDS.map((id) => {
    const source = byId.get(id) ?? {};
    const score = clampInt(source.score, 0, 100, id === "founder_fit" ? 50 : 55);
    const enriched = FOUNDER_ONLY.has(id) ? false : Boolean(source.enriched);
    return {
      id,
      label: DIMENSION_LABELS[id],
      weight: DIMENSION_WEIGHTS[id],
      score,
      band: scoreToBand(score),
      why: clampText(source.why, 280) || "Insufficient signal in the pitch text to justify a higher score.",
      topGap: clampText(source.topGap, 200) || "Add a concrete named example or metric for this dimension.",
      enriched,
    };
  });

  const computedOverall = Math.round(
    dimensions.reduce((sum, dim) => sum + dim.score * dim.weight, 0) / 100,
  );
  const reportedOverall = clampInt(parsed.overall, 0, 100, computedOverall);
  const overall = Math.abs(reportedOverall - computedOverall) <= 5 ? reportedOverall : computedOverall;

  const ideaQualityFallback = Math.round(
    (dimensions[0].score * 20 +
      dimensions[1].score * 15 +
      dimensions[2].score * 15 +
      dimensions[4].score * 15 +
      dimensions[6].score * 5) /
      70,
  );
  const ideaQuality = clampInt(parsed.ideaQuality, 0, 100, ideaQualityFallback);
  const executionDifficulty = clampInt(parsed.executionDifficulty, 0, 100, 100 - dimensions[3].score);

  const founderRaw = String(parsed.founderAdvantageNeeded ?? "");
  const founderAdvantageNeeded = (
    ["low", "medium", "high"].includes(founderRaw)
      ? founderRaw
      : executionDifficulty >= 75
        ? "high"
        : executionDifficulty >= 50
          ? "medium"
          : "low"
  ) as IdeaScoreV2["founderAdvantageNeeded"];

  const band = scoreToBand(overall);
  const recommendationRaw = String(parsed.recommendation ?? "");
  const recommendation = (
    ["proceed", "proceed-cautiously", "refine", "pivot", "reject"].includes(recommendationRaw)
      ? recommendationRaw
      : bandToRecommendation(band, executionDifficulty)
  ) as Recommendation;

  const readArray = (value: unknown, maxItems: number, maxChars: number): string[] =>
    Array.isArray(value)
      ? value.map((item) => clampText(item, maxChars)).filter(Boolean).slice(0, maxItems)
      : [];

  const assumptionAreas = new Set(["market", "competition", "pricing", "regulatory", "distribution", "channels"]);
  const assumptions: Assumption[] = [];
  if (Array.isArray(parsed.assumptions)) {
    for (const assumptionUnknown of parsed.assumptions.slice(0, 12)) {
      const assumption = asRecord(assumptionUnknown);
      const area = String(assumption.area);
      if (!assumptionAreas.has(area)) continue;

      const claim = clampText(assumption.claim, 220);
      if (!claim) continue;

      const sourceUrl =
        typeof assumption.sourceUrl === "string" && /^https?:\/\//.test(assumption.sourceUrl)
          ? clampText(assumption.sourceUrl, 300)
          : undefined;

      assumptions.push({
        area: area as Assumption["area"],
        claim,
        evidenceToLock:
          clampText(assumption.evidenceToLock, 220) ||
          "Provide a concrete number, named source, or signed proof to confirm this.",
        sourceUrl,
        sourceTitle: sourceUrl ? clampText(assumption.sourceTitle, 140) || undefined : undefined,
      });
    }
  }

  const modelSources = assumptions
    .filter((assumption) => assumption.sourceUrl)
    .map((assumption) => ({ url: assumption.sourceUrl as string, title: assumption.sourceTitle }));
  const mergedSources = [...sourcesConsulted, ...modelSources].reduce<Array<{ url: string; title?: string }>>(
    (acc, source) => {
      if (!source.url || acc.some((item) => item.url === source.url)) return acc;
      acc.push(source);
      return acc;
    },
    [],
  );

  const enrichmentRaw = String(parsed.enrichmentReliance ?? "");
  const enrichmentReliance = (
    ["none", "low", "medium", "high"].includes(enrichmentRaw)
      ? enrichmentRaw
      : assumptions.length === 0
        ? "none"
        : assumptions.length <= 2
          ? "low"
          : assumptions.length <= 5
            ? "medium"
            : "high"
  ) as IdeaScoreV2["enrichmentReliance"];

  return {
    overall,
    band,
    recommendation,
    ideaQuality,
    executionDifficulty,
    founderAdvantageNeeded,
    dimensions,
    headlineRationale:
      clampText(parsed.headlineRationale, 600) ||
      "Composite weighted across eight dimensions. See per-dimension notes for the underlying drivers.",
    topStrengths: readArray(parsed.topStrengths, 4, 200),
    topRisks: readArray(parsed.topRisks, 4, 200),
    nextThreeMoves: readArray(parsed.nextThreeMoves, 3, 220),
    confidence: (["low", "medium", "high"].includes(String(parsed.confidence))
      ? parsed.confidence
      : "medium") as IdeaScoreV2["confidence"],
    evidenceLevel: (["thin", "moderate", "rich"].includes(String(parsed.evidenceLevel))
      ? parsed.evidenceLevel
      : enrichmentReliance === "high"
        ? "thin"
        : "moderate") as IdeaScoreV2["evidenceLevel"],
    assumptions,
    enrichmentReliance,
    oneAskFromFounder:
      clampText(parsed.oneAskFromFounder, 240) ||
      (enrichmentReliance === "none"
        ? "No additional info needed."
        : "Add one concrete number from your own pilot, customer call, or contract."),
    webSearchUsed,
    sourcesConsulted: mergedSources.slice(0, 12),
    schemaVersion: 2.2,
  };
}

export function toLegacyBlindScores(v2: IdeaScoreV2): BlindScores {
  const getScore = (id: DimensionId) => v2.dimensions.find((dim) => dim.id === id)?.score ?? 50;
  return {
    problemSolutionFit: getScore("problem_severity"),
    marketOpportunity: getScore("market_size"),
    competitiveEdge: getScore("competitive_advantage"),
    businessModel: getScore("monetization"),
    teamExecution: getScore("execution_feasibility"),
    timingTrends: getScore("innovation"),
    viability: v2.overall,
  };
}
