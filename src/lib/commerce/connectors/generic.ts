/**
 * PD Commerce — Generic connector (design doc §0.1, "Anything else" column).
 *
 * EXPORT MODE: for custom stores, Wix, headless, anything without a native API.
 * Read-only — we can ingest a catalog from:
 *   (a) a JSON or CSV product feed URL          (store.domain)
 *   (b) a sitemap.xml URL → crawl ≤25 pages     (store.domain)
 *   (c) raw CSV text pasted/uploaded directly   (csvTextToProducts, used by the
 *       /api/commerce/catalog route's csvText side-channel)
 *
 * There is NO auto-push (§0.1): writeFix always fails "not_supported /
 * export-mode platform". Instead `exportFixes` produces a ready-to-use CSV the
 * merchant applies themselves — still valuable, per the platform table.
 *
 * Attribution: Layer 2 only (assisted discovery via UTM/referrer downstream).
 * Never throws — all failures are typed ConnectorResult failures (§6).
 */

import type {
  CommerceConnector,
  ConnectorProduct,
  ConnectorResult,
  ConnectorStoreRef,
  FixFields,
} from "./types";
import { clampString, connectorFail } from "./types";

/* ── Limits (§6 edge cases: huge catalogs, unreachable URLs) ──────────────── */

/** Hard catalog cap. Callers detect truncation by receiving exactly this many. */
export const GENERIC_MAX_PRODUCTS = 1000;
const SITEMAP_MAX_PAGES = 25;
const FETCH_TIMEOUT_MS = 15_000;
const MAX_FEED_BYTES = 5_000_000; // 5 MB — enough for ~1000 products, blocks abuse

/* ── Tiny helpers (no deps) ───────────────────────────────────────────────── */

function stripHtml(s: string): string {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Build a full ConnectorProduct from the loose fields the generic sources yield. */
function toProduct(input: {
  external_id: string;
  title: string;
  description?: string;
  url?: string;
  image?: string;
  price?: string;
}): ConnectorProduct {
  const description = clampString(input.description, 5_000);
  return {
    external_id: input.external_id,
    title: input.title,
    url: clampString(input.url, 2_000),
    description: stripHtml(description).slice(0, 400),
    body_html: description,
    handle: "",
    price: clampString(input.price, 50) || null,
    image: clampString(input.image, 2_000) || null,
    vendor: null,
    product_type: null,
    status: null,
    updated_at: null,
  };
}

async function fetchText(
  url: string,
  accept: string,
): Promise<{ ok: true; text: string; contentType: string } | { ok: false; detail: string }> {
  let res: globalThis.Response;
  try {
    res = await fetch(url, {
      headers: { Accept: accept, "User-Agent": "PD-Commerce-Importer/1.0" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
      redirect: "follow",
    });
  } catch (e) {
    return { ok: false, detail: `Could not reach that URL (${e instanceof Error ? e.name : "fetch failed"}).` };
  }
  if (!res.ok) return { ok: false, detail: `The URL returned HTTP ${res.status}.` };
  const contentType = res.headers.get("content-type") ?? "";
  let text: string;
  try {
    text = await res.text();
  } catch {
    return { ok: false, detail: "Could not read the response body." };
  }
  if (text.length > MAX_FEED_BYTES) text = text.slice(0, MAX_FEED_BYTES);
  return { ok: true, text, contentType };
}

/* ── CSV parsing (hand-rolled, RFC-4180-ish: quotes, escaped quotes, CRLF) ── */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim().length > 0)) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((c) => c.trim().length > 0)) rows.push(row);
  return rows;
}

/** Escape one CSV cell (quote when it contains comma/quote/newline). */
function csvCell(v: string): string {
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/**
 * Parse raw CSV text into products. Expected headers (any order,
 * case-insensitive): title, description, price, image, url, sku.
 * Exported for the /api/commerce/catalog csvText upload path.
 */
export function csvTextToProducts(text: string): ConnectorResult<{ products: ConnectorProduct[] }> {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return connectorFail("invalid_input", "CSV needs a header row plus at least one product row.");
  }
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name: string): number => header.indexOf(name);
  const iTitle = col("title");
  const iDesc = col("description");
  const iPrice = col("price");
  const iImage = col("image");
  const iUrl = col("url");
  const iSku = col("sku");
  if (iTitle === -1) {
    return connectorFail(
      "invalid_input",
      'CSV is missing a "title" column. Expected headers: title, description, price, image, url, sku.',
    );
  }
  const cell = (r: string[], i: number): string => (i >= 0 && i < r.length ? clampString(r[i], 5_000) : "");
  const products: ConnectorProduct[] = [];
  for (let n = 1; n < rows.length && products.length < GENERIC_MAX_PRODUCTS; n++) {
    const r = rows[n];
    const title = clampString(cell(r, iTitle), 500);
    if (!title) continue;
    const sku = clampString(cell(r, iSku), 200);
    const url = cell(r, iUrl);
    products.push(
      toProduct({
        external_id: sku || url || `csv-row-${n}`,
        title,
        description: cell(r, iDesc),
        url,
        image: cell(r, iImage),
        price: cell(r, iPrice),
      }),
    );
  }
  if (products.length === 0) {
    return connectorFail("invalid_input", "No usable product rows found in the CSV.");
  }
  return { ok: true, products };
}

