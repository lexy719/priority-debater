import "server-only";

/**
 * DEPARTMENT STATUS — what each department is actually doing right now.
 *
 * Architecture §11 (Mission Control) and §12 (Worker Console). This is the
 * layer that turns measured business data into "Marketing — healthy" and
 * "Inventory — needs attention".
 *
 * The rule that governs the whole file: A STATUS IS NEVER DECORATION. Every
 * state below is computed from counted facts, and every one carries the
 * sentence explaining what produced it. A dashboard of coloured dots nobody
 * can trace is worse than no dashboard, because it is confidently wrong.
 *
 * `unarmed` is deliberately separate from `idle` and it is the most important
 * distinction here. Idle means the department had nothing to do. Unarmed means
 * it was never given permission to do anything — the single most common reason
 * an autonomous product appears to be doing nothing, and the one an owner most
 * needs to be told plainly rather than left to infer from a quiet screen.
 */

import {
  DEPARTMENTS, DEPARTMENT_NAME, DEPARTMENT_REMIT, describeAuthority,
  type Department, type Permission,
} from "./departments";

export type DeptState = "attention" | "busy" | "healthy" | "idle" | "unarmed";

export const STATE_WORD: Record<DeptState, string> = {
  attention: "needs attention",
  busy: "busy",
  healthy: "healthy",
  idle: "nothing to do",
  unarmed: "not armed",
};

export type DeptTask = {
  /** Already-formatted time, or null for something with no timestamp. */
  time: string | null;
  text: string;
  /** true when a worker did it unattended, false when the owner did. */
  unattended: boolean;
};

export type DeptAsk = {
  question: string;
  /** What happens while this goes unanswered. Concrete, never "please review". */
  cost: string;
  /** Wire to an existing execute path when one exists. */
  action?: string;
};

export type DepartmentCard = {
  id: Department;
  name: string;
  remit: string;
  state: DeptState;
  /** The sentence behind the state. Always present. */
  because: string;
  /**
   * Something is wrong here, whether or not this department has been armed.
   * Kept separate from `state` because an unarmed department that can SEE a
   * problem still has one — counting only armed departments let the summary
   * report "0 warnings" over a grid of visible faults, which is the exact
   * dashboard lie this file exists to prevent.
   */
  concern: boolean;
  /** What this department is judged by, and the number. */
  metricLabel: string;
  metric: string | number;
  /** What it may do unattended, in words. */
  authority: string;
  armed: boolean;
  recent: DeptTask[];
  asks: DeptAsk[];
};

/** Everything the status engine needs, kept flat so it stays a pure function. */
export type Snapshot = {
  activity: { ts: string; worker: string; text: string; by?: "auto" | "owner" }[];
  proposals: { worker: string; severity: "act" | "watch" | "ok"; label: string; action?: string }[];
  orders: { count: number; awaitingConfirmation: number };
  finance: { revenue: number; settled: number; outstanding: number; marginPct: number | null; costsOnFile: number; skuCount: number };
  traffic: { agents: number };
  stock: { lowSkus: string[]; outSkus: string[]; stockedCount: number };
  care: { openReturns: number; escalated: number; unclaimedDeliveries: number };
  brain: { companyRules: number; hasVisualWorld: boolean } | null;
  catalog: { sellable: number; neverRetrieved: number };
};

/**
 * Legacy activity carried four worker names. Map them forward for display
 * without rewriting history: a line recorded under OPERATIONS stays under
 * OPERATIONS even though stock work would now belong to Inventory. A record
 * that retroactively edits itself is not a record.
 */
function activityFor(snap: Snapshot, d: Department): DeptTask[] {
  const wanted: Record<Department, string[]> = {
    MARKETING: ["MARKETING"],
    SALES: ["SALES"],
    CARE: ["CARE"],
    INVENTORY: ["INVENTORY"],
    FINANCE: ["FINANCE"],
    OPERATIONS: ["OPERATIONS"],
  };
  return snap.activity
    .filter((a) => wanted[d].includes((a.worker ?? "").toUpperCase()))
    .slice(0, 6)
    .map((a) => ({
      time: a.ts?.slice(11, 16) ?? null,
      text: a.text,
      unattended: a.by !== "owner",
    }));
}

