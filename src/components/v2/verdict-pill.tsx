import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type Verdict = "GO" | "CAUTION" | "NO-GO";

interface VerdictPillProps extends HTMLAttributes<HTMLDivElement> {
  verdict: Verdict;
  size?: "sm" | "md" | "lg";
}

const palette: Record<Verdict, { bg: string; border: string; text: string; ring?: string }> = {
  GO: {
    bg: "var(--go-soft)",
    border: "var(--go)",
    text: "var(--go)",
    ring: "var(--go-ring)",
  },
  CAUTION: {
    bg: "var(--caution-soft)",
    border: "var(--caution)",
    text: "var(--caution)",
  },
  "NO-GO": {
    bg: "var(--no-go-soft)",
    border: "var(--no-go)",
    text: "var(--no-go)",
    ring: "var(--no-go-ring)",
  },
};

export function VerdictPill({ verdict, size = "md", className = "", ...props }: VerdictPillProps) {
  const c = palette[verdict];
  const sizes = {
    sm: "h-5 px-2 text-[10px] tracking-[0.18em]",
    md: "h-7 px-3 text-[11px] tracking-[0.20em]",
    lg: "h-10 px-4 text-[12px] tracking-[0.24em]",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center font-mono font-semibold uppercase rounded-full tracking-wide",
        sizes[size],
        className
      )}
      style={{
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        boxShadow: c.ring ? `0 0 0 0 ${c.ring}` : undefined,
      }}
      {...props}
    >
      {verdict}
    </div>
  );
}
