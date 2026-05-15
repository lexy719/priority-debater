import { competitors, competitorScatter } from "@/data/mockData";
import {
    ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
    Tooltip, Cell, ZAxis,
} from "recharts";

export default function CompetitionSection() {
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
                        <div className="font-mono text-[10px] tracking-wider text-neutral-500">§05 / COMPETITION</div>
                        <h2 className="mt-3 font-display text-[48px] leading-[0.92] sm:text-[64px] lg:text-[80px]">
                            FIVE NAMED. <br />
                            <span className="hl-strip-dark">YOU SIT TOP-RIGHT.</span>
                        </h2>
                    </div>
                    <div className="lg:col-span-5 lg:pt-6">
                        <p className="font-mono text-sm leading-relaxed text-neutral-600">
                            3–5 named competitors with their angle and exploitable gap. The
                            quadrant below positions each on autonomy maturity vs market
                            traction. <span className="bg-[var(--hi)] px-1 text-black">YOU</span> sit at the upper-right — high autonomy, high traction.
                        </p>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Scatter quadrant */}
                    <div className="lg:col-span-6">
                        <div className="relative border-2 border-black bg-white p-6 shadow-brutal">
                            <div className="font-mono text-[10px] tracking-wider text-neutral-500">
                                POSITIONING QUADRANT
                            </div>
                            <div className="mt-1 font-display text-2xl">AUTONOMY × TRACTION</div>
                            <div className="mt-4 h-[360px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 16, right: 16, bottom: 16, left: 0 }}>
                                        <CartesianGrid stroke="#0a0a0a" strokeOpacity={0.08} />
                                        <XAxis
                                            type="number"
                                            dataKey="x"
                                            name="Autonomy maturity"
                                            domain={[0, 100]}
                                            tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }}
                                            axisLine={{ stroke: "#0a0a0a" }}
                                            tickLine={false}
                                            label={{ value: "AUTONOMY →", position: "insideBottom", offset: -6, fontFamily: "JetBrains Mono", fontSize: 10 }}
                                        />
                                        <YAxis
                                            type="number"
                                            dataKey="y"
                                            name="Market traction"
                                            domain={[0, 100]}
                                            tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }}
                                            axisLine={{ stroke: "#0a0a0a" }}
                                            tickLine={false}
                                            label={{ value: "TRACTION →", angle: -90, position: "insideLeft", fontFamily: "JetBrains Mono", fontSize: 10 }}
                                        />
                                        <ZAxis range={[180, 180]} />
                                        <Tooltip
                                            cursor={{ strokeDasharray: "3 3" }}
                                            contentStyle={{
                                                background: "#0a0a0a",
                                                color: "#fff",
                                                border: "none",
                                                fontFamily: "JetBrains Mono",
                                                fontSize: 11,
                                                borderRadius: 0,
                                            }}
                                            formatter={(value, name, item) => [`${value}`, name]}
                                            labelFormatter={() => ""}
                                        />
                                        <Scatter data={competitorScatter}>
                                            {competitorScatter.map((p, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={p.you ? "#7dd3fc" : "#0a0a0a"}
                                                    stroke="#0a0a0a"
                                                    strokeWidth={p.you ? 3 : 1}
                                                />
                                            ))}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-4 font-mono text-[10px] text-neutral-500">
                                {competitorScatter.map((p) => (
                                    <span key={p.name} className={p.you ? "bg-[var(--hi)] px-1 text-black" : ""}>
                                        ◆ {p.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Comparison table */}
                    <div className="lg:col-span-6">
                        <div className="border-2 border-black bg-white shadow-brutal">
                            <div className="grid grid-cols-12 border-b-2 border-black bg-black px-4 py-3 font-mono text-[10px] tracking-wider text-white">
                                <div className="col-span-4">COMPETITOR</div>
                                <div className="col-span-3">FOCUS</div>
                                <div className="col-span-2">PRICE</div>
                                <div className="col-span-3 text-right">TRACTION</div>
                            </div>
                            {competitors.map((c, i) => (
                                <div
                                    key={c.name}
                                    data-testid={`competitor-row-${i}`}
                                    className="group grid grid-cols-12 items-center gap-2 border-b border-black/10 px-4 py-4 transition-colors hover:bg-[var(--hi)]/30"
                                >
                                    <div className="col-span-4">
                                        <div className="font-display text-base">{c.name}</div>
                                        <div className="font-mono text-[10px] text-neutral-500">{c.url}</div>
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
                                        <span className="text-[var(--c-red)]">▸ GAP </span>{c.weakness}
                                    </div>
                                </div>
                            ))}
                            <div className="grid grid-cols-12 items-center gap-2 bg-black px-4 py-4 text-white">
                                <div className="col-span-4">
                                    <div className="font-display text-base text-[var(--hi)]">YOUR IDEA</div>
                                    <div className="font-mono text-[10px] text-white/60">positioned</div>
                                </div>
                                <div className="col-span-3 font-mono text-xs">Vertical stack</div>
                                <div className="col-span-2 font-mono text-xs">€€</div>
                                <div className="col-span-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="h-1.5 w-16 bg-white/15">
                                            <div className="h-full bg-[var(--hi)]" style={{ width: `88%` }} />
                                        </div>
                                        <span className="font-mono text-xs">88</span>
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
