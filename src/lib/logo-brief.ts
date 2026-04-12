/**
 * Structured logo preferences: drives composed image prompts and logo-brand-kit API context.
 */

export const LOGO_MARK_TYPES = [
  { id: "wordmark", label: "Wordmark", hint: "Name as the hero; type-driven recognition." },
  { id: "lettermark", label: "Lettermark / monogram", hint: "1–2 letters, highly compact mark." },
  { id: "pictorial", label: "Pictorial symbol", hint: "Recognizable object or metaphor (still simple)." },
  { id: "abstract", label: "Abstract symbol", hint: "Non-literal shape; distinctive silhouette." },
  { id: "combination", label: "Symbol + wordmark", hint: "Icon paired with name; clear hierarchy." },
  { id: "emblem", label: "Emblem / badge", hint: "Contained mark; stamp or seal energy." },
] as const;

export const LOGO_VISUAL_STYLES = [
  { id: "ultra-minimal", label: "Ultra-minimal", hint: "Few strokes; maximum restraint." },
  { id: "geometric", label: "Geometric precision", hint: "Grids, circles, crisp angles." },
  { id: "organic", label: "Organic / fluid", hint: "Softer curves; human, natural motion." },
  { id: "retro", label: "Retro / heritage", hint: "Classic craft cues without pastiche." },
  { id: "luxury", label: "Luxury / refined", hint: "Restraint, premium negative space." },
  { id: "playful", label: "Playful / friendly", hint: "Approachable; rounded or witty forms." },
  { id: "tech-bold", label: "Bold tech", hint: "Confident, digital-native, high clarity." },
  { id: "editorial", label: "Editorial", hint: "Magazine or word-led sophistication." },
] as const;

export const LOGO_COLOR_STRATEGIES = [
  { id: "monochrome", label: "Monochrome", hint: "Single ink + background discipline." },
  { id: "duotone", label: "Duotone", hint: "Two colors only; clear hierarchy." },
  { id: "triad", label: "Tight triad", hint: "Three controlled colors + neutrals." },
  { id: "muted", label: "Muted / earthy", hint: "Low saturation; trustworthy, calm." },
  { id: "high-contrast", label: "High contrast", hint: "Punchy pairings; screen-first pop." },
  { id: "dark-mode-first", label: "Dark-ui first", hint: "Optimized for charcoal backgrounds." },
] as const;

export const LOGO_TYPE_FEELS = [
  { id: "geo-sans", label: "Geometric sans", hint: "Clean, Swiss-leaning UI type feel." },
  { id: "humanist-sans", label: "Humanist sans", hint: "Warm, readable, friendly." },
  { id: "serif-authority", label: "Serif authority", hint: "Editorial or institutional trust." },
  { id: "display", label: "Expressive display", hint: "Characterful headline lettering." },
  { id: "mono-tech", label: "Monospace tech", hint: "Developer, data, tooling aesthetic." },
] as const;

export const LOGO_PERSONALITIES = [
  { id: "trustworthy", label: "Trustworthy & calm", hint: "Banks, health, compliance-adjacent." },
  { id: "innovative", label: "Innovative & daring", hint: "Startup velocity; thoughtful risk." },
  { id: "warm", label: "Warm & human", hint: "Services, community, care." },
  { id: "premium", label: "Premium & exclusive", hint: "High-touch, scarcity, craft." },
  { id: "accessible", label: "Mass accessible", hint: "Broad appeal; no intimidation." },
] as const;

export const LOGO_USAGE_PRIORITIES = [
  { id: "favicon", label: "Favicon & app icon", hint: "Must read at 16–32px." },
  { id: "social", label: "Social avatar", hint: "Rounded crop; thumb-stopping clarity." },
  { id: "print", label: "Print & packaging", hint: "Single-color reproduction matters." },
  { id: "deck", label: "Slides & site hero", hint: "Wide layouts; large lockups." },
] as const;

