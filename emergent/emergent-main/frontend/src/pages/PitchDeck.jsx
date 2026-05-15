import { useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import TickerTape from "@/components/dashboard/TickerTape";
import Footer from "@/components/dashboard/Footer";
import { deck, project } from "@/data/studioData";
import { ChevronLeft, ChevronRight, Download, Play, Maximize2 } from "lucide-react";

function Slide({ s, theme }) {
    const isDark = theme === "ink";
    const bg = isDark ? "#0a0a0a" : "#f4f3ef";
    const fg = isDark ? "#fff" : "#0a0a0a";
    const sub = isDark ? "#ffffff80" : "#0a0a0a80";

    return (
        <div
            data-testid={`slide-${s.no}`}
            className="relative grid h-full w-full grid-cols-12 gap-6 border-2 border-black p-8 sm:p-12 lg:p-16"
            style={{ background: bg, color: fg }}
        >
            {/* Slide meta */}
            <div className="col-span-12 flex items-center justify-between border-b border-current/15 pb-4">
                <div className="font-mono text-[11px] tracking-wider" style={{ color: sub }}>
                    §{s.no} / {s.kicker}
                </div>
                <div className="font-mono text-[11px] tracking-wider" style={{ color: sub }}>
                    {project.code} · SEED DECK · 02-2026
                </div>
            </div>

            {/* Content */}
            <div className="col-span-12 mt-8 grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-8">
                    <h2 className="font-display text-[44px] leading-[0.92] sm:text-[64px] lg:text-[88px]">
                        {s.title.split(" ").map((w, i, arr) =>
                            i === arr.length - 1 ? (
                                <span key={i} style={{ background: "#7dd3fc", color: "#0a0a0a", padding: "0 0.05em" }}>
                                    {w}
                                </span>
                            ) : (
                                <span key={i}>{w} </span>
                            )
                        )}
                    </h2>
                    <p className="mt-8 max-w-2xl font-mono text-sm leading-relaxed" style={{ color: sub }}>
                        {s.body}
                    </p>
                </div>
                <div className="col-span-12 lg:col-span-4">
                    <div className="border-2 p-6" style={{ borderColor: fg }}>
                        <div className="font-mono text-[10px] tracking-wider" style={{ color: sub }}>
                            HEADLINE METRIC
                        </div>
                        <div className="mt-3 font-display text-6xl leading-none" style={{ color: "#7dd3fc" }}>
                            {s.stat.v}
                        </div>
                        <div className="mt-2 font-mono text-[10px] tracking-wider" style={{ color: sub }}>
                            {s.stat.l}
                        </div>
                    </div>
                </div>
            </div>

            {/* Slide footer / page no */}
            <div className="col-span-12 mt-auto flex items-end justify-between pt-6">
                <div className="font-mono text-[10px] tracking-wider" style={{ color: sub }}>
                    HELENA VOSS · FOUNDER · helena@cargobyte.eu
                </div>
                <div className="font-display text-2xl" style={{ color: sub }}>
                    {s.no} / 10
                </div>
            </div>
        </div>
    );
}

export default function PitchDeck() {
    const [idx, setIdx] = useState(0);
    const [theme, setTheme] = useState("paper");
    const slide = deck[idx];

    const go = (delta) => {
        setIdx((prev) => Math.max(0, Math.min(deck.length - 1, prev + delta)));
    };

    return (
        <div data-testid="pitch-deck-page" className="min-h-screen bg-[var(--paper)] text-black">
            <AppNavbar />
            <TickerTape />

            {/* HEADER */}
            <section className="border-b border-black bg-black py-12 text-white">
                <div className="mx-auto max-w-[1480px] px-6 lg:px-10">
                    <div className="grid gap-8 lg:grid-cols-12">
                        <div className="lg:col-span-8">
                            <div className="font-mono text-[10px] tracking-wider text-white/50">§C / PITCH DECK BUILDER</div>
                            <h1 className="mt-3 font-display text-[52px] leading-[0.9] sm:text-[72px] lg:text-[88px]">
                                10 SLIDES. <br />
                                <span className="bg-[var(--hi)] px-1 text-black">ZERO FILLER.</span>
                            </h1>
                        </div>
                        <div className="lg:col-span-4 lg:self-end">
                            <p className="max-w-md font-mono text-sm leading-relaxed text-white/65">
                                Auto-generated investor-grade deck. Headline metric on every slide.
                                Branded with your kit. Export to PDF or Keynote.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <button
                                    data-testid="export-deck"
                                    className="inline-flex items-center gap-2 border-2 border-white bg-white px-4 py-2 font-mono text-xs tracking-wider text-black shadow-brutal-inv transition hover:bg-[var(--hi)]"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    EXPORT PDF
                                </button>
                                <button
                                    data-testid="present-deck"
                                    className="inline-flex items-center gap-2 border-2 border-white bg-transparent px-4 py-2 font-mono text-xs tracking-wider text-white transition hover:bg-white hover:text-black"
                                >
                                    <Play className="h-3.5 w-3.5" />
                                    PRESENT
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PRESENTER */}
            <section className="border-b border-black bg-[var(--paper)] py-10">
                <div className="mx-auto max-w-[1480px] px-6 lg:px-10">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-b-0 border-black bg-black px-4 py-2 text-white">
                        <div className="flex items-center gap-3 font-mono text-[11px] tracking-wider">
                            <span className="font-display text-2xl text-[var(--hi)]">{slide.no}</span>
                            <span className="text-white/40">/</span>
                            <span>{slide.kicker}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex border border-white/30">
                                <button
                                    data-testid="theme-paper"
                                    onClick={() => setTheme("paper")}
                                    className={`px-3 py-1 font-mono text-[10px] tracking-wider ${theme === "paper" ? "bg-white text-black" : "text-white/60"}`}
                                >
                                    PAPER
                                </button>
                                <button
                                    data-testid="theme-ink"
                                    onClick={() => setTheme("ink")}
                                    className={`px-3 py-1 font-mono text-[10px] tracking-wider ${theme === "ink" ? "bg-white text-black" : "text-white/60"}`}
                                >
                                    INK
                                </button>
                            </div>
                            <button className="border border-white/30 px-2 py-1.5 text-white/60 hover:text-white">
                                <Maximize2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Slide canvas */}
                    <div className="relative border-2 border-black bg-black/5">
                        <div className="aspect-[16/9] w-full">
                            <Slide s={slide} theme={theme} />
                        </div>

                        {/* Arrows */}
                        <button
                            data-testid="prev-slide"
                            onClick={() => go(-1)}
                            disabled={idx === 0}
                            className="absolute left-4 top-1/2 -translate-y-1/2 border-2 border-black bg-white p-3 shadow-brutal-sm transition disabled:opacity-30 enabled:hover:-translate-y-[calc(50%+2px)] enabled:hover:shadow-[8px_8px_0_0_#0a0a0a]"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            data-testid="next-slide"
                            onClick={() => go(1)}
                            disabled={idx === deck.length - 1}
                            className="absolute right-4 top-1/2 -translate-y-1/2 border-2 border-black bg-white p-3 shadow-brutal-sm transition disabled:opacity-30 enabled:hover:-translate-y-[calc(50%+2px)] enabled:hover:shadow-[8px_8px_0_0_#0a0a0a]"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Thumbnails */}
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-10">
                        {deck.map((s, i) => (
                            <button
                                key={s.no}
                                type="button"
                                data-testid={`thumb-${s.no}`}
                                onClick={() => setIdx(i)}
                                className={`group border-2 p-3 text-left transition hover:-translate-y-0.5 ${
                                    i === idx
                                        ? "border-black bg-[var(--hi)] shadow-brutal-sm"
                                        : "border-black/30 bg-white hover:border-black"
                                }`}
                            >
                                <div className="font-display text-xl">{s.no}</div>
                                <div className="mt-1 font-mono text-[9px] tracking-wider text-neutral-700">
                                    {s.kicker}
                                </div>
                                <div className="mt-2 line-clamp-2 font-display text-[11px] leading-tight">
                                    {s.title}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* TALK TRACK */}
            <section className="border-b border-black bg-[var(--bone)] py-12">
                <div className="mx-auto max-w-[1480px] px-6 lg:px-10">
                    <div className="font-mono text-[10px] tracking-wider text-neutral-500">§C2 / TALK TRACK · CURRENT SLIDE</div>
                    <h3 className="mt-3 font-display text-[36px] leading-tight lg:text-[48px]">
                        What to say on slide <span className="hl-strip">{slide.no}</span>.
                    </h3>
                    <div className="mt-8 grid gap-6 lg:grid-cols-12">
                        <div className="lg:col-span-7">
                            <div className="border-2 border-black bg-white p-6">
                                <div className="font-mono text-[10px] tracking-wider text-neutral-500">OPENING LINE (15s)</div>
                                <p className="mt-3 font-display text-xl leading-snug">{slide.body}</p>
                            </div>
                        </div>
                        <div className="lg:col-span-5">
                            <div className="border-2 border-black bg-black p-6 text-white">
                                <div className="font-mono text-[10px] tracking-wider text-white/55">EXPECTED OBJECTION</div>
                                <p className="mt-3 font-display text-lg leading-snug">
                                    "Show me the second logo before I take the next meeting."
                                </p>
                                <div className="mt-5 font-mono text-[10px] tracking-wider text-white/55">YOUR PRE-DEBATED ANSWER</div>
                                <p className="mt-2 font-mono text-xs leading-relaxed text-white/80">
                                    "We've signed 1 LOI with DHL Express plus 4 verbal commits in active legal review.
                                    Two convert to paper before seed close."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <TickerTape />
            <Footer />
        </div>
    );
}
