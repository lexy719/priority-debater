import { buildAgentLearningContext } from "@/lib/agents/agent-memory";
import { classifyIdeaCategory } from "@/lib/idea-category";
import type { DebateSetup } from "@/lib/types";

export type DiligenceCap = {
  target: string;
  maxScore: number;
  reason: string;
};

export type DiligenceContext = {
  vertical: {
    id: string;
    label: string;
  };
  contextQuality: {
    score: number;
    level: "thin" | "partial" | "strong";
    confidence: "low" | "medium" | "high";
    missing: string[];
    warning: string;
  };
  proof: {
    hasTraction: boolean;
    hasPricing: boolean;
    hasNamedBuyer: boolean;
    hasDistribution: boolean;
    hasMoat: boolean;
    hasFounderEdge: boolean;
  };
  scoreCaps: DiligenceCap[];
  riskFlags: string[];
  financeGuardrails: string[];
  agentHandoffs: {
    market: string[];
    competition: string[];
    finance: string[];
    finalJudge: string[];
  };
  learningContext: string;
};

function testAny(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

function addCap(caps: DiligenceCap[], target: string, maxScore: number, reason: string): void {
  if (caps.some((cap) => cap.target === target && cap.reason === reason)) return;
  caps.push({ target, maxScore, reason });
}

function addFlag(flags: string[], flag: string): void {
  if (!flags.includes(flag)) flags.push(flag);
}

function contextQualityFromProof(
  setup: Pick<DebateSetup, "topic" | "position" | "context">,
  proof: DiligenceContext["proof"],
): DiligenceContext["contextQuality"] {
  const textLength = `${setup.topic} ${setup.position} ${setup.context}`.trim().length;
  const proofCount = Object.values(proof).filter(Boolean).length;
  const detailBonus = textLength >= 900 ? 20 : textLength >= 450 ? 12 : textLength >= 180 ? 6 : 0;
  const score = Math.min(100, proofCount * 13 + detailBonus);
  const missing: string[] = [];

  if (!proof.hasNamedBuyer) missing.push("named ICP / buyer");
  if (!proof.hasPricing) missing.push("pricing or budget owner");
  if (!proof.hasDistribution) missing.push("distribution channel");
  if (!proof.hasMoat) missing.push("moat / differentiation");
  if (!proof.hasFounderEdge) missing.push("founder edge or execution proof");
  if (!proof.hasTraction) missing.push("traction / demand proof");

  const level = score >= 72 ? "strong" : score >= 42 ? "partial" : "thin";
  const confidence = score >= 72 ? "high" : score >= 42 ? "medium" : "low";
  const warning =
    level === "thin"
      ? "Evidence-limited score: the idea may be better or worse than this, but the submitted context is too thin for a high-confidence evaluation."
      : level === "partial"
        ? "Partially evidenced score: useful directional read, but missing proof still caps confidence."
        : "High-context score: enough founder detail exists for a more confident evaluation.";

  return {
    score,
    level,
    confidence,
    missing,
    warning,
  };
}

function tractionPattern(): RegExp {
  return /\b(paying customers?|revenue|mrr|arr|loi|letter of intent|signed|contract|pilot customers?|active users?|waitlist|preorder|pre-order|beta users?|retention|churn data)\b/i;
}

export async function buildDiligenceContext(
  setup: Pick<DebateSetup, "topic" | "position" | "context">,
): Promise<DiligenceContext> {
  const text = `${setup.topic}\n${setup.position}\n${setup.context}`.toLowerCase();
  const vertical = classifyIdeaCategory(setup.topic, setup.position);
  const learningContext = await buildAgentLearningContext(setup);

  const proof = {
    hasTraction: testAny(text, tractionPattern()),
    hasPricing: testAny(text, /\b(\$\d|€\d|£\d|pricing|price|subscription|take rate|commission|per seat|per user|arpu|monthly|annual|freemium|usage-based)\b/i),
    hasNamedBuyer: testAny(text, /\b(teams?|founders?|developers?|clinics?|doctors?|lawyers?|students?|creators?|smbs?|enterprise|cfo|cto|ceo|manager|operator|agency|restaurant|retailer|landlord|tenant|fleet|warehouse|teacher|parent)\b/i),
    hasDistribution: testAny(text, /\b(seo|sales|outbound|inbound|partnership|referral|community|marketplace|app store|product hunt|linkedin|tiktok|instagram|ads|paid acquisition|channel|distribution|newsletter|audience)\b/i),
    hasMoat: testAny(text, /\b(proprietary|exclusive|network effect|data moat|patent|workflow lock-in|switching cost|distribution advantage|regulatory license|brand|community moat|supply advantage|integration moat)\b/i),
    hasFounderEdge: testAny(text, /\b(i have|we have|founder|experience|background|worked at|built before|audience|network|domain expertise|insider|partnership|access to)\b/i),
  };
  const contextQuality = contextQualityFromProof(setup, proof);

  const scoreCaps: DiligenceCap[] = [];
  const riskFlags: string[] = [];
  const financeGuardrails: string[] = [];

  if (!proof.hasNamedBuyer) {
    addCap(scoreCaps, "Problem-Solution Fit", 60, "Evidence cap: no specific buyer/ICP is named.");
    addFlag(riskFlags, "Evidence gap: buyer is too generic; ask for a named ICP before treating demand as real.");
  }
  if (!proof.hasPricing) {
    addCap(scoreCaps, "Business Model", 55, "Evidence cap: no explicit pricing, budget owner, or ARPU assumption.");
    addFlag(riskFlags, "Evidence gap: monetization is under-specified; do not infer willingness to pay from pain alone.");
  }
  if (!proof.hasDistribution) {
    addCap(scoreCaps, "Distribution Potential", 55, "Evidence cap: no concrete acquisition channel or sales motion.");
    addFlag(riskFlags, "Evidence gap: GTM path is missing; require channel capacity before aggressive revenue growth.");
  }
  if (!proof.hasMoat) {
    addCap(scoreCaps, "Competitive Edge", 50, "Evidence cap: no durable moat, lock-in, data advantage, or distribution edge stated.");
    addFlag(riskFlags, "Evidence gap: default to clone/bundle risk until a defensible wedge is shown.");
  }
  if (!proof.hasFounderEdge) {
    addCap(scoreCaps, "Team & Execution", 60, "Evidence cap: no founder advantage, domain access, or execution proof stated.");
    addFlag(riskFlags, "Evidence gap: founder fit is unknown; do not reward execution beyond generic feasibility.");
  }
  if (!proof.hasTraction) {
    addCap(scoreCaps, "Viability Score", 69, "Evidence cap: no founder-provided traction or demand proof.");
    addFlag(riskFlags, "Evidence gap: treat this as pre-validation; GO requires explicit validation milestones.");
    financeGuardrails.push("Use base-case projections, not venture-case projections.");
    financeGuardrails.push("Year 3 ARR should usually stay below $3M, or below $1.5M for consumer subscriptions, unless distribution proof exists.");
    financeGuardrails.push("LTV:CAC should not exceed 5:1 and payback should not be below 6 months without traction.");
  }

  if (testAny(text, /\b(marketplace|two-sided|buyer.*seller|seller.*buyer|take rate|gmv)\b/i)) {
    financeGuardrails.push("Separate GMV from net revenue; charts and ARR must use take-rate revenue, not GMV.");
    addFlag(riskFlags, "Marketplace liquidity risk: validate supply and demand sides separately.");
  }
  if (testAny(text, /\b(ai|llm|gpt|model|agent|automation)\b/i)) {
    addFlag(riskFlags, "AI wrapper risk: require workflow/data/distribution moat, not just model access.");
    financeGuardrails.push("Include AI/API/inference cost in COGS and gross margin.");
  }
  if (testAny(text, /\b(fintech|health|medical|insurance|bank|payment|legal|compliance|regulated)\b/i)) {
    addFlag(riskFlags, "Regulatory/compliance drag may slow launch and raise burn.");
    financeGuardrails.push("Reflect compliance/legal cost and longer sales cycles in burn and break-even.");
  }

  return {
    vertical: { id: vertical.id, label: vertical.label },
    contextQuality,
    proof,
    scoreCaps,
    riskFlags,
    financeGuardrails,
    agentHandoffs: {
      market: [
        "Define TAM/SAM/SOM from reachable spend, not broad category spend.",
        "If live research gives large market numbers, translate them into a conservative reachable wedge.",
      ],
      competition: [
        "Name incumbents and substitutes, then state how they could clone, bundle, or underprice this.",
        "If no moat is stated, preserve the Competitive Edge cap.",
      ],
      finance: [
        "Build revenue bottom-up from customers, ARPU, conversion/sales capacity, churn, and gross margin.",
        "Use the finance guardrails and repair any numbers that violate the deterministic sanity audit.",
      ],
      finalJudge: [
        "Recommendation must follow the weakest core dimension unless a concrete proof bridge exists.",
        "Do not call it GO when pricing, moat, or distribution is unresolved.",
      ],
    },
    learningContext,
  };
}

export function formatDiligenceContextForPrompt(context: DiligenceContext): string {
  const proofLines = Object.entries(context.proof)
    .map(([key, value]) => `- ${key}: ${value ? "yes" : "no"}`)
    .join("\n");
  const capLines =
    context.scoreCaps.length > 0
      ? context.scoreCaps.map((cap) => `- ${cap.target}: cap at ${cap.maxScore}/100 unless fixed. Reason: ${cap.reason}`).join("\n")
      : "- No deterministic score caps from preflight.";
  const riskLines =
    context.riskFlags.length > 0 ? context.riskFlags.map((risk) => `- ${risk}`).join("\n") : "- No deterministic risk flags.";
  const financeLines =
    context.financeGuardrails.length > 0
      ? context.financeGuardrails.map((guardrail) => `- ${guardrail}`).join("\n")
      : "- Use standard conservative early-stage assumptions.";

  return `### Structured Diligence Context
Vertical: ${context.vertical.label} (${context.vertical.id})

Context confidence:
- completenessScore: ${context.contextQuality.score}/100
- level: ${context.contextQuality.level}
- confidence: ${context.contextQuality.confidence}
- warning: ${context.contextQuality.warning}
- missingForFullEvaluation: ${context.contextQuality.missing.length > 0 ? context.contextQuality.missing.join(", ") : "nothing major detected"}

Proof inventory:
${proofLines}

Binding score caps:
${capLines}

Score interpretation rule:
- These caps are evidence caps, not proof that the idea itself is bad.
- If context confidence is low, say clearly that the score is limited by missing information and list the 2-3 highest-leverage details the founder should add.
- A richer context can raise or lower the score; do not present a thin-context score as a final verdict on idea quality.

Risk flags:
${riskLines}

Finance guardrails:
${financeLines}

Agent handoffs:
- Market Agent: ${context.agentHandoffs.market.join(" ")}
- Competition Agent: ${context.agentHandoffs.competition.join(" ")}
- Finance Agent: ${context.agentHandoffs.finance.join(" ")}
- Final Judge: ${context.agentHandoffs.finalJudge.join(" ")}

${context.learningContext}`;
}

export async function buildDiligenceContextPrompt(
  setup: Pick<DebateSetup, "topic" | "position" | "context">,
): Promise<string> {
  return formatDiligenceContextForPrompt(await buildDiligenceContext(setup));
}
