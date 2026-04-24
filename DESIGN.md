# Priority Debater — Design System

**Direction:** Editorial Dossier. A Financial Times investigator handed a startup idea. Confident, archival, reads like a document rather than a dashboard.

**Non-goals.** Purple-to-pink gradients, glassmorphism, floating 3D orbs, shimmer-on-text, animated grid backgrounds, rainbow categorical colour. Heavy drop shadows. Gradient text. If it resembles a Tailwind starter, it's wrong.

---

## Signature move

**Numbers are set in Instrument Serif. Interface is set in Geist Sans.**

Every score, percentage, money amount, date, duration, and statistic on the site is typeset in serif. Interface labels — buttons, inputs, headings, descriptions — stay in sans. The dialogue between "data" (serif, weighted, considered) and "chrome" (sans, neutral, quiet) is the personality of the brand. Violate this rule and the signature disappears.

Use `.num`, `.num-sm`, `.num-lg`, or `.num-xl` on the element that contains the numeric value. Do not style numbers inline.

---

## Tokens

Source of truth: [`src/app/globals.css`](src/app/globals.css). Do not hardcode colour values, fonts, or radii in components. Reach for the token.

### Colour

| Role | Token | Value | When |
|---|---|---|---|
| Background | `--bg` | `#0D0D0F` | Page background, the canvas |
| Surface 1 | `--surface-1` | `#16161A` | Cards, inputs, default panels |
| Surface 2 | `--surface-2` | `#1C1C20` | Hover, elevated, sticky chrome |
| Surface 3 | `--surface-3` | `#23232A` | Active rows, sub-nav, pressed |
| Ink 0 | `--ink-0` | `#F4F4F5` | Primary text, headings |
| Ink 1 | `--ink-1` | `#A1A1AA` | Body copy, secondary text |
| Ink 2 | `--ink-2` | `#52525B` | Metadata, labels, placeholders |
| Ink 3 | `--ink-3` | `#27272A` | Disabled, dividers, rare |
| Line | `--line` | `rgba(244,244,245,0.07)` | Default 1px hairline border |
| Line soft | `--line-soft` | `rgba(244,244,245,0.04)` | Internal divisions |
| Line strong | `--line-strong` | `rgba(244,244,245,0.12)` | Hover state on borders |
| **Accent** | `--accent` | `#E8C547` | **See rules below** |
| Accent soft | `--accent-soft` | `rgba(232,197,71,0.12)` | Accent fills, selections |
| Accent strong | `--accent-strong` | `rgba(232,197,71,0.35)` | Focus rings |
| Success | `--success` | `#5CB88A` | GO verdict, success states |
| Warning | `--warning` | `#E8A54B` | CAUTION verdict, warnings |
| Error | `--error` | `#D46F5C` | NO-GO verdict, error states |

### When to use colour vs neutral

The default is neutral. Colour earns its place only when it carries meaning.

**Colour is allowed for:**
1. **Status.** Semantic signal — GO/CAUTION/NO-GO, success, warning, error, risk flags.
2. **Hierarchy — primary action only.** A single accent-coloured button per visible area, never two. Secondary actions are neutral.
3. **Data visualisation.** A chart series that represents data may use accent. Multi-series charts use sequential shades of one hue (see Charts).
4. **Interactive state.** Hover, focus, selection, active link — accent or line-strong.

**Colour is _not_ allowed for:**
- Icon decoration on feature cards.
- Category tags that don't carry status meaning.
- Section backgrounds.
- Text emphasis — use weight or `--ink-0` (vs `--ink-1`) instead.
- "Brand moments" that aren't functional.

If you can't answer "is this colour signalling status, hierarchy, or data?" with one of those three, remove the colour.

### Charts

Single-hue sequential scales, not categorical palettes. When a chart needs more than one visual series, vary lightness, not hue.

```
1 series:   accent
2 series:   accent  + ink-1
3 series:   accent  + ink-1 + ink-2
≥4 series:  sequential lightness ramp of accent (computed from --accent)
```

Radar charts, rubric bars, score rings, progress bars — all accent. Comparison charts (e.g. us vs competitor) — us = accent, them = ink-2.

---

## Typography

Three families loaded via `next/font/google` in `src/app/layout.tsx`. Never import others.

| Family | Variable | Use for |
|---|---|---|
| Geist Sans | `--font-sans` | All UI — buttons, inputs, labels, body, H1-H3 |
| Instrument Serif | `--font-serif` | All numbers, display headlines, pull-quotes |
| Geist Mono | `--font-mono` | Code, URLs, keyboard hints, file paths |

### Scale

Use the named classes in `globals.css`. Avoid ad-hoc `text-[15px]`.

| Class | Size | Line-height | Tracking | Use |
|---|---|---|---|---|
| `.display` | 44–64px (clamp) | 1.02 | -0.025 | Hero headline — one per page |
| `.h1` | 28–36px (clamp) | 1.15 | -0.02 | Page titles |
| `.h2` | 22px | 1.3 | -0.015 | Section titles |
| `.h3` | 16px | 1.4 | -0.01 | Card titles, group headers |
| `.body` | 14px | 1.55 | 0 | Default paragraph |
| `.small` | 13px | 1.5 | 0 | Dense UI text, field help |
| `.caption` | 11px | 1.4 | +0.08 upper | Section kickers, tab labels |
| `.mono` | 13px | 1.5 | 0 | Inline code, URL, keybinding |
| `.num-sm` | 16px | 1 | -0.02 | Inline stat |
| `.num` | 24px | 1 | -0.02 | Card stat |
| `.num-lg` | 40px | 1 | -0.025 | Primary stat tile |
| `.num-xl` | 64px | 0.95 | -0.03 | Hero number (viability score) |

