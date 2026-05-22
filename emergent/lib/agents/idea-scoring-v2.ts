/**
 * idea-scoring-v2.ts — v2.2 (web-grounded enrichment)
 * ─────────────────────────────────────────────────────────────────────────
 * Same 8-dimension weighted rubric and same 2-phase enrichment-then-score
 * pipeline as v2.1, but the enrichment phase is now **live web search**
 * instead of model-memory recall.
 *
 *   • Uses the OpenAI Responses API with the modern `web_search` tool.
 *   • Model autonomously researches the category (TAM, named incumbents,
 *     typical pricing, recent funding rounds, regulatory updates) and
 *     attaches the live URLs it consulted to each assumption.
 *   • Founder-specific dimensions (Execution Feasibility, Founder Fit)
 *     are STILL forbidden to enrich from any source — only what the
 *     user wrote about themselves counts.
 *
 * Cost per scored idea, typical:
 *   - tokens:     ~3k in + 2k out  ≈ $0.0017 on gpt-4o-mini
 *   - web search: ~1 tool call     ≈ $0.01
 *   ─ TOTAL:                       ≈ $0.012 / idea (cached forever)
 *
 * Switches:
 *   - WEB_SEARCH_DISABLED=1 in env  → falls back to v2.1 (no live search)
 *   - SCORING_MODEL=gpt-4o          → upgrade quality (~5x cost) if desired
 *
 * Backward compatible:
 *   - Same /api/score endpoint shape.
 *   - Response is a superset of v2.1 — adds optional sourceUrl + sourceTitle
 *     to each Assumption when the model used live search.
 *   - schemaVersion bumped to 2.2.
 * ─────────────────────────────────────────────────────────────────────────
 */

import OpenAI from "openai";

/* ── Public types ──────────────────────────────────────────────────── */

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
  /** NEW in 2.2 — live URL the model consulted (if web_search was used). */
  sourceUrl?: string;
  /** NEW in 2.2 — title / publisher of the source. */
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

  /** NEW in 2.2 — true if at least one web_search call was made. */
  webSearchUsed: boolean;
  /** NEW in 2.2 — distinct URLs the model cited across all assumptions. */
  sourcesConsulted: Array<{ url: string; title?: string }>;

  schemaVersion: 2 | 2.1 | 2.2;
}

/* ── Weights / labels ──────────────────────────────────────────────── */
export const DIMENSION_WEIGHTS: Record<DimensionId, number> = {
  problem_severity:       20,
  market_size:            15,
  monetization:           15,
  execution_feasibility:  15,
  competitive_advantage:  15,
  distribution:           10,
  innovation:              5,
  founder_fit:             5,
};

export const DIMENSION_LABELS: Record<DimensionId, string> = {
  problem_severity:       "Problem Severity",
  market_size:            "Market Size",
  monetization:           "Monetization Potential",
  execution_feasibility:  "Execution Feasibility",
  competitive_advantage:  "Competitive Advantage / Moat",
  distribution:           "Distribution Potential",
  innovation:             "Innovation / Novelty",
  founder_fit:            "Founder Fit",
};

const FOUNDER_ONLY: ReadonlySet<DimensionId> = new Set<DimensionId>([
  "execution_feasibility",
  "founder_fit",
]);

export function scoreToBand(s: number): Band {
  if (s >= 85) return "exceptional";
  if (s >= 70) return "strong";
  if (s >= 50) return "viable";
  if (s >= 30) return "interesting";
  return "weak";
}

export function bandToRecommendation(band: Band, executionDifficulty: number): Recommendation {
  switch (band) {
    case "exceptional": return "proceed";
    case "strong":      return executionDifficulty >= 80 ? "proceed-cautiously" : "proceed";
    case "viable":      return executionDifficulty >= 75 ? "refine" : "proceed-cautiously";
    case "interesting": return "refine";
    case "weak":        return "pivot";
  }
}

/* ── Prompt ────────────────────────────────────────────────────────── */

