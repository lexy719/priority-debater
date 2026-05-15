"use client";

import { useResultsDashboard } from "@/context/results-dashboard-context";
import ChartMount from "@/components/dashboard/ChartMount";
import DashboardChartTooltip from "@/components/dashboard/DashboardChartTooltip";
import { formatEurMillions } from "@/lib/chart-data";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

function formatRevenueTooltip(value) {
    return formatEurMillions(Number(value));
}

export default function RevenueSection() {
    const {
        revenueProjection,
        revenueSourceMetric,
        revenueEndYearLabel,
        pricingModels,
        revenueHeadline,
        revenueNarrative,
        dashboardUi,
    } = useResultsDashboard();

    const hasRevenue = revenueProjection.length > 0;
    const hasStackedExpansion = revenueProjection.some((p) => p.subs > 0);
    const firstPositive = revenueProjection.find((p) => p.total > 0);
    const yStart = firstPositive?.total ?? revenueProjection[0]?.total ?? 0;
    const yEnd = revenueProjection[revenueProjection.length - 1]?.total ?? 0;
    const growth =
        hasRevenue && yStart > 0 && yEnd > yStart
            ? `${Math.max(1, Math.round((yEnd / yStart) * 10) / 10)}× GROWTH`
            : hasRevenue
              ? "FROM REPORT"
              : "NO FORECAST";

    const endYearLine = revenueEndYearLabel ? revenueEndYearLabel.toUpperCase() : "FINAL YEAR";

    return (
        <section
            id="revenue"
            data-testid="revenue-section"
            className="relative border-b border-black bg-[var(--bone)] py-20"
        >
            <div className="relative mx-auto max-w-[1480px] px-6 lg:px-10">
                <div className="mb-12 grid gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <div className="font-mono text-[10px] tracking-wider text-neutral-500">{dashboardUi.revenue.eyebrow}</div>
                        <h2 className="mt-3 font-display text-[48px] leading-[0.92] sm:text-[64px] lg:text-[80px]">
                            {hasRevenue ? (
                                <>
                                    <span className="hl-strip">{revenueHeadline}</span> ARR <br />
                                    BY {endYearLine}.
                                </>
                            ) : (
                                <>
                                    REVENUE <br />
                                    <span className="hl-strip">NEEDS PROOF.</span>
                                </>
                            )}
                        </h2>
                    </div>
                    <div className="lg:col-span-5 lg:pt-6">
                        <p className="font-mono text-sm leading-relaxed text-neutral-600">{revenueNarrative}</p>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-8">
                        <div className="relative border-2 border-black bg-white p-6 shadow-brutal">
                            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <div className="font-mono text-[10px] tracking-wider text-neutral-500">
                                        {hasRevenue ? "REVENUE FROM VALIDATION TABLE" : "REVENUE EVIDENCE"}
                                    </div>
                                    <div className="mt-1 font-display text-2xl">
                                        {hasRevenue ? "EUR MILLIONS (PARSED)" : "PRICING-LED MODEL"}
                                    </div>
                                    {hasRevenue && revenueSourceMetric ? (
                                        <div className="mt-1 font-mono text-[10px] text-neutral-500">
                                            Source row: {revenueSourceMetric}
                                        </div>
                                    ) : null}
                                </div>
                                <div className="font-mono text-xs">
                                    {hasRevenue
                                        ? `${revenueProjection[0]?.year ?? "Y1"} → ${revenueEndYearLabel || "—"}`
                                        : "NO FORECAST"}{" "}
                                    <span className="bg-black px-2 py-0.5 text-white">{growth}</span>
                                </div>
                            </div>
                            <div className={hasRevenue ? "h-[340px]" : "min-h-[340px]"}>
                                {!hasRevenue ? (
                                    <div className="flex h-[340px] flex-col justify-center border border-dashed border-black/30 bg-neutral-50 px-8 text-sm leading-relaxed text-neutral-700">
                                        <div className="font-black text-black">Forecast unavailable</div>
                                        <p className="mt-2 max-w-xl">
                                            The report has pricing signals, but no adoption ramp, ARR, MRR, or customer-count
                                            forecast strong enough to chart. Pricing is shown without inventing revenue.
                                        </p>
                                    </div>
                                ) : (
                                    <ChartMount>
                                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                            <BarChart data={revenueProjection} margin={{ top: 16, right: 12, bottom: 0, left: 4 }}>
                                                <CartesianGrid stroke="#0a0a0a" strokeOpacity={0.08} vertical={false} />
                                                <XAxis
                                                    dataKey="year"
                                                    tick={{ fontFamily: "JetBrains Mono", fontSize: 11 }}
                                                    axisLine={{ stroke: "#0a0a0a" }}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    tick={{ fontFamily: "JetBrains Mono", fontSize: 11 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(v) => `${v}M`}
                                                    domain={[0, (dataMax) => Math.max(dataMax * 1.15, 0.1)]}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: "rgba(125, 211, 252, 0.15)" }}
                                                    content={(props) => {
                                                        const raw = props.payload?.[0]?.payload?.raw;
                                                        const title = raw
                                                            ? `${props.label} · ${raw}`
                                                            : props.label;
                                                        return (
                                                            <DashboardChartTooltip
                                                                active={props.active}
                                                                payload={props.payload}
                                                                label={title}
                                                                valueFormatter={formatRevenueTooltip}
                                                            />
                                                        );
                                                    }}
                                                />
                                                {hasStackedExpansion ? (
                                                    <>
                                                        <Legend
                                                            wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 11 }}
                                                            iconType="square"
                                                        />
                                                        <Bar dataKey="hardware" name="Core" stackId="a" fill="#0a0a0a" />
                                                        <Bar dataKey="subs" name="Expansion" stackId="a" fill="#7dd3fc" />
                                                    </>
                                                ) : (
                                                    <Bar dataKey="hardware" name="Revenue" fill="#0a0a0a" />
                                                )}
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartMount>
                                )}
                            </div>
                            {hasRevenue ? (
                                <p className="mt-3 font-mono text-[10px] leading-relaxed text-neutral-500">
                                    Values are taken from your report&apos;s financial table and converted to EUR millions. Hover a bar
                                    to see the original figure. We do not extrapolate missing years.
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="lg:col-span-4">
                        <div className="font-mono text-[10px] tracking-wider text-neutral-500">PRICING MODEL</div>
                        <div className="mt-2 font-display text-2xl">3-TIER LADDER</div>
                        <div className="mt-5 space-y-4">
                            {pricingModels.map((p, i) => (
                                <div
                                    key={p.plan}
                                    data-testid={`pricing-model-${i}`}
                                    className={`relative border-2 border-black p-5 hover-lift ${
                                        i === 1 ? "bg-black text-white" : "bg-white"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-display text-2xl">{p.plan}</span>
                                        {i === 1 && (
                                            <span className="bg-[var(--hi)] px-2 py-0.5 font-mono text-[10px] text-black">
                                                ANCHOR
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-3 font-display text-3xl">{p.price}</div>
                                    <div className={`mt-2 font-mono text-[11px] ${i === 1 ? "text-white/60" : "text-neutral-500"}`}>
                                        {p.terms}
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