export const LOGO_DETAIL_LEVELS = [
  { id: "simple", label: "Dead simple", hint: "Icon almost abstract; zero ornament." },
  { id: "balanced", label: "Balanced", hint: "One clear idea + subtle detail." },
  { id: "rich", label: "Rich (not busy)", hint: "Layered but still scannable small." },
] as const;

/** Multi-select: what “good logo” means for this project */
export const LOGO_MUST_HAVES = [
  { id: "silhouette", label: "Clear silhouette", hint: "Readable as a blob test." },
  { id: "legible-small", label: "Legible tiny", hint: "Works in tab bars and favicons." },
  { id: "metaphor", label: "Memorable metaphor", hint: "One story in the shape." },
  { id: "negative-space", label: "Clever negative space", hint: "Optional hidden form (if natural)." },
  { id: "timeless", label: "Timeless over trendy", hint: "Avoid of-the-moment gimmicks." },
  { id: "category-fit", label: "Category appropriate", hint: "Signals industry without cliché." },
  { id: "distinctive", label: "Distinctive vs generic", hint: "Avoid forgettable SaaS tropes." },
  { id: "dark-light", label: "Works on light & dark", hint: "Flexible placement." },
] as const;

export const LOGO_AVOID = [
  { id: "photoreal", label: "No photorealism", hint: "Vector / flat only." },
  { id: "mesh-gradients", label: "No mesh blobs", hint: "Unless brief explicitly wants them." },
  { id: "globe-arrows", label: "No stock globe / arrows", hint: "Skip lazy category icons." },
  { id: "thin-lines", label: "No hairline strokes", hint: "Keeps reproduction safe." },
  { id: "busy", label: "No clutter", hint: "One focal idea only." },
  { id: "long-tagline", label: "No long tagline in mark", hint: "Words only if wordmark." },
] as const;

export type LogoBrief = {
  markType: (typeof LOGO_MARK_TYPES)[number]["id"];
  visualStyle: (typeof LOGO_VISUAL_STYLES)[number]["id"];
  colorStrategy: (typeof LOGO_COLOR_STRATEGIES)[number]["id"];
  typeFeel: (typeof LOGO_TYPE_FEELS)[number]["id"];
  personality: (typeof LOGO_PERSONALITIES)[number]["id"];
  usagePriority: (typeof LOGO_USAGE_PRIORITIES)[number]["id"];
  detailLevel: (typeof LOGO_DETAIL_LEVELS)[number]["id"];
  mustHaves: Array<(typeof LOGO_MUST_HAVES)[number]["id"]>;
  avoid: Array<(typeof LOGO_AVOID)[number]["id"]>;
};

export const DEFAULT_LOGO_BRIEF: LogoBrief = {
  markType: "combination",
  visualStyle: "ultra-minimal",
  colorStrategy: "duotone",
  typeFeel: "geo-sans",
  personality: "innovative",
  usagePriority: "favicon",
  detailLevel: "balanced",
  mustHaves: ["silhouette", "legible-small", "distinctive", "dark-light"],
  avoid: ["photoreal", "mesh-gradients", "busy"],
};

const ID = {
  markType: new Set(LOGO_MARK_TYPES.map((x) => x.id)),
  visualStyle: new Set(LOGO_VISUAL_STYLES.map((x) => x.id)),
  colorStrategy: new Set(LOGO_COLOR_STRATEGIES.map((x) => x.id)),
  typeFeel: new Set(LOGO_TYPE_FEELS.map((x) => x.id)),
  personality: new Set(LOGO_PERSONALITIES.map((x) => x.id)),
  usagePriority: new Set(LOGO_USAGE_PRIORITIES.map((x) => x.id)),
  detailLevel: new Set(LOGO_DETAIL_LEVELS.map((x) => x.id)),
  mustHaves: new Set(LOGO_MUST_HAVES.map((x) => x.id)),
  avoid: new Set(LOGO_AVOID.map((x) => x.id)),
} as const;

