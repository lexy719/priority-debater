# PDR Commerce (Precision Dynamics Commerce) — settled vision

> **Authoritative product definition, settled 2026-07-24.** Supersedes the retrofit-only framing of
> the earlier commerce fork docs where they conflict. Companion docs: `pdr-vision-roadmap.md`
> (ecosystem), `pd-studio-status.md` (Studio build state).

## Overview

PDR Commerce is the **autonomous operating system for AI-native businesses**. Unlike traditional
ecommerce platforms that provide software for humans to manage stores, PDR Commerce operates as an
intelligent business layer that continuously monitors, optimizes, and grows a company through
autonomous AI workers.

It is the operational half of the Precision Dynamics ecosystem. While PDR Validation determines
whether a business should exist and PDR Studio fabricates the business itself, PDR Commerce becomes
the day-to-day operator responsible for keeping that business alive, competitive, and continuously
improving. Its purpose is not simply to manage an online store — it is to **operate an entire
digital company**.

## Position within the PDR ecosystem

```
IDEA
 │
 ▼
PDR Validation      → validate the business   (produces CONFIDENCE)
 │
 ▼
PDR Studio          → fabricate the business  (produces ASSETS)
 │
 ▼
PDR Commerce        → operate & evolve it     (produces RESULTS)
```

## Core philosophy

The future of commerce will not be driven exclusively by humans browsing websites. Increasingly,
AI assistants will: discover products · compare alternatives · read specifications · evaluate
reviews · recommend purchases · complete transactions · manage subscriptions.

Businesses therefore need two things simultaneously:
1. A compelling experience for human customers.
2. An operational system capable of understanding and responding to both human and AI-driven commerce.

PDR Commerce provides the second layer.

## The autonomous business layer

Traditional businesses rely on disconnected software (Shopify, Google Ads, Meta, Klaviyo,
analytics, CRM, inventory, support) — each requiring human operators. PDR Commerce replaces this
fragmented workflow with autonomous business intelligence.

Instead of asking *"Which dashboard should I open?"*, the owner asks *"How is my business
performing?"* — and the system already knows.

**Continuous operating loop:** `OBSERVE → ANALYSE → DECIDE → EXECUTE → LEARN → repeat`.
Unlike dashboards that require interpretation, Commerce performs the interpretation itself.

Commerce continuously observes: revenue · orders · conversion · inventory · product performance ·
advertising performance · customer behaviour · **AI-agent traffic** · operational health — and
transforms raw data into actions.

## AI workers

Commerce is built around specialised AI workers. Each owns a domain while sharing the same
business intelligence.

- **Marketing Agent** — campaign optimisation, audience segmentation, performance monitoring,
  creative testing, budget recommendations, social strategy, conversion improvements. (Studio
  creates the initial launch campaigns; the Marketing Agent continuously improves them using live
  business data.)
- **Commerce Operations Agent** — inventory monitoring, product lifecycle, catalogue health,
  pricing observations, supplier monitoring, operational alerts, order flow.
- **Future workers** (architecture intentionally expandable): Sales, Customer Support,
  Merchandising, Pricing, Finance, Logistics, Procurement, SEO, AI-Agent Visibility.

## Shared business intelligence

Every AI worker shares the same company memory, **inherited from PDR Studio**: brand identity,
positioning, tone of voice, customer profile, product catalogue, marketing rules (the Brain),
business objectives, pricing strategy, company policies.

> **Commerce never invents a new company. It evolves the company Studio created.**

## Agent-first commerce

Traditional stores optimise for search engines; PDR Commerce optimises for intelligent purchasing
agents. It monitors GPTBot / Claude / Perplexity / Google-Extended / future shopping agents — and
beyond counting visits it measures: AI discovery · product understanding · purchase intent ·
successful AI-driven orders.

**Store intelligence — two customer surfaces, both continuously evaluated:**
- *Human layer:* browsing, brand storytelling, discovery, trust, checkout.
- *AI layer:* structured product data, machine-readable specs, product relationships, policies,
  shipping rules, availability, purchase APIs, agent compatibility.

## Operational awareness

Rather than exposing dozens of disconnected metrics, Commerce builds situational awareness:

```
Revenue ↓  →  Traffic ↑  →  Conversion ↓
              ↓
AI finds: landing page loading slower · competitor lowered prices · inventory delay
```

Instead of merely reporting the issue, Commerce proposes or executes corrective actions
(review-before-publish discipline inherited from the ecosystem).

## Business memory

Every action teaches the business. Commerce records successful and failed campaigns, customer
behaviour, seasonal patterns, product trends, brand decisions, operational knowledge. Over time
the business becomes more intelligent — not because the models improve, but **because the company
learns**.

## Studio ↔ Commerce boundary

| | PDR Studio | PDR Commerce |
|---|---|---|
| Role | **Creates** the company | **Operates** it after launch |
| Produces | brand, identity, website, catalogue, launch ads, initial social, Marketing Brain, AI-readable storefront | monitoring, optimisation, growth, inventory, operational intelligence, worker coordination, continuous marketing improvement, AI-commerce readiness |

Studio builds. Commerce operates.

## User experience

Not a collection of dashboards — a **business command centre**. The owner supervises an autonomous
workforce rather than performing tasks: business status, AI-worker activity, alerts,
recommendations, live telemetry, revenue, operational events. The owner becomes a strategist
rather than an operator.

## Design language (settled 2026-07-24)

Every PDR product wears its own livery over one machine-shop DNA (JetBrains Mono + Anton, square
LEDs, hard cuts, zero radius, instrument density, state-by-treatment). **Commerce = the
OPERATIONS ROOM**: a control room at night, not a forge. Canvas blue-black `#05070A` / panel
`#0A0E14` / well `#030508`, hairlines `#18202C`/`#2A3648`, ink `#E6EDF3`, dim `#7E8B9B`, faint
`#46536A`; **primary = command blue `#4C9AFF`** (Commerce's amber). Status colors shared with the
family (ok `#35C46A`, warn `#F5A623`, fault `#F04438`). Calm cadence — blink only on unreviewed
proposals. First implementation: `/commerce/command`.

## Long-term vision

PDR Commerce is designed for a future where businesses are increasingly autonomous and
transactions are initiated by both humans and AI systems. Its role is not to replace
entrepreneurship — it is to automate the operational complexity that comes after launch.

Together, the three products form a complete pipeline that takes a founder from an idea to a
self-operating AI-native company.
