"use client";

/**
 * ForkTabBar — the cross-fork switch shown at the top of BOTH /commerce and
 * /validation. Two mono labels (COMMERCE / VALIDATION); the active one is
 * inverted. Switching is a hard-cut route change — no fade, no ease — so the
 * two landings feel like two faces of the same product, never a transition
 * back to the fork picker.
 */

import Link from "next/link";

type Fork = "commerce" | "validation";

const TABS: { id: Fork; label: string; href: string }[] = [
  { id: "commerce", label: "COMMERCE", href: "/commerce" },
  { id: "validation", label: "VALIDATION", href: "/validation" },
];

export function ForkTabBar({ active }: { active: Fork }) {
  return (
    <div className="sticky top-0 z-50 w-full border-b border-white/15 bg-[--fk-black]">
      <div className="mx-auto flex max-w-[1400px] items-stretch">
        {TABS.map((t) => {
          const isActive = t.id === active;
          return (
            <Link
              key={t.id}
              href={t.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex-1 px-6 py-4 text-center font-mono text-[11px] uppercase tracking-[0.28em] no-underline ${
                isActive
                  ? "bg-white text-[--fk-black]"
                  : "bg-[--fk-black] text-white/70 hover:text-white"
              }`}
              style={{ transition: "none", borderRadius: 0 }}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
