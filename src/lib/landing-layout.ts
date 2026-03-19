/** Deterministic layout variety so each idea gets a different structure (not the same stacked page). */

export type LayoutVariantId =
  | "split-hero"
  | "centered-editorial"
  | "bento-proof"
  | "magazine-alternating"
  | "timeline-band";

const VARIANTS: LayoutVariantId[] = [
  "split-hero",
  "centered-editorial",
  "bento-proof",
  "magazine-alternating",
  "timeline-band",
];

export function pickLayoutVariant(topic: string): LayoutVariantId {
  let h = 0;
  const t = topic || "idea";
  for (let i = 0; i < t.length; i++) h = (h + t.charCodeAt(i) * (i + 1)) % 1000007;
  return VARIANTS[h % VARIANTS.length];
}

/** Instructions injected into the user prompt — model must follow one archetype. */
export function getLayoutVariantInstructions(id: LayoutVariantId): string {
  const common = `Add this class on <body> next to lp-page: lp-layout--${id}`;

  switch (id) {
    case "split-hero":
      return `${common}
**Archetype: SPLIT HERO**
- Hero MUST use .lp-hero.lp-hero--split with two columns on desktop: left = copy (.lp-hero__copy), right = visual (.lp-hero__visual).
- Put the primary stock image (first URL) inside .lp-hero__visual with <img class="lp-img lp-img-kenburns"> plus a subtle gradient overlay div if needed for contrast.
- Mobile: stack visual below copy (order in HTML: copy first, then visual).
- Do NOT use only a single centered column hero for this variant.`;

    case "centered-editorial":
      return `${common}
**Archetype: CENTERED EDITORIAL**
- Narrow, editorial feel: rely on .lp-layout--centered-editorial (max-width ~680px for main narrative blocks).
- Hero: single column, oversized headline, generous padding; optional small caps eyebrow.
- Problem/solution: prose-forward; fewer cards, more rhythm; use blockquotes or .lp-quote for one key insight.
- Features: use 2-column .lp-grid.lp-grid--2 only, not 3x2 — keep it sparse.`;

    case "bento-proof":
      return `${common}
**Archetype: BENTO + PROOF**
- After hero, include a **bento grid** section (.lp-bento) mixing 3–5 tiles of different sizes: one tile can be a stat, one a short quote, one an image (if URLs provided), one a feature.
- Features section should NOT be a uniform 3x2 — use .lp-bento__item modifiers (wide/tall) as defined in the kit CSS.
- Hero can be standard or minimal; emphasis is on the asymmetric bento band.`;

    case "magazine-alternating":
      return `${common}
**Archetype: MAGAZINE / ALTERNATING**
- Alternate section backgrounds using .lp-section--alt and .lp-section--mag (classes in kit).
- At least one **large pull quote** or stat callout spanning the grid.
- “How it works” can be vertical on the side on desktop (use .lp-steps--magazine) or 2+2 grid — avoid identical card rows everywhere.`;

    case "timeline-band":
      return `${common}
**Archetype: TIMELINE BAND**
- Hero: full-width gradient band (.lp-hero--band) with content in container.
- “How it works” MUST use .lp-steps.lp-steps--horizontal with a visible connector line (kit) and 3–4 steps in one horizontal row on desktop.
- Problem/solution: compact rows or icon rows — different from default 3 cards.`;

    default:
      return common;
  }
}
