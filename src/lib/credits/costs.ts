/**
 * Credit economy — the single server-side source of truth. Tune prices here.
 * Mirrors IdeaProof's model: free signup grant, per-action costs, non-expiring
 * one-time packs. Used by the spend guard (server) and the pricing page.
 */

/** Credits granted to a brand-new account (no card). */
export const SIGNUP_GRANT = 50;

/**
 * Cost per metered action. Keys double as the ledger `reason`. Priced to cover
 * the underlying API spend with margin — text actions are cheap to run, AI video
 * (Higgsfield) genuinely isn't, so it costs more. Everything runs on credits;
 * there are no subscription tiers.
 */
export const CREDIT_COSTS = {
  validation: 15,
  debate: 15,
  // Re-entering a REVISED idea (§5): research/grounding is partially reused, so
  // it's discounted vs. a fresh Chamber.
  debate_revise: 8,
  // Quick Cross (§7): one seat, one exchange — a low-commitment gut-check.
  quick_cross: 4,
  rescore: 5,
  brand_kit: 20,
  launch_kit: 20,
  campaign: 20,
  landing: 20,
  pitch: 20,
  // PD Commerce — the report is free to RUN; credits are spent to UNLOCK it.
  commerce_scan: 15, // unlock the full intelligence report for a URL (permanent)
  commerce_rescan: 15, // weekly re-scan that refreshes the data + snapshots it
  commerce_agent_action: 10, // one PD Agent task: generate content + push to Shopify
  commerce_agent_chat: 1, // one natural-language query to the PD Agent (cheap, frequent)
  logo_image: 20,
  ad_video: 50,
  hd_voice: 1, // per spoken tribunal turn (ElevenLabs)
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

/**
 * Actions that run as a FREE, unmetered preview when the caller is NOT signed in.
 * This keeps the studio generating real AI output for logged-out visitors
 * (the pre-Supabase behaviour) instead of silently falling back to a sample.
 *
 * Signed-in users are still metered normally. Real-money media routes
 * (logo_image, ad_video → Higgsfield) are deliberately NOT here.
 */
export const OPEN_PREVIEW_ACTIONS = new Set<CreditAction>([
  "brand_kit",
  "launch_kit",
  "campaign",
  "landing",
  "pitch",
]);

export function isOpenPreviewAction(action: CreditAction): boolean {
  return OPEN_PREVIEW_ACTIONS.has(action);
}

export function costOf(action: CreditAction): number {
  return CREDIT_COSTS[action];
}

/**
 * One-time credit packs (IdeaProof-aligned, tunable). `stripePriceEnv` names the
 * env var holding that pack's Stripe Price ID, so prices live in Stripe and the
 * credit grant lives here — the webhook maps price → credits via this table.
 */
export const CREDIT_PACKS = [
  { id: "explorer", name: "Explorer", priceLabel: "€9.99", credits: 150, stripePriceEnv: "STRIPE_PRICE_EXPLORER" },
  { id: "builder", name: "Builder", priceLabel: "€24.99", credits: 700, stripePriceEnv: "STRIPE_PRICE_BUILDER" },
  { id: "founder", name: "Founder", priceLabel: "€49.99", credits: 1500, stripePriceEnv: "STRIPE_PRICE_FOUNDER" },
] as const;

export type CreditPackId = (typeof CREDIT_PACKS)[number]["id"];
