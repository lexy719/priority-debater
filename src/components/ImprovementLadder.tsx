"use client";

import { Check, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryScores } from "@/lib/parse";
import { SCORE_MAX, WEAK_CATEGORY_THRESHOLD } from "@/lib/scoring-scale";

const RUNGS: { key: keyof CategoryScores; label: string; sub: string }[] = [
  { key: "problemSolutionFit", label: "Problem & solution", sub: "Pain ↔ fix" },
  { key: "marketOpportunity", label: "Market", sub: "Space to win" },
  { key: "competitiveEdge", label: "Competition", sub: "Why you" },
  { key: "businessModel", label: "Business model", sub: "How you earn" },
  { key: "teamExecution", label: "Execution", sub: "Who ships it" },
  { key: "timingTrends", label: "Timing", sub: "Why now" },
];

function rungState(value: number | null): "missing" | "climb" | "solid" {
  if (value == null) return "missing";
  if (value >= WEAK_CATEGORY_THRESHOLD) return "solid";
  return "climb";
}

export function ValidationClimbOverview({ scores }: { scores: CategoryScores }) {
  let solid = 0;
  let climb = 0;
  for (const { key } of RUNGS) {
    const v = scores[key];
    const s = rungState(v);
    if (s === "solid") solid++;
    if (s === "climb") climb++;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-linear-to-b from-indigo-500/[0.07] to-transparent p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300/80">Validation climb</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-white">Your ladder across six dimensions</h3>
          <p className="mt-1 max-w-xl text-sm text-white/40">
            Each rung is a score band. Strong rungs are footholds; the highlighted ones are your next moves up — not failures, just the
            path forward.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/80">Solid</p>
            <p className="text-xl font-black tabular-nums text-emerald-400">
              {solid}
              <span className="text-sm font-semibold text-white/25">/6</span>
            </p>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-wider text-amber-400/80">Next moves</p>
            <p className="text-xl font-black tabular-nums text-amber-400">
              {climb}
              <span className="text-sm font-semibold text-white/25">/6</span>
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          className="pointer-events-none absolute left-0 right-0 top-[22px] hidden h-0.5 bg-linear-to-r from-emerald-500/20 via-amber-500/25 to-violet-500/20 sm:block"
          aria-hidden
        />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {RUNGS.map(({ key, label, sub }, i) => {
            const value = scores[key];
            const state = rungState(value);
            const show = value != null;
            return (
              <li key={key} className="relative">
                <div
                  className={cn(
                    "flex h-full flex-col rounded-xl border p-3 transition-colors",
                    state === "solid" && "border-emerald-500/25 bg-emerald-500/[0.06]",
                    state === "climb" && "border-amber-500/35 bg-amber-500/[0.07] ring-1 ring-amber-500/15",
                    state === "missing" && "border-white/8 bg-white/[0.02] opacity-70",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold tabular-nums text-white/35">#{i + 1}</span>
                    {state === "solid" && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </span>
                    )}
                    {state === "climb" && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                        <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </span>
                    )}
                    {state === "missing" && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-white/30">
                        <Minus className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold leading-tight text-white/90">{label}</p>
                  <p className="mt-0.5 text-[10px] text-white/30">{sub}</p>
                  <p className="mt-2 text-lg font-black tabular-nums text-white/90">
                    {show ? (
                      <>
                        {Math.round(value!)}
                        <span className="text-[10px] font-medium text-white/25">/{SCORE_MAX}</span>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-white/25">—</span>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
