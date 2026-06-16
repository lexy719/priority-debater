# Product Breaker — Landing Page

## Original Problem Statement
"Create a landing page: fully redesign the landing page. I like the hero but the rest needs a proper redesign."

The project started as boilerplate; the supplied reference screenshot was the design source. Built a full brutalist/editorial marketing landing page for **Product Breaker (PB)** — an AI advisory panel that debates/stress-tests a startup idea until it "breaks" (five ruthless AI advisors → one investor-grade dossier in ~120s).

## Architecture
- **Frontend only** (React 19 + Tailwind + framer-motion + lucide-react). No backend/DB/auth required.
- Single route `/` in `App.js` assembling modular section components under `src/components/landing/`.
- Design tokens: cream `#F4F4F0`, ink `#0A0A0A`, red `#FF3B30`, yellow `#FFD60A`, blue `#007AFF`, green `#32D74B`. Fonts: Anton (display), Archivo (body), JetBrains Mono (labels). Hard offset shadows, engineering grid backgrounds.

## User Persona
Early-stage / pre-product founders who want blunt, objective idea validation before building.

## Implemented (2026-06)
- Navbar (sticky, mobile menu), Hero (preserved aesthetic + live scoring-panel mock), kinetic marquee.
- "Drop the pitch" black section with terminal input mock.
- "Five Agents. Five Voices. One Verdict." — 5 advisor cards with per-agent accent hover.
- "Every chart earns its place" — 8-card dossier bento + 2 trust cards.
- "Idea in. Verdict out." — 3-step process grid.
- Pricing — Starter €19 / Builder €49 (featured) / Founder €99.
- FAQ accordion (6 Q&A), final CTA black section, editorial footer.
- All interactive elements carry data-testids. Verified by testing agent at 100% (desktop + mobile), no console errors.

### Post-validation business-creation flow (2026-06, MOCKUP — no AI yet)
Brand aligned to **Priority Debater / PD**. Shared flow chrome: ticker bar + 6-step stepper nav (Validate→Debate→Results→Brand→Launch→Ship). Landing CTAs now lead into the flow at /brand-kit.
- **/brand-kit** — identity: name (MINUTA) + alternates + rationale, wordmark/monogram, tagline options, one-liner + boilerplate (short/long), color palette, typography, voice & tone (do/don't). Copy buttons throughout.
- **/launch-kit** (the execution bridge) — §01 Product page copy + live preview & pricing; §02 Acquisition plan (exactly 3 channels w/ cadence + sample message); §03 First outreach pack via tabs (20 cold messages, 5 Reddit posts, 5 X hooks) each copyable; §04 Offer framing (Founding-10, beta invite script, urgency, guarantee).
- **/ship** — interactive 24-hour launch checklist with live progress %, full-pipeline journey recap (links back to each stage), summary + export-PDF CTA (button is UI-only).
- Example idea carried through: AI legal-document drafting SaaS for Iberian law firms. Verified by testing agent at 100%.

## Backlog / Next
- **P0 (the real upgrade):** Wire Brand Kit, Launch Kit, Campaign and Landing generator to OpenAI (GPT-4.1) so all output is GENERATED from the user's actual validated idea instead of the MINUTA mock. In the Next.js repo these are API routes; here they'd be FastAPI endpoints + Emergent LLM key.
- **P1:** Real auto-posting for Campaign (X/LinkedIn/Reddit OAuth + scheduler) — currently "Connect"/"Auto-post" are toast placeholders.
- **P1:** Make "Export full launch kit (PDF)" and a downloadable .html (Landing generator) actually export/download.
- **P2:** DRY the inline Label/Card primitives across flow pages; derive outreach/tab counts from data.
