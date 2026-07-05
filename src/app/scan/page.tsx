"use client";

/**
 * /scan — the free store scan (§4.2). No login wall, URL only.
 * Three hard-cut states:
 *   entry  (black) — URL input + the page's single yellow CTA
 *   scanning (black) — live mono log streamed from POST /api/commerce/scan (SSE)
 *   result (cream) — €/mo headline + verdict counts; fixes BLURRED behind the
 *                    "connect your store" CTA (the reverse-trial gate)
 *
 * The API route is stateless; on `result` the report is kept in a pending-scan
 * localStorage key that /commerce/connect picks up and attaches to the store.
 */

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { readSseLines } from "@/lib/sse-lines";
import type { CommerceReport } from "@/lib/commerce/scan/report-types";

const PENDING_SCAN_KEY = "pd-commerce-pending-scan";

type LogLine = { label: string; status: "start" | "ok" | "warn"; ts: string };
type Phase = "entry" | "scanning" | "result" | "error";

export default function ScanPage() {
  const [phase, setPhase] = useState<Phase>("entry");
  const [url, setUrl] = useState("");
  const [log, setLog] = useState<LogLine[]>([]);
  const [report, setReport] = useState<CommerceReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  async function scan() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setPhase("scanning");
    setLog([]);
    setError(null);

    let gotReport = false;
    let failMessage: string | null = null;
    try {
      const res = await fetch("/api/commerce/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? "We couldn't reach that URL — check it and try again.");
      }
      await readSseLines(res.body.getReader(), (line) => {
        if (!line.startsWith("data: ")) return;
        let evt: Record<string, unknown>;
        try { evt = JSON.parse(line.slice(6)) as Record<string, unknown>; } catch { return; }
        if (evt.type === "log") {
          setLog((l) => [...l, { label: String(evt.label), status: evt.status as LogLine["status"], ts: String(evt.ts) }]);
          queueMicrotask(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight }));
        } else if (evt.type === "result") {
          const r = evt.report as CommerceReport;
          gotReport = true;
          setReport(r);
          try { localStorage.setItem(PENDING_SCAN_KEY, JSON.stringify(r)); } catch { /* quota */ }
        } else if (evt.type === "error") {
          failMessage = String(evt.message);
        }
      });
      if (gotReport) setPhase("result");
      else {
        setError(failMessage ?? "Scan produced no result — try again.");
        setPhase("error");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed — try again.");
      setPhase("error");
    }
  }

  if (phase === "result" && report) return <ScanResult report={report} />;

  return (
    <main className="flex min-h-[100dvh] flex-col bg-fk-black text-fk-cream" style={{ borderRadius: 0 }}>
      <div className="mx-auto flex w-full max-w-[860px] flex-1 flex-col justify-center px-6 py-20">
        <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
          Free store scan — no signup, no card
        </div>

        {phase === "entry" || phase === "error" ? (
          <>
            <h1 className="mt-6 font-display text-[clamp(2.25rem,6vw,4.5rem)] uppercase leading-[0.95] tracking-[-0.01em]">
              What do AI shoppers see when they look for you?
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/60">
              We replay five real buyer questions through an AI assistant with live web access and
              report exactly who it recommends — you, or your competitors.
            </p>
            <form
              className="mt-10 flex max-w-xl flex-col gap-3 sm:flex-row"
              onSubmit={(e) => { e.preventDefault(); void scan(); }}
            >
              <input
                className="pd2-input"
                placeholder="your-store.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-3 border-0 px-8 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.2em]"
                style={{ background: "var(--fk-yellow)", color: "var(--fk-black)", borderRadius: 0 }}
              >
                Scan my store <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            {phase === "error" && error && (
              <p className="mt-4 font-mono text-[12px] text-fk-red">{error}</p>
            )}
            <Link
              href="/commerce"
              className="mt-12 inline-block font-mono text-[11px] uppercase tracking-[0.2em] text-white/40 no-underline hover:text-white/80"
            >
              ← Back to Commerce
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-6 font-display text-[clamp(1.75rem,4.5vw,3rem)] uppercase leading-[0.95]">
              Scanning {url.replace(/^https?:\/\//, "")}
            </h1>
            <div className="mt-4 pd-bar-track"><div className="pd-bar-indeterminate" /></div>
            <div
              ref={logRef}
              className="mt-6 h-[320px] overflow-y-auto border border-fk-ink-border bg-fk-card-dark p-4 font-mono text-[12px] leading-[1.9]"
            >
              {log.map((l, i) => (
                <div key={i} className={l.status === "warn" ? "text-fk-amber" : l.status === "ok" ? "text-white/85" : "text-white/45"}>
                  <span className="mr-2 text-white/30">{l.ts.slice(11, 19)}</span>
                  {l.status === "ok" ? "✓ " : l.status === "warn" ? "! " : "> "}
                  {l.label}
                </div>
              ))}
              <span className="inline-block h-4 w-2 bg-fk-blue align-middle" style={{ animation: "blink 1s step-end infinite" }} />
            </div>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-white/35">
              Real checks, not a loading bar — 30–90 seconds
            </p>
          </>
        )}
      </div>
    </main>
  );
}

/* ── Result (cream) — top-line only, fixes locked (§4.2) ─────────────────── */

function ScanResult({ report }: { report: CommerceReport }) {
  const named = report.shock.timesNamed;
  const tested = report.shock.queriesTested;
  return (
    <main className="min-h-[100dvh] bg-fk-cream text-fk-black" style={{ borderRadius: 0 }}>
      {/* Verdict band — black */}
      <section className="bg-fk-black text-fk-cream">
        <div className="mx-auto max-w-[1120px] px-6 py-16 lg:px-10 lg:py-24">
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
            Scan complete — {report.storeName} · {report.category}
            {!report.live && " · degraded run (AI provider unavailable)"}
          </div>
          <h1 className="mt-6 font-display text-[clamp(2.5rem,7vw,6rem)] uppercase leading-[0.9]">
            <span style={{ color: "var(--fk-red)" }}>€{report.estimatedMonthlyLoss}</span>/month at risk
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">
            Asked {tested} real buyer questions, your store was named{" "}
            {named === 0 ? "zero times" : `${named} time${named === 1 ? "" : "s"}`}
            {report.topCompetitor ? ` — while ${report.topCompetitor} kept coming up.` : "."}
          </p>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-px border border-fk-ink-border bg-fk-ink-border font-mono">
            {[
              { n: report.scores.ai.score, l: "AI visibility" },
              { n: report.scores.google.score, l: "Google" },
              { n: report.scores.agentReadiness.score, l: "Agent-ready" },
            ].map((s) => (
              <div key={s.l} className="bg-fk-black p-4">
                <div className="text-2xl">{s.n}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/40">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Locked fixes — cream */}
      <section className="bg-fk-cream text-fk-black">
        <div className="mx-auto max-w-[1120px] px-6 py-16 lg:px-10 lg:py-24">
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-black/50">
            Your top {Math.min(3, report.fixes.length)} fixes — locked
          </div>
          <div className="mt-6 space-y-px bg-black/10">
            {report.fixes.slice(0, 3).map((f) => (
              <div key={f.id} className="relative flex items-center justify-between gap-4 bg-fk-cream p-5">
                <div className="select-none blur-[6px]">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/50">
                    {f.severity} · {f.channel}
                  </div>
                  <div className="mt-1 text-lg font-semibold">{f.outcome}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em]">
                  <Lock className="h-3.5 w-3.5" /> {f.impact}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link
              href="/commerce/connect?from=scan"
              className="inline-flex items-center gap-3 px-8 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.2em] no-underline"
              style={{ background: "var(--fk-yellow)", color: "var(--fk-black)", borderRadius: 0 }}
            >
              Connect your store to unlock fixes <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-black/45">
              Read + write access to product catalog only · reversible · disconnect anytime
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
