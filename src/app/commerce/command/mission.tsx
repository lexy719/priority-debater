"use client";

/**
 * MISSION CONTROL and the WORKER CONSOLE — architecture §11 and §12.
 *
 * §11 asks for a large central status, not hundreds of graphs. §12 asks that
 * clicking a department shows you an EMPLOYEE rather than a chart: what it did,
 * what it is waiting on you for, and what it is allowed to do.
 *
 * Three rules this file keeps, each of which was a real bug first:
 *
 *   A status is never decoration. Every dot carries the sentence that produced
 *   it, straight from the measurement — no colour without a reason underneath.
 *
 *   The headline may not disagree with the grid. `warnings` counts departments
 *   with a concern, including unarmed ones, because a problem an unarmed
 *   department can see is still a problem.
 *
 *   "Not armed" is said out loud. The commonest reason an autonomous product
 *   looks dead is that nobody gave it permission to do anything, and an owner
 *   should never have to infer that from a quiet screen.
 */

import {
  DIMB, FAINTB, FAULTB, HAIRB, INKB, INSETB, LIVE, MICRO, MONO, OKB, PAPER, WARNB,
  Num, Stamp,
} from "./ledger-ui";

export type DeptState = "attention" | "busy" | "healthy" | "idle" | "unarmed";

export type DeptCard = {
  id: string;
  name: string;
  remit: string;
  state: DeptState;
  because: string;
  concern: boolean;
  metricLabel: string;
  metric: string | number;
  authority: string;
  armed: boolean;
  recent: { time: string | null; text: string; unattended: boolean }[];
  asks: { question: string; cost: string; action?: string }[];
};

export type Mission = {
  business: { slug: string; name: string; code: string; domain: string; canWrite: boolean };
  status: { word: string; because: string };
  glance: {
    revenueToday: number; ordersToday: number;
    profit: number | null; profitNote: string | null;
    orders: number; aiOrders: number; settled: number; booked: number; agentReads: number;
    departmentsArmed: number; departmentsTotal: number; warnings: number;
  };
  departments: DeptCard[];
};

const STATE_COLOR: Record<DeptState, string> = {
  attention: FAULTB, busy: LIVE, healthy: OKB, idle: FAINTB, unarmed: FAINTB,
};
const STATE_WORD: Record<DeptState, string> = {
  attention: "needs attention", busy: "busy", healthy: "healthy",
  idle: "nothing to do", unarmed: "not armed",
};

/* ── Mission Control ───────────────────────────────────────────────────── */

/** One figure on the status board. */
function Glance({ label, value, note, color = INKB }: {
  label: string; value: string | number; note?: string | null; color?: string;
}) {
  return (
    <div>
      <div style={MICRO}>{label}</div>
      <div className="mt-1 font-display leading-none" style={{ fontSize: "clamp(1.5rem,3.4vw,2.4rem)", color }}>{value}</div>
      {note && <div className="mt-1 text-[11.5px] leading-snug" style={{ color: FAINTB }}>{note}</div>}
    </div>
  );
}

