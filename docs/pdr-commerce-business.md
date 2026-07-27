# PDR Commerce — business description

Written 2026-07-27. Supersedes every earlier positioning document for the Commerce fork.
Sources for every figure are listed in §12.

---

## 1. In one paragraph

PDR Commerce is the instrument that shows an online store how much money AI shoppers are
spending with it, why, and how to get more. AI assistants are now a large and fast-growing
retail channel that converts better than anything else a merchant has — and roughly seven in ten
of those visits are invisible to the analytics merchants already run, landing in Google
Analytics as "Direct" and getting credited to nothing. Commerce makes that channel visible, then
explains it, then grows it, then operates it. It is sold to merchants who already have a store
and already have the traffic; they simply cannot see it.

---

## 2. The problem, with numbers

**The channel is real and it flipped inside twelve months.**

| | |
|---|---|
| AI-driven traffic to US retail | **+693%** YoY, 2025 holiday · **+393%** YoY, Q1 2026 |
| ChatGPT weekly active users | **900 million** (Feb 2026) |
| AI-referred traffic conversion | **42% better** than non-AI (Mar 2026) — it was **38% worse** in Mar 2025 |
| Shoppers who engage a store's AI agent | **12.3%** convert vs **3.1%** unassisted (329 brands) |
| Shopify AI-attributed orders | **+11x** Jan 2025 → Mar 2026 |
| Orders from AI search on Shopify | **~13x** growth; new-buyer orders at ~2x the rate of organic search |

Named merchants, not projections: **Omnilux** attributes 3.2% of total revenue to AI channels
(Mar 2026). **Cozy Earth** reports AI-channel revenue up **20x** year over year.

**And merchants cannot see it.**

Across an analysis of 446,405 tracked visits, only **29.4%** of AI-sourced visits carried
referrer data. The other **70.6%** landed in GA4 as "Direct." Gemini mobile traffic is **91%**
invisible. Answer engines strip referrer headers and UTM parameters before redirecting; traffic
from AI mobile apps is close to 100% untrackable, and users routinely copy-paste links rather
than clicking them, which strips the data GA4 needs.

The traffic that disappears is the best traffic the store has:

> **Dark AI traffic converts at 10.21%. Average ecommerce traffic converts at 2.46%.**

A merchant's highest-intent, highest-converting channel is being attributed to nothing. They
cannot justify investing in it, cannot tell their agency to optimise for it, and cannot tell
whether anything they changed worked. Industry estimates put general attribution maturity
**18–24 months away**.

**This is the gap. It is expensive, it is felt, and it is not being solved by the people
positioned to solve it.**

---

## 3. Why now, specifically

Three things converged in the first half of 2026 and none of them had happened a year earlier.

**The conversion flip.** In March 2025 AI-referred traffic converted 38% *worse* than everything
else — it was a curiosity. By March 2026 it converted 42% *better*. Merchants who ignored it were
right to; merchants who ignore it now are losing real money.

**Shopify made the plumbing free.** On 17 June 2026, Shopify's Spring '26 Edition shipped 150+
updates centred on agentic commerce: **Shopify Catalog** syndicates eligible merchant products to
ChatGPT, Microsoft Copilot, Google AI Mode and Shop with *nothing to configure*, converting at 2x
scraped data; and **UCP** — the Universal Commerce Protocol, co-developed with Google and backed
by Amazon, Meta, Microsoft, Salesforce, Stripe, Etsy, Target and Wayfair — standardised how
agents transact.

This is decisive for our positioning. *Being findable by agents is now solved, free, and
automatic for Shopify merchants.* Any business built on "we make you agent-readable" is already
dead. **Being measurable is not solved, and Shopify structurally cannot solve it**, because the
dark 70% is a human reading ChatGPT on a phone and then arriving at the store directly — that
traffic never touches UCP, and Shopify can only see Shopify.

**The measurement category exists and is looking the wrong way.** See §6.

---

## 4. The customer

**Primary: the operator of an established online store doing €250k–€5m a year.**

Concretely: they have a real catalogue, real traffic, and a person who looks at analytics at
least weekly — usually the founder, sometimes a marketing lead, occasionally an agency running
the account. They are on Shopify, WooCommerce, or a custom stack. They are already feeling
customer-acquisition costs rise on Google, Meta and TikTok, which is the top reported pain in
2026 merchant surveys alongside market saturation.

**What makes them buyable:** they have the traffic *already*. We are not asking them to build a
new channel, migrate a platform, or trust us with their operations. We are telling them about
money that is already arriving.

**Who we are not selling to (yet):**

- People without a business. That is Studio's customer and a much harder sale.
- Enterprise. Profound owns that and it is a sales-led motion we cannot fund.
- Anyone who wants us to run their store. That is stage 4, and it has to be earned.

**The qualifying question**, which costs nothing to ask and settles everything:

> *"Do you know how much revenue ChatGPT sent you last month?"*

---

## 5. The product

One spine, four stages. Each stage earns the right to the next, and each is independently
saleable. The sequence is the strategy: **nobody hands their business to a stranger, so trust is
bought with measurement first.**

