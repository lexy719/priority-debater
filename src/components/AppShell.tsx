"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { InteractiveParticles } from "@/components/ui/animated-background";

export type AppShellMaxWidth = "2xl" | "5xl" | "7xl" | "8xl";

const shellMaxWidthClass: Record<AppShellMaxWidth, string> = {
  "2xl": "max-w-2xl",
  "5xl": "max-w-5xl",
  "7xl": "max-w-7xl",
  /** ~1440px — comfortable dashboard width on large monitors */
  "8xl": "max-w-[90rem]",
};

/**
 * Shared chrome for validate / results: background, particles, optional orbs, sticky top bar.
 */
export function AppShell({
  children,
  maxWidth = "5xl",
  particleCount = 36,
  magneticStrength = 0.07,
  showAmbientOrbs = true,
  header,
}: {
  children: React.ReactNode;
  maxWidth?: AppShellMaxWidth;
  particleCount?: number;
  magneticStrength?: number;
  showAmbientOrbs?: boolean;
  header: React.ReactNode;
}) {
  const mw = shellMaxWidthClass[maxWidth];
  return (
    <div className="relative min-h-dvh t-bg">
      <InteractiveParticles
        count={particleCount}
        magneticRadius={180}
        magneticStrength={magneticStrength}
      />
      {showAmbientOrbs && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-indigo-600/10 blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute -bottom-32 -right-32 h-[380px] w-[380px] rounded-full bg-violet-600/10 blur-[120px] animate-[pulse_10s_ease-in-out_infinite_1s]" />
        </div>
      )}
      <div className="sticky top-0 z-10 border-b border-border bg-background/88 backdrop-blur-xl">
        <div className={`${mw} mx-auto flex h-14 items-center justify-between px-4 sm:px-6`}>
          {header}
        </div>
      </div>
      {children}
    </div>
  );
}

export function AppLogoLink({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group flex shrink-0 items-center gap-2 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-600">
        <Zap className="h-4 w-4 text-white" />
      </div>
      <span className="hidden text-sm font-semibold text-secondary transition-colors group-hover:text-foreground sm:inline">
        Priority Debater
      </span>
    </Link>
  );
}
