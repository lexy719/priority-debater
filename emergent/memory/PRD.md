# Priority Debater — Static UI/UX Prototype

## Original Problem Statement
Build a static UI/UX prototype (landing page experience) for an AI commerce visibility tool called **Priority Debater**. NO backend, NO API calls, NO real data — everything hardcoded with realistic mock data. Pixel-perfect, aggressive editorial / Bloomberg-terminal / hacker-zine aesthetic. Five separate routes, `/commerce` as entry. Logic to be wired later by the user.

## Design System (implemented in `src/index.css`)
- Pure black `#000000` bg, white text, gray `#888`/`#555`, single accent red `#E8272A`, borders `#1A1A1A`/`#333`, card bg `#0A0A0A`, success green `#22C55E`, warning amber `#F59E0B`.
- Headlines: **Anton** condensed display, uppercase, clamp 35–120px. Signature move: one keyword per headline wrapped in a red box (`.pd-box` / `<Box>` component).
- Module labels: 11px JetBrains Mono uppercase `→ MODULE 01 / NAME`. Body Inter 14–16px. Data/URLs mono 12–13px.
- Sharp corners everywhere (no radius), no gradients, no shadows. Buttons `.pd-btn-primary` (red) / `.pd-btn-secondary`. Status pills MISSING/LIVE/FAIL. Full-width red marquee ticker. Red 1px section dividers. Max width 1400px.

## Architecture
- Frontend-only React (CRA + craco). Routes in `src/App.js`; `/` → `/commerce`.
- Pages: `src/pages/Landing.jsx`, `Scanning.jsx`, `Verdict.jsx`, `Agent.jsx`, `Monitor.jsx`.
- Shared: `src/components/Nav.jsx` (Box, MinimalNav, FullNav, Marquee), `src/hooks/useCountUp.js`.
- Monitor line chart uses `recharts` (animation disabled for static render).
- No backend, no DB, no env-dependent calls. All data hardcoded.

### Note: craco.config.js fix
Template had a webpack-dev-server v5 vs react-scripts v4 incompatibility (`onAfterSetupMiddleware`, `https`). Patched the `devServer` override in `craco.config.js` to translate legacy options. Frontend now compiles cleanly.

## Implemented (2026-06-22)
- PAGE 1 `/commerce` — Landing: minimal nav, full-viewport hero, 3-line headline w/ [COMPETITORS] red box, live ticking counter (starts 847,392), URL input + SCAN CTA, 3 social-proof lines.
- PAGE 2 `/commerce/scanning` — 7 scan check lines (staggered), giant red "22" score, verdict CTA.
- PAGE 3 `/commerce/verdict` — full nav + red marquee ticker, 4 findings (AI chat card + query pills, cost €14,000/mo, 5 competitor cards, 7 FAIL issue rows + fix CTA).
- PAGE 4 `/commerce/agent` — score widget 22→47, 7-item fix queue (3 done / 1 in-progress w/ console / 3 pending), halfway email banner, 3 projected-outcome cards.
- PAGE 5 `/commerce/monitor` — 4 hero stat cards, recharts score line (22→47), AI agent activity table, competitor change grid, "this week's move" outreach card.

## Verification
- All 5 routes visually verified via screenshots (desktop). Design system applied consistently.
- Animations made non-gating (content always visible) so headless/throttled environments still render final state; counters/marquee/pulse remain live for real users.

