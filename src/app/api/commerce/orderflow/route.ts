import { NextResponse } from "next/server";
import { recordActivity } from "@/lib/studio/activityRepo";
import { ORDER_FLOW, updateOrderStatus, type OrderStatus } from "@/lib/studio/orderRepo";

/**
 * POST /api/commerce/orderflow — the Operations Agent's order-flow console.
 * { slug, id, status } advances an order through the lifecycle state machine
 * (received → confirmed → shipped → delivered · cancellable pre-ship).
 * Illegal transitions are refused; every move is logged as worker activity.
 */

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { slug?: string; id?: string; status?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const slug = String(body.slug ?? "");
  const id = String(body.id ?? "");
  const status = String(body.status ?? "") as OrderStatus;
  if (!slug || !id || !(status in ORDER_FLOW)) return NextResponse.json({ ok: false, error: "bad input" }, { status: 400 });

  const order = await updateOrderStatus(slug, id, status);
  if (!order) return NextResponse.json({ ok: false, error: "order not found or illegal transition" }, { status: 409 });
  await recordActivity(slug, "OPERATIONS", `Order ${id} → ${status.toUpperCase()} (${order.productName} ×${order.qty})`);
  return NextResponse.json({ ok: true, order });
}
