import type Stripe from "stripe";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { supabaseServiceConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

/**
 * POST /api/stripe/webhook — credits a user's account after a successful pack
 * purchase. Verifies the Stripe signature, then calls the `grant_credits` RPC
 * with the service-role client (bypasses RLS). Idempotency is handled by
 * grant_credits writing a ledger row keyed to the event reason.
 *
 * Point your Stripe webhook at this URL and set STRIPE_WEBHOOK_SECRET. Until
 * that + the service-role key are set, it acknowledges and no-ops.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripeConfigured() || !secret) {
    return Response.json({ received: true, skipped: "stripe_not_configured" });
  }

  const sig = request.headers.get("stripe-signature");
  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig ?? "", secret);
  } catch {
    return Response.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (!supabaseServiceConfigured()) {
    console.warn("[stripe] event received but SERVICE_ROLE key missing — cannot apply.");
    return Response.json({ received: true, skipped: "no_service_role" });
  }
  const admin = createServiceClient();

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const credits = Number(session.metadata?.credits ?? 0);
      if (userId && credits > 0) {
        await admin.rpc("grant_credits", {
          p_user: userId,
          p_amount: credits,
          p_reason: `pack_${session.metadata?.packId ?? "topup"}`,
        });
      }
    }
  } catch (error) {
    console.warn("[stripe] webhook apply failed:", error);
    return Response.json({ error: "apply_failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
