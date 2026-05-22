"use client";

/**
 * DebateStage.jsx — dynamic chat edition
 * ─────────────────────────────────────────────────────────────────────────
 * Chat-redesigned debate stage that:
 *   • Renders the panellist challenge (already idea-derived by the parent).
 *   • Captures the user's typed defence in a bottom composer (Enter to send).
 *   • POSTs to /api/debate/evaluate to score the defence and produce
 *     a persona-voice reaction, the remaining flaw, and a fail-proof fix.
 *   • Caches each evaluation in localStorage by hash(idea+personaId+defence)
 *     so refresh / back-nav doesn't re-bill the same evaluation.
 *   • Falls back to a synthetic local reaction if the API errors out.
 *
 * Props (parent contract — page.tsx):
 *   idea       string         The original validated idea
 *   persona    { id, name, role, lens, accent, avatar }
 *   round      { personaId, challenge, flaw }
 *   picked     null | 1       (null = waiting for user; non-null = answered)
 *   onPick     (strength) =>  parent updates shields[persona.id] = strength
 *   onContinue () =>          parent moves to next persona
 * ─────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from "react";
import {
    ArrowRight,
    Shield,
    AlertTriangle,
    Wrench,
    Send,
    User,
} from "lucide-react";

const EVAL_CACHE_KEY = "priority-debater-eval-cache-v1";

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

/* tiny hash for the cache key */
function hashStr(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
    return (h >>> 0).toString(36);
}

function readEvalCache(key) {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(EVAL_CACHE_KEY);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        return obj?.[key] ?? null;
    } catch { return null; }
}
function writeEvalCache(key, value) {
    if (typeof window === "undefined") return;
    try {
        const raw = localStorage.getItem(EVAL_CACHE_KEY);
        const obj = raw ? JSON.parse(raw) : {};
        obj[key] = value;
        localStorage.setItem(EVAL_CACHE_KEY, JSON.stringify(obj));
    } catch {}
}

