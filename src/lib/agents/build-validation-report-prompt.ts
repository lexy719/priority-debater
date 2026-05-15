import { FINANCE_ANALYST_ROLE, FINANCIAL_OUTPUT_CONTRACT } from "@/lib/agents/finance-analyst";
import { buildScoringRubricBlock, getIndustryContext } from "@/lib/agents/validation-scoring";
import { classifyIdeaCategory } from "@/lib/idea-category";
import type { DebateSetup } from "@/lib/types";

/**
 * Full user prompt for `action: "start"` when `setup.template === "validate"`.
 * Composes scoring rubric + finance analyst + parser-stable section templates.
 */
export function buildValidationReportPrompt(setup: DebateSetup): string {
  const industryContext = getIndustryContext(setup.topic, setup.position);
  const ideaCat = classifyIdeaCategory(setup.topic, setup.position);
  const verticalLine = `\n**Idea vertical:** ${ideaCat.label} — use benchmarks, competitor archetypes, and risk patterns typical of this space (not generic startup platitudes).\n`;
  const scoringBlock = buildScoringRubricBlock(setup.context);

  return `You are an expert startup advisor and investor who has evaluated 10,000+ ideas. Generate a COMPREHENSIVE BUSINESS IDEA ANALYSIS.

${scoringBlock}

${FINANCE_ANALYST_ROLE}
${industryContext}${verticalLine}
**Idea to validate:** "${setup.topic}"

**Founder's reasoning:**
${setup.position}

${setup.context ? `**Context:** ${setup.context}` : ""}

Generate a complete analysis with these EXACT section headers (the parser depends on exact formatting):

## COMPREHENSIVE IDEA ANALYSIS

### Idea Summary
- **One-line hook** — what this is in plain language.
- **The hard truth (3–5 sentences, non-negotiable):** State plainly whether this reads as **feature / narrow product / company-scale**; name **the single biggest reason it could fail** or **"this will fail unless ___"**; name **who could ship it faster** (incumbent, big tech, or open-source) if relevant. **No hedging** — readers must feel the judgment.
- **Wedge in one sentence:** What is the **unfair advantage or clear wedge** — or say **"No durable wedge stated — commodity risk."**

### Research Notes
- [If Web Research Context is provided: 3-5 concise bullets with source URLs for current market/competitor/timing facts. If not provided: "No live web research available; assumptions are labeled in the sections below."]

### Viability Score: [X]/100
[GO / CAUTION / NO-GO. **Must** align with the lowest category scores: if any category is below 45, you cannot call this GO without a **Score bridge:** that explains why the headline still merits GO. **NO-GO** is allowed and sometimes required when the idea is uninvestable as stated.]

### Category Scores
- Problem-Solution Fit: [X]/100
- Market Opportunity: [X]/100
- Competitive Edge: [X]/100
- Business Model: [X]/100
- Team & Execution: [X]/100
- Timing & Trends: [X]/100

### Problem-Solution Fit
- **The Problem:** [Who feels it, how acute, how often, willingness to pay]
- **Current Alternatives:** [What do people do today? Why are they inadequate?]
- **Your Solution:** [How you solve it differently. The "10x better" angle]
- **Evidence of Fit:** [What would prove problem-solution fit? Early signals to look for]

### Target Customer & ICP
- **Primary segment:** [Specific: role, company size, industry, geography]
- **Jobs to be done:** [What job are they hiring your product for?]
- **Buying triggers:** [What makes them open their wallet? Pain threshold?]
- **Channels to reach them:** [Where do they congregate? Specific channels with estimated CAC]

### Value Proposition
- **Headline:** [One sentence: "X helps Y do Z by W"]
- **Key benefits:** [3 concrete benefits with "so that" outcomes]
- **Differentiation:** [Why you, not the alternative?]
- **Proof points needed:** [What evidence would make this credible?]

### Business Model
- **Revenue model:** [Subscription / usage / take rate / one-time — be specific with price points]
- **Pricing strategy:** [Value-based, cost-plus, competitive — and why. Suggest specific price range]
- **Key metrics:** [MRR, CAC, LTV, churn — what to track from day one]
- **Unit economics target:** [LTV:CAC ratio, payback period, gross margin with specific numbers]

### Market Opportunity
- **TAM:** $[X]B or $[X]M — [methodology in one line]
- **SAM:** $[X]B or $[X]M — [who is realistically reachable]
- **SOM:** $[X]M — [year 3 capture — show penetration % from SAM]
- **Market timing:** [Why now? What changed in last 12-24 months?]
- **Growth drivers:** [Tailwinds that could accelerate adoption]
- **Headwinds:** [What could slow or kill adoption?]

### Competitive Landscape
| Player | Approach | Weakness |
|--------|----------|----------|
| [Direct competitor or incumbent] | [1-line positioning / why buyer chooses it] | [Specific gap, wedge, or reason it can crush this idea] |
| [Second competitor] | [1-line positioning] | [Specific gap or threat] |
| [Third competitor] | [1-line positioning] | [Specific gap or threat] |

- **Indirect competitors:** [Do nothing, substitutes, incumbents]
- **Positioning gap / wedge:** [Where you fit — **or** "No clear wedge — risk of being a feature"]
- **Why incumbents haven't won yet (or will crush this):** [Explicit scenario — bundling, pricing, distribution]
- **Defensibility:** [Moat potential **or** "No moat stated — default assumption: low defensibility"]
- **Competitive response:** [How might incumbents react? Timeline — include **clone or bundle** risk]

### Strengths
1. [Specific strength with why it matters]
2. [Another strength]
3. [Third strength]
4. [Fourth strength if relevant]

### Risk Flags
1. [Highest risk — likelihood, impact, and specific mitigation]
2. [Second risk — likelihood, impact, and specific mitigation]
3. [Third risk — likelihood, impact, and specific mitigation]
4. [Fourth risk if relevant]

### Key Assumptions to Validate
[3-5 critical assumptions. For each: the assumption, a specific test, what "pass" looks like, and estimated cost/time to test.]

### Timeline to Launch
- **Pre-build (weeks 1-4):** [Validation: customer interviews, landing page test, competitor analysis]
- **Build (weeks 5-12):** [MVP scope, key features only, tech choices]
- **Launch (weeks 13-16):** [Beta, first paying customers, iteration]
- **Post-launch (months 4-6):** [Scale signals, metrics targets, next milestones]

${FINANCIAL_OUTPUT_CONTRACT}

### Go/No-Go Recommendation
[Must read like a **memo**, not a weather report. **NO-GO** or **CAUTION** are first-class outcomes. Include: (1) **feature vs company** judgment if applicable, (2) **what must be true** to deserve funding or full-time build, (3) **one brutal "don't build if"** line. 3-5 sentences.]

### Top 5 Validation Steps Before Building
1. [Specific, actionable — include estimated time and cost]
2. [Second step]
3. [Third step]
4. [Fourth step]
5. [Fifth step]

### Lean Canvas
- **Problem:** [Top 3 problems, one line each]
- **Solution:** [Top 3 solutions matching the problems]
- **Key Metrics:** [3-5 numbers to track]
- **Unique Value Proposition:** [Single clear compelling message]
- **Unfair Advantage:** [Something that cannot be easily copied]
- **Channels:** [Path to customers]
- **Customer Segments:** [Target customers]
- **Cost Structure:** [Key costs with rough estimates]
- **Revenue Streams:** [Sources of revenue with pricing]

### One-Line Verdict
[The single most important insight — be memorable and specific]

---
**Then add 1-2 short paragraphs** of your sharpest adversarial challenge — the question they need to answer, the flaw you'd push on. End with: "Want to debate this? Defend your position below."

**MANDATORY:** Include every \`###\` section listed above from \`### Idea Summary\` through \`### One-Line Verdict\` — especially financial sections. Do not omit sections. Financial tables MUST contain actual numbers with **K/M suffixes** and an **ARR** row that matches your unit economics story.`;
}
