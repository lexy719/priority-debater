"use client";

import { cn } from "@/lib/utils";

export type TabItem = { id: string; label: string; count?: number };

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className = "" }: TabsProps) {
  return (
    <div
      className={cn(
        "border-b border-[--line] bg-[color-mix(in_srgb,var(--bg)_82%,var(--surface-1))]",
        className
      )}
    >
      <div className="flex gap-1 px-6 md:px-8 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              data-cursor="snap"
              onClick={() => onChange(t.id)}
              className={cn(
                "relative flex items-center gap-2 px-3.5 h-[3.125rem] text-[13.5px] font-medium rounded-t-[calc(var(--radius)-2px)] transition-colors duration-150 whitespace-nowrap",
                isActive
                  ? "text-[--ink-0] bg-[--surface-1]/95"
                  : "text-[--ink-2] hover:text-[--ink-1] hover:bg-[--surface-1]/35"
              )}
            >
              <span>{t.label}</span>
              {typeof t.count === "number" && (
                <span className="font-mono text-[10px] tabular-nums text-[--ink-2]">
                  {t.count}
                </span>
              )}
              {isActive && (
                <span className="absolute left-3 right-3 bottom-1 h-[3px] rounded-full bg-[--accent] opacity-90" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