/* ── JSON feed parsing (array of products, or { products: [...] }) ────────── */

function jsonToProducts(text: string): ConnectorResult<{ products: ConnectorProduct[] }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return connectorFail("invalid_input", "The feed is not valid JSON.");
  }
  const arr: unknown = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed !== null && Array.isArray((parsed as { products?: unknown }).products)
      ? (parsed as { products: unknown[] }).products
      : null;
  if (!Array.isArray(arr)) {
    return connectorFail("invalid_input", "Expected a JSON array of products (or { products: [...] }).");
  }
  const products: ConnectorProduct[] = [];
  for (let n = 0; n < arr.length && products.length < GENERIC_MAX_PRODUCTS; n++) {
    const item = arr[n];
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const title = clampString(o.title ?? o.name, 500);
    if (!title) continue;
    const sku = clampString(o.sku, 200);
    const url = clampString(o.url ?? o.link ?? o.permalink, 2_000);
    const image =
      clampString(o.image ?? o.image_url ?? o.imageUrl, 2_000) ||
      (Array.isArray(o.images) ? clampString(o.images[0], 2_000) : "");
    const priceRaw = o.price;
    const price =
      typeof priceRaw === "number" && Number.isFinite(priceRaw) ? String(priceRaw) : clampString(priceRaw, 50);
    products.push(
      toProduct({
        external_id: clampString(o.id ?? o.external_id ?? o.externalId, 200) || sku || url || `json-item-${n}`,
        title,
        description: clampString(o.description ?? o.body ?? o.summary, 5_000),
        url,
        image,
        price,
      }),
    );
  }
  if (products.length === 0) {
    return connectorFail("invalid_input", "No usable products found in the JSON feed.");
  }
  return { ok: true, products };
}

/* ── Sitemap crawl (≤25 product-looking pages, title + meta description) ──── */

const PRODUCT_URL_HINT = /\/(products?|shop|item|itens|produtos?|p)\//i;

function extractLocs(xml: string): string[] {
  const locs: string[] = [];
  const re = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null && locs.length < 5_000) {
    locs.push(m[1].trim());
  }
  return locs;
}

