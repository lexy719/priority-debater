/**
 * PD Commerce rebuild — Phase 2 data model (design doc §7 "Data Model").
 *
 * TypeScript interfaces for the 11 core entities. These are the single source of
 * truth for the localStorage repository (`./store.ts`) today and map 1:1 onto the
 * Supabase tables in `supabase/migrations/0005_pd_commerce.sql`, so the store can
 * be swapped for a server-backed implementation later without touching call sites
 * (same pattern as src/lib/chamber-cases.ts).
 *
 * CRITICAL BILLING RULE (§1.5 / §7 operating-rule): a billing_records row is NEVER
 * a stored, independently-computed total. It is DERIVED from attribution_events so
 * it can never drift from the events that back it. `BillingRecord` below is the
 * shape of that derived result, not a stored table — see `computeBillingRecord`.
 */

/* ── Shared primitives ─────────────────────────────────────────────────────── */

/** ISO-8601 timestamp string (e.g. "2026-07-02T12:00:00.000Z"). */
export type ISODate = string;

/** Billing period key, "YYYY-MM" (monthly billing per §1.2). */
export type BillingPeriod = string;

export type Platform = "shopify" | "woo" | "bigcommerce" | "generic";

/** Subscription plan (§1.2). Performance-fee cap differs per plan. */
export type Plan = "starter" | "growth" | "scale";

/* ── 1. stores ─────────────────────────────────────────────────────────────── */

export interface Store {
  id: string;
  name: string;
  url: string;
  platform: Platform;
  plan: Plan;
  /** Owner user id (auth.users) when authenticated; null for anon/local. */
  user_id: string | null;
  created_at: ISODate;
}

/* ── 2. products ───────────────────────────────────────────────────────────── */

/** A product's current AI-visibility standing (§7). */
export type ProductScore = "invisible" | "at_risk" | "winning";

export interface Product {
  id: string;
  store_id: string;
  title: string;
  url: string;
  /** External platform id (Shopify product id, SKU, etc.). */
  external_id: string | null;
  current_score: ProductScore;
  /**
   * Estimated €/month lost to AI invisibility (§7, §4.4 sorting). Set by the
   * scan engine; null until first scored. NOTE: additive vs migration 0005 —
   * carry into a future 0006 migration when Supabase persistence lands.
   */
  estimated_monthly_loss: number | null;
  /** Plain-text description as imported (what AI agents read). Additive vs 0005. */
  description?: string | null;
  /** Raw platform HTML body — the surface fixes rewrite. Additive vs 0005. */
  body_html?: string | null;
  created_at: ISODate;
  updated_at: ISODate;
}

/* ── 3. scans ──────────────────────────────────────────────────────────────── */

export type ScanStatus = "queued" | "running" | "complete" | "failed";

export interface Scan {
  id: string;
  store_id: string;
  status: ScanStatus;
  /** Full scan result payload (scores, buyer queries, competitors, etc.). */
  result: Record<string, unknown> | null;
  started_at: ISODate;
  completed_at: ISODate | null;
}

/* ── 4. fixes ──────────────────────────────────────────────────────────────── */

/** Lifecycle of a proposed fix (§7). */
export type FixStatus = "draft" | "pushed" | "rejected";

export interface Fix {
  id: string;
  store_id: string;
  /** Product this fix targets, if product-specific; null = store-wide. */
  product_id: string | null;
  type: string;
  title: string;
  description: string;
  status: FixStatus;
  /**
   * The generated fix content + reversibility data (additive vs migration 0005;
   * lands as a jsonb column in a future 0006). `fields` is what gets pushed;
   * `previous` is the connector's pre-push snapshot that makes revert possible.
   */
  payload?: {
    fields?: { title?: string; body_html?: string; jsonld?: string };
    previous?: { title?: string; body_html?: string } | null;
    pushed_reverted?: boolean;
  } | null;
  created_at: ISODate;
  /** When status moved to pushed/rejected. */
  resolved_at: ISODate | null;
}

/* ── 5. attribution_events ─────────────────────────────────────────────────── */

/**
 * The ledger of AI-attributed outcomes. Layers 1 & 2 are BILLABLE; layer 3 is
 * excluded from billing (§1.5). `incremental_revenue` is the AI-attributed
 * incremental revenue in euros for this event; `order_id` is the REAL order that
 * backs it, so every billed euro is traceable to an order.
 *   Layer 1 — the fix that changed visibility (direct causal).
 *   Layer 2 — the AI surface / query that drove the discovery (assisted).
 *   Layer 3 — soft/awareness signals (NOT billable).
 */
