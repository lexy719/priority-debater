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
import type { ValidationSession } from "@/lib/types";

type PreviewSize = "desktop" | "tablet" | "mobile";
type ViewMode = "preview" | "code";

const PREVIEW_WIDTHS: Record<PreviewSize, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadingSteps = useMemo(
    () => (landingTemplate === "custom" ? LOADING_STEPS_CUSTOM : LOADING_STEPS_TEMPLATE),
    [landingTemplate]
  );

  const templatePreviewHtml = useMemo(() => {
    const map = {} as Record<CuratedLandingTemplateId, string>;
    for (const id of CURATED_LANDING_TEMPLATE_IDS) {
      map[id] = getLandingTemplatePreviewHtml(id);
    }
    return map;
  }, []);

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

  // ── Loading step animation ──
  useEffect(() => {
    if (!isGenerating) {
      setLoadingStep(0);
      setLoadingProgress(0);
      return;
    }

    let stepIdx = 0;
    let progressInterval: ReturnType<typeof setInterval>;

    const advanceStep = () => {
      if (stepIdx >= loadingSteps.length - 1) return;
      stepIdx++;
      setLoadingStep(stepIdx);
    };

    // Progress bar fills smoothly
    const totalDuration = loadingSteps.reduce((a, s) => a + s.duration, 0);
    let elapsed = 0;
    progressInterval = setInterval(() => {
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
      <div className="min-h-screen flex items-center justify-center bg-[#08080e]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500/50" />
      </div>
    );
  }

  const isReady = htmlContent && !isGenerating;

  return (
    <div className="relative min-h-screen min-h-[100dvh] bg-[#08080e]">
      <GradientMesh className="opacity-40" />
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-[#08080e]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white/30 hover:text-white/60 rounded-lg hover:bg-white/[0.04] transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Results</span>
            </Link>
            {isReady && (
              <>
                <button
                  onClick={handleCopyHtml}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white/30 hover:text-white/60 rounded-lg hover:bg-white/[0.04] transition-all"
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
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white/30 hover:text-white/60 rounded-lg hover:bg-white/[0.04] transition-all"
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
            <div className="text-center mb-8 max-w-3xl mx-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {session.setup.topic}
              </h1>
              <p className="text-white/30 text-sm">Landing Page Generator</p>
            </div>

            {!templatePicked ? (
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    Choose a template
                  </h2>
                  <p className="text-white/40 text-sm max-w-2xl mx-auto leading-relaxed">
                    Each layout is a full, responsive page with real photography. Previews use sample copy;
                    after you pick one, we replace every headline and paragraph with copy from your idea and validation.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {CURATED_LANDING_TEMPLATE_IDS.map((id) => {
                    const meta = LANDING_TEMPLATE_LABELS[id];
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setLandingTemplate(id);
                          setTemplatePicked(true);
                        }}
                        className="group text-left rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-teal-500/35 hover:bg-white/[0.04] overflow-hidden transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
                      >
                        <div className="relative h-[220px] sm:h-[240px] overflow-hidden bg-[#07070c] border-b border-white/[0.06]">
                          <iframe
                            title={`Preview ${meta.title}`}
                            srcDoc={templatePreviewHtml[id]}
                            className="absolute left-0 top-0 w-[620px] h-[880px] border-0 pointer-events-none bg-[#07070c]"
                            style={{
                              transform: "scale(0.36)",
                              transformOrigin: "top left",
                            }}
                            sandbox="allow-scripts"
                          />
                          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.35)]" />
                        </div>
                        <div className="p-4 sm:p-5">
                          <div className="flex items-center gap-2 mb-1.5">
                            <LayoutTemplate className="w-4 h-4 text-teal-400 shrink-0" />
                            <span className="text-sm font-semibold text-white/90">{meta.title}</span>
                            {id === DEFAULT_LANDING_TEMPLATE && (
                              <span className="text-[10px] font-medium uppercase tracking-wider text-teal-400/90 ml-auto">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/40 leading-relaxed">{meta.description}</p>
                          <p className="mt-3 text-[11px] font-medium text-teal-400/80 group-hover:text-teal-400">
                            Use this template →
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLandingTemplate("custom");
                    setTemplatePicked(true);
                  }}
                  className="w-full max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 p-6 sm:p-7 text-left hover:border-violet-500/35 transition-all"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/25">
                    <Wand2 className="w-7 h-7 text-violet-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white/90">{LANDING_TEMPLATE_LABELS.custom.title}</span>
                      <span className="text-[10px] uppercase tracking-wider text-violet-400/90">Experimental</span>
                    </div>
                    <p className="text-xs text-white/45 leading-relaxed">{LANDING_TEMPLATE_LABELS.custom.description}</p>
                  </div>
                  <span className="text-sm font-medium text-violet-300 shrink-0">Continue →</span>
                </button>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                <div className="relative rounded-2xl bg-gradient-to-br from-teal-500/8 to-emerald-500/8 border border-teal-500/15 p-8 sm:p-10 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(20,184,166,0.06)_0%,_transparent_50%)]" />
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/25 flex items-center justify-center mx-auto mb-6">
                      <Globe className="w-8 h-8 text-teal-400" />
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 text-center">
                      Ready to generate
                    </h2>
                    <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-lg mx-auto text-center">
                      {landingTemplate === "custom" ? (
                        <>
                          <strong className="text-white/60">Custom</strong> — full page from our component kit (more variety, less predictable polish).
                        </>
                      ) : (
                        <>
                          <strong className="text-white/60">{LANDING_TEMPLATE_LABELS[landingTemplate].title}</strong> — we keep this layout and imagery; AI writes your headlines, body, and CTAs from your validation.
                        </>
                      )}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs text-white/55">
                        {landingTemplate === "custom" ? (
                          <Wand2 className="w-3.5 h-3.5 text-violet-400" />
                        ) : (
                          <LayoutTemplate className="w-3.5 h-3.5 text-teal-400" />
                        )}
                        <span className="font-medium">{LANDING_TEMPLATE_LABELS[landingTemplate].title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTemplatePicked(false)}
                        className="text-xs font-medium text-white/35 hover:text-white/60 underline underline-offset-2"
                      >
                        Change template
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                      {[
                        {
                          icon: "🎨",
                          title: landingTemplate === "custom" ? "AI layout" : "Designer layout",
                          desc: landingTemplate === "custom" ? "Built from our HTML kit" : "Fixed premium structure",
                        },
                        { icon: "📱", title: "Fully responsive", desc: "Mobile, tablet & desktop" },
                        { icon: "✍️", title: "Your copy", desc: "From your idea + validation" },
                        { icon: "🖼️", title: "Stock imagery", desc: "Unsplash when configured" },
                        { icon: "🎯", title: "Conversion CTAs", desc: "Email capture & sections" },
                        { icon: "📦", title: "Single HTML file", desc: "Download & host anywhere" },
                      ].map((item) => (
                        <div key={item.title} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                          <div className="text-lg mb-1">{item.icon}</div>
                          <div className="text-xs font-semibold text-white/70 mb-0.5">{item.title}</div>
                          <div className="text-[10px] text-white/30">{item.desc}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={handleGenerate}
                        className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold transition-all shadow-lg shadow-teal-500/25 text-sm group"
                      >
                        <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        Generate My Landing Page
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
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

            <div className="relative rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 sm:p-10 overflow-hidden">
              {/* Animated background gradient */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-transparent to-emerald-500/10 animate-pulse" style={{ animationDuration: "3s" }} />
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
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-6">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
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
                          : "bg-white/[0.04]"
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
                <div className="flex items-center bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("preview")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      viewMode === "preview"
                        ? "bg-white/[0.08] text-white"
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
                        ? "bg-white/[0.08] text-white"
                        : "text-white/30 hover:text-white/50"
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    Code
                  </button>
                </div>

                {/* Preview size toggles — only in preview mode */}
                {viewMode === "preview" && (
                  <div className="flex items-center bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
                    {(["desktop", "tablet", "mobile"] as PreviewSize[]).map((size) => {
                      const Icon = size === "desktop" ? Monitor : size === "tablet" ? Tablet : Smartphone;
                      return (
                        <button
                          key={size}
                          onClick={() => setPreviewSize(size)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            previewSize === size
                              ? "bg-white/[0.08] text-white"
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
                        ? "bg-white/[0.08] text-white border-white/[0.1]"
                        : "text-white/30 hover:text-white/50 border-white/[0.06] bg-white/[0.04]"
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
                    <div className="absolute top-full left-0 mt-2 p-4 rounded-xl bg-[#141420] border border-white/[0.08] shadow-2xl z-20 min-w-[220px]">
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
                          className="flex-1 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white text-xs font-mono"
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
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                  title="Regenerate"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Regenerate</span>
                </button>
                <button
                  onClick={handleCopyHtml}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-all"
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
                <div className="rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl shadow-black/50">
                  {/* Browser top bar */}
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0e0e16] border-b border-white/[0.06]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="flex items-center gap-2 px-4 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/25 text-xs max-w-sm w-full">
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
              <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-[#0a0a14]">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
                  <span className="text-xs text-white/30 font-mono">index.html</span>
                  <span className="text-xs text-white/15">{(new Blob([htmlContent])).size > 1024 ? `${Math.round(new Blob([htmlContent]).size / 1024)}KB` : `${new Blob([htmlContent]).size}B`}</span>
                </div>
                <pre className="p-4 overflow-auto max-h-[70vh] text-xs text-white/50 font-mono leading-relaxed whitespace-pre-wrap break-words">
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
