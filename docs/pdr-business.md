# PDR — the business case

> Written 2026-07-26. The commercial thesis: what we sell, who pays, why it survives an
> AI-commoditized economy, and the cheapest way to find out if it's wrong.
> Companion docs: `pdr-commerce-value.md` (value proposition) · `pdr-commerce-outline.md` (what the
> product does) · `pdr-competition.md` (the field) · `pd-studio-status.md` (build state).
> **Nothing in this document is validated by a paying customer yet. Read it as a thesis with an
> attached test, not as a plan that has been proven.**

---

## 1 · Where we actually stand

**Built and working** (locally): an agent-first store generator whose output scores 100/100 on our
own audit · a per-store MCP server where **an AI agent completed a real purchase** (ORD-2EBF4314,
2× mug, €48, attributed to ClaudeBot, stock decremented, ledger written) · UCP profile + agent card
+ multi-standard feeds · an operating system with measured-only data (orders, inventory, customers,
finance, agent funnel) · a compounding per-company marketing brain · a keyless AI-visibility audit
that grades any store URL.

**Not built:** a deployed product · a single paying customer · any distribution · continuous
measurement on domains we don't host · payments.

> The technology is ahead of the evidence. The next work is proof, not capability.

---

## 2 · The macro thesis (and why the "AI eats everything" argument is a tailwind)

If AI commoditizes services, two of our capabilities lose moat status immediately:

- store creation → free (Shopify/Wix/Durable + AI already give it away). **Studio is not a moat.**
- content and ad generation → free (Meta, Google ship it natively). **Marketing autopilot is not a moat.**

Follow the logic to its end and the conclusion inverts:

> **When AI can build every store, being *chosen* by AI is the only scarce thing left.**

An agent answering "best stoneware mugs under €40" names three products, not three hundred. Every
new AI-built competitor sharpens that bottleneck. Value migrates from **production** (commoditized)
to **distribution, trust, verified performance and rails** (scarce).

Therefore our defensible ground is the **demand side of agentic commerce** — determining and
*proving* which sellers agents choose — not the supply side of making stores.

### Why an AI buys anything

Agents have no desires; they execute **delegated mandates**. Demand still terminates in a human
need or an organizational objective. What changes is the mediation:

> **Commerce shifts from persuasion to specification.** A human is seduced by a story; an agent
> satisfies a constraint set — price, availability, delivery window, return policy, provenance,
> compliance. Brand equity does not vanish; it must be re-encoded as attributes a machine can verify.

### If income is redistributed (UBI / mass automation)

Demand flattens and re-sorts rather than disappearing:

- **Grows:** essentials, health, care, experiences, and *meaning goods* — handmade, local,
  human-made, provenanced.
- **Dies:** undifferentiated mid-market goods; comparison agents strip those margins to zero. This
  is a genuine threat to the long tail of small merchants and we should not pretend otherwise.
- **Consequence:** fewer but more specialized sellers, plus a much larger non-consumer layer
  (businesses buying inputs, data, capacity, services).
- **Opportunity:** in an agent-mediated market, *"made by a human" becomes a filterable attribute.*
  Provenance, ethics, locality and carbon must be machine-readable or they are invisible. Making
  those claims legible — and eventually verifiable — is an agent-legibility product.

---

## 3 · What gets sold TO AI (the second market)

Agents are economic actors with their own inputs. This is the half most competitors ignore.

| Market | Status in 2026 | Our position |
|---|---|---|
| Compute & inference | Largest AI input market, mature | Not ours |
| **Tools & capabilities** (an agent hires a callable service per task) | **Emerging — MCP standardizing now** | **Every PDR store already is one** |
| Data & context (catalogs, prices, availability, corpora) | Growing fast | Our feeds/catalog are exactly this |
| **Trust & verification** (is this seller real, will it deliver) | Barely exists — open field | **We hold measured order truth** |
| Placement on agent surfaces (successor to advertising) | Forming | Adjacent to our funnel data |
| Fulfilment as API | Partial | Later |
| Agent-to-agent labour | Early, inevitable | Same endpoint primitive |

### The reframe that matters

> **A PDR store is not a shop. It is a machine-callable commercial endpoint** — something an agent
> can discover, price, trust and transact with. A physical-goods catalog is one instance.

The same rail can publish a service, a dataset, spare capacity, a digital deliverable, or an
agent's own labour — priced, ordered, attributed. **Keep the primitive general**; do not harden the
product around "online shop selling objects to humans."

---

## 4 · Who pays (ranked honestly)

| Segment | Willingness to pay | Reachability | Verdict |
|---|---|---|---|
| **Existing DTC merchants**, €10k–500k/mo, losing AI-sourced orders they cannot see | High — it is revenue, now | Communities, agencies, cold audit links | **First market** |
| **Agencies & consultants** needing a product behind an "AI visibility" retainer | High; 1 agency ≈ 20 merchants | Direct outreach | **Fastest multiplier** |
| **Agent-native sellers** — B2B parts, supplies, data, spec-driven catalogs where machine legibility *is* the product | Medium–high, underserved | Niche, findable | **Strategic beachhead** |
| **Founders starting new businesses** (the Studio story) | Lowest; most churn out | Easiest to attract | **Demo + content engine, not the first revenue line** |

