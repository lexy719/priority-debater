import { revenueProjection, pricingModels } from "@/data/mockData";
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

export default function RevenueSection() {
    return (
        <section
            id="revenue"
            data-testid="revenue-section"
            className="relative border-b border-black bg-[var(--bone)] py-20"
        >
            <div className="relative mx-auto max-w-[1480px] px-6 lg:px-10">
                <div className="mb-12 grid gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <div className="font-mono text-[10px] tracking-wider text-neutral-500">§06 / REVENUE</div>
                        <h2 className="mt-3 font-display text-[48px] leading-[0.92] sm:text-[64px] lg:text-[80px]">
                            <span className="hl-strip">€42M</span> ARR <br />
                            BY YEAR 5.
                        </h2>
                    </div>
                    <div className="lg:col-span-5 lg:pt-6">
                        <p className="font-mono text-sm leading-relaxed text-neutral-600">
                            Modelled bottom-up against named anchor contracts.
                            Hardware-led in Y1–Y2, software (fleet SaaS) margin compounds
                            into the dominant revenue line by Y5.
                        </p>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Bar chart */}
                    <div className="lg:col-span-8">
                        <div className="relative border-2 border-black bg-white p-6 shadow-brutal">
                            <div className="mb-4 flex items-end justify-between">
                                <div>
                                    <div className="font-mono text-[10px] tracking-wider text-neutral-500">
                                        5-YEAR REVENUE PROJECTION
                                    </div>
                                    <div className="mt-1 font-display text-2xl">€ MILLIONS</div>
                                </div>
                                <div className="font-mono text-xs">
                                    Y1 → Y5 <span className="bg-black px-2 py-0.5 text-white">28× GROWTH</span>
                                </div>
                            </div>
                            <div className="h-[340px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueProjection} margin={{ top: 16, right: 12, bottom: 0, left: 0 }}>
                                        <CartesianGrid stroke="#0a0a0a" strokeOpacity={0.08} vertical={false} />
                                        <XAxis dataKey="year" tick={{ fontFamily: "JetBrains Mono", fontSize: 11 }} axisLine={{ stroke: "#0a0a0a" }} tickLine={false} />
                                        <YAxis tick={{ fontFamily: "JetBrains Mono", fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                background: "#0a0a0a", color: "#fff", border: "none",
                                                fontFamily: "JetBrains Mono", fontSize: 11, borderRadius: 0,
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 11 }} iconType="square" />
                                        <Bar dataKey="hardware" name="Hardware €M" stackId="a" fill="#0a0a0a" />
                                        <Bar dataKey="subs" name="SaaS €M" stackId="a" fill="#7dd3fc" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Pricing plans */}
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
                                                ★ ANCHOR
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
