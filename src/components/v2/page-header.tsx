import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  kicker?: string;
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  sticky?: boolean;
  className?: string;
}

export function PageHeader({
  kicker,
  title,
  meta,
  actions,
  sticky = true,
  className = "",
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "h-14 px-6 md:px-8 flex items-center justify-between gap-6 backdrop-blur-md border-b border-[--line]",
        "bg-[color-mix(in_srgb,var(--surface-1)_90%,transparent)] shadow-[var(--shadow-xs)]",
        sticky && "sticky top-0 z-40",
        className
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        {kicker && (
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2] shrink-0">
            {kicker}
          </span>
        )}
        <h1 className="font-serif text-[18px] tracking-[-0.015em] text-[--ink-0] truncate">
          {title}
        </h1>
        {meta && <div className="flex items-center gap-3 shrink-0">{meta}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
