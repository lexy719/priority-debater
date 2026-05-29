import { REFINEMENTS_CONTEXT_MARKER, setupContextHasRefinements } from "@/lib/scoring-scale";

export function buildScoringRubricBlock(context: string | undefined): string {
  const refinements = setupContextHasRefinements(context)
    ? `
**RE-VALIDATION - USER-SELECTED REFINEMENTS:**
The Context includes "${REFINEMENTS_CONTEXT_MARKER}". Everything after that line is a binding update to the pitch for this run.

- For each context line matching \`[Category Name] refinement - current .../100 -> projected B/100\`, assign that legacy category score exactly B.
- Categories without that pattern should use the v2 bands below and the full updated context.
- For pivots without a projected score, add at least +5 to that category if the pivot is coherent.
- The headline score must move when the founder's selected refinements improve the weighted dimensions.
`
    : "";

  return `
**SCORING LENS - EMERGENT V2:**
Use the specialised v2 scoring logic with evidence-grade skepticism. The validator should be ruthless about what was actually provided, while clearly separating "the idea is weak" from "the submitted context is too thin to evaluate confidently."

Measure the idea across eight independent dimensions:
1. Problem Severity, 20% - pain frequency, urgency, willingness to pay now.
2. Market Size, 15% - TAM/SAM/SOM and growth direction.
3. Monetization Potential, 15% - pricing power, repeatability, unit economics.
4. Execution Feasibility, 15% - can a competent team build and ship this?
5. Competitive Advantage / Moat, 15% - clone-resistance over 24 months.
6. Distribution Potential, 10% - how the company reaches buyers.
7. Innovation / Novelty, 5% - whether this materially changes something.
8. Founder Fit, 5% - unfair founder advantages; if absent, mark as unknown/evidence-limited rather than treating it as a real advantage.

**NON-NEGOTIABLE V2 RULES:**
- Do not collapse everything into one number. Weak moat does not nuke an otherwise strong idea.
- Most thin-context, unvalidated submissions land 35-62 overall because evidence is missing, not because the underlying idea is necessarily bad. Say this clearly.
- 70+ requires specific buyer, pricing, acquisition path, and differentiation evidence. 85+ requires explicit traction, proprietary access, or unusually strong proof.
- Every report must include a confidence/completeness interpretation: low-context scores are provisional and should name the missing details that could materially change the result.
- Missing founder context is a risk signal. Team & Execution may be feasible, but Founder Fit / unfair advantage should be treated as weak unless stated.
- Execution Feasibility is about whether the build/GTM is feasible, not a biography score.
- If no moat is stated, Competitive Edge is capped at 50. "Better execution" is a hypothesis, not a moat.
- Cap Problem-Solution Fit at 60 without a named ICP and painful buying trigger.
- Cap Business Model at 55 without explicit pricing, budget owner, and expected gross margin.
- Cap Market Opportunity at 60 when TAM/SAM/SOM is top-down only or the reachable wedge is unclear.
- Cap Team & Execution at 60 when the pitch gives no team, unfair access, or distribution proof.
- A single category below 45 should normally force CAUTION or NO-GO. Two categories below 45 should normally force NO-GO or PIVOT.
- Use five recommendation buckets: proceed, proceed cautiously, refine, pivot, reject.
- Every dimension should name the top gap that would move the number.
${refinements}

**BANDS (0-100 per dimension):**
- 0-30 weak: broken premise, no real buyer, or unworkable.
- 30-50 interesting: intuition only, real gaps, partial logic.
- 50-70 viable: coherent story, identifiable buyer, plausible economics.
- 70-85 strong: uncommonly clear wedge, market, or economics.
- 85-100 exceptional: rare quality, only when the pitch or context truly justifies it.

**LEGACY REPORT COMPATIBILITY:**
The markdown report still has six visible category lines. Map v2 into those lines:
- Problem-Solution Fit = Problem Severity
- Market Opportunity = Market Size
- Competitive Edge = Competitive Advantage / Moat
- Business Model = Monetization Potential
- Team & Execution = Execution Feasibility
- Timing & Trends = Innovation / Novelty, adjusted by market timing evidence

Headline "### Viability Score: [V]/100" should reflect the v2 weighted composite, not the arithmetic mean of six legacy categories. If the six legacy rows do not average to V, add a short **Score bridge:** explaining that v2 separates idea quality, execution difficulty, and founder advantage.

**GUIDANCE STYLE:**
- Be direct and adversarial about evidence quality, not dismissive about potential. The founder should leave knowing whether the idea is weak or simply under-described.
- Ambitious-but-valid ideas can score strong while still showing high execution difficulty.
- Avoid generic "talk to customers"; name the buyer, channel, falsifying signal, and timebox.
- In Competitive Landscape and Lean Canvas, answer why this can win and why incumbents may not immediately own it.
- Financial estimates must be deterministic, conservative, and grounded in stated pricing, acquisition capacity, sales cycle, target market size, and standard benchmarks.

For each category score, the narrative must visibly support the number.
`.trim();
}

