# PD Commerce — Full Product & Business Design

**Positioning line:** *"We don't show you a score. We show you the money AI shopping agents are costing you — and get it back."*

**One-liner:** PD Commerce makes sure ChatGPT, Gemini, and Perplexity recommend your products — and proves it in euros, not percentages. Connectivity is commoditized; the ongoing recovery engine is not.

---

## 0. The Moat Test (read this before anything else — supersedes the platform-priority logic below)

**The test:** if Google, OpenAI, or Anthropic shipped this exact capability natively next quarter, would your customers cancel? Applied honestly to every layer of this product:

| Layer | Survives the test? | Why |
|---|---|---|
| "We connect you to UCP" | **No — already dead on Shopify, dying everywhere else** | Shopify gave this away free (Agentic Storefronts, March 2026). A competitor (**Easy UCP**) already sells pure connectivity — JSON-LD, `.well-known/ucp` manifest, catalog feed — as a $199–999 *one-time* fee, platform-agnostic. Google is actively simplifying UCP onboarding in Merchant Center for small retailers directly. This is infrastructure, and infrastructure is exactly what platforms subsidize or give away to drive adoption. |
| "We tell you your visibility score" | **No — becoming a commodity** | Free/open validators already exist: UCP.tools, UCP Checker, UCP Lighthouse, UCP Doctor — all free, developer-facing. A score alone has no moat left. |
| "We rewrite your content and push it live" | **Partially** | The generation itself (an LLM rewriting a description) is replicable by anyone with API access. What isn't replicable in a weekend: knowing *which* rewrite actually moved revenue, for *this* merchant, in *this* category — that requires accumulated outcome data, not just generation capability. |
| "We track euros recovered, tied to real order IDs, and bill on it" | **Yes** | This is a *business relationship*, not a feature. It requires an ongoing ledger, trust built over months, and a billing model no infrastructure provider wants to run (see below). |
| "We know what content patterns win in your specific category, because we've seen it across hundreds of merchants" | **Yes — the strongest one, and not yet built** | This is a genuine data flywheel. Google's data is about the whole web; PD Commerce's data, if built deliberately, is about *what specifically converts AI agents into buyers* — the fix, the category, the outcome, aggregated across every merchant on the platform. Nobody else has this because nobody else is running the fix → measure → repeat loop across many stores. |

**Why big platforms won't build the winning layer themselves:** Google, OpenAI, and Anthropic ship *infrastructure* (protocols, feeds, checkout rails) — that's a platform play, it benefits every merchant equally, and it's how they grow adoption. They structurally don't want to run a *service* business: advising one specific jewellery shop that its sapphire ring description is thin, taking an 8% cut of the resulting sale, and being on the hook if that judgment is wrong. That's the same reason IBM still has a consulting arm and AWS still has professional-services partners — the infrastructure layer and the applied-judgment-on-top-of-it layer are different businesses, and the giant rarely wants both. **This is the actual thesis for PD Commerce: be the applied layer, not a thinner version of the infrastructure.**

### What this means concretely — rebuilding the moat, not just the feature list

Two of three real moats need to stack (one alone is fragile, per how every serious AI-defensibility analysis frames it in 2026):

