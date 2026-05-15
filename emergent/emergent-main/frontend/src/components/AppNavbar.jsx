import { Zap, Swords } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const ROUTES = [
    { to: "/", label: "REPORT", match: ["/", "/results"] },
    { to: "/debate", label: "DEBATE", match: ["/debate"] },
    { to: "/brand", label: "BRAND", match: ["/brand"] },
    { to: "/landing", label: "LANDING", match: ["/landing"] },
    { to: "/deck", label: "DECK", match: ["/deck"] },
];

export default function AppNavbar({ rightSlot }) {
    const navigate = useNavigate();
    const location = useLocation();
    const path = location.pathname;
    const isDebate = path === "/debate";

    return (
        <header
            data-testid="app-navbar"
            className="sticky top-0 z-50 w-full border-b border-black bg-[var(--paper)]/95 backdrop-blur"
        >
            <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-6 py-4 lg:px-10">
                <button
                    type="button"
                    data-testid="brand-logo"
                    onClick={() => navigate("/")}
                    className="flex items-center gap-3"
                >
                    <div className="flex h-10 w-10 items-center justify-center border border-black bg-black text-white font-mono text-sm font-bold">
                        ID
                    </div>
                    <div className="text-left">
                        <div className="font-display text-lg leading-none tracking-tight">IDEA DEBATER</div>
                        <div className="font-mono text-[10px] text-neutral-500">
                            V.1.0 / 2026{isDebate ? " · DEBATE MODE" : " · FOUNDER STUDIO"}
                        </div>
                    </div>
                </button>

                <nav className="hidden items-center gap-7 font-mono text-xs tracking-wider md:flex">
                    {ROUTES.map((r) => {
                        const active = r.match.includes(path);
                        return (
                            <button
                                key={r.to}
                                type="button"
                                data-testid={`nav-${r.label.toLowerCase()}`}
                                onClick={() => navigate(r.to)}
                                className={`relative transition-colors hover:text-black ${
                                    active ? "text-black" : "text-black/55"
                                }`}
                            >
                                {r.label}
                                {active && (
                                    <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-[var(--hi-deep)]" />
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-3">
                    {rightSlot ? (
                        rightSlot
                    ) : (
                        <>
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
                                onClick={() => navigate("/")}
                                className="flex items-center gap-2 border border-black bg-black px-4 py-2 font-mono text-xs tracking-wider text-white shadow-brutal-sm transition hover:shadow-[8px_8px_0_0_#7dd3fc]"
                            >
                                <Zap className="h-3.5 w-3.5" />
                                RE-RUN VALIDATION
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
