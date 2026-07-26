/**
 * Catalog operations — website management from the Commerce side.
 *
 * Studio fabricates the first catalog; the business then LIVES, so the operator
 * (or a worker acting for them) must be able to add a product, correct a price,
 * count stock and take something off the shelf — and have every agent-facing
 * surface tell the same story the same second: storefront HTML, JSON-LD, the
 * product feeds, llms.txt, the MCP tools.
 *
 * Two rules make this safe for a catalog that AI agents have already read:
 *  · A product is RETIRED, never deleted. Its URL keeps resolving and answers
 *    "Discontinued", so an agent holding a cached link gets the truth instead of
 *    a 404. Retirement is reversible.
 *  · Prices and stock are written as structured values (priceValue + currency),
 *    because that is what agents filter on.
 */

import {
  PRICING_UNITS, PROVENANCE_FIELDS, SELLABLE_KINDS, isStocked,
  type PricingUnit, type ProductProvenance, type SellableKind, type StoreProduct,
} from "./aiStorefront";
import { recordActivity } from "./activityRepo";
import { loadStore, saveStore } from "./storeRepo";

export type CatalogResult = { ok: true; products: StoreProduct[]; detail: string } | { ok: false; error: string };

const MAX_PRODUCTS = 60;

function skuFrom(name: string, brandMark: string, taken: Set<string>): string {
  const stem = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 28) || "item";
  const prefix = brandMark.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6) || "sku";
  let sku = `${prefix}-${stem}`;
  let n = 2;
  while (taken.has(sku)) sku = `${prefix}-${stem}-${n++}`;
  return sku;
}

/**
 * Provenance in, sanitised: only the known fields, trimmed, short, and `madeBy`
 * constrained to the three declarable values. An empty string CLEARS a field —
 * an undeclared attribute must disappear from the feeds rather than linger as
 * an empty claim.
 */
function cleanProvenance(existing: ProductProvenance | undefined, patch: Record<string, unknown>): { next?: ProductProvenance; changed: string[] } {
  const next: ProductProvenance = { ...(existing ?? {}) };
  const changed: string[] = [];
  for (const k of PROVENANCE_FIELDS) {
    if (!(k in patch)) continue;
    const raw = patch[k];
    if (raw == null) continue;
    let v = String(raw).trim().slice(0, 120);
    if (k === "madeBy") {
      v = v.toLowerCase();
      if (v && !["human", "machine", "hybrid"].includes(v)) continue;
    }
    const before = next[k] ?? "";
    if (v === before) continue;
    if (v) (next as Record<string, string>)[k] = v; else delete next[k];
    changed.push(v ? `${k} → ${v}` : `${k} cleared`);
  }
  const any = Object.keys(next).length > 0;
  return { next: any ? next : undefined, changed };
}

/** Accepts "€18", "18", "18.50/mo", "€14 / mo" → { price, priceValue, period }. */
function parsePrice(raw: string): { price: string; priceValue: number } | null {
  const period = /\/\s*(mo|yr|month|year)\b/i.exec(raw);
  const num = /(\d+(?:[.,]\d{1,2})?)/.exec(raw.replace(/\s/g, ""));
  if (!num) return null;
  const value = Math.round(Number(num[1].replace(",", ".")) * 100) / 100;
  if (!Number.isFinite(value) || value <= 0 || value > 1_000_000) return null;
  const suffix = period ? `/${period[1].toLowerCase().startsWith("y") ? "yr" : "mo"}` : "";
  return { price: `€${Number.isInteger(value) ? value : value.toFixed(2)}${suffix}`, priceValue: value };
}

