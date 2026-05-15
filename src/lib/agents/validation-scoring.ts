import { REFINEMENTS_CONTEXT_MARKER, setupContextHasRefinements } from "@/lib/scoring-scale";

export function buildScoringRubricBlock(context: string | undefined): string {
  const refinements = setupContextHasRefinements(context)
    ? `
**RE-VALIDATION — USER-SELECTED REFINEMENTS (mandatory — apply before category scoring):**
The **Context** includes "${REFINEMENTS_CONTEXT_MARKER}". Everything **after** that line is a **binding** update to the pitch for this run.

- For each context line matching \`[Category Name] refinement — current …/100 → projected B/100\`, assign that rubric category score **exactly B** (integer from the line). Write category prose that reflects the refinement; that text is sufficient **evidence** for B (do **not** pull B down with generic evidence caps).
- Categories **without** that pattern: score using bands and evidence rules from topic + reasoning + full context (including refinement paragraphs for cross-axis consistency).
- For \`[Category Label pivot]:\` **without** \`→ projected B/100\`: add **at least +5** to what that category would have scored without that pivot, if the pivot is coherent; otherwise explain the shortfall in-section.
- After all six scores are fixed, **M** = their mean and headline **V = round(M)** (±10 only with **Score bridge:** as usual). Stated **projected B** values came from the founder's chosen scenario — the overall score **must** shift when B changes the mean.
`
    : "";

  return `
**RUBRIC LENS (how to measure):** Use the same dimensions serious diligences uses — **problem–solution fit**, **market opportunity**, **competitive edge**, **business model viability**, **team & execution readiness**, **timing & trends**. Method: (1) list unknowns and evidence gaps explicitly, (2) score each axis **independently**, (3) never let the headline disagree with the weakest axes without a written bridge. Think **lean validation + investor memo**: claims need observable falsifiers; "great idea" talk without proof must not raise numbers.

**TRUTH OVER COMFORT (NON-NEGOTIABLE):**
- Scores are **diagnostic**, not encouragement. **Never inflate** to soften bad news or to "balance" harsh category scores.
- Thin, vague, or evidence-free pitches → **lower** scores. Inventing traction the founder did not provide is forbidden — label guesses **Assumption:**.
- **Gaslighting to avoid:** headline viability far above weak categories with no **Score bridge:**; praising while scoring low everywhere without explaining the gap.
${refinements}

**SCORING PROCEDURE — FOLLOW THIS ORDER:**
1. **Score all six category lines** as **integers from 0 to 100** (${setupContextHasRefinements(context) ? "using **RE-VALIDATION** anchors where they apply, then " : ""}using the bands below for any category not anchored). Each category narrative must justify the number (no orphan scores).
2. **Compute the arithmetic mean** M of those six integers.
3. **Headline viability** in "### Viability Score: [V]/100" must normally be **V = round(M)**. You may use **round(M) ± up to 10 points** only if the line under the score includes a one-sentence **Score bridge:** explaining why (e.g. execution risk dominates but core problem is validated).
4. **Forbidden without Score bridge:** V more than **20 points** above the **lowest** category score, OR more than **15 points** above M. If you cannot justify, set **V = round(M)**.

**BANDS (0–100 per category — calibrate harshly for text-only pitches):**
- **0–30:** Broken premise, no real buyer, or unworkable / unethical; or pure wishlist.
- **31–50:** Intuition only; major gaps on ICP, economics, competition, or proof — typical for generic or very short founder text.
- **51–65:** Coherent story with identifiable buyer and next validation steps; still mostly assumptions.
- **66–74:** Specific competitors/alternatives, plausible commercial logic, and at least one **concrete** evidence hook from the pitch (or a tight deductive case with named risks).
- **75–89:** Uncommon for unvalidated drafts — requires **unusually clear** wedge, economics, and differentiation; say what justifies the number.
- **90–100:** Essentially **never** for a cold pitch with no traction — reserve for extraordinary clarity + evidence in the text.

**EVIDENCE DISCIPLINE:**
- **Above 60** on any category requires a **specific** justification in that section (named competitor, buyer behavior, metric, regulation, channel, or comparable). Otherwise **cap at 60**.
- **Team & Execution:** vague solo-founder text with no plan → **cap at 50** unless context states relevant experience, hires, or milestones.
- **Competitive Edge:** undifferentiated tool/AI wrapper → **cap at 50** until moat or wedge is concrete.

- If a **Web Research Context** block is provided below, use it for market timing, TAM/SAM/SOM sanity checks, and named competitors. Include source URLs in **Research Notes**. If research is unavailable or thin, label those claims as assumptions instead of pretending they are sourced.

**BRUTAL FILTER — USEFUL BEATS POLITE:**
- **Neutrality that refuses judgment is a failure.** You are not a cheerleader. If the pitch is thin, say so. If it reads as a **feature inside an existing product** (Slack, Teams, Salesforce, etc.) rather than a **standalone company**, **say that explicitly** and explain what would have to change for it to be company-scale.
- You **must** sometimes conclude with language as strong as: **"Do not build this as a startup yet"**, **"This is a feature, not a company — unless you own distribution in niche X"**, or **"Proceed only if you can prove Y — otherwise incumbents will ship this in 6–12 months."** When scores sit in the **30–55** range, soft, hedged verdicts are **forbidden** — tie the number to a **sharp failure mode**.
- **Forbidden:** generic "validate the market" / "talk to customers" without naming **who, which channel, what falsifying signal**; praising while scoring low; or a GO/CAUTION verdict that ignores the **lowest** category scores.

**WEDGE, MOAT, INCUMBENT KILL SCENARIO:**
- In **Competitive Landscape** and in **Lean Canvas → Unfair Advantage**, you **must** answer: **Why can this win?** **Why won't the obvious incumbent clone or bundle it?** If the text gives no wedge, write **"No durable wedge stated — treat as high clone risk"** and reflect that in **Competitive Edge** and the headline.
- Name **at least one** realistic **incumbent or platform** that could own this space if they chose to.

**REFERENCE:** Most unvalidated ideas from text land **35–62** on the headline. **70+** is strong on paper only with rare clarity. **85+** headline from text alone should be almost impossible.

**REPRODUCIBILITY (CRITICAL):**
- Scores must be **deterministic**: the same idea text with the same reasoning must always produce the same scores (±2 points max).
- Do NOT randomize or vary scores for variety. Ground every number in the specific text provided.
- If the pitch says nothing about team → Team & Execution gets the same score every time (capped per rules above).
- Financial estimates must follow the same methodology each time: derive from stated pricing, target market size, and standard benchmarks for the vertical.

For each category score, the narrative must visibly support the number — no orphan scores.
`.trim();
}

