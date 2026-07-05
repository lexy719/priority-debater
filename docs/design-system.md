# PD Design System — "Brutalist Fork"

**This file is the single source of truth for all UI work in this repo.** Every page, component,
and future session must follow it. Tokens live in one consolidated block at the top of
`src/app/globals.css` (`:root` → the `--fk-*` family). If a rule here and a page disagree,
the page is wrong.

Derived from `docs/pd-frontend-build-brief.md` ("Design System") and `docs/pd-commerce-full-design.md` (§4).

---

## 1. Principles

1. **Hard cuts, not eases.** State changes (hover swaps, tab switches, page changes) are abrupt
   and instant — `transition: none` on background/color swaps that represent a state change.
   `transition` is allowed only for small hover affordances (arrow nudge, border color) and must
   stay ≤ 200ms. Brutalism reads as intentional through hard cuts, not smooth fades.
2. **Zero border-radius. No exceptions.** `--radius: 0px` globally; never write `rounded-*`
   (except `rounded-none`). No pill shapes, no soft corners, anywhere.
3. **Alternating black / cream sections.** Pages are stacked full-width bands:
   black (`--fk-black`) → cream (`--fk-cream`) → black → … Heroes are black. Never two
   same-color bands adjacent.
4. **Mono metadata everywhere.** Timestamps, counters, step numbers, eyebrows/kickers, labels,
   table numerics: JetBrains Mono, small, uppercase, wide tracking. Numbers are the product —
   dress them in mono.
5. **No decoration.** No gradients, no soft/blurred shadows (hard offsets only), no icon soup
   (mono step numbers `01 02 03` instead of icons), no stock illustration. Grid-paper overlays
   and hairlines are the only texture.

## 2. Palette

Five hero tokens + supporting tokens. Canonical definitions: `src/app/globals.css` `:root`.

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `--fk-black` | `#0A0A0A` | `bg-fk-black` | Page/hero background, text on cream |
| `--fk-cream` | `#F2EEE3` | `bg-fk-cream` | Alternate section background, text on black |
| `--fk-yellow` | `#FFD400` | `bg-fk-yellow` | **The single CTA per page. Never decorative.** |
| `--fk-blue` | `#0047FF` | `text-fk-blue` | Data, charts, primary/live states, "at risk" |
| `--fk-red` | `#FF2B2B` | `text-fk-red` | Fail / invisible states, brand mark, destructive |

Supporting (state + structure — never hero colors):

| Token | Hex | Usage |
|---|---|---|
| `--fk-green` | `#16B364` | Success / live / recovered states |
| `--fk-amber` | `#F5A623` | Warn / pending states |
| `--fk-muted` | `#888888` | Muted text on black |
| `--fk-ink-border` | `#1A1A1A` | Hairline borders on black (or `white/10`–`white/15`) |
| `--fk-cream-border` | `#E0D9CE` | Hairline borders on cream (or `black/10`) |
| `--fk-card-dark` | `#111111` | Raised card surface on black |

**Hard rules:**
- **Yellow = exactly one element per page** — the page's primary CTA. If a page has two yellow
  things, one of them is wrong. Secondary actions are ghost (bordered, transparent) or red.
- Blue is for data and primary signals, red for failure/invisible, green/amber only as small
  state chips/labels — never as section backgrounds.
- `--pd-*`, `--signal-*`, `--c-red/blue/yellow/green` are **frozen aliases** of `--fk-*` kept
  for legacy call sites. **Never add new usages** — new code uses `--fk-*` vars or `fk-`
  Tailwind utilities (`bg-fk-black`, `text-fk-yellow`, `border-fk-ink-border`, …).

## 3. Typography

Three families, loaded in `src/app/layout.tsx` as `--app-font-display/sans/mono`:

| Role | Family | Classes | Rules |
|---|---|---|---|
| Display / headlines | **Anton** | `.font-display`, `.display-2xl/.display-xl/.display`, `.h1-anton`, `.text-display` | Uppercase, condensed, tight leading (`leading-[0.9]`–`[1.02]`), slight negative tracking |
| Body | **Inter** | `.body`, `.body-lg`, `.small`, `.h2`, `.h3` | Sentence case, `leading-relaxed`, max-w-xl for paragraphs |
| Metadata / numbers | **JetBrains Mono** | `.mono`, `.kicker`, `.caption`, `.num-sm`…`.num-3xl` | Uppercase for labels, `tracking-[0.2em]`–`[0.4em]`, tabular numerals |

