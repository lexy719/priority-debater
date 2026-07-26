import { NextResponse } from "next/server";
import { recordActivity } from "@/lib/studio/activityRepo";
import { evaluateAutomations, listAutomations } from "@/lib/studio/automationRepo";
import { measureMetrics } from "@/lib/studio/autoMetrics";
import { loadCosts } from "@/lib/studio/costRepo";
import { listExpenses, summarizeExpenses } from "@/lib/studio/expenseRepo";
import { loadTraffic } from "@/lib/studio/hitRepo";
import { loadOrdersSummary } from "@/lib/studio/orderRepo";
import { listStores, loadStore } from "@/lib/studio/storeRepo";

/**
 * /api/commerce/tick — the OS's heartbeat.
 *
 * Until now the workforce only acted when a human opened the command centre,
 * which is a strange kind of autonomy. This endpoint does the same evaluation
 * pass with nobody watching: measure every business, run the armed rules,
 * report what fired or what is being held for approval.
 *
 * Deliberate limits:
 *  · It spends NO AI tokens. Everything here is deterministic; the expensive
 *    passes (situation report, learning) stay explicit owner actions.
 *  · A quiet tick writes nothing to the ledger — a log full of "nothing
 *    happened" would bury the entries that matter.
 *  · If CRON_SECRET is set, a caller must present it (`?key=` or
 *    `Authorization: Bearer`). Unset in development so it can be run by hand.
 *
 * Scheduling lives outside the app (vercel.json cron / any scheduler). Nothing
 * about the platform assumes the tick runs — it makes the OS punctual, not
 * dependent.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type TickResult = {
  slug: string;
  fired: string[];
  held: string[];
  rules: number;
  metrics: Record<string, number | null>;
};

function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const url = new URL(req.url);
  const key = url.searchParams.get("key") ?? "";
  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  return key === secret || bearer === secret;
}

async function tickOne(slug: string): Promise<TickResult | null> {
  const [store, traffic, orders, costs, expenseRows] = await Promise.all([
    loadStore(slug), loadTraffic(slug), loadOrdersSummary(slug), loadCosts(slug), listExpenses(slug),
  ]);
  if (!store) return null;
  const expenses = summarizeExpenses(expenseRows);
  const metrics = measureMetrics({
    products: store.store.products, agents: traffic.agents, orders, costs,
    expenses: { total: expenses.total, byMonth: expenses.byMonth },
  });
  const fired = await evaluateAutomations(slug, metrics);
  const rules = await listAutomations(slug);
  const held = rules.filter((r) => r.pending).map((r) => r.id);
  // Only speak when something happened.
  if (fired.length) {
    await recordActivity(slug, "SYSTEM", `Scheduled pass: ${fired.length} rule(s) fired — ${fired.join(", ")}`);
  }
  return { slug, fired, held, rules: rules.length, metrics };
}

async function run(req: Request) {
  if (!authorised(req)) return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  const slug = new URL(req.url).searchParams.get("slug");
  const targets = slug ? [slug] : (await listStores()).map((s) => s.slug);

  const results: TickResult[] = [];
  for (const s of targets) {
    try {
      const r = await tickOne(s);
      if (r) results.push(r);
    } catch { /* one broken business must not stop the pass */ }
  }
  const fired = results.reduce((a, r) => a + r.fired.length, 0);
  const held = results.reduce((a, r) => a + r.held.length, 0);
  return NextResponse.json({
    ok: true,
    ts: new Date().toISOString(),
    businesses: results.length,
    firedTotal: fired,
    heldTotal: held,
    quiet: fired === 0 && held === 0,
    results,
  }, { headers: { "cache-control": "no-store" } });
}

export const GET = run;
export const POST = run;
