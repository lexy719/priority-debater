/**
 * Automation engine — the owner-configured autonomy layer of PDR Commerce.
 *
 * A rule is IF <measured condition> THEN <ordered plan of steps>. Conditions
 * read only metrics the platform genuinely measured (see autoMetrics.ts); a
 * metric that cannot be computed skips the rule with a recorded reason rather
 * than firing on a fabricated zero. Steps execute in order, each one recording
 * its own outcome, so a plan is auditable step by step.
 *
 * Two safety properties matter as much as the actions:
 *  · REVIEW-FIRST — a rule marked `requireApproval` never acts on its own. It
 *    holds the plan, states what it would do, and waits for the owner.
 *  · NO STORMS — one firing per rule per hour, and every firing lands both in
 *    the rule's own audit trail and in the ops ledger.
 *
 * Blob-first with fs fallback, like every other repo.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { recordActivity } from "./activityRepo";
import { blobConfigured, getJson, putJson } from "./blobStore";
import { listCampaigns, setCampaignStatus } from "./campaignRepo";
import { loadStore, saveStore } from "./storeRepo";

export type AutoMetric =
  | "min_stock" | "revenue" | "agent_reads" | "pending_orders"
  | "margin_pct" | "net_profit" | "days_of_stock" | "agent_order_rate" | "cash_flow_month";

/** What each metric means, in the owner's words, plus its unit for the UI. */
export const METRIC_META: Record<AutoMetric, { label: string; unit: string; help: string }> = {
  min_stock: { label: "lowest stock level", unit: "units", help: "Units left on the thinnest sellable SKU." },
  revenue: { label: "total revenue", unit: "€", help: "All revenue measured from real orders." },
  agent_reads: { label: "agent reads", unit: "reads", help: "Times an AI agent read the store." },
  pending_orders: { label: "orders awaiting confirmation", unit: "orders", help: "Orders received but not yet advanced." },
  margin_pct: { label: "gross margin", unit: "%", help: "Needs a unit cost on every SKU, else the rule is skipped." },
  net_profit: { label: "net profit", unit: "€", help: "Revenue − COGS − recorded expenses. Needs costs on file." },
  days_of_stock: { label: "days of stock left", unit: "days", help: "Thinnest SKU at its measured sales velocity. Needs at least one sale." },
  agent_order_rate: { label: "agent order rate", unit: "per 100 reads", help: "Orders per 100 agent reads. Needs agent traffic." },
  cash_flow_month: { label: "this month's cash flow", unit: "€", help: "Measured orders in, recorded expenses out." },
};

export type AutoOp = "<" | ">";

export type AutoAction =
  | { type: "alert"; note?: string }
  | { type: "restock_low"; qty: number }
  | { type: "price_adjust_all"; pct: number }
  | { type: "price_adjust_sku"; sku: string; pct: number }
  | { type: "pause_campaigns" }
  | { type: "flag_stock_out" };

export const ACTION_TYPES: AutoAction["type"][] = [
  "alert", "restock_low", "price_adjust_all", "price_adjust_sku", "pause_campaigns", "flag_stock_out",
];

/** One step's result — the unit of the audit trail. */
export type StepOutcome = { type: string; ok: boolean; detail: string };
export type AutoRun = {
  ts: string;
  /** false = evaluated and deliberately did nothing (with a reason). */
  fired: boolean;
  reason: string;
  steps: StepOutcome[];
  /** true = plan held for approval instead of executed. */
  held?: boolean;
};

export type AutomationRule = {
  id: string;
  enabled: boolean;
  if: { metric: AutoMetric; op: AutoOp; value: number };
  then: AutoAction[];
  /** Review-first: hold the plan for the owner instead of executing it. */
  requireApproval?: boolean;
  lastFired?: string;
  /** A held plan waiting on the owner. */
  pending?: { ts: string; reason: string; plan: string[] };
  /** Per-rule audit, newest last, capped. */
  runs?: AutoRun[];
};

const DIR = path.join(process.cwd(), ".data", "automations");
const SLUG_RE = /^[a-z0-9-]{3,64}$/;
const COOLDOWN_MS = 3600_000;
const RUN_LOG_MAX = 8;

/* ── storage ───────────────────────────────────────────────────────────── */

