"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  FlaskConical,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Target,
  AlertTriangle,
  ListChecks,
  Zap,
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

const MAX_TOPIC_LENGTH = 500;
const MAX_POSITION_LENGTH = 2000;
const MAX_CONTEXT_LENGTH = 1000;
const MAX_CONTEXT_WITH_REFINEMENTS = 12000;

const REVALIDATE_STORAGE_KEY = "revalidate";

const VALID_LENS = new Set<DebateSetup["lens"]>([
  "investor",
  "customer",
  "competitor",
  "postmortem",
  "market",
  "future",
]);

const PROGRESS_STEPS = [
  { label: "Analyzing idea", icon: "🔍" },
  { label: "Market & competition", icon: "📊" },
  { label: "Risks & financials", icon: "⚠️" },
  { label: "Building report", icon: "📋" },
];

function sanitize(text: string, maxLen: number): string {
  return text.slice(0, maxLen).trim();
}

function JourneyForm() {
  const router = useRouter();

  const [setup, setSetup] = useState<DebateSetup>({
    template: "validate",
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
            if ((accumulated.includes("### Market") || accumulated.includes("### Competitive")) && progressStep < 1)
              setProgressStep(1);
            if ((accumulated.includes("### Risk") || accumulated.includes("### Financial")) && progressStep < 2)
              setProgressStep(2);
            if (
              (accumulated.includes("### Top") ||
                accumulated.includes("### One-Line") ||
                accumulated.includes("### Lean")) &&
              progressStep < 3
            )
              setProgressStep(3);
          }
        } catch {
          /* skip malformed chunk */
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

      router.push("/results?source=journey");
    } catch (e) {
      if (progressInterval.current) clearInterval(progressInterval.current);
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const overallProgress = Math.round(((progressStep + 1) / PROGRESS_STEPS.length) * 100);

  const LOADING_STEPS = [
    {
      icon: <Sparkles className="h-5 w-5" />,
      label: "Analyzing idea",
      desc: "Scores, risks, and structure",
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "Market & competition",
      desc: "Sizing and competitor map",
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      icon: <AlertTriangle className="h-5 w-5" />,
      label: "Risks & financials",
      desc: "Unit economics and flags",
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      icon: <Target className="h-5 w-5" />,
      label: "Building report",
      desc: "Radar, canvas, next steps",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  const fieldShell =
    "w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder:text-white/25 transition-all focus:border-indigo-500/45 focus:bg-white/[0.06] focus:outline-none";

  if (isLoading || streamingContent) {
    return (
      <AppShell
        maxWidth="5xl"
        particleCount={40}
        magneticStrength={0.08}
        header={
          <>
            <AppLogoLink />
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-white/30 transition-colors hover:text-white/60"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>
          </>
        }
      >
        <div className="relative z-1 mx-auto flex w-full max-w-xl flex-1 flex-col items-stretch justify-center overflow-y-auto px-4 py-12 sm:px-6 sm:py-16 lg:max-w-2xl">
          <div className="flex flex-col items-center mb-10">
            <motion.div
              className="relative mb-6"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-indigo-500/20 bg-linear-to-br from-indigo-500/15 to-violet-500/15">
                <div className={`transition-all duration-500 ${LOADING_STEPS[progressStep]?.color || "text-indigo-400"}`}>
                  {LOADING_STEPS[progressStep]?.icon || <Loader2 className="h-8 w-8 animate-spin" />}
                </div>
              </div>
              <div className="absolute -inset-3 animate-pulse rounded-4xl border border-indigo-500/10" />
            </motion.div>

            <h2 className="mb-1 text-center text-xl font-bold text-white">
              {LOADING_STEPS[progressStep]?.label || "Analyzing…"}
            </h2>
            <p className="text-center text-sm text-white/35">{LOADING_STEPS[progressStep]?.desc || "Building your report…"}</p>
            <p className="mt-4 max-w-xs truncate rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-xs text-white/40">
              {setup.topic}
            </p>
          </div>

          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-white/30">Progress</span>
              <span className="text-xs font-bold text-indigo-400">{overallProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/6">
              <div
                className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500 transition-all duration-1000 ease-out"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {LOADING_STEPS.map((step, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3.5 rounded-xl border px-4 py-3 transition-all duration-700",
                  i < progressStep
                    ? "border-white/4 bg-white/2"
                    : i === progressStep
                      ? `${step.bg} border`
                      : "border-transparent opacity-40",
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    i < progressStep
                      ? "bg-emerald-500/15 text-emerald-400"
                      : i === progressStep
                        ? `${step.bg} ${step.color}`
                        : "text-white/20",
                  )}
                >
                  {i < progressStep ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : i === progressStep ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-white/20" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-sm font-medium",
                      i < progressStep ? "text-white/50" : i === progressStep ? "text-white/90" : "text-white/25",
                    )}
                  >
                    {step.label}
                  </span>
                  {i === progressStep && <span className="mt-0.5 block text-[11px] text-white/30">{step.desc}</span>}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-[11px] leading-relaxed text-white/20">
            Opens your full score dashboard when the stream completes — same report as the classic validation flow.
          </p>

          {error && (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
          )}
        </div>
      </AppShell>
    );
  }

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
              href="/validate"
              className="hidden text-xs text-white/35 transition-colors hover:text-white/70 sm:inline"
            >
              Classic form
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
      <div className="relative z-[1] mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="text-center sm:text-left"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-indigo-200/90">
              <Zap className="h-3.5 w-3.5 text-indigo-400" />
              Guided path
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl sm:leading-[1.1]">
              Stress-test your idea.
              <span className="block bg-linear-to-r from-indigo-200 to-violet-300 bg-clip-text text-transparent">
                See scores first. Persona interviews second.
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/45 sm:mx-0">
              Step one runs the full viability report — radar chart, category scores, risks, and canvas — the same dashboard
              you get from validation. Then you run <span className="text-white/70">five validation interviews</span> — one AI
              persona per thread, so each lens stays sharp.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="relative mt-12"
          >
            <div className="absolute -inset-px rounded-[1.35rem] bg-linear-to-b from-indigo-500/35 via-violet-500/15 to-transparent" />
            <div className="relative rounded-[1.3rem] border border-white/[0.07] bg-[#07070d]/95 p-6 backdrop-blur-md sm:p-9">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">Your pitch</h2>
                  <p className="mt-1 text-xs text-white/40">Be specific — thin input gets rejected.</p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-white/45">
                  <FlaskConical className="h-4 w-4" />
                  Full validation
                </div>
              </div>

              <div className="space-y-7">
                <div className="flex gap-3 sm:gap-4">
                  <span className="mt-7 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/25 bg-indigo-500/10 text-xs font-bold text-indigo-200">
                    1
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <label className="block text-sm font-medium text-white/65">What&apos;s your startup idea?</label>
                    <input
                      type="text"
                      placeholder="One line — what are you building?"
                      value={setup.topic}
                      onChange={(e) => setSetup({ ...setup, topic: e.target.value })}
                      maxLength={MAX_TOPIC_LENGTH}
                      className={fieldShell}
                    />
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <span className="mt-7 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/25 bg-indigo-500/10 text-xs font-bold text-indigo-200">
                    2
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <label className="block text-sm font-medium text-white/65">Why do you believe it will work?</label>
                    <textarea
                      placeholder="Problem, who it’s for, why you can win — real sentences."
                      value={setup.position}
                      onChange={(e) => setSetup({ ...setup, position: e.target.value })}
                      maxLength={MAX_POSITION_LENGTH}
                      rows={5}
                      className={cn(fieldShell, "min-h-[140px] resize-y")}
                    />
                    <p className="text-[11px] text-white/28">
                      {setup.position.length > 0 ? `${setup.position.length}/${MAX_POSITION_LENGTH}` : "Minimum quality checks apply."}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <span className="mt-7 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.04] text-xs font-bold text-white/35">
                    3
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <label className="block text-sm font-medium text-white/65">
                      Context <span className="font-normal text-white/25">(optional)</span>
                    </label>
                    <textarea
                      placeholder="Team, runway, constraints…"
                      value={setup.context}
                      onChange={(e) => setSetup({ ...setup, context: e.target.value })}
                      maxLength={contextMaxLength}
                      rows={2}
                      className={cn(fieldShell, "resize-y")}
                    />
                  </div>
                </div>

                <label
                  htmlFor="journey-human"
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors hover:border-white/12"
                >
                  <input
                    type="checkbox"
                    id="journey-human"
                    checked={humanCheck}
                    onChange={(e) => setHumanCheck(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 bg-white/5 accent-indigo-500"
                  />
                  <span className="text-sm leading-relaxed text-white/42">
                    I confirm this idea is mine and I&apos;m not a bot. I understand my text is processed to build the report.
                  </span>
                </label>

                {error && (
                  <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!valid || isLoading}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/10 to-transparent" />
                  Open score dashboard
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>

                <p className="text-center text-[11px] text-white/25">
                  Typical run ~60–120s · Then open <span className="text-white/40">Interviews</span> for five persona threads.
                </p>
              </div>
            </div>
          </motion.div>

          <ul className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              { icon: <BarChart3 className="h-4 w-4" />, t: "Full rubric & radar on results" },
              { icon: <ListChecks className="h-4 w-4" />, t: "Same engine as /validate" },
              { icon: <Sparkles className="h-4 w-4" />, t: "5 persona interviews after scores" },
            ].map((x) => (
              <li
                key={x.t}
                className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left text-[12px] text-white/45"
              >
                <span className="mt-0.5 text-indigo-400/90">{x.icon}</span>
                {x.t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

export default function JourneyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center t-bg">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500/50" />
        </div>
      }
    >
      <JourneyForm />
    </Suspense>
  );
}
