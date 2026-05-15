import { useEffect, useState } from "react";
import {
    ArrowRight, Quote, Shield, AlertTriangle, Wrench,
    Send, Lightbulb,
} from "lucide-react";

// Heuristic: evaluate the user's free-form response and select a strength tier.
// We map their answer to one of the mock options (3 strength levels).
const heuristicEvaluate = (text, options) => {
    const t = (text || "").trim();
    if (t.length < 15) {
        return { opt: options.find((o) => o.strength === 1), reasons: ["TOO SHORT — under 15 characters."] };
    }
    const reasons = [];
    let score = 1;
    if (t.length >= 60) { score += 1; reasons.push("LENGTH — detailed answer."); }
    if (/\d/.test(t)) { score += 1; reasons.push("NUMBERS — cited a metric."); }
    const keywords = /\b(loi|signed|partner|sla|contract|pipeline|metric|drop|km|kilo|battery|fleet|tele[\s-]?op|autonomy|cost|margin|capex|opex|runway|seed|tier|q[1-4]|month|year|cagr|tam|sam|som|%|€|\$|roi|cac|ltv)\b/i;
    const matches = (t.match(new RegExp(keywords, "gi")) || []).length;
    if (matches >= 2) { score += 1; reasons.push(`SPECIFICITY — ${matches} domain terms.`); }
    if (matches >= 4) { score += 1; reasons.push("HIGH DENSITY — operator vocabulary."); }
    const clamped = Math.min(3, Math.max(1, Math.round(score / 1.6)));
    return { opt: options.find((o) => o.strength === clamped), reasons };
};

const Stars = ({ n }) => (
    <span data-testid="shield-stars" className="inline-flex items-center gap-0.5">
        {[1, 2, 3].map((i) => (
            <Shield
                key={i}
                className={`h-4 w-4 transition ${
                    i <= n ? "fill-[var(--hi-deep)] text-[var(--hi-deep)]" : "text-black/15"
                }`}
            />
        ))}
    </span>
);

const HINTS = [
    "Cite a specific number or metric.",
    "Name a partner, contract or LOI.",
    "Anchor your claim in a date or quarter.",
    "Show a unit-economic — €/drop, €/month, %.",
];

