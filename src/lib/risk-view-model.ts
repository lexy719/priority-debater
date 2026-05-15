import { cleanMarkdownText, type CategoryScores } from "@/lib/parse";
import { listCategoryScoreValues } from "@/lib/parse";

export type RiskRadarPoint = {
  dim: string;
  value: number;
  full: number;
  rubricScore: number | null;
  axisLabel: string;
};

export type RiskBreakdownRow = {
  category: string;
  severity: "HIGH" | "MED" | "LOW";
  title: string;
  mitigation: string;
};

const RUBRIC_DIMS: { dim: string; key: keyof CategoryScores; fallbackTitle: string; mitigation: string }[] = [
  {
    dim: "FIT",
    key: "problemSolutionFit",
    fallbackTitle: "Problem-solution fit needs sharper proof",
    mitigation: "Validate urgent pain and willingness to pay with named buyers.",
  },
  {
    dim: "MARKET",
    key: "marketOpportunity",
    fallbackTitle: "Market opportunity needs stronger sizing",
    mitigation: "Ground TAM, SAM, and SOM with explicit sources and buyer counts.",
  },
  {
    dim: "TIME",
    key: "timingTrends",
    fallbackTitle: "Timing thesis needs clearer external pull",
    mitigation: "Tie launch timing to regulation, budgets, or platform shifts.",
  },
  {
    dim: "MODEL",
    key: "businessModel",
    fallbackTitle: "Business model evidence is thin",
    mitigation: "Validate CAC, payback, retention, and willingness to pay.",
  },
  {
    dim: "COMP",
    key: "competitiveEdge",
    fallbackTitle: "Competitive edge is not yet defensible",
    mitigation: "Name rivals and explain why the wedge is hard to copy.",
  },
  {
    dim: "TEAM",
    key: "teamExecution",
    fallbackTitle: "Execution confidence needs more signal",
    mitigation: "Show founder-market fit and the next shippable proof point.",
  },
];

function rubricToRisk(score: number): number {
  return Math.max(8, Math.min(92, Math.round(100 - score)));
}

function severityFromRisk(risk: number): "HIGH" | "MED" | "LOW" {
  if (risk >= 55) return "HIGH";
  if (risk >= 34) return "MED";
  return "LOW";
}

export function inferRiskCategoryFromText(text: string): string {
  const l = text.toLowerCase();
  if (/\b(compet|commodit|incumbent|clone|defensib|moat|substitut)\b/.test(l)) return "COMP";
  if (/\b(cac|churn|pricing|revenue|margin|unit econ|business model|monetiz|payback)\b/.test(l)) return "MODEL";
  if (/\b(regulat|legal|compliance|copyright|privacy|fda)\b/.test(l)) return "TIME";
  if (/\b(team|execut|hire|founder|talent|operat|fleet)\b/.test(l)) return "TEAM";
  if (/\b(market|tam|demand|timing|trend|adoption|growth)\b/.test(l)) return "MARKET";
  if (/\b(fit|problem|solution|product|workflow|ux|icp)\b/.test(l)) return "FIT";
  return "RISK";
}

function inferSeverityFromFlagText(text: string): "HIGH" | "MED" | "LOW" | null {
  const l = text.toLowerCase();
  if (/\b(high|critical|severe|existential)\b/.test(l)) return "HIGH";
  if (/\b(low|minor|manageable)\b/.test(l)) return "LOW";
  if (/\b(med|medium|moderate)\b/.test(l)) return "MED";
  return null;
}

/** Radar = inverted rubric scores (higher = more risk). No fake 44 plateau. */
export function buildRiskRadar(cat: CategoryScores): RiskRadarPoint[] {
  return RUBRIC_DIMS.map(({ dim, key }) => {
    const rubricScore = cat[key];
    const hasScore = rubricScore != null && Number.isFinite(rubricScore);
    const value = hasScore ? rubricToRisk(rubricScore) : 0;
    const axisLabel = hasScore ? `${dim} (${Math.round(rubricScore!)})` : `${dim} (—)`;
    return { dim, value, full: 100, rubricScore: hasScore ? Math.round(rubricScore!) : null, axisLabel };
  });
}

export function countParsedRubricScores(cat: CategoryScores): number {
  return listCategoryScoreValues(cat).length;
}

export function weakestRubricDimension(cat: CategoryScores): { dim: string; score: number } | null {
  const scored = buildRiskRadar(cat).filter((p) => p.rubricScore != null) as (RiskRadarPoint & {
    rubricScore: number;
  })[];
  if (scored.length === 0) return null;
  const w = scored.reduce((a, b) => (a.rubricScore < b.rubricScore ? a : b));
  return { dim: w.dim, score: w.rubricScore };
}

export function buildRiskBreakdown(cat: CategoryScores, riskFlags: string[]): RiskBreakdownRow[] {
  const flagRows: RiskBreakdownRow[] = riskFlags.slice(0, 6).map((raw) => {
    const title = cleanMarkdownText(raw).slice(0, 220);
    const category = inferRiskCategoryFromText(title);
    const rubricKey = RUBRIC_DIMS.find((d) => d.dim === category)?.key;
    const rubricScore = rubricKey ? cat[rubricKey] : null;
    const risk =
      rubricScore != null && Number.isFinite(rubricScore)
        ? rubricToRisk(rubricScore)
        : inferSeverityFromFlagText(title) === "HIGH"
          ? 70
          : inferSeverityFromFlagText(title) === "LOW"
            ? 25
            : 48;
    const severity = inferSeverityFromFlagText(title) ?? severityFromRisk(risk);
    const mitMatch = title.match(/mitigation:\s*(.+)$/i);
    return {
      category,
      severity,
      title: title.replace(/\s*;\s*mitigation:[\s\S]*$/i, "").slice(0, 200),
      mitigation: mitMatch?.[1]?.trim() || "Validate with signal, not opinion · see Top 5 list in dossier.",
    };
  });

  const rubricRows: RiskBreakdownRow[] = RUBRIC_DIMS.map(({ dim, key, fallbackTitle, mitigation }) => {
    const score = cat[key];
    const hasScore = score != null && Number.isFinite(score);
    const risk = hasScore ? rubricToRisk(score) : 50;
    const flagForDim = riskFlags.find((f) => inferRiskCategoryFromText(f) === dim);
    const title = flagForDim
      ? cleanMarkdownText(flagForDim).replace(/\s*;\s*mitigation:[\s\S]*$/i, "").slice(0, 200)
      : hasScore
        ? `${fallbackTitle} · rubric ${Math.round(score!)}/100`
        : fallbackTitle;
    return {
      category: dim,
      severity: severityFromRisk(risk),
      title,
      mitigation: flagForDim?.match(/mitigation:\s*(.+)$/i)?.[1]?.trim() || mitigation,
    };
  }).sort((a, b) => {
    const riskA = rubricToRisk(cat[RUBRIC_DIMS.find((d) => d.dim === a.category)!.key] ?? 50);
    const riskB = rubricToRisk(cat[RUBRIC_DIMS.find((d) => d.dim === b.category)!.key] ?? 50);
    return riskB - riskA;
  });

  const seen = new Set<string>();
  const merged: RiskBreakdownRow[] = [];
  for (const row of [...flagRows, ...rubricRows]) {
    const key = `${row.category}:${row.title.slice(0, 48)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
    if (merged.length >= 6) break;
  }
  return merged;
}
