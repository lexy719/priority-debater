"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Zap,
  ArrowLeft,
  ArrowRight,
  Copy,
  CheckCircle2,
  Loader2,
  Download,
  Rocket,
  Target,
  DollarSign,
  BarChart3,
  Calendar,
  Trophy,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { loadSession } from "@/lib/session";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { ValidationSession } from "@/lib/types";

// ── Section navigation ──
const SECTIONS = [
  { id: "brief", label: "Strategy Brief", icon: Target, color: "text-indigo-400" },
  { id: "pricing", label: "Pricing", icon: DollarSign, color: "text-emerald-400" },
  { id: "gtm", label: "Go-to-Market", icon: Rocket, color: "text-violet-400" },
  { id: "roadmap", label: "90-Day Roadmap", icon: Calendar, color: "text-amber-400" },
  { id: "competitive", label: "Competitive", icon: Trophy, color: "text-rose-400" },
  { id: "metrics", label: "Metrics", icon: BarChart3, color: "text-cyan-400" },
  { id: "next-steps", label: "Next Steps", icon: TrendingUp, color: "text-teal-400" },
  { id: "risks", label: "Risks", icon: AlertTriangle, color: "text-orange-400" },
];

function parseSection(content: string, sectionId: string): string {
  // Map section IDs to their markdown headers
  const headerMap: Record<string, string[]> = {
    brief: ["EXECUTIVE STRATEGY BRIEF"],
    pricing: ["PRICING & MONETIZATION STRATEGY", "PRICING"],
    gtm: ["GO-TO-MARKET PLAYBOOK", "GO-TO-MARKET"],
    roadmap: ["90-DAY LAUNCH ROADMAP", "90-DAY ROADMAP", "LAUNCH ROADMAP"],
    competitive: ["COMPETITIVE POSITIONING", "COMPETITIVE"],
    metrics: ["KEY METRICS & TARGETS", "KEY METRICS"],
    "next-steps": ["IMMEDIATE NEXT STEPS"],
    risks: ["STRATEGIC RISKS & CONTINGENCIES", "STRATEGIC RISKS"],
  };

  const headers = headerMap[sectionId] || [];

  for (const header of headers) {
    // Find the section start (look for ## with the header text, ignoring emojis)
    const escapedHeader = header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const sectionRegex = new RegExp(`##\\s*(?:[\\p{Emoji}\\s]*)${escapedHeader}`, "iu");
    const match = content.match(sectionRegex);

    if (match && match.index !== undefined) {
      const start = match.index;
      // Find the next ## section header (that starts a new major section)
      const nextSectionMatch = content.slice(start + match[0].length).match(/\n## (?!#)/);
      const end = nextSectionMatch && nextSectionMatch.index !== undefined
        ? start + match[0].length + nextSectionMatch.index
        : content.length;
      return content.slice(start, end).trim();
    }
  }
  return "";
}

export default function StrategyPage() {
  const router = useRouter();
  const [session, setSession] = useState<ValidationSession | null>(null);
  const [content, setContent] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState(false);
  const [activeSection, setActiveSection] = useState("all");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["all"]));
  const contentRef = useRef<HTMLDivElement>(null);

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
    setContent("");

    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "business-strategy",
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
      let fullContent = "";

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
                fullContent += parsed.content;
                setStreamingContent(fullContent);
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

      if (!fullContent) throw new Error("No content received");
      setContent(fullContent);
      setStreamingContent("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate strategy.");
      setContent("");
    } finally {
      setIsGenerating(false);
    }
  }, [session]);

  const displayContent = content || streamingContent;

  const handleCopy = useCallback(() => {
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
    const blob = new Blob([displayContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-strategy.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [session, displayContent]);

  const getVisibleContent = useCallback(() => {
    if (!displayContent || activeSection === "all") return displayContent;
    return parseSection(displayContent, activeSection);
  }, [displayContent, activeSection]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08080e]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500/50" />
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
            <span className="text-sm text-white/30 truncate hidden sm:inline">Strategy</span>
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
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white/30 hover:text-white/60 rounded-lg hover:bg-white/[0.04] transition-all"
                  title="Copy strategy"
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
                  title="Download strategy"
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
          <p className="text-white/30 text-sm">Go-to-Market Strategy & Business Playbook</p>
        </div>

        {/* Pre-generation CTA */}
        {!displayContent && !isGenerating && (
          <div className="max-w-xl mx-auto">
            <div className="relative rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/15 p-8 sm:p-10 overflow-hidden text-center">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.08)_0%,_transparent_50%)]" />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center mx-auto mb-5">
                  <Rocket className="w-8 h-8 text-violet-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-3">Generate Your Strategy Playbook</h2>
                <p className="text-white/40 text-sm leading-relaxed mb-4 max-w-md mx-auto">
                  Get a complete go-to-market strategy with pricing tiers, a 90-day launch roadmap,
                  competitive positioning, and the exact steps to execute — starting today.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {[
                    "Pricing Strategy",
                    "GTM Playbook",
                    "90-Day Roadmap",
                    "Competitive Matrix",
                    "Growth Metrics",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/15 text-violet-300 text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={handleGenerate}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all shadow-lg shadow-violet-500/20 text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Strategy
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generating skeleton */}
        {isGenerating && !displayContent && (
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-12 animate-pulse text-center">
              <Loader2 className="w-10 h-10 animate-spin text-violet-400/50 mx-auto mb-4" />
              <p className="text-white/30 text-sm">Building your strategic playbook...</p>
              <p className="text-white/15 text-xs mt-2">This usually takes 20-40 seconds</p>
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

        {/* Content area */}
        {displayContent && (
          <div className="flex gap-6">
            {/* Desktop sidebar navigation */}
            <div className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-20 space-y-1">
                <button
                  onClick={() => setActiveSection("all")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    activeSection === "all"
                      ? "bg-white/[0.08] text-white"
                      : "text-white/30 hover:text-white/50 hover:bg-white/[0.04]"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Full Strategy
                </button>
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const hasContent = parseSection(displayContent, section.id).length > 0;
                  if (!hasContent && !isGenerating) return null;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        activeSection === section.id
                          ? "bg-white/[0.08] text-white"
                          : "text-white/30 hover:text-white/50 hover:bg-white/[0.04]"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${activeSection === section.id ? section.color : ""}`} />
                      {section.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile section selector */}
            <div className="lg:hidden fixed bottom-4 left-4 right-4 z-20">
              <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#141420]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/50 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setActiveSection("all")}
                  className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeSection === "all"
                      ? "bg-white/[0.1] text-white"
                      : "text-white/30"
                  }`}
                >
                  All
                </button>
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const hasContent = parseSection(displayContent, section.id).length > 0;
                  if (!hasContent && !isGenerating) return null;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        activeSection === section.id
                          ? "bg-white/[0.1] text-white"
                          : "text-white/30"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="hidden sm:inline">{section.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0 pb-20 lg:pb-0" ref={contentRef}>
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2 text-white/40 text-xs">
                    {isGenerating && (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                        <span className="text-violet-400 font-medium">Generating...</span>
                      </>
                    )}
                    {!isGenerating && content && (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Strategy complete</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                    >
                      {copyToast ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      {copyToast ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  </div>
                </div>

                {/* Rendered content */}
                <div className="px-5 sm:px-8 py-6 sm:py-8">
                  <div className="prose prose-invert prose-sm max-w-none
                    prose-headings:font-bold prose-headings:tracking-tight
                    prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-3 prose-h2:border-b prose-h2:border-white/[0.06]
                    prose-h3:text-base prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-white/80
                    prose-p:text-white/50 prose-p:text-sm prose-p:leading-relaxed
                    prose-li:text-white/50 prose-li:text-sm
                    prose-strong:text-white/80 prose-strong:font-semibold
                    prose-table:text-xs
                    prose-th:text-white/60 prose-th:font-semibold prose-th:px-3 prose-th:py-2 prose-th:bg-white/[0.04] prose-th:border-white/[0.08]
                    prose-td:text-white/40 prose-td:px-3 prose-td:py-2 prose-td:border-white/[0.06]
                    prose-hr:border-white/[0.06] prose-hr:my-8
                    prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
                  ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {getVisibleContent() || displayContent}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Regenerate button */}
              {content && !isGenerating && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm font-medium text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    Regenerate Strategy
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