Hero headline scale: `text-[clamp(2.75rem,8vw,7rem)]`. Eyebrows/kickers: `font-mono text-[11px]
uppercase tracking-[0.32em]` at 45–70% opacity.

## 4. Spacing & Layout

- Containers: `max-w-[1120px] mx-auto px-6 lg:px-10` for content pages; `max-w-[1400px]` for
  nav bars and dashboard shells.
- Section rhythm: `py-24 lg:py-36` for heroes, `py-16 lg:py-24` for content bands.
- Dividers: 1px hairlines only — `border-white/10`–`/15` on black, `border-black/10` or
  `--fk-cream-border` on cream. Grids of cards use `gap-px` with the hairline color as the
  gap background, or explicit 1px borders.
- Sanctioned texture utilities (keep using): `.grid-paper`, `.grid-paper-dark`, `.grid-bg`,
  `.grid-bg-dark`, `.shadow-hard` (6px 6px 0 #000), `.shadow-hard-sm`, `.corner-ticks`.

## 5. Component Recipes

**Yellow CTA (one per page):**
```tsx
<Link href="…" className="inline-flex items-center gap-3 px-8 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.2em] no-underline"
  style={{ background: "var(--fk-yellow)", color: "var(--fk-black)" }}>
  Scan your store — free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
</Link>
```

**Ghost / secondary button (dark section):**
```tsx
<button className="px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] border border-white/25 text-white/80 hover:border-white hover:text-white bg-transparent" style={{ transition: "none" }}>
```

**Mono input:** `.pd2-input` pattern — black bg, 1px `--fk-ink-border` border, JetBrains Mono
14px, focus → `border-color: var(--fk-blue)`, no ring, no radius.

**Status chip:** `font-mono text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 border` —
color per state: red=invisible/fail, blue=at-risk/data, green=live/winning, amber=pending.

**Section header:** eyebrow (mono kicker) + display headline + optional one-sentence Inter sub.

**Live mono log line (scan/console UIs):** `font-mono text-[12px] leading-relaxed`, prefix
`>` or timestamp, appended with hard cuts (no fade-in), blinking block cursor via `.animate-blink`.

**Diff panel:** two mono panes side by side (`grid md:grid-cols-2 gap-px`), left = current with
gaps highlighted `bg-fk-red/10 text-fk-red`, right = proposed; both on `--fk-card-dark` with
hairline borders.

**Card (dark):** `bg-fk-card-dark border border-fk-ink-border p-6` — never elevated by blur
shadows; use `.shadow-hard` on cream only.

## 6. Do / Don't

| Do | Don't |
|---|---|
| One yellow CTA per page | Yellow badges, yellow icons, yellow accents |
| Hard-cut hover/state swaps | Fades, eases, scale-on-hover transitions on state changes |
| Mono step numbers `01 — SCAN` | Icon grids, emoji, illustration |
| Hard offset shadows (`.shadow-hard`) on cream | Soft/blurred/colored glows |
| Alternate black/cream bands | Two same-color sections adjacent, gradient backgrounds |
| Hairline 1px dividers | Thick decorative borders, colored section frames |
| `--fk-*` vars / `fk-` utilities | New `--pd-*`/`--signal-*` usages, raw hexes in JSX |

## 7. Token & File Reference

- Canonical token block: `src/app/globals.css` → first `:root` (search "CANONICAL DESIGN TOKENS").
- Tailwind bridge: `@theme inline` block → `--color-fk-*` (gives `bg-fk-*`, `text-fk-*`, `border-fk-*`).
- Frozen aliases: `--pd-*`, `--signal-*`, `--c-*` — legacy only, never in new code.
- Known scoped exception: `.chamber-scope` (debate/results) re-tints `--accent` to coral
  `#e23a2e` — legacy report accent, to be aligned or formally excepted during the results
  restyle pass.
- Fork picker + landings: `src/app/page.tsx`, `src/app/commerce/page.tsx`,
  `src/app/validation/page.tsx` are reference implementations of this system.
