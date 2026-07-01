"use client";

/**
 * ForkToggle — the prominent segmented control under the hero that flips the
 * whole page between the two products. Red = idea validation, blue = AI commerce.
 */

import { Gavel, ShoppingBag } from "lucide-react";
import { useFork } from "./ForkContext";

export function ForkToggle() {
  const { fork, setFork } = useFork();
  return (
    <div className="border-b border-ink/15 bg-paper">
      <div className="mx-auto flex max-w-[1120px] flex-col items-center gap-3 px-6 py-7 text-center lg:px-10">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink/45">
          Two paths · pick what you&apos;re here for
        </span>
        <div className="inline-flex border-2 border-ink bg-paper p-1 shadow-[4px_4px_0_0_var(--color-ink)]">
          <button
            type="button"
            onClick={() => setFork("validate")}
            aria-pressed={fork === "validate"}
            className={`inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
              fork === "validate" ? "bg-signal-red text-paper" : "text-ink hover:bg-paper-2"
            }`}
          >
            <Gavel className="h-3.5 w-3.5" /> Idea validation
          </button>
          <button
            type="button"
            onClick={() => setFork("commerce")}
            aria-pressed={fork === "commerce"}
            className={`inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
              fork === "commerce" ? "bg-signal-blue text-paper" : "text-ink hover:bg-paper-2"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" /> AI commerce
          </button>
        </div>
      </div>
    </div>
  );
}
