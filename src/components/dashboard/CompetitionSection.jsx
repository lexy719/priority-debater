"use client";

import { useResultsDashboard } from "@/context/results-dashboard-context";
import ChartMount from "@/components/dashboard/ChartMount";
import DashboardChartTooltip from "@/components/dashboard/DashboardChartTooltip";
import {
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    ZAxis,
    LabelList,
} from "recharts";

export default function CompetitionSection() {
    const { competitors, competitorScatter, competitionIntro, idea, yourTractionScore, yourIdeaStrapline, dashboardUi } =
        useResultsDashboard();

    return (
        <section
            id="competition"
            data-testid="competition-section"
            className="relative border-b border-black bg-[var(--paper)] py-20"
        >
            <div className="absolute inset-0 bg-grid opacity-100" />
            <div className="relative mx-auto max-w-[1480px] px-6 lg:px-10">
                <div className="mb-12 grid gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <div className="font-mono text-[10px] tracking-wider text-neutral-500">{dashboardUi.competition.eyebrow}</div>
                        <h2 className="mt-3 font-display text-[48px] leading-[0.92] sm:text-[64px] lg:text-[80px]">
                            {competitors.length || 0} NAMED. <br />
                            <span className="hl-strip-dark">YOU SIT TOP-RIGHT.</span>
                        </h2>
                    </div>
                    <div className="lg:col-span-5 lg:pt-6">
                        <p className="font-mono text-sm leading-relaxed text-neutral-600">{competitionIntro}</p>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-6">
                        <div className="relative border-2 border-black bg-white p-6 shadow-brutal">
                            <div className="font-mono text-[10px] tracking-wider text-neutral-500">
                                POSITIONING QUADRANT
                            </div>
                            <div className="mt-1 font-display text-2xl">AUTONOMY x TRACTION</div>
                            <div className="mt-4 h-[360px]">
                                <ChartMount>
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        <ScatterChart margin={{ top: 16, right: 16, bottom: 16, left: 0 }}>
                                            <CartesianGrid stroke="#0a0a0a" strokeOpacity={0.08} />
                                            <XAxis
                                                type="number"
                                                dataKey="x"
                                                name="Autonomy maturity"
                                                domain={[0, 100]}
                                                tick={{ fontFamily: "Inter", fontSize: 11 }}
                                                axisLine={{ stroke: "#0a0a0a" }}
                                                tickLine={false}
                                                label={{
                                                    value: "AUTONOMY ->",
                                                    position: "insideBottom",
                                                    offset: -6,
                                                    fontFamily: "Inter",
                                                    fontSize: 11,
                                                }}
                                            />
                                            <YAxis
                                                type="number"
                                                dataKey="y"
                                                name="Market traction"
                                                domain={[0, 100]}
                                                tick={{ fontFamily: "Inter", fontSize: 11 }}
                                                axisLine={{ stroke: "#0a0a0a" }}
                                                tickLine={false}
                                                label={{
                                                    value: "TRACTION ->",
                                                    angle: -90,
                                                    position: "insideLeft",
                                                    fontFamily: "Inter",
                                                    fontSize: 11,
                                                }}
                                            />
                                            <ZAxis range={[180, 180]} />
                                            <Tooltip
                                                cursor={{ strokeDasharray: "3 3" }}
                                                content={(props) => {
                                                    const point = props.payload?.[0]?.payload;
                                                    const label = point?.name
                                                        ? `${point.name}${point.you ? " (you)" : ""}`
                                                        : props.label;
                                                    return (
                                                        <DashboardChartTooltip
                                                            active={props.active}
                                                            payload={props.payload}
                                                            label={label}
                                                            valueFormatter={(v, p) =>
                                                                p?.dataKey === "x"
                                                                    ? `Autonomy ${v}`
                                                                    : p?.dataKey === "y"
                                                                      ? `Traction ${v}`
                                                                      : String(v)
                                                            }
                                                        />
                                                    );
                                                }}
                                            />
                                            <Scatter data={competitorScatter}>
                                                {competitorScatter.map((p, i) => (
                                                    <Cell
                                                        key={`${p.name}-${i}`}
                                                        fill={p.you ? "#7dd3fc" : "#0a0a0a"}
                                                        stroke="#0a0a0a"
                                                        strokeWidth={p.you ? 3 : 1}
                                                    />
                                                ))}
                                                <LabelList 
                                                    dataKey="name" 
                                                    position="top"
                                                    fill="#fff"
                                                    fontSize={11}
                                                    fontWeight="600"
                                                    offset={8}
                                                    formatter={(value) => value}
                                                />
                                            </Scatter>
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </ChartMount>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2 font-mono text-[10px]">
                                {competitorScatter.map((p) => (
                                    <div
                                        key={p.name}
                                        className={p.you ? "bg-[var(--hi)] px-2 py-1 text-black" : "bg-black px-2 py-1 text-white"}
                                    >
                                        {p.you ? "YOU" : p.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-6">
                        <div className="border-2 border-black bg-white shadow-brutal">
                            <div className="grid grid-cols-12 border-b-2 border-black bg-black px-4 py-3 font-mono text-[10px] tracking-wider text-white">
                                <div className="col-span-4">COMPETITOR</div>
                                <div className="col-span-3">FOCUS</div>
                                <div className="col-span-2">PRICE</div>
                                <div className="col-span-3 text-right">TRACTION</div>
                            </div>
                            {competitors.length === 0 ? (
                                <div className="px-4 py-8 text-sm leading-relaxed text-neutral-700">
                                    <div className="font-black text-black">Competitive table unavailable</div>
                                    <p className="mt-2 max-w-xl">
                                        The dossier names market pressure, but does not provide enough structured rival detail
                                        to compare focus, pricing, and traction side by side.
                                    </p>
                                </div>
                            ) : (
                                competitors.map((c, i) => (
                                    <div
                                        key={c.name}
                                        data-testid={`competitor-row-${i}`}
                                        className="group grid grid-cols-12 items-center gap-2 border-b border-black/10 px-4 py-4 transition-colors hover:bg-[var(--hi)]/30"
                                    >
                                        <div className="col-span-4">
                                            <div className="font-display text-base">{c.name}</div>
                                            <div className="font-mono text-[10px] text-neutral-500">{c.url || "-"}</div>
                                        </div>
                                        <div className="col-span-3 font-mono text-xs">{c.focus}</div>
                                        <div className="col-span-2 font-mono text-xs">{c.price}</div>
                                        <div className="col-span-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="h-1.5 w-16 bg-black/10">
                                                    <div className="h-full bg-black" style={{ width: `${c.traction}%` }} />
                                                </div>
                                                <span className="font-mono text-xs">{c.traction}</span>
                                            </div>
                                        </div>
                                        <div className="col-span-12 mt-1 font-mono text-[11px] text-neutral-500">
                                            <span className="text-[var(--c-red)]">GAP </span>
                                            {c.weakness}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div className="grid grid-cols-12 items-center gap-2 bg-black px-4 py-4 text-white">
                                <div className="col-span-4">
                                    <div className="font-display text-base text-[var(--hi)]">YOUR IDEA</div>
                                    <div className="font-mono text-[10px] text-white/60 line-clamp-2">{yourIdeaStrapline}</div>
                                </div>
                                <div className="col-span-3 font-mono text-xs line-clamp-2">{idea.title.slice(0, 80)}</div>
                                <div className="col-span-2 font-mono text-xs">-</div>
                                <div className="col-span-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="h-1.5 w-16 bg-white/15">
                                            <div className="h-full bg-[var(--hi)]" style={{ width: `${yourTractionScore}%` }} />
                                        </div>
                                        <span className="font-mono text-xs">{yourTractionScore}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
