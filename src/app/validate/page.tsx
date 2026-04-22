"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  FlaskConical,
  Wand2,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Target,
  AlertTriangle,
  Clock,
  ArrowRightCircle,
  ListChecks,
} from "lucide-react";
import { AppShell, AppLogoLink } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import { classifyIdeaCategory } from "@/lib/idea-category";
import { saveSession } from "@/lib/session";
import {
  CONTENT_POLICY_ERROR,
  isContentPolicyViolation,
  validateStartupIdeaFields,
} from "@/lib/contentModeration";
import { messageFromFailedResponse } from "@/lib/read-api-error";
import { appendSseLines } from "@/lib/sse-lines";
import { setupContextHasRefinements } from "@/lib/scoring-scale";
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
    position: "Your background, experience & problems you've seen",
    context: "Your situation",
  },
};

const MAX_TOPIC_LENGTH = 500;
const MAX_POSITION_LENGTH = 2000;
const MAX_CONTEXT_LENGTH = 1000;
/** Longer context when refinement marker is present; must match API `MAX_CONTEXT_WITH_REFINEMENTS`. */
const MAX_CONTEXT_WITH_REFINEMENTS = 12000;

const MODE_VALIDATE_META = {
  href: "/validate" as const,
  kicker: "Idea validation",
  headline: "Stress-test your startup idea",
  sub:
    "Structured scores, market sizing, competition, risks, and next steps — written like a candid advisor, not a cheerleader.",
  cardTitle: "I have an idea",
  cardHint: "Viability report + canvas",
};

const MODE_GENERATE_META = {
  href: "/validate?mode=generate" as const,
  kicker: "Idea generator",
  headline: "Generate ideas that fit you",
  sub:
    "Share themes, background, and constraints. We propose distinct concepts you can open as full validation reports.",
  cardTitle: "Help me discover ideas",
  cardHint: "Tailored concepts",
};

const PROGRESS_STEPS = [
  { label: "Analyzing idea", icon: "🔍" },
  { label: "Market & competition", icon: "📊" },
  { label: "Risks & financials", icon: "⚠️" },
  { label: "Building report", icon: "📋" },
];

function sanitize(text: string, maxLen: number): string {
  return text.slice(0, maxLen).trim();
}

/** Session key must match `results` page. */
const REVALIDATE_STORAGE_KEY = "revalidate";

