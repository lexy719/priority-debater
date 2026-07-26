# PDR Vision → Roadmap

Translation of the PDR vision doc ("The Operating System for AI-Native Businesses") into a
sequenced build plan grounded in the current `priority-debater` codebase. Not a rewrite of the
vision — a delta between what the doc promises and what exists, ordered by leverage.

Status legend: ✅ shipped · 🟡 partial/stubbed · ⛔ not built

---

## The one strategic insight this roadmap is built around

The vision doc treats these as three separate promises:

- **Studio's "AI Interface"** — make a business *machine-readable* (structured catalog, knowledge
  graph, agent endpoints, JSON-LD).
- **Commerce's core wedge** (as actually built) — *"Is your store visible to AI shoppers?"* →
  scan / verdict / fix / recover.
- **The "Business Intelligence Core"** — one structured knowledge model that every downstream
  output derives from.

They are the same object. A store is invisible to AI shoppers **precisely because** it has no
machine-readable interface. The Commerce scanner already *detects* the absence of it; Studio is
supposed to *produce* it; the Business Core is *where it lives*. Build that shared object once and
all three forks light up. That object — call it the **Business Knowledge Model (BKM)** — is the
critical path. Everything else is sequenced around getting it built and flowing.

---

## Current state (grounded in the repo, not the doc)

| Vision stage | Doc v1 scope | Reality in repo |
|---|---|---|
| **Validation** | Idea → full blueprint | ✅ 5-persona debate chamber + `/results` deterministic scoring (`/api/score`, `/api/debate`, `/api/report`). Solid. |
| **Studio** | Digital identity **for humans AND AI** | 🟡 Human side live: `/brand`, `/brand-kit`, `/launch-kit`, `/campaign`, `/landing`, `/ship`. ⛔ AI-interface side (structured catalog, knowledge graph, agent endpoints) does not exist. |
| **Commerce** | Business Brain + Inventory Intelligence Worker (give it objectives) | 🟡 Shipped as a *diagnostic scanner*, not a *worker*: `/scan`, `/commerce/{dashboard,connect,billing,monitor,settings,product}`. Layer 1 (scan) + Layer 3 (PD Agent) live. |
| **Business Intelligence Core** | One knowledge model feeding everything | ⛔ No shared object. Validation session, Studio session, and Commerce localStorage store are three silos. |
| **Cross-stage handoff** | Idea flows Validation→Studio→Commerce | 🟡 Validation→Studio partially seeded (debate weak-point → Brand). Studio→Commerce: none. |

**Positioning fork to resolve first (blocks Phase 3 copy):** the doc sells Commerce as an
objective-driven *AI workforce* ("increase profitability", "expand into Germany"). The repo sells
a *visibility diagnostic*. The diagnostic is the better wedge — it's concrete, free-to-try, and
self-evidently valuable. Recommendation: **keep the scanner as the front door; frame the "worker"
as what the scanner graduates into.** Don't rebuild Commerce around objectives yet.

---

## Phase 0 — Decide & align (no code, ~half a day)

| # | Ticket | Why it's first |
|---|---|---|
| 0.1 | Ratify the BKM-as-critical-path thesis above, or reject it. Everything downstream assumes it. | The whole sequence changes if the shared object isn't the spine. |
| 0.2 | Resolve the worker-vs-scanner positioning. Write the one-paragraph answer into `docs/pd-commerce-full-design.md`. | Phase 3 copy and Commerce IA depend on it. |
| 0.3 | Decide persistence horizon for BKM: localStorage-now / Supabase-later (mirrors current Commerce store pattern) vs Supabase-first. | Determines whether Phase 1 ships a repo or a migration. |

---

## Phase 1 — The Business Knowledge Model (the spine)

Goal: one typed, persistable object that holds mission, products, pricing, audience, tone,
policies, capabilities, goals — the doc's "Business Intelligence Core." Follow the existing
Commerce store pattern: typed entities + localStorage repo behind a hook, mirror-ready for
Supabase.

