"use client";

/**
 * THE WORKFORCE — the component vocabulary for PDR Commerce v5.
 * Design locked in docs/pdr-commerce-v5.md.
 *
 * v4's craft was right and is inherited wholesale: one warm paper surface, 2px
 * ink section rules, oversized Anton figures, stamped statuses, LIVE blue
 * reserved for measured data, zero radius, hard-cut state changes. Those parts
 * re-export from `ledger-ui` rather than being copied, so there is exactly one
 * definition of a Stamp in the codebase.
 *
 * What is new here is the MODEL. v4 drew a dashboard: panels an owner reads and
 * decides from. v5 draws a workforce: staff that did things, and questions they
 * need answered. The primitives below exist because a workforce needs different
 * furniture from a dashboard —
 *
 *   Worker      who is on shift, what state they are in, what they are judged by
 *   ShiftLine   one attempt: what was tried, what happened, under whose authority
 *   Ask         a question a worker cannot answer alone, with the cost of leaving it
 *   Mandate     the limits a worker may act inside, written in words not JSON
 *
 * Two rules the components enforce rather than merely encourage:
 *
 *   A worker's state is never decoration. "waiting on you" renders only when
 *   `asks > 0`, so the badge cannot drift from the queue behind it.
 *
 *   Failure is as loud as success. ShiftLine gives a failed attempt the fault
 *   colour and the same weight — a workforce you only see succeed is a workforce
 *   you cannot supervise.
 */

import type { CSSProperties, ReactNode } from "react";
import {
  DIMB, FAINTB, FAULTB, HAIRB, INKB, INSETB, LIVE, MICRO, OKB, WARNB,
  Num, Stamp,
} from "./ledger-ui";

export {
  PAPER, INKB, HAIRB, DIMB, FAINTB, LIVE, OKB, WARNB, FAULTB, INSETB,
  SANS, MONO, MICRO, pad2,
  Num, Stamp, Section, Figure, FigureRow, Row, Heads, Action, Pick, AuditLine, Headline, Funnel, Nothing,
} from "./ledger-ui";

/* ── worker identity ───────────────────────────────────────────────────── */

/** The six. CHIEF runs the shift and never touches the business directly. */
export type WorkerId = "SELL" | "BUY" | "MARKET" | "MONEY" | "CARE" | "CHIEF";

/**
 * `unarmed` is deliberately distinct from `idle`. Idle means the worker had
 * nothing to do; unarmed means it was never given permission to do anything.
 * Collapsing them would hide the single most common reason this product looks
 * like it is doing nothing.
 */
export type WorkerState = "working" | "waiting" | "idle" | "unarmed" | "blocked";

export const WORKER_NAME: Record<WorkerId, string> = {
  SELL: "Sell", BUY: "Buy", MARKET: "Market", MONEY: "Money", CARE: "Care", CHIEF: "Chief",
};

/** What each one is for, in the owner's words. Shown on its page and on hover. */
export const WORKER_JOB: Record<WorkerId, string> = {
  SELL: "Keeps the storefront true and takes the orders — catalogue, availability, agent rails.",
  BUY: "Sources what the business needs and buys it inside a budget you set.",
  MARKET: "Decides what to promote, makes it, puts it out, and learns what came back.",
  MONEY: "Watches margin and settlement, and says when something is losing money.",
  CARE: "Delivers what was bought and handles what comes after — questions, returns.",
  CHIEF: "Runs the shift, escalates what needs you, and writes the record.",
};

const STATE_COLOR: Record<WorkerState, string> = {
  working: LIVE, waiting: WARNB, idle: FAINTB, unarmed: FAINTB, blocked: FAULTB,
};

const STATE_WORD: Record<WorkerState, string> = {
  working: "working", waiting: "waiting on you", idle: "nothing to do",
  unarmed: "no mandate", blocked: "blocked",
};

/**
 * Worker — the card an owner scans to know who is doing what.
 *
 * `asks` and `state` are checked against each other: a worker cannot claim to
 * be waiting on you with an empty queue, because the state is recomputed from
 * the inputs rather than trusted from the caller.
 */