## Redesign — Blue/Cream Design Language (2026-06-22)
Applied to verdict, agent, monitor pages (verified 100% by testing agent at 1440px + 390px):
- **Color system overhaul**: electric BLUE `#2D6BFF` is now the primary accent (headline boxes, PD logo, active nav, CTAs, score gains, chart line). RED `#E8272A` restricted to danger/fail/missed (FAIL pills, scanning score 22, MISSED €14k, ticker, "Your Store" card border, MOVING UP pill). YELLOW `#F5C842` = exactly ONE primary CTA per page. CREAM `#EDE6D8` full-section backgrounds.
- **Section rhythm**: each page alternates BLACK ↔ CREAM via shared `<Section variant>` (Blocks.jsx), each with an "N" corner marker.
- **New components** (`src/components/Blocks.jsx`): `Section`, `Meta` strip (`→ 01 / …`), `DataCard` (colored square + rank label + big number + microstats + arrow), `Steps` (numbered 01–04 how-it-works).
- **Per page**: Verdict = 4-step block + 5 competitor cards + 7 white FAIL cards + yellow "LET THE AGENT FIX IT". Agent = blue 22→47 widget + 7 fix cards (file badge/microstats/progress) + yellow SUBMIT. Monitor = 4 stat cards + blue chart line + cream activity table + yellow "OPEN THE OUTREACH KIT".

## Storyboard Content/Flow Rewrite (2026-06-22)
Aligned all 5 pages to the emotional journey storyboard (design kept, copy/flow rewritten; verified by testing agent iteration_2):
- **Landing (hook)**: headline "While you were working on your store, AI started recommending your competitors"; blue live counter ("…in the last 60 seconds…"); CTA "SEE IF YOURS WAS ONE OF THEM"; social-proof footer removed (gut-punch minimalism).
- **Scanning (suspense)**: 5 narrated terminal lines appear 0.8s apart (blinking cursor), then a BARE red "22" (no label, no button), then AUTO-ADVANCES to /commerce/verdict after ~2s via setTimeout.
- **Verdict (3 brutal facts)**: Fact 01 The Miss (AI named 5 stores, you 0/5) · Fact 02 The Cost (340K → 2,800 → captured 0, ~€14k missed, cream) · Fact 03 The Gap (simple bar chart 62/58/51 vs red 22). Single soft yellow CTA "SEE WHY — AND WHAT THE AGENT FIXES FIRST". Removed numbered-steps + competitor-card grid.
- **Agent (watch it work)**: plain-English fix titles + one-line meaning + status (green ✓ / blue → / red ✕); each done card has a collapsible generated-file block with a Copy button; halfway email banner after fix 3.
- **Monitor (home base)**: added AI-channel feed line ("an AI agent visited your store 23 times…"), score narrative ("invisible → 2 of 5 buyer queries"), Colmol moved 51→65 (+14).
- **Bug fixed**: Agent Copy button now `.catch()`es the clipboard `writeText()` promise (sandboxed iframes rejected → unhandled rejection → dev error overlay). Resolved.

## Data-Intelligence Charts Upgrade (2026-06-22)
Took visualizations "to another level" (recharts, terminal aesthetic; verified iteration_3, all render with real data marks, 0 console errors):
- New `components/Charts.jsx` toolkit: `ChartCard`, mono `DarkTooltip`, `LegendDot`, shared axis styling.
- **Monitor → "02 / INTELLIGENCE / DEEP READ"** now has 6 charts: (1) Score trajectory vs rivals (ComposedChart: blue You area + rising-red Colmol + Saatva/Purple lines + dashed benchmark), (2) AI Visibility radial gauge (47/100), (3) AI agent visits — 7-day stacked bar by agent, (4) Buyer-intent funnel (23→14→6→3), (5) Buyer query coverage (5 queries, green=named / red=not), (6) Agent-readiness radar (You vs rival avg, 6 signals).
- **Verdict → Fact 03 The Gap** upgraded to a recharts bar chart (value labels, red dashed "RIVAL AVG 57" reference line, You-bar red) plus two stat callouts (−40 to leader, −35 vs benchmark).

## Backlog / Next Action Items
- P1: Real responsive QA on physical mobile breakpoints (CSS uses clamp + Tailwind stacking; spot-check on device).
- P1: Wire the SCAN form, email capture, and CTAs to real logic/backend when ready.
- P2: Optional — restore scripted scan-line sequencing + score count-up gated behind page-visibility for the dramatic build when a real backend drives timing.
- P2: Add favicon/branding + meta title "Priority Debater".
