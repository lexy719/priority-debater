"use client";

import { useResultsDashboard } from "@/context/results-dashboard-context";

export default function MetricsStrip() {
    const { coldMetrics, dashboardUi } = useResultsDashboard();
    return (
        <section
            data-testid="metrics-strip"
            className="border-b border-black bg-black py-10 text-white"
        >
            <div className="mx-auto max-w-[1480px] px-6 lg:px-10">
                <div className="mb-6 flex items-end justify-between">
                    <h2 className="font-display text-2xl lg:text-3xl">
                        {dashboardUi.metrics.headline1}{" "}
                        <span className="hl-strip-dark border border-white">{dashboardUi.metrics.headlineAccent}</span>
                    </h2>
                    <div className="font-mono text-[10px] tracking-wider text-white/50">{dashboardUi.metrics.eyebrow}</div>
                </div>

                <div className="grid grid-cols-2 gap-px border border-white/30 bg-white/20 sm:grid-cols-3 lg:grid-cols-6">
                    {coldMetrics.map((m) => (
                        <div
                            key={m.label}
                            data-testid={`metric-${m.label.toLowerCase()}`}
                            className="group relative bg-black p-6 transition-colors hover:bg-[var(--hi)] hover:text-black"
                        >
                            <div className="font-mono text-[10px] tracking-wider text-white/50 group-hover:text-black/60">
                                {m.label}
                            </div>
                            <div className="mt-5 flex items-baseline gap-1">
                                <span className="font-display text-4xl lg:text-5xl">{m.value}</span>
                                {m.suffix ? (
                                    <span className="font-mono text-[10px] text-white/50 group-hover:text-black/60">
                                        {m.suffix}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