function pick<T extends string>(
  set: Set<string>,
  val: unknown,
  fallback: T,
): T {
  if (typeof val === "string" && set.has(val)) return val as T;
  return fallback;
}

function pickMany<T extends string>(set: Set<string>, arr: unknown, max: number, fallback: T[]): T[] {
  if (!Array.isArray(arr)) return fallback;
  const out: T[] = [];
  for (const x of arr) {
    if (typeof x === "string" && set.has(x) && !out.includes(x as T)) out.push(x as T);
    if (out.length >= max) break;
  }
  if (out.length === 0) return fallback;
  return out;
}

/** Parse untrusted JSON into a safe LogoBrief (for API body). */
export function sanitizeLogoBrief(raw: unknown): LogoBrief | undefined {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  return {
    markType: pick(ID.markType, o.markType, DEFAULT_LOGO_BRIEF.markType),
    visualStyle: pick(ID.visualStyle, o.visualStyle, DEFAULT_LOGO_BRIEF.visualStyle),
    colorStrategy: pick(ID.colorStrategy, o.colorStrategy, DEFAULT_LOGO_BRIEF.colorStrategy),
    typeFeel: pick(ID.typeFeel, o.typeFeel, DEFAULT_LOGO_BRIEF.typeFeel),
    personality: pick(ID.personality, o.personality, DEFAULT_LOGO_BRIEF.personality),
    usagePriority: pick(ID.usagePriority, o.usagePriority, DEFAULT_LOGO_BRIEF.usagePriority),
    detailLevel: pick(ID.detailLevel, o.detailLevel, DEFAULT_LOGO_BRIEF.detailLevel),
    mustHaves: pickMany(ID.mustHaves, o.mustHaves, 8, DEFAULT_LOGO_BRIEF.mustHaves),
    avoid: pickMany(ID.avoid, o.avoid, 8, DEFAULT_LOGO_BRIEF.avoid),
  };
}

function label<T extends { id: string; label: string }>(list: readonly T[], id: string): string {
  return list.find((x) => x.id === id)?.label ?? id;
}

/** Human-readable block for `/api/debate` logo-brand-kit. */
export function formatLogoBriefForKitPrompt(b: LogoBrief): string {
  const mustLabels = b.mustHaves.map((id) => label(LOGO_MUST_HAVES, id)).join(", ");
  const avoidLabels = b.avoid.map((id) => label(LOGO_AVOID, id)).join(", ");
  return `
**Founder's logo & identity preferences (MUST honor in every concept and image prompt):**
- **Mark structure:** ${label(LOGO_MARK_TYPES, b.markType)} — ${LOGO_MARK_TYPES.find((x) => x.id === b.markType)?.hint ?? ""}
- **Visual style:** ${label(LOGO_VISUAL_STYLES, b.visualStyle)} — ${LOGO_VISUAL_STYLES.find((x) => x.id === b.visualStyle)?.hint ?? ""}
- **Color strategy:** ${label(LOGO_COLOR_STRATEGIES, b.colorStrategy)} — ${LOGO_COLOR_STRATEGIES.find((x) => x.id === b.colorStrategy)?.hint ?? ""}
- **Typography feel:** ${label(LOGO_TYPE_FEELS, b.typeFeel)} — ${LOGO_TYPE_FEELS.find((x) => x.id === b.typeFeel)?.hint ?? ""}
- **Brand personality:** ${label(LOGO_PERSONALITIES, b.personality)} — ${LOGO_PERSONALITIES.find((x) => x.id === b.personality)?.hint ?? ""}
- **Primary usage:** ${label(LOGO_USAGE_PRIORITIES, b.usagePriority)} — ${LOGO_USAGE_PRIORITIES.find((x) => x.id === b.usagePriority)?.hint ?? ""}
- **Detail level:** ${label(LOGO_DETAIL_LEVELS, b.detailLevel)} — ${LOGO_DETAIL_LEVELS.find((x) => x.id === b.detailLevel)?.hint ?? ""}
- **Quality bar (must-haves):** ${mustLabels}
- **Explicit avoid:** ${avoidLabels}

When writing **Image-generation prompt** lines, fold these choices into concrete art direction (camera words, materials, lighting) — not generic adjectives alone.
`.trim();
}

