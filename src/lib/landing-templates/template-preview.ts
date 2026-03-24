import { defaultSaasNovaSlots } from "@/lib/landing-template-prompt";
import type { LandingImageRef } from "@/lib/landing-images";
import type { DebateSetup } from "@/lib/types";
import { mergeLandingTemplate } from "./merge-landing";
import type { CuratedLandingTemplateId } from "./types";

const BASE_PREVIEW_SETUP: DebateSetup = {
  template: "validate",
  topic: "Northbeam Analytics",
  position:
    "Real-time revenue attribution for PLG teams. Connect product events to pipeline in hours — without a data science team.",
  context: "",
  lens: "investor",
};

/** Fallback when Unsplash is off-line or API key missing — landscape-friendly stills. */
const PREVIEW_IMAGES: LandingImageRef[] = [
  {
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&q=85&auto=format&fit=crop",
    photoPageUrl: "https://unsplash.com",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
    suggestedAlt: "Team collaborating around a laptop",
  },
  {
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=85&auto=format&fit=crop",
    photoPageUrl: "https://unsplash.com",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
    suggestedAlt: "Modern workspace",
  },
  {
    url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&q=85&auto=format&fit=crop",
    photoPageUrl: "https://unsplash.com",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
    suggestedAlt: "Team meeting",
  },
];

export type LandingTemplatePreviewOptions = {
  /** User's idea title — drives brand line + hero in previews */
  topic?: string;
  position?: string;
  /** From /api/landing-preview-images; if empty/missing, PREVIEW_IMAGES is used */
  images?: LandingImageRef[];
};

function truncate(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/** Marketing preview copy tied to the user's topic — no fake company-specific metrics. */
function buildTopicPreviewOverrides(topic: string, position: string): Record<string, string> {
  const brand = truncate(topic, 56) || "Your product";
  const pitch = position.trim().length >= 24 ? truncate(position, 220) : "";

  return {
    BRAND_NAME: brand,
    HERO_HEADLINE: `Position ${brand} so buyers get it in one scroll.`,
    HERO_SUB: pitch || `A launch-ready page for ${brand}, written from your pitch and validation — not boilerplate.`,
    PROBLEM_TITLE: "Buyers bounce when the story is fuzzy",
    PROBLEM_BODY:
      "Generic landing copy wastes the hard work you already did validating the idea. This template keeps structure tight while we rewrite every line for your market.",
    PROBLEM_QUOTE: `"We finally had clarity on the idea — the page should show that same clarity."`,
    BENEFITS_TITLE: "What this layout is built to do",
    FEATURE1_TITLE: "Above-the-fold clarity",
    FEATURE1_BODY: "Hero, proof, and CTA tuned for skimmers on any device.",
    FEATURE2_TITLE: "Sections that convert",
    FEATURE2_BODY: "Problem, value, how it works, FAQ — in an order that supports decisions.",
    FEATURE3_TITLE: "Ready to host",
    FEATURE3_BODY: "Single HTML file: drop on any static host or tweak in your stack.",
    HOW_STEP1_BODY: "Pick the template that fits your brand voice.",
    HOW_STEP2_BODY: "We generate copy from your idea and validation report.",
    HOW_STEP3_BODY: "Download, recolor if you like, and publish.",
    FAQ1_A: "Yes — you get one self-contained HTML file with embedded CSS.",
    FAQ2_A: "We pull themes from your validation so the story matches what you learned.",
    FAQ3_A: "Use the generator again after you iterate on the idea.",
    CTA_FINAL_TITLE: `Put ${brand} in front of customers`,
    CTA_FINAL_SUB: "Generate once, refine forever.",
    FOOTER_LINE: `© ${new Date().getFullYear()} ${brand}. Preview uses sample structure.`,
  };
}

/** Narrow viewport so template CSS hits mobile breakpoints inside the gallery iframe. */
function forceMobileViewport(html: string): string {
  return html.replace(
    /<meta\s+name="viewport"\s+content="[^"]*"\s*\/?>/i,
    '<meta name="viewport" content="width=390, initial-scale=1, viewport-fit=cover">'
  );
}

/**
 * Full HTML for a template card iframe. Uses topic-based slots + optional Unsplash pool.
 */
export function getLandingTemplatePreviewHtml(
  id: CuratedLandingTemplateId,
  options?: LandingTemplatePreviewOptions
): string {
  const topic = options?.topic?.trim() || BASE_PREVIEW_SETUP.topic;
  const position = options?.position?.trim() || BASE_PREVIEW_SETUP.position;

  const setup: DebateSetup = {
    ...BASE_PREVIEW_SETUP,
    topic: truncate(topic, 120),
    position: truncate(position, 500),
  };

  const slots: Record<string, string> = {
    ...defaultSaasNovaSlots(setup),
    ...buildTopicPreviewOverrides(truncate(topic, 120), truncate(position, 500)),
  };

  const pool =
    options?.images && options.images.length > 0 ? options.images : PREVIEW_IMAGES;

  const idx = id === "saas-nova" ? 0 : id === "editorial-aurora" ? 1 : 2;
  const img = pool[idx % pool.length];

  let html = mergeLandingTemplate(id, slots, [img]);
  html = forceMobileViewport(html);
  return html;
}
