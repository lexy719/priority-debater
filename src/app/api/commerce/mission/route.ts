import { NextResponse } from "next/server";
import { listActivity } from "@/lib/studio/activityRepo";
import { loadAftercare } from "@/lib/studio/aftercareRepo";
import { isStocked } from "@/lib/studio/aiStorefront";
import { loadBusiness } from "@/lib/studio/businessSource";
import { loadBrain } from "@/lib/studio/brainRepo";
import { assessDepartments, businessStatus, type Snapshot } from "@/lib/studio/departmentStatus";
import { listDeliveries } from "@/lib/studio/deliveryRepo";
import { loadCosts } from "@/lib/studio/costRepo";
import { loadTraffic } from "@/lib/studio/hitRepo";
import { loadOrdersSummary } from "@/lib/studio/orderRepo";
import { authoritySummary, loadPermissions } from "@/lib/studio/permissionRepo";
import { currentOwnerId } from "@/lib/commerce/owner";
import { listStoresFor } from "@/lib/studio/storeRepo";

/**
 * GET /api/commerce/mission[?slug=] — everything Mission Control shows.
 *
 * Architecture §11 and §12. One read: the business at a glance, the six
 * departments with a derived state and the sentence behind it, and each
 * department's recent work and open asks.
 *
 * Deliberately separate from /api/commerce/business, which is the deep
 * intelligence read the detail views use. Mission Control is the thing an owner
 * opens twenty times a day; it should assemble the smallest set of facts that
 * answers "is my business alright and does anything need me", and nothing else.
 *
 * Every figure here is counted. Nothing is estimated, and a department's state
 * always carries the measurement that produced it.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Today, in the store's own terms: since local midnight. */
function isToday(ts: string): boolean {
  const d = new Date(ts);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = await currentOwnerId();
  const roster = await listStoresFor(ownerId);
  const asked = url.searchParams.get("slug");
  const slug = asked && roster.some((r) => r.slug === asked) ? asked : roster[0]?.slug;
  if (!slug) return NextResponse.json({ ok: false, error: "no businesses yet", roster: [] });

  const [store, traffic, orders, costs, activity, deliveries, aftercare, perms] = await Promise.all([
    loadBusiness(slug), loadTraffic(slug), loadOrdersSummary(slug), loadCosts(slug),
    listActivity(slug, 60), listDeliveries(slug), loadAftercare(slug), loadPermissions(slug),
  ]);
  if (!store?.store) return NextResponse.json({ ok: false, error: "store not found", roster }, { status: 404 });

  const biz = store.store;
  const code = biz.store.brand.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const brain = await loadBrain(code);

  const live = biz.store.products.filter((p) => p.availability !== "Discontinued");
  const stocked = live.filter((p) => isStocked(p.kind));
  const outSkus = stocked.filter((p) => (p.stock ?? 0) <= 0 || p.availability === "OutOfStock").map((p) => p.sku ?? p.name);
  const lowSkus = stocked.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).map((p) => p.sku ?? p.name);

  // Margin only means something when every sellable SKU has a cost on file;
  // a partial figure would read as fact.
  const costed = live.filter((p) => p.sku && costs[p.sku] != null);
  const marginKnown = costed.length === live.length && live.length > 0 && orders.revenue > 0;
  const cogs = live.reduce((a, p) => {
    const sold = orders.bySku[p.name]?.qty ?? 0;
    return a + (p.sku && costs[p.sku] != null ? costs[p.sku] * sold : 0);
  }, 0);

  const retrieved = new Set(Object.keys(traffic.byProduct ?? {}));
  const awaiting = orders.recent.filter((o) => o.status === "received").length;

  const snapshot: Snapshot = {
    activity: activity.map((a) => ({ ts: a.ts, worker: a.worker, text: a.txt, by: a.by })),
    proposals: [],
    orders: { count: orders.count, awaitingConfirmation: awaiting },
    finance: {
      revenue: Math.round(orders.revenue),
      settled: orders.settled,
      outstanding: Math.round(orders.revenue) - orders.settled,
      marginPct: marginKnown ? Math.round(((orders.revenue - cogs) / orders.revenue) * 100) : null,
      costsOnFile: costed.length,
      skuCount: live.length,
    },
    traffic: { agents: traffic.agents },
    stock: { lowSkus, outSkus, stockedCount: stocked.length },
    care: {
      openReturns: aftercare.returns.filter((r) => r.status === "requested").length,
      escalated: aftercare.questions.filter((q) => q.escalated && !q.answer).length,
      unclaimedDeliveries: deliveries.filter((d) => !d.claimedAt).length,
    },
    brain: brain ? {
      companyRules: brain.rules.filter((r) => r.src === "company").length,
      hasVisualWorld: Boolean(brain.visual),
    } : null,
    catalog: {
      sellable: live.length,
      neverRetrieved: live.filter((p) => !retrieved.has(p.sku ?? "")).length,
    },
  };

  const departments = assessDepartments(snapshot, perms.permissions);
  const status = businessStatus(departments);

  // "Today" figures are counted from today's orders only. When nothing has
  // happened today the answer is zero, stated as zero — not last week's number
  // quietly left on the board.
  const todays = orders.recent.filter((o) => isToday(o.ts));
  const todayRevenue = todays.reduce((a, o) => a + (Number(String(o.price).replace(/[^0-9.]/g, "")) || 0) * (o.qty ?? 1), 0);

  return NextResponse.json({
    ok: true,
    roster,
    business: {
      slug, name: biz.store.brand.fullName, code,
      domain: biz.store.brand.domain,
      kind: store.kind, canWrite: store.canWrite,
    },
    status,
    glance: {
      revenueToday: Math.round(todayRevenue),
      ordersToday: todays.length,
      // Profit is null, never zero, when it cannot be known. A zero here would
      // be read as "broke even".
      profit: marginKnown ? Math.round(orders.revenue - cogs) : null,
      profitNote: marginKnown ? null : `unit costs on file for ${costed.length} of ${live.length} products`,
      orders: orders.count,
      aiOrders: Object.values(orders.byAgent ?? {}).reduce((a: number, n) => a + (n as number), 0),
      settled: orders.settled,
      booked: Math.round(orders.revenue),
      agentReads: traffic.agents,
      departmentsArmed: authoritySummary(perms).armed,
      departmentsTotal: departments.length,
      warnings: departments.filter((d) => d.concern).length,
    },
    departments,
  }, { headers: { "cache-control": "no-store" } });
}
