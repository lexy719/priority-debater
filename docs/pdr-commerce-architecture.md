# PDR Commerce
## The Operating System for Autonomous Online Businesses
**Version 1.0 — Architecture & Product Specification**

Authored by the founder, 2026-07-27. **This is the authoritative specification for PDR Commerce.**
It supersedes `pdr-commerce-v5.md` (the workforce draft) as the statement of what Commerce *is*.
`pdr-commerce-design.md` remains authoritative for visual craft. `pdr-commerce-business.md`
remains the market evidence and go-to-market, and §18 below reconciles the two.

---

## 1. Philosophy

Businesses are changing.

For the last thirty years, businesses have been operated by humans using software. Tomorrow,
businesses will increasingly be operated by AI workers using software.

- Customers will increasingly buy through AI assistants.
- Marketing will increasingly target AI retrieval systems.
- Customer support will increasingly be handled by AI.
- Inventory decisions will increasingly be made by AI.
- Pricing will increasingly be adjusted by AI.

Businesses are no longer simply becoming digital. **They are becoming autonomous.**

The problem is that every AI tool operates independently. One writes content. Another manages
ads. Another answers customers. Another adjusts prices. Another manages inventory.

None of them truly understand the business. None of them coordinate with each other.

Someone has to. **That is PDR Commerce.**

## 2. Mission

PDR Commerce is the operating system that controls an autonomous online business.

Not another AI tool. Not another dashboard. Not another chatbot.

It is the central intelligence that coordinates every AI worker, every business system, every
store, and every customer interaction.

> If Studio builds the company, **Commerce operates it.**

## 3. Core Principle

**Commerce does not replace existing software. It controls it.**

Commerce does not replace Shopify, WooCommerce, Stripe, Meta, Google Ads, Klaviyo, Mailchimp,
ERP systems or warehouse software. It sits above them.

```
Business Owner
      ↓
  PDR Commerce
      ↓
AI Workers + Business Software
      ↓
   Customers
```

Commerce becomes the brain. Everything else becomes muscles.

> **Why this matters strategically.** Every platform below Commerce is a competitor if Commerce
> duplicates it, and an asset if Commerce operates it. When Shopify shipped free agent
> syndication in June 2026 it did not erode Commerce — it gave Commerce a stronger muscle. This
> principle is what makes the position durable against platform feature releases.

## 4. The Business Brain

Commerce maintains a complete understanding of the business. It knows:

Brand · Mission · Products · Margins · Customers · Suppliers · Marketing · Inventory · Pricing ·
Sales · Expenses · Policies · Returns · Shipping · Analytics · AI Traffic · Goals

Every AI worker receives its knowledge from Commerce. **Nobody invents information
independently.** Every worker uses the same business memory.

## 5. Departments

Commerce organizes the company exactly like a real company.

| Department | Responsible for |
|---|---|
| **Marketing** | SEO · Content · Email · Social · AI visibility · Product copy · Campaigns |
| **Sales** | Conversion · Bundles · Upsells · Pricing suggestions · Offers · Checkout |
| **Customer Care** | Tickets · Returns · Refunds · Policies · Knowledge base |
| **Inventory** | Stock · Forecasting · Reorders · Supplier communication · Availability |
| **Finance** | Revenue · Profit · Expenses · Taxes · Cash flow · Margins |
| **Operations** | Shipping · Fulfilment · Logistics · Delivery problems |

Every department reports to Commerce.

**Commerce becomes the CEO. Every department becomes an intelligent worker.**

## 6. Control Layer

Commerce owns every decision. Every worker has permissions.

**Marketing**
- Allowed: publish blog · create product descriptions · schedule emails
- Needs approval: spend more than €500/day · delete campaigns · change branding

**Inventory**
- Allowed: reorder under €200 · notify suppliers
- Needs approval: new supplier · large purchase

**Finance**
- Allowed: categorize expenses · create reports
- Needs approval: payments · bank transfers

**Nothing operates without rules.**

## 7. Business Memory

Commerce remembers everything. Every campaign. Every order. Every customer. Every AI
conversation. Every decision. Every experiment. Every success. Every failure.

Instead of asking *"What happened?"* — Commerce already knows.

## 8. AI Workers

**Workers are disposable. Commerce is permanent.**

Claude today. GPT tomorrow. Gemini next year. Custom models later.

Commerce simply assigns work. Workers change. The operating system remains.

## 9. AI Shoppers

Commerce also understands the customer.

```
Human Customer              AI Customer
      ↓                          ↓
Visits website          ChatGPT · Claude · Gemini
      ↓                  Copilot · Perplexity
  Purchases                      ↓
      ↓                  Retrieves products
Commerce records                 ↓
   behaviour              Compares stores
                                 ↓
                          Makes purchase
                                 ↓
                        Commerce records behaviour
```

Commerce understands both.