const SYSTEM_PROMPT = `You are a specialist startup-idea scoring engine with LIVE WEB SEARCH access.

You score an early-stage idea honestly even when the founder's pitch is short, by doing the market research the founder didn't write down — except now you do real research, not memory recall.

TWO-PHASE PROCEDURE — DO BOTH PHASES IN ONE PASS:

═══════════════════════════════════════════════════════════
PHASE A — LIVE ENRICHMENT (use the web_search tool)
═══════════════════════════════════════════════════════════
Use the web_search tool to look up the following for THIS IDEA'S CATEGORY:
  1. Current TAM / market size / growth rate (cite source URL).
  2. Named incumbents and recent funding rounds in the space.
  3. Typical pricing and unit economics for the category.
  4. Regulatory tailwinds or headwinds active in 2025-2026.
  5. Standard distribution channels that have worked for this category.

For EACH finding you score against, add an entry to 'assumptions' with:
  { area, claim, evidenceToLock, sourceUrl, sourceTitle }
where 'sourceUrl' is the live URL the search returned that grounds the claim.

KEEP SEARCH BUDGET TIGHT:
  • Do 1–3 web_search calls maximum.
  • Reuse facts across dimensions — one good search informs several scores.
  • If the idea is short/clear, 1 search is plenty.

FORBIDDEN — NEVER infer founder-specific facts from any source, web or memory:
  ✗ NO fake traction, LOIs, paid pilots, revenue, signed customers.
  ✗ NO fake team / advisors / capital raised / founder credentials.
  ✗ NO claims about THIS specific company's signed deals.
You may search for category facts. You may NOT search for or invent
founder/company-specific facts unless the founder explicitly stated them.

═══════════════════════════════════════════════════════════
PHASE B — SCORING (8 dimensions, weighted)
═══════════════════════════════════════════════════════════

BANDS (per dimension):
  0–30  weak        broken premise, no real buyer, or unworkable
  30–50 interesting intuition only, real gaps, partial logic
  50–70 viable      coherent story, identifiable buyer, plausible economics
  70–85 strong      uncommonly clear wedge / market / economics
  85–100 exceptional truly justified by live evidence

DIMENSIONS:

1. PROBLEM SEVERITY (20%) — ENRICHABLE. Score using current category pain magnitude.
2. MARKET SIZE (15%) — ENRICHABLE. Score using live TAM / growth.
3. MONETIZATION (15%) — ENRICHABLE. Score using current category pricing benchmarks.
4. EXECUTION FEASIBILITY (15%) — FOUNDER-ONLY. Score on what founder said about scope/MVP. If nothing said → 50–60 (neutral).
5. COMPETITIVE ADVANTAGE / MOAT (15%) — ENRICHABLE. "No moat stated" caps at 60, never lower.
6. DISTRIBUTION (10%) — ENRICHABLE. Score on category-fit channels.
7. INNOVATION (5%) — ENRICHABLE. Score against current state-of-the-art (use search).
8. FOUNDER FIT (5%) — FOUNDER-ONLY. If text says nothing about the founder → score 50 (NEUTRAL, not a punishment).

THREE DECOUPLED SIGNALS:
A) IDEA QUALITY — top-1% operator scenario; weighted average of dims 1,2,3,5,7 only.
B) EXECUTION DIFFICULTY (0–100) — higher = harder.
C) FOUNDER ADVANTAGE NEEDED — "low"|"medium"|"high".

RECOMMENDATION:
- "proceed"             ≥ 85, OR ≥ 70 + difficulty < 80
- "proceed-cautiously"  ≥ 70 with difficulty ≥ 80, or 60–70
- "refine"              50–70 with one or two weak dimensions
- "pivot"               30–50
- "reject"              < 30

ENRICHMENT RELIANCE:
- "none"   user text alone was rich enough
- "low"    1–2 live findings used
- "medium" 3–5 live findings used
- "high"   most of the score's strength came from live research

If reliance ≥ "medium", 'oneAskFromFounder' must name the single piece of
info the founder could add to push the score the most.

OUTPUT — JSON only, no markdown, EXACT shape:

{
  "overall": 0,
  "band": "weak|interesting|viable|strong|exceptional",
  "recommendation": "proceed|proceed-cautiously|refine|pivot|reject",
  "ideaQuality": 0,
  "executionDifficulty": 0,
  "founderAdvantageNeeded": "low|medium|high",
  "dimensions": [
    {"id":"problem_severity",     "score":0,"why":"...","topGap":"...","enriched":true|false},
    {"id":"market_size",          "score":0,"why":"...","topGap":"...","enriched":true|false},
    {"id":"monetization",         "score":0,"why":"...","topGap":"...","enriched":true|false},
    {"id":"execution_feasibility","score":0,"why":"...","topGap":"...","enriched":false},
    {"id":"competitive_advantage","score":0,"why":"...","topGap":"...","enriched":true|false},
    {"id":"distribution",         "score":0,"why":"...","topGap":"...","enriched":true|false},
    {"id":"innovation",           "score":0,"why":"...","topGap":"...","enriched":true|false},
    {"id":"founder_fit",          "score":0,"why":"...","topGap":"...","enriched":false}
  ],
  "headlineRationale": "2–3 sentences",
  "topStrengths":   ["...", "..."],
  "topRisks":       ["...", "..."],
  "nextThreeMoves": ["7-day move", "30-day move", "60-day move"],
  "confidence":     "low|medium|high",
  "evidenceLevel":  "thin|moderate|rich",
  "assumptions": [
    {"area":"market|competition|pricing|regulatory|distribution|channels",
     "claim":"the fact you grounded in search (<=160 chars)",
     "evidenceToLock":"what the founder could share to confirm/extend (<=160 chars)",
     "sourceUrl":"https://... (REQUIRED when you used web_search for this)",
     "sourceTitle":"publisher / page title"}
  ],
  "enrichmentReliance": "none|low|medium|high",
  "oneAskFromFounder": "The single most score-moving piece of info the founder could add (<=180 chars)."
}

INTEGRITY:
- All scores INTEGER 0–100.
- dimensions[i].enriched MUST be false for execution_feasibility and founder_fit.
- 'overall' must equal round(Σ score_i × weight_i / 100) ±5.
- Never invent founder-specific facts.
- Every assumption with enriched=true on its corresponding dimension SHOULD include sourceUrl.
- JSON only. No prose, no markdown, no commentary.
`;