/** Single composed prompt for DALL·E (logo only). */
export function buildLogoImagePrompt(
  topic: string,
  position: string,
  brief: LogoBrief,
  extraNotes: string,
): string {
  const pos = position.trim();
  const posShort = pos.length > 500 ? `${pos.slice(0, 497)}…` : pos;
  const must = brief.mustHaves.map((id) => LOGO_MUST_HAVES.find((x) => x.id === id)?.label ?? id);
  const avoid = brief.avoid.map((id) => LOGO_AVOID.find((x) => x.id === id)?.label ?? id);

  const lines = [
    `Professional logo design for "${topic}".`,
    posShort ? `Business context: ${posShort}` : null,
    ``,
    `LOCKUPS & STRUCTURE: ${label(LOGO_MARK_TYPES, brief.markType)}. ${LOGO_MARK_TYPES.find((x) => x.id === brief.markType)?.hint}`,
    `VISUAL LANGUAGE: ${label(LOGO_VISUAL_STYLES, brief.visualStyle)} — ${LOGO_VISUAL_STYLES.find((x) => x.id === brief.visualStyle)?.hint}`,
    `COLOR: ${label(LOGO_COLOR_STRATEGIES, brief.colorStrategy)} — ${LOGO_COLOR_STRATEGIES.find((x) => x.id === brief.colorStrategy)?.hint}`,
    `TYPE FEEL (if letters appear): ${label(LOGO_TYPE_FEELS, brief.typeFeel)} — ${LOGO_TYPE_FEELS.find((x) => x.id === brief.typeFeel)?.hint}`,
    `PERSONALITY: ${label(LOGO_PERSONALITIES, brief.personality)}.`,
    `PRIMARY CONSTRAINT: ${label(LOGO_USAGE_PRIORITIES, brief.usagePriority)} — ${LOGO_USAGE_PRIORITIES.find((x) => x.id === brief.usagePriority)?.hint}`,
    `COMPLEXITY: ${label(LOGO_DETAIL_LEVELS, brief.detailLevel)}.`,
    ``,
    `MUST achieve: ${must.join("; ")}.`,
    `DO NOT: ${avoid.join("; ")}.`,
    ``,
    `Output: flat vector-style logo artwork, centered, plenty of padding, clean edges, suitable for PNG export. No mockups, no business cards, no watermarks, no UI chrome.`,
    extraNotes.trim() ? `Additional direction from founder: ${extraNotes.trim()}` : null,
  ];

  return lines.filter(Boolean).join("\n");
}

// ---------------------------------------------------------------------------
// Concept variants — differentiated prompts for multi-generation
// ---------------------------------------------------------------------------

const VARIANT_DIRECTIONS: Record<
  number,
  { label: string; styleBias: string }
> = {
  0: {
    label: "Faithful",
    styleBias:
      "Stay close to the brief. Clean, expected, professional execution. Straightforward metaphor that communicates instantly.",
  },
  1: {
    label: "Conservative / Classic",
    styleBias:
      "Lean toward timeless, heritage-inspired restraint. Favor symmetry, traditional typographic hierarchy, and understated elegance. Think established institutions — weight and permanence over novelty.",
  },
  2: {
    label: "Bold / Daring",
    styleBias:
      "Push contrast, scale, and asymmetry. Use an unexpected crop, exaggerated proportions, or a provocative color accent. The composition should feel confident and forward-leaning — startup energy.",
  },
  3: {
    label: "Creative Wildcard",
    styleBias:
      "Surprise the viewer. Try an unusual metaphor, a playful visual pun, or an unconventional mark structure. Break one 'rule' from the brief intentionally (e.g., swap mark type for something unexpected) while keeping the overall brand feeling coherent.",
  },
};

