"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Studio tools — sole items in the results top bar. */
const STUDIO_LINKS = [
    { href: "/brand", label: "BRAND KIT", matchPrefix: "/brand" },
    { href: "/landing", label: "LANDING", matchPrefix: "/landing" },
    { href: "/pitch", label: "DECK", matchPrefix: "/pitch" },
];

export default function Navbar() {
    const pathname = usePathname() ?? "";

    return (
        <header
            data-testid="dashboard-navbar"
            className="sticky top-0 z-50 w-full border-b border-black bg-[var(--paper)]/95 backdrop-blur"
        >
            <div className="mx-auto flex max-w-[1480px] justify-center px-6 py-4 lg:px-10">
                <nav
                    className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[11px] tracking-wider sm:gap-x-7 sm:text-xs"
                    aria-label="Studio"
                >
                    {STUDIO_LINKS.map((s) => {
                        const studioActive =
                            pathname === s.matchPrefix || pathname.startsWith(`${s.matchPrefix}/`);
                        return (
                            <Link
                                key={s.href}
                                href={s.href}
                                data-testid={`nav-studio-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
                                className={`relative transition-colors hover:text-black/50 ${
                                    studioActive ? "text-black" : "text-black/70"
                                }`}
                            >
                                {s.label}
                                {studioActive && (
                                    <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-[var(--hi-deep)]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}
