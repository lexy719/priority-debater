"use client";

import { useResultsDashboard } from "@/context/results-dashboard-context";
import ChartMount from "@/components/dashboard/ChartMount";
import DashboardChartTooltip from "@/components/dashboard/DashboardChartTooltip";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";

export default function MarketSection() {
    const { marketGrowth, marketSignals, marketIntro, marketCagrLabel, dashboardUi } = useResultsDashboard();
    const hasMarketGrowth = marketGrowth.length > 0;

    return (
        <section
            id="market"
            data-testid="market-section"
            className="relative border-b border-black bg-[var(--paper)] py-20"
        >
            <div className="absolute inset-0 bg-grid opacity-100" />
            <div className="relative mx-auto max-w-[1480px] px-6 lg:px-10">
                <div className="mb-12 grid gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <div className="font-mono text-[10px] tracking-wider text-neutral-500">{dashboardUi.market.eyebrow}</div>
                        <h2 className="mt-3 font-display text-[48px] leading-[0.92] sm:text-[64px] lg:text-[80px]">
                            THE MARKET <br />
                            <span className="hl-strip">DOESN&apos;T LIE.</span>
                        </h2>
                    </div>
                    <div className="lg:col-span-5 lg:pt-6">
                        <p className="font-mono text-sm leading-relaxed text-neutral-600">{marketIntro}</p>
                    </div>
                </div>

                <div className="relative border-2 border-black bg-white p-6 shadow-brutal lg:p-10">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <div className="font-mono text-[10px] tracking-wider text-neutral-500">
                                MARKET GROWTH PROJECTION
                            </div>
                            <div className="mt-1 font-display text-2xl">{dashboardUi.market.chartSubhead}</div>
                        </div>
                        <div className="flex items-center gap-2 border border-black px-3 py-1.5 font-mono text-[11px]">
                            <TrendingUp className="h-3.5 w-3.5" />
                            {marketCagrLabel}
                        </div>
                    </div>

                    <div className="h-[360px] w-full">
                        {!hasMarketGrowth ? (
                            <div className="flex h-full items-center justify-center border border-dashed border-black/30 bg-neutral-50 px-6 text-center text-sm text-neutral-600">
                                Market sizing is not strong enough to chart yet. This report can discuss timing and demand
                                signals, but TAM, SAM, and SOM need explicit evidence before a growth curve is shown.
                            </div>
                        ) : (
                            <ChartMount>
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <AreaChart data={marketGrowth} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
                                        <defs>
                                            <linearGradient id="tamFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#0a0a0a" stopOpacity={0.9} />
                                                <stop offset="100%" stopColor="#0a0a0a" stopOpacity={0.05} />
                                            </linearGradient>
                                            <linearGradient id="samFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#7dd3fc" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#7dd3fc" stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke="#0a0a0a" strokeOpacity={0.08} vertical={false} />
                                        <XAxis
                                            dataKey="year"
                                            tick={{ fontFamily: "JetBrains Mono", fontSize: 11, fill: "#0a0a0a" }}
                                            axisLine={{ stroke: "#0a0a0a" }}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            tick={{ fontFamily: "JetBrains Mono", fontSize: 11, fill: "#0a0a0a" }}
                                            axisLine={false}
                                            tickLine={false}
                                            label={{
                                                value: "TAM ($B)",
                                                angle: -90,
                                                position: "insideLeft",
                                                fontFamily: "JetBrains Mono",
                                                fontSize: 10,
                                                fill: "#666",
                                            }}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            tick={{ fontFamily: "JetBrains Mono", fontSize: 11, fill: "#0a0a0a" }}
                                            axisLine={false}
                                            tickLine={false}
                                            label={{
                                                value: "SAM/SOM ($M)",
                                                angle: 90,
                                                position: "insideRight",
                                                fontFamily: "JetBrains Mono",
                                                fontSize: 10,
                                                fill: "#666",
                                            }}
                                        />
                                        <Tooltip
                                            cursor={{ stroke: "#0a0a0a", strokeWidth: 1, strokeDasharray: "4 4" }}
                                            content={(props) => (
                                                <DashboardChartTooltip
                                                    active={props.active}
                                                    payload={props.payload}
                                                    label={props.label}
                                                    valueFormatter={(v, p) =>
                                                        p?.dataKey === "tam" ? `$${v}B` : `$${v}M`
                                                    }
                                                />
                                            )}
                                        />
                                        <Legend
                                            wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 11, paddingTop: 8 }}
                                            iconType="square"
                                        />
                                        <Area yAxisId="left" type="monotone" dataKey="tam" stroke="#0a0a0a" strokeWidth={2} fill="url(#tamFill)" name="TAM ($B)" />
                                        <Area yAxisId="right" type="monotone" dataKey="sam" stroke="#38bdf8" strokeWidth={3} fill="url(#samFill)" name="SAM ($M)" />
                                        <Area yAxisId="right" type="monotone" dataKey="som" stroke="#ff3b30" strokeWidth={2} fill="#ff3b30" fillOpacity={0.15} name="SOM ($M)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartMount>
                        )}
                    </div>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {marketSignals.map((s, i) => {
                        const isNegative = s.weight.startsWith("-");
                        return (
                            <div
                                key={`${s.tag}-${i}`}
                                data-testid={`market-signal-${i}`}
                                className="relative border-2 border-black bg-white p-5 hover-lift"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="border border-black px-2 py-0.5 font-mono text-[9px] tracking-wider">
                                        {s.tag}
                                    </span>
                                    <span className={`font-mono text-xs font-bold ${isNegative ? "text-[var(--c-red)]" : "text-[var(--c-green)]"}`}>
                                        {s.weight}
                                    </span>
                                </div>
                                <div className="mt-4 font-display text-lg leading-tight">{s.label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