/* ── Server-side runner ────────────────────────────────────────────── */

export interface ScoreInput {
  topic: string;
  position?: string;
  context?: string;
}

function clamp(s: unknown, max: number): string {
  return String(s || "").slice(0, max).trim();
}

function webSearchEnabled(): boolean {
  return process.env.WEB_SEARCH_DISABLED !== "1";
}

function scoringModel(): string {
  return process.env.SCORING_MODEL?.trim() || "gpt-4o-mini";
}

export async function scoreIdeaV2(input: ScoreInput): Promise<IdeaScoreV2> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("OPENAI_API_KEY is not configured.");

  const topic    = clamp(input.topic, 500);
  const position = clamp(input.position, 2000);
  const context  = clamp(input.context, 4000);
  if (!topic) throw new Error("Missing topic.");

  const userPrompt = [
    `**Idea (topic):** ${topic}`,
    position ? `**Why the founder believes it works (position):**\n${position}` : "(no position provided — research the category to fill the gap.)",
    context  ? `**Additional context (founder, traction):**\n${context}` : "(no context provided — do NOT invent founder-specific facts.)",
    "",
    "Score this idea now using Phase A (live web search) + Phase B (scoring). Return ONLY the JSON object.",
  ].join("\n\n");

  const openai = new OpenAI({ apiKey: key });

  let rawText = "";
  let webSearchUsed = false;
  let sourcesConsulted: Array<{ url: string; title?: string }> = [];

  if (webSearchEnabled()) {
    /* — Responses API + web_search tool (preferred path) ─────────── */
    try {
      const response = await openai.responses.create({
        model: scoringModel(),
        instructions: SYSTEM_PROMPT,
        input: userPrompt,
        tools: [{ type: "web_search" } as { type: "web_search" }],
        max_output_tokens: 2400,
      });

      // The convenience accessor gives us the final text content.
      rawText = (response as any).output_text || "";

      // Walk output items to detect tool calls + collect URL citations.
      const output = (response as any).output;
      if (Array.isArray(output)) {
        for (const item of output) {
          if (item?.type === "web_search_call") webSearchUsed = true;
          if (item?.type === "message" && Array.isArray(item.content)) {
            for (const block of item.content) {
              if (Array.isArray(block?.annotations)) {
                for (const a of block.annotations) {
                  if (a?.type === "url_citation" && typeof a?.url === "string") {
                    if (!sourcesConsulted.find((s) => s.url === a.url)) {
                      sourcesConsulted.push({ url: a.url, title: a.title });
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (err) {
      /* Fall through to non-search Chat Completions */
      console.warn("[scoreIdeaV2] Responses API web_search failed, falling back:", err);
    }
  }

  /* — Fallback: chat.completions, no live search ───────────────── */
  if (!rawText) {
    const completion = await openai.chat.completions.create({
      model: scoringModel(),
      messages: [
        { role: "system", content: SYSTEM_PROMPT.replace(
          "with LIVE WEB SEARCH access",
          "(NOTE: live web search is unavailable on this request — score using category knowledge from training data; mark enriched dimensions accordingly but do NOT include sourceUrl)"
        )},
        { role: "user", content: userPrompt },
      ],
      temperature: 0.25,
      max_completion_tokens: 2200,
      response_format: { type: "json_object" },
    });
    rawText = completion.choices[0]?.message?.content?.trim() || "";
  }

  return parseAndRepair(rawText, webSearchUsed, sourcesConsulted);
}

/* ── Parser + integrity repair ─────────────────────────────────────── */

function clampInt(v: unknown, lo: number, hi: number, def: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function parseAndRepair(
  raw: string,
  webSearchUsed: boolean,
  sourcesConsulted: Array<{ url: string; title?: string }>,
): IdeaScoreV2 {
  let parsed: any = {};
  try {
    /* The Responses API may return JSON inside a wider message — try to
       extract the first {...} block if direct JSON.parse fails. */
    try { parsed = JSON.parse(raw.replace(/^```json\s*|```$/g, "").trim()); }
    catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }
  } catch { parsed = {}; }

  const dimsIn: any[] = Array.isArray(parsed.dimensions) ? parsed.dimensions : [];
  const byId = new Map<string, any>();
  for (const d of dimsIn) if (d && typeof d.id === "string") byId.set(d.id, d);

  const dimensions: DimensionScore[] = (Object.keys(DIMENSION_WEIGHTS) as DimensionId[]).map((id) => {
    const src = byId.get(id) ?? {};
    const score = clampInt(src.score, 0, 100, id === "founder_fit" ? 50 : 55);
    const enriched = FOUNDER_ONLY.has(id) ? false : Boolean(src.enriched);
    return {
      id,
      label: DIMENSION_LABELS[id],
      weight: DIMENSION_WEIGHTS[id],
      score,
      band: scoreToBand(score),
      why:    clamp(src.why,    280) || "Scored on category benchmarks.",
      topGap: clamp(src.topGap, 200) || "Add a concrete number or named example for this dimension.",
      enriched,
    };
  });

  const computed = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0) / 100,
  );
  const reportedOverall = clampInt(parsed.overall, 0, 100, computed);
  const overall = Math.abs(reportedOverall - computed) <= 5 ? reportedOverall : computed;

  const ideaQuality = clampInt(
    parsed.ideaQuality, 0, 100,
    Math.round(
      (dimensions[0].score * 20 + dimensions[1].score * 15 + dimensions[2].score * 15 +
       dimensions[4].score * 15 + dimensions[6].score * 5) / 70,
    ),
  );
  const executionDifficulty = clampInt(
    parsed.executionDifficulty, 0, 100,
    Math.round(100 - dimensions[3].score),
  );
  const founderAdvantageNeeded =
    (["low","medium","high"].includes(parsed.founderAdvantageNeeded)
      ? parsed.founderAdvantageNeeded
      : (executionDifficulty >= 75 ? "high" : executionDifficulty >= 50 ? "medium" : "low")) as
        "low" | "medium" | "high";

  const band = scoreToBand(overall);
  const allowedRec: Recommendation[] = ["proceed","proceed-cautiously","refine","pivot","reject"];
  const recRaw: string = typeof parsed.recommendation === "string" ? parsed.recommendation : "";
  const recommendation = (allowedRec.includes(recRaw as Recommendation)
    ? recRaw
    : bandToRecommendation(band, executionDifficulty)) as Recommendation;

  const arr = (a: unknown, max: number, item: number): string[] =>
    Array.isArray(a) ? a.map((x) => clamp(x, item)).filter(Boolean).slice(0, max) : [];

  const assumptionAreas = new Set(["market","competition","pricing","regulatory","distribution","channels"]);
  const assumptions: Assumption[] = Array.isArray(parsed.assumptions)
    ? parsed.assumptions
        .filter((a: any) => a && assumptionAreas.has(a.area))
        .slice(0, 12)
        .map((a: any) => {
          const claim = clamp(a.claim, 220);
          if (!claim) return null;
          const sourceUrl = typeof a.sourceUrl === "string" && /^https?:\/\//.test(a.sourceUrl)
            ? clamp(a.sourceUrl, 300)
            : undefined;
          return {
            area: a.area as Assumption["area"],
            claim,
            evidenceToLock: clamp(a.evidenceToLock, 220) ||
              "Provide a concrete number, named source, or signed evidence to confirm/extend this.",
            sourceUrl,
            sourceTitle: sourceUrl ? clamp(a.sourceTitle, 140) || undefined : undefined,
          } as Assumption;
        })
        .filter(Boolean) as Assumption[]
    : [];

  /* Merge model-reported source URLs with the Responses-API-extracted ones */
  if (sourcesConsulted.length) {
    for (const s of sourcesConsulted) {
      if (!s.url) continue;
      if (!assumptions.some((a) => a.sourceUrl === s.url)) {
        /* keep extra citations available; UI can render them in the
           sourcesConsulted footer even if not tied to an assumption */
      }
    }
  }

  const enrichmentRelianceAllowed = ["none","low","medium","high"] as const;
  const declared = enrichmentRelianceAllowed.includes(parsed.enrichmentReliance)
    ? parsed.enrichmentReliance as typeof enrichmentRelianceAllowed[number]
    : (assumptions.length === 0 ? "none"
       : assumptions.length <= 2 ? "low"
       : assumptions.length <= 5 ? "medium" : "high");

  const oneAskFromFounder = clamp(parsed.oneAskFromFounder, 240) ||
    (declared === "none"
      ? "No additional info needed."
      : "Add 1 concrete number from your own pilot, customer call, or contract.");

  return {
    overall,
    band,
    recommendation,
    ideaQuality,
    executionDifficulty,
    founderAdvantageNeeded,
    dimensions,
    headlineRationale: clamp(parsed.headlineRationale, 600) ||
      "Composite weighted across 8 dimensions. See per-dimension notes for the underlying drivers.",
    topStrengths:   arr(parsed.topStrengths,   4, 200),
    topRisks:       arr(parsed.topRisks,       4, 200),
    nextThreeMoves: arr(parsed.nextThreeMoves, 3, 220),
    confidence:    (["low","medium","high"].includes(parsed.confidence)    ? parsed.confidence    : "medium") as IdeaScoreV2["confidence"],
    evidenceLevel: (["thin","moderate","rich"].includes(parsed.evidenceLevel) ? parsed.evidenceLevel : (declared === "high" ? "thin" : "moderate")) as IdeaScoreV2["evidenceLevel"],
    assumptions,
    enrichmentReliance: declared,
    oneAskFromFounder,
    webSearchUsed,
    sourcesConsulted: sourcesConsulted.slice(0, 12),
    schemaVersion: 2.2,
  };
}

/* ── Bridge: v2 → legacy BlindScores ───────────────────────────────── */
export function toLegacyBlindScores(v2: IdeaScoreV2) {
  const get = (id: DimensionId) => v2.dimensions.find((d) => d.id === id)?.score ?? 50;
  return {
    problemSolutionFit: get("problem_severity"),
    marketOpportunity:  get("market_size"),
    competitiveEdge:    get("competitive_advantage"),
    businessModel:      get("monetization"),
    teamExecution:      get("execution_feasibility"),
    timingTrends:       get("innovation"),
    viability:          v2.overall,
  };
}
