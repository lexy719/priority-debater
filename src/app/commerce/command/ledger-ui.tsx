"use client";

/**
 * Swiss Editorial Ledger — the shared component vocabulary for PDR Commerce.
 * Design LOCKED in docs/pdr-commerce-design.md v3: one warm paper surface,
 * 2px ink section rules, numbered sections, oversized Anton figures, stamped
 * statuses, LIVE blue reserved for measured data. No cards, no shadows.
 */

import type { CSSProperties, ReactNode } from "react";

/* ── tokens ────────────────────────────────────────────────────────────── */
export const PAPER = "#F5F3ED";
export const INKB = "#111111";
export const HAIRB = "#CFC9BC";
export const DIMB = "#6B6659";
export const FAINTB = "#9B968A";
export const LIVE = "#0047FF";
export const OKB = "#1F7A44";
export const WARNB = "#B45309";
export const FAULTB = "#C0271D";
export const INSETB = "#ECE8DE";

export const SANS = "var(--app-font-sans), ui-sans-serif, system-ui, sans-serif";
export const MONO = "var(--app-font-mono), ui-monospace, monospace";

/** Micro-label: mono, uppercase, wide — the ledger's marginalia voice. */
export const MICRO: CSSProperties = { fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: FAINTB };
export const pad2 = (n: number) => n.toString().padStart(2, "0");

/** Monospace number — every figure in a table or inline. */
export function Num({ children, color = INKB, bold }: { children: ReactNode; color?: string; bold?: boolean }) {
  return <span className="tabular-nums" style={{ fontFamily: MONO, color, fontWeight: bold ? 700 : 400 }}>{children}</span>;
}

/** Stamp — a status pressed onto the page. Filled variant for emphasis. */
export function Stamp({ text, color = INKB, filled }: { text: string; color?: string; filled?: boolean }) {
  return (
    <span
      className="inline-block whitespace-nowrap px-1.5 py-[2px]"
      style={{
        fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700,
        border: `1px solid ${color}`,
        color: filled ? PAPER : color,
        backgroundColor: filled ? color : "transparent",
      }}
    >
      {text}
    </span>
  );
}

/** Section — a numbered block opened by a 2px ink rule. The page's structure.
    Its body scrolls sideways on a narrow screen so a datasheet keeps its column
    alignment and its heads instead of squashing into an unreadable stack. */
export function Section({ n, title, right, children }: { n: number; title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-6">
      <div style={{ height: 2, backgroundColor: INKB }} />
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-2.5">
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: LIVE, fontWeight: 700 }}>№{pad2(n)}</span>
        <h2 className="text-balance text-[15px] font-semibold tracking-[-0.01em]" style={{ fontFamily: SANS, color: INKB }}>{title}</h2>
        {right && <div className="ml-auto flex flex-wrap items-center gap-2">{right}</div>}
      </div>
      <div style={{ overflowX: "auto" }}>{children}</div>
    </section>
  );
}

/** The width a grid row needs before its columns start lying about alignment:
    the sum of its fixed columns, a floor for each flexible one, plus gaps. */
