import "server-only";

/**
 * THE BUY SIDE — what the business needs, who can supply it, what was bought.
 *
 * Every commerce tool in existence models the sell side. This models the other
 * one, and it is the half a seller's platform will never build: a buying agent
 * works AGAINST sellers, so Shopify cannot ship one without acting against its
 * own customers.
 *
 * The flow, and why it is four objects rather than one:
 *
 *   Requisition   something the business needs. Raised from a MEASURED fact
 *                 ("SKU X has 4 days of cover"), never from a hunch. The `need`
 *                 field carries that evidence and is not optional.
 *   Quote         one supplier's offer against a requisition. Several per
 *                 requisition; kept even after one is accepted, because the
 *                 record of what was NOT chosen is what makes a purchase
 *                 auditable.
 *   Purchase      what was actually bought, from whom, at what price, and on
 *                 whose authority — a mandate id or a human.
 *
 * PDR-to-PDR: a supplier may be another PDR-run store, in which case its quote
 * comes from that store's real catalogue over its own MCP endpoint, and the
 * purchase is a real order placed against it. Both halves already exist; this
 * is what joins them. It is also the answer to the cold-start problem — the
 * network can transact with itself before the outside world arrives.
 *
 * SPEND IS THE LAST THING TRUSTED. Sourcing and quoting are free; a purchase
 * beyond the mandate's cap stops and asks. The cap starts at zero, so an
 * unattended worker cannot spend a euro until somebody deliberately says it may.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { blobConfigured, getJson, putJson } from "./blobStore";

export type RequisitionStatus = "open" | "quoted" | "ordered" | "closed" | "declined";

export type Requisition = {
  id: string;
  slug: string;
  ts: string;
  /** What is needed, in plain words. */
  what: string;
  /** How much, when it is countable. */
  qty?: number;
  unit?: string;
  /** The MEASURED fact that raised it. Never a guess, never marketing language. */
  need: string;
  /** Which SKU it restocks, when it is stock rather than a service or spend. */
  sku?: string;
  /** What the business is willing to pay, if the owner set one. */
  budget?: number;
  currency?: string;
  status: RequisitionStatus;
  /** "auto" when a worker raised it from a metric; "owner" when a human did. */
  by: "auto" | "owner";
};

export type Quote = {
  id: string;
  requisitionId: string;
  supplier: string;
  /** Where the offer came from, so it can be checked. */
  sourceUrl?: string;
  /** Another PDR-run store — the network buying from itself. */
  pdrSlug?: string;
  /** Unit price. Totals are computed, never stored, so they cannot drift. */
  unitPrice: number;
  currency: string;
  leadTimeDays?: number;
  terms?: string;
  ts: string;
  /** Set by the comparison pass, with the reason it won on the mandate's terms. */
  best?: boolean;
  bestReason?: string;
  /** True when the price was read from a real catalogue rather than estimated.
      An unverified quote can be shown but must never be auto-accepted. */
  verified: boolean;
};

export type Purchase = {
  id: string;
  requisitionId: string;
  quoteId: string;
  supplier: string;
  total: number;
  currency: string;
  ts: string;
  /** A mandate id when a worker bought it unattended, or "owner". */
  authority: string;
  /** The order id at the far end, when the supplier issued one. */
  externalOrderId?: string;
  status: "placed" | "failed";
  note?: string;
};

export type Procurement = {
  requisitions: Requisition[];
  quotes: Quote[];
  purchases: Purchase[];
};

const DIR = path.join(process.cwd(), ".data", "procurement");
const SLUG_RE = /^[a-z0-9-]{3,64}$/;
const EMPTY: Procurement = { requisitions: [], quotes: [], purchases: [] };

function file(slug: string): string {
  return path.join(DIR, `${slug}.json`);
}

function mintId(prefix: string, seed: string): string {
  let h = 2166136261 >>> 0;
  const s = seed + Date.now().toString(36);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return `${prefix}-${(h >>> 0).toString(16).padStart(8, "0").toUpperCase().slice(0, 6)}`;
}

export async function loadProcurement(slug: string): Promise<Procurement> {
  if (!SLUG_RE.test(slug)) return EMPTY;
  if (blobConfigured()) {
    const blob = await getJson<Procurement>(`procurement/${slug}.json`);
    if (blob) return { ...EMPTY, ...blob };
  }
  try {
    return { ...EMPTY, ...(JSON.parse(await fs.readFile(file(slug), "utf8")) as Procurement) };
  } catch {
    return EMPTY;
  }
}

async function save(slug: string, p: Procurement): Promise<void> {
  if (blobConfigured()) { await putJson(`procurement/${slug}.json`, p); return; }
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(file(slug), JSON.stringify(p, null, 2), "utf8");
}

/**
 * Raise a need. Idempotent per SKU while one is still open: a worker running
 * every day must not raise the same restock thirty times, and an owner opening
 * the page to thirty identical rows would reasonably stop trusting it.
 */
