"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  ArrowLeft,
  ArrowRight,
  Copy,
  CheckCircle2,
  Loader2,
  Download,
  Globe,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  Palette,
  Code2,
  Eye,
  RotateCcw,
  LayoutTemplate,
  Wand2,
} from "lucide-react";
import { loadSessionWithStatus } from "@/lib/session";
import { injectLandingPageKit } from "@/lib/landing-page-html-inject";
import {
  CURATED_LANDING_TEMPLATE_IDS,
  DEFAULT_LANDING_TEMPLATE,
  LANDING_TEMPLATE_LABELS,
  type CuratedLandingTemplateId,
  type LandingTemplateId,
} from "@/lib/landing-templates/types";
import { getLandingTemplatePreviewHtml } from "@/lib/landing-templates/template-preview";
import { GradientMesh } from "@/components/ui/animated-background";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { LandingImageRef } from "@/lib/landing-images";
import type { ValidationSession } from "@/lib/types";

type PreviewSize = "desktop" | "tablet" | "mobile";
type ViewMode = "preview" | "code";

const PREVIEW_WIDTHS: Record<PreviewSize, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

/** Gallery iframes use a desktop layout width so templates hit desktop breakpoints; scaled to fit each card. */
const GALLERY_VIEWPORT_W = 1280;
const GALLERY_VIEWPORT_H = 800;
const GALLERY_FRAME_W = 380;
const GALLERY_SCALE = GALLERY_FRAME_W / GALLERY_VIEWPORT_W;

/** Per-template accent colors for the gallery cards */
const TEMPLATE_ACCENTS: Record<string, { border: string; hoverBorder: string; glow: string; text: string; bg: string; badge: string }> = {
  "saas-nova": {
    border: "border-violet-500/15",
    hoverBorder: "hover:border-violet-500/40",
    glow: "shadow-violet-500/10",
    text: "text-violet-400",
    bg: "from-violet-500/8 via-transparent to-indigo-500/4",
    badge: "bg-violet-500/15 text-violet-300 border-violet-500/25",
  },
  "editorial-aurora": {
    border: "border-amber-500/15",
    hoverBorder: "hover:border-amber-500/35",
    glow: "shadow-amber-500/8",
    text: "text-amber-400",
    bg: "from-amber-500/8 via-transparent to-orange-500/4",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  },
  "bento-prism": {
    border: "border-cyan-500/15",
    hoverBorder: "hover:border-cyan-500/40",
    glow: "shadow-cyan-500/10",
    text: "text-cyan-400",
    bg: "from-cyan-500/8 via-transparent to-violet-500/4",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
  },
  "startup-horizon": {
    border: "border-rose-500/15",
    hoverBorder: "hover:border-rose-500/40",
    glow: "shadow-rose-500/10",
    text: "text-rose-400",
    bg: "from-rose-500/8 via-transparent to-orange-500/4",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/25",
  },
  "minimal-slate": {
    border: "border-zinc-400/15",
    hoverBorder: "hover:border-zinc-400/40",
    glow: "shadow-zinc-400/10",
    text: "text-zinc-300",
    bg: "from-zinc-400/8 via-transparent to-blue-500/4",
    badge: "bg-zinc-400/15 text-zinc-200 border-zinc-400/25",
  },
};

// ── Loading progress steps (template mode = faster — copy only) ──
const LOADING_STEPS_TEMPLATE = [
  { label: "Reading your positioning", duration: 2000 },
  { label: "Writing headlines & sections", duration: 6000 },
  { label: "Filling the designer template", duration: 4000 },
  { label: "Almost ready", duration: 2000 },
];
const LOADING_STEPS_CUSTOM = [
  { label: "Analyzing your validation data", duration: 3000 },
  { label: "Selecting layout archetype", duration: 2500 },
  { label: "Generating conversion-optimized copy", duration: 8000 },
  { label: "Building responsive components", duration: 10000 },
  { label: "Adding animations & micro-interactions", duration: 8000 },
  { label: "Polishing typography & spacing", duration: 6000 },
  { label: "Optimizing for mobile", duration: 5000 },
  { label: "Final quality checks", duration: 4000 },
];

