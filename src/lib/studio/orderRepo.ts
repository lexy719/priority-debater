/**
 * Order repository — real orders taken by published stores.
 *
 * The checkout is deliberately agent-compatible: a plain HTML form (works with
 * JS off) and a JSON order-intent endpoint share this repo. No payment rails
 * yet — orders are RECEIVED, not charged; UCP/ACP is the next layer.
 * File-based (.data/orders, gitignored), Supabase swap seam like the others.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { blobConfigured, getJson, putJson } from "./blobStore";

export type StoreOrder = {
  id: string;
  slug: string;
  ts: string;
  sku: string;
  productName: string;
  price: string;
  /** Numeric order total in EUR (priceValue × qty) when the product has one. */
  total?: number;
  qty: number;
  buyer: { name: string; email: string; address: string };
  channel: "web-form" | "agent-json";
  agent: string; // classified UA of whoever placed it
  status: OrderStatus;
  /** Which marketing surface sent this buyer: "l:<landingId>", "c:<campaignId>",
      or a free token. Absent means the order arrived with no ref — direct, or
      through a surface that predates attribution. Never inferred. */
  source?: string;
  /** Timestamped lifecycle trail — the evidence behind the seller record's
      fulfilment speed. Orders placed before this existed simply have none. */
  history?: { status: OrderStatus; ts: string }[];
};

export type OrderStatus = "received" | "confirmed" | "shipped" | "delivered" | "cancelled";

/**
 * Normalise an inbound ref before it is written to an order. A source is a
 * short opaque token, never free text: it is displayed in the operator's
 * ledger, so an unbounded string from a query parameter has no business there.
 * Anything that does not fit the shape is dropped rather than truncated —
 * a mangled source would attribute revenue to a surface that never existed.
 */
export function normaliseSource(raw: unknown): string | undefined {
  // Case is PRESERVED. Surface ids are minted uppercase ("L-01", "C-02") and
  // the operator's view looks them up by that exact key — lowercasing here
  // would store a ref that never matches the page that earned it, and the
  // revenue would quietly fall into "unattributed" forever.
  const s = String(raw ?? "").trim();
  return /^[A-Za-z0-9][A-Za-z0-9:_-]{0,47}$/.test(s) ? s : undefined;
}
/** Legal lifecycle moves — the Ops Agent's order-flow state machine. */
export const ORDER_FLOW: Record<OrderStatus, OrderStatus[]> = {
  received: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const DIR = path.join(process.cwd(), ".data", "orders");
const SLUG_RE = /^[a-z0-9-]{3,64}$/;

function file(slug: string): string {
  return path.join(DIR, `${slug}.json`);
}

export function orderId(seed: string): string {
  let h = 2166136261 >>> 0;
  const s = seed + Date.now().toString(36);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return "ORD-" + (h >>> 0).toString(16).padStart(8, "0").toUpperCase();
}

async function readAll(slug: string): Promise<StoreOrder[]> {
  if (blobConfigured()) {
    const blob = await getJson<StoreOrder[]>(`orders/${slug}.json`);
    if (blob) return blob;
    // blob miss → local fallback; the next write carries these into Supabase
  }
  try { return JSON.parse(await fs.readFile(file(slug), "utf8")) as StoreOrder[]; } catch { return []; }
}

async function writeAll(slug: string, orders: StoreOrder[]): Promise<void> {
  if (blobConfigured()) {
    await putJson(`orders/${slug}.json`, orders);
    return;
  }
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(file(slug), JSON.stringify(orders, null, 2), "utf8");
}

export async function saveOrder(o: StoreOrder): Promise<void> {
  if (!SLUG_RE.test(o.slug)) throw new Error("bad slug");
  const orders = await readAll(o.slug);
  orders.push({ ...o, history: o.history ?? [{ status: o.status ?? "received", ts: o.ts }] });
  await writeAll(o.slug, orders);
}

export async function loadOrder(slug: string, id: string): Promise<StoreOrder | null> {
  if (!SLUG_RE.test(slug)) return null;
  return (await readAll(slug)).find((o) => o.id === id) ?? null;
}

export async function countOrders(slug: string): Promise<number> {
  if (!SLUG_RE.test(slug)) return 0;
  return (await readAll(slug)).length;
}

export async function updateOrderStatus(slug: string, id: string, next: OrderStatus): Promise<StoreOrder | null> {
  if (!SLUG_RE.test(slug)) return null;
  const orders = await readAll(slug);
  const o = orders.find((x) => x.id === id);
  if (!o) return null;
  const from: OrderStatus = o.status ?? "received";
  if (!ORDER_FLOW[from]?.includes(next)) return null; // illegal transition
  o.status = next;
  o.history = [...(o.history ?? [{ status: from, ts: o.ts }]), { status: next, ts: new Date().toISOString() }];
  await writeAll(slug, orders);
  return o;
}

/**
 * The measured fulfilment record — what a buying agent can check about this
 * seller before it commits. Counts are exact; speed medians are computed only
 * over orders that carry a timestamped trail, and the number of orders behind
 * each median is reported alongside it so nothing looks more solid than it is.
 */
export type FulfilmentRecord = {
  ordersReceived: number;
  byStatus: Record<OrderStatus, number>;
  cancellationRatePct: number | null;
  medianHoursToConfirm: number | null;
  medianHoursToShip: number | null;
  /** How many orders each median is based on. */
  timedOrders: { confirm: number; ship: number };
  firstOrderTs: string | null;
  lastOrderTs: string | null;
  agentOrders: number;
  humanOrders: number;
};

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  const m = s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  return Math.round(m * 10) / 10;
}

