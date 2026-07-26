/**
 * One question, one answer: what business is this, and where does it live?
 *
 * Commerce has two kinds of company under management:
 *  · HOSTED    — Studio built it, PDR serves the storefront, we own every write.
 *  · CONNECTED — the merchant already sells somewhere else (Shopify, Woo). We
 *                read their catalogue, publish an agent layer for it, and
 *                operate what they have authorised.
 *
 * Both resolve to the same `PublishedStore` shape, so the workers, the finance
 * maths, the automation engine and the statement never branch on it. What DOES
 * branch is authority: a connected store is not ours to write to, and
 * `canWrite` says so out loud rather than letting a worker fail silently.
 */

import { loadConnected, type ConnectedBusiness } from "./connectedRepo";
import { loadStore, type PublishedStore } from "./storeRepo";

export type BusinessKind = "hosted" | "connected";

export type Business = {
  kind: BusinessKind;
  store: PublishedStore;
  /** Present only for connected businesses. */
  connection?: ConnectedBusiness;
  /** True when PDR may change the catalogue: always for hosted, and for
      connected only once the merchant grants write scopes. */
  canWrite: boolean;
  /** Why a write would be refused, in words the UI can show verbatim. */
  writeNote: string | null;
  /** Where a buyer actually completes a purchase. */
  buyAt: "pdr" | "merchant";
};

/** A connected business, dressed in the shape every worker already reads. */
function asPublishedStore(c: ConnectedBusiness): PublishedStore {
  return {
    slug: c.slug,
    createdAt: c.createdAt,
    source: "stock",
    spec: `${c.platform} store connected from ${c.domain}`,
    store: { brand: c.brand, products: c.products },
    manifest: {},
    ...(c.ownerId ? { ownerId: c.ownerId } : {}),
  };
}

export async function loadBusiness(slug: string): Promise<Business | null> {
  const hosted = await loadStore(slug);
  if (hosted) {
    return { kind: "hosted", store: hosted, canWrite: true, writeNote: null, buyAt: "pdr" };
  }
  const connected = await loadConnected(slug);
  if (!connected) return null;
  return {
    kind: "connected",
    store: asPublishedStore(connected),
    connection: connected,
    canWrite: connected.scopes.write,
    writeNote: connected.scopes.write
      ? null
      : `${connected.brand.fullName} is connected read-only — PDR can measure it and propose, but cannot change the catalogue until write access is granted on ${connected.platform}.`,
    buyAt: "merchant",
  };
}

/** Read-only convenience for the many callers that only want the catalogue. */
export async function loadBusinessStore(slug: string): Promise<PublishedStore | null> {
  return (await loadBusiness(slug))?.store ?? null;
}
