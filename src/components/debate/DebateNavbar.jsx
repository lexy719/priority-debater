"use client";

import { useRouter } from "next/navigation";
import { Zap, ArrowLeft } from "lucide-react";

export default function DebateNavbar({ round, total, shieldsTotal, maxShields }) {
    const router = useRouter();
    return (
        <header
            data-testid="debate-navbar"
            className="sticky top-0 z-50 w-full border-b border-black bg-[var(--paper)]/95 backdrop-blur"
        >
            <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-6 py-4 lg:px-10">
                <button
                    type="button"
                    data-testid="exit-debate"
                    onClick={() => router.push("/results")}
                    className="flex items-center gap-3"
                >
                    <div className="flex h-10 w-10 items-center justify-center border border-black bg-black text-white font-mono text-sm font-bold">
                        ID
                    </div>
                    <div className="text-left">
                        <div className="font-display text-lg leading-none tracking-tight">IDEA DEBATER</div>
                        <div className="font-mono text-[10px] text-neutral-500">V.1.0 / 2026 · DEBATE MODE</div>
                    </div>
                </button>

                <div className="hidden items-center gap-6 md:flex">
                    <div className="border border-black bg-[var(--hi)] px-3 py-1 font-mono text-[10px] tracking-wider text-black">
                        ◆ STRESS-TEST MODE / LIVE
                    </div>
                    <div className="font-mono text-[11px] tracking-wider text-neutral-700">
                        TURN <span className="text-black">{String(round).padStart(2, "0")}</span> / {String(total).padStart(2, "0")}
                    </div>
                    <div className="font-mono text-[11px] tracking-wider text-neutral-700">
                        SHIELDS <span className="text-black">{shieldsTotal}</span> / {maxShields}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        data-testid="back-to-report"
                        onClick={() => router.push("/results")}
                        className="hidden items-center gap-2 border border-black bg-white px-4 py-2 font-mono text-xs tracking-wider shadow-brutal-sm hover-lift sm:flex"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        BACK TO REPORT
                    </button>
                    <button
                        data-testid="restart-debate"
                        className="flex items-center gap-2 border border-black bg-black px-4 py-2 font-mono text-xs tracking-wider text-white shadow-brutal-sm transition hover:shadow-[8px_8px_0_0_#7dd3fc]"
                    >
                        <Zap className="h-3.5 w-3.5" />
                        RESTART DEBATE
                    </button>
                </div>
            </div>
        </header>
    );
}
