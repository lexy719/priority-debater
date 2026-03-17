/**
 * Content moderation - intent-based, not keyword-only.
 * Philosophy: Allow debate/analysis. Block operational requests for harm.
 *
 * Layers:
 * 1. Sanitization - strip XSS/injection
 * 2. Intent classification - operational vs discussion
 * 3. Safety enforcement - block only when topic + intent align
 */

// Operational intent = user is asking for instructions, not debating
const OPERATIONAL_INTENT = [
  "how to",
  "how do i",
  "how can i",
  "where can i buy",
  "where to buy",
  "teach me how",
  "guide to",
  "best way to",
  "how can i make",
  "how can i get away with",
  "steps to",
  "instructions for",
  "help me",
  "show me how",
  "how do you make",
  "how to build",
  "how to get",
  "where to find",
  "how to start",
  "how to sell",
].map((p) => p.toLowerCase());

// Sensitive topics - only block when combined with operational intent
const SENSITIVE_TOPICS = [
  "drug trafficking",
  "drug dealing",
  "cocaine",
  "heroin",
  "meth",
  "sell drugs",
  "terrorism",
  "bomb",
  "weapon",
  "murder",
  "assassin",
  "hitman",
  "human trafficking",
  "child abuse",
  "child porn",
  "money laundering",
  "ransomware",
  "identity theft",
  "credit card fraud",
  "pyramid scheme",
  "insider trading",
  "blackmail",
  "extortion",
].map((t) => t.toLowerCase());

/** Does the text suggest the user wants instructions/how-to (operational)? */
export function hasOperationalIntent(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const lower = text.toLowerCase();
  return OPERATIONAL_INTENT.some((p) => lower.includes(p));
}

/** Does the text mention a sensitive topic? (for info/warning, not auto-block) */
export function hasSensitiveTopic(text: string): string | null {
  if (!text || typeof text !== "string") return null;
  const lower = text.toLowerCase();
  const found = SENSITIVE_TOPICS.find((t) => lower.includes(t));
  return found || null;
}

/**
 * Block only when: sensitive topic AND operational intent.
 * Discussion/debate ("Should X be punished?", "Is Y harmful?") → allowed.
 * Operational ("How do I do X?", "Where to buy Y?") → blocked.
 */
export function shouldBlock(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const topic = hasSensitiveTopic(text);
  const intent = hasOperationalIntent(text);
  return topic !== null && intent;
}

/** @deprecated Use shouldBlock for intent-aware moderation. Kept for migration. */
export function containsBlockedContent(text: string): boolean {
  return shouldBlock(text);
}

/** Strip potential XSS / prompt injection - remove dangerous patterns */
export function sanitizeForDisplay(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}
