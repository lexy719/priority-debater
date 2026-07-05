"use client";

/**
 * /scan — the free store scan (§4.2 + §6). No login wall, URL only.
 *
 * Three hard-cut states on one page:
 *   entry    (black) — store-URL input + the page's single yellow CTA.
 *   scanning (black) — a LIVE MONO LOG streamed from POST /api/commerce/scan
 *                      (SSE). Lines append with hard cuts (no fade), each `>`
 *                      prefixed, warnings non-blocking.
 *   result   (cream) — top-line verdict + €/mo estimate ONLY (big mono number);
 *                      the per-product fixes are BLURRED/LOCKED behind the
 *                      "Connect your store to unlock fixes" CTA.
 *
 * The scan mechanism is preserved verbatim: the same SSE contract, the same
 * CommerceReport shape, the same pending-scan localStorage handoff that
 * /commerce/connect reads back. Only the VIEW/markup is rebuilt for the
 * brutalist design system (docs/design-system.md).
 */

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { readSseLines } from "@/lib/sse-lines";
import type { CommerceReport } from "@/lib/commerce/scan/report-types";

const PENDING_SCAN_KEY = "pd-commerce-pending-scan";

type LogLine = { label: string; status: "start" | "ok" | "warn"; ts: string };
type Phase = "entry" | "scanning" | "result" | "error";

/** Client-side format gate — the server does the real reachability check. */
function looksLikeUrl(input: string): boolean {
  const s = input.trim().replace(/^https?:\/\//i, "");
  const host = s.split(/[/?#]/)[0];
  return host.includes(".") && /^[a-z0-9.-]+$/i.test(host) && host.length >= 4;
}

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
    if (!looksLikeUrl(trimmed)) {
      setError("We couldn't reach that URL — check it and try again.");
      setPhase("error");
      return;
    }
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
        setError(failMessage ?? "We couldn't reach that URL — check it and try again.");
        setPhase("error");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed — try again.");
      setPhase("error");
    }
  }

  if (phase === "result" && report) return <ScanResult report={report} />;
  if (phase === "scanning") return <ScanRunning host={displayHost(url)} log={log} logRef={logRef} />;

  return <ScanEntry url={url} setUrl={setUrl} onScan={scan} error={phase === "error" ? error : null} />;
}

