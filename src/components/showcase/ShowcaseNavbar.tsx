"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Swords, FlaskConical } from "lucide-react";

const ROUTES = [
    { to: "/showcase", label: "REPORT", match: ["/showcase", "/showcase/results"] },
    { to: "/showcase/brand", label: "BRAND", match: ["/showcase/brand"] },
    { to: "/showcase/landing", label: "LANDING", match: ["/showcase/landing"] },
    { to: "/showcase/pitch", label: "DECK", match: ["/showcase/pitch"] },
];

export default function ShowcaseNavbar() {
    const path = usePathname();

    return (
        <header
            data-testid="showcase-navbar"
            className="sticky top-0 z-50 w-full border-b border-black bg-[var(--paper)]/95 backdrop-blur"
        >
            {/* Demo banner */}
            <div className="bg-black text-white font-mono text-[10px] tracking-[0.22em] uppercase text-center py-1.5 flex items-center justify-center gap-2">
                <FlaskConical className="h-3 w-3" />
                SHOWCASE MODE — CARGOBYTE MOBILITY · DEMO DATA
                <FlaskConical className="h-3 w-3" />
            </div>

            <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-6 py-4 lg:px-10">
                <Link
                    href="/showcase"
                    data-testid="showcase-brand-logo"
                    className="flex items-center gap-3"
                >
                    <div className="flex h-10 w-10 items-center justify-center border border-black bg-black text-white font-mono text-sm font-bold">
                        ID
                    </div>
                    <div className="text-left">
                        <div className="font-display text-lg leading-none tracking-tight">IDEA DEBATER</div>
                        <div className="font-mono text-[10px] text-neutral-500">
                            V.1.0 / 2026 · FOUNDER STUDIO
                        </div>
                    </div>
                </Link>

                <nav className="hidden items-center gap-7 font-mono text-xs tracking-wider md:flex">
                    {ROUTES.map((r) => {
                        const active = r.match.includes(path);
                        return (
                            <Link
                                key={r.to}
                                href={r.to}
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
                        href="/"
                        data-testid="rerun-validation-button"
                        className="flex items-center gap-2 border border-black bg-black px-4 py-2 font-mono text-xs tracking-wider text-white shadow-brutal-sm transition hover:shadow-[8px_8px_0_0_#7dd3fc]"
                    >
                        <Zap className="h-3.5 w-3.5" />
                        NEW VALIDATION
                    </Link>
                </div>
            </div>
        </header>
    );
}
