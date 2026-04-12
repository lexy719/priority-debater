"use client";

import type { ReactNode } from "react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Loader2,
  Sparkles,
  Download,
  AlertTriangle,
  ImageIcon,
  ChevronDown,
  RotateCcw,
  ArrowLeft,
  Copy,
  CheckCircle2,
  X,
  Trash2,
  Settings2,
  Wand2,
  FileText,
  Palette,
} from "lucide-react";
import { FadeIn } from "@/components/ui/animated-text";
import { GradientMesh } from "@/components/ui/animated-background";
import { cn } from "@/lib/utils";
import {
  LOGO_AVOID,
  LOGO_COLOR_STRATEGIES,
  LOGO_MARK_TYPES,
  LOGO_MUST_HAVES,
  LOGO_PERSONALITIES,
  LOGO_VISUAL_STYLES,
  DEFAULT_LOGO_BRIEF,
  buildBrandSheetPrompt,
  type LogoBrief,
} from "@/lib/logo-brief";
import { loadSessionWithStatus } from "@/lib/session";
import { messageFromFailedResponse } from "@/lib/read-api-error";
import { streamDebateMarkdown } from "@/lib/stream-debate-markdown";
import type { ValidationSession } from "@/lib/types";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

type PreviewBg = "dark" | "light" | "checkered";

type GalleryItem = {
  src: string;
  timestamp: number;
};

