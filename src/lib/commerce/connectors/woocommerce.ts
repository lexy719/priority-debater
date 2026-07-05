/**
 * PD Commerce — WooCommerce connector (design doc §0.1 platform table).
 *
 * WooCommerce REST API v3: store base URL + consumer key/secret, authenticated
 * over HTTPS via `?consumer_key=…&consumer_secret=…` query params (Woo's
 * documented basic-auth-over-query mode; only ever sent over https).
 *
 * Credential packing: `ConnectorStoreRef.domain` = store base URL,
 * `ConnectorStoreRef.accessToken` = "consumer_key:consumer_secret".
 *
 *   - readCatalog        GET  /wp-json/wc/v3/products   (paginated, per_page=100)
 *   - writeFix           GET current product FIRST (the reversible `previous`
 *                        snapshot, §6.7/§9) then PUT name/description/meta_data
 *   - readOrderMetadata  GET  /wp-json/wc/v3/orders?after=…
 *
 * Woo has no native agent-source tag on orders, so attribution is Layer 2 only
 * (assisted discovery), per §0.1. Never throws — all failures are typed
 * ConnectorResult failures (§6 edge cases: unreachable URL, bad creds).
 */

import type {
  CommerceConnector,
  ConnectorOrder,
  ConnectorProduct,
  ConnectorResult,
  ConnectorStoreRef,
  FixFields,
  WriteFixData,
} from "./types";
import { clampString, connectorFail, toNumber } from "./types";

const FETCH_TIMEOUT_MS = 15_000;
/** Huge-catalog guard (§6): never pull more than this many products. */
export const WOO_MAX_PRODUCTS = 1000;
const PER_PAGE = 100;

/** Woo metafield (meta_data) key prefix for PD-written structured data. */
export const WOO_META_PREFIX = "pd_";

/* ── Auth resolution (domain + "key:secret" accessToken) ──────────────────── */

