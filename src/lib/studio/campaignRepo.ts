/**
 * Campaign repository — the objects autonomous marketing operates on.
 *
 * A campaign is a durable marketing intent (objective, channels, budget cap,
 * status) that owns creative VARIANTS. Variants are the experiment: each is a
 * brain-written draft that accumulates measured results once a channel is
 * connected, so a winner can be declared from data rather than taste.
 *
 * Everything here is real and persisted today; the numbers stay null until a
 * channel reports them — Commerce never fills them in.
 * Blob-first with fs fallback, like every other repo.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { blobConfigured, getJson, putJson } from "./blobStore";

export type CampaignStatus = "draft" | "live" | "paused" | "ended";
/** Legal transitions — the Marketing worker's campaign state machine. */
export const CAMPAIGN_FLOW: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ["live", "ended"],
  live: ["paused", "ended"],
  paused: ["live", "ended"],
  ended: [],
};

export type Variant = {
  id: string;
  platform: string;
  angle: string;
  body: string;
  createdAt: string;
  /** Measured only — populated when a connected channel reports. */
  impressions: number | null;
  clicks: number | null;
  spend: number | null;
  orders: number | null;
  /** Set by the owner (or a rule) once results justify it. */
  winner?: boolean;
  /** Flagged when a live variant has been running long enough to tire. */
  retiredAt?: string;
};

export type Campaign = {
  id: string;
  name: string;
  objective: string;
  channels: string[];
  budgetCap: number | null;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
  variants: Variant[];
};

const DIR = path.join(process.cwd(), ".data", "campaigns");
const SLUG_RE = /^[a-z0-9-]{3,64}$/;

async function readAll(slug: string): Promise<Campaign[]> {
  if (blobConfigured()) {
    const blob = await getJson<Campaign[]>(`campaigns/${slug}.json`);
    if (blob) return blob;
  }
  try { return JSON.parse(await fs.readFile(path.join(DIR, `${slug}.json`), "utf8")) as Campaign[]; } catch { return []; }
}

async function writeAll(slug: string, rows: Campaign[]): Promise<void> {
  if (blobConfigured()) { await putJson(`campaigns/${slug}.json`, rows); return; }
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, `${slug}.json`), JSON.stringify(rows, null, 2), "utf8");
}

export async function listCampaigns(slug: string): Promise<Campaign[]> {
  return SLUG_RE.test(slug) ? readAll(slug) : [];
}

export async function createCampaign(
  slug: string,
  input: { name: string; objective: string; channels: string[]; budgetCap: number | null },
): Promise<Campaign> {
  const rows = await readAll(slug);
  const now = new Date().toISOString();
  const campaign: Campaign = {
    id: `CMP-${(rows.length + 1).toString().padStart(2, "0")}`,
    name: input.name.slice(0, 80),
    objective: input.objective.slice(0, 160),
    channels: input.channels.slice(0, 6),
    budgetCap: input.budgetCap,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    variants: [],
  };
  rows.push(campaign);
  await writeAll(slug, rows);
  return campaign;
}

export async function setCampaignStatus(slug: string, id: string, next: CampaignStatus): Promise<Campaign | null> {
  const rows = await readAll(slug);
  const c = rows.find((x) => x.id === id);
  if (!c) return null;
  if (!CAMPAIGN_FLOW[c.status]?.includes(next)) return null;
  c.status = next;
  c.updatedAt = new Date().toISOString();
  await writeAll(slug, rows);
  return c;
}

export async function addVariant(slug: string, id: string, v: Omit<Variant, "id" | "createdAt" | "impressions" | "clicks" | "spend" | "orders">): Promise<Campaign | null> {
  const rows = await readAll(slug);
  const c = rows.find((x) => x.id === id);
  if (!c) return null;
  c.variants.push({
    id: `${c.id}-V${(c.variants.length + 1).toString().padStart(2, "0")}`,
    platform: v.platform, angle: v.angle, body: v.body,
    createdAt: new Date().toISOString(),
    impressions: null, clicks: null, spend: null, orders: null,
  });
  c.updatedAt = new Date().toISOString();
  await writeAll(slug, rows);
  return c;
}

export async function markWinner(slug: string, campaignId: string, variantId: string): Promise<Campaign | null> {
  const rows = await readAll(slug);
  const c = rows.find((x) => x.id === campaignId);
  if (!c) return null;
  c.variants.forEach((v) => { v.winner = v.id === variantId; });
  c.updatedAt = new Date().toISOString();
  await writeAll(slug, rows);
  return c;
}

export async function retireVariant(slug: string, campaignId: string, variantId: string): Promise<Campaign | null> {
  const rows = await readAll(slug);
  const c = rows.find((x) => x.id === campaignId);
  const v = c?.variants.find((x) => x.id === variantId);
  if (!c || !v) return null;
  v.retiredAt = new Date().toISOString();
  c.updatedAt = new Date().toISOString();
  await writeAll(slug, rows);
  return c;
}

export async function deleteCampaign(slug: string, id: string): Promise<Campaign[]> {
  const rows = (await readAll(slug)).filter((c) => c.id !== id);
  await writeAll(slug, rows);
  return rows;
}

/** Creative-fatigue heuristic: a live variant older than N days that has never
    been declared a winner is a candidate for refresh. Age is measurable even
    before channels report performance. */
export function fatigued(c: Campaign, days = 14): Variant[] {
  if (c.status !== "live") return [];
  const cutoff = Date.now() - days * 86400000;
  return c.variants.filter((v) => !v.retiredAt && !v.winner && Date.parse(v.createdAt) < cutoff);
}
