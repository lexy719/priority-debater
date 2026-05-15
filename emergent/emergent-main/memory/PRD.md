# Idea Validation Results Dashboard — PRD

## Problem Statement
High-end, production-level "Idea Validation Results" dashboard for an AI idea validator
tool. Must feel like a premium Dribbble / Stripe-level dashboard that investors would
trust. Brutalist editorial direction matching the provided IDEA DEBATER landing page
references (black/white/yellow, condensed display type, monospace metadata, grid backdrops,
sharp brutalist borders with hard shadows).

## User Choices
- Style: Brutalist editorial (matching IDEA DEBATER landing)
- Data: Frontend only with mock data
- Theme: Mixed (alternating light/dark sections like reference)
- Charts: recharts

## Implemented (2026-02-12)
- Single-page dashboard `/` rendering full validation report
- Sections (in order):
  1. Navbar (sticky) + ticker tape
  2. ScoreHero — Idea title + verdict/confidence/rank + huge 82/100 score with mini line chart
  3. MetricsStrip — 6 cold metrics (Viability/Confidence/TAM/SAM/SOM/Competitors)
  4. MarketSection — TAM/SAM/SOM area chart 2024→2030 + 4 market signals
  5. RiskSection — Radar chart (6 dims) + 5-row severity breakdown
  6. CompetitionSection — Scatter quadrant + comparison table (5 competitors + YOU)
  7. RevenueSection — 5-yr stacked bar (hardware/SaaS) + 3-tier pricing
  8. AudienceSection — Donut pie of segments + 3 buyer personas
  9. SWOTSection — 4-block SWOT (S/W/O/T) alternating ink/light
  10. RecommendationsSection — 5 P0/P1/P2 ranked actions with impact/horizon
  11. PersonaVerdicts — 5 color-slashed persona cards + aggregate verdict bar
  12. Footer
- Fonts: Anton (display) + JetBrains Mono (meta) + Inter (body)
- Custom utilities: `.shadow-brutal`, `.hl-strip`, `.bg-grid`, `.ticker-track`, hover-lift
- data-testid coverage on all major interactive/data elements
- recharts: AreaChart, LineChart, RadarChart, ScatterChart, BarChart, PieChart

## Architecture
- `/app/frontend/src/pages/IdeaValidation.jsx` — page composition
- `/app/frontend/src/components/dashboard/*.jsx` — 13 section components
- `/app/frontend/src/data/mockData.js` — single source of mock data
- `/app/frontend/src/index.css` — brutalist design tokens + fonts
- No backend changes (frontend-only feature)

## Backlog
- P1: Persona debate transcript modal (Open Debate Panel CTA wired)
- P1: PDF export (button stub present)
- P2: Connect to real Claude Sonnet 4.5 backend for live idea validation
- P2: User auth + saved reports list
- P2: Re-run validation flow
- P2: Mobile-specific polish for huge display text on <400px screens