const CONCEPT_OUTPUT_INSTRUCTION =
  "Flat vector-style logo artwork, centered, plenty of padding, clean edges, suitable for PNG export. Dark navy (#0a0f1e) background. The brand name must be spelled EXACTLY as provided — text accuracy is the top priority. No mockups, no business cards, no watermarks, no UI chrome.";

/**
 * Build a differentiated concept prompt for a specific variant index (0-3).
 * Each variant produces a notably different logo while respecting the brief's
 * mark type, colors, and personality.
 */
export function buildLogoConceptPrompt(
  topic: string,
  position: string,
  brief: LogoBrief,
  extraNotes: string,
  variantIndex: number,
): string {
  const idx = Math.max(0, Math.min(3, Math.floor(variantIndex)));
  const variant = VARIANT_DIRECTIONS[idx] ?? VARIANT_DIRECTIONS[0];

  const pos = position.trim();
  const posShort = pos.length > 500 ? `${pos.slice(0, 497)}…` : pos;
  const must = brief.mustHaves.map((id) => LOGO_MUST_HAVES.find((x) => x.id === id)?.label ?? id);
  const avoid = brief.avoid.map((id) => LOGO_AVOID.find((x) => x.id === id)?.label ?? id);

  const lines = [
    `Professional logo design for "${topic}".`,
    posShort ? `Business context: ${posShort}` : null,
    ``,
    `CONCEPT DIRECTION — ${variant.label}:`,
    variant.styleBias,
    ``,
    `LOCKUPS & STRUCTURE: ${label(LOGO_MARK_TYPES, brief.markType)}. ${LOGO_MARK_TYPES.find((x) => x.id === brief.markType)?.hint}`,
    `VISUAL LANGUAGE: ${label(LOGO_VISUAL_STYLES, brief.visualStyle)} — ${LOGO_VISUAL_STYLES.find((x) => x.id === brief.visualStyle)?.hint}`,
    `COLOR: ${label(LOGO_COLOR_STRATEGIES, brief.colorStrategy)} — ${LOGO_COLOR_STRATEGIES.find((x) => x.id === brief.colorStrategy)?.hint}`,
    `TYPE FEEL (if letters appear): ${label(LOGO_TYPE_FEELS, brief.typeFeel)} — ${LOGO_TYPE_FEELS.find((x) => x.id === brief.typeFeel)?.hint}`,
    `PERSONALITY: ${label(LOGO_PERSONALITIES, brief.personality)}.`,
    `PRIMARY CONSTRAINT: ${label(LOGO_USAGE_PRIORITIES, brief.usagePriority)} — ${LOGO_USAGE_PRIORITIES.find((x) => x.id === brief.usagePriority)?.hint}`,
    `COMPLEXITY: ${label(LOGO_DETAIL_LEVELS, brief.detailLevel)}.`,
    ``,
    `MUST achieve: ${must.join("; ")}.`,
    `DO NOT: ${avoid.join("; ")}.`,
    ``,
    CONCEPT_OUTPUT_INSTRUCTION,
    extraNotes.trim() ? `Additional direction from founder: ${extraNotes.trim()}` : null,
  ];

  return lines.filter(Boolean).join("\n");
}

// ---------------------------------------------------------------------------
// Mockup prompts — show the logo in real-world context
// ---------------------------------------------------------------------------

const MOCKUP_CONTEXTS: Record<
  string,
  { size: string; description: string; closing: string }
