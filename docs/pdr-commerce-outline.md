# PDR Commerce — functional outline (what it DOES)

> v2 · settled 2026-07-25 after owner review. The build contract for the product. Vision prose in
> `pdr-commerce-vision.md`; design in `pdr-commerce-design.md`.
> Legend: ✅ works today · 🟡 partial today · 🔑 gated on an external connection.

## The job

**Commerce is the operating system for the company — closer to an AI COO than a commerce
dashboard.** Every measurable part of the business flows into Commerce. Commerce understands the
business continuously, explains it clearly, recommends improvements, executes approved work
through specialised AI workers, and becomes smarter from every outcome. It serves **both customer
surfaces — AI shoppers AND humans — never only AI.**

## The workforce (the internal architecture)

Externally Commerce presents capabilities; **internally it is an AI workforce**: specialised
workers over one shared business intelligence. Every worker has status, current focus, recent
actions, and a review queue; the owner supervises, the workers operate.

Active: **Marketing** · **Social** · **Operations/Inventory**. Designed-for: Sales, Support,
Advertising, Analytics, **Finance**, Merchandising, Logistics — each plugs into the same
intelligence and the same review discipline.

## Capabilities

### 1 · Watches the business (OBSERVE)
- Every store read, classified by reader — AI agents (GPTBot, ClaudeBot, PerplexityBot, Gemini…)
  **and human visitors** — per surface and per product. ✅
- Every order in a lifecycle (received→confirmed→shipped→delivered/cancelled) with its channel. ✅
- Live inventory: orders decrement stock; availability never lies to agents or humans. ✅
- Customers derived from orders (LTV, repeat). ✅ · 🔑 connected-channel campaign data.

### 2 · Explains the business (ANALYSE)
- On-demand situational reads: posture (GROW/HOLD/FIX), headline, findings that cite their
  numbers; refuses thin data. ✅ Extends to financial and marketing explanations as those
  capabilities' data lands.

### 3 · AUTONOMOUS MARKETING — a core product, not a feature
Commerce continuously measures marketing performance across every connected channel. It **drafts
campaigns, creatives, landing pages, videos and advertisements grounded in business knowledge and
measured results.** Campaigns may be approved manually or executed automatically within
predefined limits.
- Today ✅: brain-governed copy grounded in the live catalog (draft desk); shot-level video render
  specs with lint (the Higgsfield contract); audience learning via measured performance → rules.
- 🔑 channel execution: ad accounts (budgets, pausing, scaling winners, ROAS/CAC/CTR), Higgsfield
  key (rendered creatives), experiments across variants, landing-page generation into the store.

### 4 · SOCIAL PRESENCE — content, not just ads
Automatic posting, continuous content generation, short-form video, a maintained social presence.
- Today ✅: per-platform content generation through the brain; video specs. 🔑 scheduled
  auto-posting via platform/aggregator connections; engagement analysis feeding LEARN.

### 5 · FINANCIAL INTELLIGENCE — the business, not just sales
Revenue, profit, margin, expenses, cash flow, inventory value, subscription revenue, forecasts.
- Today 🟡: revenue (measured), revenue/day, inventory value (stock × price), subscription vs
  one-off mix from the catalog. Planned: per-SKU costs → margin (owner inputs in Settings),
  expense records, cash-flow view, forecasts once history is deep enough to be honest.
- Surfaces as a **Finance view** (11th view) and a Finance worker.

### 6 · MANAGES the website — not merely observes it
Commerce operates the storefront directly: **pricing, products, availability, policies, future
content** — every change appears instantly in the live store's pages, JSON-LD and feed, for
humans and agents alike. Today ✅: restock, price adjustment, availability flips, policy edits.
Planned: product create/retire, content scheduling, landing pages.

### 7 · Proposes and acts (DECIDE → EXECUTE)
- Worker checks → reviewable proposals with severity. ✅
- One-click executes + **owner-armed automations** (IF measured metric THEN bounded real actions,
  rate-limited, fully logged). ✅ Autonomy is always explicit: manual approval or predefined
  limits — never silent. 🔑 spend-side actions follow their connections.

### 8 · Learns (LEARN)
- Outcomes distilled into evidence-citing rules; layered brain (core / company / taught /
  learned) + visual world steers every future draft, spec and decision. ✅

### 9 · AI Commerce — the differentiating instrument
The agent funnel (crawls → product retrievals → feed pulls → agent orders → rate), per-product AI
visibility, the readiness score (JS-off self-crawl). ✅ · 🔑 feed submission needs hosting.
This instruments the AI surface; the human surface gets the same care (speed, accessibility,
usability, conversion).

## The workspace

Dashboard · Marketing · Operations · AI Commerce · Products · Customers · Business Brain ·
Automation · Events · Settings · **Finance (next view to add)**. Each view is a capability
arranged; worker identity stays visible (queues carry their worker's name and voice).

## The fence

Never invents a company (Studio's job) · never renders simulated numbers — unconnected sources
say so in words · never publishes or spends without review or a pre-armed bound · **prioritizes
structured information that AI systems and humans can both understand, rather than chasing
search-engine tricks or vanity SEO metrics.**
