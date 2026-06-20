/**
 * Shared presentational atoms for the AI Commerce Audit page.
 *
 * Ported from the lovable prototype (`lovable/src/routes/commerce.tsx`) and
 * adapted to the main app: the dark editorial surfaces are expressed as explicit
 * dark utilities (the app's semantic `bg-background`/`border-border` tokens
 * resolve to light paper, so we can't lean on them here), while the light
 * "paper" report panels reuse the `--paper` / `--paper-foreground` vars.
 */

import type { ReactNode } from "react";
import type { Tone } from "@/lib/commerce/audit-scoring";

export const signalVar = (tone: Tone) =>
  tone === "red"
    ? "var(--signal-red)"
    : tone === "green"
      ? "var(--signal-green)"
      : tone === "amber"
        ? "var(--signal-amber)"
        : "var(--signal-blue)";

export function Tag({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | Tone;
  children: ReactNode;
}) {
  const map: Record<string, string> = {
    neutral: "bg-white/[0.06] text-white/60 border-white/15",
    red: "bg-[color:var(--signal-red)]/15 text-[color:var(--signal-red)] border-[color:var(--signal-red)]/40",
    blue: "bg-[color:var(--signal-blue)]/15 text-[color:var(--signal-blue)] border-[color:var(--signal-blue)]/40",
    green: "bg-[color:var(--signal-green)]/15 text-[color:var(--signal-green)] border-[color:var(--signal-green)]/40",
    amber: "bg-[color:var(--signal-amber)]/15 text-[color:var(--signal-amber)] border-[color:var(--signal-amber)]/40",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${map[tone]}`}
    >
      {children}
    </span>
  );
}

export function Panel({
  label,
  children,
  className = "",
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-white/12 bg-[#141417] ${className}`}>
      {label ? (
        <div className="flex items-center justify-between border-b border-white/12 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-white/55">
          <span>{label}</span>
          <span className="font-mono opacity-50">//</span>
        </div>
      ) : null}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function PaperPanel({
  label,
  index,
  title,
  children,
}: {
  label: string;
  index: string;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-y border-white/12 bg-[color:var(--paper)] text-[color:var(--paper-foreground)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
        <div className="mb-8 flex items-end justify-between gap-6 text-[10px] uppercase tracking-[0.22em] text-[color:var(--paper-foreground)]/60">
          <span>— {label}</span>
          <span>{index}</span>
        </div>
        <h2 className="font-display text-4xl leading-[0.95] sm:text-6xl md:text-7xl">{title}</h2>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

export function Ticker({
  items,
  tone = "neutral",
}: {
  items: string[];
  tone?: "neutral" | "red" | "blue";
}) {
  const palette =
    tone === "red"
      ? "bg-[color:var(--signal-red)] text-white"
      : tone === "blue"
        ? "bg-[color:var(--signal-blue)] text-white"
        : "bg-[#141417] text-white/55 border-y border-white/12";
  const doubled = [...items, ...items];
  return (
    <div className={`overflow-hidden ${palette}`}>
      <div className="ticker-mask flex">
        <div className="flex shrink-0 animate-ticker whitespace-nowrap">
          {doubled.map((t, i) => (
            <span key={i} className="px-6 py-2 text-[11px] uppercase tracking-[0.25em]">
              {t}
              <span className="ml-6 opacity-50">//</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ScoreBar({
  label,
  value,
  prev,
  tone = "blue",
}: {
  label: string;
  value: number;
  prev?: number;
  tone?: Tone;
}) {
  const color = signalVar(tone);
  const delta = prev !== undefined ? value - prev : undefined;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.18em] text-white/55">
        <span>{label}</span>
        <span className="text-white">
          {value}
          <span className="text-white/55">/100</span>
          {delta !== undefined && (
            <span
              className={`ml-2 text-[10px] ${
                delta >= 0 ? "text-[color:var(--signal-green)]" : "text-[color:var(--signal-red)]"
              }`}
            >
              {delta >= 0 ? "+" : ""}
              {delta}
            </span>
          )}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full bg-white/10">
        <div className="h-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
