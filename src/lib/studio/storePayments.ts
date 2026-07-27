import "server-only";

/**
 * Store payments — Stripe Checkout for orders placed against a PDR-run store.
 *
 * Separate from `src/lib/stripe.ts`'s credits flow on purpose: that one sells
 * PDR's own product to PDR's own users. This one takes money on behalf of a
 * business PDR operates, and its webhook has different metadata, a different
 * idempotency story and a different endpoint.
 *
 * IMPORTANT — no card data ever touches this codebase. Stripe hosts the form;
 * PDR only ever holds a session id and, afterwards, what Stripe says was paid.
 *
 * Not configured is a first-class state: `paymentsLive()` is false when the
 * secret key is missing, and the store falls back to recording an order that
 * is explicitly, visibly unpaid rather than pretending money moved.
 */

import { getStripe, stripeConfigured } from "@/lib/stripe";
import type { StoreOrder } from "./orderRepo";

export function paymentsLive(): boolean {
  return stripeConfigured();
}

/** Why checkout is unavailable, in words the operator can act on. */
export function paymentsNote(): string | null {
  if (!stripeConfigured()) return "No STRIPE_SECRET_KEY — orders are recorded but no money can move.";
  if (!process.env.STRIPE_WEBHOOK_SECRET?.trim()) {
    return "STRIPE_WEBHOOK_SECRET is missing. Checkout will open, but nothing can confirm the payment came back, so orders would stay unpaid forever.";
  }
  return null;
}

/**
 * Payment can only be COLLECTED if settlement can also be CONFIRMED. Opening a
 * checkout with no webhook secret would take a buyer's money and leave the
 * order permanently unpaid in our own ledger — worse than not charging at all.
 */
export function canCollect(): boolean {
  return stripeConfigured() && Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
}

export type CheckoutOutcome =
  | { ok: true; url: string; sessionId: string }
  | { ok: false; reason: string };

export async function createOrderCheckout(opts: {
  order: StoreOrder;
  productName: string;
  description?: string;
  /** Unit price in EUR. Absent means the product has no machine-readable price. */
  unitPrice: number | null;
  currency?: string;
  origin: string;
}): Promise<CheckoutOutcome> {
  const { order, productName, unitPrice, origin } = opts;
  if (!canCollect()) return { ok: false, reason: paymentsNote() ?? "payments are not configured" };
  if (unitPrice == null || !(unitPrice > 0)) {
    return { ok: false, reason: `${productName} has no machine-readable price, so it cannot be charged for.` };
  }

  const currency = (opts.currency ?? "EUR").toLowerCase();
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      // Stripe emails its own receipt; ours carries the delivery link.
      customer_email: order.buyer.email,
      line_items: [{
        quantity: order.qty,
        price_data: {
          currency,
          unit_amount: Math.round(unitPrice * 100),
          product_data: {
            name: productName,
            ...(opts.description ? { description: opts.description.slice(0, 300) } : {}),
          },
        },
      }],
      // The webhook reads these back. They are the ONLY link between a Stripe
      // event and an order in our ledger, so both halves must be present.
      metadata: { pdrSlug: order.slug, pdrOrderId: order.id },
      success_url: `${origin}/store/${order.slug}/order/${order.id}?paid=1`,
      cancel_url: `${origin}/store/${order.slug}/order/${order.id}?cancelled=1`,
    });
    if (!session.url) return { ok: false, reason: "Stripe returned a session with no URL." };
    return { ok: true, url: session.url, sessionId: session.id };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}