**Weight discipline.** Geist Sans uses 400/500/600 only. Never `font-bold` (700) — 600 is the strong weight. Never `font-light` (300). Never `font-black`.

**Colour discipline.** Text is one of four inks (`--ink-0..3`). Accent text is reserved for links and primary-button labels.

---

## Spacing

Base unit: 4px. Use Tailwind's default scale which happens to be 4px-based. Do not invent arbitrary spacing — the scale must be one of:

```
1   = 4px
2   = 8px
3   = 12px
4   = 16px
5   = 20px
6   = 24px
8   = 32px
10  = 40px
12  = 48px
16  = 64px
20  = 80px
24  = 96px
```

### Component padding

- Button: `px-4 py-2.5` (16 / 10) small, `px-5 py-3` (20 / 12) default.
- Input/textarea: `px-3.5 py-2.5` (14 / 10).
- Card: `p-5` (20) compact, `p-6` (24) default, `p-8` (32) generous.
- Section: `py-16` (64) standard, `py-24` (96) marketing hero.

### Container widths

- Reading/form: `max-w-2xl` (672px) — long text, focused form.
- Dashboard: `max-w-6xl` (1152px) — multi-column data.
- Marketing: `max-w-[min(1280px,94vw)]` — landing, pricing.

One container width per page section. No nested container madness.

---

## Radius

Single value: `--r` = 6px. Tailwind equivalents:

| Token | Value | Use |
|---|---|---|
| `--r-sm` | 4px | Inline code, keyboard hints, small badges |
| `--r` | 6px | **Default** — buttons, inputs, cards, panels |
| `--r-lg` | 10px | Modals, featured hero tiles |
| `--r-full` | 9999px | Avatars, status pills only |

Never use `rounded-2xl` or larger (`16px+`) — too soft for editorial. Never use `rounded-none` except on table rows that sit inside a rounded container.

---

## Shadow

Shadow is almost never used. Hierarchy comes from surface tone and hairline borders, not depth.

| Token | Value | Use |
|---|---|---|
| `--shadow-1` | `0 1px 2px rgba(0,0,0,0.35)` | Popovers, toasts, dropdown menus |
| `--shadow-2` | `0 12px 32px -8px rgba(0,0,0,0.55)` | Modals only |

**No card shadows.** A card is a `--surface-1` background with a `--line` hairline border. If you feel the card needs a shadow to pop, the surrounding layout is wrong — add whitespace instead.

---

## Components

### Button

Primary: accent background, ink-0 text (inverted — black text on gold), 6px radius. Hover darkens accent slightly. Focus shows the focus ring.

```
bg-[--accent] text-[--bg] hover:brightness-95
px-5 py-3 rounded-[--r] text-sm font-medium
```

Secondary: transparent background, line-strong border, ink-0 text.

```
border border-[--line-strong] bg-transparent text-[--ink-0] hover:bg-[--surface-2]
px-5 py-3 rounded-[--r] text-sm font-medium
```

Ghost / tertiary: no border, ink-1 text, hovers to surface-2.

One primary button per visible region. Secondary/ghost carries everything else.

### Input

```
bg-[--surface-1] border border-[--line] text-[--ink-0] placeholder:[--ink-2]
px-3.5 py-2.5 rounded-[--r] text-sm
focus: box-shadow via focus-ring token
```

### Card

```
bg-[--surface-1] border border-[--line] rounded-[--r] p-6
```

No drop shadow. Hover = `bg-[--surface-2]` on interactive cards only.

### Divider

Prefer `.rule` (1px hairline, no margin) for section separations. Avoid decorative `<div className="h-px bg-gradient-..." />`.

### Badge

Status badges use semantic token + soft fill:

```
bg-[--success-soft] text-[--success] border border-[--success]/30
px-2 py-0.5 rounded-[--r-sm] text-[11px] font-medium uppercase tracking-wide
```

Same pattern for warning, error. Accent badges for neutral tags.

---

## Motion

Motion is subtle and earns its keep. No bouncy spring animations. No floating, drifting, pulsing backgrounds.

**Permitted:**
- Fade-in on mount (`msg-fade-in`, 300ms, ease-out). Used sparingly.
- Accordion expand/collapse (Radix default, 200ms).
- Micro-transitions on interactive state: colour change 120ms, transform on hover ≤ 2px.
- Reduced-motion respected via `prefers-reduced-motion`.

**Forbidden (being removed during Task 6):**
- `animate-mesh-float-*`, `animate-aurora`, `animate-pulse-glow`, `animate-float`, `animate-shimmer` on text or borders, `animate-gradient-x`, `animate-gradient-shift`.

---

## Migration from the old system

A compatibility shim in `globals.css` retargets legacy variable names (`--bg-primary`, `--text-primary`, `--accent-primary`, …) to the new Editorial Dossier tokens. Unmigrated pages will re-render in the new palette automatically but will still carry old-system layout habits (too many colours, glassmorphism, gradient buttons). They will be swept page-by-page in Tasks 3–6.

When migrating a page:
1. Replace inline hex / rgba values with tokens.
2. Replace per-page card backgrounds with `bg-[--surface-1]`.
3. Remove decorative `.icon-color` tints — keep only those that signal status.
4. Replace `font-bold` with `font-semibold`.
5. Wrap every numeric value in `.num` / `.num-lg` / `.num-xl`.
6. Audit: does every coloured element answer "status, hierarchy, or data"? If no — decolour it.

## Styleguide

Visual reference at [/styleguide](src/app/styleguide/page.tsx). Build there first if proposing a new primitive — land it in the styleguide before using it on a product page.
