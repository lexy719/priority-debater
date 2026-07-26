# PD Studio — merge/port plan

Merging two existing products into **one** PD Studio inside `priority-debater`:

- **Old PD studio** (in-repo): fast OpenAI *business-identity* generation — brand kit, launch kit,
  campaign — with a solid flow spine (`useFlowIdea`/`useFlowPayload`, `FlowGuard`, credits,
  idea-keyed localStorage cache). Its website step (`buildLandingHtml` + the orphaned
  `landing-templates`) is the weak link.
- **web-design-agent ("Loam")** at `C:\Users\manue\teste\web-design-agent`: a sophisticated
  *website generator* — brief → clarifying questions → grounded concepts → art-direction →
  per-section retrieval-grounded generation (RAG over a design knowledge base) → visual critique.
  LLM = Anthropic Claude; embeddings = Ollama; KB = better-sqlite3 + sqlite-vec.

**They're complementary, not redundant.** Loam becomes the website-generation core; the old
studio's identity generators + flow spine wrap around it. One product.

## Architecture decision (the hard constraint)

Loam's engine **cannot run in Vercel serverless**: native `better-sqlite3`/`sqlite-vec`, a local
Ollama embedding daemon, minutes-long multi-LLM generation (function timeouts), filesystem writes,
and a spawned `vite build`. Forcing it into Next API routes fights the platform.

**Decision:** PD Studio is one product *surface* in `priority-debater` (Next) that drives the Loam
engine running as a **Node service** — locally now (`studio/server.ts` already serves it on :3001
with its SSE contract), a hosted long-running service later (Render/Railway/Fly/VM, not Vercel
functions). One repo, one product; the engine stays where it runs well.

Provider note: identity generators are OpenAI, Loam is Anthropic Claude. Both are plain `fetch` —
no conflict.

## The merged product IA (Business-Brain-centric — per the PDR Studio vision doc)

The vision reframes Studio around **the Business Brain**: one structured source of truth (mission,
vision, products, customers, positioning, tone, policies, pricing, capabilities, knowledge) from
which every asset derives. This is the same object the roadmap calls the **BKM** — Studio is where
it's created. **Studio creates the business, not marketing** — so the old studio's
launch-kit/campaign are intentionally *out* of the v1 model.

**Current definition (per the user).** PD Studio is the **visual / marketing product**: brand
visuals → autonomous marketing campaigns → social posts → and finally a **store-ready platform**
handed to the **web-designer (Loam)** to build. One `/studio` workspace with a clickable stage rail;
describe a business once → walk the pipeline:

| # | Stage | What it produces | Source | Status |
|---|---|---|---|---|
| 01 | **Brand & visuals** | name, palette, type, voice + the Brain facets | `/api/brand-kit` (OpenAI) | **wired** |
| 02 | **Marketing** | autonomous multi-channel campaigns + ad creatives | demo now; `/api/campaign` when funded | **wired (demo)** |
| 03 | **Social media** | ready-to-post content per platform, in the brand voice | demo now; generator when funded | **wired (demo)** |
| 04 | **Platform & store** | store-ready product backend + live agent endpoints, handed to the web-designer | `src/lib/studio/aiStorefront.ts` + `src/app/api/store/demo/*` | **wired (demo)** |

The **platform/store** (stage 04) is agent-first: real products an AI queries over live HTTP
endpoints (`/api/store/demo/{catalog,products,llms}`), structured JSON not HTML, CORS-open, carrying
schema.org JSON-LD + `llms.txt` + an agent catalog — the handoff to the web-designer (Loam), and the
same store PDR Commerce's AI workers operate. Marketing/social now use labelled demo content until
OpenAI is funded (Loam runs on Anthropic). The Business Brain remains the source-of-truth block
inside stage 01. Old `buildLandingHtml` + orphaned `landing-templates` are superseded.

### The web-designer handoff is LIVE ✅

