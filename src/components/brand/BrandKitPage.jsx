"use client";

/**
 * BrandKitPage (dynamic edition)
 * ─────────────────────────────────────────────────────────────────────────
 * Reads the user's validated idea from the guided-journey local store and
 * calls /api/brand-kit ONCE to populate every visible piece of the page —
 * project name, descriptor, domain, taglines, palette, typography, voice.
 *
 * The visual mockups (Monogram / Wordmark / Lockup SVGs, applied surface
 * tiles, type-scale, icon set, export bay) are kept as TEMPLATES — they
 * compose dynamically from the API response. No image generation. No
 * tokens beyond the single /api/brand-kit call.
 *
 * Caching: the response is cached in localStorage keyed by the idea so
 * navigating back to /brand never re-spends tokens for the same idea.
 *
 * Fallback: if the API fails or no idea is set yet, the page renders the
 * existing studioData fallbacks so it still looks complete.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useMemo, useState } from "react";
import StudioTopNav from "@/components/studio/StudioTopNav";
import TickerTape from "@/components/dashboard/TickerTape";
import Footer from "@/components/dashboard/Footer";
import { project as fallbackProject, brand as fallbackBrand, typeScale, iconSet, exportTargets } from "@/data/studioData";
import { Monogram, Wordmark, Lockup } from "@/components/brand/LogoMark";
import { loadSession } from "@/lib/session";
import {
    Copy, Download, Check, Lock, ArrowUpRight, RefreshCw, AlertTriangle,
    Route, BatteryCharging, Package, MapPin, Bike, Radar,
    Gauge, Zap, Leaf, Cpu, Plug, ShieldCheck,
} from "lucide-react";
import { toast, Toaster } from "sonner";

const ICON_MAP = {
    Route, BatteryCharging, Package, MapPin, Bike, Radar,
    Gauge, Zap, Leaf, Cpu, Plug, ShieldCheck,
};

const CACHE_KEY = "priority-debater-brand-kit-v2";

/* ── Logo surface tile (unchanged from original) ───────────────────────── */
const LogoSurface = ({ variant, bg, fg, accent, note }) => {
    const isLight = bg === "#FFFFFF" || bg === "#F4F3EF" || bg === "#EBE9E2";
    const subtle = isLight ? "rgba(10,10,10,0.55)" : "rgba(255,255,255,0.55)";
    return (
        <div
            data-testid={`logo-surface-${variant}-${bg.replace("#", "")}`}
            className="relative flex aspect-[5/4] items-center justify-center border-2 border-black p-6 transition hover-lift"
            style={{ background: bg, color: fg }}
        >
            <div className="absolute left-3 top-3 font-mono text-[9px] tracking-wider" style={{ color: subtle }}>
                {note}
            </div>
            <div className="absolute right-3 top-3 h-2 w-2" style={{ background: accent }} />

            {variant === "monogram" && <Monogram size={96} color={fg} accent={accent} />}
            {variant === "wordmark" && (
                <div className="text-4xl sm:text-5xl">
                    <Wordmark color={fg} accent={accent} />
                </div>
            )}
            {variant === "lockup" && <Lockup color={fg} accent={accent} monoSize={48} />}

            <div className="absolute bottom-3 left-3 font-mono text-[9px] tracking-wider" style={{ color: subtle }}>
                ON {bg}
            </div>
        </div>
    );
};

/* ── Cache helpers ─────────────────────────────────────────────────────── */
function readCache(idea) {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed?.idea !== idea) return null;
        return parsed.payload ?? null;
    } catch { return null; }
}
function writeCache(idea, payload) {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ idea, payload, savedAt: Date.now() })); }
    catch { /* quota */ }
}