async function readAll(slug: string): Promise<AutomationRule[]> {
  if (blobConfigured()) {
    const blob = await getJson<AutomationRule[]>(`automations/${slug}.json`);
    if (blob) return blob;
  }
  try { return JSON.parse(await fs.readFile(path.join(DIR, `${slug}.json`), "utf8")) as AutomationRule[]; } catch { return []; }
}

async function writeAll(slug: string, rules: AutomationRule[]): Promise<void> {
  if (blobConfigured()) { await putJson(`automations/${slug}.json`, rules); return; }
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, `${slug}.json`), JSON.stringify(rules, null, 2), "utf8");
}

export async function listAutomations(slug: string): Promise<AutomationRule[]> {
  return SLUG_RE.test(slug) ? readAll(slug) : [];
}

/* ── description (shared by the dry run, the held plan and the ledger) ──── */

function showValue(metric: AutoMetric, v: number): string {
  const u = METRIC_META[metric].unit;
  return u === "€" ? `€${v}` : u === "%" ? `${v}%` : `${v} ${u}`;
}

export function describeCondition(r: AutomationRule): string {
  return `${METRIC_META[r.if.metric].label} ${r.if.op === "<" ? "below" : "above"} ${showValue(r.if.metric, r.if.value)}`;
}

export function describeAction(a: AutoAction): string {
  switch (a.type) {
    case "alert": return `Raise a ledger alert${a.note ? ` — “${a.note}”` : ""}`;
    case "restock_low": return `Restock every SKU at 3 units or less, +${a.qty} units each`;
    case "price_adjust_all": return `Move every price ${a.pct > 0 ? "+" : ""}${a.pct}% (storefront + agent feeds)`;
    case "price_adjust_sku": return `Move ${a.sku} ${a.pct > 0 ? "+" : ""}${a.pct}%`;
    case "pause_campaigns": return "Pause every live campaign";
    case "flag_stock_out": return "Mark sold-out SKUs out of stock for agents";
  }
}

export function describePlan(r: AutomationRule): string[] {
  return r.then.map((a, i) => `${i + 1}. ${describeAction(a)}`);
}

/* ── mutation ──────────────────────────────────────────────────────────── */

export async function addAutomation(slug: string, rule: Omit<AutomationRule, "id">): Promise<AutomationRule[]> {
  const rules = await readAll(slug);
  const id = `AUT-${(rules.length + 1).toString().padStart(2, "0")}-${Math.abs(Date.now() % 10000)}`;
  const full = { ...rule, id };
  rules.push(full);
  await writeAll(slug, rules);
  await recordActivity(slug, "SYSTEM",
    `Automation ${id} armed: IF ${describeCondition(full)} THEN ${rule.then.length} step(s)${rule.requireApproval ? " — holds for approval" : ""}`);
  return rules;
}

export async function removeAutomation(slug: string, id: string): Promise<AutomationRule[]> {
  const rules = (await readAll(slug)).filter((r) => r.id !== id);
  await writeAll(slug, rules);
  return rules;
}

export async function toggleAutomation(slug: string, id: string): Promise<AutomationRule[]> {
  const rules = await readAll(slug);
  const r = rules.find((x) => x.id === id);
  if (r) { r.enabled = !r.enabled; await writeAll(slug, rules); }
  return rules;
}

/* ── evaluation ────────────────────────────────────────────────────────── */

type Metrics = Partial<Record<AutoMetric, number | null>>;

/** Why a rule did or did not fire — the honest verdict, reused by the dry run. */
function verdict(r: AutomationRule, metrics: Metrics): { fire: boolean; reason: string } {
  const m = METRIC_META[r.if.metric];
  if (!r.enabled) return { fire: false, reason: "rule disabled" };
  if (r.pending) return { fire: false, reason: "previous plan still awaiting approval" };
  const val = metrics[r.if.metric];
  if (val == null) return { fire: false, reason: `${m.label} is not measurable yet — ${m.help}` };
  if (r.lastFired && Date.now() - Date.parse(r.lastFired) < COOLDOWN_MS) {
    const mins = Math.ceil((COOLDOWN_MS - (Date.now() - Date.parse(r.lastFired))) / 60000);
    return { fire: false, reason: `cooling down for ${mins} more minute(s)` };
  }
  const hit = r.if.op === "<" ? val < r.if.value : val > r.if.value;
  const shown = showValue(r.if.metric, val);
  const threshold = showValue(r.if.metric, r.if.value);
  return hit
    ? { fire: true, reason: `${m.label} is ${shown} — ${r.if.op === "<" ? "below" : "above"} the ${threshold} threshold` }
    : { fire: false, reason: `${m.label} is ${shown} — ${r.if.op === "<" ? "not below" : "not above"} ${threshold}` };
}

