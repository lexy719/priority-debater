/**
 * The operator statement — PDR Commerce's proof of work.
 *
 * Nobody pays for "autonomy"; they pay for work they can check. So once a
 * period closes, the OS states plainly what it DID, what it MEASURED, what the
 * money did, and what still needs the owner — every line traceable to a ledger
 * entry, an order id or a logged agent read.
 *
 * Three rules keep it a statement rather than a brochure:
 *  · Only measured facts. Nothing modelled, nothing extrapolated.
 *  · No invented hours-saved. We count the actions and say we do not price them.
 *  · Silence is reported. A quiet week reads as a quiet week.
 */

import { listActivity, type Activity } from "./activityRepo";
import { listAutomations } from "./automationRepo";
import { listCampaigns } from "./campaignRepo";
import { loadCosts } from "./costRepo";
import { listExpenses, summarizeExpenses } from "./expenseRepo";
import { listHits } from "./hitRepo";
import { listLandings } from "./landingRepo";
import { loadCustomers, loadOrdersSummary } from "./orderRepo";
import { isStocked } from "./aiStorefront";
import { loadStore } from "./storeRepo";

/** The kinds of work the workforce actually performs, in the owner's words. */
export const WORK_KINDS = [
  "orders taken", "orders advanced", "stock corrected", "prices moved",
  "catalogue changed", "marketing written", "campaigns steered",
  "learning passes", "situation reports", "rules fired", "books kept",
] as const;
export type WorkKind = (typeof WORK_KINDS)[number];

/** Classify a ledger line into one kind of work. The log is written by the
    routes themselves, so this reads our own vocabulary — anything unrecognised
    is reported as "other", never silently dropped. */
export function classifyWork(txt: string): WorkKind | "other" {
  const t = txt.toLowerCase();
  if (/^order .* received/.test(t) || /order .* received over mcp/.test(t)) return "orders taken";
  if (/order .* → (confirmed|shipped|delivered|cancelled)/.test(t)) return "orders advanced";
  if (/restock|stock \d|outofstock|out of stock/.test(t)) return "stock corrected";
  if (/repriced|price|prices/.test(t)) return "prices moved";
  if (/product added|retired|back on the shelf|updated —|availability/.test(t)) return "catalogue changed";
  if (/draft|copy|post|variant|landing/.test(t)) return "marketing written";
  if (/campaign/.test(t)) return "campaigns steered";
  if (/learn|distill|rule.*(taught|learned)|brain/.test(t)) return "learning passes";
  if (/analys|situation/.test(t)) return "situation reports";
  if (/^aut-|automation|⚠/.test(t)) return "rules fired";
  if (/expense|cost/.test(t)) return "books kept";
  return "other";
}

export type StatementPeriod = { from: string; to: string; days: number; label: string };

export type OperatorStatement = {
  slug: string;
  business: { name: string; mark: string; url: string };
  generatedAt: string;
  period: StatementPeriod;
  /** What the workforce did, counted and evidenced. */
  work: {
    total: number;
    /** Ran with nobody watching: order intake, a fired rule, a scheduled pass. */
    unattended: number;
    /** The owner asked; the OS carried it out. Real work, but not autonomy. */
    directed: number;
    /** Logged before the ledger recorded who started it — never guessed. */
    unattributed: number;
    byKind: { kind: string; count: number }[];
    byWorker: { worker: string; count: number }[];
    /** The actual ledger lines, newest first — the evidence. */
    lines: { ts: string; worker: string; txt: string; kind: string; by: string }[];
    note: string;
  };
  /** What was measured in the period. */
  measured: {
    agentReads: number;
    humanReads: number;
    byAgent: { agent: string; reads: number }[];
    /** Which surfaces were read: store · product · feed · llms · catalog. */
    bySurface: { surface: string; reads: number }[];
    orders: number;
    revenue: number;
    agentOrders: number;
    newCustomers: number;
    landingViews: number;
    note: string;
  };
  /** The money, in the period where the data is period-scoped and lifetime
      where it is not — each figure says which. */
  money: {
    revenuePeriod: number;
    revenueLifetime: number;
    cogsLifetime: number | null;
    marginPctLifetime: number | null;
    expensesPeriod: number;
    netPeriod: number | null;
    standingMonthlyCost: number;
    note: string;
  };
  /** What the OS could not do alone. */
  needsYou: { heldPlans: { id: string; reason: string; plan: string[] }[]; gaps: string[] };
  /** Honest limits of this document. */
  limits: string[];
};

