"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FlaskConical,
  Loader2,
  ShieldCheck,
  Sparkles,
  Target,
  Wand2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { classifyIdeaCategory } from "@/lib/idea-category";
import { saveSession } from "@/lib/session";
import { TEST_FIXTURE_SESSION } from "@/lib/test-fixture";
import {
  CONTENT_POLICY_ERROR,
  isContentPolicyViolation,
  validateStartupIdeaFields,
} from "@/lib/contentModeration";
import { messageFromFailedResponse } from "@/lib/read-api-error";
import { appendSseLines } from "@/lib/sse-lines";
import { setupContextHasRefinements } from "@/lib/scoring-scale";
import type { DebateSetup, Message } from "@/lib/types";

/* =============================================================
   Validate — idea input flow
   Warm off-black + violet primary. Single-column focused form.
   Numbers in serif, progress bar tabular, premium button treatment.
   ============================================================= */

const MAX_TOPIC_LENGTH = 500;
const MAX_POSITION_LENGTH = 2000;
const MAX_CONTEXT_LENGTH = 1000;
const MAX_CONTEXT_WITH_REFINEMENTS = 12000;
const REVALIDATE_STORAGE_KEY = "revalidate";

const VALID_LENS = new Set<DebateSetup["lens"]>([
  "investor", "customer", "competitor", "postmortem", "market", "future",
]);

const VALIDATE_COPY = {
  kicker: "Stress-test",
  headline: "Stress-test your startup idea",
  sub: "Structured scores, market sizing, competition, risks, and next steps — written like a candid advisor, not a cheerleader.",
  placeholder: {
    topic: "e.g. AI-powered meeting summarizer for remote teams",
    position: "Why it will work: market timing, your edge, business model…",
    context: "Your situation: team size, runway, target market (optional)",
  },
  labels: {
    topic: "What's your startup idea?",
    position: "Why do you believe it will work?",
    context: "Your resources & context",
  },
  buttonIdle: "Run validation",
  buttonLoading: "Validating…",
  positionHint: "Include problem, who it's for, and why you can win. Vague or filler text won't pass quality checks.",
};

const GENERATE_COPY = {
  kicker: "Generate",
  headline: "Generate ideas that fit you",
  sub: "Share themes, background, and constraints. We propose distinct concepts you can open as full validation reports.",
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
  buttonIdle: "Generate ideas",
  buttonLoading: "Generating…",
  positionHint: "A few real sentences on background and interests are required — thin or generic text is rejected.",
};

const PROGRESS_STEPS = [
  { icon: <Sparkles className="h-4 w-4" />, label: "Analyzing idea", desc: "Evaluating problem-solution fit and viability" },
  { icon: <BarChart3 className="h-4 w-4" />, label: "Market & competition", desc: "Sizing the market and mapping competitors" },
  { icon: <ShieldCheck className="h-4 w-4" />, label: "Risks & financials", desc: "Assessing risks and unit economics" },
  { icon: <Target className="h-4 w-4" />, label: "Building report", desc: "Scoring, recommendations, and lean canvas" },
];

function sanitize(text: string, maxLen: number): string {
  return text.slice(0, maxLen).trim();
}

function ValidateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGenerate = searchParams.get("mode") === "generate";
  const copy = isGenerate ? GENERATE_COPY : VALIDATE_COPY;

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
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSetup((s) => ({ ...s, template: isGenerate ? "generate" : "validate" }));
  }, [isGenerate]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(REVALIDATE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<DebateSetup>;
      sessionStorage.removeItem(REVALIDATE_STORAGE_KEY);
      setSetup((s) => ({
        ...s,
        topic: typeof parsed.topic === "string" ? parsed.topic : s.topic,
        position: typeof parsed.position === "string" ? parsed.position : s.position,
        context: typeof parsed.context === "string" ? parsed.context : s.context,
        template: parsed.template === "generate" || parsed.template === "validate" ? parsed.template : s.template,
        lens:
          typeof parsed.lens === "string" && VALID_LENS.has(parsed.lens as DebateSetup["lens"])
            ? (parsed.lens as DebateSetup["lens"])
            : s.lens,
      }));
    } catch {
      sessionStorage.removeItem(REVALIDATE_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  const contextMaxLength = setupContextHasRefinements(setup.context)
    ? MAX_CONTEXT_WITH_REFINEMENTS
    : MAX_CONTEXT_LENGTH;

  const qualityErr = validateStartupIdeaFields({
    topic: setup.topic, position: setup.position, context: setup.context, template: setup.template,
  });
  const allText = [setup.topic, setup.position, setup.context].filter(Boolean).join(" ");
  const policyBlocked = isContentPolicyViolation(allText);
  const valid = qualityErr === null && !policyBlocked && humanCheck;

  const overallProgress = Math.round(((progressStep + 1) / PROGRESS_STEPS.length) * 100);

  const handleSubmit = async () => {
    if (!valid || isLoading) return;

    if (qualityErr) { setError(qualityErr); return; }
    if (policyBlocked) { setError(CONTENT_POLICY_ERROR); return; }

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

      if (!response.ok) throw new Error(await messageFromFailedResponse(response));
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/html")) throw new Error(await messageFromFailedResponse(response));

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
        if (data === "[DONE]") { streamDone = true; return; }
        try {
          const parsed = JSON.parse(data) as { content?: string; scoreReconciliation?: unknown };
          if (parsed.scoreReconciliation) { scoreReconciliation = parsed.scoreReconciliation; return; }
          if (parsed.content) {
            accumulated += parsed.content;
            setStreamingContent(accumulated);
            if ((accumulated.includes("### Market") || accumulated.includes("### Competitive")) && progressStep < 1) setProgressStep(1);
            if ((accumulated.includes("### Risk") || accumulated.includes("### Financial")) && progressStep < 2) setProgressStep(2);
            if ((accumulated.includes("### Top") || accumulated.includes("### One-Line") || accumulated.includes("### Lean")) && progressStep < 3) setProgressStep(3);
          }
        } catch { /* skip */ }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const { buffer, lines } = appendSseLines(sseBuf, chunk);
        sseBuf = buffer;
        for (const line of lines) { handleSseLine(line); if (streamDone) break; }
        if (streamDone) break;
      }
      if (sseBuf.replace(/\r$/, "").trim()) handleSseLine(sseBuf.replace(/\r$/, ""));

      if (progressInterval.current) clearInterval(progressInterval.current);
      if (!accumulated.trim()) throw new Error("No report received. Check your connection and try again.");

      const validationMessage: Message = { id: Date.now().toString(), role: "opponent", content: accumulated };
      const cat = classifyIdeaCategory(sanitized.topic, sanitized.position);
      saveSession({
        setup: sanitized,
        validationContent: accumulated,
        messages: [validationMessage],
        createdAt: Date.now(),
        ideaCategory: { id: cat.id, label: cat.label },
        ...(scoreReconciliation ? { scoreReconciliation: scoreReconciliation as import("@/lib/types").ScoreReconciliation } : {}),
      });

      router.push("/results");
    } catch (e) {
      if (progressInterval.current) clearInterval(progressInterval.current);
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadDemo = () => {
    saveSession({ ...TEST_FIXTURE_SESSION, createdAt: Date.now() });
    router.push("/results");
  };

  // ── Loading screen ──
  if (isLoading || streamingContent) {
    return (
      <div className="relative min-h-dvh overflow-hidden bg-[--bg] text-[--ink-0]">
        <div className="radial-hero absolute inset-0" />
        <header className="relative z-10 flex h-14 items-center justify-between px-6 sm:px-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-[--r-sm] border border-[--line-strong] bg-[--surface-2]">
              <span className="text-[10px] font-semibold tracking-wider">PD</span>
            </div>
            <span className="text-sm font-semibold">Priority Debater</span>
          </Link>
        </header>

        <main className="relative z-10 mx-auto flex max-w-xl flex-col items-center px-6 py-16">
          <div className="mb-10 flex flex-col items-center">
            <div className="relative mb-6">
              <div className="grid h-20 w-20 place-items-center rounded-[--r-lg] border border-[--accent-strong] bg-[--accent-soft] text-[--accent-ink] shadow-[0_0_40px_rgba(124,106,255,0.35)]">
                {PROGRESS_STEPS[progressStep]?.icon ?? <Loader2 className="h-6 w-6 animate-spin" />}
              </div>
              <div className="absolute -inset-2 rounded-[--r-lg] border border-[--accent]/20 [animation:pulse_2.5s_ease-in-out_infinite]" />
            </div>
            <span className="caption mb-2 text-[--accent-ink]">Step {progressStep + 1} of {PROGRESS_STEPS.length}</span>
            <h1 className="h1 mb-2 text-center text-[--ink-0]">{PROGRESS_STEPS[progressStep]?.label ?? "Analyzing…"}</h1>
            <p className="body max-w-sm text-center text-[--ink-1]">{PROGRESS_STEPS[progressStep]?.desc}</p>
            <div className="mt-5 rounded-[--r-sm] border border-[--line-strong] bg-[--surface-2] px-3 py-1.5">
              <p className="caption max-w-xs truncate text-[--ink-1]">{setup.topic}</p>
            </div>
          </div>

          <div className="mb-8 w-full">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="caption text-[--ink-2]">Progress</span>
              <span className="num-sm text-[--accent-ink]">{overallProgress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[--surface-2]">
              <div
                className="h-full rounded-full bg-[--accent] shadow-[0_0_12px_rgba(124,106,255,0.6)] transition-[width] duration-1000"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <ul className="w-full space-y-2">
            {PROGRESS_STEPS.map((step, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-center gap-3 rounded-[--r] border px-4 py-3 transition",
                  i < progressStep && "border-[--line] bg-[--surface-1]/60 text-[--ink-1]",
                  i === progressStep && "border-[--accent-strong] bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface-1))] text-[--ink-0]",
                  i > progressStep && "border-[--line] bg-[--surface-1] text-[--ink-2] opacity-50",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-[--r-sm] border",
                    i < progressStep && "border-[--success]/35 bg-[--success-soft] text-[--success]",
                    i === progressStep && "border-[--accent-strong] bg-[--accent-soft] text-[--accent-ink]",
                    i > progressStep && "border-[--line] text-[--ink-2]",
                  )}
                >
                  {i < progressStep ? <CheckCircle2 className="h-3.5 w-3.5" /> : i === progressStep ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : step.icon}
                </span>
                <span className="small font-medium">{step.label}</span>
              </li>
            ))}
          </ul>

          <p className="caption mt-8 text-center text-[--ink-2]">
            Most runs finish in 60–120 seconds. Your report opens automatically.
          </p>

          {error && (
            <div className="mt-6 w-full rounded-[--r] border border-[--error]/30 bg-[--error-soft] px-4 py-3 text-sm text-[--error]">
              {error}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ── Input form ──
  const charClass = (len: number, max: number) =>
    len === 0 ? "text-[--ink-2]" : len >= max * 0.95 ? "text-[--warning]" : "text-[--ink-1]";

  return (
    <div className="relative min-h-dvh bg-[--bg] text-[--ink-0]">
      <div className="radial-hero absolute inset-x-0 top-0 h-[60vh]" />

      <header className="relative z-10 flex h-14 items-center justify-between border-b border-[--line] bg-[--bg]/80 px-6 backdrop-blur-sm sm:px-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-[--r-sm] border border-[--line-strong] bg-[--surface-2]">
            <span className="text-[10px] font-semibold tracking-wider">PD</span>
          </div>
          <span className="text-sm font-semibold">Priority Debater</span>
        </Link>
        <Link href="/" className="caption inline-flex items-center gap-1.5 text-[--ink-2] transition hover:text-[--ink-0]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-2xl flex-col px-6 py-10 sm:py-14">
        {/* Hero */}
        <div className="mb-10">
          <span className="caption mb-3 inline-flex items-center gap-2 rounded-[--r-sm] border border-[--accent-strong] bg-[--accent-soft] px-2.5 py-1 text-[--accent-ink]">
            <Zap className="h-3 w-3" />
            {copy.kicker}
          </span>
          <h1 className="display mb-4 text-[--ink-0]" style={{ fontSize: "clamp(2.25rem, 4vw + 0.5rem, 3rem)" }}>{copy.headline}</h1>
          <p className="body max-w-xl text-[--ink-1]">{copy.sub}</p>
        </div>

        {/* Mode toggle */}
        <div className="mb-8 inline-flex items-center self-start rounded-[--r] border border-[--line-strong] bg-[--surface-2] p-1 text-sm">
          <Link
            href="/validate"
            scroll={false}
            className={cn(
              "inline-flex items-center gap-2 rounded-[calc(var(--r)-2px)] px-4 py-2 transition",
              !isGenerate ? "bg-[--surface-3] text-[--ink-0] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" : "text-[--ink-2] hover:text-[--ink-0]",
            )}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Validate
          </Link>
          <Link
            href="/validate?mode=generate"
            scroll={false}
            className={cn(
              "inline-flex items-center gap-2 rounded-[calc(var(--r)-2px)] px-4 py-2 transition",
              isGenerate ? "bg-[--surface-3] text-[--ink-0] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" : "text-[--ink-2] hover:text-[--ink-0]",
            )}
          >
            <Wand2 className="h-3.5 w-3.5" />
            Generate
          </Link>
        </div>

        {/* Form card */}
        <div className="card-featured p-6 sm:p-8">
          <div className="space-y-6">
            <FormField
              step={1}
              label={copy.labels.topic}
              charCount={setup.topic.length}
              charMax={MAX_TOPIC_LENGTH}
              charClass={charClass(setup.topic.length, MAX_TOPIC_LENGTH)}
            >
              <input
                type="text"
                placeholder={copy.placeholder.topic}
                value={setup.topic}
                onChange={(e) => setSetup({ ...setup, topic: e.target.value })}
                maxLength={MAX_TOPIC_LENGTH}
                className="w-full rounded-[--r] border border-[--line] bg-[--surface-1] px-3.5 py-2.5 text-sm text-[--ink-0] placeholder:text-[--ink-2] transition focus:border-[--accent-strong] focus:bg-[--surface-2] focus:shadow-[0_0_0_3px_var(--accent-soft)] focus:outline-none"
              />
            </FormField>

            <FormField
              step={2}
              label={copy.labels.position}
              hint={copy.positionHint}
              charCount={setup.position.length}
              charMax={MAX_POSITION_LENGTH}
              charClass={charClass(setup.position.length, MAX_POSITION_LENGTH)}
            >
              <textarea
                placeholder={copy.placeholder.position}
                value={setup.position}
                onChange={(e) => setSetup({ ...setup, position: e.target.value })}
                maxLength={MAX_POSITION_LENGTH}
                rows={isGenerate ? 5 : 4}
                className="w-full resize-y rounded-[--r] border border-[--line] bg-[--surface-1] px-3.5 py-2.5 text-sm text-[--ink-0] placeholder:text-[--ink-2] transition focus:border-[--accent-strong] focus:bg-[--surface-2] focus:shadow-[0_0_0_3px_var(--accent-soft)] focus:outline-none"
              />
            </FormField>

            <FormField
              step={3}
              label={`${copy.labels.context} (optional)`}
            >
              <textarea
                placeholder={copy.placeholder.context}
                value={setup.context}
                onChange={(e) => setSetup({ ...setup, context: e.target.value })}
                maxLength={contextMaxLength}
                rows={2}
                className="w-full resize-y rounded-[--r] border border-[--line] bg-[--surface-1] px-3.5 py-2.5 text-sm text-[--ink-0] placeholder:text-[--ink-2] transition focus:border-[--accent-strong] focus:bg-[--surface-2] focus:shadow-[0_0_0_3px_var(--accent-soft)] focus:outline-none"
              />
            </FormField>

            <label htmlFor="human" className="flex cursor-pointer items-start gap-3 rounded-[--r] border border-[--line] bg-[--surface-1] p-4 transition hover:border-[--line-strong]">
              <input
                type="checkbox"
                id="human"
                checked={humanCheck}
                onChange={(e) => setHumanCheck(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[--line-strong] bg-[--surface-2] accent-[--accent]"
              />
              <span className="small leading-relaxed text-[--ink-1]">
                {isGenerate
                  ? "I confirm these inputs are mine and I'm not a bot. I understand my text is processed to generate ideas."
                  : "I confirm this idea is mine and I'm not a bot. I understand my text is processed to build the validation report."}
              </span>
            </label>

            {error && (
              <div className="rounded-[--r] border border-[--error]/30 bg-[--error-soft] px-4 py-3 text-sm text-[--error]">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!valid || isLoading}
              className={cn(
                "group flex w-full items-center justify-center gap-2 rounded-[--r] bg-[--accent] py-3.5 text-sm font-semibold text-white transition",
                "shadow-[0_0_0_1px_rgba(124,106,255,0.4),0_12px_32px_-8px_rgba(124,106,255,0.6)]",
                "hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
              )}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isLoading ? copy.buttonLoading : copy.buttonIdle}
              {!isLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
            </button>

            {!valid && !isLoading && humanCheck && (
              <p className="caption text-center text-[--ink-2]">
                {!isGenerate && setup.topic.trim().length < 3 && "Idea needs at least 3 characters. "}
                {setup.position.trim().length < 10 && "Add at least 10 characters in step 2."}
              </p>
            )}
          </div>
        </div>

        {/* Dev demo */}
        <div className="mt-6 flex items-center gap-3 rounded-[--r] border border-dashed border-[--line-strong] bg-[--surface-1]/40 px-4 py-3">
          <span className="mono rounded-[--r-sm] bg-[--surface-2] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[--ink-1]">Dev</span>
          <p className="small flex-1 text-[--ink-2]">Skip the API and preview a finished report with demo data.</p>
          <button
            type="button"
            onClick={handleLoadDemo}
            className="shrink-0 rounded-[--r-sm] border border-[--line-strong] bg-[--surface-2] px-3 py-1.5 text-xs font-medium text-[--ink-1] transition hover:bg-[--surface-3] hover:text-[--ink-0]"
          >
            Load demo report
          </button>
        </div>

        <p className="caption mt-auto pt-8 text-center text-[--ink-2]">
          Typical run 60–120s · No signup · Reports kept 24h in your browser
        </p>
      </main>
    </div>
  );
}

function FormField({
  step,
  label,
  hint,
  children,
  charCount,
  charMax,
  charClass,
}: {
  step: number;
  label: string;
  hint?: string;
  children: React.ReactNode;
  charCount?: number;
  charMax?: number;
  charClass?: string;
}) {
  return (
    <div className="flex gap-3 sm:gap-4">
      <span className="mt-7 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[--accent-strong] bg-[--accent-soft]">
        <span className="num-sm text-[--accent-ink]">{step}</span>
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <label className="block text-sm font-medium text-[--ink-0]">{label}</label>
        {children}
        {hint && <p className="caption leading-relaxed text-[--ink-2]">{hint}</p>}
        {charCount !== undefined && charMax !== undefined && charCount > 0 && (
          <p className={cn("caption tabular-nums", charClass)}>
            {charCount}/{charMax}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ValidatePage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-items-center bg-[--bg]">
          <Loader2 className="h-7 w-7 animate-spin text-[--accent]" />
        </div>
      }
    >
      <ValidateForm />
    </Suspense>
  );
}
