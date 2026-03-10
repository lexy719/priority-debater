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
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  const { setup, validationContent, messages } = session;
  const dashboard = extractDashboardData(validationContent);

  const scoreColor =
    dashboard.score != null
      ? dashboard.score >= 7
        ? "text-emerald-500"
        : dashboard.score >= 5
          ? "text-amber-500"
          : "text-red-500"
      : "text-slate-600";

  const s = dashboard.score ?? 5;
  const score100 = Math.round((s / 10) * 100);
  const riskPct = Math.round((1 - s / 10) * 100);
  const diffPct = Math.min(100, Math.round((s / 10) * 85 + 15));
  const compPct = Math.min(100, Math.round(100 - (s / 10) * 60));

  const marketFactors = [
    { label: "Target Market Clarity", value: Math.min(100, Math.round((s / 10) * 70 + 20)) },
    { label: "Market Timing", value: Math.min(100, Math.round((s / 10) * 80 + 10)) },
    { label: "Market Entry Barriers", value: Math.min(100, Math.round((s / 10) * 50 + 30)) },
    { label: "Competition Level", value: Math.min(100, Math.round(100 - (s / 10) * 50)) },
    { label: "Problem-Solution Fit", value: Math.min(100, Math.round((s / 10) * 90 + 5)) },
  ];
  const executionFactors = [
    { label: "MVP Viability", value: Math.min(100, Math.round((s / 10) * 75 + 15)) },
    { label: "Value Proposition", value: Math.min(100, Math.round((s / 10) * 85 + 10)) },
    { label: "Initial Feasibility", value: Math.min(100, Math.round((s / 10) * 70 + 20)) },
    { label: "Resource Requirements", value: Math.min(100, Math.round(100 - (s / 10) * 40)) },
  ];

  const handleGenerateBusinessPlan = async () => {
    setIsGeneratingBusinessPlan(true);
    setError(null);
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
              if (parsed.content) content += parsed.content;
            } catch {
              // skip
            }
          }
        }
      }
      setBusinessPlanContent(content);
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

  return (
    <div className="min-h-screen min-h-[100dvh] flex bg-slate-100">
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-slate-900 text-white">
        <div className="p-5 border-b border-slate-700">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">Priority Debater</span>
          </Link>
        </div>
        <div className="p-4">
          <button
            onClick={handleValidateNew}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium text-sm transition-colors"
          >
            <span>+</span> Validate new idea
          </button>
        </div>
        <div className="flex-1 px-4 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Journey
          </h3>
          <div className="space-y-1">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="font-medium text-sm block">Idea Validation</span>
                <span className="text-xs text-slate-400">Complete</span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400">
              <div className="w-4 h-4 rounded-full border-2 border-slate-500 shrink-0" />
              <span className="text-sm">Market Analysis</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400">
              <div className="w-4 h-4 rounded-full border-2 border-slate-500 shrink-0" />
              <span className="text-sm">Business Plan</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400">
              <div className="w-4 h-4 rounded-full border-2 border-slate-500 shrink-0" />
              <span className="text-sm">Debate & Refine</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-900 truncate">{setup.topic}</h2>
              <p className="text-sm text-slate-500 mt-0.5">Validation Report · Step 1 of 3</p>
            </div>
            <button
              onClick={() => downloadReport(setup, messages)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg bg-white border border-slate-200 shrink-0"
            >
              <Download className="w-4 h-4" /> Download
            </button>
          </div>

          <div className="relative rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 p-6 sm:p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.2)_0%,_transparent_50%)]" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex-1">
                {(dashboard.summary || dashboard.verdict) && (
                  <p className="text-slate-200 text-base sm:text-lg leading-relaxed max-w-2xl">
                    {dashboard.verdict || dashboard.summary}
                  </p>
                )}
              </div>
                {dashboard.score != null && (
                  <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-red-400 bg-white/5 border border-white/10">
                        {riskPct}
                      </div>
                      <span className="text-xs text-slate-400 mt-1.5 font-medium">RISK</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-blue-400 bg-white/5 border border-white/10">
                        {diffPct}
                      </div>
                      <span className="text-xs text-slate-400 mt-1.5 font-medium">DIFF</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-amber-400 bg-white/5 border border-white/10">
                        {compPct}
                      </div>
                      <span className="text-xs text-slate-400 mt-1.5 font-medium">COMP</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold border-2 ${scoreColor} bg-white/10`}
                      >
                        {score100}
                      </div>
                      <span className="text-xs text-slate-400 mt-1.5 font-medium">SCORE</span>
                    </div>
                  </div>
                )}
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {["Overview", "Customer & Market", "Strategy", "Financials"].map((label, i) => (
              <button
                key={label}
                onClick={() => setActiveTab(i)}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === i
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 min-h-[420px]">
            {activeTab === 0 && (
              <>
                <div className="bg-white rounded-xl shadow-md border border-slate-200/50 p-5 overflow-y-auto max-h-[480px]">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Summary & Verdict</h3>
                  {dashboard.summary && (
                    <p className="text-slate-700 text-sm mb-3">{dashboard.summary}</p>
                  )}
                  {dashboard.verdict && (
                    <p className="text-indigo-700 font-medium text-sm mb-3">{dashboard.verdict}</p>
                  )}
                  {dashboard.goNoGo && (
                    <div className="markdown-content text-slate-700 prose prose-slate prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{dashboard.goNoGo}</ReactMarkdown>
                    </div>
                  )}
                </div>
                <div className="space-y-4 overflow-y-auto max-h-[480px]">
                  <div className="bg-white rounded-xl shadow-md border border-slate-200/50 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Key Recommendations</h3>
                    {dashboard.recommendations.length > 0 ? (
                      <ol className="space-y-2 text-sm text-slate-700">
                        {dashboard.recommendations.map((rec, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="shrink-0 w-5 h-5 rounded bg-violet-100 text-violet-700 text-xs font-semibold flex items-center justify-center">
                              {i + 1}
                            </span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-slate-500 italic text-sm">—</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl shadow-md border-2 border-emerald-200/60 p-4">
                      <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" /> Strengths
                      </h3>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {dashboard.strengths.slice(0, 4).map((s, i) => (
                          <li key={i} className="flex gap-1.5">
                            <Check className="w-3 h-3 shrink-0 text-emerald-500 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white rounded-xl shadow-md border-2 border-red-200/60 p-4">
                      <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                        <X className="w-4 h-4 text-red-600" /> Concerns
                      </h3>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {dashboard.risks.slice(0, 4).map((r, i) => (
                          <li key={i} className="flex gap-1.5">
                            <X className="w-3 h-3 shrink-0 text-red-500 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
            {activeTab === 1 && (
              <>
                <div className="space-y-4 overflow-y-auto max-h-[480px]">
                  {dashboard.problemSolution && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-md border border-amber-200/50 p-4">
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
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md border border-blue-200/50 p-4">
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
                <div className="space-y-4 overflow-y-auto max-h-[480px]">
                  {dashboard.valueProposition && (
                    <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl shadow-md border border-violet-200/50 p-4">
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
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-md border border-emerald-200/50 p-4">
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
                    <div className="bg-white rounded-xl shadow-md border border-slate-200/50 p-4">
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
                    <div className="bg-white rounded-xl shadow-md border border-slate-200/50 p-4">
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
                <div className="space-y-4 overflow-y-auto max-h-[480px]">
                  {dashboard.keyAssumptions && (
                    <div className="bg-white rounded-xl shadow-md border-l-4 border-amber-500 p-4">
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
                    <div className="bg-white rounded-xl shadow-md border-l-4 border-indigo-500 p-4">
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
                <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[480px]">
                  <div className="bg-white rounded-xl shadow-md border border-slate-200/50 p-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Market Factors</h3>
                    <div className="space-y-3">
                      {marketFactors.map((f, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600">{f.label}</span>
                            <span className="font-semibold">{f.value}/100</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${f.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-md border border-slate-200/50 p-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Execution Factors</h3>
                    <div className="space-y-3">
                      {executionFactors.map((f, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600">{f.label}</span>
                            <span className="font-semibold">{f.value}/100</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-violet-500 rounded-full"
                              style={{ width: `${f.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
            {activeTab === 3 && (
              <>
                <div className="space-y-4 overflow-y-auto max-h-[480px]">
                  {dashboard.financialSummary && (
                    <div className="bg-white rounded-xl shadow-md border border-slate-200/50 p-4">
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
                  <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border-2 border-indigo-200/60 p-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-indigo-600" /> Business Plan
                    </h3>
                    <p className="text-slate-600 text-xs mb-3">
                      Formalize with financials, GTM and projections.
                    </p>
                    <button
                      onClick={handleGenerateBusinessPlan}
                      disabled={isGeneratingBusinessPlan}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isGeneratingBusinessPlan ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                        </>
                      ) : (
                        <>
                          <Briefcase className="w-4 h-4" /> Generate Business Plan
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[480px]">
                  {businessPlanContent ? (
                    <div className="bg-white rounded-xl shadow-md border border-slate-200/50 p-4">
                      <h3 className="text-sm font-bold text-slate-900 mb-3">Business Plan</h3>
                      <div className="markdown-content text-slate-700 prose prose-slate prose-sm max-w-none prose-headings:text-slate-900 prose-h2:text-base prose-h3:text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {businessPlanContent}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
                      <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">Generate a business plan to see it here.</p>
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

          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-2xl bg-white/20 shrink-0">
                  <Swords className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Ready to stress-test your logic?
                  </h3>
                  <p className="text-violet-100 text-base mt-2">
                    Defend your position. Find blind spots. Refine before you build.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/debate"
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-violet-700 font-bold hover:bg-violet-50 transition-colors shadow-lg text-base"
                >
                  <Swords className="w-5 h-5" />
                  Debate this idea
                </Link>
                <button
                  onClick={handleValidateNew}
                  className="px-6 py-4 rounded-xl border-2 border-white/40 text-white font-semibold hover:bg-white/10 transition-colors"
                >
                  Validate another
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