function minWidthFor(cols?: string): number | undefined {
  if (!cols) return undefined;
  const px = [...cols.matchAll(/(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1]));
  const flex = (cols.match(/minmax\(|1fr|auto/g) ?? []).length;
  if (!px.length && !flex) return undefined;
  const gaps = Math.max(0, px.length + flex - 1) * 16;
  return Math.round(px.reduce((a, b) => a + b, 0) + flex * 130 + gaps);
}

/** Figure — micro-label over an oversized Anton number. The identity shot. */
export function Figure({ label, value, color = INKB, note, size = "lg" }: { label: string; value: ReactNode; color?: string; note?: string; size?: "lg" | "md" }) {
  return (
    <div className="min-w-0">
      <div style={MICRO}>{label}</div>
      <div
        className="mt-1 truncate font-display leading-[0.92] tabular-nums"
        style={{ color, fontSize: size === "lg" ? "clamp(1.9rem,4vw,3rem)" : "clamp(1.4rem,2.6vw,1.9rem)" }}
      >
        {value}
      </div>
      {note && <div className="mt-1 text-[11.5px]" style={{ fontFamily: SANS, color: DIMB }}>{note}</div>}
    </div>
  );
}

/** Figure strip — figures separated by hairlines on the shared paper. */
export function FigureRow({ children, cols = 6 }: { children: ReactNode; cols?: number }) {
  return (
    <div
      className="grid gap-y-6"
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${cols >= 5 ? 132 : 170}px, 1fr))`, borderTop: `1px solid ${HAIRB}`, borderBottom: `1px solid ${HAIRB}`, paddingTop: 16, paddingBottom: 16 }}
    >
      {children}
    </div>
  );
}

/** Ledger row — hairline-separated, hover wash. The table primitive. */
export function Row({ children, cols, warn }: { children: ReactNode; cols?: string; warn?: boolean }) {
  return (
    <div
      className={`items-center gap-x-4 gap-y-1.5 px-1 py-3 transition-colors ${cols ? "grid" : "flex flex-wrap"}`}
      style={{ borderBottom: `1px solid ${HAIRB}`, gridTemplateColumns: cols, minWidth: minWidthFor(cols), borderLeft: warn ? `2px solid ${WARNB}` : "2px solid transparent", fontFamily: SANS }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = INSETB; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      {children}
    </div>
  );
}

/** Column heads for a datasheet — mono micro-labels on a hairline. */
export function Heads({ cols, labels }: { cols: string; labels: string[] }) {
  return (
    <div className="grid gap-x-4 px-1 py-2" style={{ gridTemplateColumns: cols, minWidth: minWidthFor(cols), borderBottom: `1px solid ${HAIRB}` }}>
      {labels.map((l) => <span key={l} style={MICRO}>{l}</span>)}
    </div>
  );
}

/** Black action. Destructive = fault-bordered ghost. */
export function Action({ onClick, disabled, children, danger }: { onClick: () => void; disabled?: boolean; children: ReactNode; danger?: boolean }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      className="h-8 px-3.5 text-[12px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
      style={danger
        ? { fontFamily: SANS, border: `1px solid ${FAULTB}`, color: FAULTB, backgroundColor: "transparent" }
        : { fontFamily: SANS, backgroundColor: INKB, color: PAPER }}
    >
      {children}
    </button>
  );
}

/** Selection / secondary control — LIVE when active. */
export function Pick({ onClick, active, disabled, children, danger }: { onClick: () => void; active?: boolean; disabled?: boolean; children: ReactNode; danger?: boolean }) {
  const color = danger ? FAULTB : active ? LIVE : DIMB;
  return (
    <button
      onClick={onClick} disabled={disabled}
      className="h-7 px-2.5 text-[11.5px] font-semibold transition-colors disabled:opacity-40"
      style={{ fontFamily: SANS, border: `1px solid ${active ? LIVE : HAIRB}`, color, backgroundColor: "transparent" }}
    >
      {children}
    </button>
  );
}

/** Horizontal bar — inset track, state fill, mono value. */
export function Bar({ pct, color = LIVE, width = 130 }: { pct: number; color?: string; width?: number }) {
  return (
    <div style={{ backgroundColor: INSETB, height: 10, width, maxWidth: "100%" }}>
      <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: "100%", backgroundColor: color }} />
    </div>
  );
}

/** The audit line — closes every view. Honesty as an aesthetic element. */
export function AuditLine({ measured, awaiting }: { measured: string; awaiting?: string }) {
  return (
    <div className="mt-8 flex flex-wrap gap-x-6 gap-y-1 pt-3" style={{ borderTop: `1px solid ${HAIRB}` }}>
      <span style={MICRO}>MEASURED · {measured}</span>
      {awaiting && <span style={{ ...MICRO, color: WARNB }}>AWAITING · {awaiting}</span>}
    </div>
  );
}

/** Empty/thin-data statement — words, never a fake chart. */
export function Thin({ children }: { children: ReactNode }) {
  return <div className="py-4 text-[13px]" style={{ fontFamily: SANS, color: DIMB }}>{children}</div>;
}
