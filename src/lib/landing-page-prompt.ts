import { extractDashboardData } from "@/lib/parse";
import type { DebateSetup } from "@/lib/types";
import type { LandingImageRef } from "@/lib/landing-images";
import type { LayoutVariantId } from "@/lib/landing-layout";
import {
  LANDING_PAGE_COPY_SKILL,
  LANDING_PAGE_SCRIPT_KIT,
  LANDING_PAGE_STYLE_KIT,
} from "@/lib/landing-page-design-kit";

function formatImagesBlock(images: LandingImageRef[]): string {
  if (!images.length) {
    return `**Stock photography:** None loaded (set UNSPLASH_ACCESS_KEY on the server to enable). Do **not** invent image URLs — use only CSS gradients, inline SVG, and emoji for visuals.`;
  }
  return images
    .map(
      (img, i) =>
        `**Image ${i + 1}**\n- src (use exactly): ${img.url}\n- alt: ${img.suggestedAlt}\n- Under the image, add a visible line (.lp-photo-credit): link “Photo by ${img.photographer} on Unsplash” to ${img.photoPageUrl}.`
    )
    .join("\n\n");
}

function truncate(s: string, max: number): string {
  if (!s) return "";
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/** Structured facts from the validation report so the model stays specific (not generic SaaS filler). */
export function buildValidationBriefForLanding(validationContent: string): string {
  if (!validationContent?.trim()) {
    return "No validation report yet — infer a compelling page from the idea and positioning only, and avoid inventing fake metrics or fake customer counts.";
  }

  const d = extractDashboardData(validationContent);
  const cs = d.categoryScores;
  const lines: string[] = [];

  lines.push("### STRUCTURED DATA (ground truth — weave into copy; do NOT contradict these facts)");
  if (d.score != null) lines.push(`- Overall viability score: **${d.score}/10**`);
  if (d.goNoGoType) lines.push(`- Go/No-Go signal: **${d.goNoGoType.toUpperCase()}**`);
  if (d.summary) lines.push(`- Idea summary: ${truncate(d.summary, 900)}`);
  if (d.verdict) lines.push(`- One-line verdict: ${truncate(d.verdict, 400)}`);
  if (d.strengths.length) lines.push(`- Strengths (use as proof points): ${d.strengths.slice(0, 6).join(" · ")}`);
  if (d.risks.length) lines.push(`- Risks / objections (address in FAQ or objection-handling section): ${d.risks.slice(0, 5).join(" · ")}`);
  if (d.recommendations.length) lines.push(`- Validation / next steps: ${d.recommendations.slice(0, 8).join(" · ")}`);
  if (d.leanCanvas?.uvp) lines.push(`- Unique value proposition: ${truncate(d.leanCanvas.uvp, 500)}`);
  if (d.leanCanvas?.solution) lines.push(`- Solution (Lean Canvas): ${truncate(d.leanCanvas.solution, 400)}`);
  if (d.leanCanvas?.problem) lines.push(`- Problem (Lean Canvas): ${truncate(d.leanCanvas.problem, 400)}`);
  if (d.targetCustomer) lines.push(`- Target customer / ICP: ${truncate(d.targetCustomer, 700)}`);
  if (d.valueProposition) lines.push(`- Value proposition: ${truncate(d.valueProposition, 700)}`);
  if (d.problemSolution) lines.push(`- Problem–solution narrative: ${truncate(d.problemSolution, 900)}`);
  if (d.businessModel) lines.push(`- Business model: ${truncate(d.businessModel, 600)}`);
  if (d.competitiveSummary) lines.push(`- Competitive landscape: ${truncate(d.competitiveSummary, 600)}`);

  lines.push(
    `- Category scores: problem/solution ${cs.problemSolutionFit ?? "n/a"}/10 · market ${cs.marketOpportunity ?? "n/a"}/10 · competition ${cs.competitiveEdge ?? "n/a"}/10 · business model ${cs.businessModel ?? "n/a"}/10 · execution ${cs.teamExecution ?? "n/a"}/10 · timing ${cs.timingTrends ?? "n/a"}/10`
  );

  const { tam, sam, som } = d.tamSamSom;
  if (tam || sam || som) {
    lines.push(`- Market sizing: TAM ${tam ?? "—"} · SAM ${sam ?? "—"} · SOM ${som ?? "—"}`);
  }

  lines.push("");
  lines.push("### FULL REPORT EXCERPT (deeper detail for headlines, sections, FAQ — stay specific)");
  lines.push(validationContent.slice(0, 16000));

  return lines.join("\n");
}

export function landingPageSystemPrompt(): string {
  return `You are a principal designer + front-end engineer. You ship **download-ready** single-file HTML: one <style> block, one <script>, no build step.

## Non-negotiable: use the built-in design kit

The app provides a **finished CSS component system** (class prefix \`lp-\`). Your job is **copy + structure + filling components**, NOT inventing new layout CSS from scratch.

1. In <head>, include this link (DM Sans — matches the kit):
   <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet">

2. Inside <style>, paste the ENTIRE following CSS **verbatim** as the first thing (you may prepend ONE small :root { } block **only** to override --lp-accent, --lp-accent-2, --lp-success for brand tint — do not delete or replace kit rules):

${LANDING_PAGE_STYLE_KIT}

3. Before </body>, wrap the following JavaScript in a single <script> tag exactly as-is (mobile nav toggle only; do not modify):

${LANDING_PAGE_SCRIPT_KIT}

4. Markup MUST use these patterns (adapt to the **layout archetype** in the user message — hero may be split, band, or narrow editorial):
   - <body class="lp-page"> plus the **lp-layout--*** class specified in the user message
   - Sticky nav: <header class="lp-nav" data-lp-nav> with .lp-nav__inner, .lp-nav__logo, .lp-nav__links (anchors #problem, #solution, etc.), .lp-btn.lp-btn--primary for CTA, .lp-nav__toggle + .lp-nav__mobile for mobile
   - Hero: .lp-hero (optional .lp-hero--split / .lp-hero--band) with .lp-hero__bg and .lp-hero__grain; .lp-container; for split layouts use .lp-hero__split wrapping .lp-hero__copy + .lp-hero__visual; .lp-eyebrow; h1.lp-hero__title (gradient optional); .lp-hero__lead; .lp-hero__actions; .lp-trust
   - **Images:** if the user message lists image URLs, use <img class="lp-img lp-img-kenburns" loading="lazy" width height> inside .lp-hero__visual and/or .lp-bento; never invent URLs
   - Sections: section.lp-section with id; .lp-section__head; problem/solution may be .lp-grid.lp-grid--3 + .lp-card OR bento / magazine patterns per archetype; .lp-steps / .lp-step (or .lp-steps--horizontal / .lp-steps--magazine)
   - Optional bento: .lp-bento with .lp-bento__item (modifiers --wide / --tall)
   - Proof: .lp-proof-bar and/or .lp-quote; optional .lp-pullquote for magazine
   - FAQ: .lp-faq with <details>
   - Final: section.lp-cta > .lp-container > .lp-cta__inner with .lp-form (POST to formspree)
   - footer.lp-footer
   - Optional: class "lp-reveal" on major blocks for consistent spacing hooks (content stays visible without JS)

${LANDING_PAGE_COPY_SKILL}

FACT RULES:
- Every stat and claim must come from STRUCTURED DATA or the report — no invented user counts or revenue
- Testimonials: plausible ICP quotes only; no celebrities

OUTPUT:
- ONLY the full HTML document. No markdown fences. Start with <!DOCTYPE html>.
- Do NOT omit the kit CSS or the kit script. Do NOT replace the kit with custom CSS from scratch.`;
}

export function landingPageUserPrompt(
  setup: DebateSetup,
  validationContent: string,
  options: {
    layoutVariant: LayoutVariantId;
    layoutInstructions: string;
    images: LandingImageRef[];
  }
): string {
  const brief = buildValidationBriefForLanding(validationContent);
  const { layoutVariant, layoutInstructions, images } = options;

  return `Build a **single-page marketing site** that looks like a top-tier agency product — not a template.

**Layout archetype (mandatory — follow this; it makes each page structurally different):**
- id: \`${layoutVariant}\`
${layoutInstructions}

**Product / brand**
- Name or topic: "${setup.topic}"
- Core pitch: ${setup.position}
- Extra context: ${setup.context?.trim() || "(none)"}

**Source material (use all of this)**:
${brief}

${formatImagesBlock(images)}

**Section checklist (adapt order + density to the layout archetype — do not default to the same 3-column card stack every time):**
1. Sticky nav: logo text, anchors to major sections, primary CTA
2. Hero: match the archetype (split / band / narrow). Eyebrow, headline (≤12 words), subhead, **two** CTAs, trust row from **real** data
3. Problem / pain: language from the report / ICP (cards, bento tiles, or editorial blocks per archetype)
4. Solution: mirror pains (same flexibility)
5. How it works: 3–4 steps — use horizontal timeline or magazine rail if the archetype says so
6. Features / value: bento, grid, or sparse 2-col — match archetype
7. Proof: stats from TAM/SAM/SOM or scores + quotes; place one stock image in hero or bento if URLs provided
8. Pricing OR waitlist: honest — if pre-launch, lead with waitlist + what they get
9. FAQ: 5 questions from risks + category scores
10. Final CTA + footer with links

**Brand tint (optional):** prepend a tiny \`:root { --lp-accent: …; --lp-accent-2: …; }\` before the kit CSS if the palette should shift; defaults: #6366f1 / #8b5cf6 / success #34d399 (see kit variables).

**Output:** complete HTML only — must include full kit CSS + kit script from the system message.`;
}
