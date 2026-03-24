import { extractDashboardData } from "@/lib/parse";
import type { DebateSetup } from "@/lib/types";
import type { LandingImageRef } from "@/lib/landing-images";
import type { LayoutVariantId } from "@/lib/landing-layout";
import { LANDING_PAGE_COPY_SKILL } from "@/lib/landing-page-design-kit";

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
  return `You are a principal designer + front-end engineer. You ship **download-ready** single-file HTML with **no build step**.

## Critical: do NOT embed the design-system CSS or JS

The application **automatically injects** the full \`lp-*\` CSS kit (animations, glassmorphism, grids, hero, tables) and the **JavaScript** for mobile nav + counters + spotlight. **Do not** paste full-page CSS or any \`<script>\`. You **may** include **one** small \`<style>\` with **only** \`:root { --lp-accent: …; --lp-accent-2: …; --lp-success: …; }\` for brand tint — the injector preserves that before merging the kit.

You **must** only write **semantic structure + copy** using the classes below.

## Visual bar: enterprise SaaS (Semrush / modern 21st.dev-level polish)

Think: **dark canvas**, **one hero product demo** (fake table or chart in a window chrome), **metrics row** with big numbers, **alternating section depth**, **trust** (no fake logos — use capability stats from the report). Patterns:
- **Interactive demo**: \`.lp-demo-shell\` > \`.lp-demo-chrome\` (3 dots) + \`.lp-demo-table-wrap\` > \`table.lp-demo-table\` with plausible columns (e.g. Metric, Score, Trend) — static HTML rows, no API.
- **Metric wall**: \`section.lp-metric-wall\` with \`.lp-metric-wall__item\` / \`.lp-metric-wall__value\` / \`.lp-metric-wall__label\` for 3–4 big stats (numbers from STRUCTURED DATA only).
- **Editorial sections**: \`.lp-section-eyebrow\` + \`.lp-section__title\` for clear hierarchy like top-tier marketing sites.

## Markup MUST use these patterns (adapt to the **layout archetype** in the user message — hero may be split, band, or narrow editorial):
   - <body class="lp-page"> plus the **lp-layout--*** class specified in the user message
   - Sticky nav: <header class="lp-nav" data-lp-nav> with .lp-nav__inner, .lp-nav__logo, .lp-nav__links (anchors #problem, #solution, etc.), .lp-btn.lp-btn--primary for CTA, .lp-nav__toggle + .lp-nav__mobile for mobile
   - Hero: .lp-hero (optional .lp-hero--split / .lp-hero--band) with .lp-hero__bg and .lp-hero__grain; .lp-container; for split layouts use .lp-hero__split wrapping .lp-hero__copy + .lp-hero__visual; .lp-eyebrow; h1.lp-hero__title (gradient optional); .lp-hero__lead; .lp-hero__actions; .lp-trust
   - **DYNAMIC BACKGROUNDS (use at least ONE):**
     a) .lp-bg-mesh on a section for animated gradient mesh
     b) .lp-orbs container inside .lp-hero with 2-3 .lp-orb children (.lp-orb--1, .lp-orb--2, .lp-orb--3) for floating color blobs
     c) .lp-particles for subtle dot pattern overlay
     d) Combine: use .lp-orbs in hero + .lp-bg-mesh on a feature section + .lp-particles on CTA
   - **Images:** if the user message lists image URLs, use <img class="lp-img lp-img-kenburns" loading="lazy" width height> inside .lp-hero__visual and/or .lp-bento; never invent URLs
   - **Glassmorphism:** use .lp-glass on 1-2 cards for frosted effect; use .lp-card--glow on a hero feature or primary card for animated gradient border
   - Sections: section.lp-section with id; .lp-section__head; problem/solution may be .lp-grid.lp-grid--3 + .lp-card OR bento / magazine patterns per archetype; .lp-steps / .lp-step (or .lp-steps--horizontal / .lp-steps--magazine)
   - **Feature rows:** use .lp-feature-row (icon + title + text with accent border) for a different look than cards — alternate between card grids and feature rows across sections
   - Optional bento: .lp-bento with .lp-bento__item (modifiers --wide / --tall)
   - **Stats/counters:** use data-lp-count="1234" data-lp-prefix="$" data-lp-suffix="M" on stat numbers for animated counting; wrap in .lp-proof-bar
   - **Testimonials v2:** use .lp-testimonial with .lp-testimonial__stars, .lp-testimonial__text, .lp-testimonial__author, .lp-testimonial__avatar (initials), .lp-testimonial__name, .lp-testimonial__role
   - **Badges:** use .lp-badge or .lp-badge--success for inline pills (e.g. "7/10 Viability Score")
   - Proof: .lp-proof-bar and/or .lp-quote; optional .lp-pullquote for magazine
   - FAQ: .lp-faq with <details>
   - Final: section.lp-cta > .lp-container > .lp-cta__inner with .lp-form (POST to formspree) — add .lp-orbs or .lp-particles for dramatic backdrop
   - footer.lp-footer
   - **Scroll animations:** use .lp-fade-up class on sections for CSS scroll-driven animations (progressive enhancement, works without JS)

## Premium Effects (use at least 3 per page):
- .lp-noise — add to <body> for subtle grain texture overlay. Never skip the noise texture — it adds instant premium feel.
- .lp-spotlight — add to hero or feature sections for cursor-following glow effect (JS tracks the mouse automatically).
- .lp-card--gradient-border — wrap the most important card/CTA; child gets the background, parent shows the animated gradient border.
- .lp-text-shine — on hero headline for a travelling shimmer/shine effect.
- .lp-marquee + .lp-marquee__track — for social proof logos or badges; duplicate items inside .lp-marquee__track so the loop is seamless.
- .lp-stagger — on feature grids / card containers for cascading staggered reveal (up to 6 children).
- .lp-blob — as decorative background elements (use 2-3 with different colors + sizes positioned absolutely inside a relative container).
- .lp-card--lift — on all feature/pricing cards for dramatic hover lift with glow shadow.
- .lp-counter-css — CSS @property counter (set --lp-num via style attribute for target value).
Combine these freely: e.g. .lp-noise on body + .lp-spotlight on hero + .lp-text-shine on headline + .lp-stagger on feature grid + .lp-card--lift on cards + .lp-blob decorations behind CTA.

${LANDING_PAGE_COPY_SKILL}

FACT RULES:
- Every stat and claim must come from STRUCTURED DATA or the report — no invented user counts or revenue
- Testimonials: plausible ICP quotes only; no celebrities

OUTPUT:
- ONLY the full HTML document. No markdown fences. Start with <!DOCTYPE html>.
- Do NOT include <style> except optional :root { --lp-* } brand overrides. Do NOT include <script>. The app injects all design-system CSS + JS.`;
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