export function Worker({
  id, state, asks = 0, headline, headlineLabel, last, note, onOpen, blockedBy,
}: {
  id: WorkerId;
  state: WorkerState;
  asks?: number;
  /** The one number this worker is judged by. */
  headline?: ReactNode;
  headlineLabel?: string;
  /** When it last did anything, already formatted. */
  last?: string | null;
  note?: string;
  onOpen?: () => void;
  /** What is stopping it, when state is blocked. Named, never vague. */
  blockedBy?: string;
}) {
  // The badge is derived, not declared. A queue of zero cannot render "waiting".
  const real: WorkerState = asks > 0 ? "waiting" : state === "waiting" ? "idle" : state;
  return (
    <button
      onClick={onOpen}
      className="flex w-full flex-col items-start gap-2 px-1 py-3.5 text-left"
      style={{ borderBottom: `1px solid ${HAIRB}` }}
    >
      <span className="flex w-full flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="font-display text-[1.15rem] uppercase leading-none">{WORKER_NAME[id]}</span>
        <Stamp text={STATE_WORD[real]} color={STATE_COLOR[real]} filled={real === "waiting" || real === "blocked"} />
        {asks > 0 && <Stamp text={`${asks} ask${asks === 1 ? "" : "s"}`} color={WARNB} />}
        {headline != null && (
          <span className="ml-auto flex items-baseline gap-1.5">
            <span className="font-display text-[1.5rem] leading-none" style={{ color: INKB }}>{headline}</span>
            {headlineLabel && <span style={MICRO}>{headlineLabel}</span>}
          </span>
        )}
      </span>
      <span className="text-pretty text-[12.5px] leading-snug" style={{ color: DIMB }}>
        {real === "blocked" && blockedBy ? blockedBy : note ?? WORKER_JOB[id]}
      </span>
      <span style={MICRO}>{last ? `LAST WORKED ${last}` : "HAS NEVER RUN"}</span>
    </button>
  );
}

/* ── the shift record ──────────────────────────────────────────────────── */

export type ShiftOutcome = "done" | "failed" | "asked" | "skipped";

const OUTCOME_COLOR: Record<ShiftOutcome, string> = {
  done: OKB, failed: FAULTB, asked: WARNB, skipped: FAINTB,
};

/**
 * One attempt by one worker. A failure is rendered with the same weight and a
 * louder colour than a success: a shift report that only shows what worked is
 * a press release, and cannot be supervised.
 */
export function ShiftLine({
  time, worker, outcome, children, under, detail,
}: {
  time: string;
  worker: WorkerId;
  outcome: ShiftOutcome;
  children: ReactNode;
  /** The mandate that authorised it, or "you" for a human action. */
  under?: string;
  /** Why it failed, or what it produced. */
  detail?: string;
}) {
  return (
    <div
      className="flex gap-3 py-2.5"
      style={{ borderBottom: `1px solid ${HAIRB}`, borderLeft: outcome === "failed" ? `2px solid ${FAULTB}` : "2px solid transparent", paddingLeft: 10 }}
    >
      <Num color={FAINTB}>{time}</Num>
      <span className="w-[52px] shrink-0"><Stamp text={WORKER_NAME[worker]} color={DIMB} /></span>
      <span className="min-w-0 flex-1">
        <span className="text-pretty text-[13px] leading-snug" style={{ color: INKB }}>{children}</span>
        {detail && (
          <span className="mt-0.5 block text-pretty text-[12.5px] leading-snug" style={{ color: outcome === "failed" ? FAULTB : DIMB }}>
            {detail}
          </span>
        )}
      </span>
      <span className="shrink-0 self-start">
        <Stamp text={outcome} color={OUTCOME_COLOR[outcome]} filled={outcome === "failed"} />
      </span>
      {under && <span className="hidden shrink-0 self-start sm:block" style={MICRO}>{under}</span>}
    </div>
  );
}

/* ── the queue ─────────────────────────────────────────────────────────── */

/**
 * Ask — a worker stopped and needs an answer.
 *
 * `cost` is required rather than optional on purpose. An owner triaging a queue
 * needs to know what leaving an item unanswered actually does; "approve this?"
 * with no stated consequence is how a queue becomes wallpaper.
 */
