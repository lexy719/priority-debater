import type { DebateSetup } from "@/lib/types";
import { buildMarketingBriefForLanding } from "@/lib/landing-page-prompt";

/** All text slots for SaaS Nova (values merged into template; HTML-escaped). */
export const SAAS_NOVA_SLOT_KEYS = [
  "BRAND_NAME",
  "NAV_PROBLEM",
  "NAV_FEATURES",
  "NAV_HOW",
  "NAV_FAQ",
  "NAV_CTA",
  "FLOAT_CARD_TITLE",
  "EMAIL_PLACEHOLDER",
  "FLOAT_CTA_LABEL",
  "HERO_HEADLINE",
  "HERO_SUB",
  "CTA_PRIMARY",
  "CTA_SECONDARY",
  "SOCIAL_PROOF_EYEBROW",
  "SOCIAL_PROOF_MAIN",
  "PROBLEM_EYEBROW",
  "PROBLEM_TITLE",
  "PROBLEM_BODY",
  "PROBLEM_QUOTE",
  "BENEFITS_EYEBROW",
  "BENEFITS_TITLE",
  "FEATURE1_TITLE",
  "FEATURE1_BODY",
  "FEATURE2_TITLE",
  "FEATURE2_BODY",
  "FEATURE3_TITLE",
  "FEATURE3_BODY",
  "HOW_EYEBROW",
  "HOW_TITLE",
  "HOW_STEP1_TITLE",
  "HOW_STEP1_BODY",
  "HOW_STEP2_TITLE",
  "HOW_STEP2_BODY",
  "HOW_STEP3_TITLE",
  "HOW_STEP3_BODY",
  "FAQ_EYEBROW",
  "FAQ_TITLE",
  "FAQ1_Q",
  "FAQ1_A",
  "FAQ2_Q",
  "FAQ2_A",
  "FAQ3_Q",
  "FAQ3_A",
  "CTA_FINAL_TITLE",
  "CTA_FINAL_SUB",
  "FOOTER_LINE",
] as const;

export type SaasNovaSlotKey = (typeof SAAS_NOVA_SLOT_KEYS)[number];

export function landingTemplateSystemPrompt(): string {
  return `You are a conversion copywriter. You output **only valid JSON** — no markdown, no HTML, no commentary.

You are filling text slots for a **pre-designed landing page template** (layout, CSS, and photos are already fixed). Your job is **words only**: headlines, body copy, FAQ, CTAs.

Rules:
- **Public launch page** for the business — not a validation report. No scores, no /10, no "AI audit", no Priority Debater.
- **English** unless the product name clearly requires another language for the brand line only.
- **Short:** headlines punchy; body 1–3 sentences per field where noted; FAQ answers ≤3 sentences.
- **Nav labels:** use short words: Problem, Features, How it works, FAQ, Get started (or close).
- **PROBLEM_QUOTE:** one believable pull-quote (no fake celebrity names).
- **FOOTER_LINE:** copyright-style one line with the brand name and year ${new Date().getFullYear()}.
- **SOCIAL_PROOF_EYEBROW:** 2–5 words (e.g. "Trusted by teams", "Early feedback", "What beta users say").
- **SOCIAL_PROOF_MAIN:** **one sentence** of credible social proof — qualitative wins are fine. **Do not** invent company names, logos, awards, or specific numbers unless the business context clearly provides them.

Return a single JSON object whose keys are **exactly** the slot keys provided in the user message. Every key must be present. Values must be strings.`;
}

export function landingTemplateUserPrompt(
  setup: DebateSetup,
  validationContent: string,
  opts?: { verticalLabel?: string }
): string {
  const brief = buildMarketingBriefForLanding(validationContent);
  const vertical = opts?.verticalLabel?.trim() || "General business & technology";
  return `Fill these JSON keys (exact names, all required):

${SAAS_NOVA_SLOT_KEYS.map((k) => `- "${k}"`).join("\n")}

**Business**
- Product / idea name: "${setup.topic}"
- Pitch: ${setup.position}
- Context: ${setup.context?.trim() || "(none)"}
- **Vertical / audience:** ${vertical} — tailor vocabulary, social proof, and FAQ concerns to this space (e.g. trust & compliance for fintech; workflow for B2B; lifestyle benefits for consumer). Do not invent certifications or regulatory claims not implied by the pitch.

**Positioning (for copy only — do not mention internal validation scores):**
${brief}

Output **only** the JSON object.`;
}

