import "server-only";

/**
 * PD Commerce scan engine — OpenAI only (resurrected from the pre-rebuild
 * engine at HEAD:src/lib/commerce/scan.ts, adapted for Phase 7).
 *
 * `runScan(url, onProgress?)` produces a full `CommerceReport`:
 *   fetchStore → inferContext → buildQueries → runBuyerTest (OpenAI web search)
 *   → scoreStore → deriveFixes, emitting a `ScanLogEvent` per real step so the
 *   /scan page can stream a live mono log (§4.2 — real steps, never a fake bar).
 *
 * Everything fails soft. A dead/absent OpenAI key, a slow store, or a blocked
 * robots.txt degrades a single signal rather than throwing — the report still
 * renders, honestly labelled.
 */

import OpenAI from "openai";
import { randomBytes } from "crypto";
import type {
  AgentCheck,
  BuyerQuery,
  CommerceReport,
  CompetitorCard,
  CompetitorMention,
  Fix,
  GoogleSignals,
  IntentTag,
  Scores,
  Shock,
} from "./report-types";

/* ───────────────────────── Progress events (SSE live log) ───────────────── */

export interface ScanLogEvent {
  step:
    | "fetch_store"
    | "infer_context"
    | "buyer_query"
    | "google_check"
    | "score"
    | "fixes";
  label: string;
  status: "start" | "ok" | "warn";
}

export type OnScanProgress = (e: ScanLogEvent) => void;

/* ───────────────────────── URL + fetch helpers ───────────────────────── */

export interface NormalizedUrl {
  url: string;
  host: string;
}

export function normalizeUrl(input: string): NormalizedUrl | null {
  let s = (input ?? "").trim().toLowerCase();
  if (!s) return null;
  if (!/^https?:\/\//.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "");
    if (!host.includes(".")) return null;
    return { url: `${u.protocol}//${u.hostname}`, host };
  } catch {
    return null;
  }
}

const UA =
  "Mozilla/5.0 (compatible; PriorityDebaterBot/1.0; +https://prioritydebater.com)";

async function fetchText(url: string, ms = 8_000): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: "text/html,*/*" },
      signal: ctrl.signal,
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchOk(url: string, ms = 5_000): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    const res = await fetch(url, { headers: { "user-agent": UA }, signal: ctrl.signal, redirect: "follow" });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

/* ───────────────────────── Store profile ───────────────────────── */

export interface StoreProfile {
  url: string;
  host: string;
  name: string;
  description: string;
  aliases: string[];
  isShopify: boolean;
  signals: {
    hasTitle: boolean;
    hasMetaDescription: boolean;
    hasJsonLd: boolean;
    hasProductSchema: boolean;
    hasOfferSchema: boolean;
    hasFaqSchema: boolean;
    hasSitemap: boolean;
    hasLlmsTxt: boolean;
    aiCrawlersAllowed: boolean;
  };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractName(html: string, host: string): string {
  const og = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);
  if (og?.[1]) return decodeEntities(og[1]).trim();
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (title?.[1]) {
    // Titles are usually "Brand — tagline" / "Brand | tagline"; keep the brand.
    return decodeEntities(title[1]).split(/[|–—\-:·•]/)[0].trim().slice(0, 60);
  }
  // Fall back to the domain's second-level label, title-cased.
  const label = host.split(".")[0];
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function extractDescription(html: string): string {
  const m =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  return m?.[1] ? decodeEntities(m[1]).trim().slice(0, 300) : "";
}

function buildAliases(name: string, host: string): string[] {
  const set = new Set<string>();
  const n = name.trim();
  if (n.length >= 2) set.add(n);
  const label = host.split(".")[0];
  if (label.length >= 2) set.add(label);
  // Spaceless brand ("Bella Nova" → "bellanova") often matches the domain.
  const squished = n.replace(/[^a-z0-9]/gi, "");
  if (squished.length >= 3) set.add(squished);
  return [...set];
}

/** robots.txt that explicitly disallows the major AI crawlers fails this check. */
function aiCrawlersAllowed(robots: string | null): boolean {
  if (!robots) return true; // no robots.txt = nothing blocked
  const bots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Google-Extended"];
  const lower = robots.toLowerCase();
  // Crude but honest: a blanket "User-agent: *\nDisallow: /" or a named bot
  // disallow on root counts as blocked.
  if (/user-agent:\s*\*[\s\S]*?disallow:\s*\/\s*(\n|$)/i.test(robots)) return false;
  return !bots.some((b) => {
    const i = lower.indexOf(b.toLowerCase());
    if (i === -1) return false;
    return /disallow:\s*\/\s*(\n|$)/i.test(robots.slice(i, i + 200));
  });
}

export async function fetchStore(n: NormalizedUrl): Promise<StoreProfile> {
  const [html, robots, sitemapOk, llmsOk] = await Promise.all([
    fetchText(n.url),
    fetchText(`${n.url}/robots.txt`, 5_000),
    fetchOk(`${n.url}/sitemap.xml`),
    fetchOk(`${n.url}/llms.txt`),
  ]);

  const h = html ?? "";
  const name = extractName(h, n.host);
  const jsonLdBlocks = [...h.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1])
    .join("\n");

