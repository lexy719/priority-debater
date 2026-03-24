export type LandingTemplateId = "saas-nova" | "custom";

export const DEFAULT_LANDING_TEMPLATE: LandingTemplateId = "saas-nova";

export const LANDING_TEMPLATE_LABELS: Record<LandingTemplateId, { title: string; description: string }> = {
  "saas-nova": {
    title: "SaaS Nova",
    description: "Dark gradient hero, email card, problem & benefits — designer-made layout. AI writes the copy only.",
  },
  custom: {
    title: "Custom (AI layout)",
    description: "Full page built by AI from the component kit. More variety, less predictable polish.",
  },
};
