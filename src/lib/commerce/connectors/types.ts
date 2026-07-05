/**
 * PD Commerce rebuild — Phase 3: the platform-agnostic connector layer.
 *
 * This is the universal ingestion + write interface from design doc §0.1: every
 * platform (Shopify, WooCommerce, BigCommerce, generic feed) implements the same
 * three operations — read catalog, write a fix back, read order metadata for
 * attribution layer 1 (§1.5) — plus capability flags so callers can degrade
 * gracefully ("full auto-push where an API exists, generate-and-export where it
 * doesn't", §0.1).
 *
 * CONNECTIVITY IS FREE AND BUNDLED, PERMANENTLY (§1.3). Nothing in this layer or
 * the routes that call it may spend credits or sit behind a paywall.
 *
 * RULE: connectors NEVER throw and NEVER fake data. Every operation returns a
 * `ConnectorResult<T>` — missing env config is `{ ok:false, reason:"not_configured" }`,
 * a network failure is `{ ok:false, reason:"network_error" }`, and so on.
 */

import type { AttributionLayer, ISODate, Platform } from "../data/types";

/* ── Result envelope (typed failures, never throws) ────────────────────────── */

export type ConnectorFailureReason =
  | "not_configured" // required env vars missing — never fake data instead
  | "not_supported" // platform has no connector (or capability flag is off)
  | "invalid_input" // bad shop domain, missing credentials, malformed fields
  | "invalid_credentials" // token rejected by the platform (401/403)
  | "platform_error" // platform API returned a non-auth error status
  | "network_error"; // fetch failed / timed out

export interface ConnectorFailure {
  ok: false;
  reason: ConnectorFailureReason;
  /** Human-readable detail safe to surface in the UI. Never includes secrets. */
  detail?: string;
}

export type ConnectorResult<T> = ({ ok: true } & T) | ConnectorFailure;

export function connectorFail(reason: ConnectorFailureReason, detail?: string): ConnectorFailure {
  return detail === undefined ? { ok: false, reason } : { ok: false, reason, detail };
}

/* ── Store reference (what a connector needs to talk to a platform) ────────── */

/**
 * The minimal credential bundle for one connected store. Today the client keeps
 * this in the Phase 2 localStorage store and posts it back per request; when
 * Supabase server persistence is wired, tokens move server-side and this becomes
 * a store_id lookup instead (see SECURITY TODO in the OAuth callback route).
 */
export interface ConnectorStoreRef {
  platform: Platform;
  /** Platform store domain, e.g. "my-shop.myshopify.com". */
  domain: string;
  /** Platform access token (null when the platform/mode needs none). */
  accessToken: string | null;
}

/* ── Catalog (readCatalog) ─────────────────────────────────────────────────── */

/**
 * A platform product normalized to what the Phase 2 `Product` entity needs
 * (external_id / title / url) plus the raw content fields fixes operate on.
 * Scan-derived fields (current_score, etc.) are deliberately absent — scoring
 * happens elsewhere; the connector only ingests.
 */
export interface ConnectorProduct {
  /** Platform-native id, stringified (maps to Product.external_id). */
  external_id: string;
  title: string;
  /** Public storefront URL for the product. */
  url: string;
  /** Plain-text description (HTML stripped), clamped for transport. */
  description: string;
  /** Raw HTML body as stored on the platform (what writeFix edits). */
  body_html: string;
  handle: string;
  price: string | null;
  image: string | null;
  vendor: string | null;
  product_type: string | null;
  status: string | null;
  updated_at: ISODate | null;
}

/* ── Fix write-back (writeFix) ─────────────────────────────────────────────── */

/** A metafield to set on the product — used for JSON-LD structured data etc. */
export interface ConnectorMetafield {
  namespace: string;
  key: string;
  /** Platform value type, e.g. "json" | "single_line_text_field". */
  type: string;
  value: string;
}

/**
 * The writable surface of a fix. Only present fields are written; absent fields
 * are left untouched on the platform. This same shape doubles as the `previous`
 * snapshot, which is what makes every push reversible (§6.7, §9).
 */
export interface FixFields {
  title?: string;
  body_html?: string;
  metafields?: ConnectorMetafield[];
}

export interface WriteFixData {
  productExternalId: string;
  /** What was actually written. */
  applied: FixFields;
  /**
   * Snapshot of the fields BEFORE this write — the client persists it alongside
   * the Fix (status "pushed") so the push can be reverted later.
   */
  previous: FixFields;
  /** True when this write was itself a revert (a `previous` written back). */
  reverted?: boolean;
}

/* ── Order metadata (readOrderMetadata — attribution layer 1, §1.5) ────────── */

export interface ConnectorOrderAttribute {
  name: string;
  value: string;
}

/**
 * An order with the channel/source metadata attribution layer 1 reads (§1.5):
 * when an agentic checkout completes, the order carries channel metadata
 * identifying it came through an AI agent — pulled directly via order
 * tags/source. Ground-truth, no estimation.
 */
export interface ConnectorOrder {
  /** Platform-native order id, stringified — the REAL order every billed euro traces to (§1.5). */
  external_id: string;
  /** Human order name/number, e.g. "#1024". */
  name: string;
  total_price: number;
  currency: string;
  created_at: ISODate;
  /** Platform channel/source tag, e.g. Shopify `source_name`. */
  source_name: string | null;
  landing_site: string | null;
  referring_site: string | null;
  tags: string[];
  note_attributes: ConnectorOrderAttribute[];
}

/* ── Capabilities (§0.1 platform table) ────────────────────────────────────── */

export interface ConnectorCapabilities {
  /** Can push fixes back via API (false ⇒ export mode: generate + download, §0.1). */
  canWrite: boolean;
  /** Can read order metadata for layer-1 attribution. */
  canReadOrders: boolean;
  /** Which attribution layers (§1.5) this platform can support. */
  attributionLayers: AttributionLayer[];
}

/* ── The connector interface ───────────────────────────────────────────────── */

export interface CommerceConnector {
  platform: Platform;
  capabilities: ConnectorCapabilities;

  /** Ingest the store's product catalog (paginated internally). */
  readCatalog(store: ConnectorStoreRef): Promise<ConnectorResult<{ products: ConnectorProduct[] }>>;

  /**
   * Write a fix's fields to one product. Implementations MUST capture the
   * previous values of every field they change and return them in `previous`,
   * so the caller can record a reversible push.
   */
  writeFix(
    store: ConnectorStoreRef,
    productExternalId: string,
    fields: FixFields,
  ): Promise<ConnectorResult<WriteFixData>>;

  /**
   * Read orders (with channel/source metadata) created since `since`
   * (ISO timestamp; null = platform default window). Feeds attribution
   * layer 1 (§1.5) — the caller classifies, the connector only ingests.
   */
  readOrderMetadata(
    store: ConnectorStoreRef,
    since: ISODate | null,
  ): Promise<ConnectorResult<{ orders: ConnectorOrder[] }>>;
}

/* ── Small shared helpers (kept here so connectors + routes stay dependency-free) ── */

/** Clamp an unknown value to a trimmed string of at most `max` chars ("" if not a string). */
export function clampString(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

/** Parse an unknown value as a finite number, else `fallback`. */
export function toNumber(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

/** True when `value` is one of the Phase 2 platforms. */
export function isPlatform(value: unknown): value is Platform {
  return value === "shopify" || value === "woo" || value === "bigcommerce" || value === "generic";
}
