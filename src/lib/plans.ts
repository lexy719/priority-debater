/**
 * Subscription plans — the single source of truth for the pricing page.
 * Each entry drives the PricingView card grid. `stripePriceEnv` names the
 * env var holding that plan's Stripe Price ID so prices live in Stripe
 * and the plan definition lives here.
 */

export interface Plan {
  id: string;
  name: string;
  priceLabel: string;
  /** true for paid recurring plans; false for the free tier */
  premium: boolean;
  tagline: string;
  features: string[];
  /** Env var key holding the Stripe Price ID (omitted for the free tier) */
  stripePriceEnv?: string;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceLabel: "€0",
    premium: false,
    tagline: "Get started — no credit card required.",
    features: [
      "50 credits on sign-up",
      "Full idea validation flow",
      "Priority Debate™ analysis",
      "Basic brand toolkit",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceLabel: "€19",
    premium: true,
    tagline: "For serious founders shipping fast.",
    features: [
      "200 credits / month included",
      "Everything in Free",
      "HD voice debates",
      "Commerce audit tools",
      "Landing page generator",
      "Priority support",
    ],
    stripePriceEnv: "STRIPE_PRICE_PRO",
  },
  {
    id: "team",
    name: "Team",
    priceLabel: "€49",
    premium: true,
    tagline: "Collaborate with your whole team.",
    features: [
      "600 credits / month included",
      "Everything in Pro",
      "Team workspace (up to 5 seats)",
      "Pitch deck export",
      "Ad video generation",
      "Dedicated account manager",
    ],
    stripePriceEnv: "STRIPE_PRICE_TEAM",
  },
];

export type PlanId = (typeof PLANS)[number]["id"];