| # | Ticket | Scope | Depends on |
|---|---|---|---|
| 1.1 | Define `BusinessKnowledgeModel` types in `src/lib/bkm/types.ts` | Mission, products[], audience, pricing, positioning, tone, policies, capabilities, goals. Mirror the field list from the vision "Business Intelligence Core" + "Product Intelligence" sections. | 0.1, 0.3 |
| 1.2 | `src/lib/bkm/store.ts` — localStorage repo + `useBKM()` hook | Copy the `src/lib/commerce/data/store.ts` architecture 1:1 (swap seam intact). | 1.1 |
| 1.3 | Seed BKM from a completed Validation run | On `/results`, offer "Build this business" → writes a BKM draft from the debate output + scored idea. | 1.2, existing Validation |
| 1.4 | BKM viewer/editor page (`/studio/business` or reuse `/brand`) | Human-editable surface for the object. Design-system compliant. | 1.2 |

Exit criterion: a validated idea produces a persistent, editable BKM.

---

## Phase 2 — Studio's AI Interface layer (the missing differentiator)

Goal: turn the BKM into the doc's *machine-readable* outputs. **This is the vision's core
unbuilt promise and it directly feeds Commerce's wedge — highest strategic leverage.**

| # | Ticket | Scope | Depends on |
|---|---|---|---|
| 2.1 | JSON-LD / structured-data generator | Emit `Product`, `Organization`, `Offer` schema.org from BKM products. This is literally "what makes a store visible to AI shoppers." | Phase 1 |
| 2.2 | AI-readable product catalog endpoint | `/api/business/[id]/catalog` — structured product intelligence (who it's for, alternatives, compatibility, constraints) per the "Product Intelligence" section. | 1.1, 2.1 |
| 2.3 | Business knowledge graph / `.well-known` agent metadata | `/api/business/[id]/agent` — capabilities, metadata, agent communication endpoint. Doc's "AI Interface" list. | 2.2 |
| 2.4 | Wire generated JSON-LD into Studio's `/landing` + `/ship` output | So shipped sites are AI-legible by default, not as an afterthought. | 2.1 |

Exit criterion: a business built in Studio ships with a machine-readable interface an agent can
query — and the Commerce scanner (Phase 3) can *verify* it.

---

## Phase 3 — Close the Commerce loop against the BKM

Goal: connect the existing scanner to the shared object and to Studio's output, so the loop
becomes coherent instead of a standalone tool.

| # | Ticket | Scope | Depends on |
|---|---|---|---|
| 3.1 | Point the scanner at BKM-backed businesses, not just external stores | `/scan` accepts an internal business id → scores its Studio-generated AI interface. Closes Validation→Studio→Commerce. | Phase 2 |
| 3.2 | Apply the Phase 0.2 positioning to Commerce copy/IA | Frame scanner as the diagnostic, "worker" as the upgrade path. | 0.2 |
| 3.3 | Fix generator writes back into the BKM | `/api/commerce/fix/generate` improvements update the source object, not just the store. Single source of truth. | Phase 1, 2.2 |
| 3.4 | Inventory Intelligence Worker v1 (doc's MVP worker) — *only if 0.2 says so* | Read-only Q&A over BKM + orders/catalog ("which products are most profitable / running out"). Uses existing `/api/commerce/{catalog,orders}` + PD Agent tool-calling. | Phase 1, positioning |

Exit criterion: one business flows idea → BKM → AI interface → scan → fix → back into BKM.

---

## Phase 4 — Autonomy & the agent-to-agent future (post-release)

Parked until 1–3 prove the loop. Doc's long-term vision (negotiation, autonomous workers,
agent-to-agent transactions). Track as vision, not committed scope. Gated on real usage +
the deferred server/billing tiers already noted in memory.

---

## Sequencing rationale (why this order)

1. **BKM first** because it's the object three forks share; building features before it means
   building three more silos to reconcile later.
2. **Studio AI-interface second** because it's the vision's genuine differentiator *and* it's the
   thing Commerce already sells the absence of — one build, two payoffs.
3. **Commerce loop third** because the scanner already works; it just needs to point at the
   shared object to become a closed loop instead of a demo.
4. **Autonomy last** — everything the doc gets excited about (workforce, negotiation) is
   worthless until there's a real, queryable business object to act on.

## Biggest risks

- **Scope drift back to "AI workforce."** The doc's most seductive framing (give it objectives)
  is the least concrete thing to build. The scanner wedge is what's sellable now. Resolve 0.2 and
  hold the line.
- **BKM over-modeling.** Ship the field list from the doc, not a perfect ontology. Mirror the
  Commerce store pattern and move on.
- **Three-silo entropy.** Every week without the BKM adds another feature that assumes its own
  data shape.
