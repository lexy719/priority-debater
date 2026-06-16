/**
 * Shared types for the post-validation founder flow
 * (Brand → Launch → Campaign → Landing → Ship).
 *
 * These describe the payloads returned by /api/brand-kit, /api/launch-kit and
 * /api/campaign, plus the normalized "idea" the flow pages render around.
 */

/* ── The normalized idea every flow page renders around ──────────────────── */
export type FlowIdea = {
  /** Short idea title (the validated topic). */
  title: string;
  /** One-line pitch / thesis. */
  pitch: string;
  /** Headline viability score, 0–100. */
  viability: number;
  /** GO / CAUTION / NO-GO style verdict copy. */
  verdict: string;
  /** Rank band, e.g. "TOP 50%". */
  band: string;
  tam: string;
  sam: string;
  som: string;
  /** Suggested per-seat / unit price (from the generated product page). */
  price: string;
  /** Locked brand name (from the brand kit), upper-case. */
  brandName: string;
};

export type TickerItem = { tag: string; text: string; color: string };

/* ── Brand kit (the extended /api/brand-kit payload) ─────────────────────── */
export type BrandPaletteSwatch = { name: string; hex: string; role: string; contrast: string };
export type BrandTypeEntry = { role: string; font: string; note: string };
export type BrandVoicePrinciple = { p: string; d: string };

export type BrandKitFull = {
  name: string;
  pronunciation: string;
  alternates: string[];
  rationale: string;
  taglines: string[];
  oneLiner: string;
  boilerplateShort: string;
  boilerplateLong: string;
  palette: { name: string; hex: string; note: string }[];
  type: BrandTypeEntry[];
  voice: BrandVoicePrinciple[];
  dos: string[];
  donts: string[];
};

/* ── Launch kit (the /api/launch-kit payload) ────────────────────────────── */
export type ProductPage = {
  headline: string;
  subhead: string;
  valueProps: { title: string; body: string }[];
  pricing: { name: string; price: string; per: string; note: string; featured?: boolean; cta: string }[];
  primaryCta: string;
  secondaryCta: string;
};

export type AcquisitionChannel = {
  n: string;
  channel: string;
  target: string;
  why: string;
  cadence: string;
  sample: string;
};

export type Offer = {
  founding: string;
  beta: string;
  urgency: string;
  guarantee: string;
};

export type RedditPost = { sub: string; title: string; body: string };

export type LaunchKitPayload = {
  productPage: ProductPage;
  acquisition: AcquisitionChannel[];
  coldMessages: string[];
  redditPosts: RedditPost[];
  xHooks: string[];
  offer: Offer;
};

/* ── Campaign (the /api/campaign payload) ────────────────────────────────── */
export type CampaignKpi = { k: string; v: string; c: string };
export type CampaignBudgetRow = { platform: string; pct: number; amount: string; color: string };
export type CampaignScene = { t: string; visual: string; line: string };
export type CampaignAd = {
  id: string;
  platform: string;
  color: string;
  format: string;
  duration: string;
  aspect: string;
  concept: string;
  hook: string;
  scenes: CampaignScene[];
  adCopy: { headline: string; primary: string };
  cta: string;
};

export type CampaignPayload = {
  objective: string;
  angle: string;
  budget: { total: string; daily: string; window: string };
  audience: string;
  kpis: CampaignKpi[];
  budgetSplit: CampaignBudgetRow[];
  ads: CampaignAd[];
  adAccounts: { name: string; color: string }[];
};

export type JourneyStage = {
  n: string;
  stage: string;
  artifact: string;
  state: "done" | "current" | "todo";
  href: string;
};
