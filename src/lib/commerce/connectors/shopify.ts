/**
 * PD Commerce rebuild — Phase 3: Shopify connector (design doc §0.1 row 1).
 *
 * Implements the platform-agnostic `CommerceConnector` interface over the
 * Shopify Admin REST API (2024-10):
 *   - readCatalog        GET  /admin/api/{v}/products.json (cursor-paginated)
 *   - writeFix           PUT  /admin/api/{v}/products/{id}.json (+ metafields,
 *                        incl. JSON-LD in a metafield) — captures `previous`
 *                        so every push is reversible (§6.7, §9)
 *   - readOrderMetadata  GET  /admin/api/{v}/orders.json with source_name /
 *                        note_attributes / tags for attribution layer 1 (§1.5)
 *
 * Plus the OAuth plumbing the connect routes need: authorize-URL builder,
 * HMAC verification, and code→token exchange.
 *
 * Env: SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_SCOPES
 * (scopes default to "read_products,write_products,read_orders").
 *
 * RULES (§1.3 + connector layer contract): connectivity is FREE — nothing here
 * touches credits. Functions NEVER throw and NEVER fake data: missing env →
 * { ok:false, reason:"not_configured" }; every other failure is a typed result.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import {
  clampString,
  connectorFail,
  toNumber,
  type CommerceConnector,
  type ConnectorMetafield,
  type ConnectorOrder,
  type ConnectorOrderAttribute,
  type ConnectorProduct,
  type ConnectorResult,
  type ConnectorStoreRef,
  type FixFields,
  type WriteFixData,
} from "./types";

export const SHOPIFY_API_VERSION = "2024-10";

const DEFAULT_SCOPES = "read_products,write_products,read_orders";
const PAGE_LIMIT = 250; // Shopify REST max page size
const MAX_PAGES = 20; // safety ceiling: 5,000 products / orders per pull
const FETCH_TIMEOUT_MS = 15_000;

/* ── Env config (typed absence, never throws) ──────────────────────────────── */

interface ShopifyConfig {
  apiKey: string;
  apiSecret: string;
  scopes: string;
}

function getConfig(): ShopifyConfig | null {
  const apiKey = process.env.SHOPIFY_API_KEY?.trim();
  const apiSecret = process.env.SHOPIFY_API_SECRET?.trim();
  if (!apiKey || !apiSecret) return null;
  const scopes = process.env.SHOPIFY_SCOPES?.trim() || DEFAULT_SCOPES;
  return { apiKey, apiSecret, scopes };
}

/** True when the Shopify env vars are present (routes use this for early, honest 503s). */
export function shopifyConfigured(): boolean {
  return getConfig() !== null;
}

/* ── Shop-domain validation ────────────────────────────────────────────────── */

const SHOP_HANDLE_RE = /^[a-z0-9][a-z0-9-]*$/;
const SHOP_DOMAIN_RE = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

/**
 * Normalize user input ("my-shop", "my-shop.myshopify.com", or a pasted URL)
 * to a canonical "*.myshopify.com" domain. Returns null when it can't be a
 * valid shop domain — callers turn that into an `invalid_input` failure.
 */
export function normalizeShopDomain(input: unknown): string | null {
  let s = clampString(input, 200).toLowerCase();
  if (!s) return null;
  s = s.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
  if (SHOP_HANDLE_RE.test(s)) s = `${s}.myshopify.com`;
  return SHOP_DOMAIN_RE.test(s) ? s : null;
}

/* ── OAuth: authorize URL, HMAC verification, token exchange ───────────────── */

/** Random nonce for the OAuth `state` param (also set as a cookie by the connect route). */
export function generateOAuthState(): string {
  return randomBytes(16).toString("hex");
}

export function buildAuthorizeUrl(
  shopDomain: string,
  redirectUri: string,
  state: string,
): ConnectorResult<{ url: string }> {
  const config = getConfig();
  if (!config) return connectorFail("not_configured", "SHOPIFY_API_KEY / SHOPIFY_API_SECRET are not set.");
  const shop = normalizeShopDomain(shopDomain);
  if (!shop) return connectorFail("invalid_input", "Not a valid *.myshopify.com shop domain.");

  const params = new URLSearchParams({
    client_id: config.apiKey,
    scope: config.scopes,
    redirect_uri: redirectUri,
    state,
  });
  return { ok: true, url: `https://${shop}/admin/oauth/authorize?${params.toString()}` };
}

/**
 * Verify Shopify's callback HMAC (hex HMAC-SHA256 of the sorted query string,
 * `hmac`/`signature` excluded, keyed with the API secret). Timing-safe compare.
 */