/* ── Page ──────────────────────────────────────────────────────────────── */
export default function BrandKitPage() {
    const [idea, setIdea] = useState("");
    const [data, setData] = useState(null);          // dynamic payload from API
    const [status, setStatus] = useState("idle");    // idle | loading | ready | error | no-idea
    const [errorMsg, setErrorMsg] = useState("");

    // load idea + cached payload on mount
    useEffect(() => {
        const journey = loadSession();
        const t = (journey?.setup?.topic || "").trim();
        if (!t) { setStatus("no-idea"); return; }
        setIdea(t);

        const cached = readCache(t);
        if (cached) { setData(cached); setStatus("ready"); return; }

        // fetch fresh
        fetchKit(t);
    }, []);

    async function fetchKit(topic) {
        setStatus("loading"); setErrorMsg("");
        try {
            const res = await fetch("/api/brand-kit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ setup: { topic } }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j?.error || `HTTP ${res.status}`);
            }
            const payload = await res.json();
            setData(payload); writeCache(topic, payload); setStatus("ready");
        } catch (e) {
            setErrorMsg(e instanceof Error ? e.message : "Failed to generate brand.");
            setStatus("error");
        }
    }

    function regenerate() {
        if (!idea) return;
        try { localStorage.removeItem(CACHE_KEY); } catch {}
        fetchKit(idea);
    }

    /* Resolve display values — dynamic if available, fallback otherwise. */
    const v = useMemo(() => resolveView(data), [data]);

    const [tagline, setTagline] = useState(v.taglines[0]);
    useEffect(() => { setTagline(v.taglines[0]); }, [v.taglines]);

    const [copied, setCopied] = useState(null);
    const copyHex = (hex) => {
        navigator.clipboard.writeText(hex);
        setCopied(hex);
        toast.success(`COPIED ${hex}`, { duration: 1400 });
        setTimeout(() => setCopied(null), 1400);
    };

    const accent = v.palette[2]?.hex || "#7DD3FC";   // 3rd swatch acts as signal accent
    const ink    = v.palette[0]?.hex || "#0A0A0A";

    /* ── No-idea empty state ────────────────────────────────────────── */
    if (status === "no-idea") {
        return (
            <div className="min-h-screen bg-[var(--paper)] text-black">
                <StudioTopNav />
                <Toaster />
                <div className="mx-auto flex max-w-[800px] flex-col items-start gap-6 px-6 py-32">
                    <div className="font-mono text-[10px] tracking-wider text-neutral-500">§A0 / NO IDEA ON FILE</div>
                    <h1 className="font-display text-5xl leading-[1.35]">RUN A VALIDATION FIRST.</h1>
                    <p className="max-w-md font-mono text-sm leading-relaxed text-neutral-600">
                        Your brand kit is generated from your validated idea. Head back to the
                        debate flow, lock a verdict, then return — we'll spin up your kit on the spot.
                    </p>
                    <a href="/" className="inline-flex items-center gap-2 border-2 border-black bg-black px-5 py-3 font-mono text-xs tracking-wider text-white hover-lift">
                        START A VALIDATION <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                </div>
                <Footer />
            </div>
        );
    }

    /* ── Page ───────────────────────────────────────────────────────── */
    return (
        <div data-testid="brand-kit-page" className="min-h-screen bg-[var(--paper)] text-black">
            <StudioTopNav />
            <Toaster position="bottom-right" toastOptions={{
                style: { background: "#0a0a0a", color: "#fff", border: "1px solid #fff", borderRadius: 0, fontFamily: "JetBrains Mono", fontSize: 11 },
            }} />
            <TickerTape />

            {/* Loading + error banner */}
            {status === "loading" && <StatusBanner kind="loading" message="Generating your kit from the validated idea…" />}
            {status === "error"   && <StatusBanner kind="error"   message={errorMsg || "Couldn't reach the brand engine. Showing fallback."} onRetry={regenerate} />}

            {/* HERO */}
            <section className="relative overflow-hidden border-b border-black bg-black text-white">
                <div className="absolute inset-0 bg-grid-dark opacity-60" />
                <div className="relative mx-auto max-w-[1480px] px-6 py-16 lg:px-10 lg:py-24">
                    <div className="font-mono text-[10px] tracking-wider text-white/50">
                        §A1 / BRAND KIT · GENERATED FROM "{(idea || "—").slice(0, 60).toUpperCase()}"
                    </div>
                    <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-end">
                        <div className="lg:col-span-8">
                            <div className="flex items-center gap-5">
                                <Monogram size={110} color="#fff" accent={accent} />
                                <div className="hidden h-24 w-px bg-white/20 sm:block" />
                                <div>
                                    <h1 className="font-display text-[64px] leading-[1.35] sm:text-[88px] lg:text-[112px]">
                                        {status === "loading" ? <Skeleton w="6ch" h="0.85em" dark /> : v.projectCode}
                                    </h1>
                                </div>
                            </div>
                            <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-white/65">
                                {v.descriptor} A complete identity system — logo, palette, type, voice,
                                icon set and mockups — derived from your validation report.
                            </p>
                        </div>
                        <div className="lg:col-span-4">
                            <div className="border border-white/30 bg-black/40 p-5">
                                <div className="font-mono text-[10px] tracking-wider text-white/50">DOMAIN STATUS</div>
                                <div className="mt-2 font-display text-2xl">{v.domain}</div>
                                <div className="mt-2 inline-flex items-center gap-2 font-mono text-[10px] text-[var(--c-green)]">
                                    <span className="h-1.5 w-1.5 animate-pulse bg-[var(--c-green)]" />
                                    AVAILABLE · €18 / YR
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <button className="inline-flex flex-1 items-center justify-center gap-2 border border-white bg-white px-3 py-2 font-mono text-xs tracking-wider text-black">
                                        CLAIM DOMAIN
                                    </button>
                                    <button
                                        onClick={regenerate}
                                        title="Regenerate from idea"
                                        className="inline-flex items-center justify-center border border-white/40 px-3 py-2 font-mono text-xs tracking-wider text-white hover:border-white"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TAGLINE LAB */}
            <section className="border-b border-black bg-[var(--paper)] py-16">
                <div className="mx-auto max-w-[1480px] px-6 lg:px-10">
                    <div className="grid gap-8 lg:grid-cols-12">
                        <div className="lg:col-span-5">
                            <div className="font-mono text-[10px] tracking-wider text-neutral-500">§A2 / TAGLINE LAB</div>
                            <h2 className="mt-3 font-display text-[44px] leading-[1.35] lg:text-[64px]">
                                PICK A <span className="hl-strip">PROMISE.</span>
                            </h2>
                            <p className="mt-5 max-w-md font-mono text-sm leading-relaxed text-neutral-600">
                                Four taglines generated from your validated idea. Pick one to lock it into your
                                landing page, deck and outbound copy.
                            </p>
                        </div>
                        <div className="lg:col-span-7">
                            <div className="grid gap-3">
                                {v.taglines.map((t, i) => (
                                    <button
                                        key={t + i}
                                        type="button"
                                        data-testid={`tagline-option-${i}`}
                                        onClick={() => setTagline(t)}
                                        className={`group flex items-center justify-between gap-4 border-2 border-black px-5 py-5 text-left transition hover:-translate-y-0.5 ${
                                            tagline === t ? "bg-black text-white" : "bg-white"
                                        }`}
                                    >
                                        <span className="flex items-center gap-4">
                                            <span className="font-mono text-[10px] tracking-wider opacity-50">
                                                {String(i + 1).padStart(2, "0")}
                                            </span>
                                            <span className="font-display text-lg sm:text-xl">{t}</span>
                                        </span>
                                        {tagline === t ? (
                                            <span className="inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px]"
                                                  style={{ borderColor: accent, background: accent, color: "#000" }}>
                                                <Check className="h-3 w-3" /> LOCKED
                                            </span>
                                        ) : (
                                            <span className="font-mono text-[10px] tracking-wider text-neutral-400 group-hover:text-black">
                                                PICK →
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* LOGO LAB */}
            <section className="border-b border-black bg-[var(--bone)] py-16">
                <div className="mx-auto max-w-[1480px] px-6 lg:px-10">
                    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <div className="font-mono text-[10px] tracking-wider text-neutral-500">§A3 / LOGO LAB</div>
                            <h2 className="mt-3 font-display text-[44px] leading-[1.35] lg:text-[64px]">
                                THREE MARKS. <span className="hl-strip-dark">NINE SURFACES.</span>
                            </h2>
                            <p className="mt-4 max-w-xl font-mono text-sm leading-relaxed text-neutral-600">
                                Geometric mark templated from your accent palette — block frame with embedded
                                chevron. Built as outlined SVG so it scales from favicon to billboard without
                                a single bezier rebuild.
                            </p>
                        </div>
                        <button
                            data-testid="download-logo-pack"
                            className="inline-flex items-center gap-2 border-2 border-black bg-white px-5 py-3 font-mono text-xs tracking-wider shadow-brutal-sm hover-lift"
                        >
                            <Download className="h-3.5 w-3.5" />
                            LOGO PACK · 18 SURFACES · SVG + PNG
                        </button>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {fallbackBrand.logoVariants.map((variant) => (
                            <div key={variant.id} className="space-y-3">
                                <LogoSurface variant={variant.id} bg="#FFFFFF" fg={ink}     accent={accent} note={variant.note} />
                                <LogoSurface variant={variant.id} bg={ink}      fg="#FFFFFF" accent={accent} note={variant.note} />
                                <LogoSurface variant={variant.id} bg={accent}   fg={ink}     accent={ink}    note={variant.note} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* COLOR SYSTEM */}
            <section className="border-b border-black bg-black py-16 text-white">
                <div className="mx-auto max-w-[1480px] px-6 lg:px-10">
                    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <div className="font-mono text-[10px] tracking-wider text-white/50">§A4 / COLOUR SYSTEM</div>
                            <h2 className="mt-3 font-display text-[44px] leading-[1.35] lg:text-[64px]">
                                THE COLOUR <span className="px-1 text-black" style={{ background: accent }}>SYSTEM.</span>
                            </h2>
                            <p className="mt-4 max-w-xl font-mono text-sm leading-relaxed text-white/55">
                                Six tokens engineered for your idea. WCAG-AA contrast checked. Each swatch ships
                                with its semantic role so engineers don't reinvent the palette in code.
                            </p>
                        </div>
                        <div className="font-mono text-[11px] text-white/55">
                            CLICK A SWATCH TO COPY HEX
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-px border border-white/15 bg-white/10 sm:grid-cols-3 lg:grid-cols-6">
                        {v.palette.map((c) => (
                            <button
                                key={c.hex + c.name}
                                type="button"
                                data-testid={`palette-${c.name}`}
                                onClick={() => copyHex(c.hex)}
                                className="group relative aspect-[3/4] border-0 p-5 text-left transition"
                                style={{ background: c.hex, color: c.contrast }}
                            >
                                <div className="font-mono text-[10px] tracking-wider opacity-70">{c.name}</div>
                                <div className="mt-1 font-display text-2xl leading-tight">{c.hex}</div>
                                <div className="mt-2 font-mono text-[10px] opacity-60">{c.role}</div>
                                <div className="absolute bottom-3 left-5 right-5 flex h-1.5">
                                    {[0.25, 0.5, 0.75, 1].map((a) => (
                                        <div key={a} className="flex-1" style={{ background: c.contrast, opacity: a }} />
                                    ))}
                                </div>
                                <div className="absolute bottom-6 right-3 opacity-0 transition-opacity group-hover:opacity-100">
                                    {copied === c.hex ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* TYPOGRAPHY + SCALE */}
            <section className="border-b border-black bg-[var(--paper)] py-16">
                <div className="mx-auto max-w-[1480px] px-6 lg:px-10">
                    <div className="mb-10">
                        <div className="font-mono text-[10px] tracking-wider text-neutral-500">§A5 / TYPOGRAPHY</div>
                        <h2 className="mt-3 font-display text-[44px] leading-[1.35] lg:text-[64px]">
                            HOW IT <span className="hl-strip">SOUNDS.</span>
                        </h2>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {Object.entries(v.typography).map(([key, t]) => (
                            <div key={key} className="border-2 border-black bg-white p-6 hover-lift">
                                <div className="flex items-center justify-between font-mono text-[10px] tracking-wider text-neutral-500">
                                    <span>{key.toUpperCase()}</span>
                                    <span>{t.family}</span>
                                </div>
                                <div className={`mt-6 leading-tight ${
                                        key === "display" ? "font-display text-5xl"
                                        : key === "mono"   ? "font-mono text-2xl" : "text-2xl"
                                    }`}>
                                    {t.sample}
                                </div>
                                <div className="mt-6 border-t border-black/10 pt-3 font-mono text-[11px] text-neutral-500">
                                    USE · {t.role}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Type scale ramp — kept as static reference (engineering doc) */}
                    <div className="mt-10 border-2 border-black bg-white">
                        <div className="flex items-center justify-between border-b-2 border-black bg-black px-5 py-3 text-white">
                            <div className="font-mono text-[10px] tracking-wider">TYPE SCALE · 7 STEPS</div>
                            <div className="font-mono text-[10px] tracking-wider text-white/55">
                                CSS VARIABLES INCLUDED IN EXPORT
                            </div>
                        </div>
                        <ul className="divide-y divide-black/10">
                            {typeScale.map((row, i) => {
                                const isMono = row.token.startsWith("META") || row.token.startsWith("LABEL");
                                const isDisplay = row.token.startsWith("DISPLAY");
                                return (
                                    <li key={row.token} data-testid={`type-scale-${i}`} className="grid grid-cols-12 items-center gap-4 px-5 py-5">
                                        <div className="col-span-12 sm:col-span-2 font-mono text-[10px] tracking-wider text-neutral-500">{row.token}</div>
                                        <div className="col-span-12 sm:col-span-2 font-mono text-[11px] text-neutral-700">{row.size}<span className="ml-1 text-neutral-400">· LH {row.lh}</span></div>
                                        <div className={`col-span-12 truncate sm:col-span-6 ${isDisplay ? "font-display" : isMono ? "font-mono" : ""}`}
                                             style={{ fontSize: isDisplay ? `clamp(28px, ${parseInt(row.size) * 0.7}px, ${parseInt(row.size)}px)` : `${parseInt(row.size)}px`, lineHeight: row.lh }}>
                                            {row.sample}
                                        </div>
                                        <div className="col-span-12 sm:col-span-2 font-mono text-[10px] text-neutral-500">{row.role}</div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </section>

            {/* VOICE PRINCIPLES */}
            <section className="border-b border-black bg-[var(--bone)] py-16">
                <div className="mx-auto max-w-[1480px] px-6 lg:px-10">
                    <div className="mb-10">
                        <div className="font-mono text-[10px] tracking-wider text-neutral-500">§A6 / VOICE & TONE</div>
                        <h2 className="mt-3 font-display text-[44px] leading-[1.35] lg:text-[64px]">
                            HOW IT <span className="hl-strip-dark">TALKS.</span>
                        </h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {v.voice.map((vp, i) => (
                            <div key={vp.tag + i} className="border-2 border-black bg-white p-5 hover-lift">
                                <div className="font-mono text-[10px] tracking-wider text-neutral-500">
                                    {String(i + 1).padStart(2, "0")} / 04
                                </div>
                                <div className="mt-3 font-display text-2xl">{vp.tag}</div>
                                <p className="mt-3 font-mono text-xs leading-relaxed text-neutral-700">{vp.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ICON SET (kept static — engineering grammar reference) */}
            <section className="border-b border-black bg-[var(--paper)] py-16">
                <div className="mx-auto max-w-[1480px] px-6 lg:px-10">
                    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <div className="font-mono text-[10px] tracking-wider text-neutral-500">§A7 / ICON SET</div>
                            <h2 className="mt-3 font-display text-[44px] leading-[1.35] lg:text-[64px]">
                                12 ICONS. <span className="hl-strip">ONE GRAMMAR.</span>
                            </h2>
                            <p className="mt-4 max-w-xl font-mono text-sm leading-relaxed text-neutral-600">
                                2-px stroke. 24-px grid. No fill. Same family as the display type — engineered,
                                not cute. Use them at 16, 20 or 24 — never below.
                            </p>
                        </div>
                        <button className="inline-flex items-center gap-2 border-2 border-black bg-white px-5 py-3 font-mono text-xs tracking-wider shadow-brutal-sm hover-lift">
                            <Download className="h-3.5 w-3.5" />
                            EXPORT ICONS · SVG
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-px border border-black bg-black sm:grid-cols-4 lg:grid-cols-6">
                        {iconSet.map((i) => {
                            const Icon = ICON_MAP[i.icon];
                            return (
                                <div key={i.name} data-testid={`icon-${i.name.toLowerCase()}`}
                                     className="group flex aspect-square flex-col items-start justify-between bg-white p-4 transition hover:bg-[var(--hi-soft)]">
                                    <Icon className="h-7 w-7" strokeWidth={1.6} />
                                    <div>
                                        <div className="font-mono text-[10px] tracking-wider">{i.name}</div>
                                        <div className="mt-0.5 font-mono text-[9px] text-neutral-500">{i.use}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* APPLY MOCKUPS — surfaces compose dynamically from tagline + accent + projectCode */}
            <section className="border-b border-black bg-black py-16 text-white">
                <div className="mx-auto max-w-[1480px] px-6 lg:px-10">
                    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <div className="font-mono text-[10px] tracking-wider text-white/50">§A8 / APPLIED</div>
                            <h2 className="mt-3 font-display text-[44px] leading-[1.35] lg:text-[64px]">
                                LOCKED-IN <span className="px-1 text-black" style={{ background: accent }}>PREVIEW.</span>
                            </h2>
                        </div>
                        <div className="max-w-sm font-mono text-xs leading-relaxed text-white/55">
                            Your locked tagline applied to six real-world surfaces — card, app icon, web hero,
                            deck slide, social card and vehicle livery.
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Business card */}
                        <div className="border border-white/15 bg-white p-2">
                            <div className="aspect-[7/4] bg-white p-5 text-black">
                                <Lockup color={ink} accent={accent} monoSize={26} />
                                <div className="mt-6 font-display text-base leading-tight">{tagline}</div>
                                <div className="mt-5 flex items-center justify-between font-mono text-[9px] text-neutral-500">
                                    <span>founders@{v.domain}</span>
                                    <span>{v.projectCode}</span>
                                </div>
                            </div>
                            <div className="px-3 py-2 font-mono text-[10px] tracking-wider text-white/50">BUSINESS CARD · 85×55MM</div>
                        </div>

                        {/* App icon */}
                        <div className="border border-white/15 bg-white p-2">
                            <div className="flex aspect-[7/4] items-center justify-center bg-[var(--paper)] p-6">
                                <div className="flex h-32 w-32 items-center justify-center border-2 border-black"
                                     style={{ background: accent, borderRadius: 24 }}>
                                    <Monogram size={84} color={ink} accent={ink} />
                                </div>
                            </div>
                            <div className="px-3 py-2 font-mono text-[10px] tracking-wider text-white/50">APP ICON · iOS 1024</div>
                        </div>

                        {/* Web hero */}
                        <div className="border border-white/15 bg-white p-2">
                            <div className="aspect-[7/4] bg-[var(--paper)] p-5 text-black">
                                <div className="flex items-center justify-between font-mono text-[8px] tracking-wider text-neutral-500">
                                    <span>{v.domain.toUpperCase()}</span>
                                    <span>· LIVE</span>
                                </div>
                                <div className="mt-2 font-display text-2xl leading-[1.35]">{tagline}</div>
                                <div className="mt-3 font-mono text-[9px] text-neutral-600">{v.descriptor}</div>
                                <button className="mt-3 border border-black bg-black px-3 py-1 font-mono text-[9px] tracking-wider text-white">BOOK A PILOT →</button>
                            </div>
                            <div className="px-3 py-2 font-mono text-[10px] tracking-wider text-white/50">WEB HERO · 1440×900</div>
                        </div>

                        {/* Pitch deck slide */}
                        <div className="border border-white/15 bg-white p-2">
                            <div className="aspect-[7/4] p-5" style={{ background: ink, color: "#fff" }}>
                                <div className="font-mono text-[8px] tracking-wider text-white/50">§01 / PROBLEM</div>
                                <div className="mt-3 font-display text-2xl leading-tight">
                                    {v.projectCode}<span className="px-1 ml-1 text-black" style={{ background: accent }}>{tagline.split(".")[0]}.</span>
                                </div>
                                <div className="mt-5 grid grid-cols-2 gap-2 border border-white/20 p-2 font-mono text-[9px]">
                                    <div><div className="text-white/50">VERDICT</div><div className="font-display text-base" style={{ color: accent }}>{v.verdictBadge}</div></div>
                                    <div><div className="text-white/50">ROUNDS</div><div className="font-display text-base" style={{ color: accent }}>04</div></div>
                                </div>
                            </div>
                            <div className="px-3 py-2 font-mono text-[10px] tracking-wider text-white/50">DECK SLIDE · 16:9</div>
                        </div>

                        {/* Social card */}
                        <div className="border border-white/15 bg-white p-2">
                            <div className="aspect-[7/4] p-5" style={{ background: accent, color: ink }}>
                                <Monogram size={26} color={ink} accent={ink} />
                                <div className="mt-3 font-display text-2xl leading-[1.35]">
                                    {v.projectCode} — <span className="px-1" style={{ background: ink, color: accent }}>{tagline.split(".")[0]}.</span>
                                </div>
                                <div className="mt-3 font-mono text-[9px] tracking-wider" style={{ color: ink, opacity: 0.7 }}>{v.domain.toUpperCase()}</div>
                            </div>
                            <div className="px-3 py-2 font-mono text-[10px] tracking-wider text-white/50">SOCIAL CARD · 1200×630</div>
                        </div>

                        {/* Vehicle livery (kept as a flexible mockup surface — accent + ink swap) */}
                        <div className="border border-white/15 bg-white p-2">
                            <div className="relative flex aspect-[7/4] items-end overflow-hidden p-0" style={{ background: "#f4f3ef", color: ink }}>
                                <svg viewBox="0 0 700 400" className="absolute inset-0 h-full w-full">
                                    <rect x="0" y="0" width="700" height="400" fill="#f4f3ef" />
                                    <rect x="100" y="140" width="320" height="160" fill={ink} />
                                    <circle cx="160" cy="320" r="46" fill="none" stroke={ink} strokeWidth="14" />
                                    <circle cx="560" cy="320" r="46" fill="none" stroke={ink} strokeWidth="14" />
                                    <line x1="200" y1="320" x2="420" y2="220" stroke={ink} strokeWidth="8" />
                                    <line x1="420" y1="220" x2="560" y2="320" stroke={ink} strokeWidth="8" />
                                    <rect x="120" y="160" width="280" height="32" fill={accent} />
                                    <text x="135" y="184" fill={ink} fontFamily="Anton" fontSize="28">{v.projectCode} ▶</text>
                                    <text x="135" y="232" fill="#fff" fontFamily="Anton" fontSize="36">{(tagline.split(".")[0] || "").slice(0, 24)}.</text>
                                    <text x="135" y="270" fill="#fff" fontFamily="JetBrains Mono" fontSize="14">{v.domain}</text>
                                </svg>
                            </div>
                            <div className="px-3 py-2 font-mono text-[10px] tracking-wider text-white/50">VEHICLE LIVERY · 2 SIDES</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* EXPORT BAY (unchanged — paywalled, generic) */}
            <section className="border-b border-black bg-[var(--paper)] py-16">
                <div className="mx-auto max-w-[1480px] px-6 lg:px-10">
                    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <div className="font-mono text-[10px] tracking-wider text-neutral-500">§A9 / EXPORT BAY</div>
                            <h2 className="mt-3 font-display text-[44px] leading-[1.35] lg:text-[64px]">
                                SHIP IT <span className="hl-strip">EVERYWHERE.</span>
                            </h2>
                            <p className="mt-4 max-w-xl font-mono text-sm leading-relaxed text-neutral-600">
                                One source of truth, six destinations. Upgrade to unlock the full one-click
                                export bay — your kit lands in Figma, Framer, Webflow and Keynote, perfectly
                                tokenised.
                            </p>
                        </div>
                        <button
                            data-testid="export-all"
                            className="inline-flex items-center gap-2 border-2 border-black bg-black px-5 py-3 font-mono text-xs tracking-wider text-white shadow-brutal-sm transition hover:shadow-[8px_8px_0_0_var(--accent-shadow)]"
                            style={{ "--accent-shadow": accent }}
                        >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            EXPORT EVERYTHING · €49
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-px border-2 border-black bg-black sm:grid-cols-2 lg:grid-cols-3">
                        {exportTargets.map((t, i) => {
                            const locked = t.tier !== "STARTER";
                            return (
                                <button key={t.id} type="button" data-testid={`export-${t.id}`}
                                        onClick={() => locked && toast.message(`UPGRADE TO ${t.tier} TO UNLOCK`, { duration: 1800 })}
                                        className="group relative flex items-stretch gap-4 bg-white p-5 text-left transition hover:bg-[var(--hi-soft)]">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-black bg-[var(--paper)] font-display text-lg">
                                        {String(i + 1).padStart(2, "0")}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-display text-base">{t.label}</span>
                                            {locked ? (
                                                <span className="inline-flex items-center gap-1 border border-black bg-black px-2 py-0.5 font-mono text-[9px] text-white">
                                                    <Lock className="h-2.5 w-2.5" />{t.tier}
                                                </span>
                                            ) : (
                                                <span className="border border-[var(--c-green)] bg-[var(--c-green)] px-2 py-0.5 font-mono text-[9px] text-black">FREE</span>
                                            )}
                                        </div>
                                        <div className="mt-2 font-mono text-[11px] leading-relaxed text-neutral-600">{t.note}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            <TickerTape />
            <Footer />
        </div>
    );
}

/* ── helpers ───────────────────────────────────────────────────────────── */

function StatusBanner({ kind, message, onRetry }) {
    const isLoading = kind === "loading";
    return (
        <div className={`flex items-center justify-between gap-4 border-b-2 px-6 py-3 ${
            isLoading ? "border-black bg-[var(--hi-soft,#cfe9ff)] text-black" : "border-[var(--c-red,#ff3b30)] bg-black text-white"
        }`}>
            <div className="flex items-center gap-3 font-mono text-[11px] tracking-wider">
                {isLoading
                    ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    : <AlertTriangle className="h-3.5 w-3.5" />}
                {message}
            </div>
            {!isLoading && onRetry && (
                <button onClick={onRetry} className="border border-current px-3 py-1 font-mono text-[10px] tracking-wider hover:bg-current hover:text-black">
                    RETRY
                </button>
            )}
        </div>
    );
}

function Skeleton({ w = "8ch", h = "1em", dark = false }) {
    return (
        <span aria-hidden className="inline-block animate-pulse align-middle"
              style={{ width: w, height: h, background: dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)" }} />
    );
}

/**
 * resolveView — merge dynamic API payload with fallback studioData so every
 * sub-component can read from a single coherent shape, even mid-loading.
 */
function resolveView(data) {
    const fb = {
        projectCode: fallbackProject.code,
        descriptor: fallbackProject.descriptor,
        domain: fallbackProject.domain,
        taglines: fallbackBrand.taglineOptions,
        palette: fallbackBrand.palette,
        typography: fallbackBrand.typography,
        voice: fallbackBrand.voice,
        verdictBadge: "GO",
    };
    if (!data) return fb;

    return {
        projectCode: data.projectCode || fb.projectCode,
        descriptor: data.descriptor || fb.descriptor,
        domain: data.domain || fb.domain,
        taglines: (data.taglines && data.taglines.length === 4) ? data.taglines : fb.taglines,
        palette: (data.brandKit?.palette && data.brandKit.palette.length === 6) ? data.brandKit.palette : fb.palette,
        typography: data.brandKit?.typography || fb.typography,
        voice: (data.brandKit?.voice && data.brandKit.voice.length === 4) ? data.brandKit.voice : fb.voice,
        verdictBadge: "GO",
    };
}
