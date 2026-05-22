"use client";

import { useResultsDashboard } from "@/context/results-dashboard-context";

/**
 * Renders the rubric breakdown that produces the headline score.
 * Six weighted rows; bars are filled by `score`; the right-side number
 * is the row's CONTRIBUTION (score × weight ÷ 100). Sum of contributions
 * == the overall headline score shown in <ScoreHero/>. This is the
 * "show your work" panel that makes the page feel grounded.
 */
export default function ScoreMath() {
    const { overallScore, rubricBreakdown, live } = useResultsDashboard();
    if (!live || !rubricBreakdown || rubricBreakdown.length === 0) return null;

    return (
        <section
            data-testid="score-math-panel"
            className="border-b border-black bg-[var(--paper)] px-6 py-12 lg:px-10 lg:py-14"
        >
            <div className="mx-auto max-w-[1480px]">
                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Heading column */}
                    <div className="lg:col-span-4">
                        <div className="font-mono text-[10px] tracking-wider text-black/55">§S02 · SCORE MATH</div>
                        <h2 className="mt-3 font-display text-4xl leading-[1.35] tracking-tight lg:text-5xl">
                            How we got <span className="hl-strip">{overallScore.score}</span>
                            <span className="text-black/40"> / 100</span>.
                        </h2>
                        <p className="mt-5 max-w-xs font-mono text-[12px] leading-relaxed text-black/65">
                            Six weighted dimensions, scored against anchored rubrics. Headline = weighted sum.
                            Every number on this page is downstream of these six.
                        </p>
                        <div className="mt-5 border-2 border-black bg-black px-4 py-3 font-mono text-[10px] tracking-wider text-white">
                            <div className="flex items-center justify-between">
                                <span className="text-white/55">Σ CONTRIBUTIONS</span>
                                <span className="font-display text-2xl">
                                    {rubricBreakdown.reduce((s, r) => s + r.contribution, 0).toFixed(1)}
                                </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between">
                                <span className="text-white/55">Σ WEIGHTS</span>
                                <span>{rubricBreakdown.reduce((s, r) => s + r.weight, 0)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Rubric rows */}
                    <div className="lg:col-span-8">
                        <div className="border-2 border-black bg-white">
                            {rubricBreakdown.map((r, i) => (
                                <div
                                    key={r.key}
                                    data-testid={`rubric-row-${r.key}`}
                                    className={`grid grid-cols-12 items-center gap-3 px-4 py-4 sm:px-6 ${
                                        i < rubricBreakdown.length - 1 ? "border-b border-black/15" : ""
                                    }`}
                                >
                                    <div className="col-span-12 sm:col-span-5">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-mono text-[10px] tracking-wider text-black/40">
                                                {String(i + 1).padStart(2, "0")}
                                            </span>
                                            <span className="font-display text-base tracking-tight sm:text-lg">
                                                {r.label}
                                            </span>
                                            <span className="font-mono text-[10px] tracking-wider text-black/45">
                                                ×{r.weight}%
                                            </span>
                                        </div>
                                        <div className="mt-1 font-mono text-[11px] leading-relaxed text-black/60">
                                            {r.reason}
                                        </div>
                                    </div>

                                    {/* Bar + score */}
                                    <div className="col-span-9 sm:col-span-5">
                                        <div className="relative h-3 w-full border border-black bg-[var(--bone)]">
                                            <div
                                                className="absolute inset-y-0 left-0"
                                                style={{
                                                    width: `${r.score}%`,
                                                    background:
                                                        r.score >= 70
                                                            ? "var(--c-green)"
                                                            : r.score >= 45
                                                              ? "var(--hi)"
                                                              : "var(--c-red)",
                                                }}
                                            />
                                        </div>
                                        <div className="mt-1 flex items-center justify-between font-mono text-[10px] tracking-wider text-black/50">
                                            <span>0</span>
                                            <span className="font-mono text-[11px] tracking-wider text-black/80">
                                                {r.score} / 100
                                            </span>
                                            <span>100</span>
                                        </div>
                                    </div>

                                    {/* Contribution */}
                                    <div className="col-span-3 sm:col-span-2 text-right">
                                        <div className="font-mono text-[9px] tracking-wider text-black/45">
                                            CONTRIBUTES
                                        </div>
                                        <div className="font-display text-2xl tracking-tight">
                                            +{r.contribution.toFixed(1)}
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
