"use client";

import { useResultsDashboard } from "@/context/results-dashboard-context";
import ChartMount from "@/components/dashboard/ChartMount";
import DashboardChartTooltip from "@/components/dashboard/DashboardChartTooltip";
import {
    ResponsiveContainer,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Tooltip,
} from "recharts";

const sevColor = (s) =>
    s === "HIGH" ? "var(--c-red)" : s === "MED" ? "var(--c-orange)" : "var(--c-green)";

export default function RiskSection() {
    const { riskRadar, riskRadarHasData, riskBreakdown, riskIntro, dashboardUi } = useResultsDashboard();

    return (
        <section
            id="risk"
            data-testid="risk-section"
            className="relative border-b border-black bg-black text-white"
        >
            <div className="absolute inset-0 bg-grid-dark opacity-60" />
            <div className="relative mx-auto max-w-[1480px] px-6 py-20 lg:px-10">
                <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
                    <div>
                        <div className="font-mono text-[10px] tracking-wider text-white/50">{dashboardUi.risk.eyebrow}</div>
                        <h2 className="mt-3 font-display text-[48px] leading-[0.92] sm:text-[64px] lg:text-[80px]">
                            {dashboardUi.risk.headline1} <br />
                            <span className="bg-[var(--c-red)] px-1 text-white">{dashboardUi.risk.headlineAccent}</span>
                        </h2>
                    </div>
                    <div className="max-w-md font-mono text-sm leading-relaxed text-white/60">{riskIntro}</div>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                        <div data-testid="risk-radar-card" className="relative h-full border border-white/40 bg-black p-6">
                            <div className="font-mono text-[10px] tracking-wider text-white/50">
                                RISK RADAR · 6 RUBRIC DIMENSIONS
                            </div>
                            <div className="mt-2 font-display text-2xl">SEVERITY MAP</div>
                            <p className="mt-2 font-mono text-[10px] leading-relaxed text-white/45">
                                Each spike is <strong className="text-white/70">100 − category score</strong> from your report.
                                Axis labels show the rubric score (e.g. FIT (54)).
                            </p>
                            <div className="mt-4 h-[380px]">
                                {!riskRadarHasData ? (
                                    <div className="flex h-full items-center justify-center border border-dashed border-white/25 px-6 text-center font-mono text-xs text-white/55">
                                        Not enough category scores in the report to draw a severity map. Re-run validation
                                        with a complete ### Category Scores block.
                                    </div>
                                ) : (
                                    <ChartMount>
                                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                            <RadarChart data={riskRadar} outerRadius="75%">
                                                <PolarGrid stroke="#ffffff" strokeOpacity={0.15} />
                                                <PolarAngleAxis
                                                    dataKey="axisLabel"
                                                    tick={{ fontFamily: "JetBrains Mono", fontSize: 9, fill: "#ffffff" }}
                                                />
                                                <PolarRadiusAxis
                                                    angle={90}
                                                    domain={[0, 100]}
                                                    tick={{ fontFamily: "JetBrains Mono", fontSize: 9, fill: "#ffffff80" }}
                                                    stroke="#ffffff20"
                                                />
                                                <Tooltip
                                                    content={(props) => {
                                                        const point = props.payload?.[0]?.payload;
                                                        const label = point?.dim
                                                            ? `${point.dim} · risk ${point.value} · rubric ${point.rubricScore ?? "—"}/100`
                                                            : props.label;
                                                        return (
                                                            <DashboardChartTooltip
                                                                active={props.active}
                                                                payload={props.payload}
                                                                label={label}
                                                                valueFormatter={(v) => `${v} risk severity`}
                                                            />
                                                        );
                                                    }}
                                                />
                                                <Radar
                                                    dataKey="value"
                                                    stroke="#7dd3fc"
                                                    strokeWidth={2}
                                                    fill="#7dd3fc"
                                                    fillOpacity={0.25}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </ChartMount>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-7">
                        <div className="border border-white/40">
                            <div className="grid grid-cols-12 border-b border-white/40 bg-white/5 px-4 py-2 font-mono text-[10px] tracking-wider text-white/50">
                                <div className="col-span-2">CATEGORY</div>
                                <div className="col-span-2">SEVERITY</div>
                                <div className="col-span-8">FINDING / MITIGATION</div>
                            </div>
                            {riskBreakdown.map((r, i) => (
                                <div
                                    key={`${r.category}-${r.title}-${i}`}
                                    data-testid={`risk-row-${i}`}
                                    className="group grid grid-cols-12 items-start gap-4 border-b border-white/20 px-4 py-5 transition-colors hover:bg-white/5"
                                >
                                    <div className="col-span-2 font-mono text-[11px] tracking-wider text-white/70">
                                        {r.category}
                                    </div>
                                    <div className="col-span-2">
                                        <span
                                            className="inline-block border px-2 py-0.5 font-mono text-[10px] tracking-wider"
                                            style={{ color: sevColor(r.severity), borderColor: sevColor(r.severity) }}
                                        >
                                            ● {r.severity}
                                        </span>
                                    </div>
                                    <div className="col-span-12 sm:col-span-8">
                                        <div className="font-display text-lg leading-tight">{r.title}</div>
                                        <div className="mt-2 font-mono text-xs text-white/55">
                                            <span className="text-[var(--hi)]">→ </span>
                                            {r.mitigation}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
