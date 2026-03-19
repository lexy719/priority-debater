"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Zap,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle2,
  Loader2,
  FileText,
  Presentation,
  Sparkles,
} from "lucide-react";
import { loadSession } from "@/lib/session";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { ValidationSession } from "@/lib/types";

// ── Parse slides from markdown ──
interface Slide {
  number: number;
  title: string;
  content: string;
  speakerNotes: string;
}

function parseSlides(markdown: string): Slide[] {
  const rawSlides = markdown.split(/\n---\n/).filter((s) => s.trim());
  return rawSlides.map((raw, idx) => {
    const titleMatch = raw.match(/##\s*Slide\s*(\d+):\s*(.+)/i);
    const number = titleMatch ? parseInt(titleMatch[1]) : idx + 1;
    const title = titleMatch ? titleMatch[2].trim() : `Slide ${idx + 1}`;

    let content = raw;
    let speakerNotes = "";

    // Extract speaker notes
    const notesMatch = raw.match(/\*\*Speaker Notes:\*\*\s*([\s\S]*?)$/i);
    if (notesMatch) {
      speakerNotes = notesMatch[1].trim();
      content = raw.slice(0, notesMatch.index).trim();
    }

    // Remove the slide title from content
    content = content.replace(/##\s*Slide\s*\d+:\s*.+\n?/, "").trim();

    return { number, title, content, speakerNotes };
  });
}

// ── Slide skeleton placeholder ──
function SlideSkeleton() {
  return (
    <div className="max-w-3xl mx-auto rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden animate-pulse">
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/[0.06]" />
          <div className="h-6 w-48 rounded-lg bg-white/[0.06]" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-white/[0.04]" />
          <div className="h-4 w-5/6 rounded bg-white/[0.04]" />
          <div className="h-4 w-4/6 rounded bg-white/[0.04]" />
          <div className="h-4 w-full rounded bg-white/[0.04]" />
          <div className="h-4 w-3/4 rounded bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

// ── Single Slide Card ──
function SlideCard({
  slide,
  totalSlides,
  isActive,
}: {
  slide: Slide;
  totalSlides: number;
  isActive: boolean;
}) {
  const [notesOpen, setNotesOpen] = useState(false);

  const slideColors = [
    "from-red-500/20 to-red-600/10 border-red-500/20 text-red-400",
    "from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400",
    "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400",
    "from-violet-500/20 to-violet-600/10 border-violet-500/20 text-violet-400",
    "from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400",
    "from-sky-500/20 to-sky-600/10 border-sky-500/20 text-sky-400",
    "from-rose-500/20 to-rose-600/10 border-rose-500/20 text-rose-400",
    "from-teal-500/20 to-teal-600/10 border-teal-500/20 text-teal-400",
    "from-indigo-500/20 to-indigo-600/10 border-indigo-500/20 text-indigo-400",
    "from-fuchsia-500/20 to-fuchsia-600/10 border-fuchsia-500/20 text-fuchsia-400",
  ];

  const colorSet = slideColors[(slide.number - 1) % slideColors.length];
  const [gradientColors, , textColor] = [
    colorSet.split(" ").slice(0, 2).join(" "),
    colorSet.split(" ")[2],
    colorSet.split(" ")[3],
  ];

  return (
    <div
      className={`max-w-3xl mx-auto rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden transition-all duration-300 ${
        isActive ? "ring-1 ring-indigo-500/30" : ""
      }`}
    >
      {/* Slide header */}
      <div className={`bg-gradient-to-r ${gradientColors} px-6 sm:px-8 py-4 border-b border-white/[0.06]`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`w-10 h-10 rounded-xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-sm font-bold ${textColor}`}
            >
              {slide.number}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white">{slide.title}</h2>
          </div>
          <span className="text-xs text-white/20 font-medium">
            {slide.number}/{totalSlides}
          </span>
        </div>
      </div>

      {/* Slide content */}
      <div className="p-6 sm:p-8">
        <div className="markdown-content-dark text-sm sm:text-base leading-relaxed text-white/70">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{slide.content}</ReactMarkdown>
        </div>
      </div>

      {/* Speaker notes */}
      {slide.speakerNotes && (
        <div className="border-t border-white/[0.06]">
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            className="w-full flex items-center justify-between px-6 sm:px-8 py-3 text-sm text-white/30 hover:text-white/50 transition-colors"
          >
            <span className="flex items-center gap-2 font-medium">
              <FileText className="w-3.5 h-3.5" />
              Speaker Notes
            </span>
            {notesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {notesOpen && (
            <div className="px-6 sm:px-8 pb-5 pt-0">
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
                <p className="text-sm text-white/40 leading-relaxed italic">{slide.speakerNotes}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──
export default function PitchDeckPage() {
  const router = useRouter();
  const [session, setSession] = useState<ValidationSession | null>(null);
  const [pitchContent, setPitchContent] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

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
    setPitchContent("");

    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pitch-deck",
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
      setPitchContent(content);
      setStreamingContent("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate pitch deck.");
      setPitchContent("");
    } finally {
      setIsGenerating(false);
    }
  }, [session]);

  const handleCopyAll = useCallback(() => {
    const content = pitchContent || streamingContent;
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    });
  }, [pitchContent, streamingContent]);

  const handleExportPDF = useCallback(() => {
    if (!session) return;
    const content = pitchContent || streamingContent;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Pitch Deck - ${session.setup.topic}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; color: #1e293b; padding: 40px; line-height: 1.7; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 28px; margin-bottom: 8px; color: #0f172a; }
  h2 { font-size: 20px; margin-top: 36px; margin-bottom: 14px; color: #1e293b; border-bottom: 2px solid #6366f1; padding-bottom: 8px; }
  h3 { font-size: 15px; margin-top: 20px; margin-bottom: 8px; color: #334155; }
  p { margin-bottom: 10px; font-size: 14px; }
  ul, ol { margin-left: 20px; margin-bottom: 12px; }
  li { margin-bottom: 6px; font-size: 14px; }
  strong { color: #0f172a; }
  hr { border: none; border-top: 2px solid #e2e8f0; margin: 32px 0; page-break-after: always; }
  .meta { color: #64748b; font-size: 13px; margin-bottom: 4px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #e2e8f0; color: #94a3b8; font-size: 12px; text-align: center; }
  .speaker-notes { background: #f8fafc; border-left: 3px solid #6366f1; padding: 12px 16px; margin-top: 16px; font-size: 13px; color: #64748b; font-style: italic; }
  @media print { body { padding: 20px; } hr { page-break-after: always; } }
</style></head><body>
  <h1>Pitch Deck: ${session.setup.topic}</h1>
  <p class="meta"><strong>Position:</strong> ${session.setup.position}</p>
  ${session.setup.context ? `<p class="meta"><strong>Context:</strong> ${session.setup.context}</p>` : ""}
  <hr style="page-break-after: auto;">
  <div id="content"></div>
  <div class="footer">Generated by Priority Debater &bull; ${new Date().toLocaleDateString()}</div>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"><\/script>
  <script>
    document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(content)});
    setTimeout(() => window.print(), 500);
  <\/script>
</body></html>`);
    printWindow.document.close();
  }, [session, pitchContent, streamingContent]);

  const scrollToSlide = useCallback((index: number) => {
    setActiveSlide(index);
    slideRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08080e]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500/50" />
      </div>
    );
  }

  const displayContent = pitchContent || streamingContent;
  const slides = displayContent ? parseSlides(displayContent) : [];

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#08080e]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-[#08080e]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
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
            <span className="text-sm text-white/30 truncate hidden sm:inline">Pitch Deck</span>
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
                  onClick={handleCopyAll}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white/30 hover:text-white/60 rounded-lg hover:bg-white/[0.04] transition-all"
                  title="Copy All"
                >
                  {copyToast ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{copyToast ? "Copied!" : "Copy"}</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white/30 hover:text-white/60 rounded-lg hover:bg-white/[0.04] transition-all"
                  title="Export PDF"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar — desktop only, only when we have slides */}
        {slides.length > 1 && (
          <aside className="hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)] w-56 shrink-0 border-r border-white/[0.06] overflow-y-auto py-4 px-3">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider px-2 mb-3">
              Slides
            </p>
            <nav className="space-y-1">
              {slides.map((slide, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToSlide(idx)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSlide === idx
                      ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
                      : "text-white/30 hover:text-white/50 hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                      activeSlide === idx
                        ? "bg-indigo-500/20 text-indigo-300"
                        : "bg-white/[0.06] text-white/25"
                    }`}
                  >
                    {slide.number}
                  </span>
                  <span className="truncate text-xs">{slide.title}</span>
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Page title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {session.setup.topic}
            </h1>
            <p className="text-white/30 text-sm">Investor Pitch Deck</p>
          </div>

          {/* Not generated yet — show CTA */}
          {!displayContent && !isGenerating && (
            <div className="max-w-xl mx-auto">
              <div className="relative rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/15 p-8 sm:p-10 overflow-hidden text-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.08)_0%,_transparent_50%)]" />
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
                    <Presentation className="w-8 h-8 text-amber-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-3">Generate Your Pitch Deck</h2>
                  <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-md mx-auto">
                    Create a 10-slide investor pitch deck from your validation data. Each slide comes
                    with content and speaker notes to help you present with confidence.
                  </p>
                  <button
                    onClick={handleGenerate}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-lg shadow-amber-500/20 text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Pitch Deck
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Generating — show skeletons */}
          {isGenerating && slides.length === 0 && (
            <div className="space-y-6">
              <SlideSkeleton />
              <SlideSkeleton />
              <SlideSkeleton />
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

          {/* Slides */}
          {slides.length > 0 && (
            <div className="space-y-6">
              {slides.map((slide, idx) => (
                <div
                  key={idx}
                  ref={(el) => { slideRefs.current[idx] = el; }}
                >
                  <SlideCard
                    slide={slide}
                    totalSlides={Math.max(slides.length, 10)}
                    isActive={activeSlide === idx}
                  />
                </div>
              ))}

              {/* Streaming indicator */}
              {isGenerating && (
                <div className="flex items-center justify-center gap-2 text-white/30 text-sm py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating slides...
                </div>
              )}

              {/* Bottom nav — only after generation completes */}
              {!isGenerating && pitchContent && (
                <div className="max-w-3xl mx-auto flex items-center justify-between pt-4 pb-8">
                  <button
                    onClick={() => scrollToSlide(Math.max(0, activeSlide - 1))}
                    disabled={activeSlide === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/40 hover:text-white/60 disabled:opacity-20 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> Previous
                  </button>
                  <span className="text-sm text-white/20 font-medium">
                    {activeSlide + 1} / {slides.length}
                  </span>
                  <button
                    onClick={() => scrollToSlide(Math.min(slides.length - 1, activeSlide + 1))}
                    disabled={activeSlide === slides.length - 1}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/40 hover:text-white/60 disabled:opacity-20 transition-all"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
