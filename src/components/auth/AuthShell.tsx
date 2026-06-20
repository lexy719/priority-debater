/**
 * AuthShell — the split-screen frame for /login and /signup: a brand + value
 * panel on the left (desktop), the form on the right. Purely presentational so
 * it can stay a server component; the interactive AuthForm is passed as children.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

const COPY = {
  signup: {
    eyebrow: "§ Create account",
    headline: (
      <>
        Pressure-test <span className="bg-[#ff3b30] px-2">before</span> you build.
      </>
    ),
    bullets: [
      "50 free credits — no card required",
      "Five ruthless AI advisors debate your idea",
      "An investor-grade dossier you can share",
      "Plus the AI Commerce audit for live stores",
    ],
  },
  login: {
    eyebrow: "§ Sign in",
    headline: (
      <>
        Pick up <span className="bg-[#ff3b30] px-2">where</span> you left off.
      </>
    ),
    bullets: [
      "Your validations, debates and credits",
      "Every dossier saved to your account",
      "The full studio + commerce toolkit",
      "One login across both paths",
    ],
  },
} as const;

export function AuthShell({ mode, children }: { mode: "login" | "signup"; children: ReactNode }) {
  const c = COPY[mode];
  return (
    <main className="grid min-h-[calc(100vh-57px)] lg:grid-cols-2">
      {/* brand / value panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 bg-[#0c0c0f] p-10 lg:flex xl:p-14">
        <div className="absolute inset-0 bg-grid-dark opacity-60" />
        <div className="relative">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center bg-[#ff3b30] font-display text-base text-white">PD</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/80">Priority Debater</span>
          </Link>
        </div>

        <div className="relative">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">{c.eyebrow}</p>
          <h2 className="mt-4 max-w-md font-display text-[clamp(2.25rem,3.4vw,3.5rem)] uppercase leading-[0.92] text-white">
            {c.headline}
          </h2>
          <ul className="mt-8 space-y-3">
            {c.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-white/75">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff3b30]" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
          <span className="text-[#32d74b]">50 free credits</span>
          <span className="text-white/20">·</span>
          <span>5 agents</span>
          <span className="text-white/20">·</span>
          <span>120s verdict</span>
        </div>
      </aside>

      {/* form */}
      <section className="flex items-center justify-center px-5 py-16 sm:px-10">{children}</section>
    </main>
  );
}
