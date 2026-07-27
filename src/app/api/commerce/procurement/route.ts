import { NextResponse } from "next/server";
import { recordActivity } from "@/lib/studio/activityRepo";
import { isStocked } from "@/lib/studio/aiStorefront";
import { loadBusinessStore } from "@/lib/studio/businessSource";
import {
  loadProcurement, raiseRequisition, recordPurchase, recordQuotes,
  saveComparison, setRequisitionStatus, spendTotals,
} from "@/lib/studio/procurementRepo";
import { sourceQuotes } from "@/lib/studio/sourcing";

/**
 * The BUY worker's endpoint.
 *
 *   GET                  everything the buy side knows, plus what it would raise
 *   POST raise           open a requisition
 *   POST source          find suppliers and score them
 *   POST buy             place the purchase
 *   POST decline         close a requisition without buying
 *
 * On `buy`, a quote that points at another PDR store places a REAL order
 * against that store's public order endpoint. That is the network transacting
 * with itself: no outside supplier has to exist for the buy side to work, which
 * is the only honest answer to the cold-start problem.
 *
 * Spend is gated hardest of anything in the product. An unverified quote — a
 * language model's idea of a typical market rate — can never be bought
 * automatically, and `compareQuotes` refuses to crown one, so nothing
 * unattended can act on a number nobody checked.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** What the business measurably needs, derived from its own stock position. */
async function shortfalls(slug: string) {
  const s = await loadBusinessStore(slug);
  if (!s) return [];
  return s.store.products
    .filter((p) => p.availability !== "Discontinued" && isStocked(p.kind))
    .filter((p) => (p.stock ?? 0) <= 5)
    .map((p) => ({
      sku: p.sku ?? p.name,
      what: `Restock ${p.name}`,
      qty: 24,
      need: `${p.stock ?? 0} units left${(p.stock ?? 0) === 0 ? " — the SKU is already showing out of stock to every agent" : ""}`,
    }));
}

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!slug) return NextResponse.json({ ok: false, error: "slug required" }, { status: 400 });
  const [p, would] = await Promise.all([loadProcurement(slug), shortfalls(slug)]);
  const open = new Set(p.requisitions.filter((r) => r.status === "open" || r.status === "quoted").map((r) => r.sku));
  return NextResponse.json({
    ok: true,
    ...p,
    spend: spendTotals(p),
    // Needs the worker can see but has not raised yet, so the owner can tell
    // the difference between "nothing is wrong" and "nobody has looked".
    unraised: would.filter((w) => !open.has(w.sku)),
  }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const slug = String(body.slug ?? "");
  const action = String(body.action ?? "");
  if (!slug) return NextResponse.json({ ok: false, error: "slug required" }, { status: 400 });

  if (action === "raise") {
    const { requisition, created } = await raiseRequisition(slug, {
      what: String(body.what ?? "").slice(0, 160),
      need: String(body.need ?? "").slice(0, 300),
      qty: body.qty != null ? Number(body.qty) : undefined,
      sku: body.sku ? String(body.sku) : undefined,
      budget: body.budget != null ? Number(body.budget) : undefined,
      by: body.by === "auto" ? "auto" : "owner",
    });
    if (created) await recordActivity(slug, "OPERATIONS", `Requisition ${requisition.id} raised — ${requisition.what} · ${requisition.need}`, body.by === "auto" ? "auto" : "owner");
    return NextResponse.json({ ok: true, requisition, created });
  }

  if (action === "source") {
    const id = String(body.requisitionId ?? "");
    const p = await loadProcurement(slug);
    const r = p.requisitions.find((x) => x.id === id);
    if (!r) return NextResponse.json({ ok: false, error: "unknown requisition" }, { status: 404 });

    const found = await sourceQuotes(r, slug);
    await recordQuotes(slug, id, found);
    const scored = await saveComparison(slug, id, { maxLeadDays: body.maxLeadDays != null ? Number(body.maxLeadDays) : undefined });
    const verified = scored.filter((q) => q.verified).length;
    await recordActivity(slug, "OPERATIONS",
      `Sourced ${r.what} — ${scored.length} quote(s), ${verified} verified${verified === 0 ? " (nothing buyable without a human)" : ""}`, "auto");
    return NextResponse.json({ ok: true, quotes: scored });
  }

  if (action === "buy") {
    const id = String(body.requisitionId ?? "");
    const quoteId = String(body.quoteId ?? "");
    const p = await loadProcurement(slug);
    const r = p.requisitions.find((x) => x.id === id);
    const q = p.quotes.find((x) => x.id === quoteId);
    if (!r || !q) return NextResponse.json({ ok: false, error: "unknown requisition or quote" }, { status: 404 });
    if (!q.verified) {
      // Belt and braces: the comparison already refuses to crown these, but the
      // endpoint refuses too, because a UI bug should not be able to spend money.
      return NextResponse.json({ ok: false, error: "This quote is a market-rate lead, not a checked offer. It cannot be purchased through PDR — contact the supplier yourself." }, { status: 400 });
    }

    const qty = r.qty ?? 1;
    const total = Math.round(q.unitPrice * qty * 100) / 100;

    // PDR-to-PDR: place a real order against the other store.
    let externalOrderId: string | undefined;
    let status: "placed" | "failed" = "placed";
    let note: string | undefined;
    if (q.pdrSlug) {
      const buyer = await loadBusinessStore(slug);
      const sku = q.sourceUrl?.split("/p/")[1];
      try {
        const res = await fetch(`${new URL(req.url).origin}/api/store/${q.pdrSlug}/order`, {
          method: "POST",
          headers: { "content-type": "application/json", "user-agent": "PDR-BuyingAgent/1.0" },
          body: JSON.stringify({
            sku, qty,
            name: buyer?.store.brand.fullName ?? "A PDR-run business",
            email: `buying-agent@${buyer?.store.brand.domain ?? "pdr.local"}`,
            address: `Procurement for ${buyer?.store.brand.fullName ?? slug} — requisition ${r.id}`,
          }),
          signal: AbortSignal.timeout(30_000),
        });
        const d = await res.json().catch(() => ({}));
        if (d?.ok) externalOrderId = d.orderId;
        else { status = "failed"; note = String(d?.error ?? `the supplier's store returned ${res.status}`); }
      } catch (e) {
        status = "failed";
        note = (e as Error).message;
      }
    } else {
      status = "failed";
      note = "No ordering channel for this supplier — PDR can only place an order automatically against another PDR store.";
    }

    const purchase = await recordPurchase(slug, {
      requisitionId: id, quoteId, supplier: q.supplier, total, currency: q.currency,
      authority: String(body.authority ?? "owner"),
      ...(externalOrderId ? { externalOrderId } : {}),
      status, ...(note ? { note } : {}),
    });
    await recordActivity(slug, "FINANCE",
      status === "placed"
        ? `Bought ${r.what} from ${q.supplier} — €${total.toFixed(2)}${externalOrderId ? ` · their order ${externalOrderId}` : ""}`
        : `Could not buy ${r.what} from ${q.supplier} — ${note}`,
      body.authority === "owner" ? "owner" : "auto");
    return NextResponse.json({ ok: status === "placed", purchase, error: status === "failed" ? note : undefined });
  }

  if (action === "decline") {
    const r = await setRequisitionStatus(slug, String(body.requisitionId ?? ""), "declined");
    if (!r) return NextResponse.json({ ok: false, error: "unknown requisition" }, { status: 404 });
    await recordActivity(slug, "OPERATIONS", `Requisition ${r.id} declined — ${r.what}`, "owner");
    return NextResponse.json({ ok: true, requisition: r });
  }

  return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
}
