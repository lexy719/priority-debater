"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, FlaskConical, Wand2 } from "lucide-react";
import { Header } from "@/components/Header";
import { saveSession } from "@/lib/session";
import type { DebateSetup, Message } from "@/lib/types";

const ideaValidatorTemplate = {
  id: "validate",
  icon: <FlaskConical className="w-6 h-6" />,
  title: "Startup Idea Validator",
  subtitle: "Complete viability report in ~2 minutes",
  placeholder: {
    topic: "e.g. AI-powered meeting summarizer for remote teams",
    position: "Why it will work: market timing, your edge, business model...",
    context: "Your situation: team size, runway, target market (optional)",
  },
  labels: {
    topic: "Describe your startup idea",
    position: "Why do you think it will work?",
    context: "Your resources & context (optional)",
  },
};

const generateTemplate = {
  id: "generate",
  icon: <Wand2 className="w-6 h-6" />,
  title: "Idea Generator",
  subtitle: "No idea yet? Generate one",
  placeholder: {
    topic: "AI, B2B SaaS, healthcare, or leave blank",
    position: "Problems I've experienced. Technical background. Prefer B2B.",
    context: "Solo founder, 12 months runway",
  },
  labels: {
    topic: "Industries or themes? (optional)",
    position: "What problems have you experienced? Skills, preferences?",
    context: "Your situation (optional)",
  },
};

const MAX_TOPIC_LENGTH = 500;
const MAX_POSITION_LENGTH = 2000;
const MAX_CONTEXT_LENGTH = 1000;

function sanitize(text: string, maxLen: number): string {
  return text.slice(0, maxLen).trim();
}

function handleStreamResponse(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return Promise.reject(new Error("No reader"));

  const decoder = new TextDecoder();
  let accumulated = "";

  return (async () => {
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
            if (parsed.content) accumulated += parsed.content;
          } catch {
            // skip
          }
        }
      }
    }
    return accumulated;
  })();
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

  useEffect(() => {
    setSetup((s) => ({ ...s, template: isGenerate ? "generate" : "validate" }));
  }, [isGenerate]);

  const template = isGenerate ? generateTemplate : ideaValidatorTemplate;

  const valid =
    (isGenerate ? setup.position.trim().length >= 20 : setup.topic.trim().length >= 10 && setup.position.trim().length >= 20) &&
    humanCheck;

  const handleSubmit = async () => {
    if (!valid || isLoading) return;

    const sanitized: DebateSetup = {
      ...setup,
      topic: sanitize(setup.topic, MAX_TOPIC_LENGTH),
      position: sanitize(setup.position, MAX_POSITION_LENGTH),
      context: sanitize(setup.context, MAX_CONTEXT_LENGTH),
    };

    setIsLoading(true);
    setError(null);

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

      const content = await handleStreamResponse(response);
      const validationMessage: Message = {
        id: Date.now().toString(),
        role: "opponent",
        content,
      };

      saveSession({
        setup: sanitized,
        validationContent: content,
        messages: [validationMessage],
        createdAt: Date.now(),
      });

      if (setup.template === "validate") {
        router.push("/results");
      } else {
        router.push("/debate");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-slate-50 to-white flex flex-col">
      <Header />
      <div className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-slate-900 text-white">{template.icon}</div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{template.title}</h1>
              <p className="text-sm text-slate-500">{template.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {template.labels.topic}
            </label>
            <input
              type="text"
              placeholder={template.placeholder.topic}
              value={setup.topic}
              onChange={(e) => setSetup({ ...setup, topic: e.target.value })}
              maxLength={MAX_TOPIC_LENGTH}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors text-sm sm:text-base"
            />
            {setup.topic.length > 0 && (
              <p className="text-xs text-slate-400 mt-1">{setup.topic.length}/{MAX_TOPIC_LENGTH}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {template.labels.position}
            </label>
            <textarea
              placeholder={template.placeholder.position}
              value={setup.position}
              onChange={(e) => setSetup({ ...setup, position: e.target.value })}
              maxLength={MAX_POSITION_LENGTH}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors resize-none text-sm sm:text-base"
            />
            {setup.position.length > 0 && (
              <p className="text-xs text-slate-400 mt-1">{setup.position.length}/{MAX_POSITION_LENGTH}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {template.labels.context}
            </label>
            <textarea
              placeholder={template.placeholder.context}
              value={setup.context}
              onChange={(e) => setSetup({ ...setup, context: e.target.value })}
              maxLength={MAX_CONTEXT_LENGTH}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors resize-none text-sm sm:text-base"
            />
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <input
              type="checkbox"
              id="human"
              checked={humanCheck}
              onChange={(e) => setHumanCheck(e.target.checked)}
              className="mt-1 rounded border-slate-300"
            />
            <label htmlFor="human" className="text-sm text-slate-700">
              I confirm this is my own idea and I&apos;m not a bot. I understand my data is processed
              to generate the validation report.
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!valid || isLoading}
            className="w-full py-3.5 sm:py-4 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                Validating... (~2 min)
              </>
            ) : (
              <>
                Get My Answer
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ValidatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    }>
      <ValidateForm />
    </Suspense>
  );
}
