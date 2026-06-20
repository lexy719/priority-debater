/**
 * Commerce audit engine — the second path.
 *
 * Scores how visible and "buyable" a store is to AI shopping agents
 * (ChatGPT / Claude / Gemini). Mirrors the discipline of
 * `src/lib/agents/idea-scoring-v2.ts` (one typed result object, deterministic
 * core) but carries NO OpenAI dependency: every number here is produced by a
 * seeded heuristic so the feature works with zero quota and returns stable
 * results for the same store on every run.
 *
 * The seam for a future LLM pass is marked `LLM ENRICHMENT` below — a later
 * model call can rewrite the prose fields (competitor `why`, fix `action`,
 * persona `reason`) without touching the scoring contract.
 */

import { fetchStoreProfile, type StoreSignals } from "@/lib/commerce/store-profile";
import { runBuyerTest, toBuyerTestPublic, type BuyerTestPublic } from "@/lib/commerce/buyer-test";
import { anyAgentConfigured } from "@/lib/commerce/shopping-agents";

export type Tone = "red" | "amber" | "blue" | "green";

export interface AuditSubScore {
  id: string;
  label: string;
  value: number;
  tone: Tone;
  sub: string;
}

export interface CompetitorRow {
  name: string;
  score: number;
  why: string;
  you?: boolean;
}

export interface ModelVisibility {
  name: string;
  cur: number;
  prev: number;
}

export interface MentionShare {
  n: string;
  v: number;
  tone: Tone;
  you?: boolean;
}

export interface ReadinessCheck {
  k: string;
  status: "pass" | "warn" | "fail";
}

export interface PersonaResult {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  prompt: string;
  winner: string;
  reason: string;
  you: number;
}

export interface FixRow {
  issue: string;
  action: string;
  impact: string;
}

export interface OffsiteAction {
  label: string;
  done: boolean;
  hint: string;
}

export interface OffsiteAuthority {
  score: number;
  reviewPlatform: string;
  hasBlog: boolean;
  reviewsMarkedUp: boolean;
  socialCount: number;
  actions: OffsiteAction[];
}

export interface CommerceAuditReport {
  url: string;
  host: string;
  generatedAt: string;
  /** true for the default/no-input demo report shown before a real audit. */
  demo: boolean;
  /** Real store identity read from the live homepage. */
  storeName: string;
  category: string;
  reachable: boolean;
  /** We fetched and parsed the real store (technical signals are live). */
  signalsLive: boolean;
  /** Real AI assistants actually answered the buyer queries. */
  buyerTestLive: boolean;
  buyerTest: BuyerTestPublic;
  offsite: OffsiteAuthority;
  overall: number;
  categoryMedian: number;
  verdict: string;
  verdictTone: Tone;
  confidence: "low" | "medium" | "high";
  rankLabel: string;
  stages: { label: string; reached: boolean }[];
  subScores: AuditSubScore[];
  competitors: CompetitorRow[];
  trend: { m: string; v: number }[];
  perModel: ModelVisibility[];
  competitorMovement: { n: string; d: number }[];
  mentionShare: MentionShare[];
  competitorReasons: { r: string; weight: "high" | "med" | "low" }[];
  feedStatus: { l: string; v: string; tone: Tone }[];
  feedExampleJson: string;
  readiness: ReadinessCheck[];
  personas: PersonaResult[];
  fixes: FixRow[];
}

/* ---------------- deterministic helpers ---------------- */

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, seedable PRNG so a host always scores the same. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

export function toneFor(value: number): Tone {
  if (value < 50) return "red";
  if (value < 65) return "amber";
  if (value < 80) return "blue";
  return "green";
}

export function normalizeUrl(raw: string): { url: string; host: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProto);
    if (!u.hostname.includes(".")) return null;
    return { url: u.toString(), host: u.hostname.replace(/^www\./, "") };
  } catch {
    return null;
  }
}

/* ---------------- content pools (LLM ENRICHMENT can replace these) -------- */

const COMPETITOR_POOL = [
  { name: "Caffè Nord", why: "Buying guides + rich schema" },
  { name: "GrindLab", why: "1.2k reviews + comparison tables" },
  { name: "EspressoHQ", why: "FAQ + spec sheets" },
  { name: "BeanWorks", why: "Thin product pages" },
  { name: "NorthRoast", why: "Strong collection hubs" },
  { name: "DialedIn", why: "Cited by industry blogs" },
];

