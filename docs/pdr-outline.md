# PDR (Precision Dynamics) — the platform outline

> Settled 2026-07-25. The one-page answer to "what does PDR do?" — read alongside
> `pdr-commerce-vision.md` (Commerce deep-dive) and `pd-studio-status.md` (build state).

## Thesis

**PDR takes a founder from an idea to a self-operating, AI-native company.** Its bet: the next
commerce customer is as likely to be an AI agent as a human, so businesses must be built agent-
readable from day one and operated by autonomous workers after launch. Three products, one pipeline:

```
IDEA → VALIDATION → STUDIO → COMMERCE
        confidence    assets    results
```

## The three products

### 1 · PDR Validation — the AI venture analyst (`/validation`, `/debate`, `/results`)
- **Job:** decide whether the business should exist. Five-persona debate chamber + audited,
  web-enriched scoring (scoreIdeaV2); shareable reports.
- **Input:** an idea in a sentence. **Output:** confidence — a verdict, scores, weak points.
- **Boundary:** it never builds anything. Its weak-point handoff seeds Studio.
- **Design:** black/cream editorial chamber (existing).

### 2 · PDR Studio — the manufacturing system (`/studio`)
- **Job:** fabricate the entire business from one work order: brand kit (Claude), marketing brain
  (core + company rules + visual world), launch social/ads drafts, video render specs
  (Higgsfield contract), and the **agent-first storefront** — SSR + JSON-LD + feeds + guest
  checkout + order-intent API, published to Supabase.
- **Input:** one line of spec. **Output:** assets — a launchable company.
- **Boundary:** Studio stops at launch. It creates campaigns; it does not run them.
- **Design:** amber machine HMI, locked (`pd-studio-design.md`).

### 3 · PDR Commerce — the operating system (`/commerce/command`)
- **Job:** run the company Studio built, forever. OBSERVE → ANALYSE → DECIDE → EXECUTE → LEARN
  over shared business intelligence. AI workers (Marketing, Operations — components, not the
  product) propose; the owner reviews; automations the owner armed act alone within bounds.
- **Views:** Dashboard · Marketing · Operations · AI Commerce · Products · Customers · Business
  Brain · Automation · Events · Settings.
- **Unique surface:** AI Commerce — the agent funnel (crawls → retrievals → orders), readiness
  score, per-product AI visibility. Nobody else measures this end to end.
- **Boundary:** Commerce never invents a company; it evolves the one Studio created.
- **Design:** Swiss Editorial Ledger, locked v3 (`pdr-commerce-design.md`, chosen 2026-07-25).

## The shared spine (what makes it one platform)

- **Business intelligence in Supabase Storage** — stores/, brains/, orders/, hits/, activity/,
  automations/: Studio writes it, storefronts serve it, Commerce operates it. One record, no sync.
- **The Marketing Brain** — core craft rules + Claude-generated company guidelines + visual world
  + owner-taught rules + performance-learned rules; steers every generation everywhere.
- **Agent attribution** — every store surface classifies its readers (GPTBot/Claude/Perplexity/…)
  and every order records its channel; the only analytics PDR shows are measured ones.
- **Honest-data doctrine** — no simulated numbers on any Commerce surface; unconnected
  integrations say so in words. (Post-Icon.com credibility position.)

## Non-goals (explicit)

Not a Shopify replacement for existing human stores (retrofit is a wedge, not the product) ·
no full-autonomy claims — review-before-publish everywhere · no vanity analytics · imagery/video
generation is Higgsfield's lane, never Claude's.

## External gates (in order)

1. Public hosting + auth ownership → real agent traffic, feed submission (Google Merchant ·
   chatgpt.com/merchants · Perplexity), shareable stores.
2. Higgsfield key → real ad renders through the existing spec/QA contract.
3. Ad-platform + social connections → Marketing monitoring & delivery go live.
4. Payments (UCP/ACP rails + Stripe) → orders become transactions.