function proposalsFor(snap: Snapshot, legacyNames: string[]): DeptAsk[] {
  return snap.proposals
    .filter((p) => legacyNames.includes(p.worker.toUpperCase()) && p.severity === "act")
    .slice(0, 5)
    .map((p) => ({ question: p.label, cost: "", ...(p.action ? { action: p.action } : {}) }));
}

/** Pick the loudest true thing. Order matters: attention beats busy beats idle. */
function decide(armed: boolean, attention: string | null, busy: string | null, healthy: string | null): { state: DeptState; because: string; concern: boolean } {
  if (!armed) {
    return {
      state: "unarmed",
      concern: Boolean(attention),
      because: attention
        // Even a department with no authority must still report what it can
        // SEE, or an owner arms it blind.
        ? `Not armed, and it can already see something wrong: ${attention}`
        : "Not armed. It watches and reports, and will not act on anything.",
    };
  }
  if (attention) return { state: "attention", because: attention, concern: true };
  if (busy) return { state: "busy", because: busy, concern: false };
  if (healthy) return { state: "healthy", because: healthy, concern: false };
  return { state: "idle", because: "Nothing to do right now.", concern: false };
}

export function assessDepartments(snap: Snapshot, perms: Permission[]): DepartmentCard[] {
  const perm = (d: Department) => perms.find((p) => p.department === d);

  return DEPARTMENTS.map((d): DepartmentCard => {
    const p = perm(d);
    const armed = Boolean(p?.armed);
    let attention: string | null = null, busy: string | null = null, healthy: string | null = null;
    let metricLabel = "", metric: string | number = "—";
    let asks: DeptAsk[] = [];

    switch (d) {
      case "MARKETING": {
        const rules = snap.brain?.companyRules ?? 0;
        const world = snap.brain?.hasVisualWorld ?? false;
        metricLabel = "AGENT READS";
        metric = snap.traffic.agents;
        if (rules === 0 || !world) attention = "It has no guidelines of its own, so everything it writes will sound like anyone's.";
        else if (snap.traffic.agents === 0) attention = "No agent has read the store yet — nothing it makes can be measured.";
        else if (snap.catalog.neverRetrieved > 0) busy = `${snap.catalog.neverRetrieved} of ${snap.catalog.sellable} products have never been read by an agent.`;
        else healthy = `${snap.traffic.agents} agent reads, and every product has been retrieved at least once.`;
        asks = proposalsFor(snap, ["MARKETING"]);
        break;
      }
      case "SALES": {
        metricLabel = "ORDERS";
        metric = snap.orders.count;
        const conv = snap.traffic.agents > 0 ? snap.orders.count / snap.traffic.agents : null;
        if (snap.orders.count === 0 && snap.traffic.agents > 0) attention = `${snap.traffic.agents} agents read the store and none bought.`;
        else if (snap.orders.count === 0) healthy = "Nothing has sold yet, and nothing has visited — there is nothing to conclude.";
        else if (conv != null) healthy = `${snap.orders.count} orders from ${snap.traffic.agents} agent reads.`;
        else healthy = `${snap.orders.count} orders taken.`;
        asks = proposalsFor(snap, ["SALES"]);
        break;
      }
      case "CARE": {
        const waiting = snap.care.openReturns + snap.care.escalated;
        metricLabel = "WAITING";
        metric = waiting;
        if (snap.care.escalated > 0) attention = `${snap.care.escalated} question${snap.care.escalated === 1 ? "" : "s"} it could not answer from the record.`;
        else if (snap.care.openReturns > 0) attention = `${snap.care.openReturns} return${snap.care.openReturns === 1 ? "" : "s"} waiting on your decision.`;
        else if (snap.care.unclaimedDeliveries > 0) busy = `${snap.care.unclaimedDeliveries} buyer(s) paid and never opened what they bought.`;
        else healthy = "Nothing outstanding after the sale.";
        break;
      }
      case "INVENTORY": {
        metricLabel = "LOW OR OUT";
        metric = snap.stock.lowSkus.length + snap.stock.outSkus.length;
        if (snap.stock.outSkus.length) attention = `${snap.stock.outSkus.length} SKU(s) are out of stock and showing unavailable to every agent: ${snap.stock.outSkus.slice(0, 3).join(", ")}.`;
        else if (snap.stock.lowSkus.length) busy = `${snap.stock.lowSkus.length} SKU(s) running low: ${snap.stock.lowSkus.slice(0, 3).join(", ")}.`;
        else if (snap.stock.stockedCount === 0) healthy = "Nothing here needs a shelf — this business sells nothing physical.";
        else healthy = `All ${snap.stock.stockedCount} stocked products have cover.`;
        break;
      }
      case "FINANCE": {
        metricLabel = "SETTLED";
        metric = `€${snap.finance.settled.toLocaleString("en-US")}`;
        if (snap.finance.outstanding > 0) attention = `€${snap.finance.outstanding} of goods went out and was never charged for.`;
        else if (snap.finance.costsOnFile === 0 && snap.finance.skuCount > 0) attention = "No unit costs on file, so margin and profit cannot be known.";
        else if (snap.finance.marginPct != null) healthy = `${snap.finance.marginPct}% margin on €${snap.finance.revenue} booked.`;
        else healthy = "Nothing has sold yet, so there is nothing to reconcile.";
        asks = proposalsFor(snap, ["FINANCE"]);
        break;
      }
      case "OPERATIONS": {
        metricLabel = "AWAITING YOU";
        metric = snap.orders.awaitingConfirmation;
        if (snap.orders.awaitingConfirmation > 0) attention = `${snap.orders.awaitingConfirmation} order(s) received and not yet confirmed.`;
        else if (snap.orders.count > 0) healthy = `All ${snap.orders.count} orders are moving.`;
        else healthy = "No orders to move yet.";
        asks = proposalsFor(snap, ["OPERATIONS"]);
        break;
      }
    }

    const { state, because, concern } = decide(armed, attention, busy, healthy);
    return {
      id: d,
      name: DEPARTMENT_NAME[d],
      remit: DEPARTMENT_REMIT[d],
      state, because, concern, metricLabel, metric,
      authority: p ? describeAuthority(p) : "No permission record.",
      armed,
      recent: activityFor(snap, d),
      asks,
    };
  });
}

/**
 * The single word at the top of Mission Control.
 *
 * Derived from the departments rather than set independently, so the headline
 * can never disagree with the grid beneath it — the classic dashboard lie where
 * the summary says "healthy" over a column of red.
 */
export function businessStatus(cards: DepartmentCard[]): { word: string; because: string } {
  // Count CONCERNS, not armed-attention. A problem an unarmed department can
  // see is still a problem, and a summary that omits it is the lie.
  const concerned = cards.filter((c) => c.concern);
  const armed = cards.filter((c) => c.armed);
  if (concerned.length > 0) {
    const names = concerned.map((c) => c.name).join(", ");
    return {
      word: "Needs you",
      because: armed.length === 0
        ? `Nothing is armed, and ${names} already ${concerned.length === 1 ? "reports" : "report"} a problem.`
        : `${names} ${concerned.length === 1 ? "reports" : "report"} something you have to decide.`,
    };
  }
  if (armed.length === 0) {
    return {
      word: "Standing by",
      because: "No department has been armed. Commerce is watching and will not act on anything.",
    };
  }
  if (cards.some((c) => c.state === "busy")) {
    return { word: "Working", because: "Work in progress, nothing blocked." };
  }
  return { word: "Healthy", because: "Every armed department reports nominal." };
}