/** Run one plan, step by step. Each step reports its own outcome; a failing
    step is recorded and the plan continues with the next one. */
async function executePlan(slug: string, rule: AutomationRule, reason: string): Promise<StepOutcome[]> {
  const steps: StepOutcome[] = [];
  for (const a of rule.then) {
    try {
      if (a.type === "alert") {
        await recordActivity(slug, "SYSTEM", `⚠ ${rule.id}: ${reason}${a.note ? ` — ${a.note}` : ""}`);
        steps.push({ type: a.type, ok: true, detail: "alert raised in the ledger" });
      } else if (a.type === "restock_low") {
        const s = await loadStore(slug);
        const low = s ? s.store.products.filter((p) => (p.stock ?? 0) <= 3 && p.availability !== "PreOrder") : [];
        if (s && low.length) {
          for (const p of low) {
            p.stock = (p.stock ?? 0) + a.qty;
            if (p.availability === "OutOfStock") p.availability = "InStock";
          }
          await saveStore(s);
          await recordActivity(slug, "OPERATIONS", `${rule.id} auto-restocked ${low.length} low SKU(s) +${a.qty} each`);
          steps.push({ type: a.type, ok: true, detail: `${low.length} SKU(s) +${a.qty}: ${low.map((p) => p.sku).join(", ")}` });
        } else {
          steps.push({ type: a.type, ok: true, detail: "nothing at or below 3 units — no change" });
        }
      } else if (a.type === "price_adjust_all") {
        const s = await loadStore(slug);
        if (!s) { steps.push({ type: a.type, ok: false, detail: "store not found" }); continue; }
        const pct = Math.max(-20, Math.min(20, a.pct));
        let n = 0;
        for (const p of s.store.products) {
          if (p.priceValue == null) continue;
          p.priceValue = Math.max(1, Math.round(p.priceValue * (1 + pct / 100)));
          const suffix = (p.price.match(/\/(mo|yr)$/) ?? [""])[0];
          p.price = `€${p.priceValue}${suffix}`;
          n++;
        }
        await saveStore(s);
        await recordActivity(slug, "OPERATIONS", `${rule.id} adjusted ${n} price(s) ${pct > 0 ? "+" : ""}${pct}% — storefront + feed updated for agents`);
        steps.push({ type: a.type, ok: true, detail: `${n} price(s) moved ${pct > 0 ? "+" : ""}${pct}%` });
      } else if (a.type === "price_adjust_sku") {
        const s = await loadStore(slug);
        const p = s?.store.products.find((x) => x.sku === a.sku);
        if (!s || !p) { steps.push({ type: a.type, ok: false, detail: `sku ${a.sku} not in catalog` }); continue; }
        if (p.priceValue == null) { steps.push({ type: a.type, ok: false, detail: `${a.sku} has no numeric price` }); continue; }
        const pct = Math.max(-20, Math.min(20, a.pct));
        const before = p.priceValue;
        p.priceValue = Math.max(1, Math.round(before * (1 + pct / 100)));
        const suffix = (p.price.match(/\/(mo|yr)$/) ?? [""])[0];
        p.price = `€${p.priceValue}${suffix}`;
        await saveStore(s);
        await recordActivity(slug, "OPERATIONS", `${rule.id} repriced ${a.sku} €${before} → €${p.priceValue}`);
        steps.push({ type: a.type, ok: true, detail: `${a.sku} €${before} → €${p.priceValue}` });
      } else if (a.type === "pause_campaigns") {
        const live = (await listCampaigns(slug)).filter((c) => c.status === "live");
        for (const c of live) await setCampaignStatus(slug, c.id, "paused");
        if (live.length) await recordActivity(slug, "MARKETING", `${rule.id} paused ${live.length} live campaign(s): ${live.map((c) => c.id).join(", ")}`);
        steps.push({ type: a.type, ok: true, detail: live.length ? `paused ${live.map((c) => c.id).join(", ")}` : "no live campaigns — no change" });
      } else if (a.type === "flag_stock_out") {
        const s = await loadStore(slug);
        const gone = s ? s.store.products.filter((p) => (p.stock ?? 24) <= 0 && p.availability === "InStock") : [];
        if (s && gone.length) {
          for (const p of gone) p.availability = "OutOfStock";
          await saveStore(s);
          await recordActivity(slug, "OPERATIONS", `${rule.id} marked ${gone.length} SKU(s) OutOfStock — agents read accurate availability`);
          steps.push({ type: a.type, ok: true, detail: `${gone.map((p) => p.sku).join(", ")} → OutOfStock` });
        } else {
          steps.push({ type: a.type, ok: true, detail: "availability already accurate — no change" });
        }
      }
    } catch (e) {
      steps.push({ type: a.type, ok: false, detail: (e as Error).message.slice(0, 120) });
    }
  }
  return steps;
}