/** Normalise a merchant-entered base URL: https only, no trailing slash. */
function normalizeBaseUrl(raw: string | undefined): string | null {
  const s = clampString(raw, 300);
  if (!s) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
  // Credentials ride in query params — require https so they are never sent in clear.
  if (url.protocol !== "https:") return null;
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

interface WooAuth {
  base: string;
  key: string;
  secret: string;
}

function resolveAuth(store: ConnectorStoreRef): WooAuth | ReturnType<typeof connectorFail> {
  const base = normalizeBaseUrl(store.domain);
  const token = clampString(store.accessToken, 400);
  const sep = token.indexOf(":");
  const key = sep > 0 ? token.slice(0, sep) : "";
  const secret = sep > 0 ? token.slice(sep + 1) : "";
  if (!base || !key || !secret) {
    return connectorFail(
      "not_configured",
      "WooCommerce needs an https store URL plus consumer key and consumer secret.",
    );
  }
  return { base, key, secret };
}

function isAuth(v: WooAuth | ReturnType<typeof connectorFail>): v is WooAuth {
  return !("ok" in v);
}

function wooUrl(auth: WooAuth, path: string, params: Record<string, string>): string {
  const url = new URL(`${auth.base}/wp-json/wc/v3/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("consumer_key", auth.key);
  url.searchParams.set("consumer_secret", auth.secret);
  return url.toString();
}

type WooFetch = ({ ok: true; body: unknown }) | ReturnType<typeof connectorFail>;

async function wooFetch(url: string, init?: RequestInit): Promise<WooFetch> {
  let res: globalThis.Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { Accept: "application/json", ...(init?.headers ?? {}) },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (e) {
    return connectorFail("network_error", `Could not reach the store (${e instanceof Error ? e.name : "fetch failed"}).`);
  }
  if (res.status === 401 || res.status === 403) {
    return connectorFail("invalid_credentials", "WooCommerce rejected the consumer key/secret.");
  }
  if (!res.ok) {
    return connectorFail("platform_error", `WooCommerce returned HTTP ${res.status}.`);
  }
  try {
    return { ok: true, body: (await res.json()) as unknown };
  } catch {
    return connectorFail("platform_error", "WooCommerce returned a non-JSON response (is this a WooCommerce store?).");
  }
}

/* ── Woo payload shapes (only the fields we read) ─────────────────────────── */

interface WooProductPayload {
  id?: number | string;
  name?: string;
  description?: string;
  short_description?: string;
  sku?: string;
  price?: string;
  permalink?: string;
  status?: string;
  date_modified_gmt?: string;
  images?: { src?: string }[];
  meta_data?: { key?: string; value?: unknown }[];
}

interface WooOrderPayload {
  id?: number | string;
  number?: string;
  total?: string;
  currency?: string;
  date_created?: string;
  date_created_gmt?: string;
  created_via?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim().slice(0, 400);
}

function mapProduct(p: WooProductPayload): ConnectorProduct | null {
  const external_id = p.id === undefined || p.id === null ? "" : String(p.id);
  if (!external_id) return null;
  const body = typeof p.description === "string" ? p.description : "";
  const permalink = clampString(p.permalink, 2_000);
  return {
    external_id,
    title: clampString(p.name, 500) || "Untitled product",
    url: permalink,
    description: stripHtml(body || clampString(p.short_description, 5_000)),
    body_html: body,
    handle: permalink.split("/").filter(Boolean).pop() ?? "",
    price: clampString(p.price, 50) || null,
    image: clampString(p.images?.[0]?.src, 2_000) || null,
    vendor: null,
    product_type: null,
    status: clampString(p.status, 50) || null,
    updated_at: clampString(p.date_modified_gmt, 40) || null,
  };
}

/* ── Connect-time probe (used by the connect flow) ────────────────────────── */

/**
 * Cheap connectivity + credential check: fetch a single product. Free per §1.3
 * (connectivity is never billed).
 */
export async function probeWooConnection(
  store: ConnectorStoreRef,
): Promise<ConnectorResult<{ reachable: true; sampleProductCount: number }>> {
  const auth = resolveAuth(store);
  if (!isAuth(auth)) return auth;
  const res = await wooFetch(wooUrl(auth, "products", { per_page: "1" }));
  if (!res.ok) return res;
  const count = Array.isArray(res.body) ? res.body.length : 0;
  return { ok: true, reachable: true, sampleProductCount: count };
}

/* ── The connector ────────────────────────────────────────────────────────── */

export const wooCommerceConnector: CommerceConnector = {
  platform: "woo",

  capabilities: {
    canWrite: true,
    canReadOrders: true,
    // No native agent-source tag on Woo orders → assisted (Layer 2) only, §0.1.
    attributionLayers: [2],
  },

  async readCatalog(store: ConnectorStoreRef): Promise<ConnectorResult<{ products: ConnectorProduct[] }>> {
    const auth = resolveAuth(store);
    if (!isAuth(auth)) return auth;

    const products: ConnectorProduct[] = [];
    const maxPages = Math.ceil(WOO_MAX_PRODUCTS / PER_PAGE);
    for (let page = 1; page <= maxPages; page++) {
      const res = await wooFetch(
        wooUrl(auth, "products", { per_page: String(PER_PAGE), page: String(page), status: "publish" }),
      );
      if (!res.ok) {
        // First page failing = the store is unusable; a later page failing = return what we have (§6.2).
        if (page === 1) return res;
        break;
      }
      const batch = Array.isArray(res.body) ? (res.body as WooProductPayload[]) : [];
      for (const p of batch) {
        const mapped = mapProduct(p);
        if (mapped) products.push(mapped);
      }
      if (batch.length < PER_PAGE) break; // last page
    }
    return { ok: true, products };
  },

  async writeFix(
    store: ConnectorStoreRef,
    productExternalId: string,
    fields: FixFields,
  ): Promise<ConnectorResult<WriteFixData>> {
    const auth = resolveAuth(store);
    if (!isAuth(auth)) return auth;

    const id = clampString(productExternalId, 40);
    if (!id || !/^\d+$/.test(id)) {
      return connectorFail("invalid_input", "productExternalId must be a numeric WooCommerce product id.");
    }

    const applied: FixFields = {};
    if (typeof fields.title === "string") applied.title = clampString(fields.title, 500);
    if (typeof fields.body_html === "string") applied.body_html = fields.body_html.slice(0, 60_000);
    if (Array.isArray(fields.metafields)) {
      const metafields = fields.metafields
        .map((m) => ({
          namespace: clampString(m.namespace, 100) || "pd_commerce",
          key: clampString(m.key, 100),
          type: clampString(m.type, 100) || "json",
          value: typeof m.value === "string" ? m.value.slice(0, 60_000) : "",
        }))
        .filter((m) => m.key.length > 0);
      if (metafields.length > 0) applied.metafields = metafields;
    }
    if (applied.title === undefined && applied.body_html === undefined && applied.metafields === undefined) {
      return connectorFail("invalid_input", "No writable fields in fix (title / body_html / metafields).");
    }

    // 1. Read the product's current values FIRST — the `previous` snapshot is
    //    what makes the push reversible (§6.7 / §9 "option to revert").
    const current = await wooFetch(wooUrl(auth, `products/${id}`, {}));
    if (!current.ok) return current;
    const before = current.body as WooProductPayload;

    const previous: FixFields = {};
    if (applied.title !== undefined) previous.title = clampString(before.name, 500);
    if (applied.body_html !== undefined) {
      previous.body_html = typeof before.description === "string" ? before.description : "";
    }
    if (applied.metafields !== undefined) {
      const existing = Array.isArray(before.meta_data) ? before.meta_data : [];
      previous.metafields = applied.metafields.map((m) => {
        const wooKey = `${WOO_META_PREFIX}${m.key}`;
        const match = existing.find((e) => e.key === wooKey);
        return {
          namespace: m.namespace,
          key: m.key,
          type: m.type,
          value: match ? clampString(String(match.value ?? ""), 60_000) : "",
        };
      });
    }

    // 2. Write. Woo stores metafields as meta_data entries keyed pd_<key>.
    const payload: { name?: string; description?: string; meta_data?: { key: string; value: string }[] } = {};
    if (applied.title !== undefined) payload.name = applied.title;
    if (applied.body_html !== undefined) payload.description = applied.body_html;
    if (applied.metafields !== undefined) {
      payload.meta_data = applied.metafields.map((m) => ({ key: `${WOO_META_PREFIX}${m.key}`, value: m.value }));
    }

    const put = await wooFetch(wooUrl(auth, `products/${id}`, {}), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!put.ok) return put;

    return { ok: true, productExternalId: id, applied, previous };
  },

  async readOrderMetadata(
    store: ConnectorStoreRef,
    since: string | null,
  ): Promise<ConnectorResult<{ orders: ConnectorOrder[] }>> {
    const auth = resolveAuth(store);
    if (!isAuth(auth)) return auth;

    const params: Record<string, string> = { per_page: String(PER_PAGE) };
    const sinceIso = clampString(since, 40);
    if (sinceIso && !Number.isNaN(Date.parse(sinceIso))) {
      params.after = new Date(sinceIso).toISOString();
    }

    const res = await wooFetch(wooUrl(auth, "orders", params));
    if (!res.ok) return res;

    const batch = Array.isArray(res.body) ? (res.body as WooOrderPayload[]) : [];
    const orders: ConnectorOrder[] = [];
    for (const o of batch) {
      const external_id = o.id === undefined || o.id === null ? "" : String(o.id);
      if (!external_id) continue;
      const createdRaw = clampString(o.date_created_gmt, 40) || clampString(o.date_created, 40);
      orders.push({
        external_id,
        name: `#${clampString(o.number, 40) || external_id}`,
        total_price: toNumber(o.total, 0),
        currency: clampString(o.currency, 10) || "EUR",
        created_at:
          createdRaw && !Number.isNaN(Date.parse(createdRaw))
            ? new Date(createdRaw).toISOString()
            : new Date().toISOString(),
        // Woo has no agent-source tag; created_via ("checkout", "rest-api", …)
        // is the closest signal, surfaced for Layer-2 heuristics downstream.
        source_name: clampString(o.created_via, 100) || null,
        landing_site: null,
        referring_site: null,
        tags: [],
        note_attributes: [],
      });
    }
    return { ok: true, orders };
  },
};