export async function addProduct(
  slug: string,
  input: { name: string; description: string; price: string; category?: string; stock?: number; provenance?: Record<string, unknown>; kind?: string; unit?: string },
): Promise<CatalogResult> {
  const s = await loadStore(slug);
  if (!s) return { ok: false, error: "store not found" };
  if (s.store.products.length >= MAX_PRODUCTS) return { ok: false, error: `catalog is capped at ${MAX_PRODUCTS} products` };

  const name = input.name.trim().slice(0, 80);
  const description = input.description.trim().slice(0, 400);
  if (!name) return { ok: false, error: "a product needs a name" };
  if (description.length < 12) return { ok: false, error: "write at least a sentence of description — agents answer questions from it" };
  const priced = parsePrice(input.price ?? "");
  if (!priced) return { ok: false, error: "price must be a number, optionally per month (e.g. 24 or 14/mo)" };
  if (s.store.products.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: `"${name}" is already in the catalog` };
  }

  const kind: SellableKind = (SELLABLE_KINDS as readonly string[]).includes(input.kind ?? "") ? (input.kind as SellableKind) : "good";
  const unit: PricingUnit = (PRICING_UNITS as readonly string[]).includes(input.unit ?? "") ? (input.unit as PricingUnit) : "item";
  // Only a physical good carries a count. Everything else is available until the
  // owner says otherwise, and its stock field stays absent rather than faked.
  const stock = isStocked(kind)
    ? (Number.isFinite(Number(input.stock)) ? Math.max(0, Math.round(Number(input.stock))) : 24)
    : undefined;
  const product: StoreProduct = {
    name, description,
    price: priced.price, priceValue: priced.priceValue, currency: "EUR",
    sku: skuFrom(name, s.store.brand.name, new Set(s.store.products.map((p) => p.sku ?? ""))),
    category: (input.category ?? "").trim().slice(0, 40) || (kind === "service" ? "Service" : "Product"),
    availability: stock != null && stock <= 0 ? "OutOfStock" : "InStock",
    ...(stock != null ? { stock } : {}),
    ...(kind !== "good" ? { kind } : {}),
    ...(unit !== "item" ? { unit } : {}),
    ...(input.provenance ? { provenance: cleanProvenance(undefined, input.provenance).next } : {}),
  };
  s.store.products.push(product);
  await saveStore(s);
  const what = kind === "good" ? `${stock}u` : `${kind}, priced per ${unit}`;
  await recordActivity(slug, "OPERATIONS",
    `${kind === "good" ? "Product" : kind.charAt(0).toUpperCase() + kind.slice(1)} added: ${product.name} (${product.sku}) at ${product.price}, ${what} — live on the storefront, JSON-LD and agent feeds`);
  return { ok: true, products: s.store.products, detail: `${product.sku} added at ${product.price}${unit !== "item" ? ` per ${unit}` : ""}` };
}

