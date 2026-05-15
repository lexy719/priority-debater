import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppNavbar from "@/components/AppNavbar";
import PanelRoster from "@/components/debate/PanelRoster";
import DebateStage from "@/components/debate/DebateStage";
import DebateVerdict from "@/components/debate/DebateVerdict";
import TickerTape from "@/components/dashboard/TickerTape";
import {
    debateIdea,
    debatePersonas,
    debateRounds,
} from "@/data/debateData";
import { RotateCcw, Swords } from "lucide-react";

const initialState = () =>
    debatePersonas.reduce(
        (acc, p) => {
            acc.picks[p.id] = null;
            acc.shields[p.id] = 0;
            acc.responses[p.id] = "";
            acc.reactions[p.id] = null;
            return acc;
        },
        { picks: {}, shields: {}, responses: {}, reactions: {} }
    );

export default function Debate() {
    const navigate = useNavigate();
    const [turn, setTurn] = useState(0);
    const [state, setState] = useState(initialState);
    const [finished, setFinished] = useState(false);

    const total = debateRounds.length;
    const currentRound = useMemo(
        () => ({ ...debateRounds[turn], turnNo: `${turn + 1} / ${total}` }),
        [turn, total]
    );
    const currentPersona = useMemo(
        () => debatePersonas.find((p) => p.id === currentRound?.personaId),
        [currentRound]
    );

    const statuses = debatePersonas.reduce((acc, p, i) => {
        if (finished) acc[p.id] = "done";
        else if (i < turn) acc[p.id] = "done";
        else if (i === turn) acc[p.id] = "active";
        else acc[p.id] = "waiting";
        return acc;
    }, {});

    const totalShields = Object.values(state.shields).reduce((a, b) => a + b, 0);
    const maxShields = total * 3;
    const tierPct = Math.round((totalShields / maxShields) * 100);

    const handleSubmit = (responseText, strength, opt) => {
        setState((prev) => ({
            picks: { ...prev.picks, [currentPersona.id]: 0 },
            shields: { ...prev.shields, [currentPersona.id]: strength },
            responses: { ...prev.responses, [currentPersona.id]: responseText },
            reactions: { ...prev.reactions, [currentPersona.id]: opt },
        }));
    };

    const handleContinue = () => {
        if (turn + 1 >= total) {
            setFinished(true);
        } else {
            setTurn(turn + 1);
        }
    };

    const handleRestart = () => {
        setTurn(0);
        setState(initialState());
        setFinished(false);
    };

    // For the verdict component compatibility, derive picks (option idx)
    const verdictPicks = useMemo(() => {
        const out = {};
        debatePersonas.forEach((p) => {
            const r = debateRounds.find((rr) => rr.personaId === p.id);
            const reaction = state.reactions[p.id];
            if (reaction) {
                out[p.id] = r.options.findIndex((o) => o.strength === reaction.strength);
            } else {
                out[p.id] = null;
            }
        });
        return out;
    }, [state.reactions]);

    return (
        <div data-testid="debate-page" className="min-h-screen bg-[var(--paper)] text-black">
            <AppNavbar
                rightSlot={
                    <>
                        <div className="hidden border border-black bg-[var(--hi)] px-3 py-1 font-mono text-[10px] tracking-wider text-black sm:block">
                            ◆ STRESS-TEST MODE / LIVE
                        </div>
                        <button
                            data-testid="restart-debate"
                            onClick={handleRestart}
                            className="flex items-center gap-2 border border-black bg-black px-4 py-2 font-mono text-xs tracking-wider text-white shadow-brutal-sm transition hover:shadow-[8px_8px_0_0_#7dd3fc]"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            RESTART
                        </button>
                    </>
                }
            />
            <TickerTape />

            {/* HERO STRIP — Editorial */}
            <section className="relative overflow-hidden border-b border-black bg-black text-white">
                <div className="absolute inset-0 bg-grid-dark opacity-60" />
                <div className="relative mx-auto max-w-[1480px] px-6 py-14 lg:px-10 lg:py-20">
                    {/* meta line */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] tracking-wider text-white/55">
                        <span className="text-white/90">§DEBATE / STRESS-TEST MODE</span>
                        <span>● 5 / 5 PANELLISTS ONLINE</span>
                        <span>● ROUND 01 / 01</span>
                        <span>● CLAUDE SONNET 4.5</span>
                    </div>

                    <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-end">
                        <div className="lg:col-span-8">
                            <div className="mb-4 inline-flex items-center gap-2 border border-[var(--hi)] bg-[var(--hi)] px-3 py-1 font-mono text-[10px] tracking-wider text-black">
                                <Swords className="h-3 w-3" />
                                DEFEND THIS IDEA · {total} TURNS
                            </div>
                            <h1 className="font-display text-[40px] leading-[0.92] sm:text-[58px] lg:text-[78px]">
                                "{debateIdea.title}"
                            </h1>
                            <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-white/55">
                                {debateIdea.one_liner} Each panellist will probe a different flaw.
                                Write your defence. Earn shields. Fail-proof the pitch.
                            </p>
                        </div>

                        <div className="lg:col-span-4">
                            {/* Live KPIs */}
                            <div className="grid grid-cols-3 gap-px border border-white/20 bg-white/10">
                                <div className="bg-black p-4">
                                    <div className="font-mono text-[10px] text-white/45">TURN</div>
                                    <div className="mt-2 font-display text-3xl">
                                        {String(finished ? total : turn + 1).padStart(2, "0")}
                                        <span className="text-white/30">/{String(total).padStart(2, "0")}</span>
                                    </div>
                                </div>
                                <div className="bg-black p-4">
                                    <div className="font-mono text-[10px] text-white/45">SHIELDS</div>
                                    <div className="mt-2 font-display text-3xl text-[var(--hi)]">
                                        {totalShields}
                                        <span className="text-white/30">/{maxShields}</span>
                                    </div>
                                </div>
                                <div className="bg-black p-4">
                                    <div className="font-mono text-[10px] text-white/45">DEFENDED</div>
                                    <div className="mt-2 font-display text-3xl">{tierPct}%</div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-4 border border-white/20 p-3">
                                <div className="mb-2 flex items-center justify-between font-mono text-[10px] tracking-wider text-white/45">
                                    <span>ROUND PROGRESS</span>
                                    <span>{String(finished ? total : turn).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {debateRounds.map((r, i) => {
                                        const isPast = i < turn || finished;
                                        const isCurrent = !finished && i === turn;
                                        const p = debatePersonas.find((pp) => pp.id === r.personaId);
                                        return (
                                            <div
                                                key={i}
                                                data-testid={`progress-${i}`}
                                                className="relative h-2 flex-1 transition-colors"
                                                style={{
                                                    background: isPast
                                                        ? p.accent
                                                        : isCurrent
                                                        ? "#fff"
                                                        : "rgba(255,255,255,0.15)",
                                                }}
                                                title={p.name}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* MAIN AREA */}
            <main className="mx-auto max-w-[1480px] px-6 py-10 lg:px-10 lg:py-14">
                {!finished ? (
                    <div className="grid gap-6 lg:grid-cols-12">
                        <div className="lg:col-span-8">
                            <DebateStage
                                key={currentPersona.id}
                                persona={currentPersona}
                                round={currentRound}
                                answer={state.responses[currentPersona.id] || null}
                                onSubmit={handleSubmit}
                                onContinue={handleContinue}
                            />

                            {/* Previous turns transcript strip */}
                            {turn > 0 && (
                                <div className="mt-6 border-2 border-black bg-white">
                                    <div className="flex items-center justify-between border-b-2 border-black bg-black px-5 py-2.5">
                                        <div className="font-mono text-[10px] tracking-wider text-white/55">
                                            ◆ DEBATE TRANSCRIPT · {turn} TURN{turn > 1 ? "S" : ""} COMPLETE
                                        </div>
                                        <div className="font-mono text-[10px] tracking-wider text-white/40">
                                            CLICK A CARD TO REVIEW
                                        </div>
                                    </div>
                                    <div className="grid divide-y divide-black/10">
                                        {debateRounds.slice(0, turn).map((r, i) => {
                                            const p = debatePersonas.find((pp) => pp.id === r.personaId);
                                            const reaction = state.reactions[p.id];
                                            const response = state.responses[p.id];
                                            return (
                                                <div
                                                    key={p.id}
                                                    data-testid={`transcript-row-${p.id}`}
                                                    className="grid grid-cols-12 gap-4 px-5 py-4"
                                                >
                                                    <div className="col-span-12 sm:col-span-3">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="flex h-8 w-8 items-center justify-center border-2 border-black font-display text-xs text-white"
                                                                style={{ background: p.accent }}
                                                            >
                                                                {p.avatar}
                                                            </span>
                                                            <div>
                                                                <div className="font-display text-sm">{p.name}</div>
                                                                <div className="font-mono text-[10px] text-neutral-500">
                                                                    TURN {String(i + 1).padStart(2, "0")}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-12 sm:col-span-7">
                                                        <div className="font-mono text-[10px] tracking-wider text-neutral-500">
                                                            YOU SAID
                                                        </div>
                                                        <div className="mt-1 line-clamp-2 font-mono text-xs leading-relaxed">
                                                            "{response}"
                                                        </div>
                                                    </div>
                                                    <div className="col-span-12 flex items-center justify-end gap-1 sm:col-span-2">
                                                        {[1, 2, 3].map((n) => (
                                                            <span
                                                                key={n}
                                                                className={`h-2 w-5 ${
                                                                    n <= (reaction?.strength || 0)
                                                                        ? "bg-black"
                                                                        : "bg-black/10"
                                                                }`}
                                                            />
                                                        ))}
                                                        <span className="ml-1 font-mono text-[10px] text-neutral-500">
                                                            {reaction?.strength || 0}/3
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-4">
                            <PanelRoster
                                personas={debatePersonas}
                                statuses={statuses}
                                current={currentPersona.id}
                                shields={state.shields}
                                onJump={() => {}}
                            />
                        </div>
                    </div>
                ) : (
                    <DebateVerdict
                        shields={state.shields}
                        picks={verdictPicks}
                        onRestart={handleRestart}
                        onExit={() => navigate("/")}
                    />
                )}
            </main>

            <TickerTape dark />
        </div>
    );
}
