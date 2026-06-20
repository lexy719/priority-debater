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
  rescore: 5,
  brand_kit: 20,
  launch_kit: 20,
  campaign: 20,
  landing: 20,
  pitch: 20,
  commerce_audit: 15,
  commerce_toolkit: 10,
  logo_image: 20,
  ad_video: 50,
  hd_voice: 1, // per spoken tribunal turn (ElevenLabs)
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

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
