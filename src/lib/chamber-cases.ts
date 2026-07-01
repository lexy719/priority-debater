/**
 * Chamber case store — the persistent record behind the Case File (§3) and the
 * Revise & Re-Enter arc (§5).
 *
 * A "case" is one idea under interrogation; a "session" is one completed run of
 * the panel against it. Revising an idea opens a CHILD case (#0007 → #0007-B)
 * linked to the parent, so the survival score can be shown as a delta and the
 * improvement arc becomes visible instead of a one-shot judgment.
 *
 * Storage is localStorage today (survives reloads / browser sessions, unlike the
 * per-tab sessionStorage the live debate uses). The API is deliberately shaped
 * like a tiny repository so it can be swapped for the Supabase `cases`/`sessions`
 * tables (§9) later without touching call sites. Pure client TS.
 */

import type { DebateHandoff, HandoffGap } from "./chamber-handoff";

export type CaseStatus = "open" | "ruled";

export interface ChamberCase {
  /** Stable unique id. */
  id: string;
  /** Human label, e.g. "0007" or a revision "0007-B". */
  label: string;
  ideaText: string;
  /** The case this one revises, if any. */
  parentCaseId: string | null;
  openedAt: number;
  status: CaseStatus;
}

/** One panelist's final ruling, captured for the persistent Case File. */
export interface RulingVerdict {
  personaId: string;
  name: string;
  ruling: string;
  line: string;
}

export interface ChamberRuling {
  overall: string;
  synthesisLead: string;
  verdicts: RulingVerdict[];
  gaps: HandoffGap[];
}

export interface ChamberSessionRecord {
  caseId: string;
  roundCount: number;
  finalSurvival: number;
  /** Rendered markdown transcript (the exportable Case File body). */
  transcriptMd: string;
  ruling: ChamberRuling;
  savedAt: number;
}

interface CaseDB {
  cases: ChamberCase[];
  sessions: Record<string, ChamberSessionRecord>; // keyed by caseId (latest run wins)
}

const CASES_KEY = "priority-debater-chamber-cases";
const EMPTY: CaseDB = { cases: [], sessions: {} };

function read(): CaseDB {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(CASES_KEY);
    if (!raw) return { ...EMPTY };
    const db = JSON.parse(raw) as CaseDB;
    return { cases: Array.isArray(db.cases) ? db.cases : [], sessions: db.sessions ?? {} };
  } catch {
    return { ...EMPTY };
  }
}

function write(db: CaseDB): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(CASES_KEY, JSON.stringify(db)); } catch { /* quota — ignore */ }
}

function normalize(idea: string): string {
  return idea.trim().toLowerCase().replace(/\s+/g, " ");
}

const SUFFIX = "BCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Next base label like "0007" for a brand-new (parentless) idea. */
function nextBaseLabel(cases: ChamberCase[]): string {
  const bases = cases.filter((c) => !c.parentCaseId).length;
  return String(bases + 1).padStart(4, "0");
}

/** Revision label off the parent's base, e.g. parent "0007" → "0007-B", "0007-C". */
function revisionLabel(cases: ChamberCase[], parent: ChamberCase): string {
  const base = parent.label.split("-")[0];
  const existing = cases.filter((c) => c.parentCaseId === parent.id || (c.label.startsWith(`${base}-`))).length;
  const letter = SUFFIX[existing] ?? SUFFIX[SUFFIX.length - 1];
  return `${base}-${letter}`;
}

function genId(): string {
  return `case_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ── Public repository API ───────────────────────────────────────────────── */

export function listCases(): ChamberCase[] {
  return read().cases.slice().sort((a, b) => b.openedAt - a.openedAt);
}

export function getCase(id: string): ChamberCase | null {
  return read().cases.find((c) => c.id === id) ?? null;
}

/** The most recent case for an idea string (used to resume / detect revisions). */
export function findCaseByIdea(idea: string): ChamberCase | null {
  const n = normalize(idea);
  const matches = read().cases.filter((c) => normalize(c.ideaText) === n);
  return matches.sort((a, b) => b.openedAt - a.openedAt)[0] ?? null;
}

/**
 * Open (or resume) a case for an idea. Passing `parentCaseId` forces a NEW child
 * case (a revision) even when the idea text is unchanged. Without it, an existing
 * open case for the same idea is reused so a page refresh doesn't fork the record.
 */
export function openCase(ideaText: string, parentCaseId?: string | null): ChamberCase {
  const db = read();
  if (!parentCaseId) {
    const existing = db.cases
      .filter((c) => normalize(c.ideaText) === normalize(ideaText))
      .sort((a, b) => b.openedAt - a.openedAt)[0];
    if (existing) return existing;
  }
  const parent = parentCaseId ? db.cases.find((c) => c.id === parentCaseId) ?? null : null;
  const label = parent ? revisionLabel(db.cases, parent) : nextBaseLabel(db.cases);
  const c: ChamberCase = {
    id: genId(),
    label,
    ideaText: ideaText.trim(),
    parentCaseId: parent?.id ?? null,
    openedAt: Date.now(),
    status: "open",
  };
  db.cases.push(c);
  write(db);
  return c;
}

/** Persist the full result of a run and mark the case ruled. */
export function saveSessionRecord(caseId: string, record: Omit<ChamberSessionRecord, "caseId" | "savedAt">): void {
  const db = read();
  db.sessions[caseId] = { ...record, caseId, savedAt: Date.now() };
  const c = db.cases.find((x) => x.id === caseId);
  if (c) c.status = "ruled";
  write(db);
}

export function getSessionRecord(caseId: string): ChamberSessionRecord | null {
  return read().sessions[caseId] ?? null;
}

/**
 * Survival delta of a case against its parent, for the Revise & Re-Enter arc.
 * Returns null when there's no parent or the parent was never ruled.
 */
export function survivalDelta(caseId: string): { from: number; to: number; delta: number } | null {
  const db = read();
  const c = db.cases.find((x) => x.id === caseId);
  if (!c?.parentCaseId) return null;
  const parentSession = db.sessions[c.parentCaseId];
  const thisSession = db.sessions[c.id];
  if (!parentSession) return null;
  const from = parentSession.finalSurvival;
  const to = thisSession ? thisSession.finalSurvival : from;
  return { from, to, delta: +(to - from).toFixed(1) };
}

/** Build a ChamberRuling snapshot from a derived handoff + the five verdicts. */
export function rulingFromParts(
  overall: string,
  synthesisLead: string,
  verdicts: RulingVerdict[],
  handoff: DebateHandoff,
): ChamberRuling {
  return { overall, synthesisLead, verdicts, gaps: handoff.gaps };
}