export function Ask({
  worker, question, cost, waiting, children,
}: {
  worker: WorkerId;
  question: string;
  /** What happens while this goes unanswered. Concrete. */
  cost: string;
  /** How long it has been waiting, already formatted. */
  waiting?: string;
  /** The controls that answer it. */
  children?: ReactNode;
}) {
  return (
    <div className="py-3.5" style={{ borderBottom: `1px solid ${HAIRB}`, borderLeft: `2px solid ${WARNB}`, paddingLeft: 12 }}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Stamp text={WORKER_NAME[worker]} color={WARNB} filled />
        {waiting && <span style={MICRO}>WAITING {waiting}</span>}
      </div>
      <div className="mt-1.5 text-pretty text-[14px] font-semibold leading-snug">{question}</div>
      <div className="mt-1 text-pretty text-[12.5px] leading-snug" style={{ color: DIMB }}>{cost}</div>
      {children && <div className="mt-2.5 flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/* ── mandates ──────────────────────────────────────────────────────────── */

/**
 * Mandate — what a worker may do without asking, in words.
 *
 * Deliberately not a JSON editor. The owner is granting authority to something
 * that will act while they sleep; that decision has to be readable as a
 * sentence, or they cannot know what they agreed to.
 */
export function Mandate({
  armed, summary, limits, onArm, onEdit, busy,
}: {
  armed: boolean;
  /** One sentence: what this worker may do unattended. */
  summary: string;
  limits: { label: string; value: string; note?: string }[];
  onArm?: () => void;
  onEdit?: () => void;
  busy?: boolean;
}) {
  return (
    <div style={{ backgroundColor: INSETB, padding: "14px 16px" }}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span style={MICRO}>MANDATE</span>
        <Stamp text={armed ? "armed" : "not armed"} color={armed ? OKB : FAINTB} filled={armed} />
        <span className="ml-auto flex gap-2">
          {onEdit && (
            <button onClick={onEdit} disabled={busy} className="text-[11.5px] font-semibold"
              style={{ color: LIVE, background: "none", border: "none", cursor: "pointer" }}>
              change limits
            </button>
          )}
          {onArm && (
            <button onClick={onArm} disabled={busy} className="text-[11.5px] font-semibold"
              style={{ color: armed ? FAULTB : LIVE, background: "none", border: "none", cursor: "pointer" }}>
              {busy ? "…" : armed ? "stand down" : "arm it"}
            </button>
          )}
        </span>
      </div>
      <p className="mt-2 text-pretty text-[13px] leading-relaxed" style={{ color: armed ? INKB : DIMB }}>
        {armed ? summary : "This worker has no authority to act. It will observe and report, and nothing will happen while you are away."}
      </p>
      {limits.length > 0 && (
        <div className="mt-3 grid gap-x-8 gap-y-2" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
          {limits.map((l) => (
            <div key={l.label}>
              <div style={MICRO}>{l.label}</div>
              <div className="mt-0.5"><Num bold>{l.value}</Num></div>
              {l.note && <div className="mt-0.5 text-[11.5px]" style={{ color: FAINTB }}>{l.note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── the buy side ──────────────────────────────────────────────────────── */

export function Requisition({
  what, qty, need, status, children,
}: {
  what: string;
  qty?: string;
  /** Why the business needs it — traced to a measured fact, never a guess. */
  need: string;
  status: "open" | "quoted" | "ordered" | "closed" | "declined";
  children?: ReactNode;
}) {
  const color = status === "ordered" || status === "closed" ? OKB
    : status === "declined" ? FAINTB : status === "quoted" ? LIVE : WARNB;
  return (
    <div className="py-3" style={{ borderBottom: `1px solid ${HAIRB}` }}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="text-[13.5px] font-semibold">{what}</span>
        {qty && <Num color={FAINTB}>{qty}</Num>}
        <Stamp text={status} color={color} filled={status === "open"} />
      </div>
      <div className="mt-1 text-pretty text-[12.5px] leading-snug" style={{ color: DIMB }}>{need}</div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

/**
 * Quote — one supplier's offer. `best` is set by the comparison, which scores on
 * the mandate's terms, so the badge says WHY rather than just crowning a winner:
 * cheapest is not always what was asked for.
 */
export function Quote({
  supplier, price, lead, terms, best, bestReason, viaPdr, onAccept, busy,
}: {
  supplier: string;
  price: string;
  lead?: string;
  terms?: string;
  best?: boolean;
  bestReason?: string;
  /** Another PDR-run store — the network buying from itself. */
  viaPdr?: boolean;
  onAccept?: () => void;
  busy?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2"
      style={{ borderTop: `1px solid ${HAIRB}`, borderLeft: best ? `2px solid ${OKB}` : "2px solid transparent", paddingLeft: 10 }}>
      <span className="text-[13px] font-semibold">{supplier}</span>
      {viaPdr && <Stamp text="pdr store" color={LIVE} />}
      <Num bold>{price}</Num>
      {lead && <span className="text-[12.5px]" style={{ color: DIMB }}>{lead}</span>}
      {terms && <span className="text-[12px]" style={{ color: FAINTB }}>{terms}</span>}
      {best && <Stamp text={bestReason ?? "best"} color={OKB} filled />}
      {onAccept && (
        <button onClick={onAccept} disabled={busy} className="ml-auto text-[11.5px] font-semibold"
          style={{ color: LIVE, background: "none", border: "none", cursor: "pointer" }}>
          {busy ? "…" : "buy this"}
        </button>
      )}
    </div>
  );
}

/* ── layout ────────────────────────────────────────────────────────────── */

/** A shift report's heading: the window it covers, stated so nobody assumes. */
export function ShiftHead({ since, runs, note }: { since: string; runs: number; note?: string }) {
  const style: CSSProperties = { borderTop: `2px solid ${INKB}`, paddingTop: 14 };
  return (
    <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2" style={style}>
      <span style={MICRO}>SINCE {since}</span>
      <span style={MICRO}>{runs} SHIFT{runs === 1 ? "" : "S"}</span>
      {note && <span className="text-[12.5px]" style={{ color: DIMB }}>{note}</span>}
    </div>
  );
}
