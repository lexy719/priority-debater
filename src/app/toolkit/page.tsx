"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  FileText,
  Presentation,
  Sparkles,
  Briefcase,
  DollarSign,
  Rocket,
  Target,
  BarChart3,
  Calendar,
  Trophy,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { loadSessionWithStatus } from "@/lib/session";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GradientMesh } from "@/components/ui/animated-background";
import { GlowCard } from "@/components/ui/glow-card";
import { FadeIn } from "@/components/ui/animated-text";
import type { ValidationSession } from "@/lib/types";

// ────────────────────────────────────────────────────────────
// Types & constants
// ────────────────────────────────────────────────────────────

type ToolId = "pitch-deck" | "business-plan" | "financial-model" | "business-strategy";

interface ToolDef {
  id: ToolId;
  label: string;
  shortLabel: string;
  icon: typeof Presentation;
  color: string;
  gradient: string;
  accentBg: string;
  description: string;
  apiAction: string;
  tags: string[];
}

const TOOLS: ToolDef[] = [
  {
    id: "pitch-deck",
    label: "Investor Pitch Deck",
    shortLabel: "Pitch",
    icon: Presentation,
    color: "text-amber-400",
    gradient: "from-amber-500/20 to-orange-500/20",
    accentBg: "bg-amber-500/15 border-amber-500/20",
    description: "10-slide deck with speaker notes, market data, and financial projections.",
    apiAction: "pitch-deck",
    tags: ["10 Slides", "Speaker Notes", "Market Data"],
  },
  {
    id: "business-plan",
    label: "Business Plan",
    shortLabel: "Plan",
    icon: Briefcase,
    color: "text-indigo-400",
    gradient: "from-indigo-500/20 to-blue-500/20",
    accentBg: "bg-indigo-500/15 border-indigo-500/20",
    description: "Investor-ready business plan with market analysis, strategy, and projections.",
    apiAction: "business-plan",
    tags: ["Executive Summary", "Market Analysis", "Go-to-Market"],
  },
  {
    id: "financial-model",
    label: "Financial Model",
    shortLabel: "Finance",
    icon: DollarSign,
    color: "text-emerald-400",
    gradient: "from-emerald-500/20 to-teal-500/20",
    accentBg: "bg-emerald-500/15 border-emerald-500/20",
    description: "3-year projections with unit economics, P&L, cash flow, and sensitivity analysis.",
    apiAction: "financial-model",
    tags: ["P&L Projections", "Unit Economics", "Cash Flow"],
  },
  {
    id: "business-strategy",
    label: "GTM Strategy",
    shortLabel: "Strategy",
    icon: Rocket,
    color: "text-violet-400",
    gradient: "from-violet-500/20 to-fuchsia-500/20",
    accentBg: "bg-violet-500/15 border-violet-500/20",
    description: "Pricing, go-to-market playbook, 90-day roadmap, and competitive positioning.",
    apiAction: "business-strategy",
    tags: ["Pricing", "GTM Playbook", "90-Day Roadmap"],
  },
];

// Strategy section navigation
const STRATEGY_SECTIONS = [
  { id: "brief", label: "Strategy Brief", icon: Target, color: "text-indigo-400" },
  { id: "pricing", label: "Pricing", icon: DollarSign, color: "text-emerald-400" },
  { id: "gtm", label: "Go-to-Market", icon: Rocket, color: "text-violet-400" },
  { id: "roadmap", label: "90-Day Roadmap", icon: Calendar, color: "text-amber-400" },
  { id: "competitive", label: "Competitive", icon: Trophy, color: "text-rose-400" },
  { id: "metrics", label: "Metrics", icon: BarChart3, color: "text-cyan-400" },
  { id: "next-steps", label: "Next Steps", icon: TrendingUp, color: "text-teal-400" },
  { id: "risks", label: "Risks", icon: AlertTriangle, color: "text-orange-400" },
];

// ────────────────────────────────────────────────────────────
// Pitch deck slide parsing
// ────────────────────────────────────────────────────────────

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
    const notesMatch = raw.match(/\*\*Speaker Notes:\*\*\s*([\s\S]*?)$/i);
    if (notesMatch) {
      speakerNotes = notesMatch[1].trim();
      content = raw.slice(0, notesMatch.index).trim();
    }
    content = content.replace(/##\s*Slide\s*\d+:\s*.+\n?/, "").trim();
    return { number, title, content, speakerNotes };
  });
}

// ────────────────────────────────────────────────────────────
// Strategy section parsing
// ────────────────────────────────────────────────────────────

