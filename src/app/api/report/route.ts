/**
 * POST /api/report   → generate (or fetch) the full Chamber dossier for an idea
 * GET  /api/report?id=...  → fetch a previously generated dossier by share id
 * ─────────────────────────────────────────────────────────────────────────
 * Accuracy model:
 *  1. scoreIdeaV2() is the SINGLE SOURCE OF TRUTH for scores. It is web-search
 *     enriched, evidence-capped, and deterministic (overall = Σ score×weight).
 *  2. The narrative model then writes every chart/table/headline, explicitly
 *     constrained to be consistent with those locked numbers + the debate.
 *  3. After merge we OVERWRITE the score, the 8 rubric dimensions, confidence,
 *     verdict and provenance from scoreIdeaV2 — the prose can never drift from
 *     the audited score.
 *
 * The result is stored server-side (KV-ready) and returned with a share id.
 * ─────────────────────────────────────────────────────────────────────────
 */

import OpenAI from "openai";
import { DEFAULT_REPORT, type Report, type Confidence, type Tone } from "@/components/chamber/report";
import { scoreIdeaV2, type IdeaScoreV2 } from "@/lib/agents/idea-scoring-v2";
import { saveReport, getReport } from "@/lib/report-store";

export const maxDuration = 120;

function clampStr(v: unknown, max: number): string {
  return String(v ?? "").slice(0, max).trim();
}
const clampNum = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(v)));

/* ── GET: fetch a shared report ────────────────────────────────────── */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) return Response.json({ error: "Missing id." }, { status: 400 });
  const stored = await getReport(id);
  if (!stored) return Response.json({ error: "Report not found." }, { status: 404 });
  return Response.json({ id: stored.id, idea: stored.idea, report: stored.report });
}

/* ── shape-preserving deep merge ───────────────────────────────────── */
function mergeShape<T>(def: T, parsed: unknown): T {
  if (parsed === null || parsed === undefined) return def;
  if (typeof def === "string") return (typeof parsed === "string" && parsed.trim() ? parsed : def) as T;
  if (typeof def === "number") return (typeof parsed === "number" && Number.isFinite(parsed) ? parsed : def) as T;
  if (typeof def === "boolean") return (typeof parsed === "boolean" ? parsed : def) as T;
  if (Array.isArray(def)) {
    if (!Array.isArray(parsed) || parsed.length === 0) return def;
    const template = def[0];
    if (template === undefined) return parsed as T;
    return parsed.map((item) => mergeShape(template, item)) as T;
  }
  if (typeof def === "object") {
    if (typeof parsed !== "object" || Array.isArray(parsed)) return def;
    const out: Record<string, unknown> = {};
    const p = parsed as Record<string, unknown>;
    for (const k of Object.keys(def as Record<string, unknown>)) {
      out[k] = mergeShape((def as Record<string, unknown>)[k], p[k]);
    }
    return out as T;
  }
  return def;
}

function sanitize(r: Report): Report {
  r.score.value = clampNum(r.score.value, 0, 100);
  r.score.rubricMean = clampNum(r.score.rubricMean, 0, 100);
  r.score.progression = r.score.progression.map((p) => ({ ...p, value: clampNum(p.value, 0, 100) }));
  r.overview.dims = r.overview.dims.map((d) => ({ ...d, value: clampNum(d.value, 0, 100) }));
  r.risk.radar = r.risk.radar.map((x) => ({ ...x, v: clampNum(x.v, 0, 100) }));
  r.risk.risks = r.risk.risks.map((x) => ({
    ...x,
    sev: x.sev === "HIGH" || x.sev === "MED" || x.sev === "LOW" ? x.sev : "MED",
    prob: clampNum(x.prob, 0, 100), imp: clampNum(x.imp, 0, 100),
  }));
  r.risk.matrix = r.risk.matrix.map((x) => ({
    ...x, prob: clampNum(x.prob, 1, 5) as 1 | 2 | 3 | 4 | 5, imp: clampNum(x.imp, 1, 5) as 1 | 2 | 3 | 4 | 5,
  }));
  r.market.calendar = r.market.calendar.slice(0, 12).map((c) => ({ ...c, intensity: clampNum(c.intensity, 0, 2) as 0 | 1 | 2 }));
  r.competition.quad = r.competition.quad.map((q) => ({ ...q, x: clampNum(q.x, 0, 100), y: clampNum(q.y, 0, 100) }));
  r.competition.rows = r.competition.rows.map((row) => ({ ...row, trac: clampNum(row.trac, 0, 100) }));
  return r;
}

