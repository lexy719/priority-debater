export type LandingTemplateId =
  | "saas-nova"
  | "editorial-aurora"
  | "bento-prism"
  | "startup-horizon"
  | "minimal-slate"
  | "custom";

/** Curated designer templates (AI fills copy only). */
export type CuratedLandingTemplateId = Exclude<LandingTemplateId, "custom">;

export const CURATED_LANDING_TEMPLATE_IDS: CuratedLandingTemplateId[] = [
  "saas-nova",
  "editorial-aurora",
  "bento-prism",
  "startup-horizon",
  "minimal-slate",
];

export function isCuratedLandingTemplate(id: unknown): id is CuratedLandingTemplateId {
  return typeof id === "string" && (CURATED_LANDING_TEMPLATE_IDS as string[]).includes(id);
}

export const DEFAULT_LANDING_TEMPLATE: CuratedLandingTemplateId = "saas-nova";

export const LANDING_TEMPLATE_LABELS: Record<
  LandingTemplateId,
  { title: string; description: string; layout: string }
> = {
  "saas-nova": {
    title: "Signal Deck",
    layout: "Dark command hero + dashboard visual + premium bento sections + analyst-style FAQ + email CTA",
    description:
      "A high-end product launch system with dense cards, metrics, and polished enterprise energy. Best for B2B SaaS and AI tools.",
  },
  "editorial-aurora": {
    title: "Ledger",
    layout: "Editorial split hero + image narrative band + side-note storytelling + serif FAQ + warm CTA",
    description:
      "An investor-letter meets magazine-cover landing page with quieter luxury and stronger reading rhythm. Great for premium brands and services.",
  },
  "bento-prism": {
    title: "Command Grid",
    layout: "Devtool shell hero + neon bento grid + metric rail + command-style sections + glow CTA",
    description:
      "A sharper technical design language with console chrome, dense system cards, and strong motion cues. Built for devtools, AI, and ambitious launches.",
  },
  "startup-horizon": {
    title: "Momentum",
    layout: "Layered launch hero + ticker proof band + startup narrative sections + bold dark CTA",
    description:
      "A modern launch page with more optimism, more proof, and cleaner conversion framing. Strong for consumer apps and story-led startup positioning.",
  },
  "minimal-slate": {
    title: "Frame",
    layout: "Swiss editorial grid + framed visual + precision feature rails + restrained conversion CTA",
    description:
      "A restrained premium system with tighter composition and design-led clarity. Best when we want confidence without noise.",
  },
  custom: {
    title: "Custom (AI layout)",
    layout: "Varies each run - chosen from the shared HTML kit (nav, hero, sections, CTA)",
    description:
      "Full page generated from your validation brief. More variety, less predictable structure than fixed templates.",
  },
};
