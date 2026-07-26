/**
 * Cost repository — the owner-supplied half of financial intelligence.
 *
 * Commerce measures revenue itself, but unit COST is knowledge only the owner
 * has. Stored per business as { sku: unitCost }, it unlocks margin, COGS and
 * true inventory value. Everything derived from it stays honest: without costs
 * the Finance view reports revenue and inventory at price, and says so.
 * Blob-first with fs fallback, like every other repo.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { blobConfigured, getJson, putJson } from "./blobStore";

export type CostMap = Record<string, number>;

const DIR = path.join(process.cwd(), ".data", "costs");
const SLUG_RE = /^[a-z0-9-]{3,64}$/;

export async function loadCosts(slug: string): Promise<CostMap> {
  if (!SLUG_RE.test(slug)) return {};
  if (blobConfigured()) {
    const blob = await getJson<CostMap>(`costs/${slug}.json`);
    if (blob) return blob;
  }
  try { return JSON.parse(await fs.readFile(path.join(DIR, `${slug}.json`), "utf8")) as CostMap; } catch { return {}; }
}

export async function saveCosts(slug: string, costs: CostMap): Promise<CostMap> {
  if (!SLUG_RE.test(slug)) throw new Error("bad slug");
  const clean: CostMap = {};
  for (const [sku, v] of Object.entries(costs)) {
    const n = Number(v);
    if (/^[a-z0-9-]{1,64}$/.test(sku) && Number.isFinite(n) && n >= 0) clean[sku] = Math.round(n * 100) / 100;
  }
  if (blobConfigured()) {
    await putJson(`costs/${slug}.json`, clean);
    return clean;
  }
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, `${slug}.json`), JSON.stringify(clean, null, 2), "utf8");
  return clean;
}