function parseStrategySection(content: string, sectionId: string): string {
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
    const escapedHeader = header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const sectionRegex = new RegExp(`##\\s*(?:[\\p{Emoji}\\s]*)${escapedHeader}`, "iu");
    const match = content.match(sectionRegex);
    if (match && match.index !== undefined) {
      const start = match.index;
      const nextSectionMatch = content.slice(start + match[0].length).match(/\n## (?!#)/);
      const end = nextSectionMatch && nextSectionMatch.index !== undefined
        ? start + match[0].length + nextSectionMatch.index
        : content.length;
      return content.slice(start, end).trim();
    }
  }
  return "";
}

// ────────────────────────────────────────────────────────────
// Slide Card component
// ────────────────────────────────────────────────────────────

const SLIDE_COLORS = [
  "from-red-500/20 to-red-600/10 text-red-400",
  "from-blue-500/20 to-blue-600/10 text-blue-400",
  "from-emerald-500/20 to-emerald-600/10 text-emerald-400",
  "from-violet-500/20 to-violet-600/10 text-violet-400",
  "from-amber-500/20 to-amber-600/10 text-amber-400",
  "from-sky-500/20 to-sky-600/10 text-sky-400",
  "from-rose-500/20 to-rose-600/10 text-rose-400",
  "from-teal-500/20 to-teal-600/10 text-teal-400",
  "from-indigo-500/20 to-indigo-600/10 text-indigo-400",
  "from-fuchsia-500/20 to-fuchsia-600/10 text-fuchsia-400",
];