export function verifyCallbackHmac(query: URLSearchParams): ConnectorResult<{ verified: true }> {
  const config = getConfig();
  if (!config) return connectorFail("not_configured", "SHOPIFY_API_SECRET is not set.");

  const hmac = query.get("hmac");
  if (!hmac || !/^[0-9a-f]{64}$/i.test(hmac)) {
    return connectorFail("invalid_input", "Missing or malformed hmac parameter.");
  }

  const pairs: string[] = [];
  query.forEach((value, key) => {
    if (key === "hmac" || key === "signature") return;
    pairs.push(`${key}=${value}`);
  });
  pairs.sort();

  const digest = createHmac("sha256", config.apiSecret).update(pairs.join("&")).digest("hex");
  const a = Buffer.from(digest, "hex");
  const b = Buffer.from(hmac.toLowerCase(), "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return connectorFail("invalid_credentials", "HMAC verification failed.");
  }
  return { ok: true, verified: true };
}

/** Exchange the OAuth `code` for a permanent Admin API access token. */
export async function exchangeCodeForToken(
  shopDomain: string,
  code: string,
): Promise<ConnectorResult<{ accessToken: string; scopes: string }>> {
  const config = getConfig();
  if (!config) return connectorFail("not_configured", "SHOPIFY_API_KEY / SHOPIFY_API_SECRET are not set.");
  const shop = normalizeShopDomain(shopDomain);
  if (!shop) return connectorFail("invalid_input", "Not a valid *.myshopify.com shop domain.");
  const cleanCode = clampString(code, 200);
  if (!cleanCode) return connectorFail("invalid_input", "Missing OAuth code.");

  try {
    const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: config.apiKey, client_secret: config.apiSecret, code: cleanCode }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) {
      return connectorFail(
        res.status === 401 || res.status === 403 ? "invalid_credentials" : "platform_error",
        `Token exchange failed (HTTP ${res.status}).`,
      );
    }
    const data = (await res.json()) as { access_token?: string; scope?: string };
    const accessToken = clampString(data.access_token, 500);
    if (!accessToken) return connectorFail("platform_error", "Token exchange returned no access_token.");
    return { ok: true, accessToken, scopes: clampString(data.scope, 500) || config.scopes };
  } catch {
    return connectorFail("network_error", "Could not reach Shopify for the token exchange.");
  }
}

/* ── Admin API request helper (typed failures, Link-header pagination) ──────── */

interface AdminResponse<T> {
  ok: true;
  data: T;
  /** Cursor for the next page, from the `Link` header (rel="next"), if any. */
  nextPageInfo: string | null;
}

async function adminRequest<T>(
  store: ConnectorStoreRef,
  method: "GET" | "PUT",
  path: string,
  body?: Record<string, unknown>,
): Promise<ConnectorResult<AdminResponse<T>>> {
  if (!shopifyConfigured()) {
    return connectorFail("not_configured", "SHOPIFY_API_KEY / SHOPIFY_API_SECRET are not set.");
  }
  const shop = normalizeShopDomain(store.domain);
  if (!shop) return connectorFail("invalid_input", "Not a valid *.myshopify.com shop domain.");
  const token = clampString(store.accessToken, 500);
  if (!token) return connectorFail("invalid_input", "Missing Shopify access token — connect the store first.");

  try {
    const res = await fetch(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/${path}`, {
      method,
      headers: {
        "X-Shopify-Access-Token": token,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) {
      return connectorFail("invalid_credentials", "Shopify rejected the access token — reconnect the store.");
    }
    if (!res.ok) {
      return connectorFail("platform_error", `Shopify API error (HTTP ${res.status}) on ${path.split("?")[0]}.`);
    }
    const data = (await res.json()) as T;
    return { ok: true, data, nextPageInfo: parseNextPageInfo(res.headers.get("link")) };
  } catch {
    return connectorFail("network_error", "Could not reach the Shopify Admin API.");
  }
}

/** Extract the `page_info` cursor from a REST `Link` header's rel="next" entry. */
function parseNextPageInfo(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(",")) {
    if (!/rel="next"/.test(part)) continue;
    const match = part.match(/[?&]page_info=([^&>]+)/);
    if (match) return match[1];
  }
  return null;
}

/* ── Raw Shopify payload shapes (only the fields we read) ──────────────────── */

interface ShopifyVariant {
  price?: string;
}

interface ShopifyImage {
  src?: string;
}

interface ShopifyProduct {
  id?: number | string;
  title?: string;
  handle?: string;
  body_html?: string | null;
  vendor?: string | null;
  product_type?: string | null;
  status?: string | null;
  updated_at?: string | null;
  variants?: ShopifyVariant[];
  images?: ShopifyImage[];
}

interface ShopifyMetafield {
  id?: number | string;
  namespace?: string;
  key?: string;
  type?: string;
  value?: string | number | boolean | null;
}

interface ShopifyOrder {
  id?: number | string;
  name?: string;
  total_price?: string;
  currency?: string;
  created_at?: string;
  source_name?: string | null;
  landing_site?: string | null;
  referring_site?: string | null;
  tags?: string | null;
  note_attributes?: Array<{ name?: string; value?: string | number | null }>;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);
}

function mapProduct(shop: string, p: ShopifyProduct): ConnectorProduct {
  const handle = clampString(p.handle, 300);
  const bodyHtml = typeof p.body_html === "string" ? p.body_html : "";
  return {
    external_id: String(p.id ?? ""),
    title: clampString(p.title, 500) || "Untitled product",
    url: handle ? `https://${shop}/products/${handle}` : `https://${shop}`,
    description: stripHtml(bodyHtml),
    body_html: bodyHtml,
    handle,
    price: clampString(p.variants?.[0]?.price, 50) || null,
    image: clampString(p.images?.[0]?.src, 1000) || null,
    vendor: clampString(p.vendor, 300) || null,
    product_type: clampString(p.product_type, 300) || null,
    status: clampString(p.status, 50) || null,
    updated_at: clampString(p.updated_at, 40) || null,
  };
}

function mapOrder(o: ShopifyOrder): ConnectorOrder {
  const note_attributes: ConnectorOrderAttribute[] = (o.note_attributes ?? [])
    .map((a) => ({ name: clampString(a.name, 200), value: clampString(String(a.value ?? ""), 500) }))
    .filter((a) => a.name.length > 0);
  return {
    external_id: String(o.id ?? ""),
    name: clampString(o.name, 100),
    total_price: toNumber(o.total_price, 0),
    currency: clampString(o.currency, 10) || "EUR",
    created_at: clampString(o.created_at, 40),
    source_name: clampString(o.source_name, 200) || null,
    landing_site: clampString(o.landing_site, 1000) || null,
    referring_site: clampString(o.referring_site, 1000) || null,
    tags: clampString(o.tags, 2000)
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0),
    note_attributes,
  };
}

