import { NextResponse } from "next/server";
import { recordActivity } from "@/lib/studio/activityRepo";
import { classifyAgent } from "@/lib/studio/hitRepo";
import { orderId, saveOrder, type StoreOrder } from "@/lib/studio/orderRepo";
import { shipsPhysically } from "@/lib/studio/aiStorefront";
import { issueDelivery } from "@/lib/studio/deliveryRepo";
import { orderConfirmation, send } from "@/lib/studio/mailer";
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
  let sku = "", qty = 1, name = "", email = "", address = "";
  try {
    if (isJson) {
      const b = await req.json();
      sku = String(b.sku ?? ""); qty = Math.max(1, Math.min(99, Number(b.qty) || 1));
      name = String(b.name ?? ""); email = String(b.email ?? ""); address = String(b.address ?? "");
    } else {
      const f = await req.formData();
      sku = String(f.get("sku") ?? ""); qty = Math.max(1, Math.min(99, Number(f.get("qty")) || 1));
      name = String(f.get("name") ?? ""); email = String(f.get("email") ?? ""); address = String(f.get("address") ?? "");
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
  };
  try {
    await saveOrder(order);
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
  // Ops Agent: inventory moves with the order; the log shows who sold what.
  const left = await adjustStock(slug, sku, qty);
  await recordActivity(slug, "OPERATIONS", `Order ${order.id} received — ${p.name} ×${qty} via ${order.channel === "agent-json" ? order.agent : "web"}${left != null ? ` · stock ${left}` : ""}${left === 0 ? " · SKU NOW OUT OF STOCK" : ""}`, "auto");

  // Nothing to pack: a file, a licence or a booking is issued in the same
  // breath as the order, which is what lets this lane close without a human.
  const delivery = !needsAddress
    ? await issueDelivery(slug, {
        orderId: order.id, sku, productName: p.name, buyerEmail: order.buyer.email,
        kind: (p.kind ?? "digital") as "digital" | "service" | "access", attached: p.delivery ?? null, qty,
      })
    : null;
  if (delivery) {
    await recordActivity(slug, "OPERATIONS",
      delivery.kind === "pending"
        ? `Delivery issued for ${order.id} but nothing is attached to ${sku} — the buyer has a record, not a file`
        : `Delivered ${sku} for ${order.id} instantly (${delivery.kind})`, "auto");
  }
  const confirmation = `/store/${slug}/order/${order.id}`;
  // Tell the buyer, for real. If no provider is configured nothing is sent and
  // the ledger says so — the store never claims a message it did not send.
  const origin = new URL(req.url).origin;
  const mail = await send({
    to: order.buyer.email,
    ...orderConfirmation({
      brand: s.store.brand.fullName, orderId: order.id, product: p.name, qty,
      total: p.priceValue != null ? `${(p.priceValue * qty).toFixed(2)} ${p.currency ?? "EUR"}` : p.price,
      confirmationUrl: `${origin}${confirmation}`,
      ships: s.manifest.ships ?? "EU · 3–5 business days",
      returns: s.manifest.returns ?? "30 days, unopened",
      physical: needsAddress,
    }),
  });
  await recordActivity(slug, "OPERATIONS",
    mail.sent ? `Confirmation emailed to ${order.buyer.email} for ${order.id}`
              : `No confirmation email for ${order.id} — ${mail.reason}`, "auto");

  if (isJson) {
    const total = p.priceValue != null ? `${(p.priceValue * qty).toFixed(2)} ${p.currency ?? "EUR"}` : p.price;
    return NextResponse.json({ ok: true, orderId: order.id, status: "received", sku, qty, total, confirmation, emailed: mail.sent, emailNote: mail.reason, ...(delivery ? { deliveryUrl: `/store/${slug}/d/${delivery.token}`, deliveryKind: delivery.kind, deliveryNote: delivery.note } : {}) });
  }
  return NextResponse.redirect(new URL(confirmation, req.url), 303);
}
