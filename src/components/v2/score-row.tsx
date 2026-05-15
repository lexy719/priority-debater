"use client";

import { HTMLAttributes, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ScoreRowProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  score: number;
  threshold?: number;
  delay?: number;
  size?: "md" | "lg";
}

export function ScoreRow({
  label,
  score,
  threshold = 50,
  delay = 0,
  size = "md",
  className = "",
  ...props
}: ScoreRowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const timer = window.setTimeout(() => setShown(true), 0);
      return () => window.clearTimeout(timer);
    }
    let timer = 0;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            timer = window.setTimeout(() => setShown(true), delay);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(node);
    return () => {
      window.clearTimeout(timer);
      obs.disconnect();
    };
  }, [delay]);

  const scoreColor =
    score < threshold ? "var(--no-go)" : score > 75 ? "var(--go)" : "var(--ink-0)";

  const numClass = size === "lg" ? "text-[40px]" : "text-[28px]";

  return (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-[1fr_auto] sm:grid-cols-[200px_1fr_72px] items-center gap-4",
        className
      )}
      {...props}
    >
      <div className="text-[14px] text-[--ink-0] font-sans">{label}</div>
      <div className="hidden sm:block h-[2px] bg-[--line] overflow-hidden">
        <div
          className="h-full bg-[--accent] transition-[width] duration-800 ease-out"
          style={{ width: shown ? `${score}%` : "0%" }}
        />
      </div>
      <div
        className={cn("text-right font-mono leading-none tabular-nums", numClass)}
        style={{ color: scoreColor }}
      >
        {score}
      </div>
    </div>
  );
}
