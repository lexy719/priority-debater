import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatProps {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: { value: string; trend: "up" | "down" | "flat" };
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

const sizes = {
  sm: "text-[20px]",
  md: "text-[28px]",
  lg: "text-[40px]",
  xl: "text-[64px] leading-[0.95]",
  "2xl": "text-[clamp(96px,12vw,160px)] leading-[0.85]",
};

export function Stat({
  label,
  value,
  unit,
  delta,
  size = "lg",
  className = "",
}: StatProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <div
          className={cn(
            "font-mono tabular-nums tracking-[-0.03em] text-[--ink-0]",
            sizes[size]
          )}
        >
          {value}
        </div>
        {unit && <span className="font-mono text-[12px] text-[--ink-2]">{unit}</span>}
      </div>
      {delta && (
        <div
          className={cn(
            "font-mono text-[11px]",
            delta.trend === "up"
              ? "text-[--go]"
              : delta.trend === "down"
              ? "text-[--no-go]"
              : "text-[--ink-2]"
          )}
        >
          {delta.trend === "up" ? "↑" : delta.trend === "down" ? "↓" : "→"} {delta.value}
        </div>
      )}
    </div>
  );
}
