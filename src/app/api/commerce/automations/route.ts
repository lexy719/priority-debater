import { NextResponse } from "next/server";
import { ownedStore } from "@/lib/commerce/owner";
import {
  ACTION_TYPES, addAutomation, approvePending, dismissPending, listAutomations, METRIC_META,
  previewAutomations, removeAutomation, toggleAutomation,
  type AutoAction, type AutoMetric, type AutoOp,
} from "@/lib/studio/automationRepo";
import { measureMetrics } from "@/lib/studio/autoMetrics";
import { loadCosts } from "@/lib/studio/costRepo";
import { listExpenses, summarizeExpenses } from "@/lib/studio/expenseRepo";
import { loadTraffic } from "@/lib/studio/hitRepo";
import { loadOrdersSummary } from "@/lib/studio/orderRepo";
import { loadStore } from "@/lib/studio/storeRepo";

/**
 * The Automation view's API:
 * GET    ?slug=[&preview=1]        → rules (+ dry run: what would fire right now)
 * POST   {slug, if, then, requireApproval} → arm a multi-step rule
 * PUT    {slug, id, op?}           → toggle | approve | dismiss a held plan
 * DELETE {slug, id}                → remove
 * Scheduled evaluation happens inside /api/commerce/business on every read.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METRICS = Object.keys(METRIC_META) as AutoMetric[];

/** The same measured metric map the business read uses — loaded independently
    so a dry run is honest about the state right now. */
async function currentMetrics(slug: string) {
  const [store, traffic, orders, costs, expenseRows] = await Promise.all([
    loadStore(slug), loadTraffic(slug), loadOrdersSummary(slug), loadCosts(slug), listExpenses(slug),
  ]);
  if (!store) return null;
  return measureMetrics({
    products: store.store.products, agents: traffic.agents, orders, costs,
    expenses: summarizeExpenses(expenseRows),
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") ?? "";
  const own = await ownedStore(slug);
  if (!own.ok) return NextResponse.json({ ok: false, error: own.error }, { status: own.status });
  const rules = await listAutomations(slug);
  if (url.searchParams.get("preview") !== "1") {
    return NextResponse.json({ ok: true, rules }, { headers: { "cache-control": "no-store" } });
  }
  const metrics = await currentMetrics(slug);
  if (!metrics) return NextResponse.json({ ok: false, error: "store not found" }, { status: 404 });
  return NextResponse.json(
    { ok: true, rules, metrics, preview: await previewAutomations(slug, metrics) },
    { headers: { "cache-control": "no-store" } },
  );
}

/** Keep only well-formed steps — an action the engine cannot really perform is
    never stored, so the plan the owner reads is the plan that runs. */
function sanitizeSteps(raw: unknown): AutoAction[] {
  if (!Array.isArray(raw)) return [];
  const out: AutoAction[] = [];
  for (const a of raw.slice(0, 4)) {
    if (!a || typeof a !== "object") continue;
    const t = (a as { type?: string }).type;
    if (!t || !ACTION_TYPES.includes(t as AutoAction["type"])) continue;
    if (t === "restock_low") {
      const qty = Math.round(Number((a as { qty?: number }).qty));
      if (!Number.isFinite(qty) || qty <= 0 || qty > 500) continue;
      out.push({ type: "restock_low", qty });
    } else if (t === "price_adjust_all" || t === "price_adjust_sku") {
      const pct = Number((a as { pct?: number }).pct);
      if (!Number.isFinite(pct) || pct === 0 || Math.abs(pct) > 20) continue;
      if (t === "price_adjust_all") out.push({ type: "price_adjust_all", pct });
      else {
        const sku = String((a as { sku?: string }).sku ?? "").slice(0, 64);
        if (!sku) continue;
        out.push({ type: "price_adjust_sku", sku, pct });
      }
    } else if (t === "alert") {
      const note = String((a as { note?: string }).note ?? "").slice(0, 120);
      out.push(note ? { type: "alert", note } : { type: "alert" });
    } else {
      out.push({ type: t as "pause_campaigns" | "flag_stock_out" });
    }
  }
  return out;
}

export async function POST(req: Request) {
  let body: { slug?: string; if?: { metric?: string; op?: string; value?: number }; then?: unknown; requireApproval?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const slug = String(body.slug ?? "");
  const own = await ownedStore(slug);
  if (!own.ok) return NextResponse.json({ ok: false, error: own.error }, { status: own.status });
  const metric = body.if?.metric as AutoMetric;
  const op = body.if?.op as AutoOp;
  const value = Number(body.if?.value);
  const then = sanitizeSteps(body.then);
  if (!slug || !METRICS.includes(metric) || !["<", ">"].includes(op) || !Number.isFinite(value) || then.length === 0) {
    return NextResponse.json({ ok: false, error: "a rule needs a measured metric, a threshold and at least one valid step" }, { status: 400 });
  }
  const rules = await addAutomation(slug, {
    enabled: true, if: { metric, op, value }, then, requireApproval: body.requireApproval === true,
  });
  return NextResponse.json({ ok: true, rules });
}

export async function PUT(req: Request) {
  let body: { slug?: string; id?: string; op?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const slug = String(body.slug ?? "");
  const own = await ownedStore(slug);
  if (!own.ok) return NextResponse.json({ ok: false, error: own.error }, { status: own.status });
  const id = String(body.id ?? "");
  const op = String(body.op ?? "toggle");
  const rules = op === "approve" ? await approvePending(slug, id)
    : op === "dismiss" ? await dismissPending(slug, id)
    : await toggleAutomation(slug, id);
  return NextResponse.json({ ok: true, rules });
}

export async function DELETE(req: Request) {
  let body: { slug?: string; id?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const slug = String(body.slug ?? "");
  const own = await ownedStore(slug);
  if (!own.ok) return NextResponse.json({ ok: false, error: own.error }, { status: own.status });
  const rules = await removeAutomation(slug, String(body.id ?? ""));
  return NextResponse.json({ ok: true, rules });
}