async function sitemapToProducts(sitemapUrl: string): Promise<ConnectorResult<{ products: ConnectorProduct[] }>> {
  const res = await fetchText(sitemapUrl, "application/xml,text/xml,*/*");
  if (!res.ok) return connectorFail("network_error", res.detail);

  let locs = extractLocs(res.text);
  if (locs.length === 0) {
    return connectorFail("invalid_input", "No <loc> entries found — is that a sitemap.xml?");
  }

  // Sitemap index? Follow the first child sitemap that looks product-ish.
  if (/<sitemapindex/i.test(res.text)) {
    const child = locs.find((l) => /product/i.test(l)) ?? locs[0];
    const childRes = await fetchText(child, "application/xml,text/xml,*/*");
    if (!childRes.ok) return connectorFail("network_error", childRes.detail);
    locs = extractLocs(childRes.text);
  }

  const productUrls = locs.filter((l) => PRODUCT_URL_HINT.test(l));
  const targets = (productUrls.length > 0 ? productUrls : locs).slice(0, SITEMAP_MAX_PAGES);

  const pages = await Promise.all(
    targets.map(async (url) => {
      const page = await fetchText(url, "text/html,*/*");
      if (!page.ok) return null;
      const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(page.text);
      const descMatch =
        /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i.exec(page.text) ??
        /<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["']/i.exec(page.text) ??
        /<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']/i.exec(page.text);
      const imgMatch = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(page.text);
      const title = clampString(stripHtml(titleMatch?.[1] ?? ""), 500);
      if (!title) return null;
      return toProduct({
        external_id: url,
        title,
        description: stripHtml(descMatch?.[1] ?? ""),
        url,
        image: imgMatch ? imgMatch[1] : "",
      });
    }),
  );

  const products = pages.filter((p): p is ConnectorProduct => p !== null);
  if (products.length === 0) {
    return connectorFail("invalid_input", "Reached the sitemap but couldn't extract any product pages from it.");
  }
  return { ok: true, products };
}

/* ── Export-mode delivery: fixes as a downloadable CSV (§0.1) ─────────────── */

export interface ExportFix {
  productExternalId: string;
  fields: FixFields;
}

/**
 * Build the export-mode CSV: one row per product that has a fix, with current
 * vs. proposed content side by side so the merchant can copy-paste or bulk-import.
 */
export function exportFixes(products: ConnectorProduct[], fixes: ExportFix[]): string {
  const byId = new Map(products.map((p) => [p.external_id, p]));
  const lines: string[] = [
    ["external_id", "url", "current_title", "new_title", "current_description", "new_description", "json_ld"]
      .map(csvCell)
      .join(","),
  ];
  for (const fix of fixes) {
    const p = byId.get(fix.productExternalId);
    const jsonLd = (fix.fields.metafields ?? []).map((m) => m.value).join("\n");
    lines.push(
      [
        fix.productExternalId,
        p?.url ?? "",
        p?.title ?? "",
        fix.fields.title ?? "",
        p?.description ?? "",
        fix.fields.body_html ? stripHtml(fix.fields.body_html) : "",
        jsonLd,
      ]
        .map(csvCell)
        .join(","),
    );
  }
  return lines.join("\r\n");
}

/* ── The connector ────────────────────────────────────────────────────────── */

function looksLikeCsv(contentType: string, url: string, text: string): boolean {
  if (/text\/csv|application\/csv/i.test(contentType)) return true;
  if (/\.csv(\?|#|$)/i.test(url)) return true;
  // Heuristic: first line has commas and no JSON/XML opener.
  const head = text.slice(0, 200).trimStart();
  return !head.startsWith("{") && !head.startsWith("[") && !head.startsWith("<") && head.includes(",");
}

function looksLikeSitemap(contentType: string, url: string, text: string): boolean {
  if (/\.xml(\?|#|$)/i.test(url) || /sitemap/i.test(url)) return true;
  if (/xml/i.test(contentType)) return true;
  return /<urlset|<sitemapindex/i.test(text.slice(0, 2_000));
}

export const genericConnector: CommerceConnector = {
  platform: "generic",

  capabilities: {
    canWrite: false, // export mode — no auto-push, §0.1
    canReadOrders: false,
    attributionLayers: [2],
  },

  async readCatalog(store: ConnectorStoreRef): Promise<ConnectorResult<{ products: ConnectorProduct[] }>> {
    const url = clampString(store.domain, 2_000);
    if (!url) {
      return connectorFail("not_configured", "Provide a product feed URL, a sitemap.xml URL, or raw CSV text.");
    }
    const full = /^https?:\/\//i.test(url) ? url : `https://${url}`;

    const res = await fetchText(full, "application/json,text/csv,application/xml,text/xml,text/html,*/*");
    if (!res.ok) return connectorFail("network_error", res.detail);

    // (a) JSON or CSV feed — detect by content-type / extension / shape.
    const head = res.text.trimStart();
    if (/application\/json|text\/json/i.test(res.contentType) || head.startsWith("{") || head.startsWith("[")) {
      return jsonToProducts(res.text);
    }
    if (looksLikeCsv(res.contentType, full, res.text)) {
      return csvTextToProducts(res.text);
    }
    // (b) sitemap crawl — either the URL is a sitemap, or fall back to the
    //     site's /sitemap.xml when given a plain storefront URL.
    if (looksLikeSitemap(res.contentType, full, res.text)) {
      return sitemapToProducts(full);
    }
    try {
      const origin = new URL(full).origin;
      return await sitemapToProducts(`${origin}/sitemap.xml`);
    } catch {
      return connectorFail("invalid_input", "Couldn't recognise that URL as a JSON feed, CSV feed or sitemap.xml.");
    }
  },

  async writeFix(): Promise<ConnectorResult<never>> {
    // Export mode (§0.1): fixes are delivered via exportFixes CSV, never pushed.
    return connectorFail("not_supported", "Export-mode platform — download the fix instead of pushing.");
  },

  async readOrderMetadata(): Promise<ConnectorResult<never>> {
    return connectorFail(
      "not_supported",
      "Generic mode has no order API — attribution uses UTM/referrer signals instead.",
    );
  },
};