/* ── anchor: stamp the audited scores onto the report ──────────────── */
const toneForScore = (v: number): Tone => (v >= 70 ? "success" : v >= 55 ? "accent" : v >= 40 ? "warn" : "danger");
const confLabel = (c: IdeaScoreV2["confidence"]): Confidence => (c === "high" ? "HIGH" : c === "low" ? "LOW" : "MED");

function verdictFromRecommendation(rec: IdeaScoreV2["recommendation"]): { verdict: string; word: "GO" | "CAUTION" | "NO-GO" } {
  switch (rec) {
    case "proceed": return { verdict: "GO — PROCEED", word: "GO" };
    case "proceed-cautiously": return { verdict: "PROCEED WITH CAUTION", word: "CAUTION" };
    case "refine": return { verdict: "REFINE BEFORE YOU COMMIT", word: "CAUTION" };
    case "pivot": return { verdict: "PIVOT THE WEDGE", word: "NO-GO" };
    default: return { verdict: "DO NOT PROCEED", word: "NO-GO" };
  }
}

function rankLabel(score: number): string {
  if (score >= 85) return "TOP 5%";
  if (score >= 70) return "TOP 15%";
  if (score >= 60) return "TOP 35%";
  if (score >= 50) return "TOP 50%";
  return "BOTTOM HALF";
}

function anchorScores(report: Report, v2: IdeaScoreV2): Report {
  const dims = v2.dimensions.map((d) => ({
    k: d.label.toUpperCase(),
    weight: `×${d.weight}%`,
    value: d.score,
    contrib: +((d.score * d.weight) / 100).toFixed(1),
    tone: toneForScore(d.score),
    note: d.why,
  }));
  const { verdict } = verdictFromRecommendation(v2.recommendation);

  report.score = {
    ...report.score,
    value: v2.overall,
    rubricMean: 50,
    verdict,
    confidence: confLabel(v2.confidence),
    rank: rankLabel(v2.overall),
    rankSub: `${v2.band.toUpperCase()} · ${v2.recommendation.replace("-", " ").toUpperCase()}`,
    progression: [
      { stage: "INTAKE", value: clampNum(v2.overall - 12, 0, 100) },
      { stage: "PANEL", value: clampNum(v2.overall - 7, 0, 100) },
      { stage: "ENRICH", value: clampNum(v2.overall - 3, 0, 100) },
      { stage: "SYNTH", value: clampNum(v2.overall - 1, 0, 100) },
      { stage: "FINAL", value: v2.overall },
    ],
    rationale: v2.headlineRationale,
    recommendation: v2.recommendation.replace("-", " ").toUpperCase(),
    evidenceLevel: v2.evidenceLevel,
    webSearchUsed: v2.webSearchUsed,
    sources: v2.sourcesConsulted.slice(0, 8),
    assumptions: v2.assumptions.slice(0, 6),
    oneAsk: v2.oneAskFromFounder,
  };
  report.overview.dims = dims;
  report.overview.totalContribution = +dims.reduce((a, d) => a + d.contrib, 0).toFixed(1);
  if (v2.topStrengths.length) report.overview.strengths = v2.topStrengths.slice(0, 3).map((s) => ({ title: s, sub: "Audited strength." }));
  // attach real source URLs to named competitors where the title/url mentions them
  report.competition.rows = report.competition.rows.map((row) => {
    if (row.isYou) return row;
    const hit = v2.sourcesConsulted.find((s) =>
      `${s.title ?? ""} ${s.url}`.toLowerCase().includes(row.name.toLowerCase().split(" ")[0]),
    );
    return hit ? { ...row, url: hit.url } : row;
  });
  return report;
}