export function getIndustryContext(topic: string, position: string): string {
  const ideaLower = `${topic} ${position}`.toLowerCase();
  if (/saas|software|app|platform|tool|dashboard/i.test(ideaLower)) {
    return `\n**INDUSTRY-SPECIFIC FOCUS: SaaS/Software**\nAnalyze with SaaS-specific metrics: MRR/ARR, churn rate, NDR, CAC payback, gross margin (target >70%), Rule of 40. Compare to SaaS benchmarks. Consider PLG vs sales-led. The finance tables must include ARR, MRR, and monthly churn.\n`;
  }
  if (/marketplace|two.?sided|buyer.*seller|supply.*demand/i.test(ideaLower)) {
    return `\n**INDUSTRY-SPECIFIC FOCUS: Marketplace**\nAnalyze take rate (10–20%), GMV vs revenue, liquidity, disintermediation risk. Financial table should separate GMV from net revenue if applicable.\n`;
  }
  if (/e.?commerce|shop|store|retail|brand|d2c|dtc/i.test(ideaLower)) {
    return `\n**INDUSTRY-SPECIFIC FOCUS: E-commerce/D2C**\nAnalyze AOV, repeat rate, ROAS, contribution margin, inventory risk. Revenue build from orders × AOV, not SaaS ARR unless hybrid.\n`;
  }
  if (/ai|machine learning|ml|gpt|llm|model|neural|automat/i.test(ideaLower)) {
    return `\n**INDUSTRY-SPECIFIC FOCUS: AI/ML**\nInclude inference/COGS in gross margin. Flag wrapper risk. Unit economics must mention cost-per-request or cost-per-seat at scale.\n`;
  }
  if (/fintech|payment|bank|lend|insur|invest|crypto|defi/i.test(ideaLower)) {
    return `\n**INDUSTRY-SPECIFIC FOCUS: Fintech**\nRegulatory/compliance costs in burn. Revenue per transaction or AUM-based model. CAC often high — justify payback.\n`;
  }
  if (/health|medical|patient|clinic|pharma|biotech|wellness|fitness/i.test(ideaLower)) {
    return `\n**INDUSTRY-SPECIFIC FOCUS: Healthcare/Healthtech**\nLong sales cycles, reimbursement risk. Burn must reflect compliance; LTV assumptions need evidence discipline.\n`;
  }
  if (/hardware|device|physical|manufactur|iot|sensor|robot/i.test(ideaLower)) {
    return `\n**INDUSTRY-SPECIFIC FOCUS: Hardware/IoT**\nBOM/margin in COGS. Revenue may blend hardware + subscription — split in assumptions if both exist.\n`;
  }
  return "";
}