1. **Proprietary outcome data (the flywheel).** Every fix pushed and every euro attributed back to it (already the `fixes` + `attribution_events` tables in section 7) isn't just a billing ledger — it's training data on *what works*. Once there are a few hundred merchants, PD Commerce can tell a new jewellery merchant "descriptions mentioning gemstone origin + carat weight convert 3x better in AI citations than generic descriptions, across 40 stores we've already fixed" — a claim genuinely nobody else can make, because nobody else is closing the loop from fix to measured outcome across many stores. Google sees the whole web; it doesn't see *your specific category's* fix-to-revenue outcomes, because it doesn't run the fix.
2. **Workflow depth / switching cost.** The billing ledger, the reversible fix history, the accumulated attribution track record — a merchant who leaves loses their whole recovery history and the compounding "which of my products already work" knowledge. This is the same mechanism that makes accounting software sticky: not the individual feature, the accumulated record.
3. **Distribution into an underserved niche (the weaker third leg, but real).** WooCommerce + EU/PT small merchants specifically — a niche big platforms have explicitly deprioritized (WooCommerce wasn't even a UCP launch partner) and existing agencies price out of reach ($50K–500K+ engagements). Your existing Fiverr/freelance relationships are a real distribution channel a horizontal competitor can't just buy.

**The build-order implication:** don't spend early engineering time polishing the connectivity/scan layer — that's the part getting commoditized fastest and it's mostly a checkbox against the free open-source SDKs (section on APIs, unchanged). Spend it on the fix → measure → aggregate loop, because that's the part that gets *more* valuable the longer it runs and the more merchants use it, which is the opposite of what's happening to the connectivity layer.

### Revised platform priority (updates section "0.1 Platform Strategy" below — see also the correction in section 1.3)

Shopify commoditized connectivity for its own merchants in March 2026. WooCommerce hasn't yet, but there's already a public, high-priority community feature request for native WooCommerce UCP support — meaning that gap is on borrowed time too, possibly closed by a single announcement exactly like Shopify's was. **Charging for connectivity anywhere, including WooCommerce, repeats the exact mistake this section exists to catch — it's a temporary crack, not a moat.** Connectivity is bundled and free on every platform, permanently (see section 1.3 for the corrected pricing model). WooCommerce is still worth building early — not because its connectivity gap is monetizable, but because it's a large, underserved segment where agencies currently charge five-to-six-figure fees for what this product can automate, which means it's a strong distribution channel into the one thing that actually is defensible: the Recovery Engine and the Benchmark Layer, identically priced across every platform.

---

## Site Entry: Fork Picker + Validation Landing

*(For Emergent — this section is content and layout only, no interaction/animation spec needed, that's already covered separately.)*

### Fork Picker (first screen, before either main page)
Full-bleed split screen, two halves, no header/nav/footer — this screen has one job, picking a fork.

**Left half (Commerce):**
- Eyebrow (small, mono): `01 — LIVE PRODUCT`
- Headline (large, display): `Commerce`
- One-line description: "AI shopping-agent visibility, fixes, and revenue recovery for online stores."

**Right half (Validation):**
- Eyebrow: `02 — EARLY STAGE`
- Headline: `Validation`
- One-line description: "Test a new idea against the market before you build it."

**Top center, small, persistent:** `PICK A FORK TO CONTINUE`

Clicking either half takes you straight into that fork's main page below. No "are you sure," no loading screen after the click — the pick itself is instant.

### Commerce Main Page — copy is fully specified in section 4.1 below. This is what loads when Commerce is picked.

### Validation Main Page — loads when Validation is picked
*(Content only — deep feature build on this fork is intentionally out of scope for now, but the landing page needs real copy since it's one of the two front doors.)*

**Section 1 (hero):**
- Eyebrow: `BEFORE YOU BUILD IT`
- Headline: "Is this idea worth building?"
- Subhead: "Describe it in a sentence. We'll check for existing competitors, real demand signals, and market timing — before you spend a weekend building it."
- Input field placeholder: "e.g. an AI agent that reorders pet food automatically"
- CTA button: `VALIDATE`

**Section 2 (how it works, 3 steps):**
- "Describe it — one sentence, no pitch deck needed."
- "We check it — competitors, search demand, timing, existing funded companies doing the same thing."
- "You get a verdict — worth building, needs a different angle, or already crowded — plain language, not a score."

**Section 3 (sample output preview):**
Show one real example result as social proof/preview, e.g. a short card: idea in one line → verdict in one line → 2–3 bullet reasons why. (Use a real validated example once you have one — placeholder for now.)

**Section 4 (footer/CTA repeat):** Single line, plain: "Free to try. No signup required for your first idea."

---

## 0.1 Platform Strategy (multi-platform architecture — why "any online store" is the right call, and how to build it without drowning)

The two protocols this whole product depends on — **UCP** (Google + Shopify) and **ACP** (OpenAI + Stripe) — are explicitly platform-agnostic. UCP already has Squarespace, Wix, WooCommerce, BigCommerce, and commercetools integrated. Shopify's own "Agentic Plan" exists specifically so non-Shopify merchants can plug into the same AI channels. That means the underlying opportunity was never Shopify-shaped — Shopify is just where the tooling matured first. Building PD Commerce as Shopify-only would mean building on top of someone else's temporary head start, not the actual shape of the market.

**But** every real competitor made the opposite trade for a reason: Lexsis and Glara went deep-and-native on Shopify (one API, one write-back path, fast to build, easy to demo). Peec and Otterly went broad-and-shallow (platform-agnostic, but monitoring only — they never write anything back because every platform's write API is different). **Nobody has combined "works everywhere" with "actually fixes it," because that combination is the hard engineering problem.** That's exactly why it's the right one to solve.

**The architecture that makes both possible — a universal ingestion + write layer:**

| Layer | Shopify | WooCommerce | BigCommerce / Magento | Anything else (custom, Wix, headless) |
|---|---|---|---|---|
| Read catalog | Shopify Admin API (OAuth) | WooCommerce REST API (key/secret) | Native REST APIs | Product feed (XML/CSV), sitemap crawl, or manual CSV upload |
| Scan for AI visibility | Identical across all — this just queries AI models about products, doesn't touch the store | | | |
| Write fix back | Shopify Admin API (auto-push) | WP REST API (auto-push, requires plugin) | Native API (auto-push) | **Export mode**: generate the fix, merchant copy-pastes or downloads a CSV — no auto-push, but still valuable |
| Revenue attribution | Layer 1 (order metadata) + Layer 2 (GA4) | Layer 2 only, usually | Layer 2 only, usually | Layer 2 (GA4) only |

Scanning is identical everywhere. Writing back is where complexity lives — solve it with **graceful degradation**: full auto-push where an API exists, "generate and export" where it doesn't. A custom Squarespace store still gets real value (the fix, the content, the €-estimate) even without one-click push — that's what keeps this a true "any online store" product instead of "Shopify-plus-asterisks."

**Sequencing (corrected — WooCommerce moves up for distribution/TAM reasons, not for a temporary connectivity-pricing opportunity):**
1. **Shopify first** — fastest path to prove the fix→measure loop and bootstrap the Benchmark Layer (section 1.4)
2. **WooCommerce second** — not because connectivity itself is billable there (it isn't, per the corrected section 1.3), but because it's a large, underserved, agency-price-gouged segment that feeds more merchants into the paid Recovery Engine and Benchmark Layer faster than any other platform would right now
3. **Generic feed/CSV mode third** — unlocks literally any store with minimal engineering, cheaper to build than a full BigCommerce/Magento integration
4. **BigCommerce/Magento native integrations later**, once revenue justifies the dedicated engineering time

Reframe the pitch this way: **"any online store" doesn't mean built for everyone from day one — it means the architecture never boxes you into Shopify-only, and the free-scan + content-generation value works on day one even for a store you haven't built a native integration for yet.**

---

## 1. Business Model & Pricing

### 1.1 The core insight driving pricing
Small merchants don't trust "visibility scores" enough to pay $50–300/mo upfront (that's why AthenaHQ/Peec skew toward bigger brands with marketing budgets). So PD Commerce removes the upfront-trust problem entirely: **you don't pay until we make you money.**

### 1.2 Three tiers

| Tier | Price | Who it's for | What's included |
|---|---|---|---|
| **Free Scan** | €0 | Anyone, no card | One-time full store audit: which products are invisible to AI agents, estimated €/month lost, top 3 fixes shown (blurred/locked until upgrade) |
| **Starter** | €19/mo flat | Solo shops, <100 SKUs | Full dashboard, weekly re-scan, unlimited manual fixes reviewed by you before push, email digest |
| **Growth (Performance)** | €0 base + 8% of AI-attributed incremental revenue (capped at €300/mo) | Shops ready to let it run autonomously | Everything in Starter + auto-push fixes, competitor watch, content generation (buyer's guides, comparisons), priority re-scan (daily) |

Why this structure and not pure rev-share for everyone: pure rev-share only works once attribution is trustworthy (see 1.5) and once there's already baseline traffic to attribute. A brand-new/tiny store has near-zero AI-referred revenue to take a cut of, so Starter's flat €19 keeps the lights on for that segment while Growth captures upside from stores where it's working. This mirrors what Polsia got right (low-risk trial) and wrong (no transparent free path, credibility gap) — PD Commerce's free scan is the trust-builder Polsia never had.

**Note on how this table relates to sections 1.6/1.7:** the feature lists above are a simplified summary for pricing-page purposes. The real mechanic, per section 1.6, is that Growth doesn't unlock every module instantly — modules activate as their specific data thresholds are met (the table in section 1.6), which is what makes the "environment that grows over time" pitch true rather than a marketing claim contradicted by a static feature list.

### 1.3 Platform pricing — corrected: connectivity is NEVER a paid line item, on any platform

**Self-correction, and an important one:** the original version of this section charged extra for WooCommerce connectivity because "no free native alternative exists yet." That fails the Moat Test in section 0 exactly the same way Shopify connectivity did — it's a temporary platform gap, not a durable advantage. There is already a public, actively-discussed WooCommerce feature request for native UCP support, marked high-priority by the community. That gap could close with a single announcement, exactly like Shopify's did in March 2026. Pricing a revenue line on a countdown clock is the mistake section 0 exists to prevent — building it into WooCommerce specifically doesn't make it safe, it just relocates the same fragile bet to a different platform.

**The corrected rule:** connectivity setup — Shopify, WooCommerce, BigCommerce, generic feed, whatever comes next — is always bundled, free, onboarding infrastructure. It is never its own SKU, never a separate line on an invoice, on any platform, permanently. The only paid layer, uniform across every platform, is the part that survives the Moat Test:

| What's charged for | Applies to | Why it's safe to price |
|---|---|---|
| Recovery Engine (Starter €19/mo, Growth performance-based) | Every platform, identically | Content/attribution/fix quality — not replicable by a platform shipping a protocol |
| Expansion modules (Return-Risk, Restock, Agent-Ready checks, later Sales Agent) | Every platform, identically | Same reasoning — advisory/applied layer, not infrastructure |
| Benchmark Layer insights | Every platform, identically, strengthens with more merchants regardless of platform mix | The actual flywheel — a platform vendor has no reason to build this because it isn't infrastructure, it's judgment |

**Why WooCommerce still matters, correctly framed:** not because you can charge for solving its UCP gap — that offer has an expiration date you don't control — but because it's a large (43% of the web), underserved, agency-price-gouged segment that gets you *more merchants into the Recovery Engine and Benchmark Layer faster*, which is what actually compounds. Build the WooCommerce connector because it's a good distribution wedge into the paid product, not because "connecting it" is itself a product.

### 1.4 The Benchmark Layer (the actual moat — new, highest priority to design well)

Once ~50-100 merchants are active, aggregate (fully anonymized) fix-to-outcome data by category becomes a sellable insight layer in its own right, distinct from any single merchant's dashboard:

- Feeds back into every merchant's Fix screen as a confidence signal: "descriptions mentioning [attribute] outperformed generic copy in 73% of [category] fixes we've tracked" — makes every individual fix recommendation stronger than a cold LLM call, and gets *better* the more merchants join, which is the actual definition of a data flywheel.
- Could eventually be a standalone data product (category-level "what converts AI shopping agents" reports) sold to brands/agencies who aren't PD Commerce customers — a second revenue line, later-stage, not MVP.
- This is the one part of the roadmap explicitly worth over-investing in relative to how it looks in a demo, because it's invisible in a screenshot and is the whole reason the business survives a Google feature update.

---

### 1.5 Attribution mechanics (the part that has to be bulletproof)

This is the hardest technical/credibility problem in the whole product — if merchants don't believe the number, Growth tier dies.

**Three-layer attribution, stacked from strongest to weakest signal:**

1. **Direct agent checkout signal (strongest).** When Shopify's Agentic Storefronts / UCP completes a transaction, the order carries channel metadata identifying it came through an AI agent (ChatGPT, Copilot, Gemini). Pull this directly via Shopify Admin API order tags/source. This is ground-truth — no estimation needed.
2. **Referral-based attribution (strong).** GA4 custom channel grouping for sessions from chatgpt.com, perplexity.ai, gemini.google.com, copilot.microsoft.com, matched to Shopify order IDs within the session/cookie window. Standard last-non-direct-click model, clearly labeled as such.
3. **Incrementality estimate (weakest, used only for pre/post comparison).** Before-and-after revenue in the specific product categories PD Commerce touched, benchmarked against the store's own trailing baseline (not competitors) to isolate the effect of the fix, not general growth. Shown as a range, never a single confident number, and always secondary to layers 1 and 2.

**Billing rule:** only layers 1 and 2 count toward the 8% fee. Layer 3 is shown to the merchant as "directional impact" but never billed on — this keeps the revenue-share defensible and avoids the "you charged me for sales I would've made anyway" dispute that kills trust in performance pricing.

**Transparency requirement:** every euro billed must be traceable to a specific order ID the merchant can click into and see for themselves in their own Shopify admin. No black box.

### 1.6 Not a Tool, an Environment (the packaging that makes the moat visible to the user)

The Moat Test in section 0 argued the defensibility comes from accumulated data and workflow depth. This section is how that shows up to Sophie, not just in the architecture.

**The status-quo pain this replaces:** today a merchant assembles AI-commerce readiness from separate vendors — a UCP plugin, a visibility checker, a returns-analytics tool, a restock-alert app, eventually a chat widget — each with its own signup, its own login, its own disconnected slice of data. None of them get smarter from what the others know.

**The environment model:** one connection (the store), one login, one attribution ledger underneath everything. Every capability in section 12 (Agent-Ready spec, Return-Risk, Restock Signals, Sales Agent) isn't a separate purchase decision — it's a module that activates inside the same dashboard once the underlying data exists to support it, with zero new setup from the merchant. She never decides to "buy Return-Risk" — she gets a notification that it's now live because her return data crossed the threshold needed to analyze it.

**Dashboard implication — a new persistent panel:**
- Add a compact "Your Environment" strip near the top of the main dashboard (`/dashboard`), showing all modules as tiles: active ones with their current headline number (Recovery: €X/mo, Return-Risk: €Y prevented, Restock: N alerts), locked/pending ones grayed out with a one-line note on what unlocks them ("Restock Signals unlock once you have 30 days of order history").
- This does real product work, not just marketing: it visually proves the "grows over time" claim every time she logs in, and it's the honest, factual version of a retention nudge — no dark pattern, just showing accumulating value.

**Pricing implication — tiers are environment depth, not feature access:**
- **Starter** isn't "the visibility tool" — it's the environment with the Recovery engine active and every other module visibly present-but-locked, so upgrading feels like unlocking more of something she's already inside, not buying a new thing from scratch.
- **Growth** unlocks the rest automatically as data thresholds are met — no separate upsell conversation needed for each module, which also reduces your own sales/support overhead as you add more modules over time.

**Why this matters for the moat, not just the pitch:** an environment is precisely what "two moats stacked" (section 0) looks like from the outside — the proprietary data moat (attribution ledger, benchmark layer) and the workflow-depth moat (one connection, compounding modules) are the same underlying architecture; packaging it as one environment instead of a menu of tools is what makes a merchant *feel* the switching cost, instead of it only existing in a database schema.

**Concrete unlock thresholds per module (so "grows automatically" isn't vague):**

| Module | Unlocks when | Why this threshold |
|---|---|---|
| Recovery Engine | Immediately, first scan | Core product, no data needed |
| Agent-Ready Spec Check (12.1) | Immediately, same scan | Same data as Recovery, just a second lens on it |
| Return-Risk (12.2) | 30 days connected **and** at least 10 recorded returns | Needs enough sample size to separate a real pattern from noise |
| Restock/Demand Signals (12.3) | 14 days of AI-attributed sales data, minimum 5 attributed orders | Enough data points to compute a believable sell-through velocity |
| Competitor Watch | Growth tier **and** at least 3 comparable stores already in the same category benchmark | Honest bootstrapping constraint — say this plainly to early merchants in a brand-new category rather than faking a comparison |
| Content Hub | Growth tier, immediate | Tier-gated, not data-gated |
| On-Site Sales Agent (12.4) | Growth tier, opt-in setup (not automatic) | Requires the merchant to actively provide policy text — this one is a deliberate decision, not a surprise unlock |

---

### 1.7 The Real Product: Command Center + Cross-Module Automation (Studio included)

**The honest critique this section exists to fix:** a dashboard that shows a euro number and sends a weekly text is a notification system, not a product someone builds their day around. Notification systems don't change how anyone runs a business, and they're trivially replaceable — there's no reason a merchant couldn't get the same alert from a cheaper competitor or a generic tool. The actual defensible, sticky product isn't any single module — it's what happens when the modules **feed each other automatically**, because that combination is what nobody else has a reason to build.

### The Command Center (replaces the plain "€ at risk" home screen)

`/dashboard` stops being a single number and becomes the actual home base a merchant opens every morning — one screen, everything about running the store today:
- Today's sales (all channels, not just AI-referred — see Unified Marketing View below)
- This week's Recovery number, Return-Risk savings, Restock alerts — the existing modules, now side by side instead of buried in separate tabs
- **A live queue of Studio content** (drafted, scheduled, published) sitting in the same view — content isn't a separate app to open, it's a lane on the same home screen
- **A single "Today's Actions" list** — the actionable output of every module, ranked by impact, in one place: "Push this fix (€40/mo)," "Approve this Instagram post," "Restock alert: hoodie sells out in 6 days" — the merchant works from one list instead of hunting across tabs

### Signals → Actions: the automation layer that actually connects everything

This is the real answer to "how do you connect all of that." Every module produces **signals**; signals can trigger **actions** in other modules, automatically, without the merchant configuring anything — the connections are pre-built based on what actually makes sense, not a generic "build your own automation" builder (that's a different, more complex product merchants don't want to configure themselves):

| Signal (from) | Automatic action (to) |
|---|---|
| Recovery Engine fixes a product's description | Studio drafts a social post / email announcing the improved listing, using the same new copy — one piece of work, two outputs |
| Restock Signal flags a bestseller about to sell out | Studio drafts a "last chance" post/email automatically, ready to review and send |
| Return-Risk flags a sizing issue on a product | Studio drafts a clarifying email to recent buyers of that product, and the product page fix gets bumped to the top of the Recovery queue |
| Competitor Watch flags a rival undercutting on price | Studio drafts a promo/bundle idea defending that SKU, surfaced as a suggested action, not auto-sent |
| Attribution Ledger shows a channel (AI agent, email, social) driving a spike | Unified Marketing View re-ranks that channel higher in next week's suggested focus |

Every automatic action lands as a **draft in the merchant's review queue** — never auto-published without approval (same reversible, review-before-push principle already established for fixes) — so this adds leverage without adding risk.

### Studio, formally integrated (not a side project anymore)

Studio remains its own capability (content generation, on demand, daily-use habit loop, as originally designed) but is now a first-class citizen inside Commerce's environment specifically through the Signals → Actions table above. This is what actually answers "connecting marketing into it": marketing content isn't a separate decision the merchant makes each time — it's generated automatically from real store events (a fix, a restock risk, a competitor move), which no standalone content tool (Studio alone, or a competitor like Jasper/Copy.ai) can do, because they don't have the store signals to trigger from in the first place.

### Unified Marketing View (new — closes the "one dashboard instead of five" gap)

A merchant today checks Shopify/WooCommerce analytics, Klaviyo email reports, Meta Ads Manager, and Google Analytics separately to understand what's actually working. Add one view that pulls performance across **every** channel — AI-agent-referred, email/social (via Studio's published content), and paid ads (via ad platform APIs, read-only) — into one ranked list: what's actually driving revenue this week, across every channel, not just the AI-agent slice. This doesn't replace Klaviyo or Meta Ads Manager as the sending tool, it replaces checking four different dashboards to understand what's working.

### A light customer/segment layer (new — the minimum needed to make the automation useful, not a full CRM)

To make "email recent buyers of this product" (Return-Risk trigger above) or "target this segment with a promo" (Competitor Watch trigger) actually work, PD Commerce needs a thin layer over existing order data: which customers bought which products, basic repeat-purchase flagging. This is deliberately **not** a full CRM (don't compete with Klaviyo's segmentation depth) — just enough structure to make the automation table above real rather than aspirational.

### Why this is the actual moat, more than any single module

A competitor can copy a euro-recovery dashboard. A competitor can copy a content generator. **Copying the specific set of automations between a revenue-recovery engine and a content-generation engine requires building both halves well and wiring them together with real store signals** — that's a materially harder thing to replicate than any single feature, and it's the concrete version of the "environment, not a tool" thesis from section 1.6: the switching cost isn't abstract anymore, it's "I'd lose the thing that automatically turns my store's own events into marketing," which is genuinely useful in a way a notification bot never was.

---

## 2. Full Feature Set

*(Rewritten to match the actual current design — see section 0.1 for why this is multi-platform from the start, not Shopify-only, and section 1.6/1.7 for why these are framed as modules inside one environment, not a static feature list.)*

### Core — every platform, Starter tier and up
- Store connect: Shopify OAuth, WooCommerce API key/secret, or generic feed/CSV for anything else (connectivity is always free/bundled — section 1.3)
- AI visibility scan across ChatGPT, Perplexity, Gemini (prompt-based product-category checks)
- Plain-language verdict per product: Invisible / At Risk / Winning, sorted by €-impact
- Agent-Ready Spec Check (12.1) — the technical/structured-data layer, bundled into Core, not a premium add-on
- Estimated €/month lost calculation
- One-click fix generation (Claude Agent Skill): rewritten description, structured data, meta tags
- Before/after diff review, reversible push (or export, on platforms without write-back)
- Weekly re-scan + email digest
- Revenue attribution (Layers 1–2, section 1.5)
- Command Center home screen (section 1.7) with a live "Today's Actions" list

### Growth tier additions
- Return-Risk Reduction (12.2)
- Demand/Restock Signals (12.3)
- Competitor Watch (once the category-benchmark threshold is met, see the unlock table in section 1.6)
- Auto-push mode (no manual review needed, still logged/reversible)
- Content Hub + Studio integration: AI-generated comparison pages, buyer's guides, FAQ blocks, social/email drafts triggered automatically by the Signals → Actions table (section 1.7)
- Auto-generated product video via Higgsfield (12.5) — turns existing product photos into video ads, including automatic video drafts tied to the same Signals → Actions triggers as text content
- Autonomy controls (12.6) — merchant chooses which content types (e.g., video posts) can auto-publish versus always requiring review
- Unified Marketing View (section 1.7) — AI-agent, email/social, and paid-ads performance in one ranked view
- LLMs.txt generator and manager
- robots.txt checker (confirms OAI-SearchBot, PerplexityBot, Google-Extended aren't blocked)
- Daily re-scan instead of weekly

### Later / V2
- Multi-language content generation and video localization (strong angle for PT/EU merchants — underserved by mostly-US tools; Studio's video generation via Higgsfield supports multilingual voice, see section 12.5)
- On-Site AI Sales Agent (12.4) — deliberately deferred to its own build phase, not a bolt-on
- Public leaderboard per category (organic growth/social proof play, like Glara's)
- Slack/WhatsApp digest instead of email only (WhatsApp matters a lot for PT/EU small merchants)

*(Note: WooCommerce and generic/CSV-mode support are no longer "later" items — per section 0.1, they're core build priorities alongside Shopify, not a V2 add-on.)*

---

## 3. Information Architecture (Sitemap)

```
/                      Landing
/scan                  Free scan flow (no login required to start)
/connect               Platform picker + connect (Shopify OAuth, WooCommerce API key, or generic feed)
/dashboard             Command Center (home after login) — Environment strip + Today's Actions + product grid
/dashboard/product/:id Product detail + fix view (includes Agent-Ready tab, section 12.1)
/dashboard/monitor     Trends, attribution, revenue recovered, Restock Signals (12.3)
/dashboard/return-risk Return-Risk module (Growth, 12.2)
/dashboard/competitors Competitor watch (Growth only)
/dashboard/content     Content Hub / Studio queue — text, image, and video drafts (Growth only)
/settings              Store settings, AI channel toggles, notification prefs, Autonomy controls (12.6)
/billing               Plan, usage, attribution ledger (every billed euro, traceable)
/pricing               Public pricing page
```

---

## 4. Page-by-Page Design

Design system baseline (already locked): Anton for headlines, Inter for body, JetBrains Mono for metadata/numbers. Alternating black/cream sections. Yellow = single CTA per page. Electric blue = primary data/brand color. Red = fail/invisible states. Zero border-radius throughout.

### 4.1 Landing (`/`)
- **Section 1 (black):** Anton headline, condensed, yellow highlight word: *"Your store is INVISIBLE to AI shoppers."* Sub-line in Inter: one sentence citing the real, sourced stat — AI-driven traffic to Shopify stores grew 8x year-over-year, with AI-search orders up roughly 13x since January 2025 (Shopify Q1 2026 earnings) — not a placeholder number. Single yellow CTA: **"Scan your store — free"**. Mono metadata strip below the fold: live counter, e.g. "€[X] recovered for merchants this month" (real number once you have data; placeholder/aspirational framing pre-launch, clearly the only placeholder left on this page).
- **Section 2 (cream):** Three-column breakdown of the flow (Scan → Fix → Recover), each with a mono step number, not icons — stays true to brutalist restraint.
- **Section 3 (black):** Social proof / leaderboard teaser — "See how [category] brands rank" linking to public leaderboard once it exists.
- **Section 4 (cream):** Pricing teaser, 3 cards, yellow CTA on Growth (highlighted as recommended), link to full `/pricing`.
- **Footer:** minimal, mono type, links to docs/App Store listing.

### 4.2 Free Scan (`/scan`)
- No login wall. Ask for store URL only.
- Black background, live progress state with mono log-style text scrolling ("Checking ChatGPT... Checking Gemini... Checking Perplexity...") — this live-activity-feed pattern is proven to build trust (it's literally why Polsia's `/live` page worked as a growth device).
- Result screen (cream): shows the verdict + €/month estimate for top-line only. Specific fixes blurred/locked with yellow CTA: **"Connect your store to unlock fixes"** → routes to OAuth.

### 4.3 Connect (`/connect`)
- Platform picker first: logo grid — Shopify, WooCommerce, BigCommerce, Magento, "My store isn't listed" (routes to product feed URL / CSV upload / sitemap crawl mode).
- Shopify/WooCommerce/BigCommerce → native OAuth or API-key flow, single centered card, cream. Mono trust line: "Read + write access to product catalog only. Reversible. Disconnect anytime."
- Generic mode → single input for store URL or feed URL, mono note: "We'll read your catalog and generate fixes. Since we can't auto-publish to your platform yet, you'll get a ready-to-use export instead of one-click push."

### 4.4 Dashboard / Command Center (`/dashboard`)

*(Updated — this replaces the earlier single-number dashboard concept. See section 1.7 for the full reasoning; this is the layout that delivers it.)*

- Top: "Your Environment" strip (section 1.6) — compact tiles for every module, active ones showing their live headline number (Recovery €X/mo, Return-Risk €Y prevented, Restock N alerts), locked ones grayed out with the unlock condition from the thresholds table.
- Below that: **"Today's Actions"** — a single ranked list pulling the actionable output of every module: push a fix, approve a Studio post or video, a restock warning — ranked by impact, not by which module produced it. This is the primary work surface, not the product grid.
- A live Studio content queue (drafted/scheduled/published) sits inline in the same view, not behind a separate tab — content is a lane on the home screen, not a different app.
- Product grid (as originally designed): cream section, color-coded (red = Invisible, electric blue = At Risk, black-on-cream = Winning), sorted by €-impact — now a secondary section below the Actions list, for browsing rather than the primary daily view.
- Top nav: mono tabs for Monitor / Competitors / Content / Settings / Billing (unchanged).

### 4.1b Landing dashboard preview note

Section 4.1's landing page still shows a single €-at-risk number in its own hero — that's correct and intentional for a first-time visitor (simplicity sells on a landing page), even though the actual logged-in dashboard is now the fuller Command Center above. Don't conflate the two: the landing page teaser and the real dashboard are different surfaces with different jobs.

### 4.5 Product Detail / Fix (`/dashboard/product/:id`)
- Split-screen diff view: left = current product data (as AI agents see it), right = proposed fix, both in mono/code-style formatting since this is literally showing structured data (JSON-LD) alongside rewritten copy.
- Red-highlighted gaps on the left (missing GTIN, thin description, no structured data).
- Yellow CTA: **"Push to [Platform]"** where auto-push is supported, or **"Download fix"** in generic/export mode. Secondary text-only action: "Edit before pushing."
- Confirmation state after push: electric blue banner, "Live. We'll show impact within 7 days," with a mono timestamp.

### 4.6 Monitor (`/dashboard/monitor`)
- Line chart (electric blue), €-recovered over time, not visibility % — revenue is always the primary axis, visibility score is secondary/tooltip only.
- Attribution breakdown by layer (Direct agent checkout / Referral-matched / Estimated), each with its own mono label so the merchant always knows how confident each number is — critical to the trust requirement in 1.3.
- Weekly digest preview + toggle for email/WhatsApp delivery.

### 4.7 Competitor Watch (Growth only)
- Cream section, table format (mono numbers): your product vs. top-cited competitor in category, side by side, with the specific data gap called out ("They have GTIN + 3 lifestyle images. You have neither.").

### 4.8 Content Hub (Growth only)
- List of generated content pieces (buyer's guides, comparisons, FAQ blocks) with status: Draft / Published / Live on your store's blog.
- Each piece previewable before push, same diff-review pattern as product fixes for consistency.

### 4.9 Billing (`/billing`)
- The trust-critical page. Full ledger: every order ID that contributed to the bill, its attribution layer (1/2/3), and the exact euro amount. Nothing summarized without a way to drill into the raw order.
- Current plan, upgrade/downgrade, cap indicator for Growth tier (progress bar toward the €300/mo cap).

### 4.10 Settings
- Toggle which AI channels to scan/optimize for (ChatGPT, Gemini, Perplexity, Copilot).
- Notification channel (email/WhatsApp).
- Danger zone: disconnect store, delete account — standard, unstyled, no dark patterns.

---

## 5. What This Looks Like Through the User's Eyes

**Maria runs a small skincare shop on Shopify, ~40 SKUs, no marketing team, does everything herself between orders.**

She sees a PT-language Instagram ad: *"A tua loja é invisível para o ChatGPT."* Curious, mildly annoyed — she clicks.

Lands on the black hero page, reads the headline, doesn't fully believe it but the free-scan CTA has zero friction (no signup, no card) so she pastes her store URL. The screen goes into a live scrolling log — "Checking ChatGPT... Checking Gemini..." — it feels like something is actually happening, not a fake loading bar, so she waits instead of bouncing.

Result: **"€340/month at risk."** That number lands differently than a percentage would — she does the mental math (that's more than her Facebook ad spend), and now she's not just curious, she's a little annoyed at herself for not knowing this already. The specific fixes are blurred behind a "Connect your store" CTA. She hesitates for a second at giving store access, but the reversible/read-write-only trust line reassures her, and she's used to installing Shopify apps by now.

She lands in the dashboard. First thing she sees, big and black: **€340/mo at risk**, then a grid of her products, sorted with her three body-oil products glowing red at the top — her actual bestsellers offline, but apparently invisible to AI. She clicks "Fix this" on the top one. Sees her current thin description next to a rewritten one that actually mentions the ingredients and use-case in the way she'd explain it to a customer in person — it doesn't feel like generic AI slop, it reads like her own voice, slightly sharpened. She hits "Push to Shopify." Done in four clicks total from landing to fix.

A week later, a WhatsApp message (she never checks the email digest, but WhatsApp she reads immediately): **"€62 recovered this week. 2 orders came through ChatGPT."** She taps through, sees the actual two order numbers in her own Shopify admin — not just a claim, something she can verify. That's the moment she stops thinking of it as a tool she's testing and starts thinking of it as something that's already paying for itself — she's on Starter at €19/mo, and it just made her 3x that back in a week, so upgrading to Growth for the competitor watch and auto-push doesn't feel like a risk, it feels obvious.

Over the following month, she barely opens the dashboard — the WhatsApp digest is enough. When she does open it, it's not to check a score, it's to see the euro number go up. That's the whole relationship: she doesn't think about AI visibility at all. She thinks about a number that keeps growing with almost no effort from her, which is exactly why she'll never think of PD Commerce as another SaaS subscription to cancel — cancelling it would mean losing money she can now see clearly.

---

## 6. Step-by-Step Onboarding (every screen, every edge case)

This is the sequence a real merchant hits, in order, including what happens when things go wrong — the parts most product docs skip and that's exactly where trust is won or lost.

1. **Landing → enters store URL.** Validate it's a real, reachable URL before doing anything else. If unreachable: "We couldn't reach that URL — check it and try again," not a silent failure.
2. **Live scan screen.** Scrolling mono log. Real steps, not fake: "Fetching product catalog... Querying ChatGPT... Querying Gemini... Querying Perplexity... Calculating impact." Takes 30–90 seconds realistically (per earlier research on this category). If a single AI provider's API times out, don't fail the whole scan — show partial results with a note: "Perplexity check incomplete, retrying in the background," so one flaky dependency never blocks the value.
3. **Result screen.** Top-line €/month number always shown, even for a store with only 3 products (calibrate the estimate model so it doesn't produce absurd numbers on tiny catalogs — cap/floor logic matters here for credibility). Locked fixes below.
4. **Platform picker → connect.** If OAuth/API connection fails (wrong permissions, expired token), the retry message names the exact fix ("You'll need to grant product read/write access — try connecting again and check both boxes"), not a generic error.
5. **Catalog import.** For large catalogs (500+ SKUs), this can't be synchronous — show progress, let the merchant leave and get a WhatsApp/email when it's done: "Your scan is ready — 340 products checked, here's what we found."
6. **Empty/edge catalogs.** A store with 2 products, a store with 3,000 products, and a store with no images or descriptions at all (common for very new shops) all need to produce a coherent result, not a broken UI. For the "nothing to work with" case (empty descriptions everywhere), the verdict should reframe honestly: "Your catalog needs basic content before AI visibility is even possible — here's a checklist," rather than pretending to optimize nothing.
7. **First fix push.** After the very first successful push, trigger a distinct one-time congratulatory state — this is the activation moment, worth a slightly different UI treatment (a mono timestamp + "First fix live. We'll show impact in ~7 days.") because it's the single biggest predictor of whether they come back.
8. **Day 7 check-in.** Whatever the attribution number is — even €0 — send it. Silence at the first checkpoint is worse than a disappointing number; if it's €0, pair it with a next concrete action ("No AI-attributed orders yet — here are 2 more fixes to try") instead of just the flat number.

## 7. Data Model (core entities)

Keeping this simple and legible matters more than completeness at MVP stage:

- **stores** — id, platform (shopify/woo/bigcommerce/generic), connection status, connected_at, plan_tier
- **products** — id, store_id, external_id, title, description, current_score (invisible/at_risk/winning), estimated_monthly_loss
- **scans** — id, store_id, started_at, completed_at, provider_results (json: chatgpt/gemini/perplexity raw findings)
- **fixes** — id, product_id, generated_at, diff (before/after content), status (draft/pushed/rejected), pushed_at
- **attribution_events** — id, store_id, order_id (external), layer (1/2/3), amount, detected_at — this table *is* the billing ledger, not a separate summary; billing reads directly from here so the numbers can never drift from what the merchant can verify
- **return_risk_events** — id, product_id, return_count, flagged_reason, estimated_savings, detected_at (feeds section 12.2)
- **module_unlocks** — id, store_id, module_name, unlocked_at, threshold_met (drives the "Your Environment" panel, section 1.6)
- **content_items** — id, store_id, product_id (nullable), type (text/image/video), source_signal (which module triggered it, or "manual"), status (draft/scheduled/published), asset_url, created_at (backs the Studio queue and Content Hub, including Higgsfield video, section 12.5)
- **customers** — id, store_id, external_id, email, first_order_at, repeat_purchaser (bool) — the light customer/segment layer from section 1.7, deliberately minimal
- **autonomy_settings** — id, store_id, content_type, auto_approve (bool), enabled_at — backs section 12.6, always defaults to false
- **billing_records** — id, store_id, period, base_fee, performance_fee, capped_at, total

The attribution_events → billing_records link being direct (not a recomputed summary) is what makes the "click into any billed euro" trust promise in section 4.9 actually true rather than a UI decoration.

## 8. Retention & Lifecycle Messaging

| Trigger | Channel | Message shape |
|---|---|---|
| Free scan complete | Email + on-screen | €-loss number + locked fixes CTA |
| First fix pushed | WhatsApp/email | Confirmation + "check back in 7 days" |
| Day 7 | WhatsApp preferred | Attribution number (even if €0) + next action |
| Weekly (ongoing) | WhatsApp digest | €-recovered this week, 1 new top opportunity |
| 14 days inactive (connected, no fixes pushed) | Email | "You've got 3 unresolved fixes worth an estimated €X — want us to push them for you?" (nudges toward Growth tier auto-push) |
| Approaching Growth cap (€300/mo) | In-app + email | Transparent heads-up before the cap hits, never a surprise bill |
| Plan downgrade/cancel attempt | In-app | Show cumulative €-recovered to date before confirming cancellation — factual, not guilt-based |

## 9. Failure States & Trust Repair

- **A pushed fix doesn't help after 30 days.** Say so plainly in the Monitor view rather than hiding it: "This fix hasn't shown measurable impact yet" with an option to revert or try an alternate approach. Pretending everything works erodes trust faster than admitting a miss.
- **Attribution dispute.** Merchant questions a billed order. Every record traces to a real order ID (section 7) — support flow is "show the order, show the session/referrer data behind it," not "trust us."
- **Platform disconnects mid-cycle** (merchant revokes API access). Freeze billing immediately, don't estimate/backfill — send a plain notice: "We lost access to your store — reconnect to keep tracking."

## 10. Business KPIs to Track (for you, not the merchant)

- **Activation rate:** % of free scans that connect a store within 48 hours
- **Time-to-first-fix:** minutes from connect to first push — shrink this relentlessly, it's the strongest activation lever
- **Week-1 retention:** % who open the app or click a digest link in the first 7 days
- **€ recovered per merchant per month** (median, not average — averages get skewed by outliers)
- **Starter → Growth conversion rate**
- **Attribution dispute rate** — should trend toward zero; rising disputes = trust problem, treat as a P0 signal not a support ticket volume issue

## 11. First 10 Customers (given your actual situation)

You already have Fiverr gigs and a freelance network — use that distribution before spending on ads:
- Offer the free scan directly to your existing Fiverr/freelance web clients who run Shopify or WooCommerce stores — you already have the relationship and trust
- Manually run the first 5–10 scans yourself if the pipeline isn't fully automated yet — a "concierge MVP" is fine at this stage, the merchant only sees the polished result screen
- Get explicit permission to publish real €-recovered numbers (anonymized or named) as the first social proof for the landing page leaderboard — this is what turns the abstract "€X recovered for merchants" landing page stat into something real instead of aspirational

---

## 12. Expansion Layer: Beyond Search Visibility

All four below reuse the existing scan → verdict → fix → attribution engine — none require new core infrastructure, just new signals feeding the same loop. Sequenced by build cost, cheapest/highest-leverage first.

### 12.1 Agent-Facing Spec Sheet (build first — cheapest, reuses existing pipeline almost untouched)
**What it is:** distinct from optimizing how an LLM *describes* a product in conversation (the current scan) — this optimizes for how an AI shopping agent *transacts* on a customer's behalf via UCP/ACP, which reads structured attributes programmatically, not prose.

**How it works:**
- Extend the existing scan to check for a fixed schema per product: material, dimensions/weight, gemstone specs, sizing options, care instructions, compatibility, delivery timeframe — whatever's missing gets flagged the same way current content gaps are (red highlight, left side of the diff view).
- Generate the missing structured data (JSON-LD `Product` schema extensions) the same way fixes are generated today — same push mechanism, same review-before-push pattern.
- New verdict category alongside Invisible/At Risk/Winning: **"Agent-Ready"** — a product can be conversationally visible but still fail here if an agent can't complete a transaction on it programmatically.

**Where it lives:** a new tab on the existing product detail page (`/dashboard/product/:id`), not a separate section — it's the same fix engine, a second lens on the same product.

**Pricing tier:** Starter (it's core infrastructure hygiene, not a premium add-on — the more products are agent-ready platform-wide, the stronger the whole product's pitch becomes).

**KPI:** % of catalog "Agent-Ready," tracked alongside the existing €-at-risk number.

### 12.2 Return-Risk Reduction (build second — same engine, new cost signal)
**What it is:** the scan engine already reads product pages for gaps; point the same analysis at return-driving gaps instead of only visibility-driving ones (missing sizing charts, ambiguous material claims, no fit guidance) — for jewellery specifically: ring sizing, chain length, "runs small/large" type feedback merchants normally only learn from returns.

**How it works:**
- Requires one new data input beyond what's already collected: return reason codes, pulled from Shopify's or WooCommerce's returns data where available, or a simple manual tagging fallback for merchants without structured return data yet (most small merchants log returns loosely at best — plan for that gap).
- Cross-reference return-heavy products against the same content-gap checks the visibility scan already runs (does this listing have sizing detail, care instructions, etc.) to surface "this pattern is fixable" vs. "this is a genuine fit/quality issue outside the product's control."
- Same fix-generation and push pattern as the core loop.

**Where it lives:** feeds into the Command Center's "Today's Actions" list (section 1.7/4.4) with its own ranking weight alongside visibility-driven fixes — merchant works from one ranked list, not a separate return-risk dashboard.

**Pricing tier:** Growth (it needs the returns-data integration, which is a heavier lift than Starter's core scan, and it's a clear value-add that justifies the tier).

**KPI:** estimated £ in prevented returns, tracked the same way €-recovered is tracked — same ledger pattern, new event type (`return_risk_events` alongside `attribution_events`).

### 12.3 Demand/Restock Signals (build third — pure output of data you'll already have)
**What it is:** turns the attribution data the product already collects (which products AI agents are driving sales toward, and how fast) into a forward-looking alert instead of only a backward-looking recovery number.

**How it works:**
- No new external API needed — this is entirely a query over `attribution_events` + existing store order/inventory data already pulled for the core scan.
- Simple velocity model: compare recent AI-attributed sales rate per SKU against current stock level → flag stockout risk with a plain-language estimate ("at this rate, sold out in ~9 days").
- This is explicitly advisory, not automated reordering — small merchants like Sophie won't trust an AI placing stock orders on their behalf, and that's the right instinct to respect, not override.

**Where it lives:** a card on the Monitor page (`/dashboard/monitor`), next to the existing €-recovered trend line — same page, same visual language, no new nav item needed.

**Pricing tier:** Growth (it's a natural upsell reason: "upgrade to see which products are about to sell out because of AI traffic").

**KPI:** stockout incidents avoided (self-reported initially — ask merchants directly via the weekly digest, "did this alert help?" — cheap to measure, valuable signal).

### 12.4 On-Site AI Sales Agent (build last — biggest lift, deserves its own phase, not a bolt-on)
**What it is:** closes the loop between *getting found* by an external AI agent and *actually converting* once the shopper lands on the store — a chat widget on the merchant's own site, trained on their real catalog, policies, and FAQ content, answering questions in the merchant's voice rather than generically.

**How it works:**
- Ingests the same product data the scan/fix engine already has (no duplicate data pipeline) plus merchant-provided policy text (shipping, sizing, returns) as a one-time setup step.
- Widget answers product questions, makes recommendations from the actual catalog, and can hand off to checkout — critically, every conversation that leads to a sale gets tagged and flows into the same `attribution_events` table as any other AI-driven sale, so it's measured with the same trusted ledger, not a separate metric silo.
- Explicitly scoped away from Studio: Studio generates outbound marketing content: this is an inbound, on-page conversion tool. Different job, shares only the underlying product data.

**Where it lives:** new top-level nav item (`/dashboard/agent-setup`) for configuration; the widget itself is embed code the merchant adds to their storefront theme, same pattern as any Shopify app widget.

**Pricing tier:** Growth, likely with its own usage-based add-on beyond the base 8% (e.g., a small per-conversation or per-resolved-sale fee) once volume data exists to price it fairly — don't guess at pricing before you have real conversation-to-sale conversion numbers from a pilot group.

**KPI:** conversion rate lift on pages with the widget active vs. a control group without it — this needs a genuine A/B setup to be credible, not just a before/after comparison, since it's the one feature here making a direct causal claim about conversion.

**Why it's last:** unlike 12.1–12.3, this doesn't reuse existing infrastructure — it's a new real-time system (chat, hosting, latency, escalation-to-human fallback for questions it can't answer) sitting on top of the same data. Treat it as its own project with its own timeline once the core Recovery + Agent-Ready + Return-Risk + Restock loop is proven and generating revenue to fund it.

### 12.5 Auto-Generated Product Video, via Higgsfield (Studio capability, triggered by Commerce signals)

**What it is:** turns existing product photos into a short video ad — no photoshoot needed — using Higgsfield's product-video API/MCP, which is purpose-built for exactly this (360 spins, lifestyle scenes, batch catalog generation from a single photo per product).

**How it works:**
- Feeds Higgsfield the product's existing catalog images plus the same product data the Recovery Engine already has (name, description, category) to generate a relevant, on-brand video rather than a generic clip.
- Wired into the Signals → Actions table (section 1.7): a fix going live, a restock warning, or a competitor-defense moment can each trigger a matching video draft, not just a text/image post — one event, multiple content formats, generated together.
- Supports multilingual voice/localization (per Higgsfield's own multilingual lip-sync capability), directly useful for PT/EU merchants selling across languages.
- Can batch-generate video for a merchant's whole catalog at once, not just one product at a time — a genuine "turn 500 static listings into 500 videos in an afternoon" capability, not a one-at-a-time tool.

**Where it lives:** inside the Content Hub / Studio queue on the Command Center, alongside text and image drafts — video is a content type, not a separate app.

**Pricing tier:** Growth (content generation tier, same as the rest of Content Hub).

### 12.6 Autonomy Controls (the auto-approve exception — needs careful scoping)

**What it is:** every piece of generated content (fixes, posts, videos) defaults to requiring merchant approval before publishing, per the review-before-push principle established throughout this doc. Autonomy Controls let a merchant selectively loosen that for specific, lower-risk content types once they trust the output — e.g., "auto-publish generated product videos without review" — while higher-risk actions (actual store/catalog changes, anything touching live pricing or checkout) can never be set to auto-approve, full stop.

**Why this needs to be scoped carefully, not just "on/off":**
- Per-content-type granularity, not a single global toggle — a merchant might reasonably trust auto-publishing a product video but never want a live product description changed without a look first.
- Auto-approve should require a minimum track record first (e.g., the merchant has manually approved N pieces of that content type without editing them) rather than being available from day one — this is a trust threshold, not a settings checkbox available immediately.
- Every auto-published action is still logged and reversible in the same history/ledger as manually approved ones — autonomy changes the approval step, never the audit trail.
- This is explicitly the first place in the whole product where something can go live without a human looking at it first — treat it as a genuine risk decision requiring its own review before shipping, not a minor settings feature.

**Where it lives:** `/settings`, a dedicated "Autonomy" section, separate from notification preferences.

**Pricing tier:** Growth.

---

---

## 13. Open Build Order (final, reconciled with everything above)

Per section 0: don't over-invest early in the connectivity/scan layer — it's free/bundled everywhere and mostly a checkbox against open-source SDKs. Invest early in the fix→measure loop and the data that becomes the Benchmark Layer, since that's what compounds.

1. **Fork Picker + Commerce/Validation landing pages** (per the frontend build brief) — cheap, needed regardless of backend progress
2. **Data model** (section 7) — foundation everything else depends on
3. **Shopify connector** (OAuth, catalog, order metadata) — fastest platform to prove the loop
4. **WooCommerce connector**, built alongside Shopify rather than after it — per section 0.1, this is a core priority from day one, not a V2 item, because of the distribution/TAM case in section 1.3, not a connectivity-pricing case
5. **Scan → Verdict → Fix engine**, including the Agent-Ready Spec Check (12.1) bundled in from the start — both are the same pipeline, one lens
6. **Attribution Layers 1 & 2 only** (skip the Layer 3 estimate until real billing disputes justify building it)
7. **Command Center + "Today's Actions" list** (section 1.7/4.4) — build this before piling on more modules; it's the home screen every subsequent module plugs into, not an afterthought
8. **Billing ledger + Stripe integration**, tied directly to attribution_events, never a recomputed summary
9. **Return-Risk (12.2) and Restock Signals (12.3)** — cheap additions once the Command Center and attribution exist
10. **Studio connector + Signals → Actions wiring** (section 1.7) — the automation table, even if Studio's own feature depth is being built separately, the hooks on the Commerce side need to exist here
11. **Competitor Watch**, once enough merchants exist in a category to make the benchmark honest (section 1.6 threshold table)
12. **Auto-generated video via Higgsfield (12.5)** and **Autonomy Controls (12.6)** together, since autonomy settings need to exist before anything is allowed to auto-publish
13. **On-Site AI Sales Agent (12.4)** — explicitly its own later phase, funded by revenue from everything above, not built alongside it

Validate the €-loss framing and the fix→push loop with real merchants as early as possible (steps 1–5) before building the rest — everything from step 6 onward assumes that core loop is already proven to land with actual store owners.