  return {
    url: n.url,
    host: n.host,
    name,
    description: extractDescription(h),
    aliases: buildAliases(name, n.host),
    isShopify: /cdn\.shopify\.com|shopify\.theme|x-shopify/i.test(h),
    signals: {
      hasTitle: /<title[^>]*>[^<]+<\/title>/i.test(h),
      hasMetaDescription: /<meta[^>]+name=["']description["']/i.test(h),
      hasJsonLd: jsonLdBlocks.length > 0,
      hasProductSchema: /"@type"\s*:\s*"Product"/i.test(jsonLdBlocks),
      hasOfferSchema: /"@type"\s*:\s*"(Offer|AggregateOffer)"/i.test(jsonLdBlocks),
      hasFaqSchema: /"@type"\s*:\s*"FAQPage"/i.test(jsonLdBlocks),
      hasSitemap: sitemapOk,
      hasLlmsTxt: llmsOk,
      aiCrawlersAllowed: aiCrawlersAllowed(robots),
    },
  };
}

/* ───────────────────────── OpenAI ───────────────────────── */

function openaiClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key ? new OpenAI({ apiKey: key }) : null;
}

function model(): string {
  return process.env.COMMERCE_OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

const BUYER_SYSTEM =
  "You are a helpful AI shopping assistant with live web access. Answer shoppers honestly and specifically, naming real, currently-operating stores or brands — never refuse or give generic advice.";

/**
 * The question shapes the answer. A "is X any good?" question should get a real
 * VERDICT on X (not a list of rivals); discovery/comparison questions should get
 * a ranked list of stores.
 */
function buildInstruction(intent: IntentTag, query: string, storeName: string, category: string): string {
  if (intent === "BRAND") {
    return (
      `A shopper asks: "${query}"\n\n` +
      `Give an honest verdict on ${storeName} specifically as a place to buy ${category}, based on real reviews and reputation. Reply in EXACTLY this format:\n` +
      `VERDICT: <RECOMMENDED, MIXED, or AVOID>\n` +
      `WHY: <2-3 sentence honest assessment of ${storeName} — quality, reviews, trust, value>\n` +
      `ALTERNATIVES: <up to 3 comparable or stronger stores, comma-separated, or "none">`
    );
  }
  return (
    `A shopper asks: "${query}"\n\n` +
    "Recommend the top 5 specific stores or brands to buy from right now. " +
    "Reply ONLY as a numbered list, one per line, in the exact format:\n" +
    "1. Brand or store name — one short reason\n" +
    "Name only real sellers. No intro, no conclusion."
  );
}

async function askOpenAI(client: OpenAI, instruction: string): Promise<string | null> {
  // Prefer the Responses API with live web search (grounded, names real stores).
  try {
    const res = await withTimeout(
      client.responses.create({
        model: model(),
        instructions: BUYER_SYSTEM,
        input: instruction,
        tools: [{ type: "web_search" }],
        max_output_tokens: 600,
      }),
      16_000,
    );
    const text = (res as { output_text?: string }).output_text?.trim();
    if (text) return text;
  } catch {
    /* fall through to a plain completion */
  }
  try {
    const completion = await withTimeout(
      client.chat.completions.create({
        model: model(),
        messages: [
          { role: "system", content: BUYER_SYSTEM },
          { role: "user", content: instruction },
        ],
        temperature: 0.4,
        max_completion_tokens: 500,
      }),
      14_000,
    );
    return completion.choices[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

/** Parse a BRAND-query verdict answer (VERDICT / WHY / ALTERNATIVES). */
function parseVerdict(text: string, p: StoreProfile): { verdict: "RECOMMENDED" | "MIXED" | "AVOID"; why: string; alternatives: string[] } {
  const vm = text.match(/VERDICT:\s*(RECOMMENDED|MIXED|AVOID)/i);
  const verdict = (vm?.[1]?.toUpperCase() as "RECOMMENDED" | "MIXED" | "AVOID") || "MIXED";
  const wm = text.match(/WHY:\s*([\s\S]*?)(?:\nALTERNATIVES:|$)/i);
  const why = (wm?.[1] ?? text).replace(/\s+/g, " ").trim().slice(0, 320);
  const am = text.match(/ALTERNATIVES:\s*(.+)/i);
  const aliasNorms = p.aliases.map(normBrand);
  const alternatives = am
    ? am[1]
        .split(/[,;]/)
        .map((s) => s.replace(/\.$/, "").trim())
        .filter((s) => s.length > 1 && s.length < 40 && !/^none$/i.test(s) && !aliasNorms.some((a) => normBrand(s).includes(a) || a.includes(normBrand(s))))
        .slice(0, 3)
    : [];
  return { verdict, why, alternatives };
}

export interface StoreContext {
  category: string;
  country: string;
}

async function inferContext(client: OpenAI | null, p: StoreProfile): Promise<StoreContext> {
  const fallback: StoreContext = { category: keywordCategory(p), country: "" };
  if (!client) return fallback;
  const prompt =
    `An online store.\nName: "${p.name}"\nSite: ${p.host}\nDescription: "${p.description || "(none)"}"\n\n` +
    "Reply with ONLY a JSON object, no prose:\n" +
    '{"category":"<2-4 word concrete product category a shopper searches, lowercase, no brand>",' +
    '"country":"<the ONE country it primarily sells to in English, or empty string if global>"}';
  try {
    const completion = await withTimeout(
      client.chat.completions.create({
        model: model(),
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_completion_tokens: 40,
        response_format: { type: "json_object" },
      }),
      8_000,
    );
    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as { category?: string; country?: string };
    const category = (parsed.category ?? "").toLowerCase().replace(/["'.]/g, "").replace(/\s+/g, " ").trim();
    if (!category || category.length > 48 || category.split(" ").length > 5) return fallback;
    const country = (parsed.country ?? "").replace(/["'.]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
    return { category, country };
  } catch {
    return fallback;
  }
}

/** Last-resort category guess from the meta description — never blank. */
function keywordCategory(p: StoreProfile): string {
  const text = `${p.description}`.toLowerCase();
  const m = text.match(/\b(clothing|jewellery|jewelry|skincare|coffee|shoes|furniture|supplements|candles|cosmetics|accessories|homeware|stationery|electronics|toys|wine|tea|bags|watches|dresses)\b/);
  return m?.[1] ?? "products";
}

/* ───────────────────────── Buyer test ───────────────────────── */

const INTENTS: { intent: IntentTag; label: string }[] = [
  { intent: "DISCOVERY", label: "Discovery" },
  { intent: "VALUE", label: "Value" },
  { intent: "TRUST", label: "Trust" },
  { intent: "POPULAR", label: "Popular" },
  { intent: "BRAND", label: "Brand" },
];

export function buildQueries(p: StoreProfile, ctx: StoreContext): { intent: IntentTag; label: string; query: string }[] {
  const c = ctx.category;
  const loc = ctx.country ? ` in ${ctx.country}` : "";
  const name = p.name;
  // Five questions a real shopper would ASK AN AI — all fair to the store: the
  // four cold queries can surface it, and the brand query gets an honest verdict.
  // (No "alternatives to {store}" — that asks AI to exclude you, which is unwinnable.)
  return [
    { ...INTENTS[0], query: `What are the best ${c} brands to buy from${loc}?` },
    { ...INTENTS[1], query: `What's the best value-for-money ${c}${loc}?` },
    { ...INTENTS[2], query: `Which ${c} brands are most trusted for quality and easy returns${loc}?` },
    { ...INTENTS[3], query: `What ${c} brands do people recommend most right now${loc}?` },
    { ...INTENTS[4], query: `Is ${name} a good place to buy ${c}? What do customer reviews say?` },
  ];
}

const STOPWORD_BRANDS = /^(the|a|an|your|their|official|various|several|local|any|best|top)\b/i;

function normBrand(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/\b(inc|llc|ltd|co|store|shop|online|the)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Parse a numbered/bulleted recommendation list into brand names. */
function parseBrands(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:\d+[.)]|[-*•])\s+(.+)$/);
    if (!m) continue;
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

function mentionsStore(p: StoreProfile, text: string, brands: string[], strict: boolean): { named: boolean; rank: number | null } {
  const haystack = text.toLowerCase();
  const aliasNorms = p.aliases.map(normBrand).filter((a) => a.length >= 3);
  const anywhere = p.aliases.some((a) => a.length >= 3 && haystack.includes(a.toLowerCase()));
  let rank: number | null = null;
  brands.forEach((b, i) => {
    const nb = normBrand(b);
    if (rank === null && aliasNorms.some((a) => nb.includes(a) || a.includes(nb))) rank = i + 1;
  });
  // Strict (name-containing) queries only count a ranked recommendation, not an
  // echo of the name in prose. Cold queries count any genuine mention.
  return { named: strict ? rank !== null : anywhere || rank !== null, rank };
}

function firstSentences(text: string, n = 240): string {
  const clean = text.replace(/\s+/g, " ").replace(/^\d+[.)]\s*/, "").trim();
  return clean.length > n ? `${clean.slice(0, n)}…` : clean;
}

interface BuyerTest {
  live: boolean;
  queries: BuyerQuery[];
  topCompetitors: CompetitorMention[];
  timesNamed: number;
  totalAnswered: number;
}

async function runBuyerTest(
  p: StoreProfile,
  specs: ReturnType<typeof buildQueries>,
  category: string,
  onProgress?: OnScanProgress,
): Promise<BuyerTest> {
  const client = openaiClient();

  const answered = await Promise.all(
    specs.map(async (spec) => {
      onProgress?.({ step: "buyer_query", label: `Replaying ${spec.label.toLowerCase()} query — "${spec.query}"`, status: "start" });
      const instruction = buildInstruction(spec.intent, spec.query, p.name, category);
      const text = client ? await askOpenAI(client, instruction) : null;
      onProgress?.({
        step: "buyer_query",
        label: text ? `${spec.label} query answered` : `${spec.label} query — no answer (provider degraded)`,
        status: text ? "ok" : "warn",
      });
      return { spec, text };
    }),
  );

  const queries: BuyerQuery[] = [];
  const competitorCounts = new Map<string, CompetitorMention>();
  const aliasNorms = p.aliases.map(normBrand);
  let timesNamed = 0;
  let totalAnswered = 0;

  for (const { spec, text } of answered) {
    if (!text) {
      // No answer for this query — record it honestly as untested.
      queries.push({
        intent: spec.intent,
        label: spec.label,
        query: spec.query,
        namedYou: false,
        yourRank: null,
        competitors: [],
        reasoning: "",
      });
      continue;
    }
    totalAnswered += 1;

    // BRAND: a verdict ON the store, not a list of rivals.
    if (spec.intent === "BRAND") {
      const { verdict, why, alternatives } = parseVerdict(text, p);
      const endorsed = verdict === "RECOMMENDED";
      if (endorsed) timesNamed += 1;
      const perQuery: CompetitorMention[] = [];
      for (const name of alternatives) {
        const key = normBrand(name);
        if (!key) continue;
        perQuery.push({ name, count: 1 });
        const prev = competitorCounts.get(key);
        if (prev) prev.count += 1;
        else competitorCounts.set(key, { name, count: 1 });
      }
      queries.push({
        intent: spec.intent,
        label: spec.label,
        query: spec.query,
        namedYou: endorsed,
        yourRank: null,
        competitors: perQuery,
        reasoning: why,
        verdict,
      });
      continue;
    }

    // Discovery / alternatives / trust / comparison: a ranked list of stores.
    const brands = parseBrands(text);
    const { named, rank } = mentionsStore(p, text, brands, false);
    if (named) timesNamed += 1;

    const perQuery: CompetitorMention[] = [];
    for (const b of brands) {
      const key = normBrand(b);
      if (!key || aliasNorms.some((a) => key.includes(a) || a.includes(key))) continue;
      perQuery.push({ name: b, count: 1 });
      const prev = competitorCounts.get(key);
      if (prev) prev.count += 1;
      else competitorCounts.set(key, { name: b, count: 1 });
    }

    queries.push({
      intent: spec.intent,
      label: spec.label,
      query: spec.query,
      namedYou: named,
      yourRank: rank,
      competitors: perQuery.slice(0, 4),
      reasoning: firstSentences(text),
    });
  }

  const topCompetitors = [...competitorCounts.values()].sort((a, b) => b.count - a.count).slice(0, 6);

  return { live: totalAnswered > 0, queries, topCompetitors, timesNamed, totalAnswered };
}

/* ───────────────────────── Scoring ───────────────────────── */

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreStore(p: StoreProfile, bt: BuyerTest): Scores {
  const s = p.signals;

  // AI assistants: anchored to the real mention rate, with a small floor so a
  // brand-new store isn't a flat zero (it still exists on the web).
  const mentionRate = bt.totalAnswered > 0 ? bt.timesNamed / bt.totalAnswered : 0;
  const aiScore = clamp(28 + mentionRate * 64 + (s.hasProductSchema ? 4 : 0) + (s.hasLlmsTxt ? 4 : 0));

  // Google visibility: on-page SEO signals we can actually observe.
  const googlePts =
    (s.hasTitle ? 18 : 0) +
    (s.hasMetaDescription ? 20 : 0) +
    (s.hasJsonLd ? 18 : 0) +
    (s.hasSitemap ? 22 : 0) +
    (s.hasProductSchema ? 12 : 0) +
    10; // baseline for being a reachable, indexable site
  const googleScore = clamp(googlePts);

  // Agent readiness: six concrete checks.
  const checks: AgentCheck[] = [
    { label: "AI crawlers allowed", ok: s.aiCrawlersAllowed },
    { label: "Products machine-readable", ok: s.hasProductSchema },
    { label: "Price & availability structured", ok: s.hasOfferSchema },
    { label: "Agent-readable catalogue", ok: p.isShopify || s.hasProductSchema },
    { label: "llms.txt manifest", ok: s.hasLlmsTxt },
    { label: "Agentic checkout rails", ok: false }, // honest: nobody has this yet
  ];
  const agentScore = clamp((checks.filter((c) => c.ok).length / checks.length) * 100);

  const overall = clamp(aiScore * 0.45 + googleScore * 0.3 + agentScore * 0.25);

  const aiVerdict =
    mentionRate === 0
      ? "AI assistants are not naming your store when buyers ask."
      : mentionRate < 0.5
        ? "You surface occasionally, but competitors are named far more often."
        : "You hold your own, but you're sharing the answer with competitors.";

  return {
    overall,
    google: {
      score: googleScore,
      verdict: s.hasSitemap
        ? "Indexable and structured, with room to strengthen rich results."
        : "Missing core SEO signals that help Google understand your store.",
    },
    ai: {
      score: aiScore,
      verdict: aiVerdict,
      assistants: [
        { assistant: "ChatGPT", mentions: bt.timesNamed, wired: true },
        { assistant: "Perplexity", mentions: 0, wired: false },
        { assistant: "Google AI", mentions: 0, wired: false },
      ],
    },
    agentReadiness: {
      score: agentScore,
      verdict:
        agentScore < 50
          ? "Shopping agents can't reliably read, compare, or transact with your store."
          : "Largely agent-readable, with a few gaps left to close.",
      checks,
    },
  };
}

/* ───────────────────────── Competitors + fixes ───────────────────────── */

function competitorCards(bt: BuyerTest, storeScore: number): CompetitorCard[] {
  return bt.topCompetitors.slice(0, 4).map((c, i) => ({
    name: c.name,
    domain: null,
    // Leaders that the AI keeps naming sit above the store; spread them by rank.
    score: clamp(Math.max(storeScore + 8, 72) + (bt.topCompetitors.length - i) * 2),
    mentions: c.count,
    advantages: [
      "Schema-marked product catalogue (you don't have one)",
      "Buying guides that ChatGPT cites (you have 0)",
      "Reviews structured for AI parsing",
      "Clear comparison pages for high-intent queries",
    ],
  }));
}

const TOP = (bt: BuyerTest) => bt.topCompetitors[0]?.name ?? "your competitors";

function deriveFixes(p: StoreProfile, bt: BuyerTest, scores: Scores): Fix[] {
  const s = p.signals;
  const top = TOP(bt);
  const missCount = bt.queries.filter((q) => !q.namedYou && q.competitors.length > 0).length;
  const fixes: Fix[] = [];

  if (scores.ai.score < 60 || missCount >= 2) {
    fixes.push({
      id: "buying_guide",
      type: "buying_guide",
      severity: "CRITICAL",
      channel: "AI",
      outcome: "Win the AI comparison queries",
      impact: "+22 PTS",
      impactPts: 22,
      explanation: `AI named ${top} instead of you in ${missCount || "several"} of 5 buyer answers. A category buying guide written in ${p.name}'s voice gives ChatGPT a reason to cite you for these exact queries.`,
    });
  }
  if (!s.aiCrawlersAllowed) {
    fixes.push({
      id: "ai_crawlers_allowed",
      type: "ai_crawlers_allowed",
      severity: "CRITICAL",
      channel: "AI",
      outcome: "Allow AI agents to crawl your store",
      impact: "+18 PTS",
      impactPts: 18,
      explanation: `Your robots rules are blocking the assistants buyers use. While they're shut out, ${top} gets recommended in your place.`,
    });
  }
  if (!s.hasProductSchema) {
    fixes.push({
      id: "schema_missing",
      type: "schema_missing",
      severity: "HIGH",
      channel: "AI",
      outcome: "Make your products machine-readable",
      impact: "+15 PTS",
      impactPts: 15,
      explanation: `Your products aren't structured for AI to read prices, availability, or specs — so ${p.name} can't be compared the way ${top} can.`,
    });
  }
  if (!s.hasLlmsTxt) {
    fixes.push({
      id: "llms_txt",
      type: "llms_txt",
      severity: "HIGH",
      channel: "AGENT",
      outcome: "Open your store to AI shoppers",
      impact: "+12 PTS",
      impactPts: 12,
      explanation: `There's no manifest telling AI shopping agents what ${p.name} sells and how to buy. Category leaders publish one; you don't yet.`,
    });
  }
  if (!s.hasFaqSchema) {
    fixes.push({
      id: "faq_schema",
      type: "faq_schema",
      severity: "MEDIUM",
      channel: "CONTENT",
      outcome: "Answer the questions AI assistants ask",
      impact: "+8 PTS",
      impactPts: 8,
      explanation: `Buyers ask AI about sizing, shipping, and returns. Structured answers on ${p.name}'s pages let the assistant quote you directly.`,
    });
  }
  fixes.push({
    id: "comparison_page",
    type: "comparison_page",
    severity: "MEDIUM",
    channel: "CONTENT",
    outcome: "Become the answer when buyers compare",
    impact: "+10 PTS",
    impactPts: 10,
    explanation: `For "${p.name} alternatives" and best-value queries, give the AI an honest comparison that puts ${p.name} in the consideration set with ${top}.`,
  });
  if (!s.hasSitemap) {
    fixes.push({
      id: "product_feed",
      type: "product_feed",
      severity: "MEDIUM",
      channel: "GOOGLE",
      outcome: "Connect your catalogue to AI shopping feeds",
      impact: "+9 PTS",
      impactPts: 9,
      explanation: `Without a sitemap/feed, search and AI shopping surfaces can't discover your full catalogue the way they discover ${top}'s.`,
    });
  }

  return fixes.sort((a, b) => b.impactPts - a.impactPts);
}

/* ───────────────────────── Shock + assembly ───────────────────────── */

function buildShock(p: StoreProfile, bt: BuyerTest): Shock {
  // Prefer a query where you were NOT named but competitors were — the painful one.
  const painful =
    bt.queries.find((q) => !q.namedYou && q.competitors.length >= 2) ??
    bt.queries.find((q) => q.competitors.length >= 1) ??
    bt.queries[0];

  const competitorTimesNamed = bt.topCompetitors.reduce((sum, c) => sum + c.count, 0);
  const variant: Shock["headlineVariant"] = bt.timesNamed === 0 ? "zero" : bt.timesNamed <= 2 ? "few" : "some";

  return {
    headlineVariant: variant,
    queryAsked: painful?.query ?? `What are the best places to buy from ${p.name}?`,
    competitorsNamed: (painful?.competitors ?? []).slice(0, 3).map((c) => c.name),
    reasoning: painful?.reasoning ?? "",
    namedYou: painful?.namedYou ?? false,
    queriesTested: bt.queries.length,
    timesNamed: bt.timesNamed,
    competitorTimesNamed,
  };
}

/** Live Google-presence check via web search — real, grounded, fails soft. */
export interface GoogleCheck {
  appears: boolean | null;
  position: number | null;
  topResults: string[];
}

async function runGoogleCheck(p: StoreProfile, ctx: StoreContext): Promise<GoogleCheck> {
  const client = openaiClient();
  if (!client) return { appears: null, position: null, topResults: [] };
  const loc = ctx.country ? ` in ${ctx.country}` : "";
  const instruction =
    `Use web search to check Google results for "best ${ctx.category}${loc}" and "${ctx.category} online store".\n` +
    `Looking at the top organic results, does ${p.name} (${p.host}) appear? Reply in EXACTLY this format:\n` +
    `PRESENT: <yes/no>\nPOSITION: <approx number or none>\nTOP: <the 5 stores that actually rank, comma-separated>`;
  try {
    const res = await withTimeout(
      client.responses.create({
        model: model(),
        instructions: "You audit Google search visibility. Use web search and report only what genuinely ranks — do not guess.",
        input: instruction,
        tools: [{ type: "web_search" }],
        max_output_tokens: 300,
      }),
      16_000,
    );
    const text = (res as { output_text?: string }).output_text ?? "";
    const present = /PRESENT:\s*yes/i.test(text) ? true : /PRESENT:\s*no/i.test(text) ? false : null;
    const posM = text.match(/POSITION:\s*(\d+)/i);
    const topM = text.match(/TOP:\s*(.+)/i);
    const topResults = topM
      ? topM[1].split(/[,;]/).map((s) => s.replace(/\.$/, "").trim()).filter((s) => s.length > 1 && s.length < 40).slice(0, 5)
      : [];
    return { appears: present, position: posM ? Number(posM[1]) : null, topResults };
  } catch {
    return { appears: null, position: null, topResults: [] };
  }
}

function googleSignals(p: StoreProfile, gc: GoogleCheck): GoogleSignals {
  return {
    indexedPages: null, // needs Google Search Console — honest null
    searchPresence: gc.appears ?? p.signals.hasSitemap,
    shopping: false,
    featuredSnippet: false,
    sitemap: p.signals.hasSitemap,
    metaDescription: p.signals.hasMetaDescription,
    appearsInSearch: gc.appears,
    searchPosition: gc.position,
    topResults: gc.topResults,
  };
}

export function newShareId(): string {
  return "c_" + randomBytes(8).toString("hex");
}

/**
 * Estimated €/month at risk (§6.3). Anchored to the real mention rate + fix
 * severity, with cap/floor logic so a 3-product store never sees an absurd
 * number and a completely invisible store never sees €0. Rounded to €10.
 */
function estimateMonthlyLoss(scores: Scores, bt: BuyerTest, fixes: Fix[]): number {
  const mentionRate = bt.totalAnswered > 0 ? bt.timesNamed / bt.totalAnswered : 0;
  const invisibility = 1 - mentionRate; // 0 (always named) → 1 (never named)
  const fixWeight = fixes.reduce((s, f) => s + f.impactPts, 0); // ~20–90
  const raw = invisibility * 320 + fixWeight * 3.2 + (100 - scores.overall) * 1.4;
  const capped = Math.max(40, Math.min(940, raw)); // floor €40, cap €940 (§6.3)
  return Math.round(capped / 10) * 10;
}

export async function runScan(input: string, onProgress?: OnScanProgress): Promise<CommerceReport> {
  const n = normalizeUrl(input);
  if (!n) throw new Error("Enter a valid store URL (e.g. your-store.com).");

  onProgress?.({ step: "fetch_store", label: `Fetching ${n.host} — catalog signals, robots.txt, sitemap, llms.txt`, status: "start" });
  const profile = await fetchStore(n);
  onProgress?.({ step: "fetch_store", label: `Store profile read — "${profile.name}"`, status: "ok" });

  const client = openaiClient();
  onProgress?.({ step: "infer_context", label: "Inferring product category + market", status: "start" });
  const ctx = await inferContext(client, profile);
  onProgress?.({ step: "infer_context", label: `Category: ${ctx.category}${ctx.country ? ` · ${ctx.country}` : ""}`, status: "ok" });

  const specs = buildQueries(profile, ctx);
  // Buyer test + Google-presence check run in parallel (both web-grounded).
  onProgress?.({ step: "google_check", label: "Checking Google organic presence", status: "start" });
  const [bt, googleCheck] = await Promise.all([
    runBuyerTest(profile, specs, ctx.category, onProgress),
    runGoogleCheck(profile, ctx).then((gc) => {
      onProgress?.({
        step: "google_check",
        label: gc.appears === null ? "Google check unavailable (degraded)" : gc.appears ? "Store appears in Google results" : "Store missing from Google top results",
        status: gc.appears === null ? "warn" : "ok",
      });
      return gc;
    }),
  ]);

  onProgress?.({ step: "score", label: "Scoring visibility across channels", status: "start" });
  const scores = scoreStore(profile, bt);
  onProgress?.({ step: "score", label: `Overall visibility ${scores.overall}/100`, status: "ok" });

  const fixes = deriveFixes(profile, bt, scores);
  onProgress?.({ step: "fixes", label: `${fixes.length} fixes derived, ranked by impact`, status: "ok" });

  return {
    shareId: newShareId(),
    url: profile.url,
    storeName: profile.name,
    category: ctx.category,
    country: ctx.country,
    live: bt.live,
    estimatedMonthlyLoss: estimateMonthlyLoss(scores, bt, fixes),
    shock: buildShock(profile, bt),
    scores,
    buyerQueries: bt.queries,
    competitors: competitorCards(bt, scores.overall),
    topCompetitor: bt.topCompetitors[0]?.name ?? null,
    googleSignals: googleSignals(profile, googleCheck),
    fixes,
    unlocked: false,
    createdAt: new Date().toISOString(),
  };
}
