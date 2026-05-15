import { Zap, Swords } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NAV_ITEMS = [
    { id: "overview", label: "OVERVIEW" },
    { id: "market", label: "MARKET" },
    { id: "risk", label: "RISK" },
    { id: "competition", label: "COMPETITION" },
    { id: "revenue", label: "REVENUE" },
    { id: "personas", label: "PERSONAS" },
];

export default function Navbar({ onSelect, active }) {
    const navigate = useNavigate();
    return (
        <header
            data-testid="dashboard-navbar"
            className="sticky top-0 z-50 w-full border-b border-black bg-[var(--paper)]/95 backdrop-blur"
        >
            <div className="mx-auto flex max-w-[1480px] items-center justify-between px-6 py-4 lg:px-10">
                <button
                    type="button"
                    data-testid="brand-logo"
                    onClick={() => onSelect && onSelect("overview")}
                    className="flex items-center gap-3"
                >
                    <div className="flex h-10 w-10 items-center justify-center border border-black bg-black text-white font-mono text-sm font-bold">
                        ID
                    </div>
                    <div className="text-left">
                        <div className="font-display text-lg leading-none tracking-tight">IDEA DEBATER</div>
                        <div className="font-mono text-[10px] text-neutral-500">V.1.0 / 2026</div>
                    </div>
                </button>

                <nav className="hidden items-center gap-9 font-mono text-xs tracking-wider md:flex">
                    {NAV_ITEMS.map((n) => (
                        <button
                            key={n.id}
                            type="button"
                            data-testid={`nav-${n.id}`}
                            onClick={() => onSelect && onSelect(n.id)}
                            className={`relative transition-colors hover:text-black/50 ${
                                active === n.id ? "text-black" : "text-black/70"
                            }`}
                        >
                            {n.label}
                            {active === n.id && (
                                <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-[var(--hi-deep)]" />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    <button
                        data-testid="enter-debate-button"
                        onClick={() => navigate("/debate")}
                        className="hidden items-center gap-2 border border-black bg-white px-4 py-2 font-mono text-xs tracking-wider shadow-brutal-sm hover-lift sm:flex"
                    >
                        <Swords className="h-3.5 w-3.5" />
                        DEBATE MODE
                    </button>
                    <button
                        data-testid="rerun-validation-button"
                        className="flex items-center gap-2 border border-black bg-black px-4 py-2 font-mono text-xs tracking-wider text-white shadow-brutal-sm transition hover:shadow-[8px_8px_0_0_#7dd3fc]"
                    >
                        <Zap className="h-3.5 w-3.5" />
                        RE-RUN VALIDATION
                    </button>
                </div>
            </div>
        </header>
    );
}