const VALID_LENS = new Set<DebateSetup["lens"]>([
  "investor",
  "customer",
  "competitor",
  "postmortem",
  "market",
  "future",
]);

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

  /** Restore idea fields when coming from Results (Edit & re-run) or journey. */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(REVALIDATE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<DebateSetup>;
      sessionStorage.removeItem(REVALIDATE_STORAGE_KEY);
      setSetup((s) => ({
        ...s,
        ...parsed,
        topic: typeof parsed.topic === "string" ? parsed.topic : s.topic,
        position: typeof parsed.position === "string" ? parsed.position : s.position,
        context: typeof parsed.context === "string" ? parsed.context : s.context,
        template: parsed.template === "generate" || parsed.template === "validate" ? parsed.template : s.template,
        lens:
          typeof parsed.lens === "string" && VALID_LENS.has(parsed.lens as DebateSetup["lens"])
            ? (parsed.lens as DebateSetup["lens"])
            : s.lens,
      }));
      setHumanCheck(false);
    } catch {
      sessionStorage.removeItem(REVALIDATE_STORAGE_KEY);
    }
  }, []);

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

  const contextMaxLength = setupContextHasRefinements(setup.context)
    ? MAX_CONTEXT_WITH_REFINEMENTS
    : MAX_CONTEXT_LENGTH;

  const qualityErr = validateStartupIdeaFields({
    topic: setup.topic,
    position: setup.position,
    context: setup.context,
    template: setup.template,
  });
  const allText = [setup.topic, setup.position, setup.context].filter(Boolean).join(" ");
  const policyBlocked = isContentPolicyViolation(allText);
  const valid = qualityErr === null && !policyBlocked && humanCheck;

  const handleSubmit = async () => {
    if (!valid || isLoading) return;

    if (qualityErr) {
      setError(qualityErr);
      return;
    }
    if (policyBlocked) {
      setError(CONTENT_POLICY_ERROR);
      return;
    }

    const sanitized: DebateSetup = {
      ...setup,
      topic: sanitize(setup.topic, MAX_TOPIC_LENGTH),
      position: sanitize(setup.position, MAX_POSITION_LENGTH),
      context: sanitize(setup.context, contextMaxLength),
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
        throw new Error(await messageFromFailedResponse(response));
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/html")) {
        throw new Error(await messageFromFailedResponse(response));
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let accumulated = "";
      let scoreReconciliation: unknown = null;
      let sseBuf = "";
      let streamDone = false;

      const handleSseLine = (line: string) => {
        if (!line.startsWith("data: ")) return;
        const data = line.slice(6);
        if (data === "[DONE]") {
          streamDone = true;
          return;
        }
        try {
          const parsed = JSON.parse(data) as { content?: string; scoreReconciliation?: unknown };
          if (parsed.scoreReconciliation) {
            scoreReconciliation = parsed.scoreReconciliation;
            return;
          }
          if (parsed.content) {
            accumulated += parsed.content;
            setStreamingContent(accumulated);

            if ((accumulated.includes("### Market") || accumulated.includes("### Competitive")) && progressStep < 1) setProgressStep(1);
            if ((accumulated.includes("### Risk") || accumulated.includes("### Financial")) && progressStep < 2) setProgressStep(2);
            if ((accumulated.includes("### Top") || accumulated.includes("### One-Line") || accumulated.includes("### Lean")) && progressStep < 3) setProgressStep(3);
          }
        } catch {
          // skip malformed chunk
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const { buffer, lines } = appendSseLines(sseBuf, chunk);
        sseBuf = buffer;
        for (const line of lines) {
          handleSseLine(line);
          if (streamDone) break;
        }
        if (streamDone) break;
      }
      if (sseBuf.replace(/\r$/, "").trim()) handleSseLine(sseBuf.replace(/\r$/, ""));

      if (progressInterval.current) clearInterval(progressInterval.current);

      if (!accumulated.trim()) {
        throw new Error(
          "No report was received from the server. Check your connection and try again. If this keeps happening, the AI request may have failed.",
        );
      }

      const validationMessage: Message = {
        id: Date.now().toString(),
        role: "opponent",
        content: accumulated,
      };

      const cat = classifyIdeaCategory(sanitized.topic, sanitized.position);
      saveSession({
        setup: sanitized,
        validationContent: accumulated,
        messages: [validationMessage],
        createdAt: Date.now(),
        ideaCategory: { id: cat.id, label: cat.label },
        ...(scoreReconciliation ? { scoreReconciliation: scoreReconciliation as import("@/lib/types").ScoreReconciliation } : {}),
      });

      // Both validate and generate modes route to /results
      // The session has validationContent which /results will display
      router.push("/results");
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

  const pageMeta = isGenerate ? MODE_GENERATE_META : MODE_VALIDATE_META;

  // Streaming view — PURE LOADING SCREEN, no content shown
  if (isLoading || streamingContent) {
    return (
      <AppShell
        maxWidth="5xl"
        particleCount={40}
        magneticStrength={0.08}
        header={
          <>
            <AppLogoLink />
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-xs text-white/30 transition-colors hover:text-white/60"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Link>
            </div>
          </>
        }
      >
        <div className="relative z-1 mx-auto flex w-full max-w-xl flex-1 flex-col items-stretch justify-center overflow-y-auto px-4 py-12 sm:px-6 sm:py-16 lg:max-w-2xl">

            {/* Big animated icon */}
            <div className="flex flex-col items-center mb-10">
              <motion.div
                className="relative mb-6"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-24 h-24 rounded-3xl bg-linear-to-br from-indigo-500/15 to-violet-500/15 border border-indigo-500/20 flex items-center justify-center">
                  <div className={`transition-all duration-500 ${LOADING_STEPS[progressStep]?.color || "text-indigo-400"}`}>
                    {LOADING_STEPS[progressStep]?.icon || <Loader2 className="w-8 h-8 animate-spin" />}
                  </div>
                </div>
                {/* Pulsing ring */}
                <div className="absolute -inset-3 rounded-4xl border border-indigo-500/10 animate-pulse" />
                <div className="absolute -inset-6 rounded-[2.5rem] border border-indigo-500/5 animate-pulse" style={{ animationDelay: "500ms" }} />
              </motion.div>

              <h2 className="text-xl font-bold text-white text-center mb-1">
                {LOADING_STEPS[progressStep]?.label || "Analyzing..."}
              </h2>
              <p className="text-sm text-white/35 text-center max-w-xs">
                {LOADING_STEPS[progressStep]?.desc || "Processing your idea..."}
              </p>

              {/* Idea name */}
              <div className="mt-4 px-4 py-2 rounded-full bg-white/4 border border-white/6">
                <p className="text-xs text-white/40 truncate max-w-xs">{setup.topic}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white/30">Progress</span>
                <span className="text-xs font-bold text-indigo-400">{overallProgress}%</span>
              </div>
              <div className="h-2 bg-white/6 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500 transition-all duration-1000 ease-out"
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
                      ? "bg-white/2 border-white/4"
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

            {/* Estimated time — staged UI; model may stream in one pass */}
            <p className="mt-8 text-center text-[11px] leading-relaxed text-white/20">
              Stages advance on a timer and when key sections appear in the stream. Most runs finish in about 60–120 seconds
              (a follow-up pass may append missing sections). Your report opens automatically.
            </p>

            {error && (
              <div className="mt-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
        </div>
      </AppShell>
    );
  }

  const fieldShell =
    "w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder:text-white/25 transition-all focus:border-indigo-500/45 focus:bg-white/[0.06] focus:outline-none";

  return (
    <AppShell
      maxWidth="5xl"
      particleCount={42}
      magneticStrength={0.075}
      header={
        <>
          <AppLogoLink />
          <div className="flex items-center gap-3">
            <Link
              href="/debate"
              className="hidden text-xs text-white/35 transition-colors hover:text-white/70 sm:inline"
            >
              Interviews
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white/70"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>
          </div>
        </>
      }
    >
      <div className="relative z-[1] mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 lg:items-start">
          {/* Intro + mode + expectations */}
          <motion.div
            className="space-y-8 lg:col-span-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-400/90">
                {pageMeta.kicker}
              </p>
              <h1 className="mb-3 text-3xl font-bold tracking-tight text-white sm:text-4xl sm:leading-[1.12]">
                {pageMeta.headline}
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-white/45 sm:text-[0.9375rem]">
                {pageMeta.sub}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">Choose a path</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <Link
                  href={MODE_VALIDATE_META.href}
                  scroll={false}
                  className={cn(
                    "group relative flex flex-col gap-1 rounded-2xl border p-4 transition-all",
                    !isGenerate
                      ? "border-indigo-500/40 bg-linear-to-br from-indigo-500/15 to-violet-500/5 shadow-[0_0_0_1px_rgba(99,102,241,0.15)]"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl border",
                        !isGenerate
                          ? "border-indigo-400/35 bg-indigo-500/20 text-indigo-200"
                          : "border-white/10 bg-white/5 text-white/45 group-hover:text-white/70",
                      )}
                    >
                      <FlaskConical className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <span className="block text-sm font-semibold text-white">Validate</span>
                      <span className="block text-[11px] text-white/40">{MODE_VALIDATE_META.cardHint}</span>
                    </div>
                    <ArrowRightCircle
                      className={cn(
                        "h-5 w-5 shrink-0 transition-transform",
                        !isGenerate ? "text-indigo-300" : "text-white/20 group-hover:translate-x-0.5",
                      )}
                    />
                  </div>
                  <p className="text-[11px] leading-snug text-white/35">{MODE_VALIDATE_META.cardTitle}</p>
                </Link>

                <Link
                  href={MODE_GENERATE_META.href}
                  scroll={false}
                  className={cn(
                    "group relative flex flex-col gap-1 rounded-2xl border p-4 transition-all",
                    isGenerate
                      ? "border-violet-500/40 bg-linear-to-br from-violet-500/15 to-indigo-500/5 shadow-[0_0_0_1px_rgba(139,92,246,0.15)]"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl border",
                        isGenerate
                          ? "border-violet-400/35 bg-violet-500/20 text-violet-200"
                          : "border-white/10 bg-white/5 text-white/45 group-hover:text-white/70",
                      )}
                    >
                      <Wand2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <span className="block text-sm font-semibold text-white">Generate</span>
                      <span className="block text-[11px] text-white/40">{MODE_GENERATE_META.cardHint}</span>
                    </div>
                    <ArrowRightCircle
                      className={cn(
                        "h-5 w-5 shrink-0 transition-transform",
                        isGenerate ? "text-violet-300" : "text-white/20 group-hover:translate-x-0.5",
                      )}
                    />
                  </div>
                  <p className="text-[11px] leading-snug text-white/35">{MODE_GENERATE_META.cardTitle}</p>
                </Link>
              </div>
            </div>

            <div className="hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 lg:block">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/35">What to expect</p>
              <ul className="space-y-3 text-sm text-white/40">
                <li className="flex gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400/70" />
                  <span>Most runs finish in about 60–120 seconds. Your report opens automatically.</span>
                </li>
                <li className="flex gap-2.5">
                  <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400/70" />
                  <span>
                    {isGenerate
                      ? "You get generated concepts with rationale — open any as a full validation."
                      : "Scores, risks, market context, and a lean-style summary in one view."}
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400/70" />
                  <span>No account required to run this flow.</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Form card */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl p-px bg-linear-to-b from-indigo-500/28 via-violet-500/12 to-transparent">
              <div className="rounded-2xl bg-[#07070d]/92 backdrop-blur-md sm:p-8 p-5">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.06] pb-5">
                  <div>
                    <h2 className="text-base font-semibold text-white">Your details</h2>
                    <p className="mt-1 text-xs text-white/35">{template.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-white/45">
                    {template.icon}
                    <span>{isGenerate ? "Generator" : "Validator"}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
                    className="flex gap-3 sm:gap-4"
                  >
                    <span className="mt-7 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/25 bg-indigo-500/10 text-xs font-bold text-indigo-200">
                      1
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <label className="block text-sm font-medium text-white/65">{template.labels.topic}</label>
                      <input
                        type="text"
                        placeholder={template.placeholder.topic}
                        value={setup.topic}
                        onChange={(e) => setSetup({ ...setup, topic: e.target.value })}
                        maxLength={MAX_TOPIC_LENGTH}
                        className={fieldShell}
                      />
                      {setup.topic.length > 0 && (
                        <p className="text-[11px] text-white/25">
                          {setup.topic.length}/{MAX_TOPIC_LENGTH}
                        </p>
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.12, ease: "easeOut" }}
                    className="flex gap-3 sm:gap-4"
                  >
                    <span className="mt-7 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/25 bg-indigo-500/10 text-xs font-bold text-indigo-200">
                      2
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <label className="block text-sm font-medium text-white/65">{template.labels.position}</label>
                      <textarea
                        placeholder={template.placeholder.position}
                        value={setup.position}
                        onChange={(e) => setSetup({ ...setup, position: e.target.value })}
                        maxLength={MAX_POSITION_LENGTH}
                        rows={isGenerate ? 5 : 4}
                        className={cn(fieldShell, "min-h-[120px] resize-y")}
                      />
                      <p className="text-[11px] leading-relaxed text-white/30">
                        {isGenerate
                          ? "A few real sentences on background and interests are required — thin or generic text is rejected."
                          : "Include problem, who it’s for, and why you can win. Vague or filler text won’t pass quality checks."}
                      </p>
                      {setup.position.length > 0 && (
                        <p className="text-[11px] text-white/25">
                          {setup.position.length}/{MAX_POSITION_LENGTH}
                        </p>
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                    className="flex gap-3 sm:gap-4"
                  >
                    <span className="mt-7 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.04] text-xs font-bold text-white/35">
                      3
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <label className="block text-sm font-medium text-white/65">
                        {template.labels.context}{" "}
                        <span className="font-normal text-white/25">(optional)</span>
                      </label>
                      <textarea
                        placeholder={template.placeholder.context}
                        value={setup.context}
                        onChange={(e) => setSetup({ ...setup, context: e.target.value })}
                        maxLength={contextMaxLength}
                        rows={2}
                        className={cn(fieldShell, "resize-y")}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.28, ease: "easeOut" }}
                  >
                    <label
                      htmlFor="human"
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors hover:border-white/12 hover:bg-white/[0.04]"
                    >
                      <input
                        type="checkbox"
                        id="human"
                        checked={humanCheck}
                        onChange={(e) => setHumanCheck(e.target.checked)}
                        className="mt-0.5 rounded border-white/20 bg-white/5 accent-indigo-500"
                      />
                      <span className="text-sm leading-relaxed text-white/42">
                        {isGenerate ? (
                          <>
                            I confirm these inputs are mine and I&apos;m not a bot. I understand my text is processed
                            to generate ideas and reports.
                          </>
                        ) : (
                          <>
                            I confirm this idea is mine and I&apos;m not a bot. I understand my text is processed to
                            build the validation report.
                          </>
                        )}
                      </span>
                    </label>
                  </motion.div>

                  {error && (
                    <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.36, ease: "easeOut" }}
                  >
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!valid || isLoading}
                      className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <span className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/10 to-transparent" />
                      {isGenerate ? "Generate ideas" : "Run validation"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                    {!valid && !isLoading && humanCheck && (
                      <p className="mt-2 text-center text-[11px] text-white/28">
                        {!isGenerate && setup.topic.trim().length < 3 && "Idea needs at least 3 characters. "}
                        {setup.position.trim().length < 10 && "Add at least 10 characters in step 2."}
                      </p>
                    )}
                  </motion.div>

                  <p className="text-center text-[11px] text-white/25 lg:hidden">
                    Typical run ~60–120s · Report opens when ready · No signup
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function ValidatePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center t-bg">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500/50" />
      </div>
    }>
      <ValidateForm />
    </Suspense>
  );
}
