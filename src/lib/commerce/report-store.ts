import "server-only";

/**
 * Commerce report persistence — pluggable, mirroring the idea-validator store.
 *
 *  - Service-role Supabase (when SUPABASE_SERVICE_ROLE_KEY is set) → durable,
 *    shareable across devices, and handles anonymous previews (user_id = null)
 *    by bypassing RLS for the write only. Reads honor the public-read policy.
 *  - Otherwise → in-process Map (survives within one running server instance).
 *
 * Call sites never change as the backend upgrades. The typed `commerce_reports`
 * columns are populated from the report; everything that doesn't map to a column
 * (overall score, live flag, country, top competitor, shock) rides in
 * `scores.meta` so the row round-trips losslessly.
 */

import { createServiceClient } from "@/lib/supabase/service";
import { supabaseServiceConfigured } from "@/lib/supabase/config";
import type { CommerceReport } from "./types";

/* ── (de)serialization between CommerceReport and the DB row ── */

interface ReportRow {
  share_id: string;
  user_id: string | null;
  url: string;
  store_name: string;
  category: string;
  scores: Record<string, unknown>;
  buyer_queries: unknown;
  competitors: unknown;
  google_signals: unknown;
  fixes: unknown;
  unlocked: boolean;
  created_at?: string;
}

function toRow(r: CommerceReport, userId: string | null): ReportRow {
  return {
    share_id: r.shareId,
    user_id: userId,
    url: r.url,
    store_name: r.storeName,
    category: r.category,
    scores: {
      overall: r.scores.overall,
      google: r.scores.google,
      ai: r.scores.ai,
      agentReadiness: r.scores.agentReadiness,
      meta: { live: r.live, country: r.country, topCompetitor: r.topCompetitor, shock: r.shock },
    },
    buyer_queries: r.buyerQueries,
    competitors: r.competitors,
    google_signals: r.googleSignals,
    fixes: r.fixes,
    unlocked: r.unlocked,
    created_at: r.createdAt,
  };
}

function fromRow(row: ReportRow): CommerceReport {
  const scores = row.scores as {
    overall: number;
    google: CommerceReport["scores"]["google"];
    ai: CommerceReport["scores"]["ai"];
    agentReadiness: CommerceReport["scores"]["agentReadiness"];
    meta?: { live?: boolean; country?: string; topCompetitor?: string | null; shock?: CommerceReport["shock"] };
  };
  const meta = scores.meta ?? {};
  return {
    shareId: row.share_id,
    url: row.url,
    storeName: row.store_name,
    category: row.category,
    country: meta.country ?? "",
    live: meta.live ?? false,
    shock: meta.shock as CommerceReport["shock"],
    scores: { overall: scores.overall, google: scores.google, ai: scores.ai, agentReadiness: scores.agentReadiness },
    buyerQueries: row.buyer_queries as CommerceReport["buyerQueries"],
    competitors: row.competitors as CommerceReport["competitors"],
    topCompetitor: meta.topCompetitor ?? null,
    googleSignals: row.google_signals as CommerceReport["googleSignals"],
    fixes: row.fixes as CommerceReport["fixes"],
    unlocked: row.unlocked,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

/* ── in-memory fallback ── */
const memory = new Map<string, CommerceReport & { userId: string | null }>();

/* ── public API ── */

/** Persist a fresh report. `userId` is null for anonymous free previews. */
export async function saveReport(report: CommerceReport, userId: string | null): Promise<void> {
  if (supabaseServiceConfigured()) {
    try {
      const db = createServiceClient();
      await db.from("commerce_reports").upsert(toRow(report, userId), { onConflict: "share_id" });
      return;
    } catch {
      /* fall through to memory */
    }
  }
  memory.set(report.shareId, { ...report, userId });
}

export async function getReportByShareId(shareId: string): Promise<CommerceReport | null> {
  if (supabaseServiceConfigured()) {
    try {
      const db = createServiceClient();
      const { data } = await db.from("commerce_reports").select("*").eq("share_id", shareId).maybeSingle();
      if (data) return fromRow(data as ReportRow);
    } catch {
      /* fall through to memory */
    }
  }
  return memory.get(shareId) ?? null;
}

/** Most recent report for this URL owned by this user — used to keep unlocks permanent. */
export async function getUnlockedReportForUser(url: string, userId: string): Promise<CommerceReport | null> {
  if (supabaseServiceConfigured()) {
    try {
      const db = createServiceClient();
      const { data } = await db
        .from("commerce_reports")
        .select("*")
        .eq("url", url)
        .eq("user_id", userId)
        .eq("unlocked", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) return fromRow(data as ReportRow);
    } catch {
      /* fall through */
    }
    return null;
  }
  for (const r of memory.values()) {
    if (r.url === url && r.userId === userId && r.unlocked) return r;
  }
  return null;
}

/**
 * Mark a report unlocked for `userId` (claims an anonymous row for them). Returns
 * the updated report, or null if the share id is unknown.
 */
export async function markUnlocked(shareId: string, userId: string): Promise<CommerceReport | null> {
  if (supabaseServiceConfigured()) {
    try {
      const db = createServiceClient();
      const { data } = await db
        .from("commerce_reports")
        .update({ unlocked: true, user_id: userId, updated_at: new Date().toISOString() })
        .eq("share_id", shareId)
        .select("*")
        .maybeSingle();
      return data ? fromRow(data as ReportRow) : null;
    } catch {
      return null;
    }
  }
  const existing = memory.get(shareId);
  if (!existing) return null;
  const updated = { ...existing, unlocked: true, userId };
  memory.set(shareId, updated);
  return updated;
}
