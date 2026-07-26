/**
 * Worker activity log — the visible trace of the autonomous workforce.
 *
 * Every meaningful act by an AI worker (order intake, stock adjustment,
 * learning pass, analysis, status change) is recorded per business, so the
 * command centre can show WHO did WHAT and WHEN. Blob-first with fs fallback,
 * like every other repo.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { blobConfigured, getJson, putJson } from "./blobStore";

/** The AI workforce. Externally Commerce presents capabilities; internally
    every act belongs to a named worker. */
export type Worker = "MARKETING" | "OPERATIONS" | "FINANCE" | "SYSTEM";
export type Activity = { ts: string; worker: Worker; txt: string };

const DIR = path.join(process.cwd(), ".data", "activity");
const SLUG_RE = /^[a-z0-9-]{3,64}$/;
const MAX = 200;

async function readAll(slug: string): Promise<Activity[]> {
  if (blobConfigured()) {
    const blob = await getJson<Activity[]>(`activity/${slug}.json`);
    if (blob) return blob;
  }
  try { return JSON.parse(await fs.readFile(path.join(DIR, `${slug}.json`), "utf8")) as Activity[]; } catch { return []; }
}

export async function recordActivity(slug: string, worker: Worker, txt: string): Promise<void> {
  if (!SLUG_RE.test(slug)) return;
  try {
    let all = await readAll(slug);
    all.push({ ts: new Date().toISOString(), worker, txt: txt.slice(0, 180) });
    if (all.length > MAX) all = all.slice(-MAX);
    if (blobConfigured()) {
      await putJson(`activity/${slug}.json`, all);
    } else {
      await fs.mkdir(DIR, { recursive: true });
      await fs.writeFile(path.join(DIR, `${slug}.json`), JSON.stringify(all), "utf8");
    }
  } catch { /* the log must never break an operation */ }
}

export async function listActivity(slug: string, limit = 12): Promise<Activity[]> {
  if (!SLUG_RE.test(slug)) return [];
  return (await readAll(slug)).slice(-limit).reverse();
}
