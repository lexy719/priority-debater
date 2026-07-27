import { NextResponse } from "next/server";
import { listActivity } from "@/lib/studio/activityRepo";
import { loadAftercare } from "@/lib/studio/aftercareRepo";
import { listDeliveries } from "@/lib/studio/deliveryRepo";
import { evaluateAutomations, listAutomations } from "@/lib/studio/automationRepo";
import { measureMetrics } from "@/lib/studio/autoMetrics";
import { loadBrain } from "@/lib/studio/brainRepo";
import { loadCosts } from "@/lib/studio/costRepo";
import { listExpenses, summarizeExpenses } from "@/lib/studio/expenseRepo";
import { loadTraffic } from "@/lib/studio/hitRepo";
import { loadCustomers, loadOrdersSummary } from "@/lib/studio/orderRepo";
import { currentOwnerId } from "@/lib/commerce/owner";
import { listStoresFor } from "@/lib/studio/storeRepo";
import { loadBusinessStore } from "@/lib/studio/businessSource";

/**
 * GET /api/commerce/business[?slug=] — the SHARED BUSINESS INTELLIGENCE layer.
 *
 * One read assembling everything PDR Commerce's AI workers operate on: the
 * company Studio created (kit-derived store + catalog), measured agent traffic,
 * received orders, and the brain (all rule layers + visual world). Also runs
 * the deterministic half of the DECIDE stage: worker PROPOSALS derived from
 * the data — surfaced for owner review, never auto-executed.
 * Commerce never invents a new company; it evolves the one Studio created.
 */

export const dynamic = "force-dynamic";

