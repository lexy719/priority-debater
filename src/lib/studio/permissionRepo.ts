import "server-only";

/**
 * Permission storage — the control layer of architecture §6, persisted.
 *
 * One record per business. Grants are the most consequential thing an owner
 * ever sets in this product, so two rules hold here that do not hold elsewhere:
 *
 *   1. EVERY CHANGE IS LOGGED, with who made it and what changed. An owner must
 *      be able to answer "when did it get permission to do that?" months later.
 *      A permission system without a history is an accident waiting to be
 *      denied.
 *
 *   2. A MISSING RECORD MEANS NO AUTHORITY. Read failures, corrupt files and
 *      new businesses all resolve to the same safe answer — nothing is allowed.
 *      A storage error must never widen what an unattended worker may do.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { blobConfigured, getJson, putJson } from "./blobStore";
import {
  CAPABILITY_OF, DEPARTMENTS, defaultPermissions,
  type Capability, type Department, type Permission,
} from "./departments";

export type GrantEvent = {
  ts: string;
  department: Department;
  /** What changed, in words, for the owner's benefit rather than a diff. */
  change: string;
  by: "owner" | "system";
};

export type PermissionRecord = {
  slug: string;
  permissions: Permission[];
  history: GrantEvent[];
  updatedAt: string;
};

const DIR = path.join(process.cwd(), ".data", "permissions");
const SLUG_RE = /^[a-z0-9-]{3,64}$/;

function file(slug: string): string {
  return path.join(DIR, `${slug}.json`);
}

function blank(slug: string): PermissionRecord {
  return { slug, permissions: defaultPermissions(), history: [], updatedAt: new Date().toISOString() };
}

/**
 * Reconcile a stored record against the current department and capability
 * model. A department added in a later version must appear disarmed, and a
 * capability that no longer exists must be dropped rather than silently
 * granting something the code no longer understands.
 */
function reconcile(rec: PermissionRecord): PermissionRecord {
  const byDept = new Map(rec.permissions.map((p) => [p.department, p]));
  const permissions: Permission[] = DEPARTMENTS.map((d) => {
    const stored = byDept.get(d);
    if (!stored) return { department: d, armed: false, allowed: [], dailySpendCap: 0, currency: "EUR" };
    const valid = CAPABILITY_OF[d];
    return {
      ...stored,
      department: d,
      allowed: (stored.allowed ?? []).filter((c) => valid.includes(c)),
      dailySpendCap: Number.isFinite(stored.dailySpendCap) ? Math.max(0, stored.dailySpendCap) : 0,
      currency: stored.currency || "EUR",
    };
  });
  return { ...rec, permissions };
}

export async function loadPermissions(slug: string): Promise<PermissionRecord> {
  if (!SLUG_RE.test(slug)) return blank(slug);
  if (blobConfigured()) {
    const blob = await getJson<PermissionRecord>(`permissions/${slug}.json`);
    if (blob) return reconcile(blob);
  }
  try {
    return reconcile(JSON.parse(await fs.readFile(file(slug), "utf8")) as PermissionRecord);
  } catch {
    // No record, unreadable record, corrupt record — all the same answer.
    return blank(slug);
  }
}

async function save(rec: PermissionRecord): Promise<void> {
  rec.updatedAt = new Date().toISOString();
  // The history is the audit trail; cap it rather than let a file grow forever,
  // keeping the most recent because that is what a dispute is usually about.
  rec.history = rec.history.slice(0, 500);
  if (blobConfigured()) { await putJson(`permissions/${rec.slug}.json`, rec); return; }
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(file(rec.slug), JSON.stringify(rec, null, 2), "utf8");
}

/** Arm or stand down a whole department. */
export async function setArmed(slug: string, d: Department, armed: boolean, by: "owner" | "system" = "owner"): Promise<PermissionRecord> {
  const rec = await loadPermissions(slug);
  const p = rec.permissions.find((x) => x.department === d);
  if (!p || p.armed === armed) return rec;
  p.armed = armed;
  // Standing a department down revokes its grants outright. Leaving them
  // dormant would mean re-arming silently restores authority the owner may
  // have forgotten it had.
  if (!armed) { p.allowed = []; p.dailySpendCap = 0; }
  rec.history.unshift({
    ts: new Date().toISOString(), department: d, by,
    change: armed ? "Armed — may now act inside its grants" : "Stood down — all grants revoked",
  });
  await save(rec);
  return rec;
}

/** Grant or revoke one capability. */
export async function setCapability(slug: string, d: Department, c: Capability, granted: boolean, by: "owner" | "system" = "owner"): Promise<PermissionRecord> {
  const rec = await loadPermissions(slug);
  const p = rec.permissions.find((x) => x.department === d);
  if (!p) return rec;
  if (!CAPABILITY_OF[d].includes(c)) return rec;
  const had = p.allowed.includes(c);
  if (had === granted) return rec;
  p.allowed = granted ? [...p.allowed, c] : p.allowed.filter((x) => x !== c);
  rec.history.unshift({
    ts: new Date().toISOString(), department: d, by,
    change: `${granted ? "Granted" : "Revoked"}: ${c}`,
  });
  await save(rec);
  return rec;
}

/** Set the daily spend ceiling. */
export async function setSpendCap(slug: string, d: Department, cap: number, by: "owner" | "system" = "owner"): Promise<PermissionRecord> {
  const rec = await loadPermissions(slug);
  const p = rec.permissions.find((x) => x.department === d);
  if (!p) return rec;
  const next = Number.isFinite(cap) ? Math.max(0, Math.round(cap * 100) / 100) : 0;
  if (p.dailySpendCap === next) return rec;
  rec.history.unshift({
    ts: new Date().toISOString(), department: d, by,
    change: `Daily spend limit ${p.dailySpendCap} → ${next} ${p.currency}`,
  });
  p.dailySpendCap = next;
  await save(rec);
  return rec;
}

/** How much authority has actually been handed over, for the owner's summary. */
export function authoritySummary(rec: PermissionRecord): {
  armed: number; total: number; grants: number; spendPerDay: number;
} {
  return {
    armed: rec.permissions.filter((p) => p.armed).length,
    total: rec.permissions.length,
    grants: rec.permissions.reduce((a, p) => a + p.allowed.length, 0),
    spendPerDay: rec.permissions.reduce((a, p) => a + p.dailySpendCap, 0),
  };
}
