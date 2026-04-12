import { defaultSaasNovaSlots } from "@/lib/landing-template-prompt";
import { FALLBACK_LANDING_IMAGES, type LandingImageRef } from "@/lib/landing-images";
import type { DebateSetup } from "@/lib/types";
import { mergeLandingTemplate } from "./merge-landing";
import type { CuratedLandingTemplateId } from "./types";

export type LandingTemplatePreviewOptions = {
  /** User's idea title — drives brand line + hero in previews */
  topic?: string;
  position?: string;
  /** From /api/landing-preview-images; if empty, same fallbacks as server merge */
  images?: LandingImageRef[];
};

/** When the pitch is short or still loading, blend in demo lines so the gallery never looks empty. */
const PREVIEW_FALLBACK_PITCH =
  "Teams lose hours to manual workflows and scattered tools. This product automates the painful steps with a fast setup, clear ROI, and integrations that fit stacks teams already run. Early users report measurable time savings in week one.";

/**
 * Gallery-only CSS. Templates use scroll-reveal (opacity:0 until JS adds .visible / .on / .vis);
 * in small sandboxed iframes that often misfires, previews looked like blank boxes.
 */
const GALLERY_PREVIEW_STYLE = `<style data-priority-debater-preview>
  .reveal,.reveal-scale,.rv{
    opacity:1!important;
    transform:none!important;
    transition:none!important;
  }
  .reveal.visible,.reveal-scale.visible,.rv.vis,.rv.on,.rv.visible{
    opacity:1!important;
  }
</style>`;

function truncate(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function injectGalleryPreviewMode(html: string): string {
  if (html.includes("</head>")) {
    return html.replace("</head>", `${GALLERY_PREVIEW_STYLE}</head>`);
  }
  return `${GALLERY_PREVIEW_STYLE}${html}`;
}

/**
 * Full HTML for a template card iframe. Uses the same slot keys as post-generation
 * (defaultSaasNovaSlots + topic/position). Gallery: enough copy for a full-looking hero,
 * and forced-visible sections so thumbnails match what users get after generation.
 */
export function getLandingTemplatePreviewHtml(
  id: CuratedLandingTemplateId,
  options?: LandingTemplatePreviewOptions
): string {
  const rawTopic = options?.topic?.trim() || "";
  const rawPosition = options?.position?.trim() || "";

  const topic = truncate(rawTopic || "Acme Workspace", 120);
  const position =
    rawPosition.length >= 80
      ? truncate(rawPosition, 500)
      : truncate(rawPosition ? `${rawPosition} ${PREVIEW_FALLBACK_PITCH}` : PREVIEW_FALLBACK_PITCH, 650);

  const setup: DebateSetup = {
    template: "validate",
    topic,
    position,
    context: "",
    lens: "investor",
  };

  const slots = defaultSaasNovaSlots(setup);

  const pool =
    options?.images && options.images.length > 0 ? options.images : FALLBACK_LANDING_IMAGES;

  const idxMap: Record<string, number> = {
    "saas-nova": 0,
    "editorial-aurora": 1,
    "bento-prism": 2,
    "startup-horizon": 3,
    "minimal-slate": 4,
  };
  const idx = idxMap[id] ?? 0;
  const img = pool[idx % pool.length];

  const merged = mergeLandingTemplate(id, slots, [img]);
  return injectGalleryPreviewMode(merged);
}
