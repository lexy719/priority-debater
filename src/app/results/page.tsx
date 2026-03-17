"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Check,
  X,
  Zap,
  Download,
  Swords,
  BarChart3,
  Lightbulb,
  Users,
  MessageSquare,
  Layout,
  HelpCircle,
  Calendar,
  Target,
  Briefcase,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { loadSession, clearSession } from "@/lib/session";
import { extractDashboardData } from "@/lib/parse";
import type { ValidationSession } from "@/lib/types";

function downloadReport(setup: ValidationSession["setup"], messages: ValidationSession["messages"]) {
  const header = `# Validation Report: ${setup.topic}\n\n**Your case:** ${setup.position}\n${setup.context ? `**Context:** ${setup.context}\n` : ""}\n---\n\n`;
  const body = messages
    .map((m) => {
      const role = m.role === "user" ? "**You:**" : "**The Adversary:**";
      return `${role}\n${m.content}\n`;
    })
    .join("\n---\n\n");
  const blob = new Blob([header + body], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `validation-report-${(setup.topic || "idea").slice(0, 30).replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "")}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResultsPage() {
  const router = useRouter();
  const [session, setSession] = useState<ValidationSession | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [businessPlanContent, setBusinessPlanContent] = useState("");
  const [businessPlanStreaming, setBusinessPlanStreaming] = useState("");
  const [isGeneratingBusinessPlan, setIsGeneratingBusinessPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (!s || s.setup.template === "generate") {
      router.replace("/validate");
      return;
    }
    setSession(s);
  }, [router]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const { setup, validationContent, messages } = session;
  const dashboard = extractDashboardData(validationContent);

  const score = dashboard.score;
  const scoreColor =
    score != null
      ? score >= 7
        ? "text-emerald-400"
        : score >= 5
          ? "text-amber-400"
          : "text-red-400"
      : "text-slate-400";

  const scoreBorderColor =
    score != null
      ? score >= 7
        ? "border-emerald-400/50"
        : score >= 5
          ? "border-amber-400/50"
          : "border-red-400/50"
      : "border-slate-400/50";

  const goNoGoLabel =
    dashboard.goNoGoType === "go" ? "GO" :
    dashboard.goNoGoType === "caution" ? "CAUTION" :
    dashboard.goNoGoType === "nogo" ? "NO-GO" :
    score != null ? (score >= 7 ? "GO" : score >= 5 ? "CAUTION" : "NO-GO") : null;

  const goNoGoColor =
    goNoGoLabel === "GO" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
    goNoGoLabel === "CAUTION" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
    goNoGoLabel === "NO-GO" ? "bg-red-500/20 text-red-300 border-red-500/30" :
    "bg-slate-500/20 text-slate-300 border-slate-500/30";

  const handleGenerateBusinessPlan = async () => {
    setIsGeneratingBusinessPlan(true);
    setError(null);
    setBusinessPlanStreaming("");
    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "business-plan",
          setup,
          validationContent,
        }),
      });
      if (!response.ok) throw new Error("Failed to generate");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let content = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                content += parsed.content;
                setBusinessPlanStreaming(content);
              }
            } catch {
              // skip
            }
          }
        }
      }
      setBusinessPlanContent(content);
      setBusinessPlanStreaming("");
    } catch {
      setError("Failed to generate business plan.");
    } finally {
      setIsGeneratingBusinessPlan(false);
    }
  };

  const handleValidateNew = () => {
    clearSession();
    router.push("/validate");
  };

  const displayBusinessPlan = businessPlanContent || businessPlanStreaming;

  const tabIcons = [
    <BarChart3 key="o" className="w-4 h-4" />,
    <Users key="c" className="w-4 h-4" />,
    <Target key="s" className="w-4 h-4" />,
    <Briefcase key="f" className="w-4 h-4" />,
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 text-slate-900 font-bold hover:opacity-80 transition-opacity shrink-0">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="hidden sm:inline">Priority Debater</span>
            </Link>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="text-sm text-slate-500 truncate hidden sm:inline">{setup.topic}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadReport(setup, messages)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={handleValidateNew}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all"
            >
              + New
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero score card */}
        <div className="relative rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 sm:p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15)_0%,_transparent_50%)]" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-white mb-2 truncate">{setup.topic}</h1>
                {(dashboard.verdict || dashboard.summary) && (
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mb-4">
                    {dashboard.verdict || dashboard.summary}
                  </p>
                )}
                {goNoGoLabel && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${goNoGoColor}`}>
                    {goNoGoLabel === "GO" && <Check className="w-3 h-3" />}
                    {goNoGoLabel === "CAUTION" && <AlertTriangle className="w-3 h-3" />}
                    {goNoGoLabel === "NO-GO" && <X className="w-3 h-3" />}
                    {goNoGoLabel}
                  </span>
                )}
              </div>

              {score != null && (
                <div className="flex items-center gap-5 shrink-0">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-bold ${scoreColor} bg-white/5 border-2 ${scoreBorderColor}`}>
                      {score}
                    </div>
                    <span className="text-xs text-slate-400 font-medium tracking-wide">/ 10</span>
                  </div>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-slate-300">{dashboard.strengths.length} strengths</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-slate-300">{dashboard.risks.length} risks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="text-slate-300">{dashboard.recommendations.length} actions</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {["Overview", "Customer & Market", "Strategy", "Financials"].map((label, i) => (
            <button
              key={label}
              onClick={() => setActiveTab(i)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === i
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tabIcons[i]}
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {activeTab === 0 && (
            <>
              <div className="space-y-4">
                {dashboard.summary && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Summary</h3>
                    <p className="text-slate-700 text-sm leading-relaxed">{dashboard.summary}</p>
                  </div>
                )}
                {dashboard.goNoGo && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Go/No-Go Recommendation</h3>
                    <div className="markdown-content text-slate-700 prose prose-slate prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{dashboard.goNoGo}</ReactMarkdown>
                    </div>
                  </div>
                )}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Validation Steps</h3>
                  {dashboard.recommendations.length > 0 ? (
                    <ol className="space-y-2.5 text-sm text-slate-700">
                      {dashboard.recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="shrink-0 w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="leading-relaxed">{rec}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-slate-400 text-sm italic">No specific steps parsed.</p>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-sm border-2 border-emerald-200/60 p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" /> Strengths ({dashboard.strengths.length})
                  </h3>
                  {dashboard.strengths.length > 0 ? (
                    <ul className="space-y-2 text-sm text-slate-700">
                      {dashboard.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <Check className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 text-sm italic">None identified.</p>
                  )}
                </div>
                <div className="bg-white rounded-xl shadow-sm border-2 border-red-200/60 p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Risk Flags ({dashboard.risks.length})
                  </h3>
                  {dashboard.risks.length > 0 ? (
                    <ul className="space-y-2 text-sm text-slate-700">
                      {dashboard.risks.map((r, i) => (
                        <li key={i} className="flex gap-2">
                          <X className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 text-sm italic">None identified.</p>
                  )}
                </div>
              </div>
            </>
          )}
          {activeTab === 1 && (
            <>
              <div className="space-y-4">
                {dashboard.problemSolution && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-600" /> Problem-Solution Fit
                    </h3>
                    <div className="markdown-content text-slate-700 prose prose-slate prose-sm max-w-none prose-p:my-1 prose-li:my-0.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {dashboard.problemSolution}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                {dashboard.targetCustomer && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-600" /> Target Customer
                    </h3>
                    <div className="markdown-content text-slate-700 prose prose-slate prose-sm max-w-none prose-p:my-1 prose-li:my-0.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {dashboard.targetCustomer}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {dashboard.valueProposition && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-violet-600" /> Value Proposition
                    </h3>
                    <div className="markdown-content text-slate-700 prose prose-slate prose-sm max-w-none prose-p:my-1 prose-li:my-0.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {dashboard.valueProposition}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                {dashboard.businessModel && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <Layout className="w-4 h-4 text-emerald-600" /> Business Model
                    </h3>
                    <div className="markdown-content text-slate-700 prose prose-slate prose-sm max-w-none prose-p:my-1 prose-li:my-0.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {dashboard.businessModel}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                {dashboard.marketSummary && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-sky-600" /> Market Opportunity
                    </h3>
                    <div className="markdown-content text-slate-700 prose prose-slate prose-sm max-w-none prose-p:my-1 prose-li:my-0.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {dashboard.marketSummary}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                {dashboard.competitiveSummary && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-rose-600" /> Competitive Landscape
                    </h3>
                    <div className="markdown-content text-slate-700 prose prose-slate prose-sm max-w-none prose-p:my-1 prose-li:my-0.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {dashboard.competitiveSummary}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {activeTab === 2 && (
            <>
              <div className="space-y-4">
                {dashboard.keyAssumptions && (
                  <div className="bg-white rounded-xl shadow-sm border-l-4 border-amber-500 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-amber-600" /> Key Assumptions
                    </h3>
                    <div className="markdown-content text-slate-700 prose prose-slate prose-sm max-w-none prose-p:my-1 prose-li:my-0.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {dashboard.keyAssumptions}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                {dashboard.timelineToLaunch && (
                  <div className="bg-white rounded-xl shadow-sm border-l-4 border-indigo-500 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600" /> Timeline to Launch
                    </h3>
                    <div className="markdown-content text-slate-700 prose prose-slate prose-sm max-w-none prose-p:my-1 prose-li:my-0.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {dashboard.timelineToLaunch}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {dashboard.financialSummary && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-slate-600" /> Financial Snapshot
                    </h3>
                    <div className="markdown-content text-slate-700 prose prose-slate prose-sm max-w-none prose-p:my-1 prose-li:my-0.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {dashboard.financialSummary}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {activeTab === 3 && (
            <>
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border-2 border-indigo-200/60 p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-indigo-600" /> Business Plan Generator
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">
                    Generate an investor-ready business plan with financials, GTM strategy, and projections.
                  </p>
                  <button
                    onClick={handleGenerateBusinessPlan}
                    disabled={isGeneratingBusinessPlan || !!businessPlanContent}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {isGeneratingBusinessPlan ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                      </>
                    ) : businessPlanContent ? (
                      <>
                        <Check className="w-4 h-4" /> Generated
                      </>
                    ) : (
                      <>
                        <Briefcase className="w-4 h-4" /> Generate Business Plan
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div>
                {displayBusinessPlan ? (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 max-h-[600px] overflow-y-auto">
                    <div className="markdown-content text-slate-700 prose prose-slate prose-sm max-w-none prose-headings:text-slate-900 prose-h2:text-base prose-h3:text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {displayBusinessPlan}
                      </ReactMarkdown>
                    </div>
                    {isGeneratingBusinessPlan && (
                      <div className="flex items-center gap-2 mt-4 text-slate-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" /> Writing...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Click generate to create your business plan.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Debate CTA */}
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/20 shrink-0">
                <Swords className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Ready to stress-test your logic?
                </h3>
                <p className="text-violet-100 text-sm mt-1">
                  Defend your position. Find blind spots. Refine before you build.
                </p>
              </div>
            </div>
            <Link
              href="/debate"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-violet-700 font-bold hover:bg-violet-50 transition-colors shadow-lg text-base shrink-0"
            >
              <Swords className="w-5 h-5" />
              Debate this idea
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
