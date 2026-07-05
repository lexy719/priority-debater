/**
 * PD Commerce — the report contract.
 *
 * `CommerceReport` is the single shape produced by the scan engine (`scan.ts`),
 * persisted (`report-store.ts`), and consumed by the results page. Every field
 * is derived from a real signal or a real AI answer; nothing here is invented.
 * When the live buyer test cannot run (no/dead OpenAI key), `live` is false and
 * the UI labels the shock section as a simulated example rather than faking data.
 */

export type IntentTag = "DISCOVERY" | "VALUE" | "TRUST" | "POPULAR" | "BRAND";

export interface CompetitorMention {
  name: string;
  count: number;
}

/** One of the five buyer journeys we replayed through the AI. */
export interface BuyerQuery {
  intent: IntentTag;
  label: string; // human label, e.g. "Discovery"
  query: string; // the exact question asked
  namedYou: boolean; // discovery/list: ranked; brand: endorsed by the AI
  yourRank: number | null; // 1-based position when named, else null
  competitors: CompetitorMention[]; // for brand queries these are "stronger options"
  reasoning: string; // verbatim excerpt — for brand queries, the AI's actual verdict
  /** Only on BRAND queries: the AI's honest verdict on the store itself. */
  verdict?: "RECOMMENDED" | "MIXED" | "AVOID";
}

export interface ChannelScore {
  score: number; // 0–100
  verdict: string; // one-sentence plain-language verdict
}

export interface GoogleSignals {
  indexedPages: number | null; // null = no data (no Google Search Console connection)
  searchPresence: boolean;
  shopping: boolean;
  featuredSnippet: boolean;
  sitemap: boolean;
  metaDescription: boolean;
  /** Live web-search check: does the store rank for its category on Google? */
  appearsInSearch: boolean | null; // null = couldn't check (no AI key)
  searchPosition: number | null; // approx. organic position when it ranks
  topResults: string[]; // the stores Google actually surfaces for the category
}

export interface AssistantBreakdown {
  assistant: "ChatGPT" | "Perplexity" | "Google AI";
  mentions: number;
  wired: boolean; // is this provider actually queried, or "no data yet"?
}

export interface AgentCheck {
  label: string;
  ok: boolean;
}

export interface Scores {
  overall: number;
  google: ChannelScore;
  ai: ChannelScore & { assistants: AssistantBreakdown[] };
  agentReadiness: ChannelScore & { checks: AgentCheck[] };
}

export type FixSeverity = "CRITICAL" | "HIGH" | "MEDIUM";
export type FixChannel = "AI" | "GOOGLE" | "CONTENT" | "TRACKING" | "AGENT";
export type FixType =
  | "buying_guide"
  | "schema_missing"
  | "ai_crawlers_allowed"
  | "llms_txt"
  | "product_feed"
  | "faq_schema"
  | "comparison_page"
  | "reviews_structured";

export interface Fix {
  id: string;
  type: FixType;
  severity: FixSeverity;
  channel: FixChannel;
  outcome: string; // outcome language ONLY — never a technical file name
  impact: string; // display, e.g. "+22 PTS"
  impactPts: number; // numeric, for ranking
  explanation: string; // plain, store-specific, real names
}

export interface CompetitorCard {
  name: string;
  domain: string | null;
  score: number; // rough derived score (always above the store's)
  mentions: number; // times named across all five queries
  advantages: string[]; // "what they have that you don't"
}

/** The always-visible Section 0 payload — the conversion moment. */
export interface Shock {
  headlineVariant: "zero" | "few" | "some";
  queryAsked: string; // the one query shown in the chat replay
  competitorsNamed: string[]; // up to 3 names the AI gave
  reasoning: string; // the AI answer excerpt
  namedYou: boolean;
  queriesTested: number;
  timesNamed: number;
  competitorTimesNamed: number;
}

export interface CommerceReport {
  shareId: string;
  url: string;
  storeName: string;
  category: string;
  country: string;
  live: boolean; // did a real AI answer at least once?
  /**
   * Estimated €/month at risk from AI invisibility. Derived from the real scan
   * signals (mention rate, fix severity) with cap/floor logic so tiny catalogs
   * never produce absurd numbers (§6.3). A range's midpoint, not a promise.
   */
  estimatedMonthlyLoss: number;
  shock: Shock;
  scores: Scores;
  buyerQueries: BuyerQuery[];
  competitors: CompetitorCard[];
  topCompetitor: string | null;
  googleSignals: GoogleSignals;
  fixes: Fix[];
  unlocked: boolean;
  createdAt: string;
}
