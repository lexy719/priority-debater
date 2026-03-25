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

function truncate(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/**
 * Full HTML for a template card iframe. Uses the same default slot shape as post-generation
 * (defaultSaasNovaSlots + user's topic/position) — no separate "marketing" copy that misleads.
 * Gallery iframe uses a wide layout width so templates render at desktop breakpoints (template meta is width=device-width).
 */
export function getLandingTemplatePreviewHtml(
  id: CuratedLandingTemplateId,
  options?: LandingTemplatePreviewOptions
): string {
  const topic = truncate(options?.topic?.trim() || "Your product", 120);
  const position = truncate(options?.position?.trim() || "", 500);

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

  const idxMap: Record<string, number> = { "saas-nova": 0, "editorial-aurora": 1, "bento-prism": 2, "startup-horizon": 3, "minimal-slate": 4 };
  const idx = idxMap[id] ?? 0;
  const img = pool[idx % pool.length];

  return mergeLandingTemplate(id, slots, [img]);
}
