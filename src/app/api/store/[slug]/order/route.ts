import { NextResponse } from "next/server";
import { recordActivity } from "@/lib/studio/activityRepo";
import { classifyAgent } from "@/lib/studio/hitRepo";
import { normaliseSource, orderId, saveOrder, type StoreOrder } from "@/lib/studio/orderRepo";
import { shipsPhysically } from "@/lib/studio/aiStorefront";
import { fulfilOrder } from "@/lib/studio/fulfilment";
import { canCollect, createOrderCheckout, paymentsNote } from "@/lib/studio/storePayments";
import { adjustStock, loadStore } from "@/lib/studio/storeRepo";

/**
 * POST /api/store/[slug]/order — the store's order intake, both registers:
 *
 * - HTML form post (application/x-www-form-urlencoded) from /checkout —
 *   works with JavaScript off, 303-redirects to the confirmation page.
 * - JSON order-intent (application/json) for agents:
 *   { sku, qty?, name, email, address } → { ok, orderId, status, total }.
 *
 * Orders are RECEIVED, not charged — no payment credentials are accepted or
 * stored; UCP/ACP payment rails are a later layer.
 */

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await loadStore(slug);
  if (!s) return NextResponse.json({ ok: false, error: "store not found" }, { status: 404 });

  const isJson = (req.headers.get("content-type") ?? "").includes("application/json");
  let sku = "", qty = 1, name = "", email = "", address = "", ref: unknown = null;
  try {
    if (isJson) {
      const b = await req.json();
      sku = String(b.sku ?? ""); qty = Math.max(1, Math.min(99, Number(b.qty) || 1));
      name = String(b.name ?? ""); email = String(b.email ?? ""); address = String(b.address ?? "");
      ref = b.ref;
    } else {
      const f = await req.formData();
      sku = String(f.get("sku") ?? ""); qty = Math.max(1, Math.min(99, Number(f.get("qty")) || 1));
      name = String(f.get("name") ?? ""); email = String(f.get("email") ?? ""); address = String(f.get("address") ?? "");
      ref = f.get("ref");
    }
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const p = s.store.products.find((x) => x.sku === sku);
  if (!p) return NextResponse.json({ ok: false, error: "unknown sku" }, { status: 400 });
  // A retired product must refuse the sale, not silently accept it.
  if (p.availability === "Discontinued") {
    return NextResponse.json({
      ok: false, error: `${p.name} has been discontinued and cannot be ordered`,
      alternatives: s.store.products.filter((x) => x.availability !== "Discontinued").map((x) => ({ sku: x.sku, name: x.name, price: x.price })),
    }, { status: 409 });
  }
  // A download or an hour of work has nowhere to ship — asking for an address
  // would be a wall an agent has to climb for no reason.
  const needsAddress = shipsPhysically(p.kind);
  if (!name.trim() || !email.includes("@") || (needsAddress && !address.trim())) {
    return NextResponse.json({
      ok: false,
      error: needsAddress ? "name, email and address are required" : "name and email are required",
    }, { status: 400 });
  }

  const order: StoreOrder = {
    id: orderId(slug + sku), slug, ts: new Date().toISOString(),
    sku, productName: p.name, price: p.price, qty,
    total: p.priceValue != null ? p.priceValue * qty : undefined,
    buyer: {
      name: name.trim().slice(0, 120), email: email.trim().slice(0, 160),
      address: needsAddress ? address.trim().slice(0, 300) : (address.trim().slice(0, 300) || `no shipping — ${p.kind ?? "digital"} delivered to ${email.trim().slice(0, 160)}`),
    },
    channel: isJson ? "agent-json" : "web-form",
    agent: classifyAgent(req.headers.get("user-agent")),
    status: "received",
    // Every order is born unpaid. Only a provider can change that.
    payment: { status: "unpaid" },
    ...(normaliseSource(ref) ? { source: normaliseSource(ref) } : {}),
  };
  try {
    await saveOrder(order);
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
  // Ops Agent: inventory moves with the order; the log shows who sold what.
  const left = await adjustStock(slug, sku, qty);
  await recordActivity(slug, "OPERATIONS", `Order ${order.id} received — ${p.name} ×${qty} via ${order.channel === "agent-json" ? order.agent : "web"}${left != null ? ` · stock ${left}` : ""}${left === 0 ? " · SKU NOW OUT OF STOCK" : ""}`, "auto");
  // Credit the surface that sent them. Without this line Marketing can only
  // ever report what it published, never what any of it was worth.
  if (order.source) {
    await recordActivity(slug, "MARKETING",
      `${order.source.startsWith("l:") ? "Landing page" : "Campaign"} ${order.source.slice(2) || order.source} produced order ${order.id}${order.total != null ? ` · €${order.total.toFixed(2)}` : ""}`,
      "auto");
  }

  const confirmation = `/store/${slug}/order/${order.id}`;
  const origin = new URL(req.url).origin;
  const total = p.priceValue != null ? `${(p.priceValue * qty).toFixed(2)} ${p.currency ?? "EUR"}` : p.price;

  // ── PAYMENT FIRST, WHEN THERE IS A RAIL ────────────────────────────────
  // Until now a digital order was fulfilled the instant it was placed, which
  // meant anyone could take the artefact without paying. With Stripe live the
  // buyer goes to Checkout and fulfilment waits for the webhook.
  if (canCollect() && p.priceValue != null) {
    const co = await createOrderCheckout({
      order, productName: p.name, description: p.description,
      unitPrice: p.priceValue, currency: p.currency ?? "EUR", origin,
    });
    if (co.ok) {
      await recordActivity(slug, "FINANCE", `Checkout opened for ${order.id} — ${total} awaiting settlement`, "auto");
      if (isJson) {
        return NextResponse.json({
          ok: true, orderId: order.id, status: "awaiting_payment", sku, qty, total, confirmation,
          paymentUrl: co.url,
          note: "Complete payment at paymentUrl. Delivery is released once Stripe confirms settlement.",
        });
      }
      return NextResponse.redirect(co.url, 303);
    }
    // Checkout could not be opened. Refusing the order outright would lose a
    // real buyer over our configuration problem, so the order stands, unpaid,
    // and the reason goes on the record where the operator will see it.
    await recordActivity(slug, "FINANCE", `Could not open checkout for ${order.id} — ${co.reason}`, "auto");
  }

  // ── NO RAIL: the order is recorded UNPAID and fulfilled anyway ──────────
  // A showroom, not a shop. The order carries payment.status "unpaid" so no
  // figure anywhere can call this money that arrived.
  const done = await fulfilOrder({ store: s, order, origin });

  if (isJson) {
    return NextResponse.json({
      ok: true, orderId: order.id, status: "received", paid: false, sku, qty, total, confirmation,
      emailed: done.emailed, emailNote: done.emailNote,
      note: paymentsNote() ?? undefined,
      ...(done.deliveryUrl ? { deliveryUrl: done.deliveryUrl, deliveryKind: done.deliveryKind, deliveryNote: done.deliveryNote } : {}),
    });
  }
  return NextResponse.redirect(new URL(confirmation, req.url), 303);
}