export default function LandingGeneratorPage() {
  const router = useRouter();
  const [session, setSession] = useState<ValidationSession | null>(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState(false);
  const [previewSize, setPreviewSize] = useState<PreviewSize>("desktop");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [revealPreview, setRevealPreview] = useState(false);
  const [landingTemplate, setLandingTemplate] = useState<LandingTemplateId>(DEFAULT_LANDING_TEMPLATE);
  /** After gallery: user chose a template (or custom) and sees the generate step */
  const [templatePicked, setTemplatePicked] = useState(false);
  /** Which template produced the current HTML (for color tweaks + inject rules) */
  const [generatedWithTemplate, setGeneratedWithTemplate] = useState<LandingTemplateId | null>(null);
  /** Pool for gallery previews; undefined = fetch not finished */
  const [previewImagePool, setPreviewImagePool] = useState<LandingImageRef[] | undefined>(undefined);
  /** Whether that pool is built-in stills (same as merged HTML) vs topic search from Unsplash */
  const [previewHeroFromFallback, setPreviewHeroFromFallback] = useState<boolean | undefined>(undefined);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const loadingSteps = useMemo(
    () => (landingTemplate === "custom" ? LOADING_STEPS_CUSTOM : LOADING_STEPS_TEMPLATE),
    [landingTemplate]
  );

  useEffect(() => {
    const result = loadSessionWithStatus();
    if (result.status === "expired") {
      alert("Your session has expired (24h limit). Please start a new validation.");
      router.replace("/validate");
      return;
    }
    if (result.status === "none") { router.replace("/validate"); return; }
    const s = result.session;
    if (s.setup.template === "generate") { router.replace("/validate"); return; }
    setSession(s);
  }, [router]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setPreviewImagePool(undefined);
    setPreviewHeroFromFallback(undefined);
    fetch(
      `/api/landing-preview-images?topic=${encodeURIComponent(session.setup.topic)}&position=${encodeURIComponent(session.setup.position || "")}`
    )
      .then((r) => r.json())
      .then((d: { images?: LandingImageRef[]; usedFallback?: boolean }) => {
        if (!cancelled) {
          setPreviewImagePool(Array.isArray(d.images) ? d.images : []);
          setPreviewHeroFromFallback(
            typeof d.usedFallback === "boolean" ? d.usedFallback : true
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewImagePool([]);
          setPreviewHeroFromFallback(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const templatePreviewHtml = useMemo(() => {
    if (!session) return {} as Record<CuratedLandingTemplateId, string>;
    const map = {} as Record<CuratedLandingTemplateId, string>;
    const opts = {
      topic: session.setup.topic,
      position: session.setup.position,
      images: previewImagePool && previewImagePool.length > 0 ? previewImagePool : undefined,
    };
    for (const id of CURATED_LANDING_TEMPLATE_IDS) {
      map[id] = getLandingTemplatePreviewHtml(id, opts);
    }
    return map;
  }, [session, previewImagePool]);

  // ── Loading step animation ──
  useEffect(() => {
    if (!isGenerating) {
      setLoadingStep(0);
      setLoadingProgress(0);
      return;
    }

    // Progress bar fills smoothly
    const totalDuration = loadingSteps.reduce((a, s) => a + s.duration, 0);
    let elapsed = 0;
    const progressInterval = setInterval(() => {
      elapsed += 100;
      const pct = Math.min(95, (elapsed / totalDuration) * 100);
      setLoadingProgress(pct);
    }, 100);

    // Step through labels
    let accum = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    loadingSteps.forEach((s, i) => {
      if (i === 0) return;
      accum += loadingSteps[i - 1].duration;
      timers.push(setTimeout(() => { setLoadingStep(i); }, accum));
    });

    return () => {
      clearInterval(progressInterval);
      timers.forEach(clearTimeout);
    };
  }, [isGenerating, loadingSteps]);

  const handleGenerate = useCallback(async () => {
    if (!session) return;
    setIsGenerating(true);
    setError(null);
    setHtmlContent("");
    setRevealPreview(false);

    // Collect ALL streamed content silently, only set htmlContent when done
    let fullContent = "";

    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "landing-page",
          setup: session.setup,
          validationContent: session.validationContent,
          landingTemplateId: landingTemplate,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || `Server error (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) fullContent += parsed.content;
              if (parsed.error) throw new Error(parsed.error);
            } catch (e) {
              if (e instanceof Error && e.message !== "Stream interrupted") {
                /* skip parse errors */
              } else throw e;
            }
          }
        }
      }

      if (!fullContent) throw new Error("No content received");

      const stitched =
        landingTemplate === "custom"
          ? injectLandingPageKit(fullContent)
          : fullContent;

      // Set progress to 100% then reveal
      setLoadingProgress(100);
      setLoadingStep(loadingSteps.length - 1);

      // Small delay for the progress bar to hit 100% visually
      await new Promise(r => setTimeout(r, 600));

      setHtmlContent(stitched);
      setGeneratedWithTemplate(landingTemplate);
      setIsGenerating(false);

      // Smooth reveal after iframe has a moment to render
      setTimeout(() => setRevealPreview(true), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate landing page.");
      setHtmlContent("");
      setIsGenerating(false);
    }
  }, [session, landingTemplate, loadingSteps]);

  const handleCopyHtml = useCallback(() => {
    if (!htmlContent) return;
    navigator.clipboard.writeText(htmlContent).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    });
  }, [htmlContent]);

  const handleDownload = useCallback(() => {
    if (!session || !htmlContent) return;
    const slug = session.setup.topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 50);
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-landing-page.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [session, htmlContent]);

  const applyColorChange = useCallback(
    (color: string) => {
      setPrimaryColor(color);
      if (!htmlContent) return;
      let updated = htmlContent.replace(/#6366f1/gi, color);
      if (generatedWithTemplate === "saas-nova") {
        updated = updated.replace(/#7c3aed/gi, color).replace(/#4f46e5/gi, color);
      }
      if (generatedWithTemplate === "editorial-aurora") {
        updated = updated.replace(/#c2410c/gi, color).replace(/#ea580c/gi, color);
      }
      if (generatedWithTemplate === "bento-prism") {
        updated = updated
          .replace(/#22d3ee/gi, color)
          .replace(/#06b6d4/gi, color)
          .replace(/#a78bfa/gi, color)
          .replace(/#8b5cf6/gi, color);
      }
      setHtmlContent(updated);
    },
    [htmlContent, generatedWithTemplate]
  );

  if (!session) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#08080e]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500/50" />
      </div>
    );
  }

  const isReady = htmlContent && !isGenerating;

  return (
    <div className="relative min-h-dvh bg-[#08080e]">
      <GradientMesh className="opacity-40" />
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-[#08080e]/80 backdrop-blur-xl border-b border-white/6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="hidden sm:inline text-sm font-semibold text-white/70 group-hover:text-white transition-colors">
                Priority Debater
              </span>
            </Link>
            <span className="text-white/10 hidden sm:inline">/</span>
            <span className="text-sm text-white/30 truncate hidden sm:inline">Landing Page</span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/results"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white/30 hover:text-white/60 rounded-lg hover:bg-white/4 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Results</span>
            </Link>
            {isReady && (
              <>
                <button
                  onClick={handleCopyHtml}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white/30 hover:text-white/60 rounded-lg hover:bg-white/4 transition-all"
                  title="Copy HTML"
                >
                  {copyToast ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{copyToast ? "Copied!" : "Copy"}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white/30 hover:text-white/60 rounded-lg hover:bg-white/4 transition-all"
                  title="Download HTML"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </button>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ── PRE-GENERATION: template gallery → generate ── */}
        {!htmlContent && !isGenerating && (
          <>
            {!templatePicked ? (
              <div className="max-w-[1320px] mx-auto">
                {/* Compact header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
                  <div className="min-w-0">
                    <p className="text-white/30 text-xs font-medium uppercase tracking-wider mb-1.5">Landing page for</p>
                    <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{session.setup.topic}</h1>
                  </div>
                  <p className="text-white/25 text-xs shrink-0">
                    Pick a design — AI writes your copy
                  </p>
                </div>

                {/* Template grid — 3 curated templates */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
                  {CURATED_LANDING_TEMPLATE_IDS.map((id) => {
                    const meta = LANDING_TEMPLATE_LABELS[id];
                    const accent = TEMPLATE_ACCENTS[id] ?? TEMPLATE_ACCENTS["saas-nova"];
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setLandingTemplate(id);
                          setTemplatePicked(true);
                        }}
                        className={`group text-left rounded-2xl border ${accent.border} ${accent.hoverBorder} bg-[#0a0a12] overflow-hidden transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 hover:shadow-lg ${accent.glow} hover:-translate-y-1`}
                      >
                        {/* Preview area */}
                        <div className={`relative bg-linear-to-b ${accent.bg} to-transparent`}>
                          <div className="flex justify-center pt-5 pb-3 px-4">
                            <div
                              className="relative overflow-hidden rounded-xl bg-black ring-1 ring-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8)]"
                              style={{
                                width: GALLERY_FRAME_W,
                                height: Math.round(GALLERY_VIEWPORT_H * GALLERY_SCALE),
                              }}
                            >
                              <iframe
                                title={`Preview — ${meta.title}`}
                                srcDoc={templatePreviewHtml[id]}
                                width={GALLERY_VIEWPORT_W}
                                height={GALLERY_VIEWPORT_H}
                                className="absolute left-0 top-0 border-0 pointer-events-none bg-black"
                                style={{
                                  transform: `scale(${GALLERY_SCALE})`,
                                  transformOrigin: "top left",
                                }}
                                sandbox="allow-scripts"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="px-5 pt-3 pb-5">
                          <div className="flex items-center gap-2.5 mb-2">
                            <span className="text-[15px] font-semibold text-white/90">{meta.title}</span>
                            {id === DEFAULT_LANDING_TEMPLATE && (
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${accent.badge}`}>
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/38 leading-relaxed mb-3">{meta.description}</p>
                          <div className={`text-[11px] font-semibold ${accent.text} opacity-70 group-hover:opacity-100 flex items-center gap-1 transition-opacity`}>
                            Use this template
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom / AI option — compact bar */}
                <div className="max-w-[1320px] mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setLandingTemplate("custom");
                      setTemplatePicked(true);
                    }}
                    className="group w-full flex items-center gap-4 rounded-xl border border-white/6 bg-white/[0.02] hover:bg-white/[0.04] hover:border-violet-500/25 px-5 py-4 text-left transition-all"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <Wand2 className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-white/80">{LANDING_TEMPLATE_LABELS.custom.title}</span>
                      <span className="text-[10px] uppercase tracking-wider text-violet-400/70 ml-2">Experimental</span>
                      <p className="text-[11px] text-white/30 leading-relaxed mt-0.5 hidden sm:block">Full page generated by AI — more variety, less predictable structure.</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-violet-400 shrink-0 transition-colors" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto pt-4">
                <div className="text-center mb-8">
                  <p className="text-white/30 text-xs font-medium uppercase tracking-wider mb-1.5">Landing page for</p>
                  <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">{session.setup.topic}</h1>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 sm:p-8">
                  {/* Selected template */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                        landingTemplate === "custom" ? "bg-violet-500/10 border-violet-500/20" : "bg-teal-500/10 border-teal-500/20"
                      }`}>
                        {landingTemplate === "custom" ? (
                          <Wand2 className="w-5 h-5 text-violet-400" />
                        ) : (
                          <LayoutTemplate className="w-5 h-5 text-teal-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white/90">{LANDING_TEMPLATE_LABELS[landingTemplate].title}</p>
                        <p className="text-[11px] text-white/35">
                          {landingTemplate === "custom" ? "AI builds the full page" : "AI writes copy for this design"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTemplatePicked(false)}
                      className="text-xs font-medium text-white/30 hover:text-white/60 transition-colors"
                    >
                      Change
                    </button>
                  </div>

                  {/* What you get — compact pills */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {["Responsive", "Your copy", "Stock photos", "Email CTAs", "Single HTML file"].map((tag) => (
                      <span key={tag} className="text-[10px] font-medium text-white/35 bg-white/4 border border-white/6 rounded-full px-2.5 py-1">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Generate button */}
                  <button
                    onClick={handleGenerate}
                    className="w-full inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold transition-all shadow-lg shadow-teal-500/25 text-sm group"
                  >
                    <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    Generate Landing Page
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── LOADING STATE — full-screen beautiful loader ── */}
        {isGenerating && (
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Building your page
              </h1>
              <p className="text-white/30 text-sm">{session.setup.topic}</p>
            </div>

            <div className="relative rounded-2xl bg-white/2 border border-white/6 p-8 sm:p-10 overflow-hidden">
              {/* Animated background gradient */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-linear-to-br from-teal-500/20 via-transparent to-emerald-500/10 animate-pulse" style={{ animationDuration: "3s" }} />
              </div>

              <div className="relative">
                {/* Spinning loader */}
                <div className="flex justify-center mb-8">
                  <div className="relative w-20 h-20">
                    {/* Outer ring */}
                    <svg className="w-20 h-20 animate-spin" style={{ animationDuration: "3s" }} viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(20,184,166,0.15)" strokeWidth="3" />
                      <circle cx="40" cy="40" r="36" fill="none" stroke="url(#tealGrad)" strokeWidth="3"
                        strokeDasharray={`${loadingProgress * 2.26} 226`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                      <defs>
                        <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#14b8a6" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>
                    {/* Center percentage */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-teal-400">{Math.round(loadingProgress)}%</span>
                    </div>
                  </div>
                </div>

                {/* Current step */}
                <div className="text-center mb-6">
                  <p className="text-white/70 text-sm font-medium mb-1">
                    {loadingSteps[loadingStep]?.label || "Finalizing..."}
                  </p>
                  <p className="text-white/20 text-xs">
                    Step {loadingStep + 1} of {loadingSteps.length}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-white/6 rounded-full overflow-hidden mb-6">
                  <div
                    className="h-full bg-linear-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>

                {/* Step list */}
                <div className="space-y-2">
                  {loadingSteps.map((step, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 text-xs transition-all duration-300 ${
                        i < loadingStep
                          ? "text-teal-400/60"
                          : i === loadingStep
                          ? "text-white/70"
                          : "text-white/15"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        i < loadingStep
                          ? "bg-teal-500/20"
                          : i === loadingStep
                          ? "bg-teal-500/10 ring-2 ring-teal-500/30"
                          : "bg-white/4"
                      }`}>
                        {i < loadingStep ? (
                          <CheckCircle2 className="w-3 h-3 text-teal-400" />
                        ) : i === loadingStep ? (
                          <Loader2 className="w-3 h-3 animate-spin text-teal-400" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        )}
                      </div>
                      <span>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <span className="flex-1">{error}</span>
            <button
              onClick={() => { setError(null); handleGenerate(); }}
              className="text-sm font-medium underline hover:no-underline shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── PREVIEW AREA — only shows when fully generated ── */}
        {isReady && (
          <div className={`transition-all duration-700 ease-out ${revealPreview ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
                {session.setup.topic}
              </h1>
              <p className="text-white/30 text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Landing page generated successfully
              </p>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2">
                {/* Preview / Code toggle */}
                <div className="flex items-center bg-white/4 border border-white/6 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("preview")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      viewMode === "preview"
                        ? "bg-white/8 text-white"
                        : "text-white/30 hover:text-white/50"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => setViewMode("code")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      viewMode === "code"
                        ? "bg-white/8 text-white"
                        : "text-white/30 hover:text-white/50"
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    Code
                  </button>
                </div>

                {/* Preview size toggles — only in preview mode */}
                {viewMode === "preview" && (
                  <div className="flex items-center bg-white/4 border border-white/6 rounded-xl p-1">
                    {(["desktop", "tablet", "mobile"] as PreviewSize[]).map((size) => {
                      const Icon = size === "desktop" ? Monitor : size === "tablet" ? Tablet : Smartphone;
                      return (
                        <button
                          key={size}
                          onClick={() => setPreviewSize(size)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            previewSize === size
                              ? "bg-white/8 text-white"
                              : "text-white/30 hover:text-white/50"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline capitalize">{size}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Color picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                      showColorPicker
                        ? "bg-white/8 text-white border-white/10"
                        : "text-white/30 hover:text-white/50 border-white/6 bg-white/4"
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <span className="hidden sm:inline">Colors</span>
                  </button>
                  {showColorPicker && (
                    <div className="absolute top-full left-0 mt-2 p-4 rounded-xl bg-[#141420] border border-white/8 shadow-2xl z-20 min-w-[220px]">
                      <p className="text-xs text-white/40 mb-3 font-medium">Brand Color</p>
                      <div className="flex items-center gap-3 mb-3">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg bg-white/6 border border-white/8 text-white text-xs font-mono"
                        />
                      </div>
                      <div className="flex gap-2 flex-wrap mb-3">
                        {["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#22c55e", "#f97316", "#0ea5e9"].map(
                          (color) => (
                            <button
                              key={color}
                              onClick={() => setPrimaryColor(color)}
                              className={`w-7 h-7 rounded-lg border-2 transition-all ${
                                primaryColor === color ? "border-white scale-110" : "border-white/10 hover:border-white/30"
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          )
                        )}
                      </div>
                      <button
                        onClick={() => {
                          applyColorChange(primaryColor);
                          setShowColorPicker(false);
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition-all"
                      >
                        Apply Color
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/4 border border-white/6 text-xs font-medium text-white/30 hover:text-white/60 hover:bg-white/6 transition-all"
                  title="Regenerate"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Regenerate</span>
                </button>
                <button
                  onClick={handleCopyHtml}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/4 border border-white/6 text-xs font-medium text-white/40 hover:text-white/60 hover:bg-white/6 transition-all"
                >
                  {copyToast ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copyToast ? "Copied!" : "Copy HTML"}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download HTML
                </button>
              </div>
            </div>

            {/* Preview mode — iframe */}
            {viewMode === "preview" && (
              <div
                className="mx-auto transition-all duration-300 ease-in-out"
                style={{ maxWidth: PREVIEW_WIDTHS[previewSize] }}
              >
                {/* Browser chrome mockup */}
                <div className="rounded-2xl border border-white/8 overflow-hidden shadow-2xl shadow-black/50">
                  {/* Browser top bar */}
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0e0e16] border-b border-white/6">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="flex items-center gap-2 px-4 py-1 rounded-lg bg-white/4 border border-white/6 text-white/25 text-xs max-w-sm w-full">
                        <Globe className="w-3 h-3 shrink-0" />
                        <span className="truncate">{session.setup.topic.toLowerCase().replace(/\s+/g, "-")}.com</span>
                      </div>
                    </div>
                  </div>
                  {/* iframe */}
                  <iframe
                    ref={iframeRef}
                    srcDoc={htmlContent}
                    title="Landing page preview"
                    className="w-full border-0 bg-[#07070c] block"
                    style={{ height: "80vh", minHeight: "600px" }}
                    sandbox="allow-scripts allow-forms allow-popups allow-downloads"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            )}

            {/* Code mode — syntax view */}
            {viewMode === "code" && (
              <div className="rounded-2xl border border-white/8 overflow-hidden bg-[#0a0a14]">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/6 bg-white/2">
                  <span className="text-xs text-white/30 font-mono">index.html</span>
                  <span className="text-xs text-white/15">{(new Blob([htmlContent])).size > 1024 ? `${Math.round(new Blob([htmlContent]).size / 1024)}KB` : `${new Blob([htmlContent]).size}B`}</span>
                </div>
                <pre className="p-4 overflow-auto max-h-[70vh] text-xs text-white/50 font-mono leading-relaxed whitespace-pre-wrap wrap-break-word">
                  {htmlContent}
                </pre>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
