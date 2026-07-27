import { NextResponse } from "next/server";
import { recordActivity } from "@/lib/studio/activityRepo";
import { answerQuestion, loadAftercare, setReturnStatus } from "@/lib/studio/aftercareRepo";
import { listDeliveries } from "@/lib/studio/deliveryRepo";
import { ownedStore } from "@/lib/commerce/owner";

/**
 * The aftercare desk: everything that happens after "thanks for your order".
 * GET  ?slug=                              → deliveries, returns, questions
 * PUT  {slug, returnId, status}            → approve / decline / mark refunded
 * PUT  {slug, questionId, answer}          → the owner answers what PDR could not
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  const own = await ownedStore(slug);
  if (!own.ok) return NextResponse.json({ ok: false, error: own.error }, { status: own.status });
  const [aftercare, deliveries] = await Promise.all([loadAftercare(slug), listDeliveries(slug)]);
  return NextResponse.json({ ok: true, ...aftercare, deliveries }, { headers: { "cache-control": "no-store" } });
}

export async function PUT(req: Request) {
  let body: { slug?: string; returnId?: string; status?: string; questionId?: string; answer?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const slug = String(body.slug ?? "");
  const own = await ownedStore(slug);
  if (!own.ok) return NextResponse.json({ ok: false, error: own.error }, { status: own.status });

  if (body.returnId) {
    const status = String(body.status ?? "");
    if (!["approved", "declined", "refunded"].includes(status)) {
      return NextResponse.json({ ok: false, error: "status must be approved, declined or refunded" }, { status: 400 });
    }
    const r = await setReturnStatus(slug, String(body.returnId), status as "approved" | "declined" | "refunded");
    if (!r) return NextResponse.json({ ok: false, error: "no such return" }, { status: 404 });
    await recordActivity(slug, "OPERATIONS", `Return ${r.id} on ${r.orderId} marked ${status} by the owner`);
    return NextResponse.json({ ok: true, ...(await loadAftercare(slug)) });
  }

  if (body.questionId) {
    const answer = String(body.answer ?? "").trim();
    if (answer.length < 2) return NextResponse.json({ ok: false, error: "write an answer" }, { status: 400 });
    const q = await answerQuestion(slug, String(body.questionId), answer);
    if (!q) return NextResponse.json({ ok: false, error: "no such question" }, { status: 404 });
    await recordActivity(slug, "OPERATIONS", `Answered ${q.id} — "${answer.slice(0, 70)}"`);
    return NextResponse.json({ ok: true, ...(await loadAftercare(slug)) });
  }

  return NextResponse.json({ ok: false, error: "nothing to do" }, { status: 400 });
}
