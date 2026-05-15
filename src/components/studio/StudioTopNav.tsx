"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Swords } from "lucide-react";

const ROUTES = [
  { href: "/results", label: "REPORT", match: ["/results"] },
  { href: "/debate", label: "DEBATE", match: ["/debate"] },
  { href: "/brand", label: "BRAND", match: ["/brand"] },
  { href: "/landing", label: "LANDING", match: ["/landing"] },
  { href: "/pitch", label: "DECK", match: ["/pitch"] },
];

export default function StudioTopNav() {
  const pathname = usePathname() ?? "";
  const isDebate = pathname === "/debate";

  return (
    <header
      data-testid="studio-top-nav"
      className="sticky top-0 z-50 w-full border-b border-black bg-[var(--paper)]/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <Link href="/results" data-testid="studio-brand-logo" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-black bg-black font-mono text-sm font-bold text-white">
            ID
          </div>
          <div className="text-left">
            <div className="font-display text-lg leading-none tracking-tight">IDEA DEBATER</div>
            <div className="font-mono text-[10px] text-neutral-500">
              V.1.0 / 2026{isDebate ? " · DEBATE MODE" : " · FOUNDER STUDIO"}
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 font-mono text-xs tracking-wider md:flex">
          {ROUTES.map((r) => {
            const active = r.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
            return (
              <Link
                key={r.href}
                href={r.href}
                data-testid={`nav-${r.label.toLowerCase()}`}
                className={`relative transition-colors hover:text-black ${
                  active ? "text-black" : "text-black/55"
                }`}
              >
                {r.label}
                {active && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-[var(--hi-deep)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/debate"
            data-testid="enter-debate-button"
            className="hidden items-center gap-2 border border-black bg-white px-4 py-2 font-mono text-xs tracking-wider shadow-brutal-sm hover-lift sm:flex"
          >
            <Swords className="h-3.5 w-3.5" />
            DEBATE MODE
          </Link>
          <Link
            href="/#idea-validation"
            data-testid="rerun-validation-button"
            className="flex items-center gap-2 border border-black bg-black px-4 py-2 font-mono text-xs tracking-wider text-white shadow-brutal-sm transition hover:shadow-[8px_8px_0_0_#7dd3fc]"
          >
            <Zap className="h-3.5 w-3.5" />
            RE-RUN VALIDATION
          </Link>
        </div>
      </div>
    </header>
  );
}
