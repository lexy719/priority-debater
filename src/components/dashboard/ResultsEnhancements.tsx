"use client";

import { useEffect, useState } from "react";
import { useResultsDashboard } from "@/context/results-dashboard-context";

/**
 * Results-page polish layer — adds:
 *  1. Top scroll-progress bar (highlight color).
 *  2. Sticky mini-score bar that fades in once the hero scrolls out.
 *  3. Cinematic verdict reveal on first mount (black overlay → wipe).
 *
 * Pure client-side, brutalist palette, no new deps.
 */
export default function ResultsEnhancements() {
    const { idea, overallScore, live } = useResultsDashboard();
    const [progress, setProgress] = useState(0);
    const [showSticky, setShowSticky] = useState(false);
    const [revealing, setRevealing] = useState(true);

    useEffect(() => {
        if (!live) {
            setRevealing(false);
            return;
        }
        const t = setTimeout(() => setRevealing(false), 1600);
        return () => clearTimeout(t);
    }, [live]);

    useEffect(() => {
        const onScroll = () => {
            const h = document.documentElement;
            const max = h.scrollHeight - h.clientHeight;
            const y = h.scrollTop || document.body.scrollTop;
            setProgress(max > 0 ? Math.min(100, (y / max) * 100) : 0);
            setShowSticky(y > 520);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const verdictColor =
        idea.verdict === "NO-GO" ? "var(--c-red)" : idea.verdict === "CAUTION" ? "var(--c-orange)" : "var(--c-green)";

    return (
        <>
            {/* Scroll progress bar */}
            <div
                data-testid="scroll-progress"
                className="fixed left-0 top-0 z-[60] h-[3px] bg-[var(--hi)] transition-[width] duration-150 ease-out"
                style={{ width: `${progress}%` }}
            />

            {/* Sticky mini-score */}
            {live && (
                <div
                    data-testid="sticky-mini-score"
                    className={`fixed right-4 top-20 z-[55] hidden items-center gap-3 border-2 border-black bg-white px-4 py-2 shadow-[4px_4px_0_0_#000] transition-all duration-300 md:flex ${
                        showSticky ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
                    }`}
                    aria-hidden={!showSticky}
                >
                    <span className="font-mono text-[10px] tracking-wider text-black/60">SCORE</span>
                    <span className="font-display text-2xl leading-none text-black">{overallScore.score}</span>
                    <span className="font-mono text-[10px] tracking-wider text-black/40">/ 100</span>
                    <span
                        className="ml-2 border border-black px-2 py-0.5 font-mono text-[10px] tracking-wider"
                        style={{ color: verdictColor }}
                    >
                        {idea.verdict}
                    </span>
                </div>
            )}

            {/* Cinematic verdict reveal */}
            {revealing && live && (
                <div
                    data-testid="verdict-reveal"
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black animate-[verdictFade_1.6s_ease-out_forwards] pointer-events-none"
                >
                    <div className="px-6 text-center">
                        <div className="mb-4 font-mono text-[11px] tracking-[0.3em] text-white/60 animate-[verdictRise_0.6s_ease-out_0.1s_both]">
                            VALIDATION COMPLETE
                        </div>
                        <div
                            className="font-display text-[88px] leading-none tracking-tight sm:text-[140px] animate-[verdictRise_0.7s_ease-out_0.25s_both]"
                            style={{ color: verdictColor }}
                        >
                            {idea.verdict}
                        </div>
                        <div className="mt-6 font-display text-3xl text-white/80 animate-[verdictRise_0.7s_ease-out_0.5s_both]">
                            {overallScore.score} <span className="text-white/40 text-xl">/ 100</span>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes verdictFade {
                    0%, 70% { opacity: 1; }
                    100% { opacity: 0; }
                }
                @keyframes verdictRise {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
}
