import { audienceSegments, personas } from "@/data/mockData";
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
} from "recharts";

export default function AudienceSection() {
    return (
        <section
            id="audience"
            data-testid="audience-section"
            className="relative border-b border-black bg-black text-white"
        >
            <div className="absolute inset-0 bg-grid-dark opacity-60" />
            <div className="relative mx-auto max-w-[1480px] px-6 py-20 lg:px-10">
                <div className="mb-12 grid gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <div className="font-mono text-[10px] tracking-wider text-white/50">§07 / AUDIENCE</div>
                        <h2 className="mt-3 font-display text-[48px] leading-[0.92] sm:text-[64px] lg:text-[80px]">
                            WHO PAYS <br />
                            <span className="bg-[var(--hi)] px-1 text-black">AND WHY.</span>
                        </h2>
                    </div>
                    <div className="lg:col-span-5 lg:pt-6">
                        <p className="font-mono text-sm leading-relaxed text-white/60">
                            Four segments, three named buyer personas. B2B logistics is the
                            wedge — highest budget concentration and clearest pain.
                        </p>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Pie / segments */}
                    <div className="lg:col-span-5">
                        <div className="border border-white/30 bg-black/40 p-6">
                            <div className="font-mono text-[10px] tracking-wider text-white/50">
                                SEGMENT MIX (% REVENUE)
                            </div>
                            <div className="mt-4 h-[260px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={audienceSegments}
                                            dataKey="value"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            stroke="#000"
                                            strokeWidth={2}
                                        >
                                            {audienceSegments.map((s, i) => (
                                                <Cell key={i} fill={s.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                background: "#fff", color: "#000", border: "1px solid #000",
                                                fontFamily: "JetBrains Mono", fontSize: 11, borderRadius: 0,
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 space-y-2">
                                {audienceSegments.map((s) => (
                                    <div key={s.name} className="flex items-center justify-between font-mono text-xs">
                                        <span className="flex items-center gap-2">
                                            <span className="inline-block h-3 w-3" style={{ background: s.color }} />
                                            {s.name}
                                        </span>
                                        <span className="text-white/60">{s.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Personas */}
                    <div className="lg:col-span-7">
                        <div className="font-mono text-[10px] tracking-wider text-white/50">
                            BUYER PERSONAS · 3 NAMED
                        </div>
                        <div className="mt-4 space-y-4">
                            {personas.map((p, i) => (
                                <div
                                    key={i}
                                    data-testid={`persona-card-${i}`}
                                    className="group grid grid-cols-12 gap-4 border border-white/30 bg-black/40 p-5 transition-colors hover:border-[var(--hi)]"
                                >
                                    <div className="col-span-12 sm:col-span-4">
                                        <div className="font-display text-xl leading-tight">{p.title}</div>
                                        <div className="mt-1 font-mono text-[11px] text-white/55">{p.org}</div>
                                    </div>
                                    <div className="col-span-6 sm:col-span-2">
                                        <div className="font-mono text-[10px] text-white/40">BUDGET</div>
                                        <div className="mt-1 font-mono text-sm text-[var(--hi)]">{p.budget}</div>
                                    </div>
                                    <div className="col-span-12 sm:col-span-3">
                                        <div className="font-mono text-[10px] text-white/40">PAIN</div>
                                        <div className="mt-1 font-mono text-xs">{p.pain}</div>
                                    </div>
                                    <div className="col-span-12 sm:col-span-3">
                                        <div className="font-mono text-[10px] text-white/40">WHY THEM</div>
                                        <div className="mt-1 font-mono text-xs">{p.why}</div>
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
