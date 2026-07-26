# PD Studio — design lock (BUSINESS FABRICATION UNIT)

The machine HMI design system for `/studio`. Grounded in Teenage Engineering (appliance-instrument
livery), Linear (precision as atmosphere, sub-threshold motion), Vercel/Geist (mono for machine-facts,
one restrained accent), Warp (console/telemetry), ISA-101 / IEC 60073 high-performance HMI (status
color discipline), and Buffer/Later (auto-publish queue conventions).

## The one rule that shapes everything
Real HMI practice reserves saturated colour for abnormal state; Teenage Engineering wears hi-vis amber
as livery. PD Studio is a TE-class **appliance you operate**, so **amber stays primary** — but we keep
the ISA spirit:

> The base canvas is achromatic (warm near-black + grays). Saturated green/red/blue appear ONLY on
> live state. Amber does double duty as identity + attention, resolved by *treatment not hue*:
> **static amber = identity/active · flashing+filled amber = attention · muted ochre = queued.**
> State is never communicated by hue alone.

## Palette (locked tokens → JS consts in page.tsx)
| token | hex | role |
|---|---|---|
| BG | `#0A0A0B` | base void / chassis (never pure #000) |
| SURFACE (PANEL) | `#111113` | panel / cell fill |
| RAISED | `#17171A` | hover / selected / active module ("energized") |
| WELL | `#060607` | recessed inset — console, log wells, inputs |
| LINE | `#26262B` | default 1px hairline (silkscreen) |
| LINE2 | `#3A3A42` | focused/active border, major dividers |
| INK | `#EDEDEA` | primary text (warm off-white, not pure white) |
| DIM | `#8A8A82` | secondary readouts, log body |
| FAINT | `#55554F` | labels, units, marginalia, column heads |
| AMBER (accent) | `#FFB000` | PRIMARY — active control, selected, key metric, focus, "powered" |
| GREEN (ok) | `#35C46A` | RUNNING / LIVE / ONLINE / PUBLISHED / PASS |
| WARN | `#F5A623` | attention / publishing — filled + flashing when active |
| SCHED | `#B5852F` | scheduled / queued / pending — muted static ochre |
| RED (fault) | `#F04438` | FAULT / FAILED / OFFLINE |
| BLUE (data) | `#4C9AFF` | metric values / IDs / links / telemetry numbers |
| LEDOFF | `#2A2A2E` | unlit LED / empty progress segment |

## Type
JetBrains Mono = everything (data, labels, UI, body, logs). Anton = display stamps only. No third font.
Scale (px): stamp Anton 64–96 · display Anton 28–40 · readout mono 28–32/500 · h mono 15–16/600 UPPER ·
base mono 13/400 sentence · label mono 11/500 **+0.08em UPPER** · micro mono 9–10 **+0.12em UPPER**.
**Every number:** `tabular-nums slashed-zero`, right-aligned in tables. Uppercase for labels/units/
column-heads/status-words/part-nos/buttons; **sentence-case for log message bodies + prose**.

## Density / spacing / grid
4px base (`4 8 12 16 24 32 48 64`). Zero radius, 1px hard borders, **no shadows** (depth = bg→surface→
raised step + hairlines). Data tables share a single hairline (gutter 0, datasheet); distinct panels get
16–24px. **Density-vs-void:** a region is PACKED or EMPTY, never uniform-medium — the contrast is the
aesthetic. **Near-alignment discipline:** 95% strict grid + one intentional offset per panel (a part-no
tag hung outside a corner, a rotated spec string) that still snaps to a sub-grid.

## Motion (machine actuation only; 0–160ms; steps() / linear)
No spring, bounce, ease decoration, parallax, or scroll-fade. LED = hard on/off; warn/fault flash 1–2Hz
while unacknowledged, solid when acked; ok solid or slow breathe. Progress = segmented, fills
segment-by-segment. **Data-flash:** a changed value hard-cuts and flashes AMBER one beat, decays to INK.
Telemetry streams + auto-scrolls, timestamped. Transitions between states are instant (hard-cut).

## Components (each = instrument, not web card)
Square status LED (8px) + uppercase word · segmented progress bar (visible N segments) · spec-sheet cell
(11px faint label / big tabular value / trailing unit) · module header (`PD-STUDIO / MOD-02 · BRAND ·
REV v1.4 · S/N …` + LED + status) · telemetry line (`HH:MM:SS` faint · `[OK]/[WRN]/[ERR]` · sentence
msg) · data table (faint upper heads, hairline rows, right-aligned numerics, active row raised+amber left
border) · flight/gantt strip (lanes × week ticks, NOW line = 1px amber) · filmstrip (fixed-aspect frames,
frame#+dur, encode overlay while rendering) · queue row (platform · scheduled ts · content · LED+word ·
T-minus countdown).

## Category / IA (credible automated platform)
Campaign = **FLIGHT PLAN** (objective · channels · flight dates · budget %+absolute · pacing · KPI) as
spec-sheet + gantt. Content = **auto-publish QUEUE** with state machine
`DRAFT → SCHEDULED/QUEUED → PUBLISHING → PUBLISHED` (+ HELD / FAILED→RETRY); LED map: scheduled=SCHED ·
publishing=WARN flash · published=OK · failed=FAULT; always ts + T-minus. Video = **UNIT with a rating
plate** (`1080×1920 · 9:16 · 0:15 · H.264 · 12.4MB · REELS`) + variant matrix (one master → N cuts).

## Signature moves (build these — highest leverage)
1. **BOOT / POST sequence** on unit start — POST checklist streams, module LEDs light in sequence, `UNIT READY`.
2. **Live telemetry spine** — persistent console, always moving sub-threshold; the unit is never off.
3. **Fabrication / encode progress** — one segmented-progress component drives scan, render, publish.
4. **Data-flash on change** — live values hard-cut + flash amber one beat.
5. **Engineering marginalia** — part nos, revs, S/Ns, ▢ registration marks, rotated spec strings, rating-plate footer.
6. **Alarm / HALT grammar** — faulting module → red header + 2Hz flash + ACK control; ack → solid.
