export function extractSection(content: string, header: string | RegExp): string | null {
  const pattern =
    typeof header === "string"
      ? new RegExp(`### ${header}[^\\n]*\\n([\\s\\S]*?)(?=### |---|$)`, "i")
      : header;
  const match = content.match(pattern);
  return match ? match[1].trim() : null;
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
    const m = section.match(new RegExp(`${label}[:\\s]*\\[?(\\d+)\\]?\\/10`, "i"));
    return m ? parseInt(m[1]) : null;
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

export function extractDashboardData(content: string) {
  const scoreMatch =
    content.match(/(?:viability score|score)[:\s]*\[?(\d+)\]?\/10/i) || content.match(/(\d+)\/10/);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : null;

  const parseListItems = (text: string) =>
    text
      .split(/\n/)
      .filter((l) => /^\d+\.|^[-*]/.test(l.trim()))
      .map((l) => l.replace(/^\d+\.\s*|^[-*]\s*/, "").trim())
      .filter(Boolean);

  const strengths = parseListItems(extractSection(content, "Strengths") || "");
  const risks = parseListItems(extractSection(content, "Risk Flags?") || "");
  const recommendations = parseListItems(extractSection(content, "Top \\d") || "");

  // Extract Go/No-Go verdict type
  const goNoGoText = extractSection(content, "Go/No-Go") || "";
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
    goNoGo: extractSection(content, "Go/No-Go"),
    marketSummary: extractSection(content, "Market Opportunity"),
    competitiveSummary: extractSection(content, "Competitive Landscape"),
    financialSummary: extractSection(content, "Financial Snapshot"),
    problemSolution: extractSection(content, "Problem-Solution Fit"),
    targetCustomer:
      extractSection(content, "Target Customer & ICP") || extractSection(content, "Target Customer"),
    valueProposition: extractSection(content, "Value Proposition"),
    businessModel: extractSection(content, "Business Model"),
    keyAssumptions: extractSection(content, "Key Assumptions"),
    timelineToLaunch: extractSection(content, "Timeline to Launch"),
  };
}
