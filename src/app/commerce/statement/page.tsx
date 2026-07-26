"use client";

/**
 * THE OPERATOR STATEMENT — `/commerce/statement`
 *
 * The document that answers "what did I pay for?" It is deliberately a
 * STATEMENT, not a dashboard: a dated, printable record of work done and facts
 * measured, in the Swiss Editorial Ledger skin (docs/pdr-commerce-design.md v3).
 * Every figure here comes from the same ledgers the OS writes as it works.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AuditLine, DIMB, FAINTB, FAULTB, Figure, FigureRow, Heads, INKB, INSETB,
  LIVE, MICRO, MONO, Num, OKB, PAPER, Pick, Row, SANS, Section, Stamp, Thin, WARNB, pad2,
} from "../command/ledger-ui";

type Statement = {
  slug: string;
  business: { name: string; mark: string; url: string };
  generatedAt: string;
  period: { from: string; to: string; days: number; label: string };
  work: {
    total: number;
    byKind: { kind: string; count: number }[];
    byWorker: { worker: string; count: number }[];
    lines: { ts: string; worker: string; txt: string; kind: string }[];
    note: string;
  };
  measured: {
    agentReads: number; humanReads: number;
    byAgent: { agent: string; reads: number }[];
    bySurface: { surface: string; reads: number }[];
    orders: number; revenue: number; agentOrders: number; newCustomers: number; landingViews: number; note: string;
  };
  money: {
    revenuePeriod: number; revenueLifetime: number; cogsLifetime: number | null; marginPctLifetime: number | null;
    expensesPeriod: number; netPeriod: number | null; standingMonthlyCost: number; note: string;
  };
  needsYou: { heldPlans: { id: string; reason: string; plan: string[] }[]; gaps: string[] };
  limits: string[];
};

const WORKER_C: Record<string, string> = { MARKETING: LIVE, OPERATIONS: OKB, FINANCE: INKB, SYSTEM: DIMB };
const PERIODS = [{ w: 1, label: "7 days" }, { w: 2, label: "14 days" }, { w: 4, label: "28 days" }, { w: 12, label: "quarter" }];

export default function StatementPage() {
  const [roster, setRoster] = useState<{ slug: string; name: string }[]>([]);
  const [slug, setSlug] = useState<string | null>(null);
  const [weeks, setWeeks] = useState(1);
  const [st, setSt] = useState<Statement | null>(null);
  /** Which (business, period) the loaded statement belongs to — "assembling"
      is derived from this rather than set inside an effect. */
  const [loadedKey, setLoadedKey] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch("/api/commerce/business").then((r) => r.json())
      .then((d) => { if (d?.roster) { setRoster(d.roster); setSlug(d.business?.slug ?? d.roster[0]?.slug ?? null); } })
      .catch(() => {});
  }, []);

  const pull = useCallback((s: string, w: number) => {
    fetch(`/api/commerce/statement?slug=${s}&weeks=${w}`).then((r) => r.json())
      .then((d) => { if (d?.ok) { setSt(d.statement); setLoadedKey(`${s}:${w}`); } })
      .catch(() => {});
  }, []);
  useEffect(() => { if (slug) pull(slug, weeks); }, [slug, weeks, pull]);
  const busy = !!slug && loadedKey !== `${slug}:${weeks}`;

  const maxKind = Math.max(...(st?.work.byKind.map((k) => k.count) ?? [1]), 1);
  const lines = st ? (showAll ? st.work.lines : st.work.lines.slice(0, 14)) : [];

  return (
    <main style={{ backgroundColor: PAPER, color: INKB, minHeight: "100vh" }}>
      <div className="mx-auto max-w-[1180px] px-5 pb-24 pt-6 sm:px-8">
        {/* masthead */}
        <div className="flex flex-wrap items-end justify-between gap-4 pb-3" style={{ borderBottom: `2px solid ${INKB}` }}>
          <div>
            <div style={MICRO}>PDR COMMERCE · OPERATOR STATEMENT</div>
            <h1 className="mt-1 font-display leading-[0.9]" style={{ fontSize: "clamp(2rem,5vw,3.4rem)" }}>
              {st ? st.business.name : "…"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {PERIODS.map((p) => (
              <Pick key={p.w} active={weeks === p.w} onClick={() => setWeeks(p.w)}>{p.label}</Pick>
            ))}
            <Link href="/commerce/command" className="ml-2 text-[12px] font-semibold no-underline" style={{ color: LIVE, fontFamily: SANS }}>← the OS</Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 py-2.5">
          <span style={MICRO}>
            PERIOD · {st ? `${st.period.from.slice(0, 10)} → ${st.period.to.slice(0, 10)}` : "…"} ({st?.period.days ?? weeks * 7} DAYS)
          </span>
          <span style={MICRO}>ISSUED · {st ? st.generatedAt.slice(0, 19).replace("T", " ") + " UTC" : "…"}</span>
          {roster.length > 1 && (
            <span className="flex flex-wrap items-center gap-1.5">
              {roster.map((r) => (
                <button key={r.slug} onClick={() => setSlug(r.slug)}
                  className="text-[11px] font-semibold"
                  style={{ fontFamily: MONO, letterSpacing: "0.08em", color: r.slug === slug ? LIVE : FAINTB, background: "none", border: "none", cursor: "pointer" }}>
                  {r.name}
                </button>
              ))}
            </span>
          )}
          {busy && <Stamp text="assembling" color={WARNB} />}
        </div>

        {!st ? (
          <Thin>Loading the record…</Thin>
        ) : (
          <>
            <Section n={1} title="What the workforce did" right={<span style={MICRO}>{st.work.total} LOGGED ACTIONS IN {st.period.label.toUpperCase()}</span>}>
              {st.work.total === 0 ? (
                <Thin>{st.work.note}</Thin>
              ) : (
                <>
                  <FigureRow cols={4}>
                    <Figure label="ACTIONS TAKEN" value={st.work.total} color={LIVE} note={`across ${st.work.byKind.length} kinds of work`} />
                    {st.work.byWorker.slice(0, 3).map((w) => (
                      <Figure key={w.worker} label={w.worker} value={w.count} size="md" color={WORKER_C[w.worker] ?? DIMB} note="ledger entries" />
                    ))}
                  </FigureRow>
                  <div className="pt-4">
                    {st.work.byKind.map((k) => (
                      <Row key={k.kind} cols="minmax(0,200px) 56px minmax(0,1fr)">
                        <span className="text-[13px] font-semibold">{k.kind}</span>
                        <Num bold>{k.count}</Num>
                        <span className="flex items-center">
                          <span style={{ backgroundColor: INSETB, height: 10, width: "100%", maxWidth: 420 }}>
                            <span style={{ display: "block", width: `${(k.count / maxKind) * 100}%`, height: "100%", backgroundColor: INKB }} />
                          </span>
                        </span>
                      </Row>
                    ))}
                  </div>
                  <div className="pt-3 text-[12.5px]" style={{ color: DIMB }}>{st.work.note}</div>
                </>
              )}
            </Section>

            {st.work.total > 0 && (
              <Section n={2} title="The evidence" right={
                <Pick onClick={() => setShowAll(!showAll)} active={showAll}>
                  {showAll ? `all ${st.work.lines.length}` : `newest 14 of ${st.work.lines.length}`}
                </Pick>
              }>
                <Heads cols="118px 96px minmax(0,1fr)" labels={["WHEN", "WORKER", "WHAT HAPPENED"]} />
                {lines.map((l, i) => (
                  <Row key={i} cols="118px 96px minmax(0,1fr)">
                    <Num color={FAINTB}>{l.ts.slice(5, 16).replace("T", " ")}</Num>
                    <span><Stamp text={l.worker} color={WORKER_C[l.worker] ?? DIMB} /></span>
                    <span className="min-w-0 text-pretty text-[13px]" style={{ color: DIMB }}>{l.txt}</span>
                  </Row>
                ))}
              </Section>
            )}

            <Section n={3} title="What was measured" right={<span style={MICRO}>NOTHING HERE IS MODELLED</span>}>
              <FigureRow cols={5}>
                <Figure label="AGENT READS" value={st.measured.agentReads} color={st.measured.agentReads ? LIVE : FAINTB} />
                <Figure label="HUMAN READS" value={st.measured.humanReads} color={DIMB} />
                <Figure label="ORDERS" value={st.measured.orders} color={st.measured.orders ? OKB : FAINTB} note={`${st.measured.agentOrders} placed by agents`} />
                <Figure label="REVENUE" value={`€${st.measured.revenue.toLocaleString("en-US")}`} color={st.measured.revenue ? OKB : FAINTB} />
                <Figure label="NEW CUSTOMERS" value={st.measured.newCustomers} color={DIMB} note={`${st.measured.landingViews} landing views (lifetime)`} />
              </FigureRow>
              {st.measured.byAgent.length > 0 && (
                <div className="pt-4">
                  <Heads cols="minmax(0,240px) 70px minmax(0,1fr)" labels={["WHO READ THE STORE", "READS", ""]} />
                  {st.measured.byAgent.map((a) => {
                    const top = Math.max(...st.measured.byAgent.map((x) => x.reads), 1);
                    return (
                      <Row key={a.agent} cols="minmax(0,240px) 70px minmax(0,1fr)">
                        <span className="text-[13px] font-semibold">{a.agent}</span>
                        <Num color={LIVE} bold>{a.reads}</Num>
                        <span className="flex items-center">
                          <span style={{ backgroundColor: INSETB, height: 10, width: "100%", maxWidth: 360 }}>
                            <span style={{ display: "block", width: `${(a.reads / top) * 100}%`, height: "100%", backgroundColor: LIVE }} />
                          </span>
                        </span>
                      </Row>
                    );
                  })}
                  <div className="flex flex-wrap items-center gap-2 pt-3">
                    <span style={MICRO}>SURFACES READ</span>
                    {st.measured.bySurface.map((s) => <Stamp key={s.surface} text={`${s.surface} ${s.reads}`} color={DIMB} />)}
                  </div>
                </div>
              )}
              <div className="pt-3 text-[12.5px]" style={{ color: DIMB }}>{st.measured.note}</div>
            </Section>

            <Section n={4} title="The money" right={<span style={MICRO}>PERIOD AND LIFETIME FIGURES ARE LABELLED SEPARATELY</span>}>
              <FigureRow cols={5}>
                <Figure label="REVENUE · PERIOD" value={`€${st.money.revenuePeriod.toLocaleString("en-US")}`} color={st.money.revenuePeriod ? OKB : FAINTB} />
                <Figure label="EXPENSES · PERIOD" value={`€${st.money.expensesPeriod.toLocaleString("en-US")}`} color={st.money.expensesPeriod ? WARNB : FAINTB} note={st.money.standingMonthlyCost ? `incl. €${st.money.standingMonthlyCost}/mo standing, pro-rata` : "no standing costs"} />
                <Figure label="NET · PERIOD" value={st.money.netPeriod != null ? `€${st.money.netPeriod.toLocaleString("en-US")}` : "—"}
                  color={st.money.netPeriod == null ? FAINTB : st.money.netPeriod >= 0 ? OKB : FAULTB}
                  note={st.money.netPeriod == null ? "needs unit costs on every sellable" : "revenue − COGS share − expenses"} />
                <Figure label="MARGIN · LIFETIME" value={st.money.marginPctLifetime != null ? `${st.money.marginPctLifetime}%` : "—"} color={st.money.marginPctLifetime != null ? OKB : FAINTB} />
                <Figure label="REVENUE · LIFETIME" value={`€${st.money.revenueLifetime.toLocaleString("en-US")}`} color={DIMB} note={st.money.cogsLifetime != null ? `COGS €${st.money.cogsLifetime}` : "COGS unknown"} />
              </FigureRow>
              <div className="pt-3 text-[12.5px]" style={{ color: DIMB }}>{st.money.note}</div>
            </Section>

            <Section n={5} title="What needs you" right={<span style={MICRO}>{st.needsYou.heldPlans.length} HELD PLAN(S) · {st.needsYou.gaps.length} GAP(S)</span>}>
              {st.needsYou.heldPlans.length === 0 && st.needsYou.gaps.length === 0 && <Thin>Nothing is waiting on you.</Thin>}
              {st.needsYou.heldPlans.map((h) => (
                <div key={h.id} className="mb-3 px-3 py-3" style={{ backgroundColor: INSETB, borderLeft: `2px solid ${WARNB}` }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Stamp text={`${h.id} awaiting approval`} color={WARNB} filled />
                    <span className="text-[13px]">{h.reason}</span>
                  </div>
                  {h.plan.map((p) => <div key={p} className="mt-1 text-[12.5px]" style={{ fontFamily: MONO, color: DIMB }}>{p}</div>)}
                  <Link href="/commerce/command" className="mt-2 inline-block text-[12px] font-semibold no-underline" style={{ color: LIVE, fontFamily: SANS }}>
                    review it in Automation →
                  </Link>
                </div>
              ))}
              {st.needsYou.gaps.map((g, i) => (
                <Row key={i} warn>
                  <Stamp text={`gap ${pad2(i + 1)}`} color={DIMB} />
                  <span className="min-w-0 flex-1 text-pretty text-[13px]" style={{ color: DIMB }}>{g}</span>
                </Row>
              ))}
            </Section>

            <Section n={6} title="How to read this statement">
              {st.limits.map((l) => (
                <Row key={l}>
                  <span className="min-w-0 flex-1 text-pretty text-[13px]" style={{ color: DIMB }}>{l}</span>
                </Row>
              ))}
              <div className="flex flex-wrap gap-2 pt-4">
                <Link href={st.business.url} target="_blank" rel="noreferrer" className="text-[12px] font-semibold no-underline" style={{ color: LIVE, fontFamily: SANS }}>the live store ↗</Link>
                <Link href="/commerce/command" className="text-[12px] font-semibold no-underline" style={{ color: LIVE, fontFamily: SANS }}>the OS ↗</Link>
              </div>
            </Section>

            <AuditLine
              measured="logged worker actions · classified agent reads · real order ids · recorded expenses"
              awaiting="channel-side performance (needs ad accounts) · off-domain traffic (needs hosting)"
            />
          </>
        )}
      </div>
    </main>
  );
}
