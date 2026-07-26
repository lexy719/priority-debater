"use client";

/**
 * Fork Picker — legacy split-screen entry, relocated from `/` to `/fork`
 * when the root became the PDR brand landing. Still reachable for the
 * two-fork "pick a side" flow. See docs/pd-frontend-build-brief.md Page 1
 * and docs/design-system.md (hard rules).
 *
 * Colors are the canonical `--fk-*` tokens. Local fallbacks are supplied in each
 * `var()` so the page renders correctly even before the tokens land in
 * globals.css (this page never edits shared files).
 */

import { useRouter } from "next/navigation";
import { useState } from "react";

// Canonical fork-picker tokens (with fallbacks). Never introduce raw hexes into
// JSX beyond these + `#ffffff` for hover white, per the design system.
const FK_BLACK = "var(--fk-black, #000000)";
const FK_CREAM = "var(--fk-cream, #f0ebe3)";
const FK_BLUE = "var(--fk-blue, #2f6bff)";
const FK_RED = "var(--fk-red, #ff3b30)";
const FK_WHITE = "var(--fk-white, #ffffff)";

type ForkHalfProps = {
  eyebrow: string;
  headline: string;
  description: string;
  ariaLabel: string;
  /** Resting state colors. */
  restBg: string;
  restFg: string;
  /** Hover / focus state colors (hard-cut). */
  activeBg: string;
  activeFg: string;
  onSelect: () => void;
};

function ForkHalf({
  eyebrow,
  headline,
  description,
  ariaLabel,
  restBg,
  restFg,
  activeBg,
  activeFg,
  onSelect,
}: ForkHalfProps) {
  const [active, setActive] = useState(false);

  const bg = active ? activeBg : restBg;
  const fg = active ? activeFg : restFg;

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onSelect}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      className="group relative flex h-1/2 w-full flex-col justify-center px-8 py-12 text-left md:h-full md:w-1/2 md:px-14 md:py-16"
      style={{
        backgroundColor: bg,
        color: fg,
        borderRadius: 0,
        // Hard cut — no fades/eases on the state swap.
        transition: "none",
      }}
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.32em] opacity-70">
        {eyebrow}
      </span>
      <h2 className="font-display mt-4 uppercase leading-[0.9] text-[clamp(2.75rem,7vw,6.5rem)]">
        {headline}
      </h2>
      <p className="mt-5 max-w-[38ch] text-sm leading-snug md:text-base">
        {description}
      </p>
    </button>
  );
}

export default function ForkPickerPage() {
  const router = useRouter();

  return (
    <main
      className="relative flex h-[100dvh] w-full flex-col overflow-hidden md:flex-row"
      style={{ borderRadius: 0 }}
    >
      {/* Persistent label — top center. Solid black chip + cream mono text so it
          stays legible over BOTH the dark left half and the light right half.
          Deliberately NOT mix-blend-difference. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center pt-6">
        <span
          className="font-mono text-[11px] uppercase tracking-[0.32em]"
          style={{
            backgroundColor: FK_BLACK,
            color: FK_CREAM,
            padding: "8px 14px",
            borderRadius: 0,
          }}
        >
          Pick a fork to continue
        </span>
      </div>

      {/* LEFT — Commerce (live product). */}
      <ForkHalf
        eyebrow="01 — Live Product"
        headline="Commerce"
        description="AI shopping-agent visibility, fixes, and revenue recovery for online stores."
        ariaLabel="Enter Commerce"
        restBg={FK_BLACK}
        restFg={FK_CREAM}
        activeBg={FK_BLUE}
        activeFg={FK_WHITE}
        onSelect={() => router.push("/commerce")}
      />

      {/* 1px hairline divider — hidden on the mobile vertical stack. */}
      <div
        aria-hidden="true"
        className="hidden bg-white/15 md:block md:w-px md:self-stretch"
      />

      {/* RIGHT — Validation (early stage). */}
      <ForkHalf
        eyebrow="02 — Early Stage"
        headline="Validation"
        description="Test a new idea against the market before you build it."
        ariaLabel="Enter Validation"
        restBg={FK_CREAM}
        restFg={FK_BLACK}
        activeBg={FK_RED}
        activeFg={FK_WHITE}
        onSelect={() => router.push("/validation")}
      />
    </main>
  );
}
