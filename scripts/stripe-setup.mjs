/**
 * One-time Stripe setup: creates the products + prices the app expects and
 * prints the env var lines to paste into .env.local. Run: node scripts/stripe-setup.mjs
 * Reads STRIPE_SECRET_KEY from .env.local. Safe to run in test mode.
 */
import Stripe from "stripe";
import fs from "node:fs";

const env = fs.readFileSync(".env.local", "utf8");
const key = env.match(/^STRIPE_SECRET_KEY=(.*)$/m)?.[1]?.trim();
if (!key) {
  console.error("STRIPE_SECRET_KEY missing from .env.local");
  process.exit(1);
}
const stripe = new Stripe(key);

async function oneTime(envName, name, amount, description) {
  const product = await stripe.products.create({ name, description });
  const price = await stripe.prices.create({ product: product.id, unit_amount: amount, currency: "eur" });
  return [envName, price.id];
}
async function recurring(envName, name, amount, description) {
  const product = await stripe.products.create({ name, description });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: amount,
    currency: "eur",
    recurring: { interval: "month" },
  });
  return [envName, price.id];
}

const results = Object.fromEntries(
  await Promise.all([
    oneTime("STRIPE_PRICE_EXPLORER", "Explorer — 150 credits", 999, "150 credits, one-time."),
    oneTime("STRIPE_PRICE_BUILDER", "Builder — 700 credits", 2499, "700 credits, one-time."),
    oneTime("STRIPE_PRICE_FOUNDER", "Founder — 1500 credits", 4999, "1500 credits, one-time."),
    recurring("STRIPE_PRICE_PRO", "Priority Debater Pro", 1900, "400 credits/mo + premium features."),
    recurring("STRIPE_PRICE_STUDIO", "Priority Debater Studio", 4900, "1200 credits/mo + everything in Pro."),
  ]),
);

console.log("\n--- Add these to .env.local ---");
for (const [k, v] of Object.entries(results)) console.log(`${k}=${v}`);
console.log("--- done ---\n");
