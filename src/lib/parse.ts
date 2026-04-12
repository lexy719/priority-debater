import { normalizeScoreFromDenominator } from "@/lib/scoring-scale";

export function extractSection(content: string, header: string | RegExp): string | null {
  const pattern =
    typeof header === "string"
      ? new RegExp(`### ${header}[^\\n]*\\n([\\s\\S]*?)(?=### |\\n---\\n|\\n---$|$)`, "i")
      : header;
  const match = content.match(pattern);
  return match ? match[1].trim() : null;
}

/** Try several ### header titles (first match wins). */
export function extractSectionFirst(content: string, headers: string[]): string | null {
  for (const h of headers) {
    const s = extractSection(content, h);
    if (s) return s;
  }
  return null;
}

/**
 * Substrings that should appear in a complete validation report (for completeness + repair).
 * Order matters for UX labels in missing[].
 */
/** Exported for API repair pass — must match validation report `###` lines exactly */
export const VALIDATION_SECTION_MARKERS = [
  { marker: "### Viability Score", label: "Viability score" },
  { marker: "### Category Scores", label: "Category scores" },
  { marker: "### Problem-Solution Fit", label: "Problem–solution fit" },
  { marker: "### Financial Projections", label: "Financial projections" },
  { marker: "### Unit Economics", label: "Unit economics" },
  { marker: "### Break-Even Analysis", label: "Break-even analysis" },
  { marker: "### Lean Canvas", label: "Lean Canvas" },
  { marker: "### Top 5 Validation Steps Before Building", label: "Top 5 validation steps" },
] as const;

export function getMissingValidationMarkers(content: string): string[] {
  return VALIDATION_SECTION_MARKERS.filter(({ marker }) => !content.includes(marker)).map((m) => m.marker);
}

export function getValidationReportCompleteness(content: string): {
  percent: number;
  missingLabels: string[];
  present: number;
  total: number;
} {
  const missingEntries = VALIDATION_SECTION_MARKERS.filter(({ marker }) => !content.includes(marker));
  const total = VALIDATION_SECTION_MARKERS.length;
  const present = total - missingEntries.length;
  return {
    percent: Math.round((present / total) * 100),
    missingLabels: missingEntries.map((m) => m.label),
    present,
    total,
  };
}

export interface CategoryScores {
  problemSolutionFit: number | null;
  marketOpportunity: number | null;
  competitiveEdge: number | null;
  businessModel: number | null;
  teamExecution: number | null;
  timingTrends: number | null;
}

export interface LeanCanvas {
  problem: string;
  solution: string;
  keyMetrics: string;
  uvp: string;
  unfairAdvantage: string;
  channels: string;
  customerSegments: string;
  costStructure: string;
  revenueStreams: string;
}

export interface TamSamSom {
  tam: string | null;
  sam: string | null;
  som: string | null;
}

function extractCategoryScores(content: string): CategoryScores {
  const section = extractSection(content, "Category Scores") || "";
  const extract = (label: string): number | null => {
    const re100 = new RegExp(
      `${label}[:\\s]*\\[?(\\d+(?:\\.\\d+)?)\\]?\\s*\\/\\s*100\\b`,
      "i",
    );
    const re10 = new RegExp(
      `${label}[:\\s]*\\[?(\\d+(?:\\.\\d+)?)\\]?\\s*\\/\\s*10\\b`,
      "i",
    );
    let m = section.match(re100);
    if (m) return normalizeScoreFromDenominator(parseFloat(m[1]), 100);
    m = section.match(re10);
    if (m) return normalizeScoreFromDenominator(parseFloat(m[1]), 10);
    return null;
  };
  return {
    problemSolutionFit: extract("Problem.?Solution Fit"),
    marketOpportunity: extract("Market Opportunity"),
    competitiveEdge: extract("Competitive Edge"),
    businessModel: extract("Business Model"),
    teamExecution: extract("Team.*Execution"),
    timingTrends: extract("Timing.*Trends"),
  };
}

