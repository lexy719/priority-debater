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
} from "lucide-react";
import { loadSession } from "@/lib/session";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { ValidationSession } from "@/lib/types";

type PreviewSize = "desktop" | "tablet" | "mobile";

const PREVIEW_WIDTHS: Record<PreviewSize, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export default function LandingGeneratorPage() {
  const router = useRouter();
  const [session, setSession] = useState<ValidationSession | null>(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState(false);
  const [previewSize, setPreviewSize] = useState<PreviewSize>("desktop");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const s = loadSession();
    if (!s || s.setup.template === "generate") {
      router.replace("/validate");
      return;
    }
    setSession(s);
  }, [router]);

  const handleGenerate = useCallback(async () => {
    if (!session) return;
    setIsGenerating(true);
    setError(null);
    setStreamingContent("");
    setHtmlContent("");

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
      let content = "";

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
              if (parsed.content) {
                content += parsed.content;
                setStreamingContent(content);
              }
              if (parsed.error) throw new Error(parsed.error);
            } catch (e) {
              if (e instanceof Error && e.message !== "Stream interrupted") {
                /* skip parse errors */
              } else throw e;
            }
          }
        }
      }

      if (!content) throw new Error("No content received");
      setHtmlContent(content);
      setStreamingContent("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate landing page.");
      setHtmlContent("");
    } finally {
      setIsGenerating(false);
    }
  }, [session]);

  const displayContent = htmlContent || streamingContent;

  const handleCopyHtml = useCallback(() => {
    if (!displayContent) return;
    navigator.clipboard.writeText(displayContent).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    });
  }, [displayContent]);

  const handleDownload = useCallback(() => {
    if (!session || !displayContent) return;
    const slug = session.setup.topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 50);
    const blob = new Blob([displayContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-landing-page.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [session, displayContent]);

  const applyColorChange = useCallback(
    (color: string) => {
      setPrimaryColor(color);
      if (!htmlContent) return;
      // Replace all occurrences of the default indigo color with the new color
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
            {displayContent && (
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
        {/* Page title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {session.setup.topic}
          </h1>
          <p className="text-white/30 text-sm">Landing page from your validation report</p>
        </div>

        {/* Not generated yet — show CTA */}
        {!displayContent && !isGenerating && (
          <div className="max-w-xl mx-auto">
            <div className="relative rounded-2xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/15 p-8 sm:p-10 overflow-hidden text-center">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(20,184,166,0.08)_0%,_transparent_50%)]" />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center mx-auto mb-5">
                  <Globe className="w-8 h-8 text-teal-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-3">Generate your marketing site</h2>
                <p className="text-white/40 text-sm leading-relaxed mb-4 max-w-md mx-auto">
                  We pull structured data from your validation report (scores, ICP, risks, market sizing)
                  and brief a senior-level layout: editorial typography, real proof points, and CTAs that
                  match your idea — not generic startup filler. Single HTML file; host anywhere.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {[
                    "Report-informed copy",
                    "Agency-grade layout",
                    "Motion & polish",
                    "SEO meta + OG tags",
                    "Download & deploy",
                  ].map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/15 text-teal-300 text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={handleGenerate}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all shadow-lg shadow-teal-500/20 text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Landing Page
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generating skeleton (before any HTML starts coming in) */}
        {isGenerating && !displayContent && (
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-12 animate-pulse text-center">
              <Loader2 className="w-10 h-10 animate-spin text-teal-400/50 mx-auto mb-4" />
              <p className="text-white/30 text-sm">Building your page from the validation report…</p>
              <p className="text-white/15 text-xs mt-2">Usually 30–90 seconds — larger pages need more tokens</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <span className="flex-1">{error}</span>
            <button
              onClick={() => {
                setError(null);
                handleGenerate();
              }}
              className="text-sm font-medium underline hover:no-underline shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Preview area */}
        {displayContent && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                {/* Preview size toggles */}
                <div className="flex items-center bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
                  <button
                    onClick={() => setPreviewSize("desktop")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      previewSize === "desktop"
                        ? "bg-white/[0.08] text-white"
                        : "text-white/30 hover:text-white/50"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Desktop</span>
                  </button>
                  <button
                    onClick={() => setPreviewSize("tablet")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      previewSize === "tablet"
                        ? "bg-white/[0.08] text-white"
                        : "text-white/30 hover:text-white/50"
                    }`}
                  >
                    <Tablet className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tablet</span>
                  </button>
                  <button
                    onClick={() => setPreviewSize("mobile")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      previewSize === "mobile"
                        ? "bg-white/[0.08] text-white"
                        : "text-white/30 hover:text-white/50"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mobile</span>
                  </button>
                </div>

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
                    <div className="absolute top-full left-0 mt-2 p-4 rounded-xl bg-[#141420] border border-white/[0.08] shadow-2xl z-20 min-w-[200px]">
                      <p className="text-xs text-white/40 mb-3 font-medium">Primary Color</p>
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
                        {["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#22c55e"].map(
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
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-medium transition-all"
                      >
                        Apply Color
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isGenerating && (
                  <div className="flex items-center gap-2 text-teal-400 text-xs font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating...
                  </div>
                )}
                <button
                  onClick={handleCopyHtml}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                >
                  {copyToast ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
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

            {/* iframe preview */}
            <div
              className="mx-auto transition-all duration-300 ease-in-out"
              style={{ maxWidth: PREVIEW_WIDTHS[previewSize] }}
            >
              <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-[#07070c] shadow-2xl shadow-black/50">
                <iframe
                  ref={iframeRef}
                  srcDoc={displayContent}
                  title="Landing page preview"
                  className="w-full border-0 bg-[#07070c] block"
                  style={{ height: "80vh", minHeight: "600px" }}
                  sandbox="allow-scripts allow-forms allow-popups allow-downloads"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Regenerate button */}
            {htmlContent && !isGenerating && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm font-medium text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Regenerate Landing Page
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
