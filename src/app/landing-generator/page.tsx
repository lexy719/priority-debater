"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
} from "lucide-react";
import { loadSessionWithStatus } from "@/lib/session";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { ValidationSession } from "@/lib/types";

type PreviewSize = "desktop" | "tablet" | "mobile";
type ViewMode = "preview" | "code";

const PREVIEW_WIDTHS: Record<PreviewSize, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

// ── Loading progress steps ──
const LOADING_STEPS = [
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (stepIdx >= LOADING_STEPS.length - 1) return;
      stepIdx++;
      setLoadingStep(stepIdx);
    };

    // Progress bar fills smoothly
    const totalDuration = LOADING_STEPS.reduce((a, s) => a + s.duration, 0);
    let elapsed = 0;
    progressInterval = setInterval(() => {
      elapsed += 100;
      const pct = Math.min(95, (elapsed / totalDuration) * 100);
      setLoadingProgress(pct);
    }, 100);

    // Step through labels
    let accum = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    LOADING_STEPS.forEach((s, i) => {
      if (i === 0) return;
      accum += LOADING_STEPS[i - 1].duration;
      timers.push(setTimeout(() => { setLoadingStep(i); }, accum));
    });

    return () => {
      clearInterval(progressInterval);
      timers.forEach(clearTimeout);
    };
  }, [isGenerating]);

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

      // Set progress to 100% then reveal
      setLoadingProgress(100);
      setLoadingStep(LOADING_STEPS.length - 1);

      // Small delay for the progress bar to hit 100% visually
      await new Promise(r => setTimeout(r, 600));

      setHtmlContent(fullContent);
      setIsGenerating(false);

      // Smooth reveal after iframe has a moment to render
      setTimeout(() => setRevealPreview(true), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate landing page.");
      setHtmlContent("");
      setIsGenerating(false);
    }
  }, [session]);

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
      const updated = htmlContent.replace(/#6366f1/gi, color);
      setHtmlContent(updated);
    },
    [htmlContent]
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
    <div className="min-h-screen min-h-[100dvh] bg-[#08080e]">
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

        {/* ── PRE-GENERATION CTA ── */}
        {!htmlContent && !isGenerating && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {session.setup.topic}
              </h1>
              <p className="text-white/30 text-sm">Landing Page Generator</p>
            </div>

            <div className="relative rounded-2xl bg-gradient-to-br from-teal-500/8 to-emerald-500/8 border border-teal-500/15 p-8 sm:p-10 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(20,184,166,0.06)_0%,_transparent_50%)]" />
              <div className="relative">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/25 flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-8 h-8 text-teal-400" />
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 text-center">
                  Generate a production-ready landing page
                </h2>
                <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-lg mx-auto text-center">
                  Our AI analyzes your validation report — scores, target customer, competitive advantages, risks —
                  and builds a complete, deployable marketing page with conversion-optimized copy,
                  responsive design, and animated visuals tailored to your specific business.
                </p>

                {/* What you get grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                  {[
                    { icon: "🎨", title: "Unique Design", desc: "Different layout each time" },
                    { icon: "📱", title: "Fully Responsive", desc: "Mobile, tablet & desktop" },
                    { icon: "✍️", title: "Real Copy", desc: "From your actual data" },
                    { icon: "✨", title: "Animations", desc: "Smooth scroll & hover effects" },
                    { icon: "🎯", title: "Conversion CTAs", desc: "Email capture & waitlist" },
                    { icon: "📦", title: "Single HTML File", desc: "Download & host anywhere" },
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
                    {LOADING_STEPS[loadingStep]?.label || "Finalizing..."}
                  </p>
                  <p className="text-white/20 text-xs">
                    Step {loadingStep + 1} of {LOADING_STEPS.length}
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
                  {LOADING_STEPS.map((step, i) => (
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
