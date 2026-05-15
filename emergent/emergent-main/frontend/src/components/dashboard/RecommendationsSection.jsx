import { recommendations } from "@/data/mockData";
import { ArrowRight } from "lucide-react";

const priColor = (p) =>
    p === "P0" ? "var(--c-red)" : p === "P1" ? "var(--c-orange)" : "var(--hi)";

export default function RecommendationsSection() {
    return (
        <section
            id="recommendations"
            data-testid="recommendations-section"
            className="relative border-b border-black bg-black text-white"
        >
            <div className="absolute inset-0 bg-grid-dark opacity-60" />
            <div className="relative mx-auto max-w-[1480px] px-6 py-20 lg:px-10">
                <div className="mb-12 grid gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <div className="font-mono text-[10px] tracking-wider text-white/50">§09 / RECOMMENDATIONS</div>
                        <h2 className="mt-3 font-display text-[48px] leading-[0.92] sm:text-[64px] lg:text-[80px]">
                            DO THESE <br />
                            <span className="bg-[var(--hi)] px-1 text-black">FIVE THINGS</span> <br />
                            BEFORE SEED.
                        </h2>
                    </div>
                    <div className="lg:col-span-5 lg:pt-6">
                        <p className="font-mono text-sm leading-relaxed text-white/60">
                            Ranked by impact-to-effort. Acting on the P0 list lifts your
                            viability index from 82 → 92 within 90 days. Track the score
                            in your dashboard.
                        </p>
                    </div>
                </div>

                <div className="border border-white/30">
                    {recommendations.map((r, i) => (
                        <div
                            key={i}
                            data-testid={`recommendation-${i}`}
                            className="group grid grid-cols-12 items-start gap-4 border-b border-white/15 px-6 py-7 transition-colors last:border-b-0 hover:bg-white/5"
                        >
                            <div className="col-span-12 sm:col-span-1">
                                <div className="font-display text-3xl text-white/30">
                                    {String(i + 1).padStart(2, "0")}
                                </div>
                            </div>
                            <div className="col-span-12 sm:col-span-2">
                                <span
                                    className="inline-block border px-2 py-0.5 font-mono text-[10px] tracking-wider"
                                    style={{ color: priColor(r.priority), borderColor: priColor(r.priority) }}
                                >
                                    ● {r.priority}
                                </span>
                                <div className="mt-2 font-mono text-[10px] text-white/40">{r.horizon}</div>
                            </div>
                            <div className="col-span-12 sm:col-span-7">
                                <div className="font-display text-xl leading-tight sm:text-2xl">{r.title}</div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {r.tags.map((t) => (
                                        <span key={t} className="border border-white/30 px-2 py-0.5 font-mono text-[10px] text-white/70">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="col-span-12 sm:col-span-2 text-right">
                                <div className="font-mono text-[10px] text-white/40">EXPECTED IMPACT</div>
                                <div className="mt-1 font-mono text-sm text-[var(--hi)]">{r.impact}</div>
                                <button
                                    data-testid={`apply-recommendation-${i}`}
                                    className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] text-white/70 hover:text-[var(--hi)]"
                                >
                                    APPLY <ArrowRight className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