**CRITICAL DESIGN RULES — what separates a $50 page from a $5,000 page:**
1. **Visual variety within the page:** Never use the same component type twice in a row. If you use .lp-card grid for problems, use .lp-feature-row for solutions. If you use .lp-grid for features, use .lp-bento for proof. Mix it up.
2. **Dynamic backgrounds:** The hero MUST have either .lp-orbs (floating blobs) or .lp-bg-mesh (animated gradient). At least ONE other section should also have a dynamic background element.
3. **Depth layers:** Use .lp-glass on at least 1 card. Use .lp-card--glow on the most important card (e.g. the main feature or pricing highlight).
4. **Animated numbers:** Any stat in the proof bar should use data-lp-count for animated counting.
5. **Color variety:** Override --lp-accent and --lp-accent-2 in :root to match the business type. Tech = indigo/violet. Health = emerald/teal. Finance = blue/cyan. Food = orange/amber. Education = violet/pink. Creative = pink/rose.
6. **No generic copy.** Every headline, every bullet point must reference THIS specific idea. If I can swap the product name and the copy still works, it's too generic.

**Section checklist (adapt order + density to the layout archetype — do not default to the same 3-column card stack every time):**
1. Sticky nav: logo text, anchors to major sections, primary CTA button
2. Hero: match the archetype (split / band / narrow). Add .lp-orbs with 2-3 floating blobs OR .lp-bg-mesh. Eyebrow with .lp-badge, headline (≤12 words, gradient text if archetype permits), subhead, **two** CTAs, trust row with animated counters from **real** data. In the hero **visual** column, use **.lp-demo-shell** + **.lp-demo-table** (browser chrome + fake metrics table) **or** a provided stock image — Semrush-style product preview.
3. **Metric wall:** include **section.lp-metric-wall** with 3–4 **.lp-metric-wall__item** blocks (values/labels from STRUCTURED DATA only — viability score, dimensions, TAM line, etc.). Place after hero or before features.
4. Problem / pain: "You …" language from the report / ICP. Use cards OR bento tiles OR feature rows — NOT the same format as the next section
5. Solution: mirror each pain with a named outcome. Different visual format than problems.
6. How it works: 3–4 steps — use horizontal timeline or magazine rail if the archetype says so. Add .lp-particles background for subtle texture.
7. Features / value: bento, grid, or sparse 2-col — match archetype. Use .lp-glass or .lp-card--glow on the most important feature.
8. Proof: animated stats from TAM/SAM/SOM or validation scores + .lp-testimonial cards (2-3 with initials avatar, ICP-realistic quotes, star ratings). Place stock images in hero or bento if URLs provided.
9. Pricing OR waitlist: honest — if pre-launch, lead with waitlist + what they get. Style with .lp-card--glow on recommended tier.
10. FAQ: 5 questions from risks + category scores. Use .lp-faq with details/summary.
11. Final CTA: dramatic section with .lp-orbs or .lp-bg-mesh background, .lp-cta__inner, email form.
12. Footer with links.

**Brand tint (mandatory — pick colors that fit the business):** include a single \`<style>\` block with **only** \`:root { --lp-accent: …; --lp-accent-2: …; --lp-success: …; }\` (or rely on defaults). Pick colors from the industry/vibe. Do NOT always use indigo.

**Output:** complete HTML only — **no** full-page \`<style>\` or \`<script>\`; the app injects the design kit.`;
}