### Stage 1 — SEE

*"ChatGPT sent you €4,180 last month. Your analytics called it Direct."*

The meter. It reports revenue by AI channel — ChatGPT, Perplexity, Gemini, Claude, Copilot —
separating what carries a referrer from what has to be identified by behaviour, and stating the
confidence of each.

Two data paths, because the traffic arrives two ways:

- **Declared** — the visit carries a referrer or an agent user-agent. Certain, and about 29% of it.
- **Dark** — no referrer, no UTM. Identified by behavioural fingerprint: arrival directly on a
  product page rather than the homepage, no referrer, unusually low bounce, unusually high
  conversion, session shape unlike organic or paid. **This is the hard part and the moat.**

Every figure states its basis. A dark attribution is labelled as an inference with its
confidence; a declared one is labelled as a fact. We never merge the two into a flattering
single number — the loudest complaint about the existing category is that buyers do not believe
its numbers, and that complaint is our opening.

### Stage 2 — UNDERSTAND

Why the money arrived, and why more of it did not.

Which agents came, what they retrieved, which products they read, where they stopped. What they
compared the store against and what it lost on — price, missing specification, unparseable stock,
a checkout the agent could not complete. Per-product retrieval counts, so a merchant can see that
six SKUs have never been read by any agent.

This is where a score becomes a decision.

### Stage 3 — GROW

**Marketing to AI shoppers is a different discipline from marketing to humans, and it has almost
no tooling.** There is no creative, no bidding, no audience targeting. You win by being what the
agent cites: structured, checkable facts; real provenance; comparison-ready specifications;
parseable reviews; content that answers the question the shopper actually asked the assistant.

Commerce writes that, in the company's own voice, grounded in its real catalogue, and measures
what came back. The existing marketing brain — per-company guidelines, a visual world, rules
learned from measured outcomes — is the right machine pointed at the wrong audience; repointing
it is the work.

The commercial argument is arbitrage: **CAC on Google, Meta and TikTok keeps climbing while this
channel is cheap and unclaimed.**

### Stage 4 — RUN

The workforce. Specialised workers — sell, market, money, care — each with a written mandate and
numeric limits the owner sets. Inside the mandate a worker acts unattended; outside it, it stops
and asks. Every action records which worker did it and under whose authority.

**This is last on purpose.** It is the most technically complete part of what exists today and the
least saleable, because it asks for a level of trust that has to be earned by being right about
stages 1 to 3 first.

---

## 6. Competition

### The AI-visibility category

| | raised | price | what it measures |
|---|---|---|---|
| **Profound** | $35M Series B (Sequoia) | $399/mo Growth | brand mentions, 3 engines, 100 prompts · Fortune 500 |
| **Peec AI** | $29M · 1,500+ teams | €89–199/mo | mentions across ChatGPT, Perplexity, AI Overviews, DeepSeek |
| **Athena** | ex-Google/DeepMind | $95–295/mo | mentions across 8+ LLMs |
| **Otterly** | — | from $25/mo | 15 daily prompts across 4 engines |

**All of them answer "are you mentioned?" None answers "did it sell anything?"** Peec has no deep
GA4 integration exposing LLM referral sessions, conversions or revenue; reviewers note that
demonstrating revenue impact requires a separate analytics stack entirely.

The category's own buyers are already sceptical. Trade press reports marketers questioning
expensive AI-visibility tools over inconsistent results and absent benchmarks, describing the
spend as a necessary evil. **A tool that reports money instead of mentions is a direct answer to
a complaint the market is making out loud.**

### Shopify

Owns the plumbing, gave it away free, and shows channel attribution on agentic orders that flow
through UCP. **Cannot see the dark 70%**, because that is a person leaving an AI app and arriving
at a store directly. Also structurally blind to any merchant not on Shopify.

Not a competitor to the meter. A reason the meter is needed.

### Analytics incumbents

GA4 is the thing that is broken. Server-side tracking and webhook-level order capture is the
generally recommended fix and it is not proprietary — but it is fiddly, per-merchant work that
most stores will never do. The productised version of that work is a business.

---

## 7. Why this is defensible

**The classifier compounds.** Identifying dark AI traffic from behaviour requires labelled
examples across many stores. Every merchant added makes the fingerprint sharper for all of them.
This is the only part of the product that gets harder to copy over time — everything else here
could be rebuilt in a fortnight.

**The honesty is a position, not a virtue signal.** The category's central weakness is that
nobody believes its numbers. A product that labels every figure as measured or inferred, states
its confidence, and reports what it cannot know is differentiated precisely where the incumbents
are weakest. This is already the engineering doctrine of the codebase, in ~20 code paths that
return "not configured" rather than fabricate a value.

**The ladder retains.** An analytics tool alone churns. A tool that becomes the place you
understand the channel, then act on it, then let it run, does not.

**Assets already built:** agent classification of every request, order-level source attribution,
a six-stage agent funnel, per-product retrieval counts, an external audit that runs on any URL
with no account, a per-company marketing brain, and server-rendered agent-native storefronts used
as the test rig.