export function MissionControl({ m, onOpen }: { m: Mission; onOpen: (id: string) => void }) {
  const alarmed = m.glance.warnings > 0;
  const statusColor = alarmed ? FAULTB : m.glance.departmentsArmed === 0 ? FAINTB : OKB;

  return (
    <>
      {/* ── the one thing you look at first ── */}
      <div className="mt-5" style={{ borderTop: `2px solid ${INKB}`, paddingTop: 20 }}>
        <div className="flex flex-wrap items-end gap-x-10 gap-y-5">
          <div className="min-w-0">
            <div style={MICRO}>BUSINESS STATUS</div>
            <div className="mt-1 font-display uppercase leading-[0.9]"
              style={{ fontSize: "clamp(2.6rem,7vw,4.4rem)", color: statusColor }}>
              {m.status.word}
            </div>
          </div>
          <p className="max-w-[46ch] text-pretty text-[13.5px] leading-relaxed" style={{ color: DIMB }}>
            {m.status.because}
          </p>
        </div>

        <div className="mt-8 grid gap-x-8 gap-y-7"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))" }}>
          <Glance label="REVENUE TODAY" value={`€${m.glance.revenueToday.toLocaleString("en-US")}`}
            note={m.glance.ordersToday ? `${m.glance.ordersToday} order${m.glance.ordersToday === 1 ? "" : "s"} today` : "nothing today"}
            color={m.glance.revenueToday ? OKB : FAINTB} />
          <Glance label="PROFIT"
            value={m.glance.profit != null ? `€${m.glance.profit.toLocaleString("en-US")}` : "—"}
            note={m.glance.profitNote}
            color={m.glance.profit != null ? OKB : FAINTB} />
          <Glance label="ORDERS" value={m.glance.orders} note={`€${m.glance.booked.toLocaleString("en-US")} booked`} />
          <Glance label="AI ORDERS" value={m.glance.aiOrders}
            note={`${m.glance.agentReads} agent read${m.glance.agentReads === 1 ? "" : "s"}`}
            color={m.glance.aiOrders ? LIVE : FAINTB} />
          <Glance label="DEPARTMENTS ARMED" value={`${m.glance.departmentsArmed}/${m.glance.departmentsTotal}`}
            note={m.glance.departmentsArmed === 0 ? "nothing acts unattended" : undefined}
            color={m.glance.departmentsArmed ? LIVE : FAINTB} />
          <Glance label="WARNINGS" value={m.glance.warnings}
            note={m.glance.warnings ? "each one below" : "nothing flagged"}
            color={alarmed ? FAULTB : OKB} />
        </div>
      </div>

      {/* ── the org chart ── */}
      <section className="mt-11">
        <div style={{ height: 2, backgroundColor: INKB }} />
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-2.5">
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: LIVE, fontWeight: 700 }}>№01</span>
          <h2 className="font-display text-[clamp(1.3rem,2.6vw,1.75rem)] uppercase leading-none">Departments</h2>
          <span className="ml-auto" style={MICRO}>CLICK ONE TO OPEN ITS CONSOLE</span>
        </div>

        <div className="grid gap-x-8" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))" }}>
          {m.departments.map((d) => (
            <button key={d.id} onClick={() => onOpen(d.id)}
              className="flex flex-col items-start gap-1.5 py-4 text-left"
              style={{ borderTop: `1px solid ${HAIRB}` }}>
              <span className="flex w-full flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="font-display text-[1.05rem] uppercase leading-none">{d.name}</span>
                <Stamp text={STATE_WORD[d.state]} color={STATE_COLOR[d.state]} filled={d.concern} />
                <span className="ml-auto flex items-baseline gap-1.5">
                  <Num bold color={d.concern ? FAULTB : INKB}>{d.metric}</Num>
                  <span style={MICRO}>{d.metricLabel}</span>
                </span>
              </span>
              <span className="text-pretty text-[12.5px] leading-snug" style={{ color: d.concern ? INKB : DIMB }}>
                {d.because}
              </span>
              {d.asks.length > 0 && (
                <Stamp text={`${d.asks.length} waiting on you`} color={WARNB} filled />
              )}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

/* ── the Worker Console ────────────────────────────────────────────────── */

export type Capability = { id: string; label: string; granted: boolean; irreversible: boolean };

export function WorkerConsole({
  d, capabilities, spendCap, currency, busy, onBack, onArm, onGrant, onSpendCap, onAct,
}: {
  d: DeptCard;
  capabilities: Capability[];
  spendCap: number;
  currency: string;
  busy: string | null;
  onBack: () => void;
  onArm: (armed: boolean) => void;
  onGrant: (capability: string, granted: boolean) => void;
  onSpendCap: (cap: number) => void;
  onAct?: (action: string) => void;
}) {
  return (
    <>
      <div className="mt-5" style={{ borderTop: `2px solid ${INKB}`, paddingTop: 18 }}>
        <button onClick={onBack} className="text-[12px] font-semibold"
          style={{ color: LIVE, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          ← Mission Control
        </button>
        <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-4">
          <div>
            <div style={MICRO}>{d.armed ? "ON DUTY" : "STANDING BY"}</div>
            <h1 className="mt-1 font-display uppercase leading-[0.92]" style={{ fontSize: "clamp(2rem,5vw,3.2rem)" }}>
              {d.name}
            </h1>
          </div>
          <div className="flex flex-col gap-2">
            <Stamp text={STATE_WORD[d.state]} color={STATE_COLOR[d.state]} filled={d.concern} />
            <span className="max-w-[44ch] text-pretty text-[13px] leading-snug" style={{ color: DIMB }}>{d.because}</span>
          </div>
          <div className="ml-auto text-right">
            <div style={MICRO}>{d.metricLabel}</div>
            <div className="font-display text-[2rem] leading-none" style={{ color: d.concern ? FAULTB : INKB }}>{d.metric}</div>
          </div>
        </div>
        <p className="mt-3 max-w-[62ch] text-pretty text-[12.5px] leading-relaxed" style={{ color: FAINTB }}>{d.remit}</p>
      </div>

      {/* ── what it did ── */}
      <section className="mt-9">
        <div style={{ height: 2, backgroundColor: INKB }} />
        <div className="flex flex-wrap items-baseline gap-x-4 py-2.5">
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: LIVE, fontWeight: 700 }}>№01</span>
          <h2 className="font-display text-[1.35rem] uppercase leading-none">Current tasks</h2>
          <span className="ml-auto" style={MICRO}>◉ UNATTENDED · ○ YOU</span>
        </div>
        {d.recent.length === 0 ? (
          <div className="py-4 text-pretty text-[13px] leading-relaxed" style={{ color: DIMB }}>
            {d.armed
              ? "It has done nothing yet. It is armed, so the next thing that falls inside its authority happens without you."
              : "It has done nothing, and it cannot — nothing has been handed to it. Arm it below and it starts work on the next thing it sees."}
          </div>
        ) : d.recent.map((t, i) => (
          <div key={i} className="flex gap-3 py-2" style={{ borderBottom: `1px solid ${HAIRB}` }}>
            <Num color={FAINTB}>{t.time ?? "—"}</Num>
            <span style={{ color: t.unattended ? LIVE : DIMB, fontSize: 12, lineHeight: "20px" }}>{t.unattended ? "◉" : "○"}</span>
            <span className="min-w-0 flex-1 text-pretty text-[13px] leading-snug">{t.text}</span>
          </div>
        ))}
      </section>

      {/* ── what it needs from you ── */}
      <section className="mt-9">
        <div style={{ height: 2, backgroundColor: INKB }} />
        <div className="flex flex-wrap items-baseline gap-x-4 py-2.5">
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: LIVE, fontWeight: 700 }}>№02</span>
          <h2 className="font-display text-[1.35rem] uppercase leading-none">Waiting approval</h2>
        </div>
        {d.asks.length === 0 ? (
          <div className="py-4 text-[13px]" style={{ color: DIMB }}>Nothing is waiting on you.</div>
        ) : d.asks.map((a, i) => (
          <div key={i} className="py-3.5"
            style={{ borderBottom: `1px solid ${HAIRB}`, borderLeft: `2px solid ${WARNB}`, paddingLeft: 12 }}>
            <div className="text-pretty text-[13.5px] font-semibold leading-snug">{a.question}</div>
            {a.cost && <div className="mt-1 text-pretty text-[12.5px]" style={{ color: DIMB }}>{a.cost}</div>}
            {a.action && onAct && (
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button onClick={() => onAct(a.action!)} disabled={!!busy}
                  className="px-3 py-1.5 text-[11.5px] font-semibold"
                  style={{ backgroundColor: INKB, color: PAPER, border: "none", cursor: "pointer" }}>
                  {busy === a.action ? "…" : "Approve"}
                </button>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* ── what it is allowed to do ── */}
      <section className="mt-9">
        <div style={{ height: 2, backgroundColor: INKB }} />
        <div className="flex flex-wrap items-baseline gap-x-4 py-2.5">
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: LIVE, fontWeight: 700 }}>№03</span>
          <h2 className="font-display text-[1.35rem] uppercase leading-none">Authority</h2>
          <span className="ml-auto" style={MICRO}>WHAT IT MAY DO WITHOUT ASKING</span>
        </div>

        <div style={{ backgroundColor: INSETB, padding: "14px 16px" }}>
          <div className="flex flex-wrap items-center gap-3">
            <Stamp text={d.armed ? "armed" : "not armed"} color={d.armed ? OKB : FAINTB} filled={d.armed} />
            <button onClick={() => onArm(!d.armed)} disabled={!!busy}
              className="text-[11.5px] font-semibold"
              style={{ color: d.armed ? FAULTB : LIVE, background: "none", border: "none", cursor: "pointer" }}>
              {busy === "arm" ? "…" : d.armed ? "stand it down" : "arm it"}
            </button>
          </div>
          <p className="mt-2 text-pretty text-[13px] leading-relaxed" style={{ color: d.armed ? INKB : DIMB }}>
            {d.authority}
          </p>
          {d.armed && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span style={MICRO}>DAILY SPEND LIMIT</span>
              <span className="flex items-center gap-1.5">
                <Num bold>{currency === "EUR" ? "€" : ""}{spendCap}</Num>
                {[0, 50, 200, 500].map((v) => (
                  <button key={v} onClick={() => onSpendCap(v)} disabled={!!busy}
                    className="px-2 py-[3px] text-[11px] font-semibold"
                    style={{
                      fontFamily: MONO,
                      border: `1px solid ${spendCap === v ? INKB : HAIRB}`,
                      backgroundColor: spendCap === v ? INKB : "transparent",
                      color: spendCap === v ? PAPER : DIMB,
                      cursor: "pointer",
                    }}>
                    {v === 0 ? "none" : `€${v}`}
                  </button>
                ))}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4">
          {capabilities.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5"
              style={{ borderBottom: `1px solid ${HAIRB}` }}>
              <span className="text-[13px] font-semibold" style={{ color: c.granted ? INKB : DIMB }}>{c.label}</span>
              {c.irreversible && <Stamp text="cannot be undone" color={FAULTB} />}
              <span className="ml-auto flex items-center gap-2">
                <Stamp text={c.granted ? "granted" : "asks first"} color={c.granted ? OKB : FAINTB} filled={c.granted} />
                <button onClick={() => onGrant(c.id, !c.granted)} disabled={!!busy || !d.armed}
                  className="text-[11.5px] font-semibold disabled:opacity-30"
                  style={{ color: c.granted ? FAULTB : LIVE, background: "none", border: "none", cursor: d.armed ? "pointer" : "not-allowed" }}>
                  {busy === c.id ? "…" : c.granted ? "take back" : "grant"}
                </button>
              </span>
            </div>
          ))}
          {!d.armed && (
            <p className="mt-3 text-pretty text-[12.5px] leading-relaxed" style={{ color: FAINTB }}>
              Grants are disabled until the department is armed. Arming it alone changes nothing —
              it still asks before every action until you hand something over deliberately.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
