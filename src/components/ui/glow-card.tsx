"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   Glow Card — animated border glow on hover
   Inspired by 21st.dev card components
   ───────────────────────────────────────────── */

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
  as?: "div" | "button" | "a";
  href?: string;
}

export function GlowCard({
  children,
  className,
  glowColor = "rgba(99,102,241,0.4)",
  onClick,
  as: Tag = "div",
  href,
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--glow-x", `${x}px`);
    card.style.setProperty("--glow-y", `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] transition-all duration-300",
        "hover:border-[var(--border-focus)] hover:shadow-[0_0_30px_var(--glow-accent)]",
        onClick || href ? "cursor-pointer" : "",
        className
      )}
      onClick={onClick}
    >
      {/* Glow effect following mouse */}
      <div
        className="pointer-events-none absolute -z-10 h-[200px] w-[200px] rounded-full opacity-0 blur-[60px] transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: glowColor,
          left: "var(--glow-x, 50%)",
          top: "var(--glow-y, 50%)",
          transform: "translate(-50%, -50%)",
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Bento Card — for grid layouts
   ───────────────────────────────────────────── */

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  span?: "1" | "2";
}

export function BentoCard({ children, className, span = "1" }: BentoCardProps) {
  return (
    <GlowCard
      className={cn(
        "p-6",
        span === "2" && "md:col-span-2",
        className
      )}
    >
      {children}
    </GlowCard>
  );
}

/* ─────────────────────────────────────────────
   Stat Card — animated number display
   ───────────────────────────────────────────── */

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({ label, value, sublabel, icon, trend, className }: StatCardProps) {
  return (
    <GlowCard className={cn("p-5", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            {value}
          </p>
          {sublabel && (
            <p className="mt-1 flex items-center gap-1 text-xs text-[var(--text-secondary)]">
              {trend === "up" && <span className="text-emerald-400">↑</span>}
              {trend === "down" && <span className="text-red-400">↓</span>}
              {sublabel}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/10 text-[var(--text-accent)]">
            {icon}
          </div>
        )}
      </div>
    </GlowCard>
  );
}