> = {
  "business-card": {
    size: "1024x1536",
    description:
      "A premium business card resting on a dark marble desk surface. Soft directional studio lighting with subtle shadows. The card features the logo prominently on the front, with clean modern typography for contact details. Thick, textured card stock with a matte finish. Slight depth-of-field blur on the desk edges.",
    closing: "Photorealistic product mockup, professional photography",
  },
  "email-header": {
    size: "1536x1024",
    description:
      "A modern SaaS welcome/onboarding email displayed in an email client. The logo sits in the header area against a clean white or light background. Below the header is a friendly headline, a short paragraph of placeholder body text, and a prominent call-to-action button in the brand's accent color. Clean email template layout with generous whitespace.",
    closing: "Clean UI screenshot, pixel-perfect",
  },
  "app-icon": {
    size: "1024x1024",
    description:
      "An iOS/Android app icon with the standard rounded-square shape (Apple superellipse). Only the icon mark from the logo — no text. Clean flat design with the brand's primary color as background. The symbol is centered with balanced padding. Subtle ambient shadow beneath the icon as if resting on a surface.",
    closing: "Clean UI screenshot, pixel-perfect",
  },
  "social-avatar": {
    size: "1024x1024",
    description:
      "A circular social media profile picture (like Twitter/LinkedIn avatar). The logo mark is centered within the circle, with the brand's primary color or a dark background. Optimized for clarity at small sizes — the mark fills the space confidently without crowding the edges.",
    closing: "Clean UI screenshot, pixel-perfect",
  },
  "website-hero": {
    size: "1536x1024",
    description:
      "A modern SaaS landing page hero section displayed in a browser. The logo appears in the top navigation bar at normal nav size. The hero section below features a bold headline, a subtitle, and a CTA button, all using the brand's color palette. Clean, professional layout with generous whitespace, modern typography, and a subtle gradient or abstract background shape.",
    closing: "Clean UI screenshot, pixel-perfect",
  },
  "billing-page": {
    size: "1536x1024",
    description:
      "A SaaS billing/payment page UI displayed in a browser. The logo sits in the top navigation bar. The page shows a professional payment form with credit card fields, a plan summary sidebar, and pricing details. Fintech-grade styling — clean lines, trust badges, and the brand's color accents on buttons and highlights. Secure, trustworthy feel.",
    closing: "Clean UI screenshot, pixel-perfect",
  },
};

/**
 * Build a mockup prompt that places the logo in a real-world context.
 * `logoDescription` is a short visual description of the selected logo.
 * `mockupContext` is one of the known context keys (business-card, email-header, etc.).
 */
export function buildMockupPrompt(
  topic: string,
  logoDescription: string,
  mockupContext: string,
): string {
  const ctx = MOCKUP_CONTEXTS[mockupContext];
  if (!ctx) {
    throw new Error(
      `Unknown mockup context "${mockupContext}". Valid: ${Object.keys(MOCKUP_CONTEXTS).join(", ")}`,
    );
  }

  const lines = [
    `Create a realistic mockup showing the "${topic}" brand logo in context.`,
    ``,
    `THE LOGO: ${logoDescription.trim()}`,
    ``,
    `MOCKUP SCENE: ${ctx.description}`,
    ``,
    `The brand name is "${topic}" — spell it exactly. The logo must be clearly visible and legible in the scene.`,
    ``,
    ctx.closing,
  ];

  return lines.join("\n");
}

/**
 * Returns the recommended image size for a given mockup context.
 */
export function getMockupSize(context: string): string {
  return MOCKUP_CONTEXTS[context]?.size ?? "1024x1024";
}

// ---------------------------------------------------------------------------
// Refinement — iterate on an existing concept
// ---------------------------------------------------------------------------

/**
 * Build a refinement prompt that modifies an existing concept.
 * Clearly separates the original design from the requested changes
 * so the image model understands this is an iteration.
 */
