"use client";

/**
 * /results — Chamber validation report, fully dynamic.
 *
 * No fake data, ever:
 *  - ?r=<id> in the URL          → load a shared, server-stored dossier.
 *  - No validated idea on file   → designed empty state (locked sections).
 *  - Idea on file                → POST /api/report generates the ENTIRE
 *    dossier for THIS idea, anchored to the audited score and folding in the
 *    live debate transcript when one exists. Cached per idea + stored server
 *    side with a shareable id.
 *  - Engine unreachable          → empty state with the idea + retry.
 */

import { useEffect, useState } from "react";
import ResultsChamber from "@/components/chamber/ResultsChamber";
import ResultsEmpty from "@/components/chamber/ResultsEmpty";
import type { Report } from "@/components/chamber/report";
import { loadSession, loadDebateTranscript } from "@/lib/session";

const REPORT_CACHE_KEY = "priority-debater-chamber-report-v2";

function readReportCache(idea: string): { id?: string; report: Report } | null {
  try {
    const raw = localStorage.getItem(REPORT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.idea === idea ? { id: parsed.id, report: parsed.report as Report } : null;
  } catch { return null; }
}

function writeReportCache(idea: string, id: string, report: Report) {
  try { localStorage.setItem(REPORT_CACHE_KEY, JSON.stringify({ idea, id, report, savedAt: Date.now() })); } catch {}
}

type State =
  | { phase: "boot" }
  | { phase: "empty" }
  | { phase: "generating"; idea: string }
  | { phase: "engine-down"; idea: string }
  | { phase: "ready"; report: Report; shareId?: string; idea?: string; position?: string; context?: string };

export default function ResultsPage() {
  const [state, setState] = useState<State>({ phase: "boot" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Shared report link takes priority over local session.
      const sharedId = new URLSearchParams(window.location.search).get("r")?.trim();
      if (sharedId) {
        try {
          const res = await fetch(`/api/report?id=${encodeURIComponent(sharedId)}`);
          if (res.ok) {
            const data = (await res.json()) as { report: Report; id: string };
            if (!cancelled) setState({ phase: "ready", report: data.report, shareId: data.id });
            return;
          }
        } catch { /* fall through to session */ }
      }

      const session = loadSession();
      const idea = session?.setup?.topic?.trim();

      if (!idea) {
        if (!cancelled) setState({ phase: "empty" });
        return;
      }

      const cached = readReportCache(idea);
      if (cached) {
        if (!cancelled) setState({ phase: "ready", report: cached.report, shareId: cached.id, idea, position: session?.setup?.position, context: session?.setup?.context });
        return;
      }

      if (!cancelled) setState({ phase: "generating", idea });

      try {
        const debate = loadDebateTranscript(idea);
        const res = await fetch("/api/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idea,
            position: session?.setup?.position,
            context: session?.setup?.context,
            validation: session?.validationContent?.slice(0, 6000),
            debate: debate?.transcript?.slice(0, 4000),
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { id: string; report: Report };
        if (!data.report?.score || typeof data.report.score.value !== "number") throw new Error("bad payload");
        writeReportCache(idea, data.id, data.report);
        if (!cancelled) setState({ phase: "ready", report: data.report, shareId: data.id, idea, position: session?.setup?.position, context: session?.setup?.context });
      } catch {
        if (!cancelled) setState({ phase: "engine-down", idea });
      }
    })();

    return () => { cancelled = true; };
  }, [attempt]);

  if (state.phase === "boot") {
    return (
      <div className="chamber-scope flex min-h-screen items-center justify-center bg-background font-mono text-xs tracking-widest text-muted-foreground">
        LOADING REPORT…
      </div>
    );
  }

  if (state.phase === "empty") return <ResultsEmpty variant="no-idea" />;

  if (state.phase === "engine-down") {
    return <ResultsEmpty variant="engine-down" idea={state.idea} onRetry={() => setAttempt((n) => n + 1)} />;
  }

  if (state.phase === "generating") return <GeneratingScreen idea={state.idea} />;

  return <ResultsChamber report={state.report} shareId={state.shareId} idea={state.idea} position={state.position} context={state.context} />;
}

const GEN_STEPS = [
  "AUDITING THE SCORE · WEB-ENRICHED",
  "SCORING EIGHT RUBRIC DIMENSIONS",
  "FOLDING IN THE DEBATE TRANSCRIPT",
  "SIZING THE MARKET",
  "RANKING THE RISK REGISTER",
  "MAPPING THE COMPETITION",
  "MODELLING THE FINANCIALS",
  "TYPESETTING THE DOSSIER",
];

function GeneratingScreen({ idea }: { idea: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(GEN_STEPS.length - 1, s + 1)), 4200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="chamber-scope min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-xl border border-border bg-surface">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between text-[10px] tracking-widest">
          <span className="text-muted-foreground">PRIORITY DEBATER · SYNTHESIS ENGINE</span>
          <span className="flex items-center gap-2 text-danger">
            <span className="size-1.5 rounded-full bg-danger animate-pulse" /> LIVE
          </span>
        </div>
        <div className="px-6 py-8">
          <div className="text-display text-3xl">GENERATING YOUR <span className="hl-red">DOSSIER.</span></div>
          <p className="mt-4 text-xs text-muted-foreground leading-relaxed border-l-2 border-data pl-3">
            <span className="text-data tracking-widest">IDEA UNDER REVIEW · </span>{idea}
          </p>
          <ul className="mt-8 space-y-2.5">
            {GEN_STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-[11px] tracking-widest">
                <span className={`size-2 shrink-0 ${i < step ? "bg-success" : i === step ? "bg-warn animate-pulse" : "bg-muted"}`} />
                <span className={i <= step ? "text-foreground" : "text-muted-foreground/60"}>{s}</span>
                {i < step && <span className="ml-auto text-success">DONE</span>}
                {i === step && <span className="ml-auto text-warn">RUNNING…</span>}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-[10px] tracking-widest text-muted-foreground">
            THE SCORE IS AUDITED & WEB-ENRICHED · EVERY CHART IS GENERATED FOR THIS IDEA · ~30-60s
          </p>
        </div>
      </div>
    </div>
  );
}
