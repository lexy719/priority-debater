/**
 * Published-store repository — the persistence seam behind /store/[slug].
 *
 * File-based (.data/stores/*.json, gitignored) so the fabricated storefront
 * exists server-side and can be SERVER-RENDERED: shopping agents (GPTBot,
 * ClaudeBot, PerplexityBot) don't execute JS, so an agent-readable store must
 * be real HTML + embedded JSON-LD, not a client React shell. Mirrors the
 * commerce localStorage-repo pattern: swap this module for Supabase later
 * without touching callers.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { isStocked, shipsPhysically, type StorefrontInput } from "./aiStorefront";
import { blobConfigured, getJson, listJson, putJson } from "./blobStore";

export type StoreManifest = { ships?: string; returns?: string; tagline?: string };
export type PublishedStore = {
  slug: string;
  createdAt: string;
  source: "claude" | "stock";
  spec?: string;
  store: StorefrontInput;
  manifest: StoreManifest;
  /** The Supabase user who fabricated it. Absent = part of the DEMO ESTATE:
      the built-in example businesses anyone may look at. A signed-in operator
      must never see another operator's company, and must never be shown the
      demo estate as if it were theirs. */
  ownerId?: string;
};

const DIR = path.join(process.cwd(), ".data", "stores");
const SLUG_RE = /^[a-z0-9-]{3,64}$/;

export function slugify(name: string, salt: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) || "store";
  return `${base}-${salt.toLowerCase().slice(0, 6)}`;
}

export async function saveStore(s: PublishedStore): Promise<void> {
  if (!SLUG_RE.test(s.slug)) throw new Error("bad slug");
  if (blobConfigured()) {
    await putJson(`stores/${s.slug}.json`, s);
    return;
  }
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, `${s.slug}.json`), JSON.stringify(s, null, 2), "utf8");
}

/**
 * Only a physical good has a shelf. Publishing used to give every sellable a
 * default stock of 24, which made a downloads business report thousands of
 * euros of inventory it does not have. The publish path stopped doing that,
 * but stores written before the fix still carry the number — so the read path
 * is authoritative. One place, and every consumer (finance, the shelf, the
 * feed, the automation metrics) is right at once.
 */
function withoutPhantomStock(s: PublishedStore): PublishedStore {
  const products = s.store.products;
  if (!products.some((p) => !isStocked(p.kind) && p.stock != null)) return s;
  return {
    ...s,
    store: { ...s.store, products: products.map((p) => (isStocked(p.kind) ? p : { ...p, stock: undefined })) },
  };
}

export async function loadStore(slug: string): Promise<PublishedStore | null> {
  if (!SLUG_RE.test(slug)) return null;
  if (blobConfigured()) {
    const s = await getJson<PublishedStore>(`stores/${slug}.json`);
    if (s?.store?.brand?.name) return withoutPhantomStock(s);
    // blob miss → fall through to local files (stores published pre-Supabase)
  }
  try {
    const raw = await fs.readFile(path.join(DIR, `${slug}.json`), "utf8");
    const s = JSON.parse(raw) as PublishedStore;
    return s?.store?.brand?.name ? withoutPhantomStock(s) : null;
  } catch {
    return null;
  }
}

/** Decrement a SKU's stock after an order; 0 flips availability to
    OutOfStock so JSON-LD + feed stay truthful. Returns the new stock level. */
export async function adjustStock(slug: string, sku: string, qty: number): Promise<number | null> {
  const s = await loadStore(slug);
  if (!s) return null;
  const p = s.store.products.find((x) => x.sku === sku);
  if (!p) return null;
  // Only physical goods have a countable shelf. An hour of work or a download
  // does not run out, and pretending it does would lie to agents.
  if (!isStocked(p.kind)) return null;
  if (p.stock == null) p.stock = 24; // legacy stores get a default on first touch
  p.stock = Math.max(0, p.stock - qty);
  if (p.stock === 0 && p.availability !== "PreOrder" && p.availability !== "Discontinued") p.availability = "OutOfStock";
  await saveStore(s);
  return p.stock;
}

/* ── who owns what ─────────────────────────────────────────────────────────
   A register is per operator. Rather than open every store document to find
   out who owns it, each owner keeps an index of their own slugs; the demo
   estate keeps one too under a reserved key that is not a valid user id. */

const DEMO_OWNER = "_demo";
const ownerKey = (ownerId: string | null) => `owners/${ownerId ?? DEMO_OWNER}.json`;

async function readOwnerIndex(ownerId: string | null): Promise<string[]> {
  if (blobConfigured()) {
    const idx = await getJson<{ slugs?: string[] }>(ownerKey(ownerId));
    if (idx?.slugs) return idx.slugs.filter((s) => SLUG_RE.test(s));
  }
  try {
    const raw = await fs.readFile(path.join(process.cwd(), ".data", ownerKey(ownerId)), "utf8");
    return (JSON.parse(raw) as { slugs?: string[] }).slugs?.filter((s) => SLUG_RE.test(s)) ?? [];
  } catch { return []; }
}

