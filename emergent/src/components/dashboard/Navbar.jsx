"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, Share2 } from "lucide-react";
import { useResultsDashboard } from "@/context/results-dashboard-context";
import { loadSession } from "@/lib/session";
import { dossierFromSession } from "@/lib/dossier-from-session";
import { exportBriefToMarkdownFile, shareOrCopyBrief } from "@/lib/export-dossier-markdown";

/** Studio tools — sole items in the results top bar. */
const STUDIO_LINKS = [
    { href: "/brand", label: "BRAND KIT", matchPrefix: "/brand" },
    { href: "/landing", label: "LANDING", matchPrefix: "/landing" },
    { href: "/pitch", label: "DECK", matchPrefix: "/pitch" },
];

export default function Navbar() {
    const pathname = usePathname() ?? "";
    const { live } = useResultsDashboard();

    const handleExport = () => {
        const session = loadSession();
        if (!session) return;
        const dossier = dossierFromSession(session);
        exportBriefToMarkdownFile(dossier, session.validationContent);
    };

    const handleShare = async () => {
        const session = loadSession();
        if (!session) return;
        const dossier = dossierFromSession(session);
        const result = await shareOrCopyBrief(dossier);
        if (result) {
            try { (await import("sonner")).toast.success(result); } catch { /* noop */ }
        }
    };

    return (
        <header
            data-testid="dashboard-navbar"
            className="sticky top-0 z-50 w-full border-b border-black bg-[var(--paper)]/95 backdrop-blur"
        >
            <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-6 py-4 lg:px-10">
                <nav
                    className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] tracking-wider sm:gap-x-7 sm:text-xs"
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

                {live && (
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                        <button
                            type="button"
                            onClick={handleShare}
                            data-testid="nav-share-btn"
                            className="inline-flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1.5 tracking-wider transition-transform hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#000]"
                        >
                            <Share2 className="h-3.5 w-3.5" /> SHARE
                        </button>
                        <button
                            type="button"
                            onClick={handleExport}
                            data-testid="nav-export-md-btn"
                            className="inline-flex items-center gap-1.5 border-2 border-black bg-[var(--hi)] px-3 py-1.5 tracking-wider transition-transform hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#000]"
                        >
                            <Download className="h-3.5 w-3.5" /> EXPORT .MD
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
