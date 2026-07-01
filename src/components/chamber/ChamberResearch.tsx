"use client";

/**
 * ChamberResearch (§1.2) — the silent research phase that runs BEFORE the panel
 * opens, in the same live-log register as Commerce's scan screen.
 *
 * It does NOT run a new paid search: it surfaces the REAL grounding already on
 * file from the audited report (competitors, risks, weakest axes, market) so the
 * founder sees the panel is armed with facts, not improvisation. When there's no
 * prior audit it says so honestly rather than faking findings. Purely visual —
 * the parent gates the actual chamber reveal on the agents arming.
 */

import { useEffect, useMemo, useState } from "react";
import { Loader2, Check, Search } from "lucide-react";
import type { ChamberGrounding } from "@/lib/chamber-grounding";

function buildLines(idea: string, g: ChamberGrounding | null): string[] {
  const lines: string[] = [];
  lines.push("Locating the audited report for this idea…");
  if (g) {
    if (typeof g.score === "number") lines.push(`Report found — viability ${g.score}/100${g.verdict ? ` (${g.verdict})` : ""}.`);
    if (g.competitors?.length) lines.push(`Cross-referencing ${g.competitors.length} known competitor${g.competitors.length === 1 ? "" : "s"}: ${g.competitors.slice(0, 3).map((c) => c.name).join(", ")}${g.competitors.length > 3 ? "…" : ""}.`);
    if (g.market && (g.market.tam || g.market.sam || g.market.som)) lines.push(`Market on record: TAM ${g.market.tam ?? "?"} · SAM ${g.market.sam ?? "?"}.`);
    if (g.risks?.length) lines.push(`Loading ${g.risks.length} flagged risk${g.risks.length === 1 ? "" : "s"}…`);
    if (g.weakestAxes?.length) lines.push(`Weakest axis on file: ${g.weakestAxes[0].label} (${g.weakestAxes[0].score}/100).`);
  } else {
    lines.push("No prior audit found — the panel will probe from first principles.");
    lines.push("Demand signal + timing checks: inconclusive without a report.");
  }
  lines.push("Briefing five adversaries on the findings…");
  lines.push("Chamber armed.");
  return lines;
}

export default function ChamberResearch({ idea, grounding }: { idea: string; grounding: ChamberGrounding | null }) {
  const lines = useMemo(() => buildLines(idea, grounding), [idea, grounding]);
  const [shown, setShown] = useState(1);

  // Reveal one log line at a time so it reads as live work, not a finished block.
  useEffect(() => {
    if (shown >= lines.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), 260);
    return () => clearTimeout(t);
  }, [shown, lines.length]);

  const complete = shown >= lines.length;

  return (
    <div className="fixed inset-0 z-[70] bg-ink text-ink-foreground grid-bg-ink grid place-items-center p-4">
      <div className="w-full max-w-lg border border-ink-foreground/20 bg-ink-foreground/[0.03] p-6 md:p-8">
        <div className="flex items-center gap-2 text-[10px] tracking-widest text-ink-foreground/55 mb-5">
          <Search className="size-3.5" /> RESEARCH PHASE · ARMING THE PANEL
        </div>
        <div className="space-y-2.5 font-mono text-[12px] leading-relaxed">
          {lines.slice(0, shown).map((l, i) => {
            const last = i === shown - 1;
            const isFinal = i === lines.length - 1;
            return (
              <div key={i} className="flex items-start gap-2.5">
                {isFinal && complete
                  ? <Check className="size-3.5 mt-0.5 shrink-0 text-success" />
                  : last && !complete
                    ? <Loader2 className="size-3.5 mt-0.5 shrink-0 animate-spin text-data" />
                    : <Check className="size-3.5 mt-0.5 shrink-0 text-ink-foreground/40" />}
                <span className={last && !complete ? "text-ink-foreground/90" : "text-ink-foreground/60"}>{l}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-6 h-1 bg-ink-foreground/10 overflow-hidden">
          <div className="h-full bg-data transition-all duration-300" style={{ width: `${Math.round((shown / lines.length) * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}
