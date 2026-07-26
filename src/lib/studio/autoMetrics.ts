/**
 * Automation metrics — the measured facts a rule is allowed to fire on.
 *
 * Every metric here is derived from something the platform actually observed:
 * stock we hold, orders that arrived, agent reads we logged, unit costs and
 * expenses the owner entered. A metric that cannot be computed honestly returns
 * `null` (not 0) so the engine skips the rule and says why, instead of firing
 * on a fabricated zero.
 */

import type { AutoMetric } from "./automationRepo";

export type MetricMap = Record<AutoMetric, number | null>;

type P = { sku?: string; name: string; price: string; priceValue?: number | null; availability?: string; stock?: number | null; kind?: string };

export function measureMetrics(input: {
  products: P[];
  agents: number;
  orders: {
    count: number; revenue: number;
    bySku: Record<string, { qty: number; revenue: number }>;
    recent: { status: string }[];
    daily: { d: string; revenue: number }[];
  };
  costs: Record<string, number>;
  expenses: { total: number; byMonth: Record<string, number> };
}): MetricMap {
  const { products, agents, orders, costs, expenses } = input;
  // Only the sellable shelf: pre-orders have no stock to run out of and retired
  // products must not drag a stock metric down forever.
  const sellable = products.filter((p) => p.availability !== "PreOrder" && p.availability !== "Discontinued");
  // Stock only exists for physical goods — an hour of work never runs out.
  const stocked = sellable.filter((p) => (p.kind ?? "good") === "good");

  // Stock: an unknown level is not a low level — fall back to the neutral 24.
  const minStock = stocked.length ? Math.min(...stocked.map((p) => p.stock ?? 24)) : null;

  // Margin + net profit need a unit cost on every sku still on the shelf,
  // else they are unknown. (COGS below still counts retired products that sold.)
  const costed = sellable.filter((p) => costs[p.sku ?? ""] != null);
  const marginKnown = sellable.length > 0 && costed.length === sellable.length;
  const cogs = Object.entries(orders.bySku).reduce((a, [name, v]) => {
    const p = products.find((x) => x.name === name);
    const c = p?.sku ? costs[p.sku] : undefined;
    return c == null ? a : a + c * v.qty;
  }, 0);
  const marginPct = marginKnown && orders.revenue > 0
    ? Math.round(((orders.revenue - cogs) / orders.revenue) * 100) : null;
  const netProfit = marginKnown ? Math.round(orders.revenue - cogs - expenses.total) : null;

  // Days of stock: units sold per day over the observed selling window, applied
  // to the thinnest sku. Without a single sale there is no velocity to measure.
  let daysOfStock: number | null = null;
  if (orders.daily.length) {
    const days = [...orders.daily].map((d) => d.d).sort();
    const first = Date.parse(`${days[0]}T00:00:00Z`);
    const windowDays = Math.max(1, Math.round((Date.now() - first) / 86400000) + 1);
    const cover: number[] = [];
    for (const p of stocked) {
      const qty = orders.bySku[p.name]?.qty ?? 0;
      if (qty <= 0) continue;                       // never sold → no velocity
      const perDay = qty / windowDays;
      // Unknown stock reads as the platform's neutral 24, never as zero —
      // a missing number must not masquerade as "out of stock".
      cover.push(Math.round((p.stock ?? 24) / perDay));
    }
    if (cover.length) daysOfStock = Math.min(...cover);
  }

  // How well the agent audience converts. Meaningless with no agent reads.
  const agentOrderRate = agents > 0 ? Math.round((orders.count / agents) * 100) : null;

  // This calendar month's net movement: measured orders in, recorded costs out.
  const month = new Date().toISOString().slice(0, 7);
  const inflow = orders.daily.filter((d) => d.d.startsWith(month)).reduce((a, d) => a + d.revenue, 0);
  const outflow = expenses.byMonth[month] ?? 0;
  const cashFlowMonth = inflow || outflow ? Math.round(inflow - outflow) : null;

  return {
    min_stock: minStock,
    revenue: Math.round(orders.revenue),
    agent_reads: agents,
    pending_orders: orders.recent.filter((o) => o.status === "received").length,
    margin_pct: marginPct,
    net_profit: netProfit,
    days_of_stock: daysOfStock,
    agent_order_rate: agentOrderRate,
    cash_flow_month: cashFlowMonth,
  };
}