export async function loadFulfilmentRecord(slug: string): Promise<FulfilmentRecord> {
  const byStatus: Record<OrderStatus, number> = { received: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
  const empty: FulfilmentRecord = {
    ordersReceived: 0, byStatus, cancellationRatePct: null, medianHoursToConfirm: null, medianHoursToShip: null,
    timedOrders: { confirm: 0, ship: 0 }, firstOrderTs: null, lastOrderTs: null, agentOrders: 0, humanOrders: 0,
  };
  if (!SLUG_RE.test(slug)) return empty;
  const orders = await readAll(slug);
  if (!orders.length) return empty;

  const confirmHrs: number[] = [];
  const shipHrs: number[] = [];
  let agentOrders = 0;
  for (const o of orders) {
    byStatus[o.status ?? "received"] = (byStatus[o.status ?? "received"] ?? 0) + 1;
    if (o.agent && o.agent !== "HUMAN") agentOrders++;
    const h = o.history;
    if (!h?.length) continue;
    const at = (s: OrderStatus) => h.find((x) => x.status === s)?.ts;
    const placed = at("received") ?? o.ts;
    const confirmed = at("confirmed");
    const shipped = at("shipped");
    const hrs = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 3600000;
    if (confirmed) confirmHrs.push(hrs(placed, confirmed));
    if (shipped) shipHrs.push(hrs(placed, shipped));
  }
  const ts = orders.map((o) => o.ts).sort();
  return {
    ordersReceived: orders.length,
    byStatus,
    cancellationRatePct: Math.round((byStatus.cancelled / orders.length) * 100),
    medianHoursToConfirm: median(confirmHrs),
    medianHoursToShip: median(shipHrs),
    timedOrders: { confirm: confirmHrs.length, ship: shipHrs.length },
    firstOrderTs: ts[0] ?? null,
    lastOrderTs: ts[ts.length - 1] ?? null,
    agentOrders,
    humanOrders: orders.length - agentOrders,
  };
}

/** Customers, derived from orders — one row per buyer email. */
export type CustomerRow = { email: string; name: string; orders: number; revenue: number; lastTs: string };
export async function loadCustomers(slug: string): Promise<CustomerRow[]> {
  if (!SLUG_RE.test(slug)) return [];
  const by = new Map<string, CustomerRow>();
  for (const o of await readAll(slug)) {
    const key = o.buyer.email.toLowerCase();
    const row = by.get(key) ?? { email: o.buyer.email, name: o.buyer.name, orders: 0, revenue: 0, lastTs: o.ts };
    row.orders += 1;
    row.revenue += o.total ?? (Number((o.price.match(/[\d.]+/) ?? ["0"])[0]) || 0) * o.qty;
    if (o.ts > row.lastTs) row.lastTs = o.ts;
    by.set(key, row);
  }
  return [...by.values()].sort((a, b) => b.revenue - a.revenue);
}

export type OrdersSummary = {
  count: number;
  revenue: number; // EUR, from numeric totals (price-string-only orders fall back to a parse)
  byChannel: Record<string, number>;
  byAgent: Record<string, number>;
  /** Units sold + revenue per product (name-keyed) — inventory sell-through. */
  bySku: Record<string, { qty: number; revenue: number }>;
  /** Real per-day series (ISO date keyed) — the only chart data Commerce draws. */
  daily: { d: string; revenue: number; orders: number }[];
  /** Orders + revenue credited to each marketing surface, keyed by the ref the
      buyer arrived with. Orders with no ref are counted in `unattributed` and
      are never spread across surfaces — a guess here is a lie about revenue. */
  bySource: Record<string, { orders: number; revenue: number }>;
  unattributed: { orders: number; revenue: number };
  recent: { id: string; ts: string; productName: string; qty: number; price: string; channel: StoreOrder["channel"]; agent: string; status: OrderStatus; source?: string }[];
};

export async function loadOrdersSummary(slug: string): Promise<OrdersSummary> {
  const empty: OrdersSummary = { count: 0, revenue: 0, byChannel: {}, byAgent: {}, bySku: {}, daily: [], bySource: {}, unattributed: { orders: 0, revenue: 0 }, recent: [] };
  if (!SLUG_RE.test(slug)) return empty;
  try {
    const orders = await readAll(slug);
    const byChannel: Record<string, number> = {};
    const byAgent: Record<string, number> = {};
    const bySku: Record<string, { qty: number; revenue: number }> = {};
    const bySource: Record<string, { orders: number; revenue: number }> = {};
    const unattributed = { orders: 0, revenue: 0 };
    const byDay = new Map<string, { revenue: number; orders: number }>();
    let revenue = 0;
    for (const o of orders) {
      const val = o.total ?? (Number((o.price.match(/[\d.]+/) ?? ["0"])[0]) || 0) * o.qty;
      byChannel[o.channel] = (byChannel[o.channel] ?? 0) + 1;
      if (o.agent !== "HUMAN") byAgent[o.agent] = (byAgent[o.agent] ?? 0) + 1;
      const sku = bySku[o.productName] ?? { qty: 0, revenue: 0 };
      sku.qty += o.qty; sku.revenue += val;
      bySku[o.productName] = sku;
      if (o.source) {
        const src = bySource[o.source] ?? { orders: 0, revenue: 0 };
        src.orders += 1; src.revenue += val;
        bySource[o.source] = src;
      } else {
        unattributed.orders += 1; unattributed.revenue += val;
      }
      const d = o.ts.slice(0, 10);
      const day = byDay.get(d) ?? { revenue: 0, orders: 0 };
      day.revenue += val; day.orders += 1;
      byDay.set(d, day);
      revenue += val;
    }
    return {
      count: orders.length, revenue, byChannel, byAgent, bySku, bySource,
      unattributed: { orders: unattributed.orders, revenue: Math.round(unattributed.revenue) },
      daily: [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-14).map(([d, v]) => ({ d, revenue: Math.round(v.revenue), orders: v.orders })),
      recent: orders.slice(-10).reverse().map((o) => ({ id: o.id, ts: o.ts, productName: o.productName, qty: o.qty, price: o.price, channel: o.channel, agent: o.agent, status: o.status ?? "received", ...(o.source ? { source: o.source } : {}) })),
    };
  } catch {
    return empty;
  }
}
