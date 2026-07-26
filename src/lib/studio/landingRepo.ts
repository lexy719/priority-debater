/**
 * Landing repository — campaign landing pages as first-class business objects.
 *
 * Commerce writes them (brain-governed, product-grounded), stores them, and the
 * storefront serves them SERVER-RENDERED at /store/<slug>/l/<id> so they are
 * legible to humans AND agents — the same discipline as the rest of the store.
 * Blob-first with fs fallback.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { blobConfigured, getJson, putJson } from "./blobStore";

export type Landing = {
  id: string;
  headline: string;
  subhead: string;
  bullets: string[];
  cta: string;
  /** The SKU this page sells — keeps it grounded in a real product. */
  sku: string | null;
  audience: string | null;
  campaignId: string | null;
  createdAt: string;
  views: number;
};

const DIR = path.join(process.cwd(), ".data", "landings");
const SLUG_RE = /^[a-z0-9-]{3,64}$/;

async function readAll(slug: string): Promise<Landing[]> {
  if (blobConfigured()) {
    const blob = await getJson<Landing[]>(`landings/${slug}.json`);
    if (blob) return blob;
  }
  try { return JSON.parse(await fs.readFile(path.join(DIR, `${slug}.json`), "utf8")) as Landing[]; } catch { return []; }
}

async function writeAll(slug: string, rows: Landing[]): Promise<void> {
  if (blobConfigured()) { await putJson(`landings/${slug}.json`, rows); return; }
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, `${slug}.json`), JSON.stringify(rows, null, 2), "utf8");
}

export async function listLandings(slug: string): Promise<Landing[]> {
  return SLUG_RE.test(slug) ? readAll(slug) : [];
}

export async function loadLanding(slug: string, id: string): Promise<Landing | null> {
  if (!SLUG_RE.test(slug)) return null;
  return (await readAll(slug)).find((l) => l.id === id) ?? null;
}

export async function saveLanding(slug: string, l: Omit<Landing, "id" | "createdAt" | "views">): Promise<Landing> {
  const rows = await readAll(slug);
  const landing: Landing = {
    ...l,
    id: `L-${(rows.length + 1).toString().padStart(2, "0")}`,
    createdAt: new Date().toISOString(),
    views: 0,
  };
  rows.push(landing);
  await writeAll(slug, rows);
  return landing;
}

export async function deleteLanding(slug: string, id: string): Promise<Landing[]> {
  const rows = (await readAll(slug)).filter((l) => l.id !== id);
  await writeAll(slug, rows);
  return rows;
}

/** Count a real view — landing performance is measured, not modelled. */
export async function recordLandingView(slug: string, id: string): Promise<void> {
  try {
    const rows = await readAll(slug);
    const l = rows.find((x) => x.id === id);
    if (!l) return;
    l.views += 1;
    await writeAll(slug, rows);
  } catch { /* a view counter must never break the page */ }
}
