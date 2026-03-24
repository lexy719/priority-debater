/**
 * Ensures generated landing HTML always includes the full lp-* design kit.
 * Models often omit or truncate embedded CSS — injection fixes "no styles" downloads/previews.
 */

import {
  LANDING_PAGE_SCRIPT_KIT,
  LANDING_PAGE_STYLE_KIT,
} from "@/lib/landing-page-design-kit";

const FONT_LINKS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet">`;

/** Pull optional :root { --lp-* } from model <style> before those blocks are removed. */
function extractBrandRoot(html: string): string {
  const blocks = html.match(/<style\b[^>]*>([\s\S]*?)<\/style>/gi);
  if (!blocks) return "";
  for (const block of blocks) {
    const inner = block.replace(/<\/?style\b[^>]*>/gi, "");
    const m = inner.match(/:root\s*\{[\s\S]*?\}/);
    if (m && /--lp-/.test(m[0])) return `${m[0].trim()}\n`;
  }
  return "";
}

function stripMarkdownFences(html: string): string {
  let h = html.trim();
  if (h.startsWith("```")) {
    h = h.replace(/^```(?:html)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
  }
  return h.trim();
}

/**
 * Inject fonts + full CSS kit + JS. Strips model <style>/<script> so partial kits never duplicate.
 */
export function injectLandingPageKit(html: string): string {
  let h = stripMarkdownFences(html);
  if (!h) return html;

  const brandRoot = extractBrandRoot(h);

  h = h.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
  h = h.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

  const kitCss = `<style id="lp-design-kit">\n${brandRoot}${LANDING_PAGE_STYLE_KIT}\n</style>`;
  const kitJs = `<script>\n${LANDING_PAGE_SCRIPT_KIT}\n</script>`;

  const hasHead = /<head[^>]*>/i.test(h);

  if (!hasHead) {
    if (/<html[^>]*>/i.test(h)) {
      h = h.replace(
        /<html([^>]*)>/i,
        `<html$1><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${FONT_LINKS}${kitCss}</head>`
      );
    } else {
      h = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${FONT_LINKS}${kitCss}</head><body>${h}</body></html>`;
    }
  } else {
    if (!/fonts\.googleapis\.com\/css2\?family=DM\+Sans/.test(h)) {
      h = h.replace(/<\/head>/i, `${FONT_LINKS}\n${kitCss}\n</head>`);
    } else {
      h = h.replace(/<\/head>/i, `${kitCss}\n</head>`);
    }
  }

  if (/<\/body>/i.test(h)) {
    h = h.replace(/<\/body>/i, `${kitJs}\n</body>`);
  } else {
    h += kitJs;
  }

  if (!/^<!DOCTYPE/i.test(h)) {
    h = `<!DOCTYPE html>\n${h}`;
  }

  if (!/name=["']viewport["']/i.test(h)) {
    h = h.replace(/<head([^>]*)>/i, '<head$1>\n<meta name="viewport" content="width=device-width, initial-scale=1">');
  }

  return h;
}
