import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

  return {
    score,
    strengths,
    risks,
    summary: extractSection(content, "Idea Summary"),
    verdict: extractSection(content, "One-Line Verdict"),
    goNoGo: extractSection(content, "Go/No-Go"),
    recommendations: parseListItems(extractSection(content, "Top \\d") || ""),
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