/* ── POST: generate ────────────────────────────────────────────────── */
export async function POST(request: Request) {
  try {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) return Response.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });

    const body = (await request.json()) as {
      idea?: string; position?: string; context?: string; validation?: string; debate?: string;
    };
    const idea = clampStr(body.idea, 600);
    const position = clampStr(body.position, 2000);
    const context = clampStr(body.context, 4000);
    const validation = clampStr(body.validation, 6000);
    const debate = clampStr(body.debate, 4000);
    if (!idea) return Response.json({ error: "Missing idea." }, { status: 400 });

    // 1. Authoritative, web-enriched, deterministic scores.
    const v2 = await scoreIdeaV2({ topic: idea, position, context });

    // 2. Narrative pass — every chart/table/headline, locked to the audited scores.
    const openai = new OpenAI({ apiKey: key });
    const lockedDims = v2.dimensions.map((d) => `- ${d.label} (${d.weight}%): ${d.score}/100 — ${d.why}`).join("\n");
    const sourceList = v2.sourcesConsulted.slice(0, 8).map((s) => `- ${s.title ?? s.url} (${s.url})`).join("\n");

    const systemPrompt =
      "You are the synthesis engine of Priority Debater. An audited scoring pass has ALREADY fixed the viability score and the eight rubric dimensions — you must NOT change them. Your job is to write the rest of the investor-grade dossier (market sizing, risk register, competition, financials, roadmap, personas, actions, headlines) so that every chart and table is internally consistent with those locked scores and with any debate notes provided. Use real competitor names and plausible, clearly-estimated numbers. Return strict JSON only.";

    const userPrompt = `Idea under review:
"""
${idea}
"""
${position ? `\nFounder's thesis:\n"""\n${position}\n"""\n` : ""}${context ? `\nContext:\n"""\n${context}\n"""\n` : ""}${validation ? `\nPanel validation notes:\n"""\n${validation}\n"""\n` : ""}${debate ? `\nLIVE DEBATE — what the five-agent panel actually challenged and what the founder answered:\n"""\n${debate}\n"""\nReflect these specific objections in the risk register, kill factors and actions.\n` : ""}
LOCKED SCORES (do not contradict — the report's risk/competition/financials must be consistent with these):
- Overall viability: ${v2.overall}/100 (${v2.band}, recommendation: ${v2.recommendation})
${lockedDims}
Headline rationale: ${v2.headlineRationale}
${sourceList ? `\nSources already consulted (cite/extend these, do not invent competitors that contradict them):\n${sourceList}\n` : ""}
Produce the report as JSON with EXACTLY the same structure, keys and value types as this example (example values are for a DIFFERENT idea — replace every value with content for THIS idea; never copy example text):

${JSON.stringify(DEFAULT_REPORT)}

Hard rules:
- Same keys and nesting exactly. No extra keys. No nulls.
- meta.idea = the idea quoted. meta.submittedAt = "SUBMITTED ${new Date().toISOString().slice(0, 10)}". Keep brand/brandMark/version/stressTestLabel.
- The risk radar must be HIGH where the locked dimension scores are LOW (radar = roughly 100 − dimension score for the matching axis).
- Competition must reflect the locked competitive-advantage score and include 4-5 REAL named competitors plus a "YOUR IDEA" row/point (isYou true).
- Financials currency-consistent; 5-year projections; 3 pricing tiers; ~36-month break-even series.
- Tones only: accent|warn|danger|success. Ticker tones: accent|warn|success|data. Severities: HIGH|MED|LOW. Priorities: P0-P3.
- risk.matrix prob/imp integers 1-5. market.calendar = 12 months, intensity 0|1|2.
- Headlines must be punchy and specific to this idea. English only. JSON only.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.6,
      max_completion_tokens: 12000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.replace(/^```json\s*|```$/g, "").trim());
    } catch {
      return Response.json({ error: "Model returned invalid JSON." }, { status: 502 });
    }

    // 3. Merge → sanitize → STAMP audited scores (prose can't drift from the score).
    let report = sanitize(mergeShape(structuredClone(DEFAULT_REPORT), parsed));
    report = anchorScores(report, v2);
    report.score.fromDebate = !!debate;
    report.meta.idea = `"${idea}"`;

    const id = await saveReport(idea, report);
    return Response.json({ id, report });
  } catch (e) {
    console.error("report error:", e);
    const msg = e instanceof Error && /OPENAI_API_KEY|quota/i.test(e.message) ? e.message : "Failed to generate report.";
    const status = /OPENAI_API_KEY/i.test(msg) ? 503 : 500;
    return Response.json({ error: msg }, { status });
  }
}
