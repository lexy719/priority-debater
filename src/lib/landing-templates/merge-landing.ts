import type { LandingImageRef } from "@/lib/landing-images";
import { BENTO_PRISM_TEMPLATE } from "./bento-prism";
import { EDITORIAL_AURORA_TEMPLATE } from "./editorial-aurora";
import { MINIMAL_SLATE_TEMPLATE } from "./minimal-slate";
import { SAAS_NOVA_TEMPLATE } from "./saas-nova";
import { STARTUP_HORIZON_TEMPLATE } from "./startup-horizon";
import type { CuratedLandingTemplateId, LandingTemplateId } from "./types";
import { applyRawBlock, applyTemplateSlots, escapeAttr } from "./merge-slots";

export function getTemplateSource(id: LandingTemplateId): string | null {
  switch (id) {
    case "saas-nova":
      return SAAS_NOVA_TEMPLATE;
    
    case "editorial-aurora":
      return EDITORIAL_AURORA_TEMPLATE;
    case "bento-prism":
      return BENTO_PRISM_TEMPLATE;
    case "startup-horizon":
      return STARTUP_HORIZON_TEMPLATE;
    case "minimal-slate":
      return MINIMAL_SLATE_TEMPLATE;
    default:
      return null;
  }
}

/** Hero column: real photo or gradient placeholder — uses best match (first = Unsplash relevance order) */
export function buildHeroVisualBlock(images: LandingImageRef[]): string {
  if (!images.length) {
    return `<div class="hero-visual" aria-hidden="true"></div>`;
  }
  const img = images[0];
  return `<div class="hero-visual">
    <img src="${escapeAttr(img.url)}" alt="${escapeAttr(img.suggestedAlt)}" width="640" height="400" loading="lazy">
    <p class="photo-credit">Photo by <a href="${escapeAttr(img.photographerUrl)}" rel="noopener noreferrer" target="_blank">${escapeAttr(img.photographer)}</a> on <a href="${escapeAttr(img.photoPageUrl)}" rel="noopener noreferrer" target="_blank">Unsplash</a></p>
  </div>`;
}

/**
 * Merge AI slot strings + server-only hero visual.
 * `slots` must be plain text; HTML is escaped. `%%RAW_HERO_VISUAL%%` is injected raw (from buildHeroVisualBlock only).
 */
export function mergeLandingTemplate(
  id: CuratedLandingTemplateId,
  slots: Record<string, string>,
  images: LandingImageRef[]
): string {
  const src = getTemplateSource(id);
  if (!src) throw new Error(`Unknown curated template: ${id}`);
  const html = applyTemplateSlots(src, slots);
  return applyRawBlock(html, "HERO_VISUAL", buildHeroVisualBlock(images));
}

/** @deprecated Use mergeLandingTemplate("saas-nova", ...) */
export function mergeSaasNovaTemplate(
  slots: Record<string, string>,
  images: LandingImageRef[]
): string {
  return mergeLandingTemplate("saas-nova", slots, images);
}