Stage 04 now actually invokes the Loam engine. `WebDesignerBuild` (`src/app/studio/page.tsx`)
POSTs to the Loam service `${NEXT_PUBLIC_WEBDESIGNER_URL || http://localhost:3001}/generate`, opens
the SSE stream, and renders the real pipeline live (plan → art-direction → sketch → grounds →
per-section generation → write → visual pass → preview iframe). Verified end-to-end: a coffee brief
streamed "Plan · Canopy Coffee · 7 sections", live color-repair, and art-direction — real Anthropic
generation, unaffected by the dead OpenAI quota.

**Fix that unblocked it:** `web-design-agent/studio/server.ts` `runPipeline` was stale — it skipped
the **sketch** and **grounds** stages and called `generateSections`/`writePage` with old 3-arg
signatures. Patched to match `engine/agent/run.ts` (added `sketch()` + `planGrounds()`, 5-arg
calls). `npx tsc --noEmit` clean.

**To run:** start the engine service — `cd web-design-agent && npm run studio:server` (needs Ollama
up + its Anthropic keys in `.env`, both already configured locally). Then Studio → stage 04 → Build
storefront.

## Stages

1. **Unified PD Studio shell** *(done)* — new `/studio`, PDR-styled (white, Anton, JetBrains Mono,
   blue accent, zero radius; matches the landing). Loam-style entry → workspace with the 6-output
   Brain-centric rail. Wired to `/api/brand-kit` (Brand); Business Brain seeded from its facets and
   shown as the source-of-truth block. Demo fallback when OpenAI quota is dry.
2. **Business Brain generator** — a dedicated model/endpoint that produces the full structured Brain
   (mission, vision, products, customers, policies, pricing, capabilities…) as the persistent source
   of truth, with Brand derived from it. This is the BKM from `pdr-vision-roadmap.md` — the spine.
3. **Website = AI-native storefront** (output 03) — the focus per the user: generate sites built for
   AI agents / AI shopping, not just humans. **Key finding:** Loam's current output is a
   client-rendered Vite SPA (`<div id="root">`, generic title, zero structured data) — *invisible to
   AI shopping agents*, the exact defect the Commerce fork diagnoses. So the differentiator is the
   **AI-native envelope**: content rendered in HTML + schema.org JSON-LD (Org/Product/Offer) +
   `/.well-known/agent-catalog.json` + `llms.txt`.
   - **Done:** `src/lib/studio/aiStorefront.ts` (`buildStorefrontHtml` / `buildJsonLd` /
     `buildAgentCatalog` / `buildLlmsTxt`) — pure fns from a Brand/Brain → a self-contained,
     agent-legible storefront. Wired into `/studio` as the Website stage (preview + JSON-LD +
     agent-catalog + llms.txt tabs), verified end-to-end on the demo Brain.
   - **Next:** layer the **Loam design engine** *inside* this envelope — run Loam as a service,
     stream its `StudioEvent` SSE for the rich human design, then bake the AI-native layer around its
     output (SSR content + structured data) so every generated site is both beautiful and
     agent-legible. Feed it the Brain. (Loam runs on Anthropic — Ollama up locally, KB built; re-embed
     off Ollama only if hosted.) Real products (stage 04) replace the demo catalog.
4. **Products · Knowledge · AI interface** (outputs 04–06) — product intelligence, docs/policies, and
   the machine-readable interface (schema.org/JSON-LD, knowledge graph, agent endpoints) — all off
   the Brain, and the handoff surface into PDR Commerce.

## Loam engine — the UI contract to target (from `studio/server.ts`)

SSE `StudioEvent` union the Studio preview will consume:
`run-start · plan{brand,mood,sections,layout} · art-direction{palette,motion,rationale} ·
section{index,sectionType,strategy} · notice · log · done{previewUrl,fileCount} · error`.
Endpoints: `POST /questions`, `POST /concepts`, `POST /generate`, `GET /generate/:id/stream`.
Port orchestration from `engine/agent/run.ts` (the server's pipeline wiring is stale), keep the SSE
contract as the UI API.
