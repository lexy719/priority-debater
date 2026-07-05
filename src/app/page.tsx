"use client";

/**
 * Fork Picker (brief Page 1) — the site entry, before either main page. A
 * full-bleed split screen with two halves and nothing else: no header, no nav,
 * no footer. A persistent "PICK A FORK TO CONTINUE" sits top-center. Left →
 * Commerce, right → Validation. Hover is a hard cut (instant, no fade/ease);
 * clicking navigates instantly — no confirmation, no loading screen.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";

type Fork = "commerce" | "validation";

export default function ForkPicker() {
  const router = useRouter();
  const [hover, setHover] = useState<Fork | null>(null);

  const go = (fork: Fork) => router.push(fork === "commerce" ? "/commerce" : "/validation");

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden" style={{ borderRadius: 0 }}>
      {/* Persistent prompt, top-center, above both halves */}
      <div className="pointer-events-none absolute left-1/2 top-6 z-20 -translate-x-1/2">
        <span className="font-mono text-[11px] uppercase tracking-[0.4em] text-white mix-blend-difference">
          Pick a fork to continue
        </span>
      </div>

      <div className="flex h-full w-full flex-col md:flex-row">
        {/* LEFT — Commerce */}
        <button
          type="button"
          onClick={() => go("commerce")}
          onMouseEnter={() => setHover("commerce")}
          onMouseLeave={() => setHover(null)}
          className="group relative flex h-1/2 w-full flex-col items-center justify-center px-8 md:h-full md:w-1/2"
          style={{
            transition: "none",
            background: hover === "commerce" ? "var(--fk-blue)" : "var(--fk-black)",
            color: hover === "commerce" ? "#ffffff" : "var(--fk-cream)",
            borderRadius: 0,
          }}
        >
          <div className="mb-5 font-mono text-[11px] uppercase tracking-[0.32em] opacity-70">
            01 — Live Product
          </div>
          <h2 className="font-display text-[clamp(2.75rem,7vw,6.5rem)] uppercase leading-[0.9] tracking-[-0.01em]">
            Commerce
          </h2>
          <p className="mt-6 max-w-sm text-center font-mono text-[12px] leading-relaxed opacity-70">
            AI shopping-agent visibility, fixes, and revenue recovery for online stores.
          </p>
        </button>

        {/* Hairline divider */}
        <div className="hidden w-px shrink-0 bg-white/15 md:block" />

        {/* RIGHT — Validation */}
        <button
          type="button"
          onClick={() => go("validation")}
          onMouseEnter={() => setHover("validation")}
          onMouseLeave={() => setHover(null)}
          className="group relative flex h-1/2 w-full flex-col items-center justify-center px-8 md:h-full md:w-1/2"
          style={{
            transition: "none",
            background: hover === "validation" ? "var(--fk-red)" : "var(--fk-cream)",
            color: hover === "validation" ? "#ffffff" : "var(--fk-black)",
            borderRadius: 0,
          }}
        >
          <div className="mb-5 font-mono text-[11px] uppercase tracking-[0.32em] opacity-70">
            02 — Early Stage
          </div>
          <h2 className="font-display text-[clamp(2.75rem,7vw,6.5rem)] uppercase leading-[0.9] tracking-[-0.01em]">
            Validation
          </h2>
          <p className="mt-6 max-w-sm text-center font-mono text-[12px] leading-relaxed opacity-70">
            Test a new idea against the market before you build it.
          </p>
        </button>
      </div>
    </main>
  );
}
