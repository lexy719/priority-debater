"use client";

/**
 * /commerce/results — the intelligence report.
 *
 * State of truth is the CLIENT (localStorage via client-store), so the store
 * context survives navigation, refresh, and dev recompiles:
 *   ?url=<store>  → reuse the local report for that URL, else run a fresh scan;
 *                   then rewrite the address bar to the canonical ?r=<shareId>.
 *   ?r=<shareId>  → if it's in YOUR localStorage you own it (paywall applies);
 *                   otherwise it's someone's shared link → full, read-only.
 *   (neither)     → back to /commerce.
 *
 * Reverse trial: the full report renders immediately; for an owner who hasn't
 * unlocked, sections blur 60s in and a paywall slides up. Ownership is decided by
 * localStorage, never by the URL shape — so a refresh can't dodge the paywall.
 */

import { useCallback, useEffect, useState } from "react";
import { ScanProgress } from "@/components/commerce/ScanProgress";
import { CommerceWorkspace } from "@/components/commerce/CommerceWorkspace";
import { useCreditsState } from "@/components/credits/CreditsProvider";
import {
  appendSnapshot,
  loadLocalReport,
  loadLocalReportByUrl,
  markLocalUnlocked,
  ownsReport,
  saveLocalReport,
} from "@/lib/commerce/client-store";
import type { CommerceReport } from "@/lib/commerce/types";

type State =
  | { phase: "boot" }
  | { phase: "scanning"; url: string }
  | { phase: "error"; message: string }
  | { phase: "ready"; report: CommerceReport; shared: boolean };

function rewriteToShare(shareId: string) {
  try {
    const u = new URL(window.location.href);
    u.searchParams.delete("url");
    u.searchParams.set("r", shareId);
    window.history.replaceState({}, "", u.toString());
  } catch {
    /* ignore */
  }
}

export default function CommerceResultsPage() {
  const [state, setState] = useState<State>({ phase: "boot" });
  const [unlocking, setUnlocking] = useState(false);
  const { setBalance } = useCreditsState();

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get("r")?.trim();
    const url = params.get("url")?.trim();

    (async () => {
      // 1) A report id — owned if it's in this browser, else a shared link.
      if (shareId) {
        const mine = loadLocalReport(shareId);
        if (mine) {
          if (!cancelled) setState({ phase: "ready", report: mine, shared: false });
          return;
        }
        try {
          const res = await fetch(`/api/commerce/report?shareId=${encodeURIComponent(shareId)}`);
          if (res.ok) {
            const { report } = (await res.json()) as { report: CommerceReport };
            if (!cancelled) setState({ phase: "ready", report, shared: true });
            return;
          }
        } catch {
          /* fall through */
        }
        if (!cancelled) setState({ phase: "error", message: "That report link has expired." });
        return;
      }

      // 2) A store URL — reuse the local report, else run a fresh scan.
      if (url) {
        const existing = loadLocalReportByUrl(url);
        if (existing) {
          if (!cancelled) setState({ phase: "ready", report: existing, shared: false });
          rewriteToShare(existing.shareId);
          return;
        }
        if (!cancelled) setState({ phase: "scanning", url });
        try {
          const res = await fetch("/api/commerce/scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });
          const data = (await res.json()) as { report?: CommerceReport; error?: string };
          if (!res.ok || !data.report) throw new Error(data.error || "Scan failed.");
          saveLocalReport(data.report);
          appendSnapshot(data.report); // seed this scan into the trend history
          if (!cancelled) setState({ phase: "ready", report: data.report, shared: false });
          rewriteToShare(data.report.shareId);
        } catch (e) {
          if (!cancelled) setState({ phase: "error", message: e instanceof Error ? e.message : "Scan failed." });
        }
        return;
      }

      // 3) Nothing to show.
      if (!cancelled) window.location.replace("/commerce");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const onUnlock = useCallback(async () => {
    if (state.phase !== "ready" || unlocking) return;
    setUnlocking(true);
    try {
      const res = await fetch("/api/commerce/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId: state.report.shareId }),
      });
      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(`/commerce/results?r=${state.report.shareId}`)}`;
        return;
      }
      if (res.status === 402) {
        window.location.href = "/credits";
        return;
      }
      const data = (await res.json()) as { ok?: boolean; balance?: number | null };
      if (data.ok) {
        if (typeof data.balance === "number") setBalance(data.balance);
        markLocalUnlocked(state.report.shareId);
        setState({ phase: "ready", report: { ...state.report, unlocked: true }, shared: false });
      }
    } finally {
      setUnlocking(false);
    }
  }, [state, unlocking, setBalance]);

  if (state.phase === "boot") {
    return (
      <div className="chamber-scope flex min-h-screen items-center justify-center bg-background font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
        LOADING REPORT…
      </div>
    );
  }

  if (state.phase === "scanning") return <ScanProgress url={state.url} />;

  if (state.phase === "error") {
    return (
      <div className="chamber-scope flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center text-foreground">
        <p className="text-display text-3xl">SOMETHING WENT WRONG</p>
        <p className="max-w-md text-[14px] text-muted-foreground">{state.message}</p>
        <a href="/commerce" className="bg-signal-blue px-6 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-paper">
          Run a new scan →
        </a>
      </div>
    );
  }

  // ready — owner who hasn't unlocked → paywall; shared links & unlocked owners → open.
  const { report, shared } = state;
  const locked = !shared && !report.unlocked && ownsReport(report.shareId);

  return <CommerceWorkspace report={report} locked={locked} unlocking={unlocking} onUnlock={onUnlock} />;
}
