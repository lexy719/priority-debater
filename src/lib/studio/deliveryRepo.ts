/**
 * Delivery — the moment a sale becomes a thing the buyer actually has.
 *
 * A physical good needs hands. A file, a licence or a booking does not, and
 * that is the whole reason the digital lane can close without a human in it:
 * the order arrives, the artefact is issued in the same breath, and the buyer
 * (or the agent acting for them) can fetch it immediately.
 *
 * The honesty rule here is sharp, because this is where it would be easiest to
 * fake: if the seller has not attached anything to deliver, we say so on the
 * delivery page rather than issuing a link to nothing. An unclaimed delivery is
 * a promise; a claimed one is a fact, and both are dated.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { blobConfigured, getJson, putJson } from "./blobStore";

export type DeliveryKind = "file" | "licence" | "booking" | "pending";

export type Delivery = {
  /** Unguessable token — the delivery URL is the credential. */
  token: string;
  orderId: string;
  sku: string;
  productName: string;
  buyerEmail: string;
  kind: DeliveryKind;
  /** A URL to fetch, a licence string, or scheduling instructions. */
  payload: string | null;
  /** Said out loud when there is nothing attached yet. */
  note: string | null;
  issuedAt: string;
  claimedAt: string | null;
  claims: number;
};

const DIR = path.join(process.cwd(), ".data", "deliveries");
const SLUG_RE = /^[a-z0-9-]{3,64}$/;

async function readAll(slug: string): Promise<Delivery[]> {
  if (blobConfigured()) {
    const d = await getJson<Delivery[]>(`deliveries/${slug}.json`);
    if (d) return d;
  }
  try { return JSON.parse(await fs.readFile(path.join(DIR, `${slug}.json`), "utf8")) as Delivery[]; } catch { return []; }
}

async function writeAll(slug: string, rows: Delivery[]): Promise<void> {
  if (blobConfigured()) { await putJson(`deliveries/${slug}.json`, rows); return; }
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, `${slug}.json`), JSON.stringify(rows, null, 2), "utf8");
}

function token(seed: string): string {
  let h = 2166136261 >>> 0;
  const s = `${seed}:${Date.now()}:${process.hrtime.bigint()}`;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  const a = (h >>> 0).toString(36);
  let g = 5381 >>> 0;
  for (let i = s.length - 1; i >= 0; i--) g = (Math.imul(g, 33) ^ s.charCodeAt(i)) >>> 0;
  return `${a}${g.toString(36)}`.padEnd(16, "x").slice(0, 20);
}

/**
 * Issue the artefact for one order. `attached` is whatever the seller set on
 * the product — a URL, a licence template, booking instructions. Without it the
 * delivery is created anyway, marked `pending`, so the buyer has a real record
 * and the seller has an obvious thing to fix.
 */
export async function issueDelivery(slug: string, input: {
  orderId: string; sku: string; productName: string; buyerEmail: string;
  kind: "digital" | "service" | "access"; attached?: string | null; qty?: number;
}): Promise<Delivery> {
  const attached = (input.attached ?? "").trim();
  const isUrl = /^https?:\/\//i.test(attached);
  const d: Delivery = {
    token: token(`${slug}:${input.orderId}`),
    orderId: input.orderId,
    sku: input.sku,
    productName: input.productName,
    buyerEmail: input.buyerEmail,
    kind: attached ? (isUrl ? "file" : input.kind === "service" ? "booking" : "licence") : "pending",
    payload: attached
      ? (isUrl || input.kind === "service" ? attached : `${attached}-${token(input.orderId).slice(0, 8).toUpperCase()}`)
      : null,
    note: attached ? null
      : input.kind === "service"
        ? "The seller has not published scheduling instructions for this service yet — they have been notified and will confirm by email."
        : "The seller has not attached a file or licence to this product yet — they have been notified. This page becomes the delivery the moment they do.",
    issuedAt: new Date().toISOString(),
    claimedAt: null,
    claims: 0,
  };
  const rows = await readAll(slug);
  rows.push(d);
  await writeAll(slug, rows);
  return d;
}

export async function loadDelivery(slug: string, token: string): Promise<Delivery | null> {
  if (!SLUG_RE.test(slug) || !token) return null;
  return (await readAll(slug)).find((d) => d.token === token) ?? null;
}

export async function deliveryForOrder(slug: string, orderId: string): Promise<Delivery | null> {
  return (await readAll(slug)).find((d) => d.orderId === orderId) ?? null;
}

/** Record that the buyer actually took it — the difference between sent and received. */
export async function claimDelivery(slug: string, token: string): Promise<Delivery | null> {
  const rows = await readAll(slug);
  const d = rows.find((x) => x.token === token);
  if (!d) return null;
  d.claims += 1;
  d.claimedAt = d.claimedAt ?? new Date().toISOString();
  await writeAll(slug, rows);
  return d;
}

export async function listDeliveries(slug: string): Promise<Delivery[]> {
  return SLUG_RE.test(slug) ? (await readAll(slug)).slice(-100).reverse() : [];
}
