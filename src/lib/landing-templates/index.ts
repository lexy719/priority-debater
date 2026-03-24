import type { LandingImageRef } from "@/lib/landing-images";
import { SAAS_NOVA_TEMPLATE } from "./saas-nova";
import type { LandingTemplateId } from "./types";
import { applyRawBlock, applyTemplateSlots, escapeAttr } from "./merge-slots";

export * from "./types";
export { applyTemplateSlots, applyRawBlock, escapeHtml, escapeAttr } from "./merge-slots";

export function getTemplateSource(id: LandingTemplateId): string | null {
  if (id === "saas-nova") return SAAS_NOVA_TEMPLATE;
  return null;
}

/** Hero column: real photo or gradient placeholder */
export function buildHeroVisualBlock(images: LandingImageRef[]): string {
  const img = images[0];
  if (!img) {
    return `<div class="hero-visual" aria-hidden="true"></div>`;
  }
  return `<div class="hero-visual">
    <img src="${escapeAttr(img.url)}" alt="${escapeAttr(img.suggestedAlt)}" width="640" height="400" loading="lazy">
    <p class="photo-credit">Photo by <a href="${escapeAttr(img.photographerUrl)}" rel="noopener noreferrer" target="_blank">${escapeAttr(img.photographer)}</a> on <a href="${escapeAttr(img.photoPageUrl)}" rel="noopener noreferrer" target="_blank">Unsplash</a></p>
  </div>`;
}

/**
 * Merge AI slot strings + server-only hero visual.
 * `slots` must be plain text; HTML is escaped. `%%RAW_HERO_VISUAL%%` is injected raw (from buildHeroVisualBlock only).
 */
export function mergeSaasNovaTemplate(
  slots: Record<string, string>,
  images: LandingImageRef[]
): string {
  let html = SAAS_NOVA_TEMPLATE;
  html = applyTemplateSlots(html, slots);
  return applyRawBlock(html, "HERO_VISUAL", buildHeroVisualBlock(images));
}