export type AttributionLayer = 1 | 2 | 3;

export interface AttributionEvent {
  id: string;
  store_id: string;
  product_id: string | null;
  /** The fix credited with this outcome, if any. */
  fix_id: string | null;
  /** Real commerce order this event is attributed to. */
  order_id: string;
  layer: AttributionLayer;
  /** AI-attributed incremental revenue in euros for this event. */
  incremental_revenue: number;
  /** Which AI surface drove it (e.g. "chatgpt", "perplexity", "google_ai"). */
  source: string | null;
  occurred_at: ISODate;
  /** The billing period this event falls into ("YYYY-MM"). */
  period: BillingPeriod;
}

/* ── 6. return_risk_events ─────────────────────────────────────────────────── */

export type ReturnRiskLevel = "low" | "medium" | "high";

export interface ReturnRiskEvent {
  id: string;
  store_id: string;
  product_id: string | null;
  order_id: string;
  risk: ReturnRiskLevel;
  /** Model-estimated probability of return, 0–1. */
  probability: number;
  reason: string | null;
  occurred_at: ISODate;
}

/* ── 7. module_unlocks ─────────────────────────────────────────────────────── */

/** A capability module the store has unlocked (§7). */
export type ModuleKey =
  | "visibility"
  | "fixes"
  | "attribution"
  | "content"
  | "return_risk"
  | "autonomy";

export interface ModuleUnlock {
  id: string;
  store_id: string;
  module: ModuleKey;
  unlocked: boolean;
  unlocked_at: ISODate | null;
}

/* ── 8. content_items ──────────────────────────────────────────────────────── */

export type ContentType = "text" | "image" | "video";
export type ContentStatus = "draft" | "scheduled" | "published";

export interface ContentItem {
  id: string;
  store_id: string;
  product_id: string | null;
  type: ContentType;
  title: string;
  body: string;
  status: ContentStatus;
  /** When set, the intended publish time (for status = scheduled). */
  scheduled_for: ISODate | null;
  published_at: ISODate | null;
  created_at: ISODate;
}

/* ── 9. customers ──────────────────────────────────────────────────────────── */

export interface Customer {
  id: string;
  store_id: string;
  external_id: string | null;
  email: string | null;
  name: string | null;
  /** Lifetime value in euros. */
  ltv: number;
  created_at: ISODate;
}

/* ── 10. autonomy_settings ─────────────────────────────────────────────────── */

/**
 * How much the agent may act without a human. `auto_approve` defaults to false —
 * nothing ships autonomously until the store opts in (§7).
 */
export interface AutonomySettings {
  id: string;
  store_id: string;
  auto_approve: boolean;
  /** Per-action-run spend ceiling in euros (null = no cap set). */
  max_spend: number | null;
  updated_at: ISODate;
}

/* ── 11. billing_records (DERIVED — never a stored total) ───────────────────── */

/**
 * The result of DERIVING a period's bill from attribution_events. This is NOT a
 * stored table with an independently-computed total: `computeBillingRecord` in
 * ./store.ts recomputes every field from the billable events (layers 1 & 2) each
 * time it is called, so the total can never drift from its backing events (§1.5).
 * The SQL side mirrors this as a VIEW, not a materialized table.
 *
 * Fee model (§1.2): base_fee (plan subscription) + performance_fee
 * (8% of AI-attributed incremental revenue, layers 1 & 2 only), with the Growth
 * performance fee capped at €300/mo. total = base_fee + performance_fee.
 */
export interface BillingRecord {
  store_id: string;
  period: BillingPeriod;
  plan: Plan;
  /** Fixed plan subscription fee for the period, in euros. */
  base_fee: number;
  /** 8% of billable (layer 1 & 2) incremental revenue, after the cap. */
  performance_fee: number;
  /** The cap applied to the performance fee this period (null = uncapped plan). */
  capped_at: number | null;
  /** DERIVED: base_fee + performance_fee. Never stored independently. */
  total: number;
  /** Sum of billable incremental_revenue backing performance_fee. */
  billable_revenue: number;
  /** How many attribution_events (layers 1 & 2) back this record. */
  event_count: number;
}
