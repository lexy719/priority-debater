"use client";

/**
 * /commerce/visibility — THE WEDGE.
 *
 * "Can AI shoppers find and buy from your store?" Free, no login, any URL.
 * Every finding is a real HTTP observation (no API key, nothing simulated),
 * graded across DISCOVERY · LEGIBILITY · TRANSACTABILITY with a fix list —
 * then the honest offer: Commerce can operate the fixes and measure the funnel.
 * Swiss Editorial Ledger (docs/pdr-commerce-design.md v3).
 */

import Link from "next/link";
import { useState } from "react";

const PAPER = "#F5F3ED", INKB = "#111111", HAIRB = "#CFC9BC", DIMB = "#6B6659", FAINTB = "#9B968A";
const LIVE = "#0047FF", OKB = "#1F7A44", WARNB = "#B45309", FAULTB = "#C0271D", INSETB = "#ECE8DE";
const MONO = "var(--app-font-mono), ui-monospace, monospace";
const MICRO: React.CSSProperties = { fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: FAINTB };

type Dimension = "DISCOVERY" | "LEGIBILITY" | "TRANSACTABILITY";
type Check = { id: string; dim: Dimension; label: string; status: "PASS" | "WARN" | "FAIL"; weight: number; note: string; fix?: string };
type Report = {
  url: string; host: string; ts: string; platform: string | null;
  score: number; grade: "STRONG" | "PARTIAL" | "INVISIBLE";
  dims: Record<Dimension, { score: number; max: number }>;
  checks: Check[]; headline: string; productUrl: string | null; agentAllow: Record<string, boolean>;
};

const GRADE_C: Record<Report["grade"], string> = { STRONG: OKB, PARTIAL: WARNB, INVISIBLE: FAULTB };
const STATUS_C: Record<Check["status"], string> = { PASS: OKB, WARN: WARNB, FAIL: FAULTB };
const DIMS: Dimension[] = ["DISCOVERY", "LEGIBILITY", "TRANSACTABILITY"];
const DIM_WHAT: Record<Dimension, string> = {
  DISCOVERY: "Can agents reach you at all",
  LEGIBILITY: "Can they understand what you sell",
  TRANSACTABILITY: "Can they complete a purchase",
};

function Stamp({ text, color }: { text: string; color: string }) {
  return <span className="inline-block whitespace-nowrap px-1.5 py-[2px]" style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, border: `1px solid ${color}`, color }}>{text}</span>;
}