**The uncomfortable conclusion:** "people opening shops with us" is probably not the business.
Existing sellers with money and measurable pain are. Studio's job is to be the reference
implementation that scores 100/100 — proof of expertise — and the honest alternative when a store is
too broken to retrofit.

---

## 5 · Why not the obvious incumbents

| Player | Why the position stays open |
|---|---|
| **Shopify** | Sees only its own merchants; structurally cannot tell you that you are losing to a competitor on Perplexity. Blind to the majority of the market |
| **Profound / Scrunch** | Enterprise GEO monitoring: watch mentions, don't transact, don't operate, no order truth, priced far above a €30k/mo merchant |
| **OpenAI / Google / Perplexity** | **The real existential risk** — they could ship merchant consoles. But no provider will report your performance across its rivals, and none will run your inventory and ads |
| **Agencies** | Buyers of this, not builders |
| **Higgsfield & creative tools** | Supply creative; do not operate businesses |

The unclaimed ground: **the independent, cross-agent commerce layer — measurement plus action, in
one place, for sellers too small for enterprise tooling and unserved by their platform.**

---

## 6 · Revenue model

Priced like an operator, not a SaaS seat:

| Tier | Price | What it is | Gate |
|---|---|---|---|
| **Audit** | Free | One-off AI-visibility score + fix list. Shareable, keyless, viral-capable | Ready — needs hosting |
| **Monitor** | €49–99/mo | Rails published, feeds submitted, continuous agent funnel, alerts when a rival overtakes you | **Blocked on off-domain measurement (§7)** |
| **Operate** | €500–1,500/mo | The workforce doing marketing, ops and finance work; the weekly operator statement as proof. Competes with an agency retainer | Needs channel connections |
| **Performance** | +2–5% of agent-attributed orders | Defensible *only* because every one traces to an order id: "we win when you sell" is auditable | Needs payments |
| **Agency** | Per-seat + white-label | The multiplier | After Monitor works |

Unit-economics logic: the free audit is a cheap acquisition asset (no API cost); Monitor is
low-touch high-margin recurring; Operate carries real inference cost but is priced against human
labour, not software.

---

## 7 · The single most important gap

We can **audit** any store (one-shot, static) but can only **measure** stores we host. Continuous
funnel truth — crawls → retrievals → orders, per agent — is the entire recurring value, and on a
merchant's own domain we currently cannot see it.

**Options:** an edge proxy/worker in front of their store · a server-side snippet · log ingestion ·
a platform app with request access.

> Without this: a free tool. With it: a subscription nobody else can offer.

---

## 8 · Risks, stated plainly

1. **Providers ship merchant analytics** → our measurement commoditizes. *Mitigation:* cross-agent
   comparison, the action layer, order-level truth they don't have.
2. **Shopify makes agent-readiness a default checkbox** → audit value drops for its merchants.
   *Mitigation:* serve the non-Shopify majority; go deeper into operation.
3. **Agentic commerce grows slower than the 2026 numbers imply** → the wedge is early.
   *Mitigation:* the same fixes improve human discoverability; operating value is agent-independent.
4. **Margin compression** from comparison agents kills our own customers. *Mitigation:* aim at
   differentiated, provenanced and B2B sellers, not commodity resellers.
5. **Execution risk dwarfs strategy risk** — solo builder, nothing deployed, no distribution.
   *This is the largest risk in the document.*

---

## 9 · What would prove or kill the thesis

Cheapest decisive test, in order:

1. **Commit and deploy.** Make the free audit public.
2. **Close the measurement gap (§7).** Convert the tool into something continuous.
3. **Ten conversations with real merchants.** Not a launch. Show each their score.
   - ≥3 pay €99/mo for monitoring → the thesis holds; build the rest.
   - 0 pay → the thesis is wrong and it cost a week.
4. **One agency reselling it** → the multiplier is real.
5. **One agent-native seller** (service/data/capacity over MCP) → the second market is real.

Success at 12 months, defined honestly: **20–50 paying merchants, one agency partner, and at least
one seller whose orders arrive predominantly from agents.** Not a valuation — evidence.

---

## 10 · Product implications (what to keep general)

1. **Product types beyond physical goods** — service, digital, data-feed, capacity — with matching
   pricing units (per call, per unit, per month, per seat). Order-intent and MCP `place_order`
   already do the hard part.
2. **Provenance & constraint attributes** in feeds and JSON-LD — human-made, origin, lead time,
   certification — so agents can filter on the reasons humans still choose a seller.
3. **Agent-callable services**, not just catalogs — the on-ramp to selling *to* agents.
4. **A verifiable seller record** built from measured fulfilment truth — the trust layer nobody owns.
5. **Never harden around "shop selling objects to humans."** The endpoint must stay general.
