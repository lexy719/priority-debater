import { Check, Circle, Loader2 } from "lucide-react";

export default function PanelRoster({ personas, statuses, current, shields, onJump }) {
    return (
        <aside data-testid="panel-roster" className="border-2 border-black bg-white">
            <div className="border-b-2 border-black bg-black px-5 py-3">
                <div className="font-mono text-[10px] tracking-wider text-white/50">THE PANEL</div>
                <div className="mt-1 flex items-center justify-between">
                    <span className="font-display text-lg text-white">5 / 5 ONLINE</span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-[var(--c-green)]">
                        <span className="inline-block h-1.5 w-1.5 animate-pulse bg-[var(--c-green)]" />
                        LIVE
                    </span>
                </div>
            </div>

            <ul>
                {personas.map((p, i) => {
                    const status = statuses[p.id]; // waiting | active | done
                    const isActive = status === "active";
                    const isDone = status === "done";
                    const shield = shields[p.id] ?? 0;
                    return (
                        <li key={p.id}>
                            <button
                                type="button"
                                data-testid={`roster-${p.id}`}
                                onClick={() => isDone && onJump && onJump(i)}
                                className={`relative flex w-full items-stretch gap-3 border-b border-black/10 px-4 py-4 text-left transition-colors ${
                                    isActive ? "bg-[var(--hi-soft)]" : "bg-white hover:bg-black/[0.02]"
                                }`}
                            >
                                {/* color slash */}
                                <span
                                    className="absolute right-0 top-0 h-full w-1.5"
                                    style={{ background: p.accent }}
                                />
                                {/* avatar tile */}
                                <div
                                    className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-black font-display text-lg"
                                    style={{ background: isActive ? p.accent : "#fff", color: isActive ? "#fff" : "#000" }}
                                >
                                    {p.avatar}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate font-display text-base">{p.name}</span>
                                        {isDone ? (
                                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--c-green)]">
                                                <Check className="h-3 w-3" /> DONE
                                            </span>
                                        ) : isActive ? (
                                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-black">
                                                <Loader2 className="h-3 w-3 animate-spin" /> ACTIVE
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-neutral-400">
                                                <Circle className="h-3 w-3" /> QUEUED
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-0.5 font-mono text-[10px] tracking-wider text-neutral-500">
                                        {p.role}
                                    </div>
                                    {/* shield bar */}
                                    <div className="mt-3 flex items-center gap-1">
                                        {[1, 2, 3].map((n) => (
                                            <span
                                                key={n}
                                                className={`h-1.5 w-6 ${
                                                    n <= shield ? "bg-black" : "bg-black/10"
                                                }`}
                                            />
                                        ))}
                                        <span className="ml-2 font-mono text-[10px] text-neutral-500">
                                            {isDone ? `${shield}/3 SHIELDS` : "—"}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        </li>
                    );
                })}
            </ul>

            <div className="border-t-2 border-black bg-black px-5 py-3">
                <div className="font-mono text-[10px] tracking-wider text-white/50">
                    TAP A DONE PANELLIST TO REVIEW THEIR ROUND.
                </div>
            </div>
        </aside>
    );
}
