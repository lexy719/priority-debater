# Priority Debater

AI-powered startup idea validation platform. Submit any business idea and get a structured stress-test from 5 specialized AI personas — Investor, Customer, Operator, Mentor, and Adversary — each challenging your idea from a different angle.

**Live demo:** https://priority-debater.vercel.app

---

## What it does

- **5-persona validation** — Each persona runs a separate interview thread, so you get focused criticism from each angle instead of one muddled chat
- **Viability score** — Structured 0–100 scoring across 6 dimensions: problem-fit, market, competition, business model, execution, and timing
- **Market analysis** — TAM/SAM/SOM sizing, competitive landscape, and risk flags
- **Lean canvas generation** — Auto-generated from your validation session
- **Debate mode** — Defend your idea in real-time against adversarial questioning
- **Export** — PDF, Markdown, or shareable link

## Tech stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + Framer Motion
- **AI:** OpenAI GPT-4.1 (plus GPT-4.1-mini for blind scoring)
- **Deployment:** Vercel

## Getting started

```bash
npm install
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key product decisions

**Separate interview threads per persona** — The most important UX decision. One combined chat would produce averaged, hedged responses. Separate threads let each persona stay in character and give sharper, more useful feedback.

**Dual-pass scoring** — GPT-4.1 generates responses; a separate GPT-4.1-mini blind pass scores independently to reduce bias.

**No signup required** — Reduces friction to zero. Sessions are stored in localStorage for 24 hours.

## Project structure

```
src/
├── app/
│   ├── api/debate/     # Core AI streaming endpoint
│   ├── validate/       # Idea submission form
│   ├── results/        # Validation results dashboard
│   ├── debate/         # Live debate mode
│   ├── journey/        # Guided onboarding flow
│   └── brand/          # Brand studio (logo + landing generator)
├── components/         # Shared UI components
└── lib/                # Session management, streaming, types
```

## Environment variables

```
OPENAI_API_KEY=
```
