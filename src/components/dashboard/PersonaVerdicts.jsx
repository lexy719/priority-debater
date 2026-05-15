"use client";

import Link from "next/link";
import { useResultsDashboard } from "@/context/results-dashboard-context";
import { MessageSquareQuote } from "lucide-react";

export default function PersonaVerdicts() {
    const { personaVerdicts, panelAggregateVerdict, panelConsensusScore, dashboardUi } = useResultsDashboard();
    const total = personaVerdicts.reduce((a, p) => a + p.score, 0) || 1;

    return (
        <section
            id="personas"
            data-testid="persona-verdicts-section"
            className="relative border-b border-black bg-[var(--paper)] py-20"
        >
            <div className="relative mx-auto max-w-[1480px] px-6 lg:px-10">
                <div className="mb-12 grid gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <div className="font-mono text-[10px] tracking-wider text-neutral-500">{dashboardUi.personas.eyebrow}</div>
                        <h2 className="mt-3 font-display text-[48px] leading-[0.92] sm:text-[64px] lg:text-[80px]">
                            FIVE VOICES. <br />
                            <span className="hl-strip">ONE VERDICT.</span>
                        </h2>
                    </div>
                    <div className="lg:col-span-5 lg:pt-6">
                        <p className="font-mono text-sm leading-relaxed text-neutral-600">
                            Persona verdicts summarize how each buyer archetype would react: stance, confidence, and the
                            strongest objection or pull signal.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                    {personaVerdicts.length === 0 ? (
                        <div className="col-span-full border-2 border-black bg-white p-8 text-sm leading-relaxed text-neutral-700">
                            Buyer verdicts are unavailable because the dossier does not contain enough persona-level evidence.
                            The panel view stays empty rather than inventing five buyer voices.
                        </div>
                    ) : (
                        personaVerdicts.map((p, i) => {
                            const isCond = p.verdict.startsWith("CONDITIONAL");
                            return (
                                <div
                                    key={`${p.name}-${i}`}
                                    data-testid={`persona-verdict-${i}`}
                                    className="group relative flex h-full flex-col border-2 border-black bg-white p-5 hover-lift"
                                >
                                    <div className="absolute right-0 top-0 h-full w-1.5" style={{ background: p.accent }} />
                                    <div className="font-mono text-[10px] tracking-wider text-neutral-500">
                                        PANELLIST {String(i + 1).padStart(2, "0")} / 05
                                    </div>
                                    <div className="mt-4 font-display text-xl leading-tight">{p.name}</div>
                                    <div className="mt-1 font-mono text-[10px] tracking-wider text-neutral-500">{p.role}</div>

                                    <div className="mt-5">
                                        <span
                                            className={`inline-block border px-2 py-0.5 font-mono text-[10px] tracking-wider ${
                                                isCond ? "bg-white" : "bg-black text-white"
                                            }`}
                                            style={{ borderColor: p.accent }}
                                        >
                                            {p.verdict}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex items-baseline gap-1">
                                        <span className="font-display text-5xl">{p.score}</span>
                                        <span className="font-mono text-[10px] text-neutral-500">/ 100</span>
                                    </div>

                                    <div className="mt-4 border-t border-black/10 pt-4">
                                        <MessageSquareQuote className="h-3.5 w-3.5 text-neutral-400" />
                                        <p className="mt-2 font-mono text-[11px] leading-relaxed text-neutral-700">
                                            &ldquo;{p.quote}&rdquo;
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="mt-10 grid grid-cols-12 items-center gap-4 border-2 border-black bg-black p-6 text-white shadow-brutal">
                    <div className="col-span-12 lg:col-span-3">
                        <div className="font-mono text-[10px] tracking-wider text-white/50">PANEL AGGREGATE</div>
                        <div className="mt-2 font-display text-4xl text-[var(--hi)]">{panelAggregateVerdict}</div>
                    </div>
                    <div className="col-span-12 lg:col-span-6">
                        {personaVerdicts.length === 0 ? (
                            <p className="font-mono text-xs text-white/50">No persona distribution available yet.</p>
                        ) : (
                            <>
                                <div className="flex h-3 w-full overflow-hidden">
                                    {personaVerdicts.map((p) => (
                                        <div
                                            key={p.name}
                                            style={{
                                                background: p.accent,
                                                width: `${(p.score / total) * 100}%`,
                                            }}
                                            title={`${p.name}: ${p.score}`}
                                        />
                                    ))}
                                </div>
                                <div className="mt-2 flex justify-between font-mono text-[10px] text-white/60">
                                    <span>0</span>
                                    <span>MEAN SCORE: {panelConsensusScore} / 100</span>
                                    <span>100</span>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="col-span-12 lg:col-span-3 lg:text-right">
                        <Link
                            href="/results/debate"
                            data-testid="open-debate-panel"
                            className="inline-flex items-center border border-white bg-white px-4 py-2 font-mono text-xs tracking-wider text-black shadow-brutal-inv transition hover:bg-[var(--hi)]"
                        >
                            OPEN FULL DEBATE TRANSCRIPT
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