export function buildRefinementPrompt(
  originalPrompt: string,
  instruction: string,
): string {
  const lines = [
    `=== ORIGINAL DESIGN (keep everything not explicitly changed) ===`,
    originalPrompt.trim(),
    ``,
    `=== MODIFICATION REQUESTED ===`,
    instruction.trim(),
    ``,
    `Regenerate the logo incorporating the modification above while preserving all other aspects of the original design. Flat vector-style logo artwork, centered, plenty of padding, clean edges, suitable for PNG export. Dark navy (#0a0f1e) background. The brand name must be spelled EXACTLY as provided — text accuracy is the top priority. No mockups, no business cards, no watermarks, no UI chrome.`,
  ];

  return lines.join("\n");
}

/** Full brand-sheet prompt for Gemini — generates logo + variations + palette + typography + mockups in one image. */
export function buildBrandSheetPrompt(
  topic: string,
  position: string,
  brief: LogoBrief,
  extraNotes: string,
): string {
  const pos = position.trim();
  const posShort = pos.length > 500 ? `${pos.slice(0, 497)}…` : pos;
  const must = brief.mustHaves.map((id) => LOGO_MUST_HAVES.find((x) => x.id === id)?.label ?? id);
  const avoid = brief.avoid.map((id) => LOGO_AVOID.find((x) => x.id === id)?.label ?? id);

  const lines = [
    `Create a professional brand identity sheet / brand kit for "${topic}" on a dark navy (#0a0f1e) background.`,
    posShort ? `Business context: ${posShort}` : null,
    ``,
    `BRAND SHEET LAYOUT — include ALL of the following sections in a structured grid:`,
    `1. MAIN LOGO — large, top-left, the primary logo lockup with wordmark and tagline`,
    `2. LOGO VARIATIONS — top-right area, show the logo in 3-4 different color/style treatments side by side`,
    `3. LOGO ON DARK BACKGROUNDS — show logo reversed on black/dark backgrounds`,
    `4. ICONOGRAPHY — set of 5-6 related icons/symbols in the brand style`,
    `5. COLOR PALETTE — row of color swatches with hex codes and CMYK values printed below each`,
    `6. TYPOGRAPHY — show the brand font name, alphabet specimen (A-Z), and subtitle font`,
    `7. BRAND APPLICATIONS — small mockups: business card, email signature, or app icon`,
    ``,
    `LOGO DESIGN DIRECTION:`,
    `- Mark structure: ${label(LOGO_MARK_TYPES, brief.markType)} — ${LOGO_MARK_TYPES.find((x) => x.id === brief.markType)?.hint}`,
    `- Visual style: ${label(LOGO_VISUAL_STYLES, brief.visualStyle)} — ${LOGO_VISUAL_STYLES.find((x) => x.id === brief.visualStyle)?.hint}`,
    `- Color strategy: ${label(LOGO_COLOR_STRATEGIES, brief.colorStrategy)} — ${LOGO_COLOR_STRATEGIES.find((x) => x.id === brief.colorStrategy)?.hint}`,
    `- Type feel: ${label(LOGO_TYPE_FEELS, brief.typeFeel)} — ${LOGO_TYPE_FEELS.find((x) => x.id === brief.typeFeel)?.hint}`,
    `- Personality: ${label(LOGO_PERSONALITIES, brief.personality)}`,
    `- Detail level: ${label(LOGO_DETAIL_LEVELS, brief.detailLevel)}`,
    ``,
    `QUALITY: ${must.join("; ")}.`,
    `AVOID: ${avoid.join("; ")}. No photorealism. No blurry text.`,
    ``,
    `Output: crisp, high-resolution brand identity presentation sheet. Dark navy background (#0a0f1e). Organized sections with clear labels and dividers. All text must be sharp, correctly spelled, and perfectly legible — treat text accuracy as the top priority. Professional design studio quality, like a Behance brand case study.`,
    extraNotes.trim() ? `Additional direction: ${extraNotes.trim()}` : null,
  ];

  return lines.filter(Boolean).join("\n");
}
