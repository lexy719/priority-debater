import { FINANCIAL_REPAIR_SYSTEM_PROMPT } from "@/lib/agents/finance-analyst";
import { VALIDATION_SECTION_MARKERS } from "@/lib/parse";

const FINANCIAL_MARKERS = new Set([
  "### Financial Projections",
  "### Unit Economics",
  "### Break-Even Analysis",
]);

/** Pick the best repair system prompt based on which sections are missing. */
export function buildValidationRepairSystemPrompt(missingMarkers: string[]): string {
  const needsFinancial = missingMarkers.some((m) => FINANCIAL_MARKERS.has(m));
  if (needsFinancial) {
    return FINANCIAL_REPAIR_SYSTEM_PROMPT;
  }
  return `You complete partial startup validation reports. Output ONLY the missing sections. Each section must begin with the EXACT ### header line given (character-for-character). Add markdown body under each header (lists/tables OK). Do not repeat any section already present. Ground content in the idea in the report tail; if inferring, say 'Assumption:'. Scores use 0–100. If the report already lists six category scores out of 100, any viability score you add or amend must align within ±10 points of their arithmetic mean unless you include a one-line **Score bridge:** explaining why — never inflate headline viability above weak categories without that bridge.`;
}

export { VALIDATION_SECTION_MARKERS };
