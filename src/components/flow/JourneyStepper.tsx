"use client";

/**
 * JourneyStepper — the connected post-validation flow, shown on every journey
 * page (Results, Debate, and the studio stages). Each step links to its route
 * so the user can move through the flow; the current step is highlighted and
 * earlier (completed) steps are marked done.
 *
 * Order matches the product journey: Validate → Results → Debate → Brand →
 * Launch → Campaign → Landing → Ship.
 */

import Link from "next/link";
import { Check } from "lucide-react";

export type JourneyStage =
  | "validate"
  | "results"
  | "debate"
  | "brand"
  | "launch"
  | "campaign"
  | "landing"
  | "ship";

const STEPS: { key: JourneyStage; n: string; label: string; href: string }[] = [
  { key: "validate", n: "1", label: "Validate", href: "/#validate" },
  { key: "results", n: "2", label: "Results", href: "/results" },
  { key: "debate", n: "3", label: "Debate", href: "/debate" },
  { key: "brand", n: "4", label: "Brand", href: "/brand-kit" },
  { key: "launch", n: "5", label: "Launch", href: "/launch-kit" },
  { key: "campaign", n: "6", label: "Campaign", href: "/campaign" },
  { key: "landing", n: "7", label: "Landing", href: "/landing-builder" },
  { key: "ship", n: "8", label: "Ship", href: "/ship" },
];

export function JourneyStepper({ current }: { current: JourneyStage }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  const cur = STEPS[currentIndex] ?? STEPS[0];

  return (
    <div className="bg-[#0a0a0a] border-b border-white/15">
      {/* Mobile: compact progress indicator */}
      <div className="sm:hidden max-w-[1400px] mx-auto px-5 py-2 flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/70 shrink-0">
          Stage {currentIndex + 1}/{STEPS.length} · <span className="text-white">{cur.label}</span>
        </span>
        <div className="flex-1 h-1 bg-white/10">
          <div className="h-full bg-[#ff3b30]" style={{ width: `${((currentIndex + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      {/* Desktop: full clickable stepper */}
      <div className="hidden sm:flex max-w-[1400px] mx-auto px-5 lg:px-8 py-2.5 items-center gap-1 overflow-x-auto">
        {STEPS.map((s, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <div key={s.key} className="flex items-center gap-1 shrink-0">
              <Link
                href={s.href}
                data-testid={`journey-step-${s.key}`}
                className={`flex items-center gap-2 px-2.5 py-1 border transition-colors ${
                  active
                    ? "border-[#ff3b30] bg-[#ff3b30]/10"
                    : done
                    ? "border-[#32d74b]/40 bg-[#32d74b]/5 hover:bg-[#32d74b]/10"
                    : "border-white/15 hover:border-white/40"
                }`}
              >
                <span
                  className={`font-mono text-[9px] grid place-items-center w-4 h-4 ${
                    active
                      ? "bg-[#ff3b30] text-white"
                      : done
                      ? "bg-[#32d74b] text-black"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {done ? <Check size={10} /> : s.n}
                </span>
                <span
                  className={`font-mono text-[9px] uppercase tracking-[0.16em] ${
                    active ? "text-white" : done ? "text-white/60" : "text-white/30"
                  }`}
                >
                  {s.label}
                </span>
              </Link>
              {i < STEPS.length - 1 && (
                <span className={`w-3 h-px ${done ? "bg-[#32d74b]/40" : "bg-white/15"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
