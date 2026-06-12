/**
 * Server-side report store with shareable IDs.
 *
 * Pluggable backend:
 *  - If Vercel KV / Upstash REST env vars are present (KV_REST_API_URL +
 *    KV_REST_API_TOKEN), reports persist durably and are shareable across
 *    devices via `/results?r=<id>`.
 *  - Otherwise it falls back to an in-process Map (survives within a running
 *    server instance). Swap to a real DB later with zero call-site changes.
 *
 * IDs are deterministic per idea (a short hash), so re-generating the same
 * idea overwrites rather than duplicating, and the share link is stable.
 */

import type { Report } from "@/components/chamber/report";

const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

type StoredReport = { id: string; idea: string; report: Report; savedAt: number };

/* ── id derivation ─────────────────────────────────────────────────── */
export function reportIdForIdea(idea: string): string {
  const norm = idea.trim().toLowerCase().replace(/\s+/g, " ");
  let h = 2166136261;
  for (let i = 0; i < norm.length; i++) {
    h ^= norm.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return "r_" + (h >>> 0).toString(36) + norm.length.toString(36);
}

/* ── KV backend (optional) ─────────────────────────────────────────── */
function kvConfig(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();
  return url && token ? { url, token } : null;
}

async function kvSet(key: string, value: StoredReport): Promise<boolean> {
  const cfg = kvConfig();
  if (!cfg) return false;
  try {
    const res = await fetch(`${cfg.url}/set/${encodeURIComponent(key)}?EX=${TTL_SECONDS}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function kvGet(key: string): Promise<StoredReport | null> {
  const cfg = kvConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${cfg.token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: string | null };
    if (!data.result) return null;
    return JSON.parse(data.result) as StoredReport;
  } catch {
    return null;
  }
}

/* ── in-memory fallback ────────────────────────────────────────────── */
const memory = new Map<string, StoredReport>();

/* ── public API ────────────────────────────────────────────────────── */
export async function saveReport(idea: string, report: Report): Promise<string> {
  const id = reportIdForIdea(idea);
  const entry: StoredReport = { id, idea, report, savedAt: Date.now() };
  const wroteKv = await kvSet(id, entry);
  if (!wroteKv) memory.set(id, entry);
  return id;
}

export async function getReport(id: string): Promise<StoredReport | null> {
  return (await kvGet(id)) ?? memory.get(id) ?? null;
}

/** Whether durable cross-device persistence is active (KV configured). */
export function persistenceMode(): "kv" | "memory" {
  return kvConfig() ? "kv" : "memory";
}
