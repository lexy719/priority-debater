# PD Studio — design brief (working spec)

Distilled from the Loam knowledge base (`web-design-agent/knowledge`: guidelines, hierarchy-patterns,
visual-rhythm, layout-patterns, and critiques of Linear, Stripe, Vercel, Aesop, Pentagram, Teenage
Engineering, Norm Architects). This is the spec for redesigning PD Studio from a utilitarian form
into a premium web-design product.

**North star:** *Precision as atmosphere (Linear) inside a gallery wall that disappears (Pentagram).
The founder's generated work is the only thing allowed to be loud; the shell is space, one blue
accent, and engraved type doing everything else quietly.*

## Principles that make it feel expensive
1. Restraint = one expressive element (the blue), everything else muted. The mute is the craft.
2. When content is the product, the container disappears — spend expression on the artefact.
3. **Space separates; borders are a last resort** (space → ground shift → shadow → border).
4. Hierarchy = size + weight + **isolation** + position (not size alone).
5. **One anchor per view** — one thing designed to be seen first; two anchors cancel.
6. Emphasise by de-emphasising neighbours (contrast is a fixed budget).
7. One violent scale jump (4–6×) beats many gradual steps.
8. Internal density contrast: dense controls beside an over-roomy artefact — the gap is the composition.
9. Motion below the threshold of nameable; texture, not events.
10. Every edge pair flush or decisively apart — never the ambiguous 8–12px middle.

## Layout rules (step 1)
- **Shell:** ~280px rail : fluid canvas. Rail separated by a **1–2% ground shift** (rail `#FAFAF9`,
  canvas `#FFFFFF`) — **no border box**. Canvas gets big margins (px ~16→24) and air.
- **Rail = engraved index**, not a bordered list: stage number (mono, muted) + name (sans, sentence
  case, 15px/500). State by isolation + weight + value — active = ink+600+blue tick+more space; done
  = muted+check; upcoming = lightest. No pills, no boxes. Sub-label bound tight to its stage.
- **Canvas:** cap the content measure (prose ≤65ch; artefact may run wider). Never pin a narrow
  column left with dead space beside it. One anchor per stage (e.g. the brand name staged as a lit
  object) with a violent scale jump; step neighbours down.
- **Break the grid exactly once per view** (≥15–20% past the boundary) — e.g. the anchor bleeds past
  the content column, or a numeral hangs into the rail margin.
- **Transitions:** cross-fade canvas on stage change (~220ms, cubic-bezier(0.22,1,0.36,1)); rail
  static — the founder moves *within* one continuous surface.

## Spacing & rhythm (4px base)
Scale: `4 8 12 16 20 24 32 40 48 64`. Related items = 1 step apart; groups = 2+. **Space ABOVE a
heading > below it.** Intra-group gap ≤ ½ inter-group gap. Most-important region gets the most air,
not the most decoration. Panel padding 20–24px; heading→body 8–12px; icon→label 8px.

## Type system
- **Anton** — display only (≥28px): stage titles, the one anchor, big numerals. Tracking −0.02/−0.04em.
- **Inter (sans)** — the workhorse: all labels, body, controls, descriptions. Labels **sentence case,
  13px/500** — NOT uppercase mono. Body 14–15px/400, line-height 1.5, max 65ch.
- **JetBrains Mono** — machine-facts ONLY: numbers, hex, status, model, index, timestamps, paths;
  `tabular-nums`. Engineering marginalia at the artefact's edges, not a separate labelled column.
- Scale ratio 1.2–1.25; **4–6 sizes total**; hierarchy from weight+colour+space, not more sizes.
- One violent Anton jump (~4–6× body) per view. Blue = one accent + one CTA per view.

## Basic tells to kill
Hairline-box-everything → space/ground shift. Mono-uppercase-micro-labels-everywhere → sentence-case
sans (mono only for data). Uniform density → dense-controls/roomy-artefact. Near-alignment → flush or
far. Rail-as-feature-list → engraved index. Metadata-in-a-column → annotations at the artefact edge.
