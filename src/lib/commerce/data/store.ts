/**
 * PD Commerce rebuild — Phase 2 data store (design doc §7).
 *
 * A localStorage-backed, repository-shaped store for the 11 commerce entities.
 * Follows the established convention from src/lib/chamber-cases.ts: typed DB blob,
 * a read()/write() localStorage pair, and repository-shaped accessors so the whole
 * thing can be swapped for the Supabase tables (0005_pd_commerce.sql) later without
 * touching call sites. Pure client TS — SSR-safe (no-ops when `window` is absent).
 *
 * BILLING IS DERIVED, NOT STORED (§1.5). There is deliberately NO create/write for
 * billing_records. `computeBillingRecord` recomputes base_fee + performance_fee +
 * capped_at + total from attribution_events (layers 1 & 2 only; layer 3 excluded)
 * every time it's called, so the total can never drift from its backing events.
 * `listBillableEvents` returns the exact events (with real order_id) behind the
 * total, so the UI can show every billed euro's real order.
 */

import type {
  AttributionEvent,
  AutonomySettings,
  BillingPeriod,
  BillingRecord,
  ContentItem,
  Customer,
  Fix,
  ModuleUnlock,
  Plan,
  Product,
  ReturnRiskEvent,
  Scan,
  Store,
} from "./types";

/* ── Persistence primitives (mirrors chamber-cases.ts) ─────────────────────── */

interface CommerceDB {
  stores: Store[];
  products: Product[];
  scans: Scan[];
  fixes: Fix[];
  attribution_events: AttributionEvent[];
  return_risk_events: ReturnRiskEvent[];
  module_unlocks: ModuleUnlock[];
  content_items: ContentItem[];
  customers: Customer[];
  autonomy_settings: AutonomySettings[];
  // NOTE: no `billing_records` array — billing is derived, never stored (§1.5).
}

const DB_KEY = "pd-commerce-data";

const EMPTY: CommerceDB = {
  stores: [],
  products: [],
  scans: [],
  fixes: [],
  attribution_events: [],
  return_risk_events: [],
  module_unlocks: [],
  content_items: [],
  customers: [],
  autonomy_settings: [],
};

function read(): CommerceDB {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return { ...EMPTY };
    const db = JSON.parse(raw) as Partial<CommerceDB>;
    // Merge over EMPTY so a partial/older blob never yields undefined arrays.
    return { ...EMPTY, ...db };
  } catch {
    return { ...EMPTY };
  }
}

function write(db: CommerceDB): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch { /* quota — ignore */ }
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function now(): string {
  return new Date().toISOString();
}

/** Derive the "YYYY-MM" billing period from an ISO timestamp. */
export function periodOf(iso: string): BillingPeriod {
  return iso.slice(0, 7);
}

/* ── stores ────────────────────────────────────────────────────────────────── */

export function createStore(input: Omit<Store, "id" | "created_at">): Store {
  const db = read();
  const store: Store = { ...input, id: genId("store"), created_at: now() };
  db.stores.push(store);
  write(db);
  return store;
}

