"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Download, Loader2, Monitor, Smartphone, Sparkles, Palette, RefreshCw } from "lucide-react";
import { toast, Toaster } from "sonner";

import StudioTopNav from "@/components/studio/StudioTopNav";
import TickerTape from "@/components/dashboard/TickerTape";
import Footer from "@/components/dashboard/Footer";

import EditorialTemplate from "@/components/landing-templates/EditorialTemplate";
import FounderWarmTemplate from "@/components/landing-templates/FounderWarmTemplate";
import TechMinimalTemplate from "@/components/landing-templates/TechMinimalTemplate";
import BrutalistTemplate from "@/components/landing-templates/BrutalistTemplate";

import { TEMPLATE_GALLERY, type LandingCopy, type TemplateId, type TemplateProps } from "@/lib/landing-template-types";
import type { LandingImageRef } from "@/lib/landing-images";
import { loadSession } from "@/lib/session";

const PRESET_ACCENTS = ["#ffe600", "#7dd3fc", "#a78bfa", "#fb7185", "#34d399", "#fb923c"];

const TEMPLATE_COMPONENTS: Record<TemplateId, React.ComponentType<TemplateProps>> = {
    editorial: EditorialTemplate,
    warm: FounderWarmTemplate,
    tech: TechMinimalTemplate,
    brutalist: BrutalistTemplate,
};

const DEFAULT_ACCENT: Record<TemplateId, string> = {
    editorial: "#ffe600",
    warm: "#fb923c",
    tech: "#7c3aed",
    brutalist: "#ffe600",
};