/** Claim a store for an owner (or for the demo estate). Idempotent. */
export async function recordOwnership(ownerId: string | null, slug: string): Promise<void> {
  if (!SLUG_RE.test(slug)) return;
  const slugs = await readOwnerIndex(ownerId);
  if (slugs.includes(slug)) return;
  slugs.push(slug);
  const payload = { slugs };
  if (blobConfigured()) { await putJson(ownerKey(ownerId), payload); return; }
  const file = path.join(process.cwd(), ".data", ownerKey(ownerId));
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf8");
}

/**
 * The register for ONE operator. A signed-in operator sees only companies they
 * fabricated; a visitor with no session sees the demo estate. The two are never
 * mixed — an empty register reads as "no company under management", never as
 * somebody else's business.
 */
export async function listStoresFor(ownerId: string | null): Promise<{ slug: string; name: string }[]> {
  const slugs = await readOwnerIndex(ownerId);
  return slugs
    .map((slug) => ({ slug, name: slug.replace(/-[a-z0-9]{6}$/, "").toUpperCase() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** True when this store belongs to this operator (or is demo and nobody is in). */
export async function ownsStore(ownerId: string | null, slug: string): Promise<boolean> {
  return (await readOwnerIndex(ownerId)).includes(slug);
}

/** EVERY published business, ignoring ownership — for system-level passes only
    (the scheduled tick). Never use it to build a register. */
export async function listStores(): Promise<{ slug: string; name: string }[]> {
  const slugs = new Set<string>();
  if (blobConfigured()) {
    for (const n of await listJson("stores")) slugs.add(n.replace(/\.json$/, ""));
  }
  try {
    for (const f of await fs.readdir(DIR)) if (f.endsWith(".json")) slugs.add(f.replace(/\.json$/, ""));
  } catch { /* no local dir */ }
  return [...slugs]
    .filter((s) => SLUG_RE.test(s))
    .map((slug) => ({ slug, name: slug.replace(/-[a-z0-9]{6}$/, "").toUpperCase() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Google Merchant / OpenAI-feed-style JSONL — what discovery programs ingest.
    Seller identity + return/shipping fields are required for checkout
    eligibility in the OpenAI feed spec; agents filter on them. */
export function buildFeedJsonl(s: PublishedStore, origin: string): string {
  const { brand, products } = s.store;
  const base = `${origin}/store/${s.slug}`;
  return products
    // Feeds are the buyable shelf: a retired product is dropped here, while its
    // page stays online answering "Discontinued".
    .filter((p) => p.availability !== "Discontinued")
    .map((p) => JSON.stringify({
      id: p.sku ?? p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: p.name,
      description: p.description,
      link: p.url ?? `${base}/p/${p.sku}`,
      // Raster, not SVG: Merchant Center and Meta reject vector images.
      image_link: `${base}/img/${p.sku}/png`,
      price: p.priceValue != null ? `${p.priceValue.toFixed(2)} ${p.currency ?? "EUR"}` : p.price,
      availability: (p.availability ?? "InStock") === "PreOrder" ? "preorder"
        : (p.availability === "OutOfStock" || (isStocked(p.kind) && (p.stock ?? 1) <= 0)) ? "out_of_stock" : "in_stock",
      kind: p.kind ?? "good",
      pricing_unit: p.unit ?? "item",
      requires_shipping: shipsPhysically(p.kind),
      condition: "new",
      brand: brand.name,
      // No registered GTINs for fabricated SKUs — declare it honestly.
      identifier_exists: false,
      product_type: p.category ?? "Product",
      // Provenance rides in the feed too — a mandate like "EU-made, human-made,
      // under €100" is matched against the feed long before a page is fetched.
      ...(p.provenance?.material ? { material: p.provenance.material } : {}),
      ...(p.provenance?.origin ? { origin_country: p.provenance.origin } : {}),
      ...(p.provenance?.madeBy ? { made_by: p.provenance.madeBy } : {}),
      ...(p.provenance?.leadTime ? { lead_time: p.provenance.leadTime } : {}),
      ...(p.provenance?.warranty ? { warranty: p.provenance.warranty } : {}),
      ...(p.provenance?.care ? { care: p.provenance.care } : {}),
      ...(p.provenance?.weight ? { shipping_weight: p.provenance.weight } : {}),
      ...(p.provenance?.dimensions ? { product_dimensions: p.provenance.dimensions } : {}),
      seller_record: `${base}/.well-known/seller-record.json`,
      seller_name: brand.fullName,
      seller_url: base,
      seller_tos: `${base}/terms`,
      accepts_returns: true,
      return_deadline_in_days: 30,
      return_policy: `${base}/shipping`,
      shipping_summary: s.manifest.ships ?? "EU · 3–5 business days",
    }))
    .join("\n") + "\n";
}
