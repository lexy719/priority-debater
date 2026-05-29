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

export function cleanMarkdownText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/\r/g, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1 ($2)")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitMarkdownListItems(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .replace(/\s+-\s+\*\*/g, "\n- **")
    .replace(/\s+(\d+\.)\s+\*\*/g, "\n$1 **")
    .split(/\n+/)
    .filter((l) => /^\s*(?:\d+\.|[-*])/.test(l.trim()))
    .map((l) => cleanMarkdownText(l))
    .filter(Boolean);
}

/**
 * Substrings that should appear in a complete validation report (for completeness + repair).
 * Order matters for UX labels in missing[].
 */
/** Exported for API repair pass — must match validation report `###` lines exactly */
export const VALIDATION_SECTION_MARKERS = [
  { marker: "### Viability Score", label: "Viability score" },
  { marker: "### Context Confidence", label: "Context confidence" },
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

function extractTamSamSomFromText(section: string): TamSamSom {
  const normalized = section.replace(/\*\*/g, "");
  const extractAmount = (label: string): string | null => {
    const nextLabels = label === "TAM" ? "SAM|SOM" : label === "SAM" ? "SOM|TAM" : "TAM|SAM";
    const segmentMatch = normalized.match(
      new RegExp(`(?:^|[\\s;,.\\-*])${label}\\s*:\\s*([\\s\\S]*?)(?=(?:^|[\\s;,.\\-*])(?:${nextLabels})\\s*:|\\n|$)`, "i"),
    );
    const segment = segmentMatch?.[1] ?? "";
    const moneyTokens = Array.from(
      segment.matchAll(/(?:=|≈|~)?\s*\$?\s*([\d.,]+)\s*(B|M|bn|mn|billion|million)\b/gi),
    );
    if (moneyTokens.length === 0) return null;
    const explicitResult = [...moneyTokens].reverse().find((m) => /=\s*\$?\s*[\d.,]+/i.test(m[0]));
    const picked = explicitResult ?? moneyTokens[moneyTokens.length - 1];
    return `$${picked[1]}${picked[2]}`;
  };
  return {
    tam: extractAmount("TAM"),
    sam: extractAmount("SAM"),
    som: extractAmount("SOM"),
  };
}

function extractTamSamSom(content: string): TamSamSom {
  const sections = [
    extractSection(content, "Market Opportunity") || "",
    extractSection(content, "Financial Projections") || "",
    extractSection(content, "Idea Summary") || "",
  ];
  let best: TamSamSom = { tam: null, sam: null, som: null };
  for (const section of sections) {
    const next = extractTamSamSomFromText(section);
    best = {
      tam: best.tam ?? next.tam,
      sam: best.sam ?? next.sam,
      som: best.som ?? next.som,
    };
  }
  return best;
}

/** CAGR / growth rate from market copy, e.g. "14% CAGR". */
export function extractMarketCagr(content: string): number | null {
  const section = extractSection(content, "Market Opportunity") || content.slice(0, 12000);
  const m = section.match(/(\d+(?:\.\d+)?)\s*%\s*(?:CAGR|annual growth|YoY|year[- ]over[- ]year)/i);
  if (m) {
    const n = parseFloat(m[1]);
    if (Number.isFinite(n) && n > 0 && n < 80) return n;
  }
  return null;
}

export type AudienceSegmentShare = { name: string; share: number };

export function extractAudienceSegmentShares(content: string): AudienceSegmentShare[] {
  const section =
    extractSection(content, "Target Customer & ICP") ||
    extractSection(content, "Target Customer") ||
    "";
  if (!section) return [];

  const segments: AudienceSegmentShare[] = [];
  const parenPct = section.matchAll(/\*\*([^*]+?)\*\*[^%\n]*\((\d+(?:\.\d+)?)\s*%\)/gi);
  for (const m of parenPct) {
    const name = cleanMarkdownText(m[1]).replace(/^(Primary|Secondary|Tertiary|Anti-ICP)\s*:?\s*/i, "").trim();
    if (name) segments.push({ name, share: parseFloat(m[2]) });
  }

  const labeled = section.matchAll(
    /(?:Primary|Secondary|Tertiary)(?:\s+segment)?\s*:\s*([^(\n]+?)\s*[-—(]+\s*(\d+(?:\.\d+)?)\s*%/gi,
  );
  for (const m of labeled) {
    const name = cleanMarkdownText(m[1]);
    if (name && !segments.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      segments.push({ name, share: parseFloat(m[2]) });
    }
  }

  return segments.slice(0, 4);
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

  const parseListItems = (text: string) => splitMarkdownListItems(text);

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
    marketCagr: extractMarketCagr(content),
    audienceSegmentShares: extractAudienceSegmentShares(content),
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

export interface FinancialYearValue {
  label: string;
  value: string;
}

export interface FinancialProjectionRow {
  metric: string;
  years: FinancialYearValue[];
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

function cleanCell(value: string): string {
  return cleanMarkdownText(value).replace(/\[[^\]]*\]/g, "").trim();
}

function isPlaceholder(value: string): boolean {
  return /\[[^\]]+\]|\b(real companies|3-5|specific competitors|competitor archetypes)\b/i.test(value);
}

function normalizeYearLabel(label: string, index: number): string {
  const t = label.trim();
  if (/^y\s*\d/i.test(t)) return t.replace(/\s+/g, "").toUpperCase();
  if (/year\s*\d/i.test(t)) return t.replace(/\s+/g, " ");
  return t || `Year ${index + 1}`;
}

function extractFinancialProjections(content: string): FinancialProjectionRow[] {
  const section = extractSection(content, "Financial Projections") || "";
  const rows: FinancialProjectionRow[] = [];
  const tableRows = section.match(/^\|.+\|$/gm);
  let yearLabels: string[] | null = null;

  if (tableRows) {
    for (const row of tableRows) {
      if (/^[\s|:-]+$/.test(row.replace(/\|/g, ""))) continue;
      const cells = row.split("|").map((c) => cleanCell(c)).filter(Boolean);
      if (cells.length < 2) continue;

      if (
        !yearLabels &&
        (/^(metric|item)$/i.test(cells[0]) || cells[0].length < 24) &&
        cells.slice(1).some((c) => /year|y\s*\d/i.test(c))
      ) {
        yearLabels = cells.slice(1).map((c, i) => normalizeYearLabel(c, i));
        continue;
      }

      if (cells.length >= 2 && yearLabels && yearLabels.length >= 2) {
        const metric = cells[0];
        if (/^(metric|year|item)$/i.test(metric) || isPlaceholder(row)) continue;
        const years = yearLabels
          .map((label, i) => ({ label, value: cells[i + 1] ?? "" }))
          .filter((y) => y.value);
        if (years.length >= 2) rows.push({ metric, years });
        continue;
      }

      if (cells.length >= 4 && !yearLabels) {
        const metric = cells[0];
        if (/^(metric|year|item)$/i.test(metric) || isPlaceholder(row)) continue;
        const labels = cells.slice(1).map((c, i) => normalizeYearLabel(c, i));
        if (/year|y\s*\d/i.test(labels[0] ?? "")) {
          yearLabels = labels;
          continue;
        }
        rows.push({
          metric,
          years: [
            { label: "Year 1", value: cells[1] },
            { label: "Year 2", value: cells[2] },
            { label: "Year 3", value: cells[3] },
            ...(cells[4] ? [{ label: "Year 4", value: cells[4] }] : []),
            ...(cells[5] ? [{ label: "Year 5", value: cells[5] }] : []),
          ],
        });
      }
    }
  }

  if (rows.length === 0 && section.includes("|")) {
    const cells = section
      .split("|")
      .map((c) => cleanCell(c))
      .filter((c) => c && !/^[\s:-]+$/.test(c));
    const headerIdx = cells.findIndex(
      (c, i) => /\bmetric\b/i.test(c) && /year\s*1|y1/i.test(cells[i + 1] ?? ""),
    );
    if (headerIdx >= 0) {
      const labels = cells.slice(headerIdx + 1, headerIdx + 6).filter((c) => /year|y\s*\d/i.test(c));
      const colCount = labels.length || 3;
      for (let i = headerIdx + 1 + colCount; i + colCount - 1 < cells.length; i += colCount) {
        const metric = cells[i];
        if (/^(metric|year|item)$/i.test(metric) || isPlaceholder(cells.slice(i, i + colCount).join(" "))) continue;
        rows.push({
          metric,
          years: Array.from({ length: colCount }, (_, j) => ({
            label: normalizeYearLabel(labels[j] ?? `Year ${j + 1}`, j),
            value: cells[i + 1 + j] ?? "",
          })),
        });
      }
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
  const tableRows = section.match(/^\|.+\|$/gm);
  if (tableRows) {
    for (const row of tableRows) {
      if (/^[\s|:-]+$/.test(row.replace(/\|/g, ""))) continue;
      const cells = row.split("|").map((c) => cleanCell(c)).filter(Boolean);
      if (cells.length >= 3) {
        if (
          /^player$/i.test(cells[0]) ||
          /^competitor$/i.test(cells[0]) ||
          /^company$/i.test(cells[0]) ||
          /^name$/i.test(cells[0]) ||
          isPlaceholder(row)
        ) {
          continue;
        }
        entries.push({ name: cells[0], approach: cells[1], weakness: cells[2] });
      }
    }
  }
  if (entries.length > 0) return entries.slice(0, 8);

  if (section.includes("|")) {
    const cells = section
      .split("|")
      .map((c) => cleanCell(c))
      .filter((c) => c && !/^[\s:-]+$/.test(c));
    const headerIdx = cells.findIndex(
      (c, i) => /^(player|competitor|company|name)$/i.test(c) && /^(approach|positioning|focus)$/i.test(cells[i + 1] ?? ""),
    );
    if (headerIdx >= 0) {
      for (let i = headerIdx + 3; i + 2 < cells.length; i += 3) {
        const name = cells[i];
        if (!name || isPlaceholder(cells.slice(i, i + 3).join(" "))) continue;
        entries.push({ name, approach: cells[i + 1], weakness: cells[i + 2] });
        if (entries.length >= 8) break;
      }
      if (entries.length > 0) return entries;
    }
  }

  const lines = section
    .replace(/\s+-\s+\*\*/g, "\n- **")
    .split(/\n+/)
    .map((line) => cleanCell(line.replace(/^\s*[-*]\s*/, "").replace(/^\s*\d+\.\s*/, "")))
    .filter((line) => line.length > 8 && !isPlaceholder(line));

  const directLine = lines.find((line) => /^Direct competitors?:/i.test(line));
  if (directLine) {
    const direct = directLine
      .replace(/^Direct competitors?:\s*/i, "")
      .replace(/\bIndirect competitors?:[\s\S]*$/i, "")
      .replace(/\bPositioning gap[\s\S]*$/i, "")
      .replace(/^\s*-\s*/, "");
    const parenthesized = Array.from(direct.matchAll(/([A-Z0-9][\w .&+-]{1,44}?)\s*\(([^)]+)\)/g));
    if (parenthesized.length > 0) {
      for (const m of parenthesized) {
        const name = cleanCell(m[1]).replace(/^["']|["']$/g, "");
        const approach = cleanCell(m[2]);
        if (!name || /^(AI|No|Direct|Indirect)$/i.test(name)) continue;
        entries.push({ name, approach, weakness: "Threat level and switching gap need validation." });
        if (entries.length >= 8) break;
      }
      if (entries.length > 0) return entries;
    }

    const parts = direct
      .split(/\s+-\s+(?=[A-Z0-9][\w .&-]{1,40}\s*(?:\(|:|,))/)
      .map((part) => part.trim())
      .filter(Boolean);
    for (const part of parts) {
      const m = part.match(/^([^(:,-]{2,48})\s*(?:\((.+?)\)|[:,-]\s*(.+))?/);
      const name = cleanCell(m?.[1] ?? part).replace(/^["']|["']$/g, "");
      const approach = cleanCell(m?.[2] ?? m?.[3] ?? "Named in the competitive landscape.");
      if (!name || /^Direct competitors?$/i.test(name)) continue;
      entries.push({ name, approach, weakness: "Threat level and switching gap need validation." });
      if (entries.length >= 8) break;
    }
    if (entries.length > 0) return entries;
  }

  const competitorLines = lines.filter((line) =>
    /\b(competitor|incumbent|alternative|substitute|platform|direct|indirect)\b/i.test(line),
  );

  for (const line of competitorLines.length > 0 ? competitorLines : lines) {
    const normalized = line
      .replace(/^(direct|indirect)\s+competitors?:\s*/i, "")
      .replace(/^(incumbents?|substitutes?|alternatives?):\s*/i, "");
    const match = normalized.match(/^([^:—-]{2,48})\s*(?:[:—-]\s+)(.+)$/);
    if (!match) continue;
    const name = cleanCell(match[1]).replace(/^["']|["']$/g, "");
    const approach = cleanCell(match[2]).slice(0, 180);
    if (!name || /\b(positioning gap|defensibility|competitive response|why incumbents)\b/i.test(name)) continue;
    entries.push({
      name,
      approach,
      weakness: /weak|gap|risk|no |lacks|limited|slow|expensive/i.test(approach)
        ? approach
        : "Wedge and response risk need validation.",
    });
    if (entries.length >= 8) break;
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
