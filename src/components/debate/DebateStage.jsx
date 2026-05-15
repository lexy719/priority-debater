import { useEffect, useState } from "react";
import { ArrowRight, Quote, Shield, AlertTriangle, Wrench } from "lucide-react";

const Stars = ({ n }) => (
    <span data-testid="shield-stars" className="inline-flex items-center gap-0.5">
        {[1, 2, 3].map((i) => (
            <Shield
                key={i}
                className={`h-4 w-4 ${i <= n ? "fill-black text-black" : "text-black/15"}`}
            />
        ))}
    </span>
);

export default function DebateStage({ persona, round, onPick, onContinue, picked }) {
    const [phase, setPhase] = useState("challenge"); // challenge | thinking | reaction
    const [typing, setTyping] = useState(false);

    // Reset phase when persona changes
    useEffect(() => {
        if (picked === null) {
            setPhase("challenge");
            setTyping(false);
        }
    }, [persona.id, picked]);

    const handlePick = (idx) => {
        setPhase("thinking");
        setTyping(true);
        // simulate panellist thinking
        setTimeout(() => {
            setTyping(false);
            setPhase("reaction");
            onPick(idx);
        }, 1100);
    };

    const option = picked !== null ? round.options[picked] : null;

    return (
        <section
            data-testid={`debate-stage-${persona.id}`}
            className="relative border-2 border-black bg-white shadow-brutal"
        >
            {/* Top strip — persona on stage */}
            <header className="relative flex items-stretch border-b-2 border-black bg-black text-white">
                <div
                    className="flex h-24 w-24 shrink-0 items-center justify-center border-r-2 border-black font-display text-3xl"
                    style={{ background: persona.accent, color: "#fff" }}
                >
                    {persona.avatar}
                </div>
                <div className="flex flex-1 flex-col justify-center px-5 py-3">
                    <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-white/50">
                        <span className="inline-block h-1.5 w-1.5 animate-pulse" style={{ background: persona.accent }} />
                        NOW SPEAKING · {persona.role}
                    </div>
                    <div className="mt-1 font-display text-2xl leading-tight sm:text-3xl">
                        {persona.name}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-white/55">
                        LENS · {persona.lens}
                    </div>
                </div>
                <div className="hidden self-stretch border-l-2 border-black/40 bg-black px-4 py-3 text-right sm:block">
                    <div className="font-mono text-[10px] tracking-wider text-white/50">FLAW PROBED</div>
                    <div className="mt-1 max-w-[220px] font-mono text-[11px] leading-relaxed text-white">
                        {round.flaw}
                    </div>
                </div>
            </header>

            {/* Challenge */}
            <div className="border-b border-black/10 px-6 py-7 lg:px-10 lg:py-10">
                <div className="flex items-start gap-3">
                    <Quote className="mt-1 h-5 w-5 text-black/30" />
                    <p data-testid="challenge-text" className="font-display text-2xl leading-snug sm:text-3xl">
                        "{round.challenge}"
                    </p>
                </div>
            </div>

            {/* Response area */}
            {phase === "challenge" && (
                <div className="px-6 py-7 lg:px-10 lg:py-9">
                    <div className="mb-5 flex items-center justify-between font-mono text-[10px] tracking-wider text-neutral-500">
                        <span>◆ PICK YOUR DEFENCE · 3 OPTIONS</span>
                        <span>STRENGTH IS REVEALED AFTER YOUR PICK</span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {round.options.map((o, i) => (
                            <button
                                key={i}
                                type="button"
                                data-testid={`response-option-${persona.id}-${i}`}
                                onClick={() => handlePick(i)}
                                className="group flex h-full flex-col items-start border-2 border-black bg-[var(--paper)] p-5 text-left transition hover:-translate-y-1 hover:bg-[var(--hi-soft)] hover:shadow-[6px_6px_0_0_#0a0a0a]"
                            >
                                <span className="font-mono text-[10px] tracking-wider text-neutral-500">
                                    OPTION {String.fromCharCode(65 + i)}
                                </span>
                                <span className="mt-3 font-display text-lg leading-tight">
                                    "{o.text}"
                                </span>
                                <span className="mt-auto pt-4 font-mono text-[11px] text-neutral-500 group-hover:text-black">
                                    PICK THIS → 
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {phase === "thinking" && (
                <div className="px-6 py-12 lg:px-10">
                    <div className="flex items-center gap-3 font-mono text-xs tracking-wider text-neutral-500">
                        <span className="inline-flex items-center gap-1">
                            <span className="h-2 w-2 animate-bounce bg-black [animation-delay:-0.3s]" />
                            <span className="h-2 w-2 animate-bounce bg-black [animation-delay:-0.15s]" />
                            <span className="h-2 w-2 animate-bounce bg-black" />
                        </span>
                        {persona.name.toUpperCase()} IS WEIGHING YOUR ANSWER...
                    </div>
                </div>
            )}

            {phase === "reaction" && option && (
                <div className="space-y-0">
                    {/* Reaction header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-y-2 border-black bg-[var(--hi-soft)] px-6 py-4 lg:px-10">
                        <div className="font-mono text-[10px] tracking-wider text-black">
                            ◆ {persona.name.toUpperCase()} REACTS
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[11px] tracking-wider">
                            <span>SHIELD RATING</span>
                            <Stars n={option.strength} />
                            <span className="border border-black bg-black px-2 py-0.5 font-mono text-[10px] text-white">
                                +{option.strength} SHIELDS
                            </span>
                        </div>
                    </div>

                    {/* Reaction body */}
                    <div className="grid gap-0 lg:grid-cols-2">
                        <div className="border-b border-black/10 px-6 py-7 lg:border-b-0 lg:border-r lg:px-10">
                            <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-neutral-500">
                                <AlertTriangle className="h-3.5 w-3.5 text-[var(--c-red)]" />
                                FLAW CAUGHT
                            </div>
                            <p className="mt-3 font-display text-lg leading-snug">
                                {round.flaw}
                            </p>
                            <div className="mt-5 border-l-2 border-black pl-4 font-mono text-[12.5px] leading-relaxed text-neutral-700">
                                "{option.reaction}"
                            </div>
                        </div>
                        <div className="px-6 py-7 lg:px-10">
                            <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-neutral-500">
                                <Wrench className="h-3.5 w-3.5 text-[var(--hi-deep)]" />
                                FAIL-PROOF FIX
                            </div>
                            <p className="mt-3 font-display text-lg leading-snug">
                                {option.fix}
                            </p>
                            <button
                                type="button"
                                data-testid="continue-debate"
                                onClick={onContinue}
                                className="mt-7 inline-flex items-center gap-2 border-2 border-black bg-black px-5 py-3 font-mono text-xs tracking-wider text-white shadow-brutal-sm transition hover:shadow-[8px_8px_0_0_#7dd3fc]"
                            >
                                NEXT PANELLIST
                                <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