export function listStores(): Store[] {
  return read().stores.slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getStore(id: string): Store | null {
  return read().stores.find((s) => s.id === id) ?? null;
}

export function updateStore(id: string, patch: Partial<Omit<Store, "id" | "created_at">>): Store | null {
  const db = read();
  const s = db.stores.find((x) => x.id === id);
  if (!s) return null;
  Object.assign(s, patch);
  write(db);
  return s;
}

/* ── products ──────────────────────────────────────────────────────────────── */

export function createProduct(input: Omit<Product, "id" | "created_at" | "updated_at">): Product {
  const db = read();
  const ts = now();
  const product: Product = { ...input, id: genId("prod"), created_at: ts, updated_at: ts };
  db.products.push(product);
  write(db);
  return product;
}

export function listProducts(storeId: string): Product[] {
  return read().products.filter((p) => p.store_id === storeId);
}

export function getProduct(id: string): Product | null {
  return read().products.find((p) => p.id === id) ?? null;
}

export function updateProduct(id: string, patch: Partial<Omit<Product, "id" | "store_id" | "created_at">>): Product | null {
  const db = read();
  const p = db.products.find((x) => x.id === id);
  if (!p) return null;
  Object.assign(p, patch, { updated_at: now() });
  write(db);
  return p;
}

/* ── scans ─────────────────────────────────────────────────────────────────── */

export function createScan(input: Omit<Scan, "id" | "started_at">): Scan {
  const db = read();
  const scan: Scan = { ...input, id: genId("scan"), started_at: now() };
  db.scans.push(scan);
  write(db);
  return scan;
}

export function listScans(storeId: string): Scan[] {
  return read().scans.filter((s) => s.store_id === storeId).sort((a, b) => b.started_at.localeCompare(a.started_at));
}

export function getScan(id: string): Scan | null {
  return read().scans.find((s) => s.id === id) ?? null;
}

export function updateScan(id: string, patch: Partial<Omit<Scan, "id" | "store_id" | "started_at">>): Scan | null {
  const db = read();
  const s = db.scans.find((x) => x.id === id);
  if (!s) return null;
  Object.assign(s, patch);
  write(db);
  return s;
}

/* ── fixes ─────────────────────────────────────────────────────────────────── */

export function createFix(input: Omit<Fix, "id" | "created_at" | "resolved_at">): Fix {
  const db = read();
  const fix: Fix = { ...input, id: genId("fix"), created_at: now(), resolved_at: null };
  db.fixes.push(fix);
  write(db);
  return fix;
}

export function listFixes(storeId: string): Fix[] {
  return read().fixes.filter((f) => f.store_id === storeId).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getFix(id: string): Fix | null {
  return read().fixes.find((f) => f.id === id) ?? null;
}

export function updateFix(id: string, patch: Partial<Omit<Fix, "id" | "store_id" | "created_at">>): Fix | null {
  const db = read();
  const f = db.fixes.find((x) => x.id === id);
  if (!f) return null;
  // Stamp resolved_at when a fix leaves draft, unless the caller set it explicitly.
  const resolving = patch.status && patch.status !== "draft" && f.status === "draft" && patch.resolved_at === undefined;
  Object.assign(f, patch, resolving ? { resolved_at: now() } : {});
  write(db);
  return f;
}

/* ── attribution_events (the billing ledger) ───────────────────────────────── */

export function createAttributionEvent(
  input: Omit<AttributionEvent, "id" | "occurred_at" | "period"> & { occurred_at?: string },
): AttributionEvent {
  const db = read();
  const occurred_at = input.occurred_at ?? now();
  const event: AttributionEvent = {
    ...input,
    id: genId("attr"),
    occurred_at,
    period: periodOf(occurred_at),
  };
  db.attribution_events.push(event);
  write(db);
  return event;
}

export function listAttributionEvents(storeId: string, period?: BillingPeriod): AttributionEvent[] {
  return read().attribution_events.filter(
    (e) => e.store_id === storeId && (period === undefined || e.period === period),
  );
}

/* ── return_risk_events ────────────────────────────────────────────────────── */

export function createReturnRiskEvent(input: Omit<ReturnRiskEvent, "id" | "occurred_at">): ReturnRiskEvent {
  const db = read();
  const event: ReturnRiskEvent = { ...input, id: genId("risk"), occurred_at: now() };
  db.return_risk_events.push(event);
  write(db);
  return event;
}

export function listReturnRiskEvents(storeId: string): ReturnRiskEvent[] {
  return read().return_risk_events.filter((e) => e.store_id === storeId);
}

/* ── module_unlocks ────────────────────────────────────────────────────────── */

export function listModuleUnlocks(storeId: string): ModuleUnlock[] {
  return read().module_unlocks.filter((m) => m.store_id === storeId);
}

/** Upsert a module's unlock state for a store (one row per store+module). */
export function setModuleUnlock(storeId: string, module: ModuleUnlock["module"], unlocked: boolean): ModuleUnlock {
  const db = read();
  let m = db.module_unlocks.find((x) => x.store_id === storeId && x.module === module);
  if (!m) {
    m = { id: genId("mod"), store_id: storeId, module, unlocked, unlocked_at: unlocked ? now() : null };
    db.module_unlocks.push(m);
  } else {
    m.unlocked = unlocked;
    m.unlocked_at = unlocked ? (m.unlocked_at ?? now()) : null;
  }
  write(db);
  return m;
}

/* ── content_items ─────────────────────────────────────────────────────────── */

export function createContentItem(input: Omit<ContentItem, "id" | "created_at">): ContentItem {
  const db = read();
  const item: ContentItem = { ...input, id: genId("content"), created_at: now() };
  db.content_items.push(item);
  write(db);
  return item;
}

export function listContentItems(storeId: string): ContentItem[] {
  return read().content_items.filter((c) => c.store_id === storeId).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function updateContentItem(id: string, patch: Partial<Omit<ContentItem, "id" | "store_id" | "created_at">>): ContentItem | null {
  const db = read();
  const c = db.content_items.find((x) => x.id === id);
  if (!c) return null;
  Object.assign(c, patch);
  write(db);
  return c;
}

/* ── customers ─────────────────────────────────────────────────────────────── */

export function createCustomer(input: Omit<Customer, "id" | "created_at">): Customer {
  const db = read();
  const customer: Customer = { ...input, id: genId("cust"), created_at: now() };
  db.customers.push(customer);
  write(db);
  return customer;
}

export function listCustomers(storeId: string): Customer[] {
  return read().customers.filter((c) => c.store_id === storeId);
}

/* ── autonomy_settings ─────────────────────────────────────────────────────── */

/** Read a store's autonomy settings, defaulting to auto_approve = false (§7). */
export function getAutonomySettings(storeId: string): AutonomySettings {
  const existing = read().autonomy_settings.find((a) => a.store_id === storeId);
  if (existing) return existing;
  return { id: genId("auto"), store_id: storeId, auto_approve: false, max_spend: null, updated_at: now() };
}

/** Upsert a store's autonomy settings (one row per store). */
export function setAutonomySettings(
  storeId: string,
  patch: Partial<Pick<AutonomySettings, "auto_approve" | "max_spend">>,
): AutonomySettings {
  const db = read();
  let a = db.autonomy_settings.find((x) => x.store_id === storeId);
  if (!a) {
    a = { id: genId("auto"), store_id: storeId, auto_approve: false, max_spend: null, updated_at: now(), ...patch };
    db.autonomy_settings.push(a);
  } else {
    Object.assign(a, patch, { updated_at: now() });
  }
  write(db);
  return a;
}

/* ── billing (DERIVED from attribution_events — never stored) ───────────────── */

/** Monthly base subscription fee per plan, in euros (§1.2). */
const BASE_FEE: Record<Plan, number> = {
  starter: 49,
  growth: 99,
  scale: 299,
};

/** Performance-fee cap per plan, in euros/mo. null = uncapped (§1.2). */
const PERF_CAP: Record<Plan, number | null> = {
  starter: null,
  growth: 300, // Growth performance fee capped at €300/mo (§1.2)
  scale: null,
};

/** Performance fee rate: 8% of AI-attributed incremental revenue (§1.2). */
export const PERFORMANCE_FEE_RATE = 0.08;

/** Layers 1 & 2 are billable; layer 3 is excluded from billing (§1.5). */
function isBillable(e: AttributionEvent): boolean {
  return e.layer === 1 || e.layer === 2;
}

/**
 * The exact attribution_events (layers 1 & 2, with their real order_id) that back
 * a store's bill for a period. This is the audit trail: the UI can show every
 * billed euro's real order. The performance fee is derived ONLY from these events.
 */
export function listBillableEvents(storeId: string, period: BillingPeriod): AttributionEvent[] {
  return read().attribution_events.filter(
    (e) => e.store_id === storeId && e.period === period && isBillable(e),
  );
}

/**
 * DERIVE a store's bill for a period from attribution_events. Nothing is stored:
 * every field is recomputed from the billable events each call, so the total can
 * never drift from the events that justify it (§1.5). Returns null if the store
 * does not exist (we need its plan for base_fee + cap).
 */
export function computeBillingRecord(storeId: string, period: BillingPeriod): BillingRecord | null {
  const store = getStore(storeId);
  if (!store) return null;

  const events = listBillableEvents(storeId, period);
  const billable_revenue = events.reduce((sum, e) => sum + (e.incremental_revenue || 0), 0);

  const base_fee = BASE_FEE[store.plan];
  const capped_at = PERF_CAP[store.plan];
  const rawPerformanceFee = billable_revenue * PERFORMANCE_FEE_RATE;
  const performance_fee =
    capped_at === null ? round2(rawPerformanceFee) : round2(Math.min(rawPerformanceFee, capped_at));

  return {
    store_id: storeId,
    period,
    plan: store.plan,
    base_fee,
    performance_fee,
    capped_at,
    total: round2(base_fee + performance_fee),
    billable_revenue: round2(billable_revenue),
    event_count: events.length,
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
