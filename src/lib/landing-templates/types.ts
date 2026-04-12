export type LandingTemplateId = "saas-nova" | "editorial-aurora" | "bento-prism" | "startup-horizon" | "minimal-slate" | "custom";

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
    title: "SaaS Nova",
    layout: "Dark mesh hero + gradient frame visual · glass bento features · FAQ · gradient email CTA",
    description:
      "Obsidian / indigo product UI: Syne headlines, glass cards, cyan–violet glow. Strong default for B2B SaaS.",
  },
  "editorial-aurora": {
    title: "Editorial Aurora",
    layout: "Magazine headline + full-bleed image band · split problem · numbered steps · serif FAQ",
    description:
      "Warm paper, Playfair + DM Sans, amber accent. Premium editorial and service brands.",
  },
  "bento-prism": {
    title: "Bento Prism",
    layout: "Neon bento (hero image + copy + 3 cells) · problem · steps · benefits bridge · FAQ · glow CTA",
    description:
      "Dark lattice, JetBrains tags, cyan–magenta glass. Devtools, AI, and high-tech launches.",
  },
  "startup-horizon": {
    title: "Startup Horizon",
    layout: "Sunrise gradient hero + card visual · scrolling marquee · 3-up features · dark CTA",
    description:
      "Coral–rose–amber energy, Jakarta Sans, ticker of benefits. Consumer apps and bold startups.",
  },
  "minimal-slate": {
    title: "Minimal Slate",
    layout: "Swiss grid hero + framed image · rules-only sections · 3-column features · minimal CTA",
    description:
      "Near-monochrome Inter, thin borders, maximum whitespace. Design-led and prosumer products.",
  },
  custom: {
    title: "Custom (AI layout)",
    layout: "Varies each run — chosen from the shared HTML kit (nav, hero, sections, CTA)",
    description:
      "Full page generated from your validation brief. More variety, less predictable structure than fixed templates.",
  },
};
