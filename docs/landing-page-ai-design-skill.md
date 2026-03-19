# Landing page generator — AI “skill” (for maintainers)

The deployed model does **not** read Cursor/Claude skill files. What it **does** read is whatever we inject in `src/lib/landing-page-prompt.ts`.

## Architecture

1. **`src/lib/landing-page-design-kit.ts`**  
   - `LANDING_PAGE_STYLE_KIT` — full CSS for the `lp-*` component system (nav, hero, cards, steps, FAQ, CTA, footer).  
   - Layout extras: split hero, bento grid, magazine/pull quote, horizontal timeline band, **Ken Burns** animation on `.lp-img-kenburns` (disabled when `prefers-reduced-motion`).  
   - `LANDING_PAGE_SCRIPT_KIT` — minimal JS (mobile nav only; scroll-reveal was removed because `opacity:0` + `IntersectionObserver` often never fires in sandboxed `srcDoc` iframes, leaving the preview blank).  
   - `LANDING_PAGE_COPY_SKILL` — headline/CTA formulas and anti-patterns.

2. **`src/lib/landing-layout.ts`**  
   - `pickLayoutVariant(topic)` — deterministic archetype per idea (split-hero, centered-editorial, bento-proof, magazine-alternating, timeline-band).  
   - `getLayoutVariantInstructions(id)` — instructions injected into the user prompt so structure varies.

3. **`src/lib/landing-images.ts`**  
   - `fetchLandingPageImages(topic)` — optional **Unsplash** search (`UNSPLASH_ACCESS_KEY`). Returns 0–4 image URLs + attribution; registers downloads per API rules. If unset, prompts use CSS/SVG only.

4. **`src/lib/landing-page-prompt.ts`**  
   - System prompt **requires** the model to paste the kit CSS and script **verbatim** and build HTML with `lp-*` classes.  
   - User prompt includes layout archetype + optional image list.

5. **API** (`action: "landing-page"` in `src/app/api/debate/route.ts`)  
   - Resolves layout variant + fetches images, then streams with structured validation brief.

## Editing the look

- Prefer changing **tokens** in the kit (`:root` variables like `--lp-accent`, `--lp-bg`, radii).  
- Add or adjust **classes** in the kit, then document them in the system prompt’s “Markup MUST use” list so the model keeps using them.

## Why this beats “prompt only”

LLM-authored CSS from scratch tends to look generic and inconsistent. A **fixed design system** in-repo gives repeatable, downloadable pages that behave the same every generation.
