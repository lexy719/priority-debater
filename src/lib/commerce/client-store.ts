/**
 * Client-owned report state — the source of truth for continuity.
 *
 * The scan engine runs server-side, but the server's report store is in-memory
 * (ephemeral). So the CLIENT keeps the full report in localStorage: the results
 * page, the agent, and the nav all read it from here, which means the store
 * context survives navigation, refresh, and dev recompiles. "Ownership" of a
 * report is simply "it's in my localStorage" — which is what decides the paywall.
 *
 * Browser-only: every function no-ops on the server.
 */

import type { CommerceReport } from "./types";

const R = "pd-commerce:r:"; // report by shareId
const U = "pd-commerce:u:"; // normalized url -> shareId
const CUR = "pd-commerce:current"; // pointer to the most recent report
const TTL = 1000 * 60 * 60 * 24 * 30; // 30 days

type Wrapped = { report: CommerceReport; savedAt: number };
export type CurrentReport = { shareId: string; url: string; storeName: string };

function browser(): boolean {
  return typeof window !== "undefined";
}

function normUrl(u: string): string {
  return u.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

export function saveLocalReport(report: CommerceReport): void {
  if (!browser()) return;
  try {
    localStorage.setItem(R + report.shareId, JSON.stringify({ report, savedAt: Date.now() } satisfies Wrapped));
    localStorage.setItem(U + normUrl(report.url), report.shareId);
    setCurrentReport(report);
  } catch {
    /* quota / private mode — non-fatal */
  }
}

export function loadLocalReport(shareId: string): CommerceReport | null {
  if (!browser()) return null;
  try {
    const raw = localStorage.getItem(R + shareId);
    if (!raw) return null;
    const w = JSON.parse(raw) as Wrapped;
    if (Date.now() - w.savedAt > TTL) {
      localStorage.removeItem(R + shareId);
      return null;
    }
    return w.report;
  } catch {
    return null;
  }
}

export function loadLocalReportByUrl(url: string): CommerceReport | null {
  if (!browser()) return null;
  try {
    const id = localStorage.getItem(U + normUrl(url));
    return id ? loadLocalReport(id) : null;
  } catch {
    return null;
  }
}

/** True when this report lives in the viewer's own localStorage (they ran it). */
export function ownsReport(shareId: string): boolean {
  if (!browser()) return false;
  try {
    return localStorage.getItem(R + shareId) != null;
  } catch {
    return false;
  }
}

export function markLocalUnlocked(shareId: string): void {
  const r = loadLocalReport(shareId);
  if (r) saveLocalReport({ ...r, unlocked: true });
}

export function setCurrentReport(report: CommerceReport): void {
  if (!browser()) return;
  try {
    const cur: CurrentReport = { shareId: report.shareId, url: report.url, storeName: report.storeName };
    localStorage.setItem(CUR, JSON.stringify(cur));
  } catch {
    /* ignore */
  }
}

export function getCurrentReport(): CurrentReport | null {
  if (!browser()) return null;
  try {
    const raw = localStorage.getItem(CUR);
    return raw ? (JSON.parse(raw) as CurrentReport) : null;
  } catch {
    return null;
  }
}

/* ── snapshot history (drives real trends; client-owned so it survives) ── */

const HIST = "pd-commerce:hist:"; // normalized url -> CommerceSnapshot[]
const HIST_CAP = 26;

/** A lean point-in-time capture of a scan — enough to draw trends + deltas. */
export interface CommerceSnapshot {
  at: string; // ISO timestamp
  overall: number;
  google: number;
  ai: number;
  agent: number;
  timesNamed: number;
  total: number;
  comp: Record<string, number>; // competitor name -> AI-voice share
  q: Record<string, number>; // query text -> status score (WON 100 / MIXED 50 / LOST 0)
}

export function snapshotFromReport(r: CommerceReport): CommerceSnapshot {
  const qScore = (query: CommerceReport["buyerQueries"][number]): number => {
    if (query.intent === "BRAND" && query.verdict) return query.verdict === "RECOMMENDED" ? 100 : query.verdict === "AVOID" ? 0 : 50;
    return query.namedYou ? 100 : 0;
  };
  return {
    at: new Date().toISOString(),
    overall: r.scores.overall,
    google: r.scores.google.score,
    ai: r.scores.ai.score,
    agent: r.scores.agentReadiness.score,
    timesNamed: r.shock.timesNamed,
    total: r.shock.queriesTested,
    comp: Object.fromEntries(r.competitors.map((c) => [c.name, c.score])),
    q: Object.fromEntries(r.buyerQueries.map((query) => [query.query, qScore(query)])),
  };
}

/** Append a snapshot for this report's URL. Call only on a real scan/re-scan. */
export function appendSnapshot(r: CommerceReport): void {
  if (!browser()) return;
  try {
    const key = HIST + normUrl(r.url);
    const list = getSnapshots(r.url);
    list.push(snapshotFromReport(r));
    localStorage.setItem(key, JSON.stringify(list.slice(-HIST_CAP)));
  } catch {
    /* ignore */
  }
}

/** Snapshots for a URL, oldest → newest. */
export function getSnapshots(url: string): CommerceSnapshot[] {
  if (!browser()) return [];
  try {
    const raw = localStorage.getItem(HIST + normUrl(url));
    return raw ? (JSON.parse(raw) as CommerceSnapshot[]) : [];
  } catch {
    return [];
  }
}