## 10. Business Systems

Commerce connects everything: Shopify · WooCommerce · Stripe · PayPal · Meta · Google Ads ·
TikTok · Analytics · Email · CRM · Warehouse · ERP · Shipping · Accounting.

One business. One control centre.

## 11. Dashboard

Not hundreds of graphs. **Mission Control.**

```
Business Status    Healthy
Revenue Today      €4,283
Profit             €1,107
Orders             83
AI Orders          24
Workers Active     18
Warnings           2
```

Below: departments.

Marketing — Healthy · Inventory — Needs attention · Finance — Running · Support — Busy ·
Operations — Healthy

Everything becomes visual.

## 12. Worker Console

Click Marketing. You don't see analytics. **You see an employee.**

```
MARKETING WORKER

Current tasks
  ✓ Published comparison article
  ✓ Generated 12 product descriptions
  ✓ Improved structured data
  ✓ Scheduled email

Waiting approval
  Increase Meta budget to €350/day
  Reason: ROAS increased 42%

  [ Approve ]  [ Reject ]  [ Modify ]
```

Commerce becomes management software.

## 13. Timeline

> Support solved 31 tickets. Marketing published 4 articles. Finance detected declining margin.
> Inventory reordered Product A. Operations flagged delayed shipment.

You don't ask "What happened?" **Commerce tells you.**

## 14. Studio Integration

```
Validation  →  Should the business exist?
   ↓
Studio      →  Creates the business.
   ↓
Commerce    →  Operates the business.
```

If Studio built the business, Commerce already knows the brand, voice, products, mission,
customers, marketing strategy, policies and goals.

**There is no onboarding.**

## 15. Existing Businesses

Already using Shopify? Connect. Commerce imports products, orders, customers, inventory,
policies, analytics and marketing. It builds a business model. Then starts learning.

## 16. Long-Term Vision

The internet is moving toward an economy where AI agents increasingly buy from AI-operated
businesses. Commerce is designed to be the control plane for that world.

The owner remains in charge. Commerce coordinates the systems. AI workers perform the work.
AI shoppers interact with the business. **Every decision flows through one place.**

## 17. Vocabulary

**Stop calling the specialised components "agents."** The word is overloaded — every product
entering the market has agents. A business owner immediately understands *Marketing Department*,
*Finance Department*, *Customer Care*, *Inventory*, *Operations*.

Commerce is the **Executive Office** — the control centre coordinating every department. This
scales naturally whether the business has 5 workers or 500, and it differentiates Commerce from
the dozens of AI-agent products launching this year.

**Binding vocabulary for code, UI and copy:**

| Term | Means | Never means |
|---|---|---|
| **Department** | an internal function Commerce coordinates | anything external |
| **Worker** | one AI instance doing a department's work | the department itself |
| **AI shopper** / **buying agent** | ChatGPT, Claude, Gemini, Perplexity, Copilot — they buy *from* us | anything internal |
| **Executive Office** | Commerce itself, coordinating | a department |

The codebase currently uses `agent` for both senses. `classifyAgent`, `AGENT_UAS` and the agent
funnel refer to **AI shoppers** and are correct; every internal use is to be renamed.

---

## 18. Implementation notes

*This section is engineering commentary on the specification above, not a revision of it.*

**Build order.** The specification describes the destination. Market evidence
(`pdr-commerce-business.md`) argues the order in which a stranger will buy it: measurement first,
because a merchant will let Commerce *see* their business long before they let it *spend their
money*. §11's Mission Control and §12's Worker Console are the correct destination for the
interface; the first number they must be able to show truthfully is AI revenue, since that is the
one no competitor reports and no merchant can currently see.

**§10 is the largest risk in the document.** Fourteen named integrations, each carrying OAuth,
rate limits, schema drift and permanent maintenance. This is the part most likely to consume all
available effort. Recommended: treat connectors as a ranked queue rather than a set, ordered by
what a paying merchant blocks on, and hold the count as low as the customer allows.

**Trust ceiling.** §6 grants workers authority over ad spend and supplier purchases. That is the
highest-trust request in the product and should be the last capability enabled per account,
regardless of how early it is built. Spend is irreversible in a way a published article is not.

**What exists today** against this specification: the Business Brain (§4) exists per company with
generated guidelines and a visual world; departments (§5) exist as four rather than six;
permissions (§6) exist as an automation engine with dry-run and approval; business memory (§7)
exists as the activity ledger with actor attribution; AI shopper recording (§9) exists with ~14
classified agents, an order funnel and per-product retrieval; Studio integration (§14) exists and
requires no onboarding; connectors (§10, §15) exist read-only for Shopify, WooCommerce and
generic feeds.

**Not built:** Mission Control (§11), the Worker Console (§12), the Sales and Customer Care
departments as first-class, write access to connected stores, and any connector beyond the three
above.
