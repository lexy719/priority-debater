import { defaultSaasNovaSlots } from "@/lib/landing-template-prompt";
import type { LandingImageRef } from "@/lib/landing-images";
import type { DebateSetup } from "@/lib/types";
import { mergeLandingTemplate } from "./merge-landing";
import type { CuratedLandingTemplateId } from "./types";

const PREVIEW_SETUP: DebateSetup = {
  template: "validate",
  topic: "Northbeam Analytics",
  position:
    "Real-time revenue attribution for PLG teams. Connect product events to pipeline in hours — without a data science team.",
  context: "",
  lens: "investor",
};

/** Curated Unsplash stills — stable URLs for iframe previews (attribution in-template). */
const PREVIEW_IMAGES: LandingImageRef[] = [
  {
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=85&auto=format&fit=crop",
    photoPageUrl: "https://unsplash.com/photos/team-collaboration",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
    suggestedAlt: "Team collaborating around a laptop",
  },
  {
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=85&auto=format&fit=crop",
    photoPageUrl: "https://unsplash.com/photos/modern-office",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
    suggestedAlt: "Sunlit workspace with desks and plants",
  },
  {
    url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=85&auto=format&fit=crop",
    photoPageUrl: "https://unsplash.com/photos/team-meeting",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
    suggestedAlt: "Team discussion at a conference table",
  },
];

const COPY_OVERRIDES: Partial<Record<string, string>> = {
  HERO_HEADLINE: "Know which motions actually close revenue.",
  HERO_SUB:
    "Northbeam stitches product signals to pipeline — so marketing proves impact and RevOps trusts the model.",
  PROBLEM_TITLE: "Attribution spreadsheets were never going to survive QBRs.",
  PROBLEM_BODY:
    "When every team exports their own version of truth, deals stall and budgets get cut. You need one narrative from signup to ARR.",
  PROBLEM_QUOTE:
    "We were fluent in MQLs but mute on what actually moved pipeline — until we wired the product story end-to-end.",
  BENEFITS_TITLE: "From activity metrics to revenue confidence",
  FEATURE1_TITLE: "Closed-loop reporting",
  FEATURE1_BODY: "See which campaigns and in-product moments precede closed-won — not just clicks.",
  FEATURE2_TITLE: "Hours to first insight",
  FEATURE2_BODY: "Connect your warehouse or CDP without a six-month services project.",
  FEATURE3_TITLE: "Board-ready clarity",
  FEATURE3_BODY: "Exports and dashboards your CFO can defend in five minutes.",
};

export function getLandingTemplatePreviewHtml(id: CuratedLandingTemplateId): string {
  const slots: Record<string, string> = {
    ...defaultSaasNovaSlots(PREVIEW_SETUP),
    ...(COPY_OVERRIDES as Record<string, string>),
  };
  const idx = id === "saas-nova" ? 0 : id === "editorial-aurora" ? 1 : 2;
  return mergeLandingTemplate(id, slots, [PREVIEW_IMAGES[idx]]);
}