/* ── writeFix internals ────────────────────────────────────────────────────── */

/** Namespace + key where PD stores JSON-LD structured data (§0.1: "metafields incl. JSON-LD"). */
export const PD_METAFIELD_NAMESPACE = "pd_commerce";

function sanitizeFixFields(fields: FixFields): FixFields {
  const out: FixFields = {};
  if (typeof fields.title === "string") out.title = clampString(fields.title, 500);
  if (typeof fields.body_html === "string") out.body_html = fields.body_html.slice(0, 60_000);
  if (Array.isArray(fields.metafields)) {
    const metafields = fields.metafields
      .map((m): ConnectorMetafield => ({
        namespace: clampString(m.namespace, 100) || PD_METAFIELD_NAMESPACE,
        key: clampString(m.key, 100),
        type: clampString(m.type, 100) || "json",
        value: typeof m.value === "string" ? m.value.slice(0, 60_000) : "",
      }))
      .filter((m) => m.key.length > 0 && m.value.length > 0);
    if (metafields.length > 0) out.metafields = metafields;
  }
  return out;
}

/* ── The connector ─────────────────────────────────────────────────────────── */

export const shopifyConnector: CommerceConnector = {
  platform: "shopify",

  // §0.1 platform table, Shopify row: full read + auto-push write + order
  // metadata, which enables attribution layers 1 (order metadata), 2 (GA4
  // referral), and 3 (soft signals — never billed, §1.5).
  capabilities: {
    canWrite: true,
    canReadOrders: true,
    attributionLayers: [1, 2, 3],
  },

  async readCatalog(store: ConnectorStoreRef): Promise<ConnectorResult<{ products: ConnectorProduct[] }>> {
    const shop = normalizeShopDomain(store.domain);
    if (!shop) return connectorFail("invalid_input", "Not a valid *.myshopify.com shop domain.");

    const products: ConnectorProduct[] = [];
    let pageInfo: string | null = null;

    for (let page = 0; page < MAX_PAGES; page++) {
      // Cursor pagination: page_info requests may only carry `limit` alongside the cursor.
      const query: string = pageInfo
        ? `products.json?limit=${PAGE_LIMIT}&page_info=${encodeURIComponent(pageInfo)}`
        : `products.json?limit=${PAGE_LIMIT}`;
      const res: ConnectorResult<AdminResponse<{ products?: ShopifyProduct[] }>> = await adminRequest(store, "GET", query);
      if (!res.ok) {
        // Partial failure on a later page: return what we have rather than
        // discarding real data (§6.2 — one flaky call never blocks the value).
        if (products.length > 0) break;
        return res;
      }
      for (const p of res.data.products ?? []) {
        const mapped = mapProduct(shop, p);
        if (mapped.external_id) products.push(mapped);
      }
      pageInfo = res.nextPageInfo;
      if (!pageInfo) break;
    }

    return { ok: true, products };
  },

  async writeFix(
    store: ConnectorStoreRef,
    productExternalId: string,
    fields: FixFields,
  ): Promise<ConnectorResult<WriteFixData>> {
    const productId = clampString(productExternalId, 40);
    if (!productId || !/^\d+$/.test(productId)) {
      return connectorFail("invalid_input", "productExternalId must be a numeric Shopify product id.");
    }
    const applied = sanitizeFixFields(fields);
    if (applied.title === undefined && applied.body_html === undefined && applied.metafields === undefined) {
      return connectorFail("invalid_input", "No writable fields in fix (title / body_html / metafields).");
    }

    // 1. Read the product's current values FIRST — the `previous` snapshot is
    //    what makes the push reversible (§6.7 / §9 "option to revert").
    const current = await adminRequest<{ product?: ShopifyProduct }>(store, "GET", `products/${productId}.json`);
    if (!current.ok) return current;
    const before = current.data.product;
    if (!before) return connectorFail("platform_error", "Product not found on Shopify.");

    const previous: FixFields = {};
    if (applied.title !== undefined) previous.title = clampString(before.title, 500);
    if (applied.body_html !== undefined) {
      previous.body_html = typeof before.body_html === "string" ? before.body_html : "";
    }

    if (applied.metafields !== undefined) {
      // Snapshot existing values of the metafields we're about to overwrite
      // (absent ⇒ recorded as empty value so a revert clears our writes).
      const mfRes = await adminRequest<{ metafields?: ShopifyMetafield[] }>(
        store,
        "GET",
        `products/${productId}/metafields.json?limit=${PAGE_LIMIT}`,
      );
      const existing = mfRes.ok ? mfRes.data.metafields ?? [] : [];
      previous.metafields = applied.metafields.map((m): ConnectorMetafield => {
        const match = existing.find((e) => e.namespace === m.namespace && e.key === m.key);
        return {
          namespace: m.namespace,
          key: m.key,
          type: clampString(match?.type, 100) || m.type,
          value: match ? clampString(String(match.value ?? ""), 60_000) : "",
        };
      });
    }

    // 2. Write. Shopify's product PUT accepts title/body_html/metafields together.
    const payload: Record<string, unknown> = { id: Number(productId) };
    if (applied.title !== undefined) payload.title = applied.title;
    if (applied.body_html !== undefined) payload.body_html = applied.body_html;
    if (applied.metafields !== undefined) {
      // Empty-value entries (only possible via revert of a previously-absent
      // metafield) are skipped: Shopify rejects empty metafield values.
      const writable = applied.metafields.filter((m) => m.value.length > 0);
      if (writable.length > 0) payload.metafields = writable;
    }

    const put = await adminRequest<{ product?: ShopifyProduct }>(store, "PUT", `products/${productId}.json`, {
      product: payload,
    });
    if (!put.ok) return put;

    return { ok: true, productExternalId: productId, applied, previous };
  },

  async readOrderMetadata(
    store: ConnectorStoreRef,
    since: string | null,
  ): Promise<ConnectorResult<{ orders: ConnectorOrder[] }>> {
    const sinceIso = clampString(since, 40);
    const fields =
      "id,name,total_price,currency,created_at,source_name,landing_site,referring_site,tags,note_attributes";
    const baseQuery =
      `orders.json?status=any&limit=${PAGE_LIMIT}&fields=${encodeURIComponent(fields)}` +
      (sinceIso ? `&created_at_min=${encodeURIComponent(sinceIso)}` : "");

    const orders: ConnectorOrder[] = [];
    let pageInfo: string | null = null;

    for (let page = 0; page < MAX_PAGES; page++) {
      const query: string = pageInfo
        ? `orders.json?limit=${PAGE_LIMIT}&page_info=${encodeURIComponent(pageInfo)}`
        : baseQuery;
      const res: ConnectorResult<AdminResponse<{ orders?: ShopifyOrder[] }>> = await adminRequest(store, "GET", query);
      if (!res.ok) {
        if (orders.length > 0) break; // partial > nothing (§6.2)
        return res;
      }
      for (const o of res.data.orders ?? []) {
        const mapped = mapOrder(o);
        if (mapped.external_id) orders.push(mapped);
      }
      pageInfo = res.nextPageInfo;
      if (!pageInfo) break;
    }

    return { ok: true, orders };
  },
};
