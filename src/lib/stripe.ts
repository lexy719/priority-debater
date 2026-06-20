import "server-only";

/**
 * Stripe client — lazily constructed so the app boots fine before billing keys
 * exist (pre-launch / beta). Every caller checks `stripeConfigured()` first and
 * degrades to "billing isn't live yet" instead of throwing.
 */

import Stripe from "stripe";

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  if (!cached) cached = new Stripe(key);
  return cached;
}
