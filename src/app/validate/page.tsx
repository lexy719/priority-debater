"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight, Loader2, FlaskConical, Wand2, CheckCircle2, Zap, Sparkles, BarChart3, Target, Users, Swords, AlertTriangle, DollarSign, Lightbulb, FileText } from "lucide-react";
import { saveSession } from "@/lib/session";
import { shouldBlock } from "@/lib/contentModeration";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { DebateSetup, Message } from "@/lib/types";

const ideaValidatorTemplate = {
  id: "validate",
  icon: <FlaskConical className="w-5 h-5" />,
  title: "Validate Your Idea",
  subtitle: "Full viability report with scores, risks, and market analysis",
  placeholder: {
    topic: "e.g. AI-powered meeting summarizer for remote teams",
    position: "Why it will work: market timing, your edge, business model...",
    context: "Your situation: team size, runway, target market (optional)",
  },
  labels: {
    topic: "What's your startup idea?",
    position: "Why do you believe it will work?",
    context: "Your resources & context",
  },
};

const generateTemplate = {
  id: "generate",
  icon: <Wand2 className="w-5 h-5" />,
  title: "Generate an Idea",
  subtitle: "Tell us about yourself and we'll generate ideas that fit",
  placeholder: {
    topic: "AI, B2B SaaS, healthcare, or leave blank",
    position: "Problems I've experienced. Technical background. Prefer B2B.",
    context: "Solo founder, 12 months runway",
  },
  labels: {
    topic: "Industries or themes you like",
    position: "Your background, skills & problems you've seen",
    context: "Your situation",
  },
};

const MAX_TOPIC_LENGTH = 500;
const MAX_POSITION_LENGTH = 2000;
const MAX_CONTEXT_LENGTH = 1000;

const PROGRESS_STEPS = [
  { label: "Analyzing idea", icon: "🔍" },
  { label: "Market & competition", icon: "📊" },
  { label: "Risks & financials", icon: "⚠️" },
  { label: "Building report", icon: "📋" },
];

function sanitize(text: string, maxLen: number): string {
  return text.slice(0, maxLen).trim();
}

function ValidateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGenerate = searchParams.get("mode") === "generate";

  const [setup, setSetup] = useState<DebateSetup>({
    template: isGenerate ? "generate" : "validate",
    topic: "",
    position: "",
    context: "",
    lens: "investor",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [humanCheck, setHumanCheck] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [progressStep, setProgressStep] = useState(0);
  const streamRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSetup((s) => ({ ...s, template: isGenerate ? "generate" : "validate" }));
  }, [isGenerate]);

  useEffect(() => {
    if (streamRef.current && streamingContent) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [streamingContent]);

  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  const template = isGenerate ? generateTemplate : ideaValidatorTemplate;

  const valid =
    (isGenerate ? setup.position.trim().length >= 10 : setup.topic.trim().length >= 3 && setup.position.trim().length >= 10) &&
    humanCheck;

  const handleSubmit = async () => {
    if (!valid || isLoading) return;

    const allText = [setup.topic, setup.position, setup.context].filter(Boolean).join(" ");
    if (shouldBlock(allText)) {
      setError("I can help you debate ideas, but I can't provide instructions for harmful or illegal activities.");
      return;
    }

    const sanitized: DebateSetup = {
      ...setup,
      topic: sanitize(setup.topic, MAX_TOPIC_LENGTH),
      position: sanitize(setup.position, MAX_POSITION_LENGTH),
      context: sanitize(setup.context, MAX_CONTEXT_LENGTH),
    };

    setIsLoading(true);
    setError(null);
    setStreamingContent("");
    setProgressStep(0);

    progressInterval.current = setInterval(() => {
      setProgressStep((prev) => Math.min(prev + 1, PROGRESS_STEPS.length - 1));
    }, 12000);

    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", setup: sanitized }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to start");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let accumulated = "";

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
                accumulated += parsed.content;
                setStreamingContent(accumulated);

                if ((accumulated.includes("### Market") || accumulated.includes("### Competitive")) && progressStep < 1) setProgressStep(1);
                if ((accumulated.includes("### Risk") || accumulated.includes("### Financial")) && progressStep < 2) setProgressStep(2);
                if ((accumulated.includes("### Top") || accumulated.includes("### One-Line") || accumulated.includes("### Lean")) && progressStep < 3) setProgressStep(3);
              }
            } catch {
              // skip
            }
          }
        }
      }

      if (progressInterval.current) clearInterval(progressInterval.current);

      const validationMessage: Message = {
        id: Date.now().toString(),
        role: "opponent",
        content: accumulated,
      };

      saveSession({
        setup: sanitized,
        validationContent: accumulated,
        messages: [validationMessage],
        createdAt: Date.now(),
      });

      if (setup.template === "validate") {
        router.push("/results");
      } else {
        router.push("/debate");
      }
    } catch (e) {
      if (progressInterval.current) clearInterval(progressInterval.current);
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Progress percentage
  const overallProgress = Math.round(((progressStep + 1) / PROGRESS_STEPS.length) * 100);

  // 4 loading steps — fast and clean
  const LOADING_STEPS = [
    { icon: <Sparkles className="w-5 h-5" />, label: "Analyzing idea", desc: "Evaluating problem-solution fit and viability", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
    { icon: <BarChart3 className="w-5 h-5" />, label: "Market & competition", desc: "Sizing the market and mapping competitors", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { icon: <AlertTriangle className="w-5 h-5" />, label: "Risks & financials", desc: "Assessing risks and unit economics", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { icon: <Target className="w-5 h-5" />, label: "Building report", desc: "Scoring, recommendations, and lean canvas", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  ];

  // Streaming view — PURE LOADING SCREEN, no content shown
  if (isLoading || streamingContent) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-[#08080e] flex flex-col">
        {/* Header */}
        <div className="border-b border-white/[0.06] bg-[#08080e]/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Priority Debater</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Centered loading content */}
        <div className="flex-1 flex items-start justify-center overflow-y-auto">
          <div className="w-full max-w-lg px-4 sm:px-6 py-12 sm:py-16">

            {/* Big animated icon */}
            <div className="flex flex-col items-center mb-10">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 border border-indigo-500/20 flex items-center justify-center">
                  <div className={`transition-all duration-500 ${LOADING_STEPS[progressStep]?.color || "text-indigo-400"}`}>
                    {LOADING_STEPS[progressStep]?.icon || <Loader2 className="w-8 h-8 animate-spin" />}
                  </div>
                </div>
                {/* Pulsing ring */}
                <div className="absolute -inset-3 rounded-[2rem] border border-indigo-500/10 animate-pulse" />
                <div className="absolute -inset-6 rounded-[2.5rem] border border-indigo-500/5 animate-pulse" style={{ animationDelay: "500ms" }} />
              </div>

              <h2 className="text-xl font-bold text-white text-center mb-1">
                {LOADING_STEPS[progressStep]?.label || "Analyzing..."}
              </h2>
              <p className="text-sm text-white/35 text-center max-w-xs">
                {LOADING_STEPS[progressStep]?.desc || "Processing your idea..."}
              </p>

              {/* Idea name */}
              <div className="mt-4 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06]">
                <p className="text-xs text-white/40 truncate max-w-xs">{setup.topic}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white/30">Progress</span>
                <span className="text-xs font-bold text-indigo-400">{overallProgress}%</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000 ease-out"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            {/* Step list */}
            <div className="space-y-2">
              {LOADING_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl border transition-all duration-700 ${
                    i < progressStep
                      ? "bg-white/[0.02] border-white/[0.04]"
                      : i === progressStep
                        ? `${step.bg} border`
                        : "border-transparent opacity-40"
                  }`}
                >
                  {/* Icon */}
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    i < progressStep
                      ? "bg-emerald-500/15 text-emerald-400"
                      : i === progressStep
                        ? `${step.bg} ${step.color}`
                        : "text-white/20"
                  }`}>
                    {i < progressStep ? (
                      <CheckCircle2 className="w-4.5 h-4.5" />
                    ) : i === progressStep ? (
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-white/20" />
                    )}
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium block ${
                      i < progressStep
                        ? "text-white/50"
                        : i === progressStep
                          ? "text-white/90"
                          : "text-white/25"
                    }`}>
                      {step.label}
                    </span>
                    {i === progressStep && (
                      <span className="text-[11px] text-white/30 block mt-0.5">{step.desc}</span>
                    )}
                  </div>

                  {/* Status */}
                  {i < progressStep && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400/60 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Estimated time */}
            <p className="text-center text-[11px] text-white/20 mt-8">
              Usually takes 60–90 seconds · Your results will open automatically
            </p>

            {error && (
              <div className="mt-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#08080e] flex flex-col">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#08080e]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors">Priority Debater</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Title section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              {template.icon}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{template.title}</h1>
              <p className="text-sm text-white/35">{template.subtitle}</p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] w-fit mt-4">
            <Link
              href="/validate"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                !isGenerate ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" /> Validate
            </Link>
            <Link
              href="/validate?mode=generate"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                isGenerate ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Generate
            </Link>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              {template.labels.topic}
            </label>
            <input
              type="text"
              placeholder={template.placeholder.topic}
              value={setup.topic}
              onChange={(e) => setSetup({ ...setup, topic: e.target.value })}
              maxLength={MAX_TOPIC_LENGTH}
              className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all text-sm"
            />
            {setup.topic.length > 0 && (
              <p className="text-xs text-white/20 mt-1.5">{setup.topic.length}/{MAX_TOPIC_LENGTH}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              {template.labels.position}
            </label>
            <textarea
              placeholder={template.placeholder.position}
              value={setup.position}
              onChange={(e) => setSetup({ ...setup, position: e.target.value })}
              maxLength={MAX_POSITION_LENGTH}
              rows={4}
              className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all resize-none text-sm"
            />
            {setup.position.length > 0 && (
              <p className="text-xs text-white/20 mt-1.5">{setup.position.length}/{MAX_POSITION_LENGTH}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              {template.labels.context} <span className="text-white/20">(optional)</span>
            </label>
            <textarea
              placeholder={template.placeholder.context}
              value={setup.context}
              onChange={(e) => setSetup({ ...setup, context: e.target.value })}
              maxLength={MAX_CONTEXT_LENGTH}
              rows={2}
              className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all resize-none text-sm"
            />
          </div>

          {/* Human check */}
          <label
            htmlFor="human"
            className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition-colors"
          >
            <input
              type="checkbox"
              id="human"
              checked={humanCheck}
              onChange={(e) => setHumanCheck(e.target.checked)}
              className="mt-0.5 rounded border-white/20 bg-white/5 accent-indigo-500"
            />
            <span className="text-sm text-white/40 leading-relaxed">
              I confirm this is my own idea and I&apos;m not a bot. I understand my data is processed
              to generate the validation report.
            </span>
          </label>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!valid || isLoading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-500/20"
          >
            {isGenerate ? "Generate Ideas" : "Validate My Idea"}
            <ArrowRight className="w-4 h-4" />
          </button>
          {!valid && !isLoading && humanCheck && (
            <p className="text-xs text-white/25 text-center">
              {!isGenerate && setup.topic.trim().length < 3 && "Add at least 3 characters to your idea. "}
              {setup.position.trim().length < 10 && "Add at least 10 characters to your reasoning."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ValidatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#08080e]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500/50" />
      </div>
    }>
      <ValidateForm />
    </Suspense>
  );
}
