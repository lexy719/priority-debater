/**
 * Chamber stats — persona track record (§2) + the seed of the Evidence Library (§8).
 *
 * HONESTY NOTE: the design calls for stats computed "across all users,
 * anonymized" — that genuinely requires the server `seat_stats` / `evidence_
 * patterns` tables (§9), which aren't wired yet (empty SERVICE_ROLE_KEY). Until
 * then this records the REAL outcomes of THIS device's own sessions in
 * localStorage and labels them as such. The API is shaped so a Supabase-backed
 * implementation can replace the storage without changing call sites — the
 * dossier just starts reading global rather than local numbers.
 */

export type SeatStat = { heard: number; killed: number; passed: number };
export type Ruling = "CONVINCED" | "SKEPTICAL" | "UNCONVINCED" | "HOSTILE";

const STATS_KEY = "priority-debater-seat-stats";
/** Below this sample size a rate is not shown — we don't fabricate a "68%" from n=1. */
export const MIN_SAMPLE = 3;

type StatsDB = Record<string, SeatStat>;

function read(): StatsDB {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STATS_KEY) || "{}") as StatsDB; }
  catch { return {}; }
}

function write(db: StatsDB): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STATS_KEY, JSON.stringify(db)); } catch { /* quota */ }
}

/** A seat "killed" an idea when its final ruling was hostile/unconvinced. */
function isKill(ruling: string): boolean {
  return ruling === "HOSTILE" || ruling === "UNCONVINCED";
}

/**
 * Record one completed ruling into each seat's track record. Idempotency is the
 * caller's concern (persist once per ruled case) — mirrors saveSessionRecord.
 */
export function recordRuling(verdicts: { personaId: string; ruling: string }[]): void {
  if (!verdicts?.length) return;
  const db = read();
  for (const v of verdicts) {
    const s = db[v.personaId] ?? { heard: 0, killed: 0, passed: 0 };
    s.heard += 1;
    if (isKill(v.ruling)) s.killed += 1; else s.passed += 1;
    db[v.personaId] = s;
  }
  write(db);
}

export function getSeatStat(personaId: string): SeatStat {
  return read()[personaId] ?? { heard: 0, killed: 0, passed: 0 };
}

/** Kill rate as 0-100, or null when the sample is too small to be honest. */
export function killRate(personaId: string): number | null {
  const s = getSeatStat(personaId);
  if (s.heard < MIN_SAMPLE) return null;
  return Math.round((s.killed / s.heard) * 100);
}

/* ── Evidence Library seed (§8) ──────────────────────────────────────────── */

const AXIS_KEY = "priority-debater-evidence-axes";

/**
 * Tally which business axes go UNRESOLVED most often, from the handoff gaps of
 * ruled sessions. This is the local seed of the Evidence Library — with volume
 * it becomes "73% of marketplace ideas fail on distribution". Locally it's an
 * honest per-device frequency, clearly labelled at the call site.
 */
export function recordGapAxes(axes: string[]): void {
  if (typeof window === "undefined" || !axes?.length) return;
  try {
    const db = JSON.parse(localStorage.getItem(AXIS_KEY) || "{}") as Record<string, number>;
    for (const a of axes) db[a] = (db[a] ?? 0) + 1;
    localStorage.setItem(AXIS_KEY, JSON.stringify(db));
  } catch { /* ignore */ }
}

/** Most-common unresolved axes, most frequent first. */
export function topGapAxes(limit = 3): { axis: string; count: number }[] {
  if (typeof window === "undefined") return [];
  try {
    const db = JSON.parse(localStorage.getItem(AXIS_KEY) || "{}") as Record<string, number>;
    return Object.entries(db)
      .map(([axis, count]) => ({ axis, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch { return []; }
}