const REASON_POOL: { r: string; weight: "high" | "med" | "low" }[] = [
  { r: "More reviews indexed", weight: "high" },
  { r: "Better product schema", weight: "high" },
  { r: "Comparison + buying guides", weight: "med" },
  { r: "Cited by industry blogs", weight: "med" },
  { r: "Faster shipping signal", weight: "low" },
];

const READINESS_KEYS = [
  "llms.txt",
  "Product schema",
  "Merchant feed",
  "Reviews indexed",
  "FAQs structured",
  "Shipping policy",
  "Return policy",
  "Agent checkout",
];

const FIX_POOL: FixRow[] = [
  { issue: "Missing FAQ schema", action: "Generate FAQ Schema", impact: "+8 GEO" },
  { issue: "Weak category page", action: "Generate Optimized Category Page", impact: "+5 AI Rec" },
  { issue: "No buying guide", action: "Generate Buying Guide", impact: "+11 Mentions" },
  { issue: "Catalog not agent-readable", action: "Regenerate Shopping Feed", impact: "+14 Agent" },
  { issue: "llms.txt not found", action: "Generate llms.txt", impact: "+6 Crawl" },
  { issue: "Thin comparison content", action: "Generate Comparison Page", impact: "+9 Mentions" },
];

const PERSONA_DEFS = [
  {
    id: "budget",
    name: "Budget Shopper",
    emoji: "🪙",
    blurb: "Cheapest acceptable. Hates fluff.",
    prompt: "Find me a decent option under €150.",
    reason: "Listed price band + clear specs. You buried price under variants.",
  },
  {
    id: "premium",
    name: "Premium Shopper",
    emoji: "💎",
    blurb: "Quality first. Brand-aware.",
    prompt: "What's the best premium option under €700?",
    reason: "Strong buying guide + detail the model could cite.",
  },
  {
    id: "gift",
    name: "Gift Buyer",
    emoji: "🎁",
    blurb: "Buying for someone else. Needs reassurance.",
    prompt: "A nice starter gift for my partner under €250.",
    reason: "Gift bundles + return policy structured for agents.",
  },
  {
    id: "researcher",
    name: "Researcher",
    emoji: "🧪",
    blurb: "Specs, charts, evidence.",
    prompt: "Compare specs and trade-offs across the top options.",
    reason: "Spec tables + JSON-LD reviewed by the panel.",
  },
  {
    id: "impulse",
    name: "Impulse Buyer",
    emoji: "⚡",
    blurb: "Sees, wants, clicks.",
    prompt: "What's something great I can buy right now?",
    reason: "Hero imagery + 1-line story. Your PDP starts with shipping.",
  },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

/* ---------------- real-signal derivation ---------------- */

function schemaCoveragePct(s: StoreSignals): number {
  const checks = [s.productJsonLd, s.offerJsonLd, s.organizationJsonLd, s.faqJsonLd, s.breadcrumbJsonLd, s.aggregateRating];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function contentGeoPct(s: StoreSignals): number {
  const checks = [s.faqJsonLd, s.organizationJsonLd, s.llmsTxt, s.metaDescription, s.ogTags, s.aggregateRating];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function deriveReadiness(s: StoreSignals): ReadinessCheck[] {
  const yn = (b: boolean): "pass" | "fail" => (b ? "pass" : "fail");
  return [
    { k: "llms.txt", status: yn(s.llmsTxt) },
    { k: "Product schema (JSON-LD)", status: yn(s.productJsonLd) },
    { k: "Offer / price schema", status: yn(s.offerJsonLd) },
    { k: "Organization schema", status: yn(s.organizationJsonLd) },
    { k: "FAQ schema", status: yn(s.faqJsonLd) },
    { k: "Review markup", status: s.aggregateRating ? "pass" : "warn" },
    { k: "Sitemap", status: s.sitemap ? "pass" : "warn" },
    { k: "Open Graph / meta", status: s.ogTags && s.metaDescription ? "pass" : "warn" },
  ];
}

function readinessScore(checks: ReadinessCheck[]): number {
  const v = (st: ReadinessCheck["status"]) => (st === "pass" ? 1 : st === "warn" ? 0.5 : 0);
  return Math.round((checks.reduce((a, c) => a + v(c.status), 0) / checks.length) * 100);
}

function deriveFeedStatus(s: StoreSignals): { l: string; v: string; tone: Tone }[] {
  const platform = s.platform === "unknown" ? "Custom / unknown" : s.platform;
  const schema = schemaCoveragePct(s);
  return [
    { l: "Platform detected", v: platform, tone: "blue" },
    { l: "Schema coverage", v: `${schema}%`, tone: toneFor(schema) },
    { l: "llms.txt", v: s.llmsTxt ? "Found" : "Missing", tone: s.llmsTxt ? "green" : "red" },
    { l: "Product feed", v: s.productFeed ? "Found" : "Missing", tone: s.productFeed ? "green" : "amber" },
  ];
}

function deriveFixes(s: StoreSignals, buyerTestLive: boolean, totalRuns: number, mentionedRuns: number): FixRow[] {
  const fixes: FixRow[] = [];
  if (!s.llmsTxt) fixes.push({ issue: "No llms.txt — AI crawlers have no manifest of what you sell", action: "Generate llms.txt", impact: "Crawlability" });
  if (!s.productJsonLd) fixes.push({ issue: "Products have no JSON-LD schema", action: "Generate product schema", impact: "AI recommendation" });
  if (!s.offerJsonLd) fixes.push({ issue: "Price / availability not machine-readable", action: "Add Offer schema", impact: "Agent readiness" });
  if (!s.faqJsonLd) fixes.push({ issue: "No FAQ schema for buyer questions", action: "Generate FAQ schema", impact: "GEO" });
  if (!s.aggregateRating) fixes.push({ issue: "Reviews aren't machine-readable", action: "Add review (AggregateRating) markup", impact: "Trust signal" });
  if (!s.organizationJsonLd) fixes.push({ issue: "No Organization schema — AI can't identify your brand", action: "Generate Organization schema", impact: "Identity" });
  if (!s.productFeed) fixes.push({ issue: "No agent-readable product feed", action: "Generate shopping feed", impact: "Agent readiness" });
  if (buyerTestLive && mentionedRuns < totalRuns) {
    fixes.unshift({ issue: `AI named a competitor instead of you in ${totalRuns - mentionedRuns} of ${totalRuns} answers`, action: "Generate comparison + buying guide", impact: "Mentions" });
  }
  if (fixes.length === 0) fixes.push({ issue: "Strong technical base — now build citable content", action: "Generate buying guide", impact: "Mentions" });
  return fixes.slice(0, 6);
}

function realCompetitors(top: { name: string; count: number }[], overall: number, totalRuns: number): CompetitorRow[] {
  const rows: CompetitorRow[] = top.slice(0, 4).map((c) => ({
    name: c.name,
    score: clamp(40 + Math.round((c.count / Math.max(1, totalRuns)) * 55)),
    why: `Recommended by AI in ${c.count} of ${totalRuns} answers`,
  }));
  rows.push({ name: "Your Store", score: overall, why: "How often AI recommends you", you: true });
  return rows.sort((a, b) => b.score - a.score);
}

function realMentionShare(top: { name: string; count: number }[], mentionedRuns: number, storeName: string): MentionShare[] {
  const entries = top.slice(0, 3).map((c) => ({ n: c.name, count: c.count }));
  entries.push({ n: storeName, count: mentionedRuns });
  const total = Math.max(1, entries.reduce((a, e) => a + e.count, 0));
  const tones: Tone[] = ["red", "amber", "blue", "green"];
  return entries.map((e, i) => ({
    n: i === entries.length - 1 ? `Your Store — ${e.n}` : `Competitor ${String.fromCharCode(65 + i)} — ${e.n}`,
    v: Math.round((e.count / total) * 100),
    tone: tones[i] ?? "blue",
    you: i === entries.length - 1,
  }));
}

/**
 * Honest competitor placeholders for the non-live (no-AI-credit) state. We never
 * invent real-sounding brand names for a store we haven't actually tested — that
 * would be fabrication. Real rivals only appear once the live buyer test runs.
 */
function genericCompetitors(overall: number): CompetitorRow[] {
  const rows: CompetitorRow[] = [
    { name: "Competitor A", score: clamp(overall + 18), why: "Stronger AI visibility" },
    { name: "Competitor B", score: clamp(overall + 11), why: "More structured data" },
    { name: "Competitor C", score: clamp(overall + 5), why: "Better buying-guide content" },
    { name: "Your Store", score: overall, why: "Run the live test to reveal real rivals", you: true },
  ];
  return rows.sort((a, b) => b.score - a.score);
}

function genericMentionShare(storeName: string): MentionShare[] {
  return [
    { n: "Competitor A", v: 38, tone: "red" },
    { n: "Competitor B", v: 27, tone: "amber" },
    { n: "Competitor C", v: 16, tone: "blue" },
    { n: `Your Store — ${storeName}`, v: 12, tone: "green", you: true },
  ];
}

function simulatedBuyerTest(category: string, mentionRate: number): BuyerTestPublic {
  const labels = ["Best overall", "Budget buyer", "Premium buyer", "Trust & shipping"];
  const emojis = ["🛒", "🪙", "💎", "🚚"];
  const queries = [
    `What are the best online stores to buy ${category} from?`,
    `I'm on a budget — which ${category} brand should I buy from?`,
    `I want the best premium ${category} — what store do you recommend?`,
    `Recommend a trustworthy online shop for ${category}.`,
  ].map((query, i) => ({
    query,
    label: labels[i],
    emoji: emojis[i],
    topBrand: "—",
    youMentioned: false,
    agentLines: [],
  }));
  return {
    live: false,
    agentsUsed: [],
    mentionRate,
    mentionedRuns: 0,
    totalRuns: 0,
    topCompetitors: [],
    queries,
  };
}

function deriveOffsite(s: StoreSignals, socialCount: number): OffsiteAuthority {
  const reviewsMarkedUp = s.aggregateRating;
  const score = clamp(
    10 +
      (s.reviewPlatform ? 30 : 0) +
      (reviewsMarkedUp ? 25 : 0) +
      (s.hasBlog ? 20 : 0) +
      (socialCount >= 2 ? 15 : socialCount === 1 ? 7 : 0),
  );
  return {
    score,
    reviewPlatform: s.reviewPlatform,
    hasBlog: s.hasBlog,
    reviewsMarkedUp,
    socialCount,
    actions: [
      {
        label: s.reviewPlatform ? `Collecting reviews via ${s.reviewPlatform}` : "Install a review platform (Judge.me, Trustpilot…)",
        done: Boolean(s.reviewPlatform),
        hint: "Review volume is a top driver of AI recommendation.",
      },
      { label: "Reviews machine-readable (AggregateRating)", done: reviewsMarkedUp, hint: "Lets AI quote your star rating." },
      { label: "Publishing citable content (blog / guides)", done: s.hasBlog, hint: "Long-form content is what answer engines quote." },
      { label: "Active social / community presence", done: socialCount >= 2, hint: "AI cross-references brand presence across the web." },
      { label: "Cited in 'best of' roundups", done: false, hint: "Use the outreach email in the Toolkit to get listed." },
    ],
  };
}

function defaultOffsite(): OffsiteAuthority {
  return {
    score: 0,
    reviewPlatform: "",
    hasBlog: false,
    reviewsMarkedUp: false,
    socialCount: 0,
    actions: [
      { label: "Install a review platform (Judge.me, Trustpilot…)", done: false, hint: "Review volume is a top driver of AI recommendation." },
      { label: "Reviews machine-readable (AggregateRating)", done: false, hint: "Lets AI quote your star rating." },
      { label: "Publishing citable content (blog / guides)", done: false, hint: "Long-form content is what answer engines quote." },
      { label: "Active social / community presence", done: false, hint: "AI cross-references brand presence across the web." },
      { label: "Cited in 'best of' roundups", done: false, hint: "Use the outreach email in the Toolkit to get listed." },
    ],
  };
}

/* ---------------- the scorer ---------------- */

export interface AuditInput {
  url: string;
}

/**
 * Compose a real audit: read the live store (keyless technical signals) and run
 * the live multi-model buyer test. Falls back, clearly flagged, to deterministic
 * simulation when the store is unreachable or no AI provider answers.
 */
export async function auditStore({ url }: AuditInput): Promise<CommerceAuditReport> {
  const normalized = normalizeUrl(url) ?? { url, host: url };
  const base = buildReport(normalized.url, normalized.host, false);

  // 1) Read the real store — always-on, no API key needed.
  const profile = await fetchStoreProfile(normalized.url, normalized.host).catch(() => null);
  if (!profile || !profile.reachable) {
    const category = profile?.category ?? base.category;
    return {
      ...base,
      storeName: profile?.name ?? base.storeName,
      category,
      reachable: false,
      signalsLive: false,
      buyerTestLive: false,
      buyerTest: simulatedBuyerTest(category, base.subScores[0].value),
      competitors: genericCompetitors(base.overall),
      mentionShare: genericMentionShare(profile?.name ?? base.storeName),
    };
  }

  const s = profile.signals;
  const schema = schemaCoveragePct(s);
  const geo = contentGeoPct(s);
  const readiness = deriveReadiness(s);
  const agentReadiness = readinessScore(readiness);
  const feedStatus = deriveFeedStatus(s);

  // 2) Live AI buyer test — only when at least one provider key is configured.
  const buyerResult = anyAgentConfigured() ? await runBuyerTest(profile).catch(() => null) : null;
  const live = Boolean(buyerResult?.live);
  const aiRec = live ? buyerResult!.mentionRate : base.subScores[0].value;

  const overall = clamp(0.4 * aiRec + 0.25 * agentReadiness + 0.2 * schema + 0.15 * geo);
  const categoryMedian = clamp(overall + 9);

  const subScores: AuditSubScore[] = [
    {
      id: "ai_rec",
      label: "AI Recommendation",
      value: clamp(aiRec),
      tone: toneFor(aiRec),
      sub: live
        ? `Named in ${buyerResult!.mentionedRuns}/${buyerResult!.totalRuns} live AI answers.`
        : "Simulated — add an AI key for a live test.",
    },
    { id: "geo", label: "GEO", value: clamp(geo), tone: toneFor(geo), sub: "Content + entities AI engines can cite." },
    { id: "agent", label: "Agent Readiness", value: clamp(agentReadiness), tone: toneFor(agentReadiness), sub: "Schema, feed & llms.txt agents need to buy." },
    { id: "schema", label: "Schema Coverage", value: clamp(schema), tone: toneFor(schema), sub: `${s.jsonLdTypes.length} structured-data types found.` },
  ];

  const hasComps = live && buyerResult!.topCompetitors.length > 0;
  const buyerTest = live ? toBuyerTestPublic(buyerResult!) : simulatedBuyerTest(profile.category, aiRec);
  const competitors = hasComps
    ? realCompetitors(buyerResult!.topCompetitors, overall, buyerResult!.totalRuns)
    : genericCompetitors(overall);
  const mentionShare = hasComps
    ? realMentionShare(buyerResult!.topCompetitors, buyerResult!.mentionedRuns, profile.name)
    : genericMentionShare(profile.name);
  const fixes = deriveFixes(s, live, buyerResult?.totalRuns ?? 0, buyerResult?.mentionedRuns ?? 0);

  const verdict = overall >= 65 ? "Scale with confidence" : overall >= 50 ? "Fix before scaling" : "Critical gaps — start here";
  const verdictTone: Tone = overall >= 65 ? "green" : overall >= 50 ? "amber" : "red";
  const percentile = clamp(100 - overall, 5, 95);
  const rankLabel = overall >= 60 ? `TOP ${percentile}%` : `BOTTOM ${percentile}%`;
  const stages = ["Crawl", "Index", "Mention", "Convert"].map((label, i) => ({ label, reached: overall > i * 22 + 10 }));

  const feedExampleJson = JSON.stringify(
    {
      store: profile.name,
      url: profile.url,
      category: profile.category,
      product: "Example product",
      sku: "SKU-001",
      price: { amount: 0, currency: "EUR" },
      availability: "in_stock",
      use_cases: ["primary use case", "secondary use case"],
      buyer_personas: ["enthusiast", "first-time buyer"],
      agent_actions: ["add_to_cart", "compare", "reserve"],
    },
    null,
    2,
  );

  return {
    ...base,
    storeName: profile.name,
    category: profile.category,
    reachable: true,
    signalsLive: true,
    buyerTestLive: live,
    buyerTest,
    offsite: deriveOffsite(s, profile.socials.length),
    overall,
    categoryMedian,
    verdict,
    verdictTone,
    confidence: live ? "high" : "medium",
    rankLabel,
    stages,
    subScores,
    competitors,
    mentionShare,
    feedStatus,
    feedExampleJson,
    readiness,
    fixes,
  };
}

function buildReport(url: string, host: string, demo: boolean): CommerceAuditReport {
  const rng = makeRng(hashString(host));
  const pick = (lo: number, hi: number) => clamp(lo + rng() * (hi - lo));

  // Overall sits low-to-mid: the whole pitch is "you're behind, here's the gap".
  const overall = pick(38, 64);
  const categoryMedian = clamp(overall + pick(4, 14) - 0);

  const subScores: AuditSubScore[] = [
    { id: "ai_rec", label: "AI Recommendation", value: clamp(overall - pick(2, 10)), tone: "red", sub: "Models recommend competitors more often." },
    { id: "geo", label: "GEO", value: clamp(overall + pick(0, 8)), tone: "amber", sub: "Generative-engine optimization — partial coverage." },
    { id: "agent", label: "Agent Readiness", value: clamp(overall - pick(0, 6)), tone: "amber", sub: "Catalog is browsable, not buyable by agents." },
    { id: "schema", label: "Schema Coverage", value: clamp(overall + pick(6, 16)), tone: "blue", sub: "Structured data present but incomplete." },
  ].map((s) => ({ ...s, tone: toneFor(s.value) }));

  // Competitors: top of the pool beats you, tail trails you.
  const compCount = 4;
  const chosen = COMPETITOR_POOL.slice(0, compCount);
  const competitors: CompetitorRow[] = chosen.map((c, i) => ({
    name: c.name,
    why: c.why,
    score: clamp(overall + pick(8, 26) - i * pick(4, 9)),
  }));
  competitors.push({ name: "You", score: overall, why: "Sparse metadata, no buying guide", you: true });
  competitors.sort((a, b) => b.score - a.score);

  // Monitor: six-month climb that lands a few points above today's overall.
  const start = clamp(overall - pick(8, 16));
  const trend = MONTHS.map((m, i) => ({
    m,
    v: clamp(start + (i / (MONTHS.length - 1)) * pick(14, 26) + rng() * 4 - 2),
  }));

  const perModel: ModelVisibility[] = ["ChatGPT", "Claude", "Gemini"].map((name) => {
    const cur = clamp(overall + pick(6, 22));
    return { name, cur, prev: clamp(cur - pick(8, 16)) };
  });

  const competitorMovement = chosen.slice(0, 3).map((c) => ({
    n: c.name,
    d: Math.round((rng() - 0.45) * 12),
  }));

  // Mention share: competitors lead, you trail.
  const rawShares = [pick(34, 50), pick(18, 30), pick(10, 18), clamp(overall / 4)];
  const labels = [`Competitor A — ${chosen[0].name}`, `Competitor B — ${chosen[1].name}`, `Competitor C — ${chosen[2].name}`, "Your Store"];
  const mentionShare: MentionShare[] = rawShares.map((v, i) => ({
    n: labels[i],
    v: clamp(v),
    tone: (["red", "amber", "blue", "green"] as Tone[])[i],
    you: i === 3,
  }));

  const competitorReasons = REASON_POOL;

  const feedTotal = 800 + Math.round(rng() * 900);
  const schemaCoverage = subScores[3].value;
  const agentReady = Math.round((feedTotal * schemaCoverage) / 100);
  const feedStatus = [
    { l: "Products scanned", v: feedTotal.toLocaleString(), tone: "blue" as Tone },
    { l: "Schema coverage", v: `${schemaCoverage}%`, tone: toneFor(schemaCoverage) },
    { l: "Agent-ready SKUs", v: `${agentReady.toLocaleString()} / ${feedTotal.toLocaleString()}`, tone: "red" as Tone },
    { l: "Feed format", v: "JSON-LD + LLMS.txt", tone: "green" as Tone },
  ];

  const feedExampleJson = JSON.stringify(
    {
      store: host,
      product: "Example product",
      sku: "SKU-001",
      price: { amount: 0, currency: "EUR" },
      availability: "in_stock",
      use_cases: ["primary use case", "secondary use case"],
      buyer_personas: ["enthusiast", "first-time buyer"],
      agent_actions: ["add_to_cart", "compare", "reserve"],
    },
    null,
    2,
  );

  // Readiness: gate each check off the relevant sub-score with some jitter.
  const readiness: ReadinessCheck[] = READINESS_KEYS.map((k) => {
    const roll = rng() * 100 * 0.4 + overall * 0.6;
    return { k, status: roll > 68 ? "pass" : roll > 48 ? "warn" : "fail" };
  });

  // Buyer simulation: ~2 of 5 personas should pick you when overall is mid.
  const winnerNames = [chosen[0].name, chosen[1].name, chosen[2].name];
  const personas: PersonaResult[] = PERSONA_DEFS.map((p, i) => {
    const you = clamp(overall + (rng() - 0.5) * 50);
    const youWins = you >= 60;
    return {
      ...p,
      you,
      winner: youWins ? "Your Store" : winnerNames[i % winnerNames.length],
      reason: p.reason,
    };
  });

  const verdict = overall >= 65 ? "Scale with confidence" : overall >= 50 ? "Fix before scaling" : "Critical gaps — start here";
  const verdictTone: Tone = overall >= 65 ? "green" : overall >= 50 ? "amber" : "red";
  const percentile = clamp(100 - overall, 5, 95);
  const rankLabel = overall >= 60 ? `TOP ${percentile}%` : `BOTTOM ${percentile}%`;

  const stages = ["Crawl", "Index", "Mention", "Convert"].map((label, i) => ({
    label,
    reached: overall > i * 22 + 10,
  }));

  const buyerTest = simulatedBuyerTest("online retail", subScores[0].value);

  return {
    url,
    host,
    generatedAt: new Date().toISOString(),
    demo,
    storeName: host.replace(/^www\./, ""),
    category: "online retail",
    reachable: false,
    signalsLive: false,
    buyerTestLive: false,
    buyerTest,
    offsite: defaultOffsite(),
    overall,
    categoryMedian,
    verdict,
    verdictTone,
    confidence: overall < 45 || overall > 70 ? "high" : "medium",
    rankLabel,
    stages,
    subScores,
    competitors,
    trend,
    perModel,
    competitorMovement,
    mentionShare,
    competitorReasons,
    feedStatus,
    feedExampleJson,
    readiness,
    personas,
    fixes: FIX_POOL,
  };
}

/**
 * Canonical demo report — the exact numbers from the original prototype, shown
 * before any real audit is run (labelled "DEMO" in the UI). Keeping these fixed
 * means first-load visuals match the approved design pixel-for-pixel.
 */
export const DEMO_REPORT: CommerceAuditReport = {
  url: "https://your-store.com",
  host: "your-store.com",
  generatedAt: "1970-01-01T00:00:00.000Z",
  demo: true,
  storeName: "your-store.com",
  category: "online retail",
  reachable: false,
  signalsLive: false,
  buyerTestLive: false,
  buyerTest: {
    live: false,
    agentsUsed: [],
    mentionRate: 12,
    mentionedRuns: 0,
    totalRuns: 0,
    topCompetitors: [
      { name: "Caffè Nord", count: 4 },
      { name: "GrindLab", count: 3 },
      { name: "EspressoHQ", count: 2 },
    ],
    queries: [
      { query: "What are the best online stores to buy specialty coffee gear from?", label: "Best overall", emoji: "🛒", topBrand: "Caffè Nord", youMentioned: false, agentLines: [] },
      { query: "I'm on a budget — which espresso grinder shop should I buy from?", label: "Budget buyer", emoji: "🪙", topBrand: "GrindLab", youMentioned: false, agentLines: [] },
      { query: "I want the best premium grinder — what store do you recommend?", label: "Premium buyer", emoji: "💎", topBrand: "Caffè Nord", youMentioned: false, agentLines: [] },
      { query: "Recommend a trustworthy coffee-gear shop with fast shipping.", label: "Trust & shipping", emoji: "🚚", topBrand: "EspressoHQ", youMentioned: false, agentLines: [] },
    ],
  },
  offsite: {
    score: 35,
    reviewPlatform: "",
    hasBlog: true,
    reviewsMarkedUp: false,
    socialCount: 2,
    actions: [
      { label: "Install a review platform (Judge.me, Trustpilot…)", done: false, hint: "Review volume is a top driver of AI recommendation." },
      { label: "Reviews machine-readable (AggregateRating)", done: false, hint: "Lets AI quote your star rating." },
      { label: "Publishing citable content (blog / guides)", done: true, hint: "Long-form content is what answer engines quote." },
      { label: "Active social / community presence", done: true, hint: "AI cross-references brand presence across the web." },
      { label: "Cited in 'best of' roundups", done: false, hint: "Use the outreach email in the Toolkit to get listed." },
    ],
  },
  overall: 47,
  categoryMedian: 56,
  verdict: "Fix before scaling",
  verdictTone: "amber",
  confidence: "high",
  rankLabel: "BOTTOM 38%",
  stages: [
    { label: "Crawl", reached: true },
    { label: "Index", reached: true },
    { label: "Mention", reached: false },
    { label: "Convert", reached: false },
  ],
  subScores: [
    { id: "ai_rec", label: "AI Recommendation", value: 42, tone: "red", sub: "Models recommend competitors 3× more often." },
    { id: "geo", label: "GEO", value: 52, tone: "amber", sub: "Generative-engine optimization — partial coverage." },
    { id: "agent", label: "Agent Readiness", value: 48, tone: "amber", sub: "Catalog is browsable, not buyable by agents." },
    { id: "schema", label: "Schema Coverage", value: 61, tone: "blue", sub: "Structured data present but incomplete." },
  ],
  competitors: [
    { name: "Caffè Nord", score: 78, why: "Buying guides + rich schema" },
    { name: "GrindLab", score: 71, why: "1.2k reviews + comparison tables" },
    { name: "EspressoHQ", score: 66, why: "FAQ + spec sheets" },
    { name: "You", score: 47, why: "Sparse metadata, no buying guide", you: true },
    { name: "BeanWorks", score: 39, why: "Thin product pages" },
  ],
  trend: [
    { m: "Jan", v: 41 },
    { m: "Feb", v: 44 },
    { m: "Mar", v: 49 },
    { m: "Apr", v: 54 },
    { m: "May", v: 58 },
    { m: "Jun", v: 67 },
  ],
  perModel: [
    { name: "ChatGPT", cur: 71, prev: 58 },
    { name: "Claude", cur: 64, prev: 51 },
    { name: "Gemini", cur: 66, prev: 53 },
  ],
  competitorMovement: [
    { n: "GrindLab", d: 6 },
    { n: "Caffè Nord", d: 2 },
    { n: "EspressoHQ", d: -3 },
  ],
  mentionShare: [
    { n: "Competitor A — Caffè Nord", v: 46, tone: "red" },
    { n: "Competitor B — GrindLab", v: 28, tone: "amber" },
    { n: "Competitor C — EspressoHQ", v: 14, tone: "blue" },
    { n: "Your Store", v: 12, tone: "green", you: true },
  ],
  competitorReasons: REASON_POOL,
  feedStatus: [
    { l: "Products scanned", v: "1,284", tone: "blue" },
    { l: "Schema coverage", v: "61%", tone: "amber" },
    { l: "Agent-ready SKUs", v: "742 / 1,284", tone: "red" },
    { l: "Feed format", v: "JSON-LD + LLMS.txt", tone: "green" },
  ],
  feedExampleJson: JSON.stringify(
    {
      product: "Niche Zero — Single Dose Grinder",
      sku: "NZ-001",
      price: { amount: 599, currency: "EUR" },
      availability: "in_stock",
      use_cases: ["espresso at home", "single-dose workflow", "cafe-quality grind"],
      buyer_personas: ["enthusiast", "barista"],
      agent_actions: ["add_to_cart", "compare", "reserve"],
    },
    null,
    2,
  ),
  readiness: [
    { k: "llms.txt", status: "fail" },
    { k: "Product schema", status: "warn" },
    { k: "Merchant feed", status: "warn" },
    { k: "Reviews indexed", status: "pass" },
    { k: "FAQs structured", status: "fail" },
    { k: "Shipping policy", status: "pass" },
    { k: "Return policy", status: "warn" },
    { k: "Agent checkout", status: "fail" },
  ],
  personas: [
    { id: "budget", name: "Budget Shopper", emoji: "🪙", blurb: "Cheapest acceptable. Hates fluff.", prompt: "Find me a decent espresso grinder under €150.", winner: "GrindLab", reason: "Listed price band + clear specs. You buried price under variants.", you: 22 },
    { id: "premium", name: "Premium Shopper", emoji: "💎", blurb: "Quality first. Brand-aware.", prompt: "What's the best single-dose grinder under €700?", winner: "Your Store", reason: "Strong buying guide + tasting notes that the model could cite.", you: 71 },
    { id: "gift", name: "Gift Buyer", emoji: "🎁", blurb: "Buying for someone else. Needs reassurance.", prompt: "A nice espresso starter gift for my partner under €250.", winner: "Caffè Nord", reason: "Gift bundles + return policy structured for agents.", you: 34 },
    { id: "researcher", name: "Researcher", emoji: "🧪", blurb: "Specs, charts, evidence.", prompt: "Compare burr geometry and retention across top grinders.", winner: "Your Store", reason: "Spec tables + JSON-LD reviewed by the panel.", you: 64 },
    { id: "impulse", name: "Impulse Buyer", emoji: "⚡", blurb: "Sees, wants, clicks.", prompt: "What's a sexy grinder I can buy right now?", winner: "Caffè Nord", reason: "Hero imagery + 1-line story. Your PDP starts with shipping.", you: 19 },
  ],
  fixes: FIX_POOL,
};
