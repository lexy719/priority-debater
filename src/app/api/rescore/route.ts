/**
 * POST /api/rescore
 * ─────────────────────────────────────────────────────────────────────────
 * The Fix-It loop: the founder provides NEW evidence against a specific
 * rubric dimension (the gap the report flagged). We append it to the context
 * and re-run the SAME audited scoring engine (scoreIdeaV2), so the new score
 * is computed identically to the original — no special-casing, no inflation.
 *
 * Request:  { idea, position?, context?, evidence: string, dimensionLabel?: string }
 * Response: { overall, recommendation, confidence, rationale, dims: [...] }
 * ─────────────────────────────────────────────────────────────────────────
 */

import { scoreIdeaV2 } from "@/lib/agents/idea-scoring-v2";
import { REFINEMENTS_CONTEXT_MARKER } from "@/lib/scoring-scale";
import { guardAndSpend, guardFailResponse, refund } from "@/lib/credits/server";

export const maxDuration = 90;

function clampStr(v: unknown, max: number): string {
  return String(v ?? "").slice(0, max).trim();
}

export async function POST(request: Request) {
  const guard = await guardAndSpend("rescore");
  if (!guard.ok) return guardFailResponse(guard);
  try {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) { await refund("rescore"); return Response.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 }); }

    const body = (await request.json()) as {
      idea?: string; position?: string; context?: string; evidence?: string; dimensionLabel?: string;
    };
    const idea = clampStr(body.idea, 600);
    const position = clampStr(body.position, 2000);
    const baseContext = clampStr(body.context, 3500);
    const evidence = clampStr(body.evidence, 1200);
    const dimensionLabel = clampStr(body.dimensionLabel, 80);
    if (!idea) return Response.json({ error: "Missing idea." }, { status: 400 });
    if (!evidence) return Response.json({ error: "Missing evidence." }, { status: 400 });

    // Fold the new proof into the context as an explicit, audited refinement.
    const refinement =
      `${REFINEMENTS_CONTEXT_MARKER}\n` +
      (dimensionLabel ? `Founder evidence for "${dimensionLabel}": ` : "Founder evidence: ") +
      evidence;
    const context = [baseContext, refinement].filter(Boolean).join("\n\n").slice(0, 4000);

    const v2 = await scoreIdeaV2({ topic: idea, position, context });

    return Response.json({
      overall: v2.overall,
      recommendation: v2.recommendation.replace("-", " ").toUpperCase(),
      confidence: v2.confidence,
      rationale: v2.headlineRationale,
      evidenceLevel: v2.evidenceLevel,
      dims: v2.dimensions.map((d) => ({
        k: d.label.toUpperCase(),
        weight: `×${d.weight}%`,
        value: d.score,
        contrib: +((d.score * d.weight) / 100).toFixed(1),
        tone: d.score >= 70 ? "success" : d.score >= 55 ? "accent" : d.score >= 40 ? "warn" : "danger",
        note: d.why,
      })),
    });
  } catch (e) {
    console.error("rescore error:", e);
    const msg = e instanceof Error && /OPENAI_API_KEY|quota/i.test(e.message) ? e.message : "Failed to re-score.";
    const status = /OPENAI_API_KEY/i.test(msg) ? 503 : 500;
    return Response.json({ error: msg }, { status });
  }
}
