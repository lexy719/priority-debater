/**
 * Hit repository — REAL agent-traffic attribution for published stores.
 *
 * Every request to a store surface (page, product, feed, llms, catalog) is
 * classified by user-agent and recorded (.data/hits/*.json, gitignored).
 * This is the closed loop nobody in the market has: the ADS console's only
 * non-simulated meter reads from here. Swap-to-Supabase seam like the others.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { blobConfigured, getJson, putJson } from "./blobStore";

export type HitKind = "store" | "product" | "feed" | "llms" | "catalog";
export type Hit = { ts: string; agent: string; kind: HitKind; path: string };

const DIR = path.join(process.cwd(), ".data", "hits");
const SLUG_RE = /^[a-z0-9-]{3,64}$/;
const MAX_HITS = 500;

/** Known AI shopping/crawling agents, most specific first. */
const AGENTS: [RegExp, string][] = [
  [/OAI-SearchBot/i, "OAI-SearchBot"],
  [/ChatGPT-User/i, "ChatGPT-User"],
  [/GPTBot/i, "GPTBot"],
  [/Claude-User/i, "Claude-User"],
  [/ClaudeBot|Claude-Web|anthropic-ai/i, "ClaudeBot"],
  [/Perplexity-User/i, "Perplexity-User"],
  [/PerplexityBot/i, "PerplexityBot"],
  [/Google-Extended|GoogleOther/i, "Google-AI"],
  [/Amazonbot/i, "Amazonbot"],
  [/Bytespider/i, "Bytespider"],
  [/meta-externalagent/i, "Meta-AI"],
  [/cohere/i, "Cohere"],
  [/PDR-LegibilityBot/i, "PDR-LegibilityBot"],
  // PDR's own buying agent, purchasing from another PDR store on a business's
  // behalf. Named distinctly from the crawlers because it is the only agent
  // here that BUYS: counting it as HUMAN understated a seller's agent traffic
  // and hid the network transacting with itself.
  [/PDR-BuyingAgent/i, "PDR-BuyingAgent"],
  [/PDR-Commerce-DistributionCheck/i, "PDR-DistributionCheck"],
  [/bot|crawler|spider|scraper/i, "OTHER-BOT"],
];

export function classifyAgent(ua: string | null): string {
  if (!ua) return "HUMAN";
  for (const [re, name] of AGENTS) if (re.test(ua)) return name;
  return "HUMAN";
}

async function readHits(slug: string): Promise<Hit[]> {
  if (blobConfigured()) {
    const blob = await getJson<Hit[]>(`hits/${slug}.json`);
    if (blob) return blob;
    // blob miss → local fallback; the next hit carries these into Supabase
  }
  try { return JSON.parse(await fs.readFile(path.join(DIR, `${slug}.json`), "utf8")) as Hit[]; } catch { return []; }
}

export async function recordHit(slug: string, kind: HitKind, reqPath: string, ua: string | null): Promise<void> {
  if (!SLUG_RE.test(slug)) return;
  const hit: Hit = { ts: new Date().toISOString(), agent: classifyAgent(ua), kind, path: reqPath.slice(0, 160) };
  try {
    let hits = await readHits(slug);
    hits.push(hit);
    if (hits.length > MAX_HITS) hits = hits.slice(-MAX_HITS);
    if (blobConfigured()) {
      await putJson(`hits/${slug}.json`, hits);
    } else {
      await fs.mkdir(DIR, { recursive: true });
      await fs.writeFile(path.join(DIR, `${slug}.json`), JSON.stringify(hits), "utf8");
    }
  } catch { /* attribution must never break the store */ }
}

/** Every retained hit, oldest first — for period-scoped reporting (the
    operator statement) where the last-8 `recent` list would undercount. */
export async function listHits(slug: string): Promise<Hit[]> {
  if (!SLUG_RE.test(slug)) return [];
  try { return await readHits(slug); } catch { return []; }
}

export type TrafficSummary = {
  total: number;
  agents: number;
  humans: number;
  byAgent: Record<string, number>;
  byKind: Record<string, number>;
  /** Agent reads per product sku (from /p/{sku} paths) — AI discoverability. */
  byProduct: Record<string, number>;
  recent: Hit[];
};

export async function loadTraffic(slug: string): Promise<TrafficSummary> {
  const empty: TrafficSummary = { total: 0, agents: 0, humans: 0, byAgent: {}, byKind: {}, byProduct: {}, recent: [] };
  if (!SLUG_RE.test(slug)) return empty;
  try {
    const hits = await readHits(slug);
    const byAgent: Record<string, number> = {};
    const byKind: Record<string, number> = {};
    const byProduct: Record<string, number> = {};
    let agents = 0;
    for (const h of hits) {
      byKind[h.kind] = (byKind[h.kind] ?? 0) + 1;
      if (h.agent === "HUMAN") continue;
      agents += 1;
      byAgent[h.agent] = (byAgent[h.agent] ?? 0) + 1;
      const m = h.path.match(/\/p\/([a-z0-9-]+)/);
      if (m) byProduct[m[1]] = (byProduct[m[1]] ?? 0) + 1;
    }
    return { total: hits.length, agents, humans: hits.length - agents, byAgent, byKind, byProduct, recent: hits.slice(-8).reverse() };
  } catch {
    return empty;
  }
}