export default function DebateStage({ persona, round, onSubmit, onContinue, answer }) {
    const [phase, setPhase] = useState("challenge"); // challenge | thinking | reaction
    const [text, setText] = useState("");
    const [evaluation, setEvaluation] = useState(null);

    // Reset on persona change
    useEffect(() => {
        if (answer === null || answer === undefined) {
            setPhase("challenge");
            setText("");
            setEvaluation(null);
        }
    }, [persona.id, answer]);

    const handleSubmit = () => {
        if (text.trim().length < 5) return;
        setPhase("thinking");
        // Simulate panellist weighing the answer
        setTimeout(() => {
            const result = heuristicEvaluate(text, round.options);
            setEvaluation(result);
            setPhase("reaction");
            onSubmit(text, result.opt.strength, result.opt);
        }, 1400);
    };

    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const opt = evaluation?.opt;

    return (
        <section
            data-testid={`debate-stage-${persona.id}`}
            className="relative overflow-hidden border-2 border-black bg-white shadow-brutal"
        >
            {/* PERSONA REVEAL HEADER */}
            <header className="relative grid grid-cols-12 border-b-2 border-black bg-black text-white">
                {/* color slab */}
                <div
                    className="col-span-12 flex items-end justify-between p-6 sm:col-span-4 sm:p-7"
                    style={{ background: persona.accent }}
                >
                    <div>
                        <div className="font-mono text-[10px] tracking-wider text-black/75">
                            ON STAGE · TURN {round.turnNo || ""}
                        </div>
                        <div className="mt-3 font-display text-7xl leading-none text-black">
                            {persona.avatar}
                        </div>
                    </div>
                    <div className="self-end font-mono text-[10px] tracking-wider text-black/75">
                        LIVE ◆
                    </div>
                </div>
                <div className="col-span-12 flex flex-col justify-center gap-3 p-6 sm:col-span-8 sm:p-7">
                    <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-white/55">
                        <span
                            className="inline-block h-1.5 w-1.5 animate-pulse"
                            style={{ background: persona.accent }}
                        />
                        NOW SPEAKING
                    </div>
                    <div className="font-display text-3xl leading-none sm:text-4xl">
                        {persona.name}
                    </div>
                    <div className="font-mono text-[11px] tracking-wider text-white/70">
                        {persona.role}
                    </div>
                    <div className="mt-2 border-t border-white/15 pt-3">
                        <div className="font-mono text-[10px] tracking-wider text-white/50">LENS</div>
                        <div className="mt-1 font-mono text-[12px] leading-relaxed text-white/85">
                            {persona.lens}
                        </div>
                    </div>
                </div>
            </header>

            {/* CHALLENGE QUOTE */}
            <div className="relative border-b border-black/10 px-6 py-8 lg:px-12 lg:py-12">
                <Quote className="absolute left-4 top-6 h-6 w-6 text-black/15 lg:left-8" />
                <div className="pl-8 lg:pl-10">
                    <div className="font-mono text-[10px] tracking-wider text-neutral-500">
                        ◆ CHALLENGE · {persona.name.toUpperCase()}
                    </div>
                    <p
                        data-testid="challenge-text"
                        className="mt-3 font-display text-[28px] leading-[1.05] sm:text-[36px] lg:text-[44px]"
                    >
                        {round.challenge}
                    </p>
                </div>
            </div>

            {/* CHAT INPUT */}
            {phase === "challenge" && (
                <div className="px-6 py-7 lg:px-12 lg:py-10">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] tracking-wider text-neutral-500">
                        <span>◆ FIRE BACK · DEFEND YOUR IDEA</span>
                        <span>
                            {wordCount} {wordCount === 1 ? "WORD" : "WORDS"} ·{" "}
                            {text.trim().length} CHARS
                        </span>
                    </div>

                    <div className="relative">
                        <textarea
                            data-testid="debate-response-input"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={`Write your answer. Be specific — ${persona.name.split(" ")[0]} can smell vague.`}
                            rows={5}
                            className="block w-full resize-none border-2 border-black bg-[var(--paper)] px-5 py-4 font-mono text-[13.5px] leading-relaxed text-black placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-0"
                        />
                        <div className="absolute bottom-3 right-3 font-mono text-[10px] tracking-wider text-neutral-400">
                            ENTER ↵ SHIFT FOR NEW LINE
                        </div>
                    </div>

                    {/* hint chips */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-wider text-neutral-500">
                            <Lightbulb className="h-3 w-3" /> HINTS
                        </span>
                        {HINTS.map((h, i) => (
                            <span
                                key={i}
                                className="border border-black/20 bg-white px-2 py-1 font-mono text-[10px] text-neutral-700"
                            >
                                {h}
                            </span>
                        ))}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                        <div className="font-mono text-[11px] tracking-wider text-neutral-500">
                            ANSWERS WITH NUMBERS + NAMED CONTRACTS SCORE HIGHER.
                        </div>
                        <button
                            type="button"
                            data-testid="fire-back-button"
                            onClick={handleSubmit}
                            disabled={text.trim().length < 5}
                            className="group inline-flex items-center gap-2 border-2 border-black bg-black px-6 py-3 font-mono text-xs tracking-wider text-white shadow-brutal-sm transition enabled:hover:shadow-[8px_8px_0_0_#7dd3fc] disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            FIRE BACK
                            <Send className="h-3.5 w-3.5 transition-transform group-enabled:group-hover:translate-x-0.5" />
                        </button>
                    </div>
                </div>
            )}

            {phase === "thinking" && (
                <div className="px-6 py-12 lg:px-12">
                    {/* user bubble */}
                    <div className="mb-6 flex justify-end">
                        <div className="relative max-w-[80%] border-2 border-black bg-[var(--paper)] px-5 py-3">
                            <div className="absolute -top-3 right-3 border border-black bg-black px-2 py-0.5 font-mono text-[9px] tracking-wider text-white">
                                YOU
                            </div>
                            <p className="font-mono text-[12.5px] leading-relaxed">{text}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 border-2 border-dashed border-black/30 px-5 py-4">
                        <span className="inline-flex items-center gap-1">
                            <span className="h-2 w-2 animate-bounce bg-black [animation-delay:-0.3s]" />
                            <span className="h-2 w-2 animate-bounce bg-black [animation-delay:-0.15s]" />
                            <span className="h-2 w-2 animate-bounce bg-black" />
                        </span>
                        <span className="font-mono text-[11px] tracking-wider text-neutral-600">
                            {persona.name.toUpperCase()} IS WEIGHING YOUR ANSWER...
                        </span>
                    </div>
                </div>
            )}

            {phase === "reaction" && opt && (
                <div className="space-y-0">
                    {/* user bubble */}
                    <div className="border-b border-black/10 px-6 py-6 lg:px-12">
                        <div className="flex justify-end">
                            <div className="relative max-w-[80%] border-2 border-black bg-[var(--paper)] px-5 py-3">
                                <div className="absolute -top-3 right-3 border border-black bg-black px-2 py-0.5 font-mono text-[9px] tracking-wider text-white">
                                    YOU
                                </div>
                                <p className="font-mono text-[12.5px] leading-relaxed">{text}</p>
                            </div>
                        </div>
                    </div>

                    {/* persona bubble + shield meter */}
                    <div className="border-b border-black/10 bg-[var(--hi-soft)] px-6 py-6 lg:px-12">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <div
                                    className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-black font-display text-xl"
                                    style={{ background: persona.accent, color: "#fff" }}
                                >
                                    {persona.avatar}
                                </div>
                                <div className="max-w-[640px]">
                                    <div className="font-mono text-[10px] tracking-wider text-black/55">
                                        {persona.name.toUpperCase()} REACTS
                                    </div>
                                    <p className="mt-2 font-display text-xl leading-snug sm:text-2xl">
                                        "{opt.reaction}"
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="font-mono text-[10px] tracking-wider text-black/55">
                                    SHIELD AWARDED
                                </span>
                                <div className="flex items-center gap-2">
                                    <Stars n={opt.strength} />
                                    <span className="border border-black bg-black px-2 py-0.5 font-mono text-[10px] tracking-wider text-white">
                                        +{opt.strength}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* heuristic reasons */}
                        {evaluation?.reasons?.length > 0 && (
                            <div className="mt-5 flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[10px] tracking-wider text-black/55">
                                    WHY
                                </span>
                                {evaluation.reasons.map((r, i) => (
                                    <span
                                        key={i}
                                        className="border border-black/30 bg-white px-2 py-0.5 font-mono text-[9.5px] tracking-wider text-black"
                                    >
                                        {r}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* flaw + fix */}
                    <div className="grid gap-0 lg:grid-cols-2">
                        <div className="border-b border-black/10 px-6 py-7 lg:border-b-0 lg:border-r lg:px-12">
                            <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-neutral-500">
                                <AlertTriangle className="h-3.5 w-3.5 text-[var(--c-red)]" />
                                FLAW {persona.name.split(" ")[0].toUpperCase()} PROBED
                            </div>
                            <p className="mt-3 font-display text-lg leading-snug">
                                {round.flaw}
                            </p>
                        </div>
                        <div className="px-6 py-7 lg:px-12">
                            <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-neutral-500">
                                <Wrench className="h-3.5 w-3.5 text-[var(--hi-deep)]" />
                                FAIL-PROOF FIX
                            </div>
                            <p className="mt-3 font-display text-lg leading-snug">
                                {opt.fix}
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