function displayHost(url: string): string {
  return url.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[/?#]/)[0] || "your store";
}

/* ── Entry (black) — URL only, one yellow CTA (§4.2) ─────────────────────── */

function ScanEntry({
  url,
  setUrl,
  onScan,
  error,
}: {
  url: string;
  setUrl: (v: string) => void;
  onScan: () => void;
  error: string | null;
}) {
  return (
    <main className="flex min-h-[100dvh] flex-col bg-fk-black text-fk-cream" style={{ borderRadius: 0 }}>
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col justify-center px-6 py-20">
        <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
          Free store scan — no signup, no card
        </div>

        <h1 className="mt-7 font-display text-[clamp(2.5rem,6.5vw,5rem)] uppercase leading-[0.9] tracking-[-0.01em]">
          Is your store visible
          <br />
          to AI shoppers?
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">
          We replay five real buyer questions through an AI assistant with live web access, then
          report exactly who it recommends — you, or your competitors.
        </p>

        <form
          className="mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row"
          onSubmit={(e) => { e.preventDefault(); onScan(); }}
        >
          <input
            className="pd2-input"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="your-store.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-label="Your store URL"
            aria-invalid={error ? true : undefined}
            autoFocus
          />
          <button
            type="submit"
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-3 border-0 px-8 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.2em]"
            style={{ background: "var(--fk-yellow)", color: "var(--fk-black)", borderRadius: 0, transition: "none" }}
          >
            Scan my store <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {error && (
          <p className="mt-4 font-mono text-[12px] leading-relaxed text-fk-red" role="alert">
            {error}
          </p>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/35">
          <span>› ChatGPT</span>
          <span>› Gemini</span>
          <span>› Perplexity</span>
          <span>› Google</span>
        </div>

        <Link
          href="/commerce"
          className="mt-14 inline-block font-mono text-[11px] uppercase tracking-[0.2em] text-white/40 no-underline hover:text-white/80"
          style={{ transition: "color 0.15s ease" }}
        >
          ← Back to Commerce
        </Link>
      </div>
    </main>
  );
}

/* ── Scanning (black) — live mono log, hard-cut appends (§4.2) ───────────── */

function ScanRunning({
  host,
  log,
  logRef,
}: {
  host: string;
  log: LogLine[];
  logRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <main className="flex min-h-[100dvh] flex-col bg-fk-black text-fk-cream" style={{ borderRadius: 0 }}>
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col justify-center px-6 py-20">
        <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
          Scanning — live
        </div>

        <h1 className="mt-6 font-display text-[clamp(1.75rem,4.5vw,3.25rem)] uppercase leading-[0.92]">
          Scanning {host}
        </h1>

        <div className="mt-6 pd-bar-track">
          <div className="pd-bar-indeterminate" />
        </div>

        <div
          ref={logRef}
          className="mt-6 h-[360px] overflow-y-auto border border-fk-ink-border bg-fk-card-dark p-5 font-mono text-[12px] leading-relaxed"
          style={{ borderRadius: 0 }}
          aria-live="polite"
          aria-label="Scan progress log"
        >
          {log.length === 0 && (
            <div className="text-white/40">
              &gt; Booting scan
              <span className="pd-blink ml-1 inline-block h-3.5 w-[7px] translate-y-[1px] bg-fk-blue align-middle" />
            </div>
          )}
          {log.map((l, i) => {
            const color =
              l.status === "warn" ? "text-fk-amber" : l.status === "ok" ? "text-white/85" : "text-white/50";
            const glyph = l.status === "ok" ? "✓" : l.status === "warn" ? "!" : ">";
            return (
              <div key={i} className={`flex gap-2 ${color}`} style={{ transition: "none" }}>
                <span className="shrink-0 text-white/25 tabular-nums">{l.ts.slice(11, 19)}</span>
                <span className="shrink-0 w-3 text-center">{glyph}</span>
                <span className="min-w-0 break-words">{l.label}</span>
              </div>
            );
          })}
          {log.length > 0 && (
            <div className="mt-1 flex gap-2 text-white/50">
              <span className="shrink-0 w-[52px]" />
              <span className="shrink-0 w-3 text-center">&gt;</span>
              <span className="pd-blink inline-block h-3.5 w-[7px] translate-y-[2px] bg-fk-blue" />
            </div>
          )}
        </div>

        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-white/35">
          Real checks, not a loading bar — this takes 30–90 seconds
        </p>
      </div>
    </main>
  );
}

/* ── Result (cream) — top-line only, fixes locked (§4.2 + §6.3) ──────────── */

function ScanResult({ report }: { report: CommerceReport }) {
  const named = report.shock.timesNamed;
  const tested = report.shock.queriesTested;
  // Honest reframe for an essentially empty catalog: the engine gives no fixes
  // and no meaningful mention signal when there's nothing to read.
  const emptyCatalog = report.fixes.length === 0 && named === 0 && !report.topCompetitor;
  const fixCount = Math.min(3, report.fixes.length);

  return (
    <main className="min-h-[100dvh] bg-fk-cream text-fk-black" style={{ borderRadius: 0 }}>
      {/* Verdict band — black */}
      <section className="bg-fk-black text-fk-cream">
        <div className="mx-auto max-w-[1120px] px-6 py-16 lg:px-10 lg:py-24">
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
            Scan complete — {report.storeName} · {report.category}
            {!report.live && " · degraded run (AI provider unavailable)"}
          </div>

          {emptyCatalog ? (
            <>
              <h1 className="mt-6 font-display text-[clamp(2rem,5.5vw,4.25rem)] uppercase leading-[0.92]">
                Your catalog needs basic
                <br />
                content first
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">
                We couldn&apos;t read enough product content to estimate AI visibility. Before an
                assistant can recommend {report.storeName}, it needs a readable catalog with product
                names, descriptions, and prices in place.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-6 font-display text-[clamp(2.5rem,7vw,6rem)] uppercase leading-[0.9]">
                <span className="font-mono tabular-nums" style={{ color: "var(--fk-red)" }}>
                  €{report.estimatedMonthlyLoss.toLocaleString("en-US")}
                </span>
                <span className="text-fk-cream">/month at risk</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">
                Across {tested} real buyer questions, your store was named{" "}
                <span className="text-fk-cream">
                  {named === 0 ? "zero times" : `${named} time${named === 1 ? "" : "s"}`}
                </span>
                {report.topCompetitor ? ` — while ${report.topCompetitor} kept coming up.` : "."}
              </p>

              <div className="mt-10 grid max-w-xl grid-cols-3 gap-px border border-fk-ink-border bg-fk-ink-border font-mono">
                {[
                  { n: report.scores.ai.score, l: "AI visibility" },
                  { n: report.scores.google.score, l: "Google" },
                  { n: report.scores.agentReadiness.score, l: "Agent-ready" },
                ].map((s) => (
                  <div key={s.l} className="bg-fk-black p-4">
                    <div className="text-2xl tabular-nums">{s.n}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/40">{s.l}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Locked fixes — cream */}
      <section className="bg-fk-cream text-fk-black">
        <div className="mx-auto max-w-[1120px] px-6 py-16 lg:px-10 lg:py-24">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-black/50">
            <Lock className="h-3.5 w-3.5" />
            {emptyCatalog ? "What to do next — locked" : `Your top ${fixCount} fixes — locked`}
          </div>

          {emptyCatalog ? (
            <div className="mt-6 space-y-px bg-black/10" aria-hidden>
              {["Add readable product descriptions", "Publish structured pricing & stock", "Open your store to AI crawlers"].map((t) => (
                <div key={t} className="flex items-center justify-between gap-4 bg-fk-cream p-5">
                  <div className="select-none blur-[6px] pointer-events-none">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/50">CONTENT · SETUP</div>
                    <div className="mt-1 text-lg font-semibold">{t}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-black/60">
                    <Lock className="h-3.5 w-3.5" /> LOCKED
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 space-y-px bg-black/10">
              {report.fixes.slice(0, 3).map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-4 bg-fk-cream p-5">
                  <div className="select-none blur-[6px] pointer-events-none">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/50">
                      {f.severity} · {f.channel}
                    </div>
                    <div className="mt-1 text-lg font-semibold">{f.outcome}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-black/60">
                    <Lock className="h-3.5 w-3.5" /> {f.impact}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10">
            <Link
              href="/commerce/connect?from=scan"
              className="inline-flex items-center gap-3 px-8 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.2em] no-underline"
              style={{ background: "var(--fk-yellow)", color: "var(--fk-black)", borderRadius: 0, transition: "none" }}
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
