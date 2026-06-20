/**
 * The live AI buyer test — the heart of the audit.
 *
 * We replay realistic category buyer questions through the real AI assistants
 * (ChatGPT / Claude / Gemini) and capture, verbatim, which stores they
 * recommend — and whether THIS store makes the list. This is the painful,
 * honest moment: "we asked the AI where to buy, and it named your competitors,
 * not you."
 *
 * Falls soft: whatever providers answer in the time budget are used; if none
 * answer (no keys / dead quota), `live` is false and the caller shows a clearly
 * labelled simulated preview instead of faking it.
 */

import { ALL_AGENTS, type AgentId, type AgentAnswer } from "@/lib/commerce/shopping-agents";
import type { StoreProfile } from "@/lib/commerce/store-profile";

export interface BuyerRun {
  agent: AgentId;
  model: string;
  query: string;
  brands: string[];
  mentionedYou: boolean;
  yourRank: number | null;
  text: string;
}

export interface BuyerTestResult {
  live: boolean;
  agentsUsed: AgentId[];
  queries: string[];
  runs: BuyerRun[];
  totalRuns: number;
  mentionedRuns: number;
  mentionRate: number; // 0–100
  topCompetitors: { name: string; count: number }[];
}

/* ---------------- UI-facing projection ---------------- */

export interface BuyerAgentLine {
  agent: AgentId;
  snippet: string;
  brands: string[];
}

export interface BuyerQueryPublic {
  query: string;
  label: string;
  emoji: string;
  topBrand: string;
  youMentioned: boolean;
  agentLines: BuyerAgentLine[];
}

export interface BuyerTestPublic {
  live: boolean;
  agentsUsed: AgentId[];
  mentionRate: number;
  mentionedRuns: number;
  totalRuns: number;
  topCompetitors: { name: string; count: number }[];
  queries: BuyerQueryPublic[];
}

const QUERY_LABELS = ["Best overall", "Budget buyer", "Premium buyer", "Trust & shipping", "Comparison"];
const QUERY_EMOJIS = ["🛒", "🪙", "💎", "🚚", "⚖️"];

function snippet(text: string, n = 240): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > n ? `${clean.slice(0, n)}…` : clean;
}

export function toBuyerTestPublic(result: BuyerTestResult): BuyerTestPublic {
  const queries: BuyerQueryPublic[] = result.queries
    .map((query, i) => {
      const runs = result.runs.filter((r) => r.query === query);
      if (runs.length === 0) return null;
      const firstBrands = runs.map((r) => r.brands[0]).filter(Boolean);
      const topBrand = firstBrands[0] ?? runs.flatMap((r) => r.brands)[0] ?? "—";
      return {
        query,
        label: QUERY_LABELS[i] ?? `Query ${i + 1}`,
        emoji: QUERY_EMOJIS[i] ?? "🛒",
        topBrand,
        youMentioned: runs.some((r) => r.mentionedYou),
        agentLines: runs.map((r) => ({ agent: r.agent, snippet: snippet(r.text), brands: r.brands })),
      };
    })
    .filter((q): q is BuyerQueryPublic => q !== null);

  return {
    live: result.live,
    agentsUsed: result.agentsUsed,
    mentionRate: result.mentionRate,
    mentionedRuns: result.mentionedRuns,
    totalRuns: result.totalRuns,
    topCompetitors: result.topCompetitors,
    queries,
  };
}

export function buildBuyerQueries(profile: StoreProfile): string[] {
  const c = profile.category;
  return [
    `What are the best online stores to buy ${c} from?`,
    `I'm on a budget — which ${c} brand or shop should I buy from?`,
    `I want the best premium ${c} — what store do you recommend?`,
    `Recommend a trustworthy online shop for ${c} with fast shipping.`,
  ];
}

const STOPWORD_BRANDS = /^(the|a|an|your|their|official|various|several|local|any)\b/i;

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/\b(inc|llc|ltd|co|store|shop|online|the)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Parse a model's numbered/bulleted recommendation list into brand names. */
function parseBrands(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:\d+[.)]|[-*•])\s+(.+)$/);
    if (!m) continue;
    // Take the part before the reason separator.
    let name = m[1].split(/\s[—–:-]\s/)[0].replace(/\*\*/g, "").trim();
    name = name.replace(/\.$/, "").trim();
    const words = name.split(/\s+/);
    if (name.length < 2 || name.length > 42 || words.length > 6) continue;
    if (STOPWORD_BRANDS.test(name)) continue;
    out.push(name);
    if (out.length >= 5) break;
  }
  return out;
}

function mentionsStore(profile: StoreProfile, text: string, brands: string[]) {
  const haystack = text.toLowerCase();
  const aliasNorms = profile.aliases.map(normalize).filter((a) => a.length >= 3);
  const mentionedAnywhere = profile.aliases.some(
    (a) => a.length >= 3 && haystack.includes(a.toLowerCase()),
  );
  let rank: number | null = null;
  brands.forEach((b, i) => {
    const nb = normalize(b);
    if (rank === null && aliasNorms.some((a) => nb.includes(a) || a.includes(nb))) rank = i + 1;
  });
  return { mentionedYou: mentionedAnywhere || rank !== null, yourRank: rank };
}

export async function runBuyerTest(profile: StoreProfile, budgetMs = 26_000): Promise<BuyerTestResult> {
  const queries = buildBuyerQueries(profile);

  // Fire every (query × agent) pair in parallel, bounded by an overall budget.
  const pairs: Promise<BuyerRun | null>[] = [];
  for (const query of queries) {
    for (const ask of ALL_AGENTS) {
      pairs.push(
        ask(query).then((ans: AgentAnswer | null) => {
          if (!ans) return null;
          const brands = parseBrands(ans.text);
          const { mentionedYou, yourRank } = mentionsStore(profile, ans.text, brands);
          return { agent: ans.agent, model: ans.model, query, brands, mentionedYou, yourRank, text: ans.text };
        }),
      );
    }
  }

  const settled = await Promise.race([
    Promise.allSettled(pairs),
    new Promise<PromiseSettledResult<BuyerRun | null>[]>((resolve) =>
      setTimeout(() => resolve([]), budgetMs),
    ),
  ]);

  const runs: BuyerRun[] = [];
  for (const r of settled) if (r.status === "fulfilled" && r.value) runs.push(r.value);

  const mentionedRuns = runs.filter((r) => r.mentionedYou).length;
  const totalRuns = runs.length;

  // Real competitor names, frequency-ranked, excluding the store itself.
  const aliasNorms = profile.aliases.map(normalize);
  const counts = new Map<string, { name: string; count: number }>();
  for (const run of runs) {
    for (const brand of run.brands) {
      const key = normalize(brand);
      if (!key || aliasNorms.some((a) => key.includes(a) || a.includes(key))) continue;
      const prev = counts.get(key);
      if (prev) prev.count += 1;
      else counts.set(key, { name: brand, count: 1 });
    }
  }
  const topCompetitors = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 6);

  const agentsUsed = [...new Set(runs.map((r) => r.agent))];

  return {
    live: totalRuns > 0,
    agentsUsed,
    queries,
    runs,
    totalRuns,
    mentionedRuns,
    mentionRate: totalRuns > 0 ? Math.round((mentionedRuns / totalRuns) * 100) : 0,
    topCompetitors,
  };
}
