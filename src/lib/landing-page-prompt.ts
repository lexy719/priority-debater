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

/**
 * Marketing-only brief: **no scores** in the prompt payload (avoids "4/10" launch pages).
 * Validation data is reframed as positioning themes, not audit results.
 */
export function buildMarketingBriefForLanding(validationContent: string): string {
  if (!validationContent?.trim()) {
    return "No validation report — infer **launch-ready** positioning from the product name and pitch only. Do not invent revenue, user counts, or ratings.";
  }

  const d = extractDashboardData(validationContent);
  const lines: string[] = [];

  lines.push("### POSITIONING INPUT (internal — **never** put scores, /10, GO/NO-GO, or 'validation audit' language on the public page)");
  lines.push("- Goal: a **ship-ready** marketing page for **this business’s customers**, similar in spirit to a polished SaaS homepage: short copy, strong hierarchy, mobile-friendly.");
  if (d.summary) lines.push(`- Product story (turn into benefits, not a report): ${truncate(d.summary, 850)}`);
  if (d.verdict) lines.push(`- Promotional angle (rephrase as a promise; do not quote verbatim): ${truncate(d.verdict, 350)}`);
  if (d.strengths.length) lines.push(`- Themes to emphasize (benefit headlines): ${d.strengths.slice(0, 6).join(" · ")}`);
  if (d.risks.length) lines.push(`- Buyer concerns to defuse in FAQ (positive, reassuring tone): ${d.risks.slice(0, 5).join(" · ")}`);
  if (d.recommendations.length) lines.push(`- Optional roadmap / waitlist ideas (no internal jargon): ${d.recommendations.slice(0, 6).join(" · ")}`);
  if (d.leanCanvas?.uvp) lines.push(`- Value proposition: ${truncate(d.leanCanvas.uvp, 480)}`);
  if (d.leanCanvas?.solution) lines.push(`- What the product does: ${truncate(d.leanCanvas.solution, 400)}`);
  if (d.leanCanvas?.problem) lines.push(`- Customer problem: ${truncate(d.leanCanvas.problem, 400)}`);
  if (d.targetCustomer) lines.push(`- Ideal customer: ${truncate(d.targetCustomer, 650)}`);
  if (d.valueProposition) lines.push(`- Messaging: ${truncate(d.valueProposition, 650)}`);
  if (d.problemSolution) lines.push(`- Narrative: ${truncate(d.problemSolution, 800)}`);
  if (d.businessModel) lines.push(`- How customers buy: ${truncate(d.businessModel, 550)}`);
  if (d.competitiveSummary) lines.push(`- Differentiation / market (no numeric scores): ${truncate(d.competitiveSummary, 550)}`);

  const { tam, sam, som } = d.tamSamSom;
  if (tam || sam || som) {
    lines.push(`- **Market sizing (OK to mention as context):** TAM ${tam ?? "—"} · SAM ${sam ?? "—"} · SOM ${som ?? "—"}`);
  }

  lines.push("");
  lines.push("**Hard rule:** The HTML must not contain viability scores, category scores, or anything that reads like an AI critique of the business.");

  return lines.join("\n");
}

export function landingPageSystemPrompt(): string {
  return `You are a principal designer + front-end engineer. You ship **download-ready** single-file HTML with **no build step**.

## What you are building

A **public launch page for the business** (the product in the brief) — **not** a validation dashboard, **not** Priority Debater’s results UI. It should look like something the founder could publish tomorrow: **short copy**, **pretty**, **responsive**, **confident**.

## Critical: do NOT embed the design-system CSS or JS

The application **automatically injects** the full \`lp-*\` CSS kit (responsive grids, mobile nav, animations) and **JavaScript** for nav + counters + spotlight. **Do not** paste full-page CSS or any \`<script>\`. You **may** include **one** small \`<style>\` with **only** \`:root { --lp-accent: …; --lp-accent-2: …; --lp-success: …; }\` — the injector preserves it.

## Responsive layout (mandatory)

- Every horizontal section uses \`.lp-container\` (max-width + side padding).
- **Hero split** \`.lp-hero__split\` stacks on small screens (kit handles breakpoints).
- **Tables / wide demos**: wrap in \`.lp-demo-table-wrap\` so horizontal scroll works on phones.
- **Grids** use \`.lp-grid\` / \`.lp-grid--2\` / \`.lp-grid--3\` — single column on mobile by default in the kit.
- Avoid tiny text walls; use \`.lp-section__lead\` sparingly (1–2 sentences).

## Visual patterns (pick what fits — **no internal scores**)

- **Hero demo (optional):** \`.lp-demo-shell\` + simple UI mock — columns like **Feature · Benefit** or product steps, **not** "Score" or "/10".
- **Trust row (optional):** 3 short value props (e.g. "Fast setup", "Works with your stack") — **not** animated validation counters unless they are **plain marketing numbers** (e.g. years of experience) that are not from the audit.
- **Editorial:** \`.lp-section-eyebrow\` + \`.lp-section__title\` + short lead.

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
   - **Badges:** use .lp-badge (e.g. "New", "Early access", audience) — **never** internal scores or "/10"
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
- **Never** show validation scores, /10, GO/NO-GO, or "AI validation" — this is a **customer** page for the business.
- Market sizing (TAM/SAM/SOM) from the brief is OK if present. Do not invent user counts, revenue, or awards.
- Testimonials: short, plausible ICP-style quotes only; no celebrities; no fake company names as logos unless generic

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
  const brief = buildMarketingBriefForLanding(validationContent);
  const { layoutVariant, layoutInstructions, images } = options;

  return `Build a **single ship-ready landing page** for **"${setup.topic}"** — the business customers would see, **not** an internal validation readout.

**Layout archetype (structure only — keep copy short):**
- id: \`${layoutVariant}\`
${layoutInstructions}

**Founder inputs**
- Working name/topic: "${setup.topic}"
- Pitch: ${setup.position}
- Extra: ${setup.context?.trim() || "(none)"}

**Positioning (use for messaging — do NOT surface as scores or audits):**
${brief}

${formatImagesBlock(images)}

**Design rules**
1. **Less text** than a typical generated page: punchy headlines, 1-line subheads, 3–5 bullets max per section where possible.
2. **Responsive:** use \`.lp-container\` everywhere; use kit grids; wrap wide tables in \`.lp-demo-table-wrap\`.
3. **Hero:** .lp-orbs or .lp-bg-mesh + .lp-noise on body if you want grain. Headline ≤10 words. **No** score badges. Optional hero visual: **stock image** (if URLs above) OR **.lp-demo-shell** with a **product-y** mock (features/benefits — not ratings).
4. **Sections (4–6 blocks):** Nav → Hero → Value/features → How it works OR social proof → FAQ (3–4 Qs, buyer-focused) → Final CTA → Footer. Skip "metric wall" unless it uses **non-score** labels (e.g. market context from brief, or generic "2-min setup" only if honest).
5. **Colors:** optional \`:root\` brand tint — match industry (tech indigo, health green, etc.).
6. **Premium:** .lp-glass on one card, .lp-card--lift on feature cards, .lp-spotlight on hero optional.

**Output:** complete HTML only — **no** full-page \`<style>\` or \`<script>\`**; the app injects the kit.`;
}
