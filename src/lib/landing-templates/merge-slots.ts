/** Escape text for safe HTML text nodes */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape for HTML attribute (e.g. img src is set separately — use for alt, etc.) */
export function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/\n/g, " ");
}

/**
 * Replace %%KEY%% in template with escaped values from record.
 * Unknown keys in template left unchanged; missing keys → empty string.
 */
export function applyTemplateSlots(template: string, slots: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(slots)) {
    const re = new RegExp(`%%${key}%%`, "g");
    out = out.replace(re, escapeHtml(value ?? ""));
  }
  return out;
}

/** Replace raw blocks (pre-escaped HTML from server only — never user/AI raw HTML) */
export function applyRawBlock(template: string, key: string, rawHtml: string): string {
  return template.replace(new RegExp(`%%RAW_${key}%%`, "g"), rawHtml);
}