function extractLeanCanvas(content: string): LeanCanvas | null {
  const section = extractSection(content, "Lean Canvas");
  if (!section) return null;
  const extract = (label: string): string => {
    const m = section.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+?)(?=\\n-\\s*\\*\\*|$)`, "is"));
    return m ? m[1].trim() : "";
  };
  return {
    problem: extract("Problem"),
    solution: extract("Solution"),
    keyMetrics: extract("Key Metrics"),
    uvp: extract("Unique Value Proposition"),
    unfairAdvantage: extract("Unfair Advantage"),
    channels: extract("Channels"),
    customerSegments: extract("Customer Segments"),
    costStructure: extract("Cost Structure"),
    revenueStreams: extract("Revenue Streams"),
  };
}

function extractTamSamSom(content: string): TamSamSom {
  const section = extractSection(content, "Market Opportunity") || "";
  const extractAmount = (label: string): string | null => {
    const m = section.match(new RegExp(`\\b${label}[:\\s]*\\$?([\\d.,]+\\s*(?:B|M|bn|mn|billion|million))`, "i"));
    return m ? `$${m[1]}` : null;
  };
  return {
    tam: extractAmount("TAM"),
    sam: extractAmount("SAM"),
    som: extractAmount("SOM"),
  };
}

/**
 * Headline viability only — supports /100 (current) and legacy /10 reports.
 */
function extractOverallViabilityScore(content: string): number | null {
  const withDenom: RegExp[] = [
    /###\s*Viability Score\s*:?\s*\*?\*?\s*\[?(\d+(?:\.\d+)?)\]?\s*\/\s*(100|10)\b/i,
    /\*\*Viability Score\s*:?\s*\*?\s*\[?(\d+(?:\.\d+)?)\]?\s*\/\s*(100|10)\b/i,
    /^Viability Score\s*:?\s*\[?(\d+(?:\.\d+)?)\]?\s*\/\s*(100|10)\b/im,
  ];
  for (const re of withDenom) {
    const m = content.match(re);
    if (m) {
      const n = parseFloat(m[1]);
      const d = parseInt(m[2], 10) as 10 | 100;
      if (Number.isFinite(n) && (d === 10 || d === 100)) {
        return normalizeScoreFromDenominator(n, d);
      }
    }
  }
  return null;
}

export function extractDashboardData(content: string) {
  const score = extractOverallViabilityScore(content);

  const parseListItems = (text: string) =>
    text
      .split(/\n/)
      .filter((l) => /^\d+\.|^[-*]/.test(l.trim()))
      .map((l) => l.replace(/^\d+\.\s*|^[-*]\s*/, "").trim())
      .filter(Boolean);

  const strengths = parseListItems(extractSection(content, "Strengths") || "");
  const risks = parseListItems(extractSection(content, "Risk Flags?") || "");
  const recommendations = (() => {
    const fromFive = parseListItems(extractSection(content, "Top 5 Validation Steps Before Building") || "");
    if (fromFive.length > 0) return fromFive;
    return parseListItems(extractSection(content, "Top \\d") || "");
  })();

  // Extract Go/No-Go verdict type
  const goNoGoText =
    extractSectionFirst(content, ["Go/No-Go", "Go/No-Go Recommendation"]) || "";
  const goNoGoType: "go" | "caution" | "nogo" | null =
    /\bGO\b(?!\s*\/)/i.test(goNoGoText) ? "go" :
    /\bCAUTION\b/i.test(goNoGoText) ? "caution" :
    /\bNO[- ]?GO\b/i.test(goNoGoText) ? "nogo" :
    null;

  return {
    score,
    strengths,
    risks,
    recommendations,
    goNoGoType,
    categoryScores: extractCategoryScores(content),
    leanCanvas: extractLeanCanvas(content),
    tamSamSom: extractTamSamSom(content),
    summary: extractSection(content, "Idea Summary"),
    verdict: extractSection(content, "One-Line Verdict"),
    goNoGo: extractSectionFirst(content, ["Go/No-Go", "Go/No-Go Recommendation"]),
    marketSummary: extractSection(content, "Market Opportunity"),
    competitiveSummary: extractSection(content, "Competitive Landscape"),
    financialSummary: extractSection(content, "Financial Snapshot") || extractSection(content, "Financial Projections"),
    financialProjections: extractFinancialProjections(content),
    unitEconomics: extractUnitEconomics(content),
    breakEven: extractBreakEven(content),
    competitiveMatrix: extractCompetitiveMatrix(content),
    problemSolution: extractSection(content, "Problem-Solution Fit"),
    targetCustomer:
      extractSection(content, "Target Customer & ICP") || extractSection(content, "Target Customer"),
    valueProposition: extractSection(content, "Value Proposition"),
    businessModel: extractSection(content, "Business Model"),
    keyAssumptions: extractSectionFirst(content, ["Key Assumptions to Validate", "Key Assumptions"]),
    timelineToLaunch: extractSection(content, "Timeline to Launch"),
  };
}

// ── Financial data types & parsers ──

export interface FinancialProjectionRow {
  metric: string;
  year1: string;
  year2: string;
  year3: string;
}

export interface UnitEconomics {
  cac: string | null;
  ltv: string | null;
  ltvCacRatio: string | null;
  paybackPeriod: string | null;
  grossMargin: string | null;
  churnRate: string | null;
  arpu: string | null;
}

export interface BreakEvenData {
  point: string | null;
  timeline: string | null;
  milestone: string | null;
  fundingNeed: string | null;
}

export interface CompetitorEntry {
  name: string;
  approach: string;
  weakness: string;
}

function extractFinancialProjections(content: string): FinancialProjectionRow[] {
  const section = extractSection(content, "Financial Projections") || "";
  const rows: FinancialProjectionRow[] = [];
  // Match markdown table rows: | Metric | Y1 | Y2 | Y3 |
  const tableRows = section.match(/^\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|$/gm);
  if (!tableRows) return rows;
  for (const row of tableRows) {
    // Skip header separator rows (|---|---|---|---|)
    if (/^[\s|:-]+$/.test(row.replace(/\|/g, ""))) continue;
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length >= 4) {
      const metric = cells[0];
      // Skip the table header row itself
      if (/^metric$/i.test(metric)) continue;
      rows.push({ metric, year1: cells[1], year2: cells[2], year3: cells[3] });
    }
  }
  return rows;
}

function extractUnitEconomics(content: string): UnitEconomics {
  const section = extractSection(content, "Unit Economics") || "";
  const grab = (label: string): string | null => {
    const m = section.match(new RegExp(`\\*\\*${label}[^*]*\\*\\*[:\\s]*(.+?)(?=\\n|$)`, "i"));
    return m ? m[1].trim().replace(/^—\s*/, "") : null;
  };
  return {
    cac: grab("CAC"),
    ltv: grab("LTV(?!:CAC)"),
    ltvCacRatio: grab("LTV:CAC"),
    paybackPeriod: grab("Payback"),
    grossMargin: grab("Gross Margin"),
    churnRate: grab("Churn"),
    arpu: grab("ARPU"),
  };
}

function extractBreakEven(content: string): BreakEvenData {
  const section = extractSection(content, "Break-Even Analysis") || extractSection(content, "Break-Even") || "";
  const grab = (label: string): string | null => {
    const m = section.match(new RegExp(`\\*\\*${label}[^*]*\\*\\*[:\\s]*(.+?)(?=\\n|$)`, "i"));
    return m ? m[1].trim().replace(/^—\s*/, "") : null;
  };
  return {
    point: grab("Break-even point") || grab("Break-even"),
    timeline: grab("Estimated timeline") || grab("Timeline"),
    milestone: grab("Key milestone") || grab("Milestone"),
    fundingNeed: grab("Funding need") || grab("Funding"),
  };
}

function extractCompetitiveMatrix(content: string): CompetitorEntry[] {
  const section = extractSection(content, "Competitive Landscape") || "";
  const entries: CompetitorEntry[] = [];
  // Match markdown table rows
  const tableRows = section.match(/^\|[^|]+\|[^|]+\|[^|]+\|$/gm);
  if (!tableRows) return entries;
  for (const row of tableRows) {
    if (/^[\s|:-]+$/.test(row.replace(/\|/g, ""))) continue;
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length >= 3) {
      if (/^player$/i.test(cells[0]) || /^competitor$/i.test(cells[0]) || /^company$/i.test(cells[0]) || /^name$/i.test(cells[0])) continue;
      entries.push({ name: cells[0], approach: cells[1], weakness: cells[2] });
    }
  }
  return entries;
}

/** Numeric category scores only (for reconciliation / sanity checks). */
export function listCategoryScoreValues(cs: CategoryScores): number[] {
  return [
    cs.problemSolutionFit,
    cs.marketOpportunity,
    cs.competitiveEdge,
    cs.businessModel,
    cs.teamExecution,
    cs.timingTrends,
  ].filter((v): v is number => v != null && Number.isFinite(v));
}

/** Mean / min / max of parsed rubric scores. */
export function getCategoryScoreAggregate(cs: CategoryScores): {
  mean: number;
  min: number;
  max: number;
  n: number;
} | null {
  const vals = listCategoryScoreValues(cs);
  if (vals.length === 0) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  return {
    mean: Math.round((sum / vals.length) * 10) / 10,
    min: Math.min(...vals),
    max: Math.max(...vals),
    n: vals.length,
  };
}

/**
 * Detect "optimism drift": headline viability vs category breakdown.
 * Does not modify the report — UI can warn users to trust the rubric when this fires.
 */
export function viabilityHeadlineDivergence(
  viability: number | null,
  cs: CategoryScores,
): { severity: "warn" | "strong"; mean: number; delta: number; minCat: number } | null {
  if (viability == null) return null;
  const agg = getCategoryScoreAggregate(cs);
  if (!agg || agg.n < 4) return null;
  const delta = Math.round((viability - agg.mean) * 10) / 10;
  const { min: minCat, mean } = agg;
  if (viability > minCat + 22.5 || delta > 16) {
    return { severity: "strong", mean, delta, minCat };
  }
  if (viability > minCat + 15 || delta > 11.5) {
    return { severity: "warn", mean, delta, minCat };
  }
  return null;
}