export default function DebateStage({ idea, persona, round, onPick, onContinue, picked }) {
    /* phase: challenge → thinking → reaction */
    const [phase, setPhase] = useState("challenge");
    const [draft, setDraft] = useState("");
    const [userDefence, setUserDefence] = useState("");
    const [evaluation, setEvaluation] = useState(null);  // {strength, reactionQuote, flawCaught, fix}
    const [evalError, setEvalError] = useState("");

    const composerRef = useRef(null);
    const scrollRef = useRef(null);

    /* reset when persona/round changes */
    useEffect(() => {
        if (picked === null || picked === undefined) {
            setPhase("challenge");
            setDraft("");
            setUserDefence("");
            setEvaluation(null);
            setEvalError("");
        }
    }, [persona.id, picked]);

    /* auto-scroll on phase change */
    useEffect(() => {
        const el = scrollRef.current; if (!el) return;
        requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }));
    }, [phase, evaluation]);

    useEffect(() => { if (phase === "challenge") composerRef.current?.focus(); }, [phase, persona.id]);

    async function handleSend() {
        const text = draft.trim();
        if (!text || phase !== "challenge") return;

        setUserDefence(text);
        setDraft("");
        setPhase("thinking");
        setEvalError("");

        const cacheKey = hashStr(`${idea}::${persona.id}::${text}`);
        const cached = readEvalCache(cacheKey);
        if (cached) {
            // small UX delay so it feels like a real reaction
            setTimeout(() => {
                setEvaluation(cached);
                onPick(cached.strength);
                setPhase("reaction");
            }, 400);
            return;
        }

        try {
            const res = await fetch("/api/debate/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    idea,
                    persona: { id: persona.id, name: persona.name, role: persona.role, lens: persona.lens },
                    challenge: round.challenge,
                    flaw: round.flaw,
                    defence: text,
                }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j?.error || `HTTP ${res.status}`);
            }
            const data = await res.json();
            writeEvalCache(cacheKey, data);
            setEvaluation(data);
            onPick(data.strength);
            setPhase("reaction");
        } catch (e) {
            const fallback = {
                strength: 2,
                reactionQuote: `${persona.name.split(" ")[0]}: I'll take that for now — but the underlying flaw isn't gone. Bring me the next layer of evidence.`,
                flawCaught: round.flaw,
                fix: "Tighten the answer with a named source, a number, and a 30-day check that would prove the claim true.",
            };
            setEvalError(e?.message || "Evaluation failed — using fallback.");
            setEvaluation(fallback);
            onPick(fallback.strength);
            setPhase("reaction");
        }
    }

    const handleKey = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    return (
        <section
            data-testid={`debate-stage-${persona.id}`}
            className="relative flex flex-col border-2 border-black bg-white shadow-brutal"
        >
            {/* Persona header */}
            <header className="relative flex items-stretch border-b-2 border-black bg-black text-white">
                <div
                    className="flex h-24 w-24 shrink-0 items-center justify-center border-r-2 border-black font-display text-3xl"
                    style={{ background: persona.accent, color: "#fff" }}
                >
                    {persona.avatar}
                </div>
                <div className="flex flex-1 flex-col justify-center px-5 py-3">
                    <div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-wider text-white/80">
                        <span className="inline-block h-1.5 w-1.5 animate-pulse" style={{ background: persona.accent }} />
                        NOW SPEAKING · {persona.role}
                    </div>
                    <div className="mt-1 font-display text-2xl leading-tight sm:text-3xl">{persona.name}</div>
                    <div className="mt-1 font-mono text-[11px] leading-snug text-white/85">LENS · {persona.lens}</div>
                </div>
                <div className="hidden self-stretch border-l-2 border-black/40 bg-black px-4 py-3 text-right sm:block">
                    <div className="font-mono text-[10px] font-semibold tracking-wider text-white/75">FLAW PROBED</div>
                    <div className="mt-1 max-w-[220px] font-mono text-[11px] leading-relaxed text-white">{round.flaw}</div>
                </div>
            </header>

            {/* Chat thread */}
            <div
                ref={scrollRef}
                className="flex max-h-[560px] min-h-[360px] flex-col gap-5 overflow-y-auto bg-[var(--paper,#f4f3ef)] px-5 py-7 lg:px-9"
            >
                {/* challenge */}
                <ChatBubble side="left" accent={persona.accent} avatar={persona.avatar}
                            label={persona.name.toUpperCase()} sub={persona.role}>
                    <p className="font-display text-xl leading-snug sm:text-2xl">"{round.challenge}"</p>
                </ChatBubble>

                {userDefence && (
                    <ChatBubble side="right" accent="#0a0a0a" avatar={<User className="h-5 w-5" />}
                                label="YOU" sub="DEFENCE">
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-black">{userDefence}</p>
                    </ChatBubble>
                )}

                {phase === "thinking" && (
                    <ChatBubble side="left" accent={persona.accent} avatar={persona.avatar}
                                label={persona.name.toUpperCase()} sub="WEIGHING…">
                        <span className="inline-flex items-center gap-1">
                            <span className="h-2 w-2 animate-bounce bg-black [animation-delay:-0.3s]" />
                            <span className="h-2 w-2 animate-bounce bg-black [animation-delay:-0.15s]" />
                            <span className="h-2 w-2 animate-bounce bg-black" />
                        </span>
                    </ChatBubble>
                )}

                {phase === "reaction" && evaluation && (
                    <ChatBubble side="left" accent={persona.accent} avatar={persona.avatar}
                                label={persona.name.toUpperCase()} sub="REACTS">
                        <div className="space-y-4 text-black">
                            <div className="flex flex-wrap items-center gap-3 border-b border-black/15 pb-3 font-mono text-[11px] font-semibold tracking-wider">
                                <span className="text-neutral-700">SHIELD RATING</span>
                                <Stars n={evaluation.strength} />
                                <span className="border border-black bg-black px-2 py-0.5 text-[10px] font-semibold text-white">
                                    +{evaluation.strength} SHIELDS
                                </span>
                                {evalError && (
                                    <span className="ml-auto text-[10px] font-semibold text-[var(--c-red,#ff3b30)]">
                                        FALLBACK MODE
                                    </span>
                                )}
                            </div>

                            <blockquote className="border-l-2 pl-3 font-display text-lg leading-snug"
                                        style={{ borderColor: persona.accent }}>
                                "{evaluation.reactionQuote}"
                            </blockquote>

                            <div>
                                <div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-wider text-neutral-700">
                                    <AlertTriangle className="h-3.5 w-3.5 text-[var(--c-red,#ff3b30)]" />
                                    FLAW STILL OPEN
                                </div>
                                <p className="mt-2 font-display text-lg leading-snug">{evaluation.flawCaught}</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-wider text-neutral-700">
                                    <Wrench className="h-3.5 w-3.5 text-[var(--hi-deep,#38bdf8)]" />
                                    FAIL-PROOF FIX · 7 DAYS
                                </div>
                                <p className="mt-2 font-display text-lg leading-snug">{evaluation.fix}</p>
                            </div>

                            <button
                                type="button"
                                data-testid="continue-debate"
                                onClick={onContinue}
                                className="mt-2 inline-flex items-center gap-2 border-2 border-black bg-black px-5 py-3 font-mono text-xs font-semibold tracking-wider text-white transition hover:shadow-[6px_6px_0_0_#7dd3fc]"
                            >
                                NEXT PANELLIST
                                <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </ChatBubble>
                )}
            </div>

            {/* Composer */}
            {phase === "challenge" ? (
                <div className="border-t-2 border-black bg-white p-4 lg:p-5">
                    <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-semibold tracking-wider text-neutral-700">
                        <span>◆ TYPE YOUR DEFENCE</span>
                        <span className="text-neutral-500">ENTER TO SEND · SHIFT+ENTER FOR NEWLINE</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <textarea
                            ref={composerRef}
                            data-testid="defence-input"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value.slice(0, 1200))}
                            onKeyDown={handleKey}
                            rows={3}
                            placeholder={`Answer ${persona.name.split(" ")[0]}'s challenge in your own words…`}
                            className="min-h-[88px] flex-1 resize-none border-2 border-black bg-[var(--paper,#f4f3ef)] px-3 py-3 font-mono text-[13px] leading-relaxed text-black placeholder:text-neutral-500 focus:bg-white focus:outline-none"
                        />
                        <button
                            type="button"
                            data-testid="send-defence"
                            onClick={handleSend}
                            disabled={!draft.trim()}
                            className="inline-flex h-[88px] shrink-0 items-center gap-2 border-2 border-black bg-black px-5 font-mono text-xs font-semibold tracking-wider text-white transition hover:shadow-[6px_6px_0_0_#7dd3fc] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
                        >
                            SEND
                            <Send className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between font-mono text-[10px] tracking-wider text-neutral-500">
                        <span>{draft.length} / 1200</span>
                        <span>YOUR ANSWER SCORES 1-3 SHIELDS · EVIDENCE BEATS HAND-WAVE</span>
                    </div>
                </div>
            ) : (
                <div className="border-t-2 border-black bg-white px-5 py-3 font-mono text-[10px] font-semibold tracking-wider text-neutral-700">
                    DEFENCE LOCKED · {phase === "thinking" ? "PANELLIST IS WEIGHING…" : "PANELLIST HAS RESPONDED"}
                </div>
            )}
        </section>
    );
}

/* ── Chat bubble primitive ─────────────────────────────────────────────── */
function ChatBubble({ side, accent, avatar, label, sub, children }) {
    const isLeft = side === "left";
    return (
        <div data-testid={`chat-bubble-${side}`} className={`flex w-full gap-3 ${isLeft ? "" : "flex-row-reverse"}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black font-display text-sm text-white"
                 style={{ background: accent }}>
                {avatar}
            </div>
            <div className={`flex max-w-[88%] flex-col ${isLeft ? "items-start" : "items-end"}`}>
                <div className={`mb-1 font-mono text-[10px] font-semibold tracking-wider text-neutral-700 ${isLeft ? "" : "text-right"}`}>
                    {label}
                    {sub ? <span className="ml-2 text-neutral-500">· {sub}</span> : null}
                </div>
                <div className="border-2 border-black bg-white px-4 py-3 shadow-[4px_4px_0_0_#0a0a0a]">
                    {children}
                </div>
            </div>
        </div>
    );
}