export async function updateProduct(
  slug: string, sku: string,
  patch: { price?: string; stock?: number; description?: string; category?: string; availability?: string; provenance?: Record<string, unknown>; kind?: string; unit?: string },
): Promise<CatalogResult> {
  const s = await loadStore(slug);
  if (!s) return { ok: false, error: "store not found" };
  const p = s.store.products.find((x) => x.sku === sku);
  if (!p) return { ok: false, error: `${sku} not in catalog` };

  const changes: string[] = [];
  if (patch.price != null && patch.price !== "") {
    const priced = parsePrice(patch.price);
    if (!priced) return { ok: false, error: "price must be a number, optionally per month" };
    if (priced.price !== p.price) {
      changes.push(`price ${p.price} → ${priced.price}`);
      p.price = priced.price;
      p.priceValue = priced.priceValue;
      p.currency = p.currency ?? "EUR";
    }
  }
  // Kind and unit change what the listing MEANS, so they move together with the
  // consequences: a good that becomes a service loses its stock count.
  if (patch.kind && (SELLABLE_KINDS as readonly string[]).includes(patch.kind) && patch.kind !== (p.kind ?? "good")) {
    const next = patch.kind as SellableKind;
    changes.push(`kind ${p.kind ?? "good"} → ${next}`);
    if (next === "good") { p.kind = undefined; if (p.stock == null) p.stock = 24; }
    else { p.kind = next; delete p.stock; if (p.availability === "OutOfStock") p.availability = "InStock"; }
  }
  if (patch.unit && (PRICING_UNITS as readonly string[]).includes(patch.unit) && patch.unit !== (p.unit ?? "item")) {
    const next = patch.unit as PricingUnit;
    changes.push(`priced per ${next}`);
    p.unit = next === "item" ? undefined : next;
  }
  if (patch.stock != null && isStocked(p.kind) && Number.isFinite(Number(patch.stock))) {
    const next = Math.max(0, Math.round(Number(patch.stock)));
    if (next !== (p.stock ?? 24)) {
      changes.push(`stock ${p.stock ?? "unset"} → ${next}u`);
      p.stock = next;
      // Availability must never contradict the count agents read.
      if (p.availability !== "PreOrder" && p.availability !== "Discontinued") {
        p.availability = next > 0 ? "InStock" : "OutOfStock";
      }
    }
  }
  if (patch.description != null && patch.description.trim().length >= 12) {
    const next = patch.description.trim().slice(0, 400);
    if (next !== p.description) { p.description = next; changes.push("description rewritten"); }
  }
  // Selling state, but never retirement — that has its own reviewed operation.
  if (patch.availability === "InStock" || patch.availability === "OutOfStock" || patch.availability === "PreOrder") {
    if (p.availability === "Discontinued") return { ok: false, error: `${sku} is retired — restore it first` };
    if (patch.availability !== p.availability) {
      changes.push(`availability ${p.availability ?? "InStock"} → ${patch.availability}`);
      p.availability = patch.availability;
    }
  }
  if (patch.category != null && patch.category.trim()) {
    const next = patch.category.trim().slice(0, 40);
    if (next !== p.category) { p.category = next; changes.push(`category → ${next}`); }
  }
  if (patch.provenance && typeof patch.provenance === "object") {
    const { next, changed } = cleanProvenance(p.provenance, patch.provenance);
    if (changed.length) {
      if (next) p.provenance = next; else delete p.provenance;
      changes.push(...changed);
    }
  }
  if (!changes.length) return { ok: false, error: "nothing to change" };

  await saveStore(s);
  await recordActivity(slug, "OPERATIONS", `${p.name} (${sku}) updated — ${changes.join(", ")}`);
  return { ok: true, products: s.store.products, detail: changes.join(", ") };
}

/** Take a product off the shelf without breaking the web: availability becomes
    Discontinued, feeds drop it, the page still answers. */
export async function retireProduct(slug: string, sku: string): Promise<CatalogResult> {
  const s = await loadStore(slug);
  if (!s) return { ok: false, error: "store not found" };
  const p = s.store.products.find((x) => x.sku === sku);
  if (!p) return { ok: false, error: `${sku} not in catalog` };
  if (p.availability === "Discontinued") return { ok: false, error: `${sku} is already retired` };
  const live = s.store.products.filter((x) => x.availability !== "Discontinued");
  if (live.length <= 1) return { ok: false, error: "a store needs at least one product agents can buy" };

  p.retiredFrom = (p.availability ?? "InStock") as "InStock" | "OutOfStock" | "PreOrder";
  p.availability = "Discontinued";
  await saveStore(s);
  await recordActivity(slug, "OPERATIONS",
    `${p.name} (${sku}) retired — dropped from product feeds, page still answers “Discontinued” for agents holding the link`);
  return { ok: true, products: s.store.products, detail: `${sku} retired` };
}

export async function restoreProduct(slug: string, sku: string): Promise<CatalogResult> {
  const s = await loadStore(slug);
  if (!s) return { ok: false, error: "store not found" };
  const p = s.store.products.find((x) => x.sku === sku);
  if (!p) return { ok: false, error: `${sku} not in catalog` };
  if (p.availability !== "Discontinued") return { ok: false, error: `${sku} is not retired` };

  // Exactly where it was, when we know: a pre-order returns as a pre-order.
  p.availability = p.retiredFrom === "PreOrder" ? "PreOrder" : (p.stock ?? 24) > 0 ? "InStock" : "OutOfStock";
  delete p.retiredFrom;
  await saveStore(s);
  await recordActivity(slug, "OPERATIONS", `${p.name} (${sku}) back on the shelf as ${p.availability}`);
  return { ok: true, products: s.store.products, detail: `${sku} restored (${p.availability})` };
}