function periodFor(weeks: number): StatementPeriod {
  const to = new Date();
  const from = new Date(to.getTime() - weeks * 7 * 86400000);
  return {
    from: from.toISOString(), to: to.toISOString(), days: weeks * 7,
    label: weeks === 1 ? "the last 7 days" : `the last ${weeks * 7} days`,
  };
}

export async function buildStatement(slug: string, weeks = 1): Promise<OperatorStatement | null> {
  const store = await loadStore(slug);
  if (!store) return null;
  const period = periodFor(Math.max(1, Math.min(12, Math.round(weeks))));
  const since = Date.parse(period.from);

  const [activity, hits, orders, customers, costs, expenseRows, campaigns, landings, rules] = await Promise.all([
    listActivity(slug, 200), listHits(slug), loadOrdersSummary(slug), loadCustomers(slug),
    loadCosts(slug), listExpenses(slug), listCampaigns(slug), listLandings(slug), listAutomations(slug),
  ]);

  /* ── what the workforce did ─────────────────────────────────────────────── */
  const inPeriod = (ts: string) => Date.parse(ts) >= since;
  const acts: Activity[] = activity.filter((a) => inPeriod(a.ts));
  const kindCounts = new Map<string, number>();
  const workerCounts = new Map<string, number>();
  for (const a of acts) {
    const k = classifyWork(a.txt);
    kindCounts.set(k, (kindCounts.get(k) ?? 0) + 1);
    workerCounts.set(a.worker, (workerCounts.get(a.worker) ?? 0) + 1);
  }

  /* ── what was measured ──────────────────────────────────────────────────── */
  const reads = hits.filter((h) => inPeriod(h.ts));
  const agentReadRows = new Map<string, number>();
  const readsByKind = new Map<string, number>();
  let humanReads = 0;
  for (const h of reads) {
    readsByKind.set(h.kind, (readsByKind.get(h.kind) ?? 0) + 1);
    if (h.agent === "HUMAN") humanReads++;
    else agentReadRows.set(h.agent, (agentReadRows.get(h.agent) ?? 0) + 1);
  }
  const periodOrders = orders.recent.filter((o) => inPeriod(o.ts));
  const revenuePeriod = orders.daily
    .filter((d) => Date.parse(`${d.d}T23:59:59Z`) >= since)
    .reduce((a, d) => a + d.revenue, 0);
  const newCustomers = customers.filter((c) => inPeriod(c.lastTs) && c.orders === 1).length;
  const landingViews = landings.reduce((a, l) => a + (l.views ?? 0), 0);

  /* ── the money ──────────────────────────────────────────────────────────── */
  const products = store.store.products.filter((p) => p.availability !== "Discontinued");
  const costed = products.filter((p) => costs[p.sku ?? ""] != null);
  const marginKnown = products.length > 0 && costed.length === products.length;
  const cogs = Object.entries(orders.bySku).reduce((a, [name, v]) => {
    const p = products.find((x) => x.name === name);
    const c = p?.sku ? costs[p.sku] : undefined;
    return c == null ? a : a + c * v.qty;
  }, 0);
  const expenses = summarizeExpenses(expenseRows);
  const expensesPeriod = expenseRows
    .filter((e) => Date.parse(`${e.date}T00:00:00Z`) >= since)
    .reduce((a, e) => a + e.amount, 0)
    // A standing monthly cost is charged pro-rata to the period it covers.
    + Math.round((expenses.monthlyRecurring / 30) * period.days);

  /* ── what needs the owner ───────────────────────────────────────────────── */
  const heldPlans = rules.filter((r) => r.pending).map((r) => ({ id: r.id, reason: r.pending!.reason, plan: r.pending!.plan }));
  const gaps: string[] = [];
  if (!marginKnown) gaps.push(`Unit costs are missing on ${products.length - costed.length} of ${products.length} sellables — margin and net profit stay unknown until they are entered.`);
  if (expenses.count === 0) gaps.push("No operating expenses recorded — the statement can show revenue but not profit.");
  if (campaigns.some((c) => c.variants.some((v) => v.impressions == null)) ) gaps.push("No advertising channel is connected, so campaign performance is unmeasured — creative and structure exist, results do not.");
  const stocked = products.filter((p) => isStocked(p.kind));
  const low = stocked.filter((p) => (p.stock ?? 24) <= 3);
  if (low.length) gaps.push(`${low.length} sellable(s) at or below 3 units: ${low.map((p) => p.name).join(", ")}.`);
  const noProv = products.filter((p) => !p.provenance?.material && !p.provenance?.origin);
  if (noProv.length) gaps.push(`${noProv.length} sellable(s) declare no provenance — agents buying under a constraint cannot match them.`);

  return {
    slug,
    business: { name: store.store.brand.fullName, mark: store.store.brand.name, url: `/store/${slug}` },
    generatedAt: new Date().toISOString(),
    period,
    work: {
      total: acts.length,
      unattended: acts.filter((a) => a.by === "auto").length,
      directed: acts.filter((a) => a.by === "owner").length,
      unattributed: acts.filter((a) => a.by == null).length,
      byKind: [...kindCounts.entries()].map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count),
      byWorker: [...workerCounts.entries()].map(([worker, count]) => ({ worker, count })).sort((a, b) => b.count - a.count),
      lines: acts.map((a) => ({ ts: a.ts, worker: a.worker, txt: a.txt, kind: classifyWork(a.txt), by: a.by ?? "unattributed" })),
      note: acts.length
        ? "Every line above is a ledger entry written when the work happened, tagged with who set it in motion. UNATTENDED means nobody was watching — an order arriving, a rule firing, a scheduled pass. DIRECTED means you asked and the OS did it: real work, but not autonomy, and it would be dishonest to bill it as such. PDR does not estimate what any of it would have cost you in hours."
        : "Nothing was done in this period. A quiet week is reported as a quiet week.",
    },
    measured: {
      agentReads: reads.length - humanReads,
      humanReads,
      byAgent: [...agentReadRows.entries()].map(([agent, r]) => ({ agent, reads: r })).sort((a, b) => b.reads - a.reads),
      bySurface: [...readsByKind.entries()].map(([surface, r]) => ({ surface, reads: r })).sort((a, b) => b.reads - a.reads),
      orders: periodOrders.length,
      revenue: Math.round(revenuePeriod),
      agentOrders: periodOrders.filter((o) => o.channel === "agent-json").length,
      newCustomers,
      landingViews,
      note: "Reads are classified from the user-agent of each request to a store surface; orders are counted from real order ids. Landing views are lifetime, not period-scoped.",
    },
    money: {
      revenuePeriod: Math.round(revenuePeriod),
      revenueLifetime: Math.round(orders.revenue),
      cogsLifetime: marginKnown ? Math.round(cogs) : null,
      marginPctLifetime: marginKnown && orders.revenue > 0 ? Math.round(((orders.revenue - cogs) / orders.revenue) * 100) : null,
      expensesPeriod: Math.round(expensesPeriod),
      netPeriod: marginKnown ? Math.round(revenuePeriod - (orders.revenue > 0 ? cogs * (revenuePeriod / orders.revenue) : 0) - expensesPeriod) : null,
      standingMonthlyCost: expenses.monthlyRecurring,
      note: "Revenue is period-scoped from daily order totals. COGS and margin are lifetime, because unit costs apply to everything sold so far. Standing monthly costs are charged pro-rata to the period.",
    },
    needsYou: { heldPlans, gaps },
    limits: [
      "Every number here is measured by this platform. Nothing is modelled, forecast or rounded up.",
      "Traffic and orders are only visible for surfaces PDR serves; anything happening on channels we are not connected to is absent, not zero.",
      "Hours and money saved are deliberately not estimated — the work is listed so you can price it yourself.",
    ],
  };
}