const MAX_GALLERY = 12;

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function extractColorSwatches(md: string): Array<{ token: string; hex: string; usage: string }> {
  const colors: Array<{ token: string; hex: string; usage: string }> = [];
  const re = /\|\s*([\w\s/&]+?)\s*\|\s*(#[0-9A-Fa-f]{3,8})\s*\|\s*(.*?)\s*\|/g;
  let m;
  while ((m = re.exec(md)) !== null) {
    const token = m[1].trim();
    if (token.toLowerCase() === "token" || token.startsWith("---")) continue;
    colors.push({ token, hex: m[2].trim(), usage: m[3].trim() });
  }
  return colors;
}

// ────────────────────────────────────────────────────────────
// Sub-components (compact brief controls)
// ────────────────────────────────────────────────────────────

function ChipGroup<K extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { id: K; label: string; hint: string }[];
  value: K;
  onChange: (id: K) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            title={opt.hint}
            className={cn(
              "rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all duration-150",
              value === opt.id
                ? "border-indigo-400/50 bg-indigo-500/20 text-white"
                : "border-zinc-700/50 bg-zinc-900/40 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleChips<K extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly { id: K; label: string; hint: string }[];
  selected: K[];
  onToggle: (id: K) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const on = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              title={opt.hint}
              onClick={() => onToggle(opt.id)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all",
                on
                  ? "border-indigo-400/40 bg-indigo-500/20 text-indigo-100"
                  : "border-zinc-700/50 bg-zinc-900/35 text-zinc-500 hover:text-zinc-300",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────

function BrandStudioInner() {
  const router = useRouter();
  const [session, setSession] = useState<ValidationSession | null>(null);

  // Brief (simplified — only key choices exposed)
  const [logoBrief, setLogoBrief] = useState<LogoBrief>(DEFAULT_LOGO_BRIEF);
  const [logoExtraNotes, setLogoExtraNotes] = useState("");
  const [briefOpen, setBriefOpen] = useState(false);

  // Image generation
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [previewBg, setPreviewBg] = useState<PreviewBg>("light");

  // Brand kit (text — auto-triggered after image)
  const [brandKitContent, setBrandKitContent] = useState("");
  const [brandKitStreaming, setBrandKitStreaming] = useState("");
  const [brandKitGenerating, setBrandKitGenerating] = useState(false);
  const [brandKitError, setBrandKitError] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState(false);

  const brandKitRef = useRef<HTMLDivElement>(null);

  // ── Session ──
  useEffect(() => {
    const result = loadSessionWithStatus();
    if (result.status === "expired") {
      alert("Your session has expired (24h limit). Please start a new validation.");
      router.replace("/journey");
      return;
    }
    if (result.status === "none") {
      router.replace("/journey");
      return;
    }
    const s = result.session;
    if (s.setup.template === "generate") { router.replace("/validate"); return; }
    setSession(s);
  }, [router]);

  // ── Brief helpers ──
  const composedPrompt = useMemo(() => {
    if (!session) return "";
    return buildBrandSheetPrompt(session.setup.topic, session.setup.position || "", logoBrief, logoExtraNotes);
  }, [session, logoBrief, logoExtraNotes]);

  const setBriefField = useCallback(<K extends keyof LogoBrief>(key: K, val: LogoBrief[K]) => {
    setLogoBrief((prev) => ({ ...prev, [key]: val }));
  }, []);

  const toggleMust = useCallback((id: (typeof LOGO_MUST_HAVES)[number]["id"]) => {
    setLogoBrief((prev) => {
      const has = prev.mustHaves.includes(id);
      const next = has ? prev.mustHaves.filter((x) => x !== id) : [...prev.mustHaves, id];
      return { ...prev, mustHaves: next.length ? next : DEFAULT_LOGO_BRIEF.mustHaves };
    });
  }, []);

  const toggleAvoid = useCallback((id: (typeof LOGO_AVOID)[number]["id"]) => {
    setLogoBrief((prev) => {
      const has = prev.avoid.includes(id);
      const next = has ? prev.avoid.filter((x) => x !== id) : [...prev.avoid, id];
      return { ...prev, avoid: next.length ? next : DEFAULT_LOGO_BRIEF.avoid };
    });
  }, []);

  // ── Brand kit (text) generation ──
  const runBrandKit = useCallback(async () => {
    if (!session) return;
    setBrandKitGenerating(true);
    setBrandKitError(null);
    setBrandKitStreaming("");
    setBrandKitContent("");
    try {
      const final = await streamDebateMarkdown(
        "logo-brand-kit",
        session,
        (acc) => setBrandKitStreaming(acc),
        { logoBrief },
      );
      setBrandKitContent(final);
      setBrandKitStreaming("");
    } catch (e) {
      setBrandKitError(e instanceof Error ? e.message : "Brand kit generation failed.");
    } finally {
      setBrandKitGenerating(false);
    }
  }, [session, logoBrief]);

  // ── Image generation (auto-triggers brand kit after) ──
  const runGenerate = useCallback(async () => {
    const p = composedPrompt.trim();
    if (!p) return;
    setGenerating(true);
    setError(null);
    setActiveIdx(null);
    try {
      const res = await fetch("/api/generate-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, provider: "auto" }),
      });
      if (!res.ok) throw new Error(await messageFromFailedResponse(res));
      const data = (await res.json()) as { url?: string; dataUrl?: string; error?: string };
      const src = data.dataUrl || data.url;
      if (!src) throw new Error("No image returned.");
      setGallery((prev) => [{ src, timestamp: Date.now() }, ...prev].slice(0, MAX_GALLERY));
      setActiveIdx(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  }, [composedPrompt]);

  // Auto-trigger brand kit after first image generation
  const hasTriggeredKit = useRef(false);
  useEffect(() => {
    if (gallery.length > 0 && !brandKitContent && !brandKitGenerating && !hasTriggeredKit.current) {
      hasTriggeredKit.current = true;
      runBrandKit();
    }
  }, [gallery.length, brandKitContent, brandKitGenerating, runBrandKit]);

  const activeSrc = activeIdx !== null ? gallery[activeIdx]?.src ?? null : gallery[0]?.src ?? null;
  const displayBrandKit = brandKitContent || brandKitStreaming;
  const colorSwatches = useMemo(() => (displayBrandKit ? extractColorSwatches(displayBrandKit) : []), [displayBrandKit]);

  const removeGalleryItem = useCallback((idx: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== idx));
    if (activeIdx === idx) setActiveIdx(gallery.length > 1 ? 0 : null);
    else if (activeIdx !== null && activeIdx > idx) setActiveIdx(activeIdx - 1);
  }, [activeIdx, gallery.length]);

  // ── Brand kit actions ──
  const handleCopyKit = useCallback(() => {
    if (!displayBrandKit) return;
    navigator.clipboard.writeText(displayBrandKit).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    });
  }, [displayBrandKit]);

  const handleDownloadKit = useCallback(() => {
    if (!session || !displayBrandKit) return;
    const slug = session.setup.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50);
    const blob = new Blob([displayBrandKit], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-brand-kit.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [session, displayBrandKit]);

  // ── Loading ──
  if (!session) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#08080e]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500/50" />
      </div>
    );
  }

  const s = session;
  const hasOutput = gallery.length > 0;

  const bgClasses: Record<PreviewBg, string> = {
    light: "bg-white",
    dark: "bg-zinc-950",
    checkered: "bg-[conic-gradient(#e4e4e7_25%,white_25%,white_50%,#e4e4e7_50%,#e4e4e7_75%,white_75%)] bg-[length:20px_20px]",
  };

  return (
    <div className="min-h-dvh bg-[#08080e] relative">
      <GradientMesh />

      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-[#08080e]/80 backdrop-blur-xl border-b border-white/6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:inline text-sm font-semibold text-white/70 group-hover:text-white transition-colors">
              Brand Studio
            </span>
          </Link>
          <Link
            href="/results"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white/30 hover:text-white/60 rounded-lg hover:bg-white/4 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Results</span>
          </Link>
        </div>
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Title ── */}
        <FadeIn delay={0} className="mb-6 text-center">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-300/55">Brand identity</p>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{s.setup.topic}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            Generate a complete brand sheet and identity kit — logo, colors, typography, and mockups.
          </p>
        </FadeIn>

        {/* ── Compact design preferences ── */}
        <FadeIn delay={0.04} className="mb-6">
          <div className="rounded-2xl border border-white/6 bg-zinc-900/50 overflow-hidden">
            <button
              type="button"
              onClick={() => setBriefOpen(!briefOpen)}
              className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-white/3"
            >
              <div className="flex items-center gap-3">
                <Settings2 className="h-4 w-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-300">Design preferences</span>
                <span className="text-[11px] text-zinc-600">{briefOpen ? "" : "Mark, style, colors, personality"}</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-zinc-600 transition-transform duration-200", briefOpen && "rotate-180")} />
            </button>

            {briefOpen && (
              <div className="border-t border-white/6 px-5 py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-zinc-600">Shapes the brand sheet prompt.</p>
                  <button
                    type="button"
                    onClick={() => { setLogoBrief(DEFAULT_LOGO_BRIEF); setLogoExtraNotes(""); }}
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500 hover:text-white"
                  >
                    <RotateCcw className="h-3 w-3" /> Reset
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <ChipGroup label="Mark" options={LOGO_MARK_TYPES} value={logoBrief.markType} onChange={(id) => setBriefField("markType", id)} />
                  <ChipGroup label="Style" options={LOGO_VISUAL_STYLES} value={logoBrief.visualStyle} onChange={(id) => setBriefField("visualStyle", id)} />
                  <ChipGroup label="Colors" options={LOGO_COLOR_STRATEGIES} value={logoBrief.colorStrategy} onChange={(id) => setBriefField("colorStrategy", id)} />
                  <ChipGroup label="Personality" options={LOGO_PERSONALITIES} value={logoBrief.personality} onChange={(id) => setBriefField("personality", id)} />
                  <ToggleChips label="Must-haves" options={LOGO_MUST_HAVES} selected={logoBrief.mustHaves} onToggle={toggleMust} />
                  <ToggleChips label="Avoid" options={LOGO_AVOID} selected={logoBrief.avoid} onToggle={toggleAvoid} />
                </div>

                <div>
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Notes</span>
                  <input
                    value={logoExtraNotes}
                    onChange={(e) => setLogoExtraNotes(e.target.value)}
                    placeholder="Competitor logos to avoid, exact name spelling..."
                    className="w-full rounded-lg border border-zinc-700/50 bg-zinc-950/80 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                  />
                </div>
              </div>
            )}
          </div>
        </FadeIn>

        {/* ── Generate button ── */}
        <FadeIn delay={0.06} className="mb-8">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={runGenerate}
              disabled={generating || !composedPrompt.trim()}
              className={cn(
                "flex items-center justify-center gap-2.5 rounded-2xl px-10 py-4 text-sm font-bold text-white shadow-xl transition-all",
                "bg-linear-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500",
                "shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]",
                "disabled:pointer-events-none disabled:opacity-40",
              )}
            >
              {/* Stable subtree avoids insertBefore errors when swapping SVG icons inside <button> (React 19 + transitions). */}
              <span className="inline-flex items-center gap-2.5">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
                  {generating ? (
                    <Loader2 key="gen-loading" className="h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles key="gen-idle" className="h-5 w-5" />
                  )}
                </span>
                <span>{generating ? "Generating brand sheet..." : "Generate brand sheet"}</span>
              </span>
            </button>
            {hasOutput && !generating && (
              <button type="button" onClick={runGenerate} className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
                <RotateCcw className="inline h-3.5 w-3.5 mr-1" />
                New variation
              </button>
            )}
          </div>
        </FadeIn>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 mx-auto max-w-2xl flex gap-3 rounded-xl border border-red-500/20 bg-red-950/40 p-4 text-sm text-red-200/95">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-400/90" />
            <div>
              <p>{error}</p>
              <p className="mt-1 text-xs text-red-300/60">Make sure GEMINI_API_KEY is set in your .env.local file.</p>
            </div>
          </div>
        )}

        {/* ── Brand sheet image ── */}
        {(hasOutput || generating) && (
          <FadeIn delay={0}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Background</span>
                <div className="flex rounded-lg border border-white/6 bg-zinc-900/60 p-0.5">
                  {(["light", "dark", "checkered"] as PreviewBg[]).map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setPreviewBg(bg)}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all",
                        previewBg === bg ? "bg-white/10 text-zinc-200" : "text-zinc-600 hover:text-zinc-400",
                      )}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
              {activeSrc && !generating && (
                <a
                  href={activeSrc}
                  download={`${s.setup.topic.slice(0, 40).replace(/\s+/g, "-").toLowerCase()}-brand-sheet.png`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> Download PNG
                </a>
              )}
            </div>

            <div className={cn("relative overflow-hidden rounded-2xl border border-zinc-800/60 shadow-2xl shadow-black/40 transition-colors duration-200", bgClasses[previewBg])}>
              {generating && (
                <div className="flex flex-col items-center justify-center gap-4 py-32">
                  <Loader2 className={cn("h-10 w-10 animate-spin", previewBg === "light" ? "text-indigo-500/60" : "text-indigo-400/60")} />
                  <p className={cn("text-sm font-medium", previewBg === "light" ? "text-zinc-400" : "text-zinc-500")}>Creating your brand sheet...</p>
                  <p className={cn("text-xs", previewBg === "light" ? "text-zinc-300" : "text-zinc-600")}>This usually takes 10-20 seconds</p>
                </div>
              )}
              {activeSrc && !generating && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={activeSrc} alt={`Brand sheet for ${s.setup.topic}`} className="w-full h-auto" />
              )}
            </div>
          </FadeIn>
        )}

        {/* ── Empty state ── */}
        {!hasOutput && !generating && (
          <FadeIn delay={0.08}>
            <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/30 py-20 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60">
                <ImageIcon className="h-8 w-8 text-zinc-700" strokeWidth={1.25} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-400">Your brand sheet will appear here</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-600">
                Logo, colors, typography, variations, and mockups — all in one image.
              </p>
            </div>
          </FadeIn>
        )}

        {/* ── Gallery strip ── */}
        {gallery.length > 1 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Variations ({gallery.length})</span>
              <button
                type="button"
                onClick={() => { setGallery([]); setActiveIdx(null); }}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-600 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3 w-3" /> Clear all
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {gallery.map((item, i) => (
                <button
                  key={item.timestamp}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={cn(
                    "group relative shrink-0 overflow-hidden rounded-xl border transition-all",
                    (activeIdx ?? 0) === i
                      ? "border-indigo-400/50 ring-2 ring-indigo-500/30"
                      : "border-zinc-800 hover:border-zinc-600",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.src} alt={`Variant ${i + 1}`} className="h-20 w-32 object-cover bg-white sm:h-24 sm:w-40" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeGalleryItem(i); }}
                    className="absolute right-1 top-1 hidden rounded-full bg-black/70 p-0.5 text-zinc-400 hover:text-red-400 group-hover:block"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────
            Brand Kit (text) — spawns after image is generated
        ──────────────────────────────────────────────────── */}
        {(displayBrandKit || brandKitGenerating) && (
          <div ref={brandKitRef} className="mt-10">
            {/* Section header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/15">
                  <Palette className="h-5 w-5 text-violet-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Brand Kit</h2>
                  <p className="text-xs text-zinc-500">Color palette, typography, logo concepts, and guidelines</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {brandKitGenerating ? (
                  <span className="flex items-center gap-1.5 text-xs text-violet-300">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCopyKit}
                      disabled={!displayBrandKit}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors disabled:opacity-40"
                    >
                      {copyToast ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">{copyToast ? "Copied" : "Copy"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadKit}
                      disabled={!displayBrandKit}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors disabled:opacity-40"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">.md</span>
                    </button>
                    <button
                      type="button"
                      onClick={runBrandKit}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Regenerate</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Brand kit error */}
            {brandKitError && (
              <div className="mb-4 flex gap-3 rounded-xl border border-red-500/20 bg-red-950/40 p-4 text-sm text-red-200/95">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-400/90" />
                {brandKitError}
              </div>
            )}

            {/* Color swatches */}
            {colorSwatches.length > 0 && (
              <div className="mb-6 rounded-xl border border-white/6 bg-zinc-950/40 p-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Color palette</p>
                <div className="flex flex-wrap gap-3">
                  {colorSwatches.map((sw, i) => (
                    <button
                      key={`${sw.hex}-${i}`}
                      type="button"
                      onClick={() => navigator.clipboard.writeText(sw.hex)}
                      title={`Copy ${sw.hex} — ${sw.usage}`}
                      className="group flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors hover:bg-white/4"
                    >
                      <div style={{ backgroundColor: sw.hex }} className="h-12 w-12 rounded-xl border border-white/10 shadow-lg group-hover:scale-105 transition-transform" />
                      <span className="font-mono text-[10px] text-zinc-400 group-hover:text-zinc-200">{sw.hex}</span>
                      <span className="max-w-[80px] truncate text-[10px] text-zinc-600">{sw.token}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Markdown content */}
            <div className="rounded-2xl border border-white/7 bg-linear-to-b from-zinc-900/80 to-zinc-950/90 shadow-2xl shadow-black/50 overflow-hidden">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-violet-500/35 to-transparent" />
              <div className="p-6 sm:p-8">
                <div className="prose prose-invert prose-sm max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-white/6 prose-h2:pb-2 prose-h3:mt-5 prose-h3:mb-2 prose-p:leading-relaxed prose-p:text-zinc-400 prose-strong:text-white/90 prose-li:text-zinc-400 prose-code:rounded-md prose-code:bg-zinc-800/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-indigo-200/90 prose-code:before:content-[''] prose-code:after:content-[''] prose-table:text-sm prose-th:bg-zinc-800/50 prose-th:text-zinc-300 prose-td:text-zinc-400">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayBrandKit}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ────────────────────────────────────────────────────────────

export default function BrandStudioPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center bg-[#08080e]"><Loader2 className="h-8 w-8 animate-spin text-indigo-500/50" /></div>}>
      <BrandStudioInner />
    </Suspense>
  );
}
