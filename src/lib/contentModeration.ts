/**
 * Content moderation - intent-based + policy walls for this product (business ideas only).
 *
 * Layers:
 * 1. Sanitization - strip XSS/injection
 * 2. Intent classification - operational vs discussion (illegal harm)
 * 3. Zero-tolerance terms (CSAM signals, explicit adult content solicitation)
 * 4. Minimum quality - empty / gibberish / spam patterns
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

/** User-facing message when policy blocks content (keep generic; no details that teach evasion). */
export const CONTENT_POLICY_ERROR =
  "This content isn't allowed. Priority Debater is for legitimate business ideas and professional debate only.";

export const INPUT_QUALITY_ERROR =
  "Please describe a real idea with enough detail to analyze (not empty text, placeholders, or random characters).";

// --- Word / quality helpers ---

function countWords(text: string): number {
  if (!text?.trim()) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => /[a-zA-Z0-9]{2,}/.test(w)).length;
}

/** Same line repeated many times, keyboard mashing, or extremely low entropy */
export function isLikelyGibberishOrSpam(text: string): boolean {
  const t = text.trim();
  if (t.length < 8) return false;
  const letters = t.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 6) return false;
  const uniq = new Set(letters.toLowerCase()).size;
  if (uniq <= 2 && letters.length > 20) return true;
  const words = t.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length >= 4) {
    const freq = new Map<string, number>();
    for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
    const max = Math.max(...freq.values());
    if (max / words.length >= 0.75 && words.length >= 6) return true;
  }
  if (/^(.)\1{14,}$/i.test(t.replace(/\s/g, ""))) return true;
  const spammy = /^(test|asdf|lol|ok|hi|hello|foo|bar|abc|xyz|aaa)(\s+\1){5,}$/i;
  if (spammy.test(t)) return true;
  return false;
}

/**
 * Non-exhaustive blocklist for explicit adult / pornographic intent (product is SFW-only).
 * Uses word boundaries; avoids short substrings inside legitimate words where possible.
 */
const EXPLICIT_ADULT_PATTERNS: RegExp[] = [
  /\b(porn|porno|pornography|pornhub|xvideos|xhamster|redtube|onlyfans)\b/i,
  /\b(nsfw|hentai|rule\s*34)\b/i,
  /\b(nude|nudes|naked)\s+(pic|pics|photo|photos|selfie|video|chat)\b/i,
  /\b(send|trade|share)\s+(nudes?|naked)\b/i,
  /\b(sex\s*chat|cybersex|sexting)\b/i,
  /\b(blow\s*job|hand\s*job|cum\s*shot|deep\s*throat)\b/i,
  /\b(orgy|gangbang|bukkake)\b/i,
  /\b(milf|dildo|vibrator|fuck\s*me|fuck\s*you)\b/i,
  /\b(erotic\s*massage|happy\s*ending)\b/i,
];

/** Zero-tolerance signals (not dependent on “how to” intent). */
const ZERO_TOLERANCE_PATTERNS: RegExp[] = [
  /\b(child\s*porn|childporn|cp\s*link|preteen\s*sex|jailbait\s*porn)\b/i,
  /\b(kid\s*sex|minor\s*sex|underage\s*nude)\b/i,
];

export function containsZeroToleranceContent(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  return ZERO_TOLERANCE_PATTERNS.some((re) => re.test(text));
}

export function containsDisallowedAdultContent(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  return EXPLICIT_ADULT_PATTERNS.some((re) => re.test(text));
}

/**
 * Full policy check for user-provided text (ideas, messages, pasted reports).
 * Use on the server for every relevant field; optionally mirror on the client for UX.
 */
export function isContentPolicyViolation(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  if (containsZeroToleranceContent(text)) return true;
  if (containsDisallowedAdultContent(text)) return true;
  if (shouldBlock(text)) return true;
  return false;
}

export type StartupTemplateField = { topic: string; position: string; context: string; template: string };

/**
 * Validates minimum substance for validate vs generate flows. Returns an error message or null.
 */
export function validateStartupIdeaFields(fields: StartupTemplateField): string | null {
  const topic = fields.topic.trim();
  const position = fields.position.trim();
  const context = fields.context.trim();

  if (fields.template === "generate") {
    if (position.length < 28) return INPUT_QUALITY_ERROR;
    if (countWords(position) < 8) return INPUT_QUALITY_ERROR;
    if (isLikelyGibberishOrSpam(position)) return INPUT_QUALITY_ERROR;
    return null;
  }

  if (topic.length < 8) return INPUT_QUALITY_ERROR;
  if (countWords(topic) < 2) return INPUT_QUALITY_ERROR;
  if (position.length < 40) return INPUT_QUALITY_ERROR;
  if (countWords(position) < 10) return INPUT_QUALITY_ERROR;
  if (isLikelyGibberishOrSpam(topic) || isLikelyGibberishOrSpam(position)) return INPUT_QUALITY_ERROR;
  return null;
}

/**
 * One-sentence guided journey entry (Step 0). Looser than full validate, still blocks noise.
 */
export function validateGuidedJourneyIdea(text: string): string | null {
  const t = text.trim();
  if (t.length < 12) return INPUT_QUALITY_ERROR;
  if (countWords(t) < 3) return INPUT_QUALITY_ERROR;
  if (isLikelyGibberishOrSpam(t)) return INPUT_QUALITY_ERROR;
  return null;
}

/**
 * Single chat line from the debate UI (not quick-action placeholders).
 */
export function validateDebateUserMessage(text: string): string | null {
  const t = text.trim();
  if (t.length < 2) return "Message is too short.";
  if (t.startsWith("[") && t.includes("]")) {
    // UI-generated system lines like [Steelman] — allowed if short
    if (t.length <= 120) return null;
  }
  if (isContentPolicyViolation(t)) return CONTENT_POLICY_ERROR;
  if (t.length >= 12 && isLikelyGibberishOrSpam(t)) return INPUT_QUALITY_ERROR;
  return null;
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

/** @deprecated Use isContentPolicyViolation for full checks. */
export function containsBlockedContent(text: string): boolean {
  return isContentPolicyViolation(text);
}

/** Strip potential XSS / prompt injection - remove dangerous patterns */
export function sanitizeForDisplay(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}
