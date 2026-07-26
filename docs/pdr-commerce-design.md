# PDR Commerce — design lock v3 (SWISS EDITORIAL LEDGER)

The design system for every PDR Commerce surface (`/commerce`, `/commerce/command`). **Supersedes
v1 (dark ops room) and v2 (white SaaS workspace) — both rejected.** Direction chosen 2026-07-25:
a business ledger designed like Swiss print. References: Vignelli-era Swiss typography, Braun
print manuals, annual-report tables, the PDR landing's cream/ink energy, Bloomberg density
reinterpreted on paper. Family stance: per-product liveries — Studio stays the amber machine HMI;
Commerce is the printed ledger of record.

## The one rule that shapes everything

> **It is a printed ledger, not an app skin.** One warm paper surface — no white cards floating
> on gray, no shadows. Structure comes from PRINT: 2px ink rules between sections, 1px warm
> hairlines between rows, numbered sections, oversized figures. Ink carries hierarchy; color is
> rationed — BLUE is live data and links, black is action, state colors are stamps. If a screen
> could pass for a beautifully typeset financial report, it is right.

## Palette (locked tokens)

| token | hex | role |
|---|---|---|
| PAPER | `#F5F3ED` | the single surface (warm cream — matches PDR landing family) |
| INKB | `#111111` | ink: text, 2px section rules, black action buttons |
| RULE | `#111111` | 2px structural section rules (same ink) |
| HAIRB | `#CFC9BC` | 1px warm hairline (row separators) |
| DIMB | `#6B6659` | secondary text |
| FAINTB | `#9B968A` | micro-labels, marginalia |
| LIVE | `#0047FF` | THE accent — live/measured data, links, active nav (same blue as the PDR landing) |
| OKB | `#1F7A44` | healthy / delivered / revenue stamps |
| WARNB | `#B45309` | awaiting review / low stock stamps |
| FAULTB | `#C0271D` | broken / cancelled / out-of-stock stamps |
| INSETB | `#ECE8DE` | chart wells, code/ledger insets, bar tracks |

No pure white, no gray washes, no shadows, zero radius everywhere.

## Type

**Anton** = the voice of the ledger: oversized figures (40–72px), view titles, big statements.
**Inter** = all reading text — body, table names, buttons, nav labels (13–14px; titles 15/600).
**JetBrains Mono** = data & marginalia — numbers in tables, prices, ids, timestamps, micro-labels
(9–10px, +0.14em, UPPER). Numbers always `tabular-nums`. Headings `text-balance`, body `text-pretty`.

## Layout — the printed workspace

Sidebar (paper, hairline-right, ~230px): mark, register, **numbered nav** `01 Dashboard … 10
Settings` (mono numerals + Inter labels; active = ink text + 2px LIVE left rule), day-counter
footer. Content column (max ~1040px): every view is a sequence of **numbered sections** opened by
a 2px ink rule and a header line (`№ · SECTION TITLE` left, context right). Metric strips: Anton
figures separated by hairlines on the shared paper — never boxed cards. Tables: ledger rows on
hairlines, grid-aligned columns, generous 12–14px row padding, hover = INSETB wash. Charts sit in
INSETB wells, bars in OKB/LIVE, values in mono.

## Components

**Figure** (micro-label FAINTB over Anton number, unit in mono) · **stamp** (state chip: 1px ink
or state-color border, UPPER mono 9px — like a rubber stamp; filled black stamp for emphasis) ·
**action** (black fill, white Inter 12/600, `EXECUTE →`; destructive = FAULTB border ghost;
selection chips = LIVE border + LIVE text) · **ledger row** (mono timestamp · stamp tag · Inter
sentence) · **section rule** (2px ink, full width, `№` hanging left) · **bar** (INSETB track,
state fill, mono value) · **finding** (LIVE signal — DIMB insight, on hairlines).

## Motion

Print doesn't animate. Hard cuts only; hover washes ≤120ms; the single exception: WARN stamps may
blink 1Hz while an action awaits review. No entrance animations, ever.

## Signature moves

1. **Oversized figures** — revenue in 64px Anton on paper is the identity shot.
2. **Numbered sections + 2px rules** — every view reads like a report's table of contents.
3. **Stamps** — statuses look stamped onto the page, not styled as web chips.
4. **Blue = alive** — the only saturated color in repose is LIVE blue on measured data; a page
   with no blue means nothing is happening.
5. **The audit line** — every view ends with a mono marginalia line: what is measured, what is
   awaiting connection. Honesty is part of the aesthetic.
6. **Register as colophon** — company switcher styled like a ledger's index, not tabs.
