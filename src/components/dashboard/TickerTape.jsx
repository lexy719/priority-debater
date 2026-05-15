"use client";

import { useResultsDashboard } from "@/context/results-dashboard-context";

export default function TickerTape({ dark = false }) {
    const { tickerItems } = useResultsDashboard();
    const rowCls = dark ? "ticker-row-dark bg-black text-white" : "ticker-row bg-[var(--paper)] text-black";
    const doubled = [...tickerItems, ...tickerItems];

    return (
        <div data-testid="ticker-tape" className={`relative w-full overflow-hidden ${rowCls}`}>
            <div className="ticker-track flex whitespace-nowrap py-2">
                {doubled.map((t, i) => (
                    <span key={i} className="flex items-center font-mono text-[11px] tracking-[0.18em]">
                        <span className="mx-6 inline-block h-1.5 w-1.5 bg-current opacity-60" />
                        {t}
                    </span>
                ))}
            </div>
        </div>
    );
}
