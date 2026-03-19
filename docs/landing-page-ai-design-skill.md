# Landing page generator — AI “skill” (for maintainers)

The deployed model does **not** read Cursor/Claude skill files. What it **does** read is whatever we inject in `src/lib/landing-page-prompt.ts`.

## Architecture

1. **`src/lib/landing-page-design-kit.ts`**  
   - `LANDING_PAGE_STYLE_KIT` — full CSS for the `lp-*` component system (nav, hero, cards, steps, FAQ, CTA, footer).  
   - `LANDING_PAGE_SCRIPT_KIT` — minimal JS (mobile nav + `IntersectionObserver` reveals).  
   - `LANDING_PAGE_COPY_SKILL` — headline/CTA formulas and anti-patterns.

2. **`src/lib/landing-page-prompt.ts`**  
   - System prompt **requires** the model to paste the kit CSS and script **verbatim** and build HTML with `lp-*` classes, instead of inventing new layout CSS each time.

3. **API** (`action: "landing-page"` in `src/app/api/debate/route.ts`)  
   - Sends the system + user prompts (with structured validation brief).

## Editing the look

- Prefer changing **tokens** in the kit (`:root` variables like `--lp-accent`, `--lp-bg`, radii).  
- Add or adjust **classes** in the kit, then document them in the system prompt’s “Markup MUST use” list so the model keeps using them.

## Why this beats “prompt only”

LLM-authored CSS from scratch tends to look generic and inconsistent. A **fixed design system** in-repo gives repeatable, downloadable pages that behave the same every generation.