export default function VisibilityScan() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  const run = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy || !url.trim()) return;
    setBusy(true); setErr(null); setReport(null);
    try {
      const r = await fetch("/api/commerce/visibility", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
      const d = await r.json();
      if (d?.ok) setReport(d.report); else setErr(String(d?.error ?? "Could not audit that URL"));
    } catch { setErr("The audit could not complete. Try again."); }
    setBusy(false);
  };

  const failures = report?.checks.filter((c) => c.status === "FAIL") ?? [];
  const warnings = report?.checks.filter((c) => c.status === "WARN") ?? [];

  return (
    <main style={{ backgroundColor: PAPER, color: INKB, minHeight: "100dvh", fontFamily: "var(--app-font-sans), system-ui, sans-serif" }}>
      <div className="mx-auto max-w-[1040px] px-6 pb-24">
        {/* masthead */}
        <header className="flex flex-wrap items-baseline gap-x-6 gap-y-2 py-5" style={{ borderBottom: `1px solid ${HAIRB}` }}>
          <Link href="/" className="font-display text-[1.2rem] uppercase leading-none no-underline" style={{ color: INKB }}>PDR</Link>
          <Link href="/commerce" className="text-[13px] font-semibold no-underline" style={{ color: LIVE }}>Commerce</Link>
          <span style={MICRO}>AI VISIBILITY AUDIT · FREE · NO ACCOUNT</span>
        </header>

        {/* ── the ask ── */}
        <section className="pt-12">
          <div style={MICRO}>THE QUESTION EVERY STORE NOW HAS TO ANSWER</div>
          <h1 className="mt-4 max-w-[19ch] text-balance font-display text-[clamp(2.3rem,7vw,4.6rem)] uppercase leading-[0.92]">
            Can AI shoppers find and buy from your store?
          </h1>
          <p className="mt-6 max-w-[54ch] text-pretty text-[15px] leading-[1.65]" style={{ color: DIMB }}>
            We fetch your store the way an AI shopping agent does — plain HTTP, no JavaScript — and grade what it can
            actually read and buy. Every finding below is a real response from your server. Nothing is estimated.
          </p>

          <form onSubmit={run} className="mt-8 flex flex-wrap items-center gap-3">
            <input
              value={url} onChange={(e) => setUrl(e.target.value)} placeholder="yourstore.com" inputMode="url"
              aria-label="Store URL"
              className="h-12 min-w-[280px] flex-1 px-4 text-[15px]"
              style={{ fontFamily: MONO, border: `1px solid ${INKB}`, backgroundColor: "transparent", color: INKB, outline: "none" }}
            />
            <button type="submit" disabled={busy || !url.trim()}
              className="h-12 px-6 text-[13px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ backgroundColor: INKB, color: PAPER }}>
              {busy ? "AUDITING…" : "RUN THE AUDIT →"}
            </button>
          </form>
          {err && <div className="mt-3 text-[13px] font-semibold" style={{ color: FAULTB }}>{err}</div>}
          {busy && (
            <div className="mt-4" style={MICRO}>
              FETCHING HOMEPAGE · ROBOTS · SITEMAP · FEED · A PRODUCT PAGE · CHECKOUT · PROTOCOL ENDPOINTS
            </div>
          )}
          {!report && !busy && (
            <div className="mt-10 grid gap-x-10 gap-y-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", borderTop: `1px solid ${HAIRB}`, paddingTop: 18 }}>
              {DIMS.map((d) => (
                <div key={d}>
                  <div style={MICRO}>{d}</div>
                  <div className="mt-1.5 text-[13.5px]" style={{ color: DIMB }}>{DIM_WHAT[d]}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── the report ── */}
        {report && (
          <>
            {/* verdict */}
            <section className="mt-12">
              <div style={{ height: 2, backgroundColor: INKB }} />
              <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 py-6">
                <div className="min-w-0">
                  <div style={MICRO}>{report.host}{report.platform ? ` · ${report.platform}` : ""} · AUDITED {report.ts.slice(11, 16)} UTC</div>
                  <div className="mt-2 flex items-baseline gap-4">
                    <span className="font-display leading-[0.85] tabular-nums" style={{ fontSize: "clamp(3.4rem,11vw,6.5rem)", color: GRADE_C[report.grade] }}>{report.score}</span>
                    <div>
                      <div className="font-display text-[clamp(1.2rem,3vw,1.8rem)] uppercase leading-none" style={{ color: GRADE_C[report.grade] }}>{report.grade}</div>
                      <div style={MICRO}>/ 100 AI VISIBILITY</div>
                    </div>
                  </div>
                </div>
                <p className="max-w-[42ch] text-pretty text-[15px] font-semibold leading-snug">{report.headline}</p>
              </div>
              {/* dimension bars */}
              <div className="grid gap-x-10 gap-y-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", borderTop: `1px solid ${HAIRB}`, borderBottom: `1px solid ${HAIRB}`, paddingTop: 16, paddingBottom: 16 }}>
                {DIMS.map((d) => {
                  const v = report.dims[d];
                  const pct = v.max ? Math.round((v.score / v.max) * 100) : 0;
                  const c = pct >= 70 ? OKB : pct >= 40 ? WARNB : FAULTB;
                  return (
                    <div key={d}>
                      <div className="flex items-baseline justify-between">
                        <span style={MICRO}>{d}</span>
                        <span className="tabular-nums" style={{ fontFamily: MONO, fontSize: 12, color: c, fontWeight: 700 }}>{pct}%</span>
                      </div>
                      <div className="mt-1.5" style={{ backgroundColor: INSETB, height: 10 }}>
                        <div style={{ width: `${pct}%`, height: "100%", backgroundColor: c }} />
                      </div>
                      <div className="mt-1.5 text-[12px]" style={{ color: DIMB }}>{DIM_WHAT[d]}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* per-agent access */}
            {Object.keys(report.agentAllow).length > 0 && (
              <section className="mt-10">
                <div style={{ height: 2, backgroundColor: INKB }} />
                <div className="flex flex-wrap items-baseline gap-x-4 py-3">
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: LIVE, fontWeight: 700 }}>№01</span>
                  <h2 className="font-display text-[clamp(1.3rem,3vw,1.8rem)] uppercase leading-none">Which agents you allow</h2>
                </div>
                <div className="flex flex-wrap gap-2 pb-1">
                  {Object.entries(report.agentAllow).map(([a, ok]) => (
                    <Stamp key={a} text={`${a} ${ok ? "allowed" : "blocked"}`} color={ok ? OKB : FAULTB} />
                  ))}
                </div>
                <div className="mt-3 text-[12.5px]" style={{ color: DIMB }}>
                  Each blocked agent is an AI shopping surface your products cannot appear on, no matter how good the rest of the store is.
                </div>
              </section>
            )}

            {/* findings */}
            <section className="mt-10">
              <div style={{ height: 2, backgroundColor: INKB }} />
              <div className="flex flex-wrap items-baseline gap-x-4 py-3">
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: LIVE, fontWeight: 700 }}>№02</span>
                <h2 className="font-display text-[clamp(1.3rem,3vw,1.8rem)] uppercase leading-none">The findings</h2>
                <span className="ml-auto" style={MICRO}>{failures.length} FAILING · {warnings.length} PARTIAL · {report.checks.length} CHECKED</span>
              </div>
              {DIMS.map((d) => {
                const rows = report.checks.filter((c) => c.dim === d);
                if (!rows.length) return null;
                return (
                  <div key={d} className="mt-4">
                    <div style={MICRO}>{d}</div>
                    {rows.map((c) => (
                      <div key={c.id} className="grid items-start gap-x-4 gap-y-1.5 py-3 sm:grid-cols-[62px_minmax(0,1fr)]" style={{ borderBottom: `1px solid ${HAIRB}` }}>
                        <Stamp text={c.status} color={STATUS_C[c.status]} />
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-semibold">{c.label}</div>
                          <div className="mt-1 text-pretty text-[12.5px]" style={{ color: DIMB }}>{c.note}</div>
                          {c.fix && (
                            <div className="mt-2 p-3 text-pretty text-[12.5px] leading-relaxed" style={{ backgroundColor: INSETB, borderLeft: `2px solid ${LIVE}`, color: INKB }}>
                              <span style={{ ...MICRO, color: LIVE, marginRight: 6 }}>FIX</span>{c.fix}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </section>

            {/* the offer */}
            <section className="mt-12">
              <div style={{ height: 2, backgroundColor: INKB }} />
              <div className="py-8">
                <div style={MICRO}>WHAT NEXT</div>
                <h2 className="mt-3 max-w-[24ch] text-balance font-display text-[clamp(1.6rem,4vw,2.6rem)] uppercase leading-[0.95]">
                  Knowing is free. Fixing it is the work.
                </h2>
                <p className="mt-4 max-w-[52ch] text-pretty text-[14px] leading-[1.7]" style={{ color: DIMB }}>
                  PDR Commerce operates the fixes and then measures whether they worked — crawls, product retrievals and
                  agent orders, per agent and per product. Studio can also fabricate a store that is agent-readable from
                  birth, if you would rather start clean than retrofit.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <Link href="/commerce/command" className="px-6 py-3.5 text-[12.5px] font-semibold no-underline" style={{ backgroundColor: INKB, color: PAPER }}>OPEN THE OPERATING SYSTEM →</Link>
                  <Link href="/studio" className="px-6 py-3.5 text-[12.5px] font-semibold no-underline" style={{ border: `1px solid ${HAIRB}`, color: DIMB }}>Fabricate an agent-first store ↗</Link>
                  <button onClick={() => { setReport(null); setUrl(""); }} className="text-[12.5px] font-semibold" style={{ color: LIVE }}>Audit another store</button>
                </div>
              </div>
              <div className="flex flex-wrap justify-between gap-4 pt-4" style={{ borderTop: `1px solid ${HAIRB}` }}>
                <span style={MICRO}>EVERY FINDING IS A REAL HTTP RESPONSE FROM {report.host.toUpperCase()}</span>
                <span style={MICRO}>NO ESTIMATES · NO ACCOUNT · NO API KEYS USED</span>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