export default function LandingBuilderPage() {
    const [templateId, setTemplateId] = useState<TemplateId | null>(null);
    const [copy, setCopy] = useState<LandingCopy | null>(null);
    const [images, setImages] = useState<LandingImageRef[]>([]);
    const [accent, setAccent] = useState<string>(DEFAULT_ACCENT.editorial);
    const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
    const [loading, setLoading] = useState(false);
    const [phase, setPhase] = useState<"idle" | "copy" | "images">("idle");
    const [hasSession, setHasSession] = useState<boolean | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        // Detect session client-side
        const s = loadSession();
        setHasSession(!!s);
    }, []);

    const generate = useCallback(async (chosen: TemplateId) => {
        const session = loadSession();
        if (!session) {
            setErrorMsg("Validate an idea first — that's the source of your landing copy.");
            return;
        }
        setLoading(true);
        setPhase("copy");
        setErrorMsg(null);
        try {
            const copyRes = await fetch("/api/landing-copy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic: session.setup.topic,
                    position: session.setup.position,
                    context: session.setup.context,
                    templateId: chosen,
                    dashboardData: session.dashboardData,
                }),
            });
            if (!copyRes.ok) throw new Error("Copy generation failed.");
            const copyJson = (await copyRes.json()) as LandingCopy;
            if (!copyJson || (copyJson as unknown as { error?: string }).error) {
                throw new Error("AI returned an unexpected response.");
            }
            setCopy(copyJson);

            setPhase("images");
            const imgQuery = copyJson.imageQuery || session.setup.topic;
            const imgRes = await fetch(
                `/api/landing-preview-images?topic=${encodeURIComponent(imgQuery)}&position=${encodeURIComponent(session.setup.position || "")}`,
            );
            const imgJson = (await imgRes.json().catch(() => ({}))) as { images?: LandingImageRef[] };
            setImages(imgJson.images ?? []);

            setTemplateId(chosen);
            setAccent(DEFAULT_ACCENT[chosen]);
            toast.success("LANDING POPULATED · READY TO SHIP");
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Generation failed.");
        } finally {
            setLoading(false);
            setPhase("idle");
        }
    }, []);

    const reset = () => {
        setTemplateId(null);
        setCopy(null);
        setImages([]);
        setErrorMsg(null);
    };

    const TemplateComponent = templateId ? TEMPLATE_COMPONENTS[templateId] : null;

    const phaseLabel = useMemo(() => {
        if (phase === "copy") return "Writing copy for your idea… (~20s)";
        if (phase === "images") return "Pulling on-brand stock imagery…";
        return "";
    }, [phase]);

    return (
        <div data-testid="landing-builder-page" className="min-h-screen bg-[var(--paper)] text-black">
            <StudioTopNav />
            <Toaster
                position="bottom-right"
                toastOptions={{
                    style: {
                        background: "#0a0a0a",
                        color: "#fff",
                        border: "1px solid #fff",
                        borderRadius: 0,
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 11,
                    },
                }}
            />
            <TickerTape />

            {/* HERO */}
            <section className="relative overflow-hidden border-b border-black bg-[var(--bone)] py-14">
                <div className="absolute inset-0 bg-grid opacity-100" />
                <div className="relative mx-auto max-w-[1480px] px-6 lg:px-10">
                    <div className="font-mono text-[10px] tracking-wider text-neutral-500">§B / LANDING PAGE BUILDER · AI</div>
                    <div className="mt-3 grid gap-8 lg:grid-cols-12">
                        <h1 className="font-display text-[52px] leading-[1.35] sm:text-[72px] lg:col-span-8 lg:text-[96px]">
                            PICK A LOOK. <br />
                            <span className="hl-strip">WE WRITE THE COPY.</span>
                        </h1>
                        <p className="max-w-md self-end font-mono text-sm leading-relaxed text-neutral-600 lg:col-span-4">
                            Four production-ready templates. We auto-fill every section with copy tuned to your idea and pull
                            on-brand stock imagery. Edit the accent, swap device, export.
                        </p>
                    </div>
                </div>
            </section>

            {/* STEP 1 — TEMPLATE GALLERY (when no template chosen) */}
            {!templateId && (
                <section className="border-b border-black bg-[var(--paper)] py-14" data-testid="template-gallery">
                    <div className="mx-auto max-w-[1480px] px-6 lg:px-10">
                        {hasSession === false && (
                            <div className="mb-8 border-2 border-black bg-[var(--hi-soft)] p-5">
                                <div className="font-mono text-[10px] tracking-wider text-black/60">NO SESSION FOUND</div>
                                <div className="mt-2 font-display text-2xl">Validate an idea first.</div>
                                <p className="mt-2 max-w-2xl font-mono text-xs leading-relaxed text-black/65">
                                    The landing builder uses your validation report to write copy. Run an idea through the panel,
                                    then come back here — every headline, feature, metric and CTA will be specific to your idea.
                                </p>
                                <Link
                                    href="/"
                                    data-testid="cta-validate-first"
                                    className="mt-4 inline-flex items-center gap-2 border-2 border-black bg-[var(--hi)] px-4 py-2 font-mono text-[11px] tracking-wider hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#000] transition-all"
                                >
                                    VALIDATE AN IDEA <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        )}

                        <div className="mb-8 flex items-end justify-between">
                            <div>
                                <div className="font-mono text-[10px] tracking-wider text-neutral-500">§B1 / CHOOSE A TEMPLATE</div>
                                <h2 className="mt-2 font-display text-3xl lg:text-4xl">Four templates. One click.</h2>
                            </div>
                            {hasSession && (
                                <div className="font-mono text-[10px] tracking-wider text-neutral-500">
                                    Session ready · {loadSession()?.setup.topic.slice(0, 60)}…
                                </div>
                            )}
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                            {TEMPLATE_GALLERY.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    data-testid={`pick-template-${t.id}`}
                                    disabled={loading || hasSession === false}
                                    onClick={() => generate(t.id)}
                                    className="group relative flex flex-col border-2 border-black bg-white text-left shadow-[6px_6px_0_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[10px_10px_0_0_#000] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {/* preview pane */}
                                    <div className="relative h-44 overflow-hidden border-b-2 border-black">
                                        <TemplatePreviewSwatch id={t.id} swatches={t.swatches} />
                                    </div>
                                    <div className="flex-1 p-5">
                                        <div className="font-mono text-[10px] tracking-widest text-neutral-500">{`0${TEMPLATE_GALLERY.indexOf(t) + 1}`} / TEMPLATE</div>
                                        <div className="mt-1 font-display text-2xl">{t.label}</div>
                                        <p className="mt-2 font-mono text-[11px] leading-relaxed text-neutral-600">{t.tagline}</p>
                                        <div className="mt-3 inline-block border border-black px-2 py-0.5 font-mono text-[9px] tracking-wider">
                                            BEST FOR: {t.bestFor.toUpperCase()}
                                        </div>
                                    </div>
                                    <div
                                        className="flex items-center justify-between border-t-2 border-black bg-black px-5 py-3 font-mono text-[11px] tracking-widest text-white transition-colors group-hover:bg-[var(--hi)] group-hover:text-black"
                                    >
                                        <span>PICK THIS</span>
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {loading && (
                            <div className="mt-10 flex items-center justify-center gap-3 border-2 border-black bg-[var(--hi-soft)] p-5 font-mono text-[11px] tracking-wider" data-testid="generation-status">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {phaseLabel}
                            </div>
                        )}

                        {errorMsg && (
                            <div className="mt-6 border-2 border-[var(--c-red)] bg-rose-50 p-4 font-mono text-[11px] text-[var(--c-red)]" data-testid="generation-error">
                                ERROR: {errorMsg}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* STEP 2 — POPULATED PREVIEW WITH LIGHT CONTROLS */}
            {templateId && copy && TemplateComponent && (
                <section className="border-b border-black bg-[var(--paper)] py-8" data-testid="populated-preview">
                    <div className="mx-auto max-w-[1480px] px-6 lg:px-10">
                        {/* Control bar */}
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-2 border-black bg-black px-4 py-3 text-white">
                            <div className="flex flex-wrap items-center gap-4">
                                <button
                                    type="button"
                                    onClick={reset}
                                    data-testid="back-to-gallery"
                                    className="inline-flex items-center gap-2 border border-white/30 px-3 py-1.5 font-mono text-[10px] tracking-widest hover:bg-white hover:text-black"
                                >
                                    <ArrowLeft className="h-3 w-3" /> BACK
                                </button>
                                <div className="font-mono text-[10px] tracking-widest text-white/60">
                                    <Sparkles className="mr-2 inline h-3 w-3" style={{ color: accent }} />
                                    {TEMPLATE_GALLERY.find((t) => t.id === templateId)?.label}
                                </div>
                                <div className="hidden font-mono text-[10px] tracking-widest text-white/40 sm:block">
                                    {copy.brand.name.toUpperCase()} · {copy.brand.tagline}
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Accent presets */}
                                <div className="flex items-center gap-1.5 border border-white/20 bg-white/5 px-2 py-1">
                                    <Palette className="h-3 w-3 text-white/60" />
                                    {PRESET_ACCENTS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            data-testid={`accent-${c.slice(1)}`}
                                            onClick={() => setAccent(c)}
                                            className={`h-5 w-5 border transition ${accent === c ? "border-white scale-110" : "border-white/20"}`}
                                            style={{ background: c }}
                                            aria-label={`accent ${c}`}
                                        />
                                    ))}
                                </div>
                                {/* Regenerate */}
                                <button
                                    type="button"
                                    onClick={() => generate(templateId)}
                                    disabled={loading}
                                    data-testid="regen-copy"
                                    className="inline-flex items-center gap-2 border border-white/30 px-3 py-1.5 font-mono text-[10px] tracking-widest hover:bg-white hover:text-black disabled:opacity-50"
                                >
                                    <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> REGEN
                                </button>
                                {/* Device toggle */}
                                <div className="flex border border-white/30">
                                    <button
                                        type="button"
                                        onClick={() => setDevice("desktop")}
                                        data-testid="device-desktop"
                                        className={`px-3 py-1.5 ${device === "desktop" ? "bg-white text-black" : "text-white/60 hover:text-white"}`}
                                    >
                                        <Monitor className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDevice("mobile")}
                                        data-testid="device-mobile"
                                        className={`px-3 py-1.5 ${device === "mobile" ? "bg-white text-black" : "text-white/60 hover:text-white"}`}
                                    >
                                        <Smartphone className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${copy.seo.title}</title><meta name="description" content="${copy.seo.description}"/></head><body><pre style="white-space:pre-wrap;font-family:monospace;padding:24px">${JSON.stringify(copy, null, 2)}</pre></body></html>`;
                                        const blob = new Blob([html], { type: "text/html" });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = `${copy.brand.name.toLowerCase().replace(/\s+/g, "-")}-landing.html`;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                        toast.success("LANDING EXPORTED · .HTML");
                                    }}
                                    data-testid="export-html"
                                    className="inline-flex items-center gap-2 border-2 border-white bg-[var(--hi)] px-3 py-1.5 font-mono text-[10px] tracking-widest text-black hover:bg-white"
                                >
                                    <Download className="h-3 w-3" /> EXPORT
                                </button>
                            </div>
                        </div>

                        {/* Preview frame */}
                        <div className="max-h-[2400px] overflow-y-auto border-2 border-black bg-black/5 p-3">
                            <div className={`mx-auto border-2 border-black transition-all ${device === "mobile" ? "max-w-[420px]" : "w-full"}`} data-testid="landing-preview-frame">
                                <TemplateComponent copy={copy} images={images} accent={accent} device={device} />
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <TickerTape />
            <Footer />
        </div>
    );
}

/** Tiny preview swatch that hints each template's vibe in the gallery card. */
function TemplatePreviewSwatch({ id, swatches }: { id: TemplateId; swatches: [string, string, string] }) {
    if (id === "editorial") {
        return (
            <div className="h-full w-full p-4" style={{ background: "#f4efe3" }}>
                <div className="h-1.5 w-12 bg-black/60" />
                <div className="mt-3 font-serif text-2xl italic leading-none text-black">Quiet.<br />Confident.</div>
                <div className="mt-3 h-1 w-20" style={{ background: swatches[2] }} />
                <div className="mt-2 h-1 w-16 bg-black/40" />
            </div>
        );
    }
    if (id === "warm") {
        return (
            <div className="grid h-full w-full grid-cols-3 gap-2 p-3" style={{ background: "#fff7ed" }}>
                <div className="rounded-xl" style={{ background: "#fde68a" }} />
                <div className="rounded-xl" style={{ background: "#fbcfe8" }} />
                <div className="rounded-xl" style={{ background: "#bae6fd" }} />
                <div className="col-span-3 rounded-xl bg-black/85 p-2 text-[10px] text-white">Start free →</div>
            </div>
        );
    }
    if (id === "tech") {
        return (
            <div className="relative h-full w-full overflow-hidden" style={{ background: "#0b0d12" }}>
                <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 200px 100px at 50% 30%, rgba(124,58,237,0.4), transparent 70%)" }} />
                <div className="relative p-4">
                    <div className="font-mono text-[9px] tracking-widest text-white/45">{"// V2.0"}</div>
                    <div className="mt-2 text-sm font-semibold text-white">Built for speed.</div>
                    <div className="mt-1 text-xs" style={{ background: "linear-gradient(135deg, #22d3ee, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Ship dark.</div>
                </div>
            </div>
        );
    }
    return (
        <div className="h-full w-full p-3" style={{ background: "#fefce8" }}>
            <div className="inline-block border-2 border-black px-1.5 text-[9px] font-bold uppercase">NEW</div>
            <div className="mt-2 font-black uppercase leading-[1.35] tracking-tighter text-black" style={{ fontSize: 28 }}>
                BUILT<br />
                <span style={{ background: "#ffe600", padding: "0 0.06em" }}>LOUD.</span>
            </div>
            <div className="mt-2 inline-block border-2 border-black bg-black px-2 py-0.5 text-[9px] font-bold uppercase text-[#fefce8] shadow-[3px_3px_0_0_#000]">GO →</div>
        </div>
    );
}