---

## 8. Business model

**Free** — the audit. Any URL, no account, no card. Produces a real, checkable finding about
their store within seconds. It is the door and the qualifying mechanism.

**€99/mo · SEE** — the meter on one store. Revenue by AI channel, declared and dark, with
confidence stated. Priced deliberately at the low end of the visibility category, because the
first sale is buying belief rather than margin.

**€299/mo · UNDERSTAND** — the full funnel, per-product retrieval, comparison losses, alerts on
change.

**€699/mo · GROW** — agent-directed content production and the measured loop.

**Stage 4 pricing is unset**, and should stay unset until someone has actually run it.

**Why subscription and not performance:** we would be pricing on revenue we can only partly
observe, which is exactly the credibility problem we are attacking.

---

## 9. What exists today

**Built and verified working:** the external audit (server-rendered, runs on any URL, no
account); agent classification across ~14 known agents; order attribution with a marketing source
on every order; the agent funnel; per-product retrieval; a per-company marketing brain with
generated guidelines and a visual world; agent-native storefronts with feeds, UCP profile,
agent-card, verifiable seller record and a per-store MCP server; the digital fulfilment lane
including Claude producing the deliverable itself; aftercare with returns judged against the
store's own published policy; a distribution check that parses live robots.txt and validates a
catalogue against four channels' published specs; booked-versus-settled revenue; Stripe Checkout
plus a settlement webhook.

**Built but ahead of the market:** the workforce model, mandates, the automation engine.

**Built and being deleted:** the buy side and procurement. There is no evidence any merchant
wants it.

**Not built:** the dark-traffic classifier — the single most important component and the moat;
the merchant-side integration (script or order-data connection) that stage 1 requires; anything
pointed at a store PDR does not itself host.

---

## 10. Risks, stated plainly

**We have no users.** Zero merchants, no revenue, and the demo estate has two orders — one placed
by the developer testing attribution. Every claim in §4 about the customer is a hypothesis.

**Stage 1 needs a real integration.** A script on their site or access to their order data. That
is a materially higher trust barrier than typing a URL into a box, and it is where most free-tool
funnels die.

**Cold start on the classifier.** The moat only exists once there is cross-merchant volume, and
early accuracy will be poor. Being honest about confidence mitigates the damage but does not
remove it.

**A funded incumbent is one decision away.** Profound has $35M and Sequoia. If they pivot from
mentions to money, they arrive with a sales team and a brand.

**Analytics churns.** Merchants cancel dashboards. Stages 2–4 exist to convert a dashboard into a
dependency, but that is a plan, not a proof.

**Single builder.** Everything above is one person and an AI.

---

## 11. What settles this in a week

Message five established store owners. One question, no pitch, no link:

> *"Do you know how much revenue ChatGPT sent you last month?"*

- **"Yes"** or **"don't care"** → the thesis is wrong. A week lost instead of a year.
- **"No — and I have wondered"** → build stage 1, for them, by name.

The audit already runs on any URL, so a reply can be answered within minutes with a real finding
about their actual store. **No further building should happen before those five messages are
sent.**

---

## 12. Sources

Market and adoption: [Adobe/industry benchmarks via Elogic](https://elogic.co/blog/chatgpt-commerce-statistics/),
[MetaRouter](https://www.metarouter.io/post/agentic-commerce-trends-statistics),
[Envive](https://www.envive.ai/post/generative-ai-commerce-adoption-statistics),
[Alhena](https://alhena.ai/blog/retail-ai-agent-adoption/).
Dark traffic: [Retailgentic / Loamly analysis of 446,405 visits](https://www.retailgentic.com/p/dark-agentic-commerce-traffic-dact),
[Seer Interactive](https://www.seerinteractive.com/insights/are-ai-sites-like-chatgpt-sending-your-website-traffic),
[Clickport](https://clickport.io/blog/ai-traffic-revenue-attribution).
Shopify Spring '26: [Shopify](https://www.shopify.com/news/ai-commerce-at-scale),
[Digital Applied](https://www.digitalapplied.com/blog/shopify-spring-2026-edition-agentic-commerce-ucp-catalog),
[PYMNTS on Q1 AI orders](https://www.pymnts.com/earnings/2026/ai-drove-orders-shopify-up-13-times-q1/).
Competitors: [Profound/Peec/Athena comparison](https://blog.timsoulo.com/14-profound-ai-alternatives-for-ai-search-visibility-tracking-2026/),
[Zapier roundup](https://zapier.com/blog/best-ai-visibility-tool/),
[Digiday on marketer scepticism](https://digiday.com/marketing/marketers-question-expensive-ai-visibility-tools-as-inconsistent-results-fuel-skepticism/).
Merchant pain: [Forbes Finance Council](https://www.forbes.com/councils/forbesfinancecouncil/2026/01/21/4-key-challenges-facing-consumer-e-commerce-brands-in-2026/),
[eDesk](https://www.edesk.com/blog/e-commerce-challenges-trends/).