function logRun(rule: AutomationRule, run: AutoRun): void {
  rule.runs = [...(rule.runs ?? []), run].slice(-RUN_LOG_MAX);
}

/**
 * Evaluate every rule against measured metrics and execute what fires.
 * Rules marked `requireApproval` hold their plan instead. Returns the ids of
 * rules that acted (used by the caller to re-read a mutated store).
 */
export async function evaluateAutomations(slug: string, metrics: Metrics): Promise<string[]> {
  if (!SLUG_RE.test(slug)) return [];
  const rules = await readAll(slug);
  const fired: string[] = [];
  let changed = false;

  for (const rule of rules) {
    const v = verdict(rule, metrics);
    if (!v.fire) {
      // Only worth logging the near-misses that a human would want explained.
      if (rule.enabled && !rule.pending && metrics[rule.if.metric] == null) {
        const last = rule.runs?.[rule.runs.length - 1];
        if (last?.reason !== v.reason) { logRun(rule, { ts: new Date().toISOString(), fired: false, reason: v.reason, steps: [] }); changed = true; }
      }
      continue;
    }

    if (rule.requireApproval) {
      rule.pending = { ts: new Date().toISOString(), reason: v.reason, plan: describePlan(rule) };
      logRun(rule, { ts: rule.pending.ts, fired: false, held: true, reason: v.reason, steps: [] });
      await recordActivity(slug, "SYSTEM", `${rule.id} triggered and is HOLDING for approval — ${v.reason}`);
      changed = true;
      continue;
    }

    const steps = await executePlan(slug, rule, v.reason);
    rule.lastFired = new Date().toISOString();
    logRun(rule, { ts: rule.lastFired, fired: true, reason: v.reason, steps });
    fired.push(rule.id);
    changed = true;
  }
  if (changed) await writeAll(slug, rules);
  return fired;
}

export type AutoPreview = {
  id: string;
  would: boolean;
  reason: string;
  condition: string;
  plan: string[];
  requireApproval: boolean;
};

/** DRY RUN — exactly the same verdict logic, zero writes. What the engine
    would do right now, in the owner's words, before arming anything. */
export async function previewAutomations(slug: string, metrics: Metrics): Promise<AutoPreview[]> {
  const rules = await readAll(slug);
  return rules.map((r) => {
    const v = verdict(r, metrics);
    return { id: r.id, would: v.fire, reason: v.reason, condition: describeCondition(r), plan: describePlan(r), requireApproval: r.requireApproval === true };
  });
}

/** Approve a held plan: run it now, clear the hold, record the audit. */
export async function approvePending(slug: string, id: string): Promise<AutomationRule[]> {
  const rules = await readAll(slug);
  const rule = rules.find((r) => r.id === id);
  if (!rule?.pending) return rules;
  const reason = `${rule.pending.reason} (approved by owner)`;
  const steps = await executePlan(slug, rule, reason);
  rule.lastFired = new Date().toISOString();
  rule.pending = undefined;
  logRun(rule, { ts: rule.lastFired, fired: true, reason, steps });
  await writeAll(slug, rules);
  return rules;
}

/** Decline a held plan. The rule stays armed; the decline is on the record. */
export async function dismissPending(slug: string, id: string): Promise<AutomationRule[]> {
  const rules = await readAll(slug);
  const rule = rules.find((r) => r.id === id);
  if (!rule?.pending) return rules;
  const reason = `${rule.pending.reason} (declined by owner)`;
  rule.pending = undefined;
  rule.lastFired = new Date().toISOString();      // respect the cooldown after a decline
  logRun(rule, { ts: rule.lastFired, fired: false, reason, steps: [] });
  await writeAll(slug, rules);
  await recordActivity(slug, "SYSTEM", `${id} plan declined — rule stays armed`);
  return rules;
}