type Proposal = {
  /** The AI worker that raised it — Commerce is a workforce internally.
      SYSTEM covers the automation engine itself. */
  worker: "MARKETING" | "OPERATIONS" | "FINANCE" | "SYSTEM";
  severity: "act" | "watch" | "ok";
  label: string;
  /** Wire to an existing execute path when one exists (review-then-run). */
  action?: "brainlearn" | "brainseed";
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slugParam = url.searchParams.get("slug");
  // The register belongs to whoever is asking: their companies, or the demo
  // estate when nobody is signed in. Never both.
  const ownerId = await currentOwnerId();
  const roster = await listStoresFor(ownerId);
  const slug = slugParam && roster.some((r) => r.slug === slugParam) ? slugParam : roster[0]?.slug;
  if (!slug) return NextResponse.json({ ok: false, error: "no published businesses yet", roster: [] });

  const [store0, traffic, orders0, customers, costs, expenseRows] = await Promise.all([
    loadBusinessStore(slug), loadTraffic(slug), loadOrdersSummary(slug), loadCustomers(slug), loadCosts(slug), listExpenses(slug),
  ]);
  if (!store0) return NextResponse.json({ ok: false, error: "store not found", roster });
  const expenses = summarizeExpenses(expenseRows);

  // AUTOMATION: evaluate the owner's rules against measured metrics NOW —
  // fired rules mutate the store (restock, prices, availability) before we
  // snapshot it. Metrics are read from the state BEFORE the rule's own action,
  // which is the state the condition is actually about.
  const autoMetrics = measureMetrics({
    products: store0.store.products, agents: traffic.agents, orders: orders0, costs,
    expenses: { total: expenses.total, byMonth: expenses.byMonth },
  });
  const firedRules = await evaluateAutomations(slug, autoMetrics);
  const store = firedRules.length ? (await loadBusinessStore(slug)) ?? store0 : store0;
  const orders = orders0;
  const [activity, automations, deliveries, aftercare] = await Promise.all([
    listActivity(slug, 30), listAutomations(slug), listDeliveries(slug), loadAftercare(slug),
  ]);
  const code = store.store.brand.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const brain = await loadBrain(code);

  const rules = brain?.rules ?? [];
  const learned = rules.filter((r) => r.src === "learned");
  const company = rules.filter((r) => r.src === "company");
  // Signals, stock alarms, margin and inventory are about the SELLABLE shelf.
  // Retired products stay in the response (the Products view manages them) but
  // must not raise stock alarms or hold margin hostage to a cost nobody needs.
  const allProducts = store.store.products;
  const products = allProducts.filter((p) => p.availability !== "Discontinued");
  const retiredCount = allProducts.length - products.length;

  // ── THE FUNNEL: the journey an agent actually takes, measured at each step.
  //    Every stage is a count of real events, so a drop-off is a fact.
  const k = traffic.byKind;
  const discovery = (k["feed"] ?? 0) + (k["llms"] ?? 0) + (k["catalog"] ?? 0);
  const claimed = deliveries.filter((d) => d.claimedAt).length;
  const funnel = [
    { stage: "FOUND", label: "reached a discovery surface", n: discovery },
    { stage: "READ", label: "read the store or a product", n: (k["store"] ?? 0) + (k["product"] ?? 0) },
    { stage: "BOUGHT", label: "placed an order", n: orders.count },
    { stage: "DELIVERED", label: "received what they bought", n: deliveries.length },
    { stage: "COLLECTED", label: "opened the delivery", n: claimed },
    { stage: "ASKED", label: "came back with a question", n: aftercare.questions.length },
  ];

  // ── DECIDE (deterministic pass): what should the owner look at? ─────────
  const proposals: Proposal[] = [];
  const signal = traffic.agents + orders.count;

  // Marketing Agent observations
  if (!brain?.visual || company.length === 0) {
    proposals.push({ worker: "MARKETING", severity: "act", label: "Brain lacks company guidelines / visual world — seed them so every ad is business-specific", action: "brainseed" });
  }
  if (signal >= 5 && learned.length === 0) {
    proposals.push({ worker: "MARKETING", severity: "act", label: `${traffic.agents} agent reads + ${orders.count} orders unmined — distill learned rules from performance`, action: "brainlearn" });
  } else if (signal >= 5 && brain?.updatedAt && Date.now() - Date.parse(brain.updatedAt) > 24 * 3600_000) {
    proposals.push({ worker: "MARKETING", severity: "watch", label: "Learned rules are >24h old with fresh signal — re-run the learning pass", action: "brainlearn" });
  }
  if (traffic.agents >= 3 && orders.byAgent && Object.keys(orders.byAgent).length === 0) {
    proposals.push({ worker: "MARKETING", severity: "watch", label: `${traffic.agents} agent reads but zero agent orders — check feed pricing precision and CTA next-steps` });
  }
  const feedReads = traffic.byKind["feed"] ?? 0;
  if (traffic.agents > 0 && feedReads === 0) {
    proposals.push({ worker: "MARKETING", severity: "watch", label: "Agents read pages but never the product feed — feed not discovered yet (submission needs public hosting)" });
  }

  // Operations Agent observations
  const unpriced = products.filter((p) => p.priceValue == null);
  if (unpriced.length) {
    proposals.push({ worker: "OPERATIONS", severity: "act", label: `${unpriced.length} SKU(s) lack numeric price — agents filter on structured price (${unpriced.map((p) => p.sku).join(", ")})` });
  }
  const preorders = products.filter((p) => p.availability === "PreOrder");
  if (preorders.length > 1) {
    proposals.push({ worker: "OPERATIONS", severity: "watch", label: `${preorders.length} SKUs on PreOrder — verify availability accuracy (agents punish mismatch)` });
  }
  if (products.length < 4) {
    proposals.push({ worker: "OPERATIONS", severity: "watch", label: `Thin catalog (${products.length} SKUs) — agents compare; more coverage wins constraint queries` });
  }
  const orderedSkus = new Set(orders.recent.map((o) => o.productName));
  if (orders.count >= 2 && orderedSkus.size === 1) {
    proposals.push({ worker: "OPERATIONS", severity: "watch", label: `All ${orders.count} orders are "${[...orderedSkus][0]}" — single-SKU revenue concentration` });
  }
  // Inventory watch: the Ops Agent owns stock truthfulness.
  const out = products.filter((p) => (p.stock ?? 24) === 0 && p.availability !== "PreOrder");
  if (out.length) proposals.push({ worker: "OPERATIONS", severity: "act", label: `OUT OF STOCK: ${out.map((p) => p.name).join(", ")} — restock or retire; availability already flipped for agents` });
  const low = products.filter((p) => (p.stock ?? 24) > 0 && (p.stock ?? 24) <= 3);
  if (low.length) proposals.push({ worker: "OPERATIONS", severity: "watch", label: `Low stock (≤3): ${low.map((p) => `${p.name} (${p.stock})`).join(", ")}` });
  const pendingOrders = orders.recent.filter((o) => o.status === "received").length;
  if (pendingOrders) proposals.push({ worker: "OPERATIONS", severity: "act", label: `${pendingOrders} order(s) awaiting confirmation — advance them in ORDER FLOW` });
  // ── FINANCIAL INTELLIGENCE ─────────────────────────────────────────────
  // Revenue is measured; COST is owner knowledge. Without costs we report
  // revenue + inventory at price and say margin is unavailable — never guessed.
  const costed = products.filter((p) => costs[p.sku ?? ""] != null);
  const invAtPrice = products.reduce((a, p) => a + (p.priceValue ?? 0) * (p.stock ?? 0), 0);
  const invAtCost = products.reduce((a, p) => a + (costs[p.sku ?? ""] ?? 0) * (p.stock ?? 0), 0);
  const cogs = Object.entries(orders.bySku).reduce((a, [name, v]) => {
    const p = products.find((x) => x.name === name);
    const c = p?.sku ? costs[p.sku] : undefined;
    return c == null ? a : a + c * v.qty;
  }, 0);
  const recurring = products.filter((p) => /\/(mo|yr)$/.test(p.price)).map((p) => p.name);
  const recurringRevenue = Object.entries(orders.bySku).reduce((a, [name, v]) => a + (recurring.includes(name) ? v.revenue : 0), 0);
  const marginKnown = costed.length === products.length && products.length > 0;
  // Cash flow: revenue per month (from orders) minus expenses per month.
  const revByMonth: Record<string, number> = {};
  for (const d of orders.daily) {
    const m = d.d.slice(0, 7);
    revByMonth[m] = (revByMonth[m] ?? 0) + d.revenue;
  }
  const months = [...new Set([...Object.keys(revByMonth), ...Object.keys(expenses.byMonth)])].sort().slice(-12);
  const cashFlow = months.map((m) => {
    const inflow = Math.round(revByMonth[m] ?? 0);
    const outflow = Math.round(expenses.byMonth[m] ?? 0);
    return { month: m, inflow, outflow, net: inflow - outflow };
  });
  const finance = {
    revenue: Math.round(orders.revenue),
    cogs: Math.round(cogs),
    grossProfit: marginKnown ? Math.round(orders.revenue - cogs) : null,
    marginPct: marginKnown && orders.revenue > 0 ? Math.round(((orders.revenue - cogs) / orders.revenue) * 100) : null,
    expenses: expenses.total,
    expensesByCategory: expenses.byCategory,
    monthlyRecurringCost: expenses.monthlyRecurring,
    expenseCount: expenses.count,
    // Net profit needs BOTH costs and expenses to mean anything; otherwise null.
    netProfit: marginKnown ? Math.round(orders.revenue - cogs - expenses.total) : null,
    cashFlow,
    runwayNote: expenses.monthlyRecurring > 0
      ? `€${expenses.monthlyRecurring}/mo standing costs`
      : "no standing costs recorded",
    inventoryAtPrice: Math.round(invAtPrice),
    inventoryAtCost: costed.length ? Math.round(invAtCost) : null,
    recurringRevenue: Math.round(recurringRevenue),
    oneOffRevenue: Math.round(orders.revenue - recurringRevenue),
    avgOrderValue: orders.count ? Math.round(orders.revenue / orders.count) : 0,
    costsOnFile: costed.length,
    skuCount: products.length,
    costs,
    perSku: products.map((p) => {
      const sold = orders.bySku[p.name]?.qty ?? 0;
      const rev = Math.round(orders.bySku[p.name]?.revenue ?? 0);
      const unitCost = p.sku ? costs[p.sku] ?? null : null;
      const unitMargin = unitCost != null && p.priceValue != null ? Math.round(p.priceValue - unitCost) : null;
      return {
        sku: p.sku, name: p.name, price: p.price, priceValue: p.priceValue ?? null, unitCost, unitMargin,
        marginPct: unitMargin != null && p.priceValue ? Math.round((unitMargin / p.priceValue) * 100) : null,
        sold, revenue: rev, profit: unitMargin != null ? unitMargin * sold : null,
        recurring: /\/(mo|yr)$/.test(p.price),
      };
    }),
  };
  // Finance worker proposals — only from real numbers.
  if (products.length && costed.length === 0) {
    proposals.push({ worker: "FINANCE", severity: "watch", label: `No unit costs on file for ${products.length} SKUs — add them in Finance to unlock margin, COGS and true inventory value` });
  } else if (costed.length && costed.length < products.length) {
    proposals.push({ worker: "FINANCE", severity: "watch", label: `Costs missing for ${products.length - costed.length} of ${products.length} SKUs — margin is partial until all are set` });
  }
  if (marginKnown && finance.marginPct != null && finance.marginPct < 30 && orders.count > 0) {
    proposals.push({ worker: "FINANCE", severity: "act", label: `Gross margin ${finance.marginPct}% on €${finance.revenue} revenue — review pricing or unit costs` });
  }
  const thinMargin = finance.perSku.filter((p) => p.marginPct != null && p.marginPct < 20);
  if (thinMargin.length) {
    proposals.push({ worker: "FINANCE", severity: "watch", label: `Thin margin (<20%): ${thinMargin.map((p) => `${p.name} (${p.marginPct}%)`).join(", ")}` });
  }
  // Expense-side findings — only from recorded entries, never modelled.
  if (expenses.count === 0) {
    proposals.push({ worker: "FINANCE", severity: "watch", label: "No expenses recorded — add them in Finance to see net profit and cash flow, not just gross margin" });
  }
  if (finance.netProfit != null && finance.netProfit < 0) {
    proposals.push({ worker: "FINANCE", severity: "act", label: `Net loss of €${Math.abs(finance.netProfit)} — €${finance.revenue} revenue against €${finance.cogs} COGS and €${finance.expenses} expenses` });
  }
  const lastMonth = finance.cashFlow[finance.cashFlow.length - 1];
  if (lastMonth && lastMonth.net < 0 && lastMonth.outflow > 0) {
    proposals.push({ worker: "FINANCE", severity: "watch", label: `${lastMonth.month} cash flow negative: €${lastMonth.inflow} in, €${lastMonth.outflow} out` });
  }
  const openReturns = aftercare.returns.filter((r) => r.status === "requested");
  if (openReturns.length) {
    proposals.push({ worker: "OPERATIONS", severity: "act", label: `${openReturns.length} return request(s) waiting on you — ${openReturns.map((r) => `${r.id} (${r.verdict.slice(0, 40)}…)`).join(", ")}` });
  }
  const escalated = aftercare.questions.filter((q) => q.escalated);
  if (escalated.length) {
    proposals.push({ worker: "OPERATIONS", severity: "act", label: `${escalated.length} customer question(s) nobody could answer — "${escalated[escalated.length - 1].question.slice(0, 60)}"` });
  }
  const unclaimed = deliveries.filter((d) => !d.claimedAt);
  if (unclaimed.length) {
    proposals.push({ worker: "OPERATIONS", severity: "watch", label: `${unclaimed.length} delivery(ies) paid for but never opened — the buyer may not have received the link` });
  }
  const pendingDelivery = deliveries.filter((d) => d.kind === "pending");
  if (pendingDelivery.length) {
    proposals.push({ worker: "OPERATIONS", severity: "act", label: `${pendingDelivery.length} order(s) delivered with NOTHING attached — attach a file or let PDR produce one` });
  }

  // A rule that triggered but holds for approval IS a decision waiting on the
  // owner — it belongs in the review queue, not buried in the Automation view.
  for (const r of automations.filter((x) => x.pending)) {
    proposals.push({ worker: "SYSTEM", severity: "act", label: `${r.id} is holding a ${r.then.length}-step plan for approval — ${r.pending!.reason}` });
  }
  if (proposals.length === 0) {
    proposals.push({ worker: "OPERATIONS", severity: "ok", label: "No corrective actions pending — business nominal" });
  }

  return NextResponse.json({
    ok: true,
    roster,
    /** Whose register this is. `demo` = the built-in example businesses, shown
        because nobody is signed in — never presented as the visitor's own. */
    estate: ownerId ? "owned" : "demo",
    business: {
      slug, code,
      brand: store.store.brand,
      spec: store.spec,
      source: store.source,
      createdAt: store.createdAt,
      catalog: allProducts.map((p) => ({ sku: p.sku, name: p.name, price: p.price, priceValue: p.priceValue, availability: p.availability ?? "InStock", category: p.category, stock: p.stock ?? 24, provenance: p.provenance, kind: p.kind, unit: p.unit })),
      retiredCount,
      manifest: store.manifest,
    },
    traffic, orders, customers, activity, finance, funnel,
    aftercare: {
      returns: aftercare.returns.slice(-10).reverse(),
      questions: aftercare.questions.slice(-10).reverse(),
      openReturns: openReturns.length,
      escalated: escalated.length,
    },
    deliveries: {
      total: deliveries.length, claimed, unclaimed: deliveries.length - claimed,
      pending: pendingDelivery.length,
      recent: deliveries.slice(0, 8).map((d) => ({ token: d.token, orderId: d.orderId, productName: d.productName, kind: d.kind, issuedAt: d.issuedAt, claimedAt: d.claimedAt, claims: d.claims })),
    },
    automations: {
      count: automations.length, enabled: automations.filter((r) => r.enabled).length,
      fired: firedRules, held: automations.filter((r) => r.pending).map((r) => r.id),
      metrics: autoMetrics,
    },
    brain: brain ? {
      updatedAt: brain.updatedAt,
      counts: { core: rules.filter((r) => r.src === "core").length, company: company.length, taught: rules.filter((r) => r.src === "taught").length, learned: learned.length },
      learned, visual: brain.visual ?? null,
    } : null,
    proposals,
  }, { headers: { "cache-control": "no-store" } });
}
