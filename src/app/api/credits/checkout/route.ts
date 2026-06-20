import { createClient } from "@/lib/supabase/server";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { CREDIT_PACKS } from "@/lib/credits/costs";

/**
 * POST /api/credits/checkout — start a Stripe Checkout for a credit pack.
 *
 * Requires a signed-in user. Degrades to 503 ("billing isn't live yet") until
 * STRIPE_SECRET_KEY + the pack's price ID are configured, so the UI can fall
 * back to the beta message. The webhook (/api/stripe/webhook) grants the credits
 * once payment completes.
 */
export async function POST(request: Request) {
  let body: { packId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const pack = CREDIT_PACKS.find((p) => p.id === body.packId);
  if (!pack) return Response.json({ error: "Unknown pack." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "not_authenticated" }, { status: 401 });

  const priceId = process.env[pack.stripePriceEnv]?.trim();
  if (!stripeConfigured() || !priceId) {
    return Response.json(
      { error: "unavailable", message: "Checkout is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }

  const origin = new URL(request.url).origin;
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/credits?checkout=success`,
      cancel_url: `${origin}/credits?checkout=cancel`,
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      metadata: { userId: user.id, packId: pack.id, credits: String(pack.credits) },
    });
    return Response.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
