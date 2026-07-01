"use client";

import { useEffect, useState } from "react";

/**
 * The scan loading state — a staggered phase checklist with an elapsed timer,
 * matching the idea-validator's GeneratingScreen (chamber-scope surface card).
 * Content, not a spinner: every line names what is actually happening.
 */

const PHASES = [
  "Reading your store…",
  "Working out your category…",
  "Asking ChatGPT what to buy in your category…",
  "Checking who it names instead of you…",
  "Scoring your AI, Google & agent visibility…",
  "Building your report…",
];

export function ScanProgress({ url }: { url: string }) {
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => setStep((s) => Math.min(PHASES.length - 1, s + 1)), 7000);
    const clock = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      clearInterval(stepTimer);
      clearInterval(clock);
    };
  }, []);

  const host = (() => {
    try {
      return new URL(/^https?:\/\//.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  })();

  return (
    <div className="chamber-scope flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 text-[10px] tracking-widest">
          <span className="text-muted-foreground">PD COMMERCE · AI VISIBILITY SCAN</span>
          <span className="flex items-center gap-2 text-danger">
            <span className="size-1.5 animate-blink rounded-full bg-danger" /> LIVE
          </span>
        </div>

        <div className="px-6 py-8">
          <div className="text-display text-3xl">
            SCANNING <span className="text-data">{host}</span>
          </div>
          <p className="mt-4 border-l-2 border-data pl-3 text-xs leading-relaxed text-muted-foreground">
            <span className="tracking-widest text-data">ASKING REAL AI ASSISTANTS WHERE TO BUY IN YOUR CATEGORY</span>
          </p>

          <ul className="mt-8 space-y-2.5">
            {PHASES.map((p, i) => (
              <li key={p} className="flex items-center gap-3 text-[11px] tracking-[0.06em]">
                <span
                  className="size-2 shrink-0"
                  style={{ background: i < step ? "var(--success)" : i === step ? "var(--warn)" : "var(--surface-2)" }}
                />
                <span className={i <= step ? "text-foreground" : "text-muted-foreground/60"}>{p}</span>
                {i < step && <span className="ml-auto text-success">DONE</span>}
                {i === step && <span className="ml-auto animate-blink text-warn">RUNNING…</span>}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center justify-between text-[10px] tracking-widest text-muted-foreground">
            <span>USUALLY ~45 SECONDS</span>
            <span className="tabular-nums">{String(elapsed).padStart(2, "0")}s ELAPSED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