export function getIndustryContext(topic: string, position: string): string {
  const ideaLower = `${topic} ${position}`.toLowerCase();
  if (/saas|software|app|platform|tool|dashboard/i.test(ideaLower)) {
    return `\n**INDUSTRY-SPECIFIC FOCUS: SaaS/Software**\nAnalyze with SaaS-specific metrics: MRR/ARR, churn rate, NDR, CAC payback, gross margin (target >70%), Rule of 40. Compare to SaaS benchmarks. Consider PLG vs sales-led. The finance tables must include ARR, MRR, and monthly churn.\n`;
  }
  if (/marketplace|two.?sided|buyer.*seller|supply.*demand/i.test(ideaLower)) {
    return `\n**INDUSTRY-SPECIFIC FOCUS: Marketplace**\nAnalyze take rate (10-20%), GMV vs revenue, liquidity, disintermediation risk. Financial table should separate GMV from net revenue if applicable.\n`;
  }
  if (/e.?commerce|shop|store|retail|brand|d2c|dtc/i.test(ideaLower)) {
    return `\n**INDUSTRY-SPECIFIC FOCUS: E-commerce/D2C**\nAnalyze AOV, repeat rate, ROAS, contribution margin, inventory risk. Revenue build from orders x AOV, not SaaS ARR unless hybrid.\n`;
  }
  if (/ai|machine learning|ml|gpt|llm|model|neural|automat/i.test(ideaLower)) {
    return `\n**INDUSTRY-SPECIFIC FOCUS: AI/ML**\nInclude inference/COGS in gross margin. Flag wrapper risk, but do not auto-cap moat below 60 when there is a clear wedge. Unit economics must mention cost-per-request or cost-per-seat at scale.\n`;
  }
  if (/fintech|payment|bank|lend|insur|invest|crypto|defi/i.test(ideaLower)) {
    return `\n**INDUSTRY-SPECIFIC FOCUS: Fintech**\nRegulatory/compliance costs in burn. Revenue per transaction or AUM-based model. CAC often high; justify payback.\n`;
  }
  if (/health|medical|patient|clinic|pharma|biotech|wellness|fitness/i.test(ideaLower)) {
    return `\n**INDUSTRY-SPECIFIC FOCUS: Healthcare/Healthtech**\nLong sales cycles, reimbursement risk. Burn must reflect compliance; LTV assumptions need evidence discipline.\n`;
  }
  if (/hardware|device|physical|manufactur|iot|sensor|robot/i.test(ideaLower)) {
    return `\n**INDUSTRY-SPECIFIC FOCUS: Hardware/IoT**\nBOM/margin in COGS. Revenue may blend hardware + subscription; split assumptions if both exist.\n`;
  }
  return "";
}