/** Defaults if model omits keys */
export function defaultSaasNovaSlots(setup: DebateSetup): Record<string, string> {
  const brand = setup.topic.trim().slice(0, 60) || "Your product";
  const pitch = setup.position.replace(/\s+/g, " ").trim();
  const heroSub =
    pitch.length >= 24
      ? (pitch.length <= 280 ? pitch : `${pitch.slice(0, 279)}…`)
      : "Everything you need in one place — built for teams who move fast.";
  return {
    BRAND_NAME: brand,
    NAV_PROBLEM: "Problem",
    NAV_FEATURES: "Features",
    NAV_HOW: "How it works",
    NAV_FAQ: "FAQ",
    NAV_CTA: "Get started",
    FLOAT_CARD_TITLE: "Ready to get started?",
    EMAIL_PLACEHOLDER: "you@company.com",
    FLOAT_CTA_LABEL: "Get started",
    HERO_HEADLINE: `The smarter way to run ${brand}`,
    HERO_SUB: heroSub,
    CTA_PRIMARY: "Start free",
    CTA_SECONDARY: "See how it works",
    SOCIAL_PROOF_EYEBROW: "Early feedback",
    SOCIAL_PROOF_MAIN:
      "Teams trying the beta report clearer priorities and less thrash — without another heavy tool to manage.",
    PROBLEM_EYEBROW: "The problem",
    PROBLEM_TITLE: "The status quo is costing you time",
    PROBLEM_BODY: "Teams juggle too many tools and still miss the signal. We built something simpler.",
    PROBLEM_QUOTE: "We were drowning in meetings and docs — until we focused on outcomes, not output.",
    BENEFITS_EYEBROW: "Key benefits",
    BENEFITS_TITLE: "Turn friction into momentum",
    FEATURE1_TITLE: "Clarity",
    FEATURE1_BODY: "See what matters first — no noise.",
    FEATURE2_TITLE: "Speed",
    FEATURE2_BODY: "Ship decisions faster with less back-and-forth.",
    FEATURE3_TITLE: "Trust",
    FEATURE3_BODY: "Built for security-conscious teams.",
    HOW_EYEBROW: "How it works",
    HOW_TITLE: "Three simple steps",
    HOW_STEP1_TITLE: "Sign up",
    HOW_STEP1_BODY: "Create your workspace in under a minute.",
    HOW_STEP2_TITLE: "Connect",
    HOW_STEP2_BODY: "Bring your team and tools together.",
    HOW_STEP3_TITLE: "Ship",
    HOW_STEP3_BODY: "Run your workflow and measure results.",
    FAQ_EYEBROW: "FAQ",
    FAQ_TITLE: "Common questions",
    FAQ1_Q: "Who is this for?",
    FAQ1_A: "Teams who need a clearer way to collaborate and deliver.",
    FAQ2_Q: "Is my data safe?",
    FAQ2_A: "We follow industry-standard security practices. Contact us for details.",
    FAQ3_Q: "How do I get started?",
    FAQ3_A: "Enter your email above — we will reach out with next steps.",
    CTA_FINAL_TITLE: "Start today",
    CTA_FINAL_SUB: "Join teams who are already saving time.",
    FOOTER_LINE: `© ${new Date().getFullYear()} ${brand}. All rights reserved.`,
  };
}

export function normalizeSaasNovaSlots(
  raw: unknown,
  setup: DebateSetup
): Record<string, string> {
  const defaults = defaultSaasNovaSlots(setup);
  if (!raw || typeof raw !== "object") return defaults;
  const o = raw as Record<string, unknown>;
  const out: Record<string, string> = { ...defaults };
  for (const key of SAAS_NOVA_SLOT_KEYS) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) out[key] = v.trim().slice(0, 4000);
  }
  return out;
}
