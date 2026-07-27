# PDR Commerce — v5 (THE WORKFORCE)

Authoritative for every Commerce surface. **Supersedes v4 (the ledger, running).** Decided
2026-07-27. v4 is not rejected as *craft* — the paper, the type and the rationed colour survive
intact. It is rejected as a *model*.

---

## 1. Why v4 had to go

v4 made the business legible. It did not make it a different category of thing.

Thirteen views is thirteen tools. That is Shopify's app store, smaller and worse. Every session
added a view; each view was one section deep; the depth read as breadth. And the whole surface
was **read-then-decide**: the product observed, proposed, and waited. An operator who must
approve everything is operating the business themselves with extra steps.

The Shopify test settles it. Shopify will ship agent-readability natively, free, with a
membership. Anything Commerce does that is *a tool the owner operates* will be shipped by the
platform the owner is already paying. What Shopify structurally cannot ship is **staff** — it is
a neutral platform with eight thousand apps and cannot take on liability for deciding what your
business should do.

> **v5 in one line: Commerce is not a toolset. It is a workforce.**

You do not operate panels. You read what your staff did and answer what they ask.

---

## 2. Locked decisions

**D1 — Workers, not views.** The unit of the product is a worker with a job, not a screen with a
table. Navigation lists staff. A view exists only because a worker needs somewhere to report.

**D2 — Every worker has a mandate.** A written scope, and numeric limits the owner sets: spend
caps, price-change range, posting frequency, approval thresholds. **Inside the mandate a worker
acts without asking. Outside it, it stops and asks.** This is the whole difference between
proposing and operating.

**D3 — Both sides.** Commerce runs the sell side (your store transacts with agents) *and* the
buy side (your buying agent transacts with other stores). The buy side is new and is the reason
this is not a Shopify feature: a buying agent works against sellers, so the seller's platform
will never build one.

**D4 — Nothing is modelled.** Carried unchanged from v4. Every figure is a counted event. What
cannot be known is `null` with the missing fact named. A worker never reports work it did not do.

**D5 — Attribution is mandatory.** Every action records whether a human or a worker did it, and
under which mandate. An autonomous system whose owner cannot tell what it did unattended is not
trustworthy at any level of capability.

**D6 — Reversibility before autonomy.** No worker gets a capability until the action it takes can
be undone and the previous state is captured. Catalogue writes already do this; spend does not,
which is why spend stays gated longest.

**D7 — The cadence is the product.** Workers run on a schedule whether or not anyone is looking.
A workforce that only acts when you open the tab is a dashboard wearing a costume.

---

## 3. The workforce

Six workers. Everything in the product belongs to exactly one.

| worker | owns | acts on its own | asks first |
|---|---|---|---|
| **SELL** | storefront, catalogue, agent rails, orders in | availability, feed regeneration, order intake | price changes beyond the mandate range, retiring a product |
| **BUY** | suppliers, requisitions, quotes, purchases out | sourcing, comparing, requesting quotes | **every purchase over the cap — spend is the last thing to be trusted** |
| **MARKET** | demand: campaigns, pages, renders, posts | drafting, rendering, scheduling within frequency limits | publishing under the brand's name the first time each channel is used |
| **MONEY** | costs, margin, expenses, settlement | recording, reconciling, flagging loss-making SKUs | discounting, writing off, anything that moves money |
| **CARE** | deliveries, returns, questions | answering from the record, issuing deliveries, judging returns against published policy | refunds, anything the record cannot answer |
| **CHIEF** | the tick, the mandates, the report | running the shift, escalating, writing the operator statement | nothing — it never acts on the business directly |

**Folded in:** Social is MARKET's mouth, not a worker. Customers is a SELL report. Events is the
shift record. Products is SELL's catalogue. Automation becomes mandates. Finance becomes MONEY.

---

## 4. The surfaces

**THE DESK** (`/commerce/command`) — home. Not a dashboard of metrics: a shift report and a
queue. *What your staff did since you last looked* and *what they need from you*. Metrics live
with the worker that owns them.

**A worker page each** — its mandate (editable), what it did, what it produced, what it is
waiting on, and the numbers it is judged by.

**THE RECORD** (`/commerce/statement`) — the proof of work, unchanged in purpose.

---

## 5. Components

`ledger-ui.tsx` is replaced by `workforce-ui.tsx`.

**Survive from v4 (craft was right):** `Num` `Stamp` `Section` `Figure` `FigureRow` `Heads` `Row`
`Action` `Pick` `AuditLine` `Nothing` `Headline` `Funnel`

**Retired:** `Thin` (shrugging empty state — `Nothing` teaches instead), `Bar`, `Pulse`
(absorbed into `Worker`), `Event` (becomes `ShiftLine`).

**New:**

- `Worker` — name, state (`working` / `waiting on you` / `idle` / `unarmed`), last shift, the
  one number it is judged by, and its ask count.
- `Shift` / `ShiftLine` — a run of work: when, what was attempted, what happened, under which
  mandate. Failures render as loudly as successes.
- `Ask` — a worker's question to the owner, with the answer inline and the consequence stated
  ("answering this releases the delivery").
- `Mandate` — the editable limits. Shows what the worker may do without asking, in plain words,
  not JSON.
- `Requisition` / `Quote` / `Purchase` — the buy side.

**Palette, type and rules:** unchanged from v4. Warm paper `#F5F3ED`, ink `#111111`, LIVE
`#0047FF`, OK `#1F7A44`, WARN `#B45309`, FAULT `#C0271D`, inset `#ECE8DE`. Anton display,
JetBrains Mono for every number and stamp. Zero border-radius. Hard-cut state changes.

**One new rule:** a worker's state is never decoration. `waiting on you` must correspond to a
real item in the queue, and clicking it must go there.

---

## 6. The buy side

The half nobody has, and the reason the network can seed itself.

```
Requisition        something the business needs (stock, a service, ad spend)
  ↓ sourcing       BUY finds candidate suppliers — including other PDR stores
Quote              what each supplier offers: price, lead time, terms
  ↓ comparison     scored on the mandate's terms, not on price alone
Purchase           what was bought, from whom, for how much, on whose authority
```

**PDR-to-PDR:** business A's BUY worker purchases from business B's store over MCP. Both sides
already exist — B publishes `place_order`, A needs an agent that calls it. This is the answer to
the cold-start problem: PDR hosts both sides, so the first transactions do not wait on the
outside world.

**Spend is gated hardest.** A purchase is irreversible in a way a price change is not. BUY sources
and compares freely; it does not spend beyond its cap without a human, and the cap starts at zero.

---

## 7. Order of work

1. `workforce-ui.tsx` — the components
2. Mandates — the model, the editor, the enforcement
3. THE DESK — shift report + ask queue
4. Worker pages — SELL, MARKET, MONEY, CARE rebuilt on the new model
5. BUY — data model, sourcing, quotes, PDR-to-PDR purchase
6. Arm the cadence and leave it running for seven days

**Blocked externally:** MARKET's hands (Higgsfield credits, Ayrshare), settlement
(`STRIPE_WEBHOOK_SECRET`), the cadence (`CRON_SECRET`). These are noted at each surface, never
faked.
