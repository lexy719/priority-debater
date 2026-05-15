import { Shield, RotateCcw, FileText } from "lucide-react";
import { verdictTiers, debateRounds, debatePersonas } from "@/data/debateData";

export default function DebateVerdict({ shields, picks, onRestart, onExit }) {
    const total = Object.values(shields).reduce((a, b) => a + b, 0);
    const max = 15;
    const pct = Math.round((total / max) * 100);
    const tier = verdictTiers.find((t) => total >= t.min);

    // gather flaws + fixes
    const insights = debateRounds.map((r) => {
        const p = debatePersonas.find((x) => x.id === r.personaId);
        const picked = picks[r.personaId];
        const opt = picked !== null && picked !== undefined ? r.options[picked] : null;
        return {
            persona: p,
            flaw: r.flaw,
            fix: opt?.fix,
            shield: shields[r.personaId] ?? 0,
        };
    });

    return (
        <section
            data-testid="debate-verdict"
            className="relative border-2 border-black bg-white shadow-brutal"
        >
            {/* Verdict header */}
            <header className="relative grid grid-cols-1 gap-px border-b-2 border-black bg-black text-white lg:grid-cols-3">
                <div className="bg-black p-7 lg:p-9">
                    <div className="font-mono text-[10px] tracking-wider text-white/50">
                        §FINAL / VERDICT
                    </div>
                    <div className="mt-3 font-display text-5xl leading-none lg:text-6xl" style={{ color: tier.color }}>
                        {tier.label}
                    </div>
                    <p className="mt-3 max-w-xs font-mono text-xs text-white/70">{tier.note}</p>
                </div>
                <div className="bg-black p-7 lg:p-9">
                    <div className="font-mono text-[10px] tracking-wider text-white/50">
                        FAIL-PROOF SCORE
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="font-display text-7xl text-[var(--hi)]">{total}</span>
                        <span className="font-mono text-sm text-white/40">/ {max}</span>
                    </div>
                    <div className="mt-4 h-1.5 w-full bg-white/10">
                        <div className="h-full bg-[var(--hi)]" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-2 font-mono text-[10px] text-white/40">{pct}% DEFENDED</div>
                </div>
                <div className="bg-black p-7 lg:p-9">
                    <div className="font-mono text-[10px] tracking-wider text-white/50">
                        PANELLIST SHIELDS
                    </div>
                    <ul className="mt-4 space-y-2 font-mono text-xs">
                        {debatePersonas.map((p) => (
                            <li key={p.id} className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <span className="inline-block h-2 w-2" style={{ background: p.accent }} />
                                    {p.name}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    {[1, 2, 3].map((n) => (
                                        <Shield
                                            key={n}
                                            className={`h-3 w-3 ${
                                                n <= (shields[p.id] || 0)
                                                    ? "fill-[var(--hi)] text-[var(--hi)]"
                                                    : "text-white/20"
                                            }`}
                                        />
                                    ))}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </header>

            {/* Insights */}
            <div className="grid gap-px bg-black/10">
                <div className="bg-white px-6 py-5 lg:px-10">
                    <div className="font-mono text-[10px] tracking-wider text-neutral-500">
                        ◆ FAIL-PROOFING CHECKLIST · {insights.length} ACTIONS
                    </div>
                    <h3 className="mt-2 font-display text-3xl leading-tight">
                        Apply these to harden the pitch.
                    </h3>
                </div>
                {insights.map((it, i) => (
                    <div key={it.persona.id} className="grid grid-cols-12 gap-4 bg-white px-6 py-5 lg:px-10">
                        <div className="col-span-12 sm:col-span-1">
                            <div className="font-display text-3xl text-black/20">
                                {String(i + 1).padStart(2, "0")}
                            </div>
                        </div>
                        <div className="col-span-12 sm:col-span-3">
                            <div className="flex items-center gap-2">
                                <span
                                    className="flex h-8 w-8 items-center justify-center border-2 border-black font-display text-xs"
                                    style={{ background: it.persona.accent, color: "#fff" }}
                                >
                                    {it.persona.avatar}
                                </span>
                                <div>
                                    <div className="font-display text-sm">{it.persona.name}</div>
                                    <div className="font-mono text-[10px] text-neutral-500">{it.persona.role}</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-12 sm:col-span-5">
                            <div className="font-mono text-[10px] tracking-wider text-neutral-500">FIX</div>
                            <div className="mt-1 font-display text-base leading-tight">{it.fix}</div>
                        </div>
                        <div className="col-span-12 sm:col-span-3">
                            <div className="font-mono text-[10px] tracking-wider text-neutral-500">CAUGHT</div>
                            <div className="mt-1 font-mono text-[11px] leading-relaxed text-neutral-700">{it.flaw}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer actions */}
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-black bg-[var(--paper)] px-6 py-5 lg:px-10">
                <div className="font-mono text-[10px] tracking-wider text-neutral-500">
                    EXPORT THIS CHECKLIST TO YOUR DECK PREP DOC ↗
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        data-testid="export-checklist"
                        className="inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 font-mono text-xs tracking-wider shadow-brutal-sm hover-lift"
                    >
                        <FileText className="h-3.5 w-3.5" />
                        EXPORT CHECKLIST
                    </button>
                    <button
                        type="button"
                        data-testid="restart-debate-verdict"
                        onClick={onRestart}
                        className="inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 font-mono text-xs tracking-wider shadow-brutal-sm hover-lift"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        RUN ANOTHER ROUND
                    </button>
                    <button
                        type="button"
                        data-testid="back-to-report-verdict"
                        onClick={onExit}
                        className="inline-flex items-center gap-2 border-2 border-black bg-black px-4 py-2 font-mono text-xs tracking-wider text-white shadow-brutal-sm transition hover:shadow-[8px_8px_0_0_#7dd3fc]"
                    >
                        BACK TO REPORT →
                    </button>
                </div>
            </footer>
        </section>
    );
}
