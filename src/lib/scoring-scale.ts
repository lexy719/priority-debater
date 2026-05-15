/**
 * Validation rubric: 0–100 (finer than /10, same semantics).
 * Aligned with common diligence dimensions: problem–solution, market, competition,
 * business model, execution, timing — similar lean-canvas / investor memo lenses.
 */

export const SCORE_MAX = 100;

/** Appended to `setup.context` when re-validating with explicit refinement lines (must stay in sync with API + validate cap). */
export const REFINEMENTS_CONTEXT_MARKER = "--- REFINEMENTS APPLIED ---";

export function setupContextHasRefinements(context: string | undefined | null): boolean {
  return typeof context === "string" && context.includes(REFINEMENTS_CONTEXT_MARKER);
}

/** Categories below this surface the Suggestions tab on Results (was 7/10). */
export const WEAK_CATEGORY_THRESHOLD = 70;

export function scoreTier(score: number): "strong" | "ok" | "weak" {
  if (score >= 70) return "strong";
  if (score >= 50) return "ok";
  return "weak";
}

export function tierColorClasses(score: number): { text: string; bar: string } {
  if (score >= 70) return { text: "text-emerald-400", bar: "bg-emerald-500" };
  if (score >= 50) return { text: "text-amber-400", bar: "bg-amber-500" };
  return { text: "text-red-400", bar: "bg-red-500" };
}

export function scoreToGoNoGoType(score: number): "go" | "caution" | "nogo" {
  if (score >= 70) return "go";
  if (score >= 50) return "caution";
  return "nogo";
}

/** Convert parsed token to 0–100 given denominator from report line. */
export function normalizeScoreFromDenominator(raw: number, denominator: 10 | 100): number {
  if (!Number.isFinite(raw)) return 0;
  const scaled = denominator === 10 ? raw * 10 : raw;
  return Math.max(0, Math.min(SCORE_MAX, Math.round(scaled)));
}
