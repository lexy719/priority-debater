"use client";

import { useEffect, useState } from "react";
import { useResultsDashboard } from "@/context/results-dashboard-context";
import ChartMount from "@/components/dashboard/ChartMount";
import DashboardChartTooltip from "@/components/dashboard/DashboardChartTooltip";
import { ResponsiveContainer, LineChart, Line, YAxis, XAxis, Tooltip } from "recharts";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

/** Animated number counter — ramps from 0 to `target` in ~900ms, ease-out cubic. */
function useCountUp(target, durationMs = 900) {
    const [v, setV] = useState(0);
    useEffect(() => {
        let raf = 0;
        const start = performance.now();
        const from = 0;
        const tick = (t) => {
            const p = Math.min(1, (t - start) / durationMs);
            const eased = 1 - Math.pow(1 - p, 3);
            setV(Math.round(from + (target - from) * eased));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, durationMs]);
    return v;
}

export default function ScoreHero() {
    const { idea, overallScore, live, dashboardUi } = useResultsDashboard();
    const animatedScore = useCountUp(overallScore.score);
    const animatedConf = useCountUp(idea.confidencePct);

    const VerdictIcon =
        idea.verdict === "NO-GO" ? XCircle : idea.verdict === "CAUTION" ? AlertTriangle : CheckCircle2;
    const verdictColor =
        idea.verdict === "NO-GO" ? "var(--c-red)" : idea.verdict === "CAUTION" ? "var(--c-orange)" : "var(--c-green)";

    return (
        <section
            id="overview"
            data-testid="score-hero"
            className="relative overflow-hidden border-b border-black bg-black text-white"
        >
            <div className="absolute inset-0 bg-grid-dark opacity-60" />
            <div className="bg-noise" />

            <div className="relative mx-auto max-w-[1480px] px-6 py-16 lg:px-10 lg:py-24">
                <div className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] tracking-wider text-white/60">
                    <span className="text-white/90">§01 / VALIDATION REPORT</span>
                    <span>● SUBMITTED {idea.submittedAt}</span>
                    <span>● BY {idea.submittedBy.toUpperCase()}</span>
                    <span>● MODEL {idea.model.toUpperCase()}</span>
                    <span>● RUNTIME {idea.runtime}</span>
                    {live && <span className="border border-[var(--c-green)] px-2 py-0.5 text-[var(--c-green)]">● LIVE DOSSIER</span>}
                </div>

                <div className="grid gap-12 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <div className="mb-4 inline-flex items-center gap-2 border border-[var(--hi)] bg-[var(--hi)] px-3 py-1 font-mono text-[10px] tracking-wider text-black">
                            ◆ STRESS-TEST COMPLETE
                        </div>

                        <h1 className="font-display text-[42px] leading-[1.35] tracking-tight sm:text-[58px] lg:text-[76px]">
                            &ldquo;{idea.title}&rdquo;
                        </h1>

                        <p className="mt-8 max-w-xl font-mono text-sm leading-relaxed text-white/60">
                            {dashboardUi.scoreHeroBlurb}
                        </p>

                        <div className="mt-10 grid grid-cols-3 gap-px border border-white/20 bg-white/10">
                            <div className="bg-black p-5">
                                <div className="font-mono text-[10px] tracking-wider text-white/50">VERDICT</div>
                                <div className="mt-3 flex items-center gap-2">
                                    <VerdictIcon className="h-5 w-5" style={{ color: verdictColor }} />
                                    <span className="font-display text-3xl text-[var(--hi)]">{idea.verdict}</span>
                                </div>
                            </div>
                            <div className="bg-black p-5">
                                <div className="font-mono text-[10px] tracking-wider text-white/50">CONFIDENCE</div>
                                <div className="mt-3 font-display text-3xl">{idea.confidence}</div>
                                <div className="mt-2 h-1 w-full bg-white/15">
                                    <div
                                        className="h-full bg-white transition-[width] duration-700 ease-out"
                                        style={{ width: `${animatedConf}%` }}
                                    />
                                </div>
                            </div>
                            <div className="bg-black p-5">
                                <div className="font-mono text-[10px] tracking-wider text-white/50">RANK</div>
                                <div className="mt-3 font-display text-3xl">{overallScore.rank}</div>
                                <div className="mt-1 font-mono text-[10px] text-white/40">from rubric + headline</div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <div data-testid="overall-score-card" className="relative border border-white/40 bg-black p-8">
                            <div className="absolute -top-px left-6 bg-black px-2 font-mono text-[10px] tracking-wider text-white/60">
                                OVERALL VIABILITY SCORE
                            </div>

                            <div className="flex items-baseline gap-4">
                                <span
                                    data-testid="overall-score-value"
                                    className="font-display text-[180px] leading-none text-[var(--hi)] sm:text-[200px]"
                                >
                                    {animatedScore}
                                </span>
                                <span className="font-display text-3xl text-white/40">/ 100</span>
                            </div>

                            <div className="mt-2 flex items-center gap-2 font-mono text-xs text-[var(--c-green)]">
                                <span>
                                    {overallScore.score >= overallScore.benchmark ? "+" : ""}
                                    {overallScore.score - overallScore.benchmark} vs RUBRIC MEAN ({overallScore.benchmark})
                                </span>
                            </div>

                            <div className="mt-6 h-24 w-full">
                                <ChartMount>
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <LineChart data={overallScore.history} margin={{ top: 4, right: 12, bottom: 4, left: 4 }}>
                                        <defs>
                                            <linearGradient id="scoreLine" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#7dd3fc" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#7dd3fc" />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="v" hide />
                                        <YAxis hide domain={[35, 100]} />
                                        <Tooltip
                                            content={(props) => (
                                                <DashboardChartTooltip
                                                    active={props.active}
                                                    payload={props.payload}
                                                    label={props.label}
                                                    valueFormatter={(v) => `${Math.round(v)}/100`}
                                                />
                                            )}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="score"
                                            stroke="url(#scoreLine)"
                                            strokeWidth={3}
                                            dot={{ r: 3, fill: "#7dd3fc", stroke: "#000" }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                                </ChartMount>
                            </div>

                            <div className="mt-4 grid grid-cols-5 gap-1 font-mono text-[10px] text-white/40">
                                {overallScore.history.map((h) => (
                                    <span key={h.v} className="text-center">
                                        {h.v}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
