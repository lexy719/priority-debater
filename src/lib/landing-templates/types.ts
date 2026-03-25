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

export const LANDING_TEMPLATE_LABELS: Record<LandingTemplateId, { title: string; description: string }> = {
  "saas-nova": {
    title: "SaaS Nova",
    description: "Dark aurora glow, animated orbs, gradient text, spotlight cards — investor-ready polish.",
  },
  "editorial-aurora": {
    title: "Editorial Aurora",
    description: "Warm paper, serif headlines, magazine rhythm — premium B2B with a human voice.",
  },
  "bento-prism": {
    title: "Bento Prism",
    description: "Midnight glass, cyan–violet mesh, scanning line, neon bento grid — product launch energy.",
  },
  "startup-horizon": {
    title: "Startup Horizon",
    description: "Bold rose-to-amber gradient, marquee ticker, staggered cards — hot startup vibes.",
  },
  "minimal-slate": {
    title: "Minimal Slate",
    description: "Ultra-clean monochrome, Swiss grid, sharp typography — Apple-level elegance.",
  },
  custom: {
    title: "Custom (AI layout)",
    description: "Full page built by AI from the component kit. Maximum variety, less predictable structure.",
  },
};
