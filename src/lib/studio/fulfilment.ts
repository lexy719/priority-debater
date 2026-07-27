import "server-only";

/**
 * Fulfilment — everything that happens once an order is OWED to a buyer.
 *
 * Extracted from the order endpoint because it now has two triggers:
 *
 *   no payment rail  → fulfil immediately on order (the store is a showroom;
 *                      it says so, and the order is recorded unpaid)
 *   payment rail     → fulfil only when Stripe confirms settlement
 *
 * Running it from one place is what stops the two paths drifting. Before this
 * split, a digital order was delivered the instant it was placed — anyone
 * could take the artefact without paying for it.
 *
 * Every step is idempotent-ish by construction: `issueDelivery` is keyed to the
 * order, and `loadArtefact` reuses what was already written rather than paying
 * Claude twice for the same SKU.
 */

import { recordActivity } from "./activityRepo";
import { generateArtefact, loadArtefact } from "./artefactRepo";
import { issueDelivery } from "./deliveryRepo";
import { orderConfirmation, send } from "./mailer";
import type { StoreOrder } from "./orderRepo";
import type { PublishedStore } from "./storeRepo";
import { shipsPhysically } from "./aiStorefront";

export type FulfilResult = {
  deliveryUrl?: string;
  deliveryKind?: string;
  deliveryNote?: string | null;
  emailed: boolean;
  emailNote?: string;
};

export async function fulfilOrder(opts: {
  store: PublishedStore;
  order: StoreOrder;
  /** Absolute origin, so the confirmation email links somewhere clickable. */
  origin: string;
}): Promise<FulfilResult> {
  const { store: s, order, origin } = opts;
  const slug = s.slug;
  const p = s.store.products.find((x) => x.sku === order.sku);
  if (!p) return { emailed: false, emailNote: "product no longer in the catalogue" };

  const needsAddress = shipsPhysically(p.kind);

  // If the seller attached nothing, PDR makes the thing it sold. A digital
  // business it runs end to end cannot hand over a link to a file nobody wrote.
  let produced = false;
  if (!needsAddress && !(p.delivery ?? "").trim() && (p.kind ?? "digital") !== "service") {
    const have = await loadArtefact(slug, order.sku);
    const made = have ?? await generateArtefact(slug, {
      sku: order.sku, name: p.name, description: p.description, price: p.price,
      brand: s.store.brand.fullName, audience: s.store.brand.audience, positioning: s.store.brand.positioning,
    });
    produced = !("error" in (made as object));
  }

  // Nothing to pack: a file, a licence or a booking is issued the moment the
  // order is owed, which is what lets this lane close without a human.
  const delivery = !needsAddress
    ? await issueDelivery(slug, {
        orderId: order.id, sku: order.sku, productName: p.name, buyerEmail: order.buyer.email,
        kind: (p.kind ?? "digital") as "digital" | "service" | "access",
        attached: p.delivery ?? null, qty: order.qty, produced,
      })
    : null;
  if (delivery) {
    await recordActivity(slug, "OPERATIONS",
      delivery.kind === "pending"
        ? `Delivery issued for ${order.id} but nothing is attached to ${order.sku} — the buyer has a record, not a file`
        : `Delivered ${order.sku} for ${order.id} (${delivery.kind})`, "auto");
  }

  // Tell the buyer, for real. If no provider is configured nothing is sent and
  // the ledger says so — the store never claims a message it did not send.
  const mail = await send({
    to: order.buyer.email,
    ...orderConfirmation({
      brand: s.store.brand.fullName, orderId: order.id, product: p.name, qty: order.qty,
      total: p.priceValue != null ? `${(p.priceValue * order.qty).toFixed(2)} ${p.currency ?? "EUR"}` : p.price,
      confirmationUrl: `${origin}/store/${slug}/order/${order.id}`,
      ships: s.manifest.ships ?? "EU · 3–5 business days",
      returns: s.manifest.returns ?? "30 days, unopened",
      physical: needsAddress,
    }),
  });
  await recordActivity(slug, "OPERATIONS",
    mail.sent ? `Confirmation emailed to ${order.buyer.email} for ${order.id}`
              : `No confirmation email for ${order.id} — ${mail.reason}`, "auto");

  return {
    ...(delivery ? { deliveryUrl: `/store/${slug}/d/${delivery.token}`, deliveryKind: delivery.kind, deliveryNote: delivery.note } : {}),
    emailed: mail.sent,
    emailNote: mail.reason,
  };
}