export async function raiseRequisition(slug: string, r: {
  what: string; need: string; qty?: number; unit?: string; sku?: string;
  budget?: number; currency?: string; by?: "auto" | "owner";
}): Promise<{ requisition: Requisition; created: boolean }> {
  const p = await loadProcurement(slug);
  if (r.sku) {
    const open = p.requisitions.find((x) => x.sku === r.sku && (x.status === "open" || x.status === "quoted"));
    if (open) return { requisition: open, created: false };
  }
  const requisition: Requisition = {
    id: mintId("REQ", slug + r.what),
    slug, ts: new Date().toISOString(),
    what: r.what.slice(0, 160),
    need: r.need.slice(0, 300),
    ...(r.qty != null ? { qty: r.qty } : {}),
    ...(r.unit ? { unit: r.unit } : {}),
    ...(r.sku ? { sku: r.sku } : {}),
    ...(r.budget != null ? { budget: Math.round(r.budget * 100) / 100 } : {}),
    currency: r.currency ?? "EUR",
    status: "open",
    by: r.by ?? "auto",
  };
  p.requisitions.unshift(requisition);
  await save(slug, p);
  return { requisition, created: true };
}

/** Record offers against a requisition, replacing any previous round for it. */
export async function recordQuotes(slug: string, requisitionId: string, quotes: Omit<Quote, "id" | "requisitionId" | "ts">[]): Promise<Quote[]> {
  const p = await loadProcurement(slug);
  const req = p.requisitions.find((r) => r.id === requisitionId);
  if (!req) return [];
  p.quotes = p.quotes.filter((q) => q.requisitionId !== requisitionId);
  const fresh: Quote[] = quotes.map((q, i) => ({
    ...q,
    id: mintId("QUO", requisitionId + q.supplier + i),
    requisitionId,
    ts: new Date().toISOString(),
    unitPrice: Math.round(q.unitPrice * 100) / 100,
  }));
  p.quotes.push(...fresh);
  if (fresh.length && req.status === "open") req.status = "quoted";
  await save(slug, p);
  return fresh;
}

/**
 * Score the offers and mark a winner.
 *
 * Not simply cheapest. A quote that misses the requisition's deadline or cannot
 * be verified is not a bargain, and an agent that only ever optimises price is
 * how a business ends up with unusable stock from a supplier nobody checked.
 */
export function compareQuotes(quotes: Quote[], opts: { maxLeadDays?: number } = {}): Quote[] {
  if (!quotes.length) return quotes;
  const usable = quotes.filter((q) =>
    q.verified && (opts.maxLeadDays == null || (q.leadTimeDays ?? 0) <= opts.maxLeadDays));
  // Nothing verified in time means no winner at all, rather than crowning the
  // least-bad option and letting an unattended worker act on it.
  const pool = usable.length ? usable : [];
  let winner: Quote | null = null;
  for (const q of pool) if (!winner || q.unitPrice < winner.unitPrice) winner = q;
  return quotes.map((q) => {
    if (winner && q.id === winner.id) {
      // Say WHY it won, accurately. A verified quote frequently loses on price
      // to an unverified lead, and reporting that as "cheapest" would be false
      // — the owner is entitled to know they are paying for certainty.
      const cheapestOverall = quotes.every((o) => o.unitPrice >= q.unitPrice);
      const beatOnLead = pool.some((o) => o.id !== q.id && o.unitPrice < q.unitPrice);
      const bestReason = cheapestOverall ? "cheapest overall"
        : beatOnLead ? "cheapest that arrives in time"
        : "cheapest checkable offer";
      return { ...q, best: true, bestReason };
    }
    // Strip any previous crown: a re-comparison must not leave two winners.
    const rest = { ...q };
    delete rest.best;
    delete rest.bestReason;
    return rest;
  });
}

export async function saveComparison(slug: string, requisitionId: string, opts: { maxLeadDays?: number } = {}): Promise<Quote[]> {
  const p = await loadProcurement(slug);
  const mine = p.quotes.filter((q) => q.requisitionId === requisitionId);
  const scored = compareQuotes(mine, opts);
  p.quotes = [...p.quotes.filter((q) => q.requisitionId !== requisitionId), ...scored];
  await save(slug, p);
  return scored;
}

/** Record a completed purchase and close its requisition. */
export async function recordPurchase(slug: string, pu: Omit<Purchase, "id" | "ts">): Promise<Purchase> {
  const p = await loadProcurement(slug);
  const purchase: Purchase = { ...pu, id: mintId("PUR", slug + pu.quoteId), ts: new Date().toISOString() };
  p.purchases.unshift(purchase);
  const req = p.requisitions.find((r) => r.id === pu.requisitionId);
  if (req && purchase.status === "placed") req.status = "ordered";
  await save(slug, p);
  return purchase;
}

export async function setRequisitionStatus(slug: string, id: string, status: RequisitionStatus): Promise<Requisition | null> {
  const p = await loadProcurement(slug);
  const r = p.requisitions.find((x) => x.id === id);
  if (!r) return null;
  r.status = status;
  await save(slug, p);
  return r;
}

/** What the buy side has actually cost, for MONEY to reconcile against. */
export function spendTotals(p: Procurement): { total: number; count: number; byMonth: Record<string, number> } {
  const byMonth: Record<string, number> = {};
  let total = 0, count = 0;
  for (const pu of p.purchases) {
    if (pu.status !== "placed") continue;
    total += pu.total; count += 1;
    const m = pu.ts.slice(0, 7);
    byMonth[m] = (byMonth[m] ?? 0) + pu.total;
  }
  return { total: Math.round(total * 100) / 100, count, byMonth };
}
