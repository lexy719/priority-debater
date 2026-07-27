import type Stripe from "stripe";
import { recordActivity } from "@/lib/studio/activityRepo";
import { fulfilOrder } from "@/lib/studio/fulfilment";
import { markPaid } from "@/lib/studio/orderRepo";
import { loadStore } from "@/lib/studio/storeRepo";
import { getStripe, stripeConfigured } from "@/lib/stripe";

/**
 * POST /api/commerce/stripe/webhook — the only thing that can turn a booked
 * order into a settled one.
 *
 * Register this URL in Stripe (Developers → Webhooks) for the event
 * `checkout.session.completed` and put the signing secret in
 * STRIPE_WEBHOOK_SECRET.
 *
 * Deliberately distinct from /api/stripe/webhook, which grants PDR's own
 * credits. This one takes money on behalf of a business PDR operates: different
 * metadata, different idempotency, different consequences if it double-fires.
 *
 * Order of operations matters. `markPaid` reports whether THIS delivery of the
 * event was the one that flipped the order, and fulfilment only runs when it
 * was — Stripe retries by design, and a retry must not mint a second delivery
 * or bill Claude again for the same artefact.
 *
 * Always 200s on a verified event, even when the work fails. A non-2xx makes
 * Stripe retry forever, and a webhook that cannot succeed should not be told
 * to keep trying — the failure goes on the operator's record instead.
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripeConfigured() || !secret) {
    return Response.json({ received: true, skipped: "stripe_not_configured" });
  }

  const sig = request.headers.get("stripe-signature");
  const raw = await request.text();

  let event: Stripe.Event;
  try {
    // Signature verification is the whole security model here: without it,
    // anyone who knows an order id could mark it paid by POSTing JSON.
    event = getStripe().webhooks.constructEvent(raw, sig ?? "", secret);
  } catch {
    return Response.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return Response.json({ received: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const slug = session.metadata?.pdrSlug;
  const orderId = session.metadata?.pdrOrderId;
  // No metadata means this session belongs to the credits flow, not a store.
  if (!slug || !orderId) return Response.json({ received: true, ignored: "no_pdr_metadata" });
  if (session.payment_status !== "paid") {
    return Response.json({ received: true, ignored: `payment_status=${session.payment_status}` });
  }

  const amount = session.amount_total != null ? session.amount_total / 100 : undefined;
  const { order, changed } = await markPaid(slug, orderId, {
    provider: "stripe", ref: session.id, amount, currency: session.currency ?? undefined,
  });
  if (!order) return Response.json({ received: true, ignored: "unknown_order" });
  if (!changed) return Response.json({ received: true, ignored: "already_settled" });

  await recordActivity(slug, "FINANCE",
    `Payment settled for ${order.id} — ${amount != null ? `€${amount.toFixed(2)}` : "amount unreported"} via Stripe`, "auto");

  // Now, and only now, the buyer gets what they bought.
  try {
    const store = await loadStore(slug);
    if (!store) {
      await recordActivity(slug, "OPERATIONS", `Paid order ${order.id} could not be fulfilled — the store record is missing`, "auto");
      return Response.json({ received: true, settled: true, fulfilled: false });
    }
    const origin = new URL(request.url).origin;
    const done = await fulfilOrder({ store, order, origin });
    return Response.json({ received: true, settled: true, fulfilled: true, delivery: done.deliveryUrl ?? null });
  } catch (e) {
    // The money is real and recorded; only the handover failed. Say so loudly
    // rather than losing it, and do not ask Stripe to replay a settled payment.
    await recordActivity(slug, "OPERATIONS",
      `Paid order ${order.id} was NOT fulfilled — ${(e as Error).message}. The buyer has paid and is waiting.`, "auto");
    return Response.json({ received: true, settled: true, fulfilled: false });
  }
}
