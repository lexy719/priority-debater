/**
 * Connected businesses — stores PDR operates but does not host.
 *
 * Commerce was built on one assumption: the business lives in `storeRepo`,
 * because Studio made it. A merchant who already sells on Shopify breaks that
 * assumption, and they are the customer worth having.
 *
 * The trick here is normalisation, not a second system: whatever the platform
 * returns is mapped into exactly the `StorefrontInput` shape a PDR-hosted store
 * uses, cached, and handed to the same workers. Finance, the automation engine,
 * the statement and the agent rails then work unchanged — they never learn
 * where the catalogue came from.
 *
 * Two honesty rules hold this together:
 *  · The cache is dated. Everything downstream can say "as of the last sync"
 *    instead of implying it is watching the store live.
 *  · Products keep their CANONICAL URL on the merchant's own domain. We publish
 *    an agent layer for their shop; we never pretend to be their shop.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { StoreProduct, StorefrontBrand } from "./aiStorefront";
import { blobConfigured, getJson, putJson } from "./blobStore";

export type ConnectedPlatform = "shopify" | "woo" | "bigcommerce" | "generic";

export type ConnectedBusiness = {
  slug: string;
  ownerId?: string;
  platform: ConnectedPlatform;
  /** Platform admin domain, e.g. "my-shop.myshopify.com". */
  domain: string;
  /** Public storefront origin, e.g. "https://josefinas.com" — where buyers go. */
  siteUrl: string;
  brand: StorefrontBrand;
  /** Catalogue as of the last sync, in PDR's own shape. */
  products: StoreProduct[];
  createdAt: string;
  lastSyncedAt: string | null;
  /** What the merchant authorised. Read-only is the honest default: the
      Operations and Products workers propose instead of acting until the
      merchant grants write scopes. */
  scopes: { read: boolean; write: boolean };
  syncNote: string | null;
};

const DIR = path.join(process.cwd(), ".data", "connected");
const SLUG_RE = /^[a-z0-9-]{3,64}$/;

export async function loadConnected(slug: string): Promise<ConnectedBusiness | null> {
  if (!SLUG_RE.test(slug)) return null;
  if (blobConfigured()) {
    const b = await getJson<ConnectedBusiness>(`connected/${slug}.json`);
    if (b?.slug) return b;
  }
  try { return JSON.parse(await fs.readFile(path.join(DIR, `${slug}.json`), "utf8")) as ConnectedBusiness; } catch { return null; }
}

export async function saveConnected(b: ConnectedBusiness): Promise<void> {
  if (!SLUG_RE.test(b.slug)) throw new Error("bad slug");
  if (blobConfigured()) { await putJson(`connected/${b.slug}.json`, b); return; }
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, `${b.slug}.json`), JSON.stringify(b, null, 2), "utf8");
}

/**
 * Platform credentials, kept apart from the business record so a catalogue can
 * be read, cached and served without the token travelling with it.
 *
 * NOTE: this is Supabase Storage behind the service key, not a secrets manager.
 * It is adequate for a token that only reads a catalogue; before write scopes
 * ship, these belong in a proper vault.
 */
export type ConnectionSecret = { platform: ConnectedPlatform; domain: string; accessToken: string | null };

export async function saveSecret(slug: string, s: ConnectionSecret): Promise<void> {
  if (!SLUG_RE.test(slug)) throw new Error("bad slug");
  if (blobConfigured()) { await putJson(`secrets/${slug}.json`, s); return; }
  await fs.mkdir(path.join(process.cwd(), ".data", "secrets"), { recursive: true });
  await fs.writeFile(path.join(process.cwd(), ".data", "secrets", `${slug}.json`), JSON.stringify(s), "utf8");
}

export async function loadSecret(slug: string): Promise<ConnectionSecret | null> {
  if (!SLUG_RE.test(slug)) return null;
  if (blobConfigured()) {
    const s = await getJson<ConnectionSecret>(`secrets/${slug}.json`);
    if (s?.platform) return s;
  }
  try {
    return JSON.parse(await fs.readFile(path.join(process.cwd(), ".data", "secrets", `${slug}.json`), "utf8")) as ConnectionSecret;
  } catch { return null; }
}

/** Parse "€96", "96.00", "1.234,50" → a number, or null when unparseable. */
export function priceNumber(raw: string | null): number | null {
  if (!raw) return null;
  const m = String(raw).replace(/\s/g, "").match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}
