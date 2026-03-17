export function extractSection(content: string, header: string | RegExp): string | null {
  const pattern =
    typeof header === "string"
      ? new RegExp(`### ${header}\\s*\\n([\\s\\S]*?)(?=### |---|$)`, "i")
      : header;
  const match = content.match(pattern);
  return match ? match[1].trim() : null;
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
