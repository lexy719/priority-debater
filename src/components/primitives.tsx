import * as React from "react";

export function Tag({
  children,
  tone = "ink",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "ink" | "red" | "blue" | "yellow" | "green" | "amber";
  className?: string;
}) {
  const tones: Record<string, string> = {
    ink: "border-ink/40 text-ink bg-paper",
    red: "border-signal-red/60 text-signal-red bg-signal-red/10",
    blue: "border-signal-blue/60 text-[oklch(0.32_0.12_235)] bg-signal-blue/15",
    yellow: "border-signal-yellow/70 text-ink bg-signal-yellow/25",
    green: "border-signal-green/60 text-[oklch(0.32_0.12_145)] bg-signal-green/15",
    amber: "border-signal-amber/60 text-[oklch(0.36_0.12_70)] bg-signal-amber/15",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Eyebrow({
  index,
  label,
  className = "",
}: {
  index?: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground ${className}`}
    >
      {index ? (
        <>
          <span className="text-signal-red">{index}</span>
          <span className="text-ink/30">/</span>
        </>
      ) : null}
      <span>{label}</span>
    </div>
  );
}

export function SectionRule() {
  return <div className="h-px w-full bg-ink/15" />;
}

export function Dot({ color = "red" }: { color?: "red" | "blue" | "green" | "yellow" }) {
  const map: Record<string, string> = {
    red: "bg-signal-red",
    blue: "bg-signal-blue",
    green: "bg-signal-green",
    yellow: "bg-signal-yellow",
  };
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${map[color]} animate-blink`} />;
}