function SlideCard({ slide, totalSlides, isActive }: { slide: Slide; totalSlides: number; isActive: boolean }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const colorSet = SLIDE_COLORS[(slide.number - 1) % SLIDE_COLORS.length];
  const gradientParts = colorSet.split(" ");
  const gradientColors = gradientParts.slice(0, 2).join(" ");
  const textColor = gradientParts[2];

  return (
    <div className={`rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden transition-all duration-300 ${isActive ? "ring-1 ring-indigo-500/30" : ""}`}>
      <div className={`bg-gradient-to-r ${gradientColors} px-6 sm:px-8 py-4 border-b border-white/[0.06]`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`w-10 h-10 rounded-xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-sm font-bold ${textColor}`}>
              {slide.number}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white">{slide.title}</h2>
          </div>
          <span className="text-xs text-white/20 font-medium">{slide.number}/{totalSlides}</span>
        </div>
      </div>
      <div className="p-6 sm:p-8">
        <div className="markdown-content-dark text-sm sm:text-base leading-relaxed text-white/70">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{slide.content}</ReactMarkdown>
        </div>
      </div>
      {slide.speakerNotes && (
        <div className="border-t border-white/[0.06]">
          <button onClick={() => setNotesOpen(!notesOpen)} className="w-full flex items-center justify-between px-6 sm:px-8 py-3 text-sm text-white/30 hover:text-white/50 transition-colors">
            <span className="flex items-center gap-2 font-medium"><FileText className="w-3.5 h-3.5" /> Speaker Notes</span>
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

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────

function ToolkitPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") as ToolId | null;

  const [session, setSession] = useState<ValidationSession | null>(null);
  const [activeTool, setActiveTool] = useState<ToolId>(
    TOOLS.find((t) => t.id === initialTab)?.id || "pitch-deck"
  );

  // Content state per tool
  const [contents, setContents] = useState<Record<ToolId, string>>({
    "pitch-deck": "",
    "business-plan": "",
    "financial-model": "",
    "business-strategy": "",
  });
  const [streamingContents, setStreamingContents] = useState<Record<ToolId, string>>({
    "pitch-deck": "",
    "business-plan": "",
    "financial-model": "",
    "business-strategy": "",
  });
  const [generating, setGenerating] = useState<Record<ToolId, boolean>>({
    "pitch-deck": false,
    "business-plan": false,
    "financial-model": false,
    "business-strategy": false,
  });
  const [errors, setErrors] = useState<Record<ToolId, string | null>>({
    "pitch-deck": null,
    "business-plan": null,
    "financial-model": null,
    "business-strategy": null,
  });

  // Pitch deck state
  const [activeSlide, setActiveSlide] = useState(0);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Strategy section state
  const [activeStrategySection, setActiveStrategySection] = useState("all");

  // UI
  const [copyToast, setCopyToast] = useState(false);

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

  const handleGenerate = useCallback(async (toolId: ToolId) => {
    if (!session) return;
    const tool = TOOLS.find((t) => t.id === toolId);
    if (!tool) return;

    setGenerating((prev) => ({ ...prev, [toolId]: true }));
    setErrors((prev) => ({ ...prev, [toolId]: null }));
    setStreamingContents((prev) => ({ ...prev, [toolId]: "" }));
    setContents((prev) => ({ ...prev, [toolId]: "" }));

    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: tool.apiAction,
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
                setStreamingContents((prev) => ({ ...prev, [toolId]: content }));
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
      setContents((prev) => ({ ...prev, [toolId]: content }));
      setStreamingContents((prev) => ({ ...prev, [toolId]: "" }));
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        [toolId]: e instanceof Error ? e.message : `Failed to generate ${tool.label.toLowerCase()}.`,
      }));
      setContents((prev) => ({ ...prev, [toolId]: "" }));
    } finally {
      setGenerating((prev) => ({ ...prev, [toolId]: false }));
    }
  }, [session]);

  const displayContent = contents[activeTool] || streamingContents[activeTool];
  const isGenerating = generating[activeTool];
  const error = errors[activeTool];
  const currentTool = TOOLS.find((t) => t.id === activeTool)!;

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
    a.download = `${slug}-${activeTool}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [session, displayContent, activeTool]);

  const handleExportPDF = useCallback(() => {
    if (!session || !displayContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${currentTool.label} - ${session.setup.topic}</title>
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
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
  th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
  th { background: #f8fafc; font-weight: 600; }
  hr { border: none; border-top: 2px solid #e2e8f0; margin: 32px 0; page-break-after: always; }
  .meta { color: #64748b; font-size: 13px; margin-bottom: 4px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #e2e8f0; color: #94a3b8; font-size: 12px; text-align: center; }
  @media print { body { padding: 20px; } hr { page-break-after: always; } }
</style></head><body>
  <h1>${currentTool.label}: ${session.setup.topic}</h1>
  <p class="meta"><strong>Position:</strong> ${session.setup.position}</p>
  ${session.setup.context ? `<p class="meta"><strong>Context:</strong> ${session.setup.context}</p>` : ""}
  <hr style="page-break-after: auto;">
  <div id="content"></div>
  <div class="footer">Generated by Priority Debater &bull; ${new Date().toLocaleDateString()}</div>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"><\/script>
  <script>
    document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(displayContent)});
    setTimeout(() => window.print(), 500);
  <\/script>
</body></html>`);
    printWindow.document.close();
  }, [session, displayContent, currentTool]);

  const scrollToSlide = useCallback((index: number) => {
    setActiveSlide(index);
    slideRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // Computed
  const slides = activeTool === "pitch-deck" && displayContent ? parseSlides(displayContent) : [];
  const generatedCount = Object.values(contents).filter(Boolean).length;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08080e]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500/50" />
      </div>
    );
  }

  // ── Render helpers ──

  function renderPreGenCTA() {
    const Icon = currentTool.icon;
    const glowColorMap: Record<ToolId, string> = {
      "pitch-deck": "rgba(245,158,11,0.4)",
      "business-plan": "rgba(99,102,241,0.4)",
      "financial-model": "rgba(16,185,129,0.4)",
      "business-strategy": "rgba(139,92,246,0.4)",
    };
    return (
      <FadeIn delay={0}>
        <div className="max-w-xl mx-auto">
          <GlowCard glowColor={glowColorMap[activeTool]} className={`relative rounded-2xl bg-gradient-to-br ${currentTool.gradient} border border-white/[0.08] p-8 sm:p-10 overflow-hidden text-center`}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.06)_0%,_transparent_50%)]" />
            <div className="relative">
              <div className={`w-16 h-16 rounded-2xl ${currentTool.accentBg} border flex items-center justify-center mx-auto mb-5`}>
                <Icon className={`w-8 h-8 ${currentTool.color}`} />
              </div>
              <h2 className="text-xl font-bold text-white mb-3">Generate {currentTool.label}</h2>
              <p className="text-white/40 text-sm leading-relaxed mb-4 max-w-md mx-auto">{currentTool.description}</p>
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {currentTool.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/50 text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
              <button
                onClick={() => handleGenerate(activeTool)}
                className={`group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] text-sm ${
                  activeTool === "pitch-deck" ? "bg-amber-600 hover:bg-amber-500 shadow-amber-500/20 hover:shadow-amber-500/30" :
                  activeTool === "business-plan" ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20 hover:shadow-indigo-500/30" :
                  activeTool === "financial-model" ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20 hover:shadow-emerald-500/30" :
                  "bg-violet-600 hover:bg-violet-500 shadow-violet-500/20 hover:shadow-violet-500/30"
                }`}
              >
                <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                Generate {currentTool.shortLabel}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </GlowCard>
        </div>
      </FadeIn>
    );
  }

  function renderGeneratingState() {
    return (
      <FadeIn delay={0}>
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-12 text-center">
            <Loader2 className={`w-10 h-10 animate-spin mx-auto mb-4 ${currentTool.color} opacity-50`} />
            <p className="text-white/30 text-sm">
              Generating your {currentTool.label.toLowerCase()}
              <span className="inline-flex ml-1">
                <span className="animate-bounce [animation-delay:0ms]">.</span>
                <span className="animate-bounce [animation-delay:150ms]">.</span>
                <span className="animate-bounce [animation-delay:300ms]">.</span>
              </span>
            </p>
            <p className="text-white/15 text-xs mt-2">This usually takes 20-40 seconds</p>
          </div>
        </div>
      </FadeIn>
    );
  }

  function renderPitchDeck() {
    return (
      <div className="flex gap-6">
        {/* Slide sidebar — desktop */}
        {slides.length > 1 && (
          <div className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-20 space-y-1">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider px-2 mb-3">Slides</p>
              {slides.map((slide, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToSlide(idx)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSlide === idx
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                      : "text-white/30 hover:text-white/50 hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                    activeSlide === idx ? "bg-amber-500/20 text-amber-300" : "bg-white/[0.06] text-white/25"
                  }`}>{slide.number}</span>
                  <span className="truncate text-xs">{slide.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Slides */}
        <div className="flex-1 min-w-0 space-y-6">
          {slides.map((slide, idx) => (
            <div key={idx} ref={(el) => { slideRefs.current[idx] = el; }}>
              <SlideCard slide={slide} totalSlides={Math.max(slides.length, 10)} isActive={activeSlide === idx} />
            </div>
          ))}
          {isGenerating && slides.length > 0 && (
            <div className="flex items-center justify-center gap-2 text-white/30 text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Generating slides...
            </div>
          )}
          {!isGenerating && contents["pitch-deck"] && slides.length > 1 && (
            <div className="max-w-3xl mx-auto flex items-center justify-between pt-4 pb-8">
              <button onClick={() => scrollToSlide(Math.max(0, activeSlide - 1))} disabled={activeSlide === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/40 hover:text-white/60 disabled:opacity-20 transition-all">
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-sm text-white/20 font-medium">{activeSlide + 1} / {slides.length}</span>
              <button onClick={() => scrollToSlide(Math.min(slides.length - 1, activeSlide + 1))} disabled={activeSlide === slides.length - 1}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/40 hover:text-white/60 disabled:opacity-20 transition-all">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderStrategyContent() {
    const getVisibleContent = () => {
      if (!displayContent || activeStrategySection === "all") return displayContent;
      return parseStrategySection(displayContent, activeStrategySection);
    };

    return (
      <div className="flex gap-6">
        {/* Strategy sidebar — desktop */}
        <div className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-20 space-y-1">
            <button
              onClick={() => setActiveStrategySection("all")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeStrategySection === "all" ? "bg-white/[0.08] text-white" : "text-white/30 hover:text-white/50 hover:bg-white/[0.04]"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Full Strategy
            </button>
            {STRATEGY_SECTIONS.map((section) => {
              const Icon = section.icon;
              const hasContent = parseStrategySection(displayContent || "", section.id).length > 0;
              if (!hasContent && !isGenerating) return null;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveStrategySection(section.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    activeStrategySection === section.id ? "bg-white/[0.08] text-white" : "text-white/30 hover:text-white/50 hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${activeStrategySection === section.id ? section.color : ""}`} />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile strategy nav */}
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-20">
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#141420]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/50 overflow-x-auto scrollbar-hide">
            <button onClick={() => setActiveStrategySection("all")}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${activeStrategySection === "all" ? "bg-white/[0.1] text-white" : "text-white/30"}`}>
              All
            </button>
            {STRATEGY_SECTIONS.map((section) => {
              const Icon = section.icon;
              const hasContent = parseStrategySection(displayContent || "", section.id).length > 0;
              if (!hasContent && !isGenerating) return null;
              return (
                <button key={section.id} onClick={() => setActiveStrategySection(section.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeStrategySection === section.id ? "bg-white/[0.1] text-white" : "text-white/30"
                  }`}>
                  <Icon className="w-3 h-3" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Strategy content */}
        <div className="flex-1 min-w-0">
          {renderMarkdownContent(getVisibleContent() || displayContent || "")}
        </div>
      </div>
    );
  }

  function renderMarkdownContent(content: string) {
    return (
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 text-white/40 text-xs">
            {isGenerating ? (
              <><Loader2 className={`w-3.5 h-3.5 animate-spin ${currentTool.color}`} /><span className={`${currentTool.color} font-medium`}>Generating...</span></>
            ) : contents[activeTool] ? (
              <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span>Complete</span></>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-all">
              {copyToast ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copyToast ? "Copied!" : "Copy"}
            </button>
            <button onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-all">
              <FileText className="w-3 h-3" /> PDF
            </button>
            <button onClick={handleDownload}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-all ${
                activeTool === "pitch-deck" ? "bg-amber-600 hover:bg-amber-500" :
                activeTool === "business-plan" ? "bg-indigo-600 hover:bg-indigo-500" :
                activeTool === "financial-model" ? "bg-emerald-600 hover:bg-emerald-500" :
                "bg-violet-600 hover:bg-violet-500"
              }`}>
              <Download className="w-3 h-3" /> Download
            </button>
          </div>
        </div>
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
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  function renderActiveContent() {
    if (!displayContent && !isGenerating) return renderPreGenCTA();
    if (isGenerating && !displayContent) return renderGeneratingState();

    if (activeTool === "pitch-deck" && slides.length > 0) return <FadeIn delay={0.1}>{renderPitchDeck()}</FadeIn>;
    if (activeTool === "business-strategy" && displayContent) return <FadeIn delay={0.1}>{renderStrategyContent()}</FadeIn>;

    // Business plan & financial model — standard markdown
    if (displayContent) return <FadeIn delay={0.1}>{renderMarkdownContent(displayContent)}</FadeIn>;

    return null;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#08080e] relative">
      <GradientMesh />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-[#08080e]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="hidden sm:inline text-sm font-semibold text-white/70 group-hover:text-white transition-colors">Priority Debater</span>
            </Link>
            <span className="text-white/10 hidden sm:inline">/</span>
            <span className="text-sm text-white/30 truncate hidden sm:inline">Business Toolkit</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/results"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white/30 hover:text-white/60 rounded-lg hover:bg-white/[0.04] transition-all">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Results</span>
            </Link>
            {displayContent && (
              <>
                <button onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white/30 hover:text-white/60 rounded-lg hover:bg-white/[0.04] transition-all" title="Copy">
                  {copyToast ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copyToast ? "Copied!" : "Copy"}</span>
                </button>
                <button onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white/30 hover:text-white/60 rounded-lg hover:bg-white/[0.04] transition-all" title="PDF">
                  <FileText className="w-3.5 h-3.5" /><span className="hidden sm:inline">PDF</span>
                </button>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{session.setup.topic}</h1>
          <p className="text-white/30 text-sm">Business Toolkit &middot; {generatedCount}/{TOOLS.length} generated</p>
        </div>

        {/* Tool tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide rounded-2xl backdrop-blur-xl bg-[var(--bg-primary)]/60 p-2 border border-white/[0.06]">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const hasContent = !!contents[tool.id];
            const isActive = activeTool === tool.id;
            const isToolGenerating = generating[tool.id];
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  isActive
                    ? "bg-white/[0.08] text-white border-white/[0.12]"
                    : "bg-white/[0.02] text-white/30 hover:text-white/50 border-white/[0.04] hover:border-white/[0.08]"
                }`}
              >
                {isToolGenerating ? (
                  <Loader2 className={`w-4 h-4 animate-spin ${tool.color}`} />
                ) : hasContent ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Icon className={`w-4 h-4 ${isActive ? tool.color : ""}`} />
                )}
                <span className="hidden sm:inline">{tool.label}</span>
                <span className="sm:hidden">{tool.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => { setErrors((prev) => ({ ...prev, [activeTool]: null })); handleGenerate(activeTool); }}
              className="text-sm font-medium underline hover:no-underline shrink-0">Retry</button>
          </div>
        )}

        {/* Active tool content */}
        {renderActiveContent()}

        {/* Regenerate button */}
        {contents[activeTool] && !isGenerating && (
          <div className="mt-6 flex justify-center">
            <button onClick={() => handleGenerate(activeTool)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm font-medium text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all">
              <Sparkles className="w-4 h-4" /> Regenerate {currentTool.shortLabel}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ToolkitPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#08080e]">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
      </div>
    }>
      <ToolkitPageInner />
    </Suspense>
  );
}
