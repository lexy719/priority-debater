export type LandingTemplateId = "saas-nova" | "editorial-aurora" | "bento-prism" | "custom";

/** Curated designer templates (AI fills copy only). */
export type CuratedLandingTemplateId = Exclude<LandingTemplateId, "custom">;

export const CURATED_LANDING_TEMPLATE_IDS: CuratedLandingTemplateId[] = [
  "saas-nova",
  "editorial-aurora",
  "bento-prism",
];

export function isCuratedLandingTemplate(id: unknown): id is CuratedLandingTemplateId {
  return typeof id === "string" && (CURATED_LANDING_TEMPLATE_IDS as string[]).includes(id);
}

export const DEFAULT_LANDING_TEMPLATE: CuratedLandingTemplateId = "saas-nova";

export const LANDING_TEMPLATE_LABELS: Record<LandingTemplateId, { title: string; description: string }> = {
  "saas-nova": {
    title: "SaaS Nova",
    description: "Dark violet glow, floating email card, classic SaaS story arc — investor-ready polish.",
  },
  "editorial-aurora": {
    title: "Editorial Aurora",
    description: "Warm paper, serif headlines, magazine rhythm — premium B2B with a human voice.",
  },
  "bento-prism": {
    title: "Bento Prism",
    description: "Midnight glass, cyan–violet accents, asymmetric grid — feels like a top product launch.",
  },
  custom: {
    title: "Custom (AI layout)",
    description: "Full page built by AI from the component kit. Maximum variety, less predictable structure.",
  },
};
