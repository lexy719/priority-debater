"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/v2/button";
import { cn } from "@/lib/utils";
import { ideaCategoryFromSetup } from "@/lib/dossier-from-session";
import { clearPanelFlowPersist } from "@/lib/panel-debate-session";
import { saveSession } from "@/lib/session";
import { streamDebateMarkdown } from "@/lib/stream-debate-markdown";
import type { ValidationSession } from "@/lib/types";
import { buildValidateDebateSetupFromSingleIdea } from "@/lib/validate-brief-setup";

const MIN_CHARS = 120;

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function LandingIdeaValidation() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [pending, setPending] = useState(false);
  const [phase, setPhase] = useState<"idle" | "panel" | "dashboard">("idle");
  const [error, setError] = useState<string | null>(null);

  const len = idea.trim().length;
  const canRun = len >= MIN_CHARS && !pending;

  const run = useCallback(async () => {
    if (!canRun) return;
    setError(null);
    setPending(true);
    setPhase("panel");
    try {
      const setup = buildValidateDebateSetupFromSingleIdea(idea);
      let scoreReconciliation: ValidationSession["scoreReconciliation"];
      const markdown = await streamDebateMarkdown(
        "start",
        { setup, validationContent: "" },
        () => {},
        {
          onScoreReconciliation: (next) => {
            scoreReconciliation = next;
          },
        },
      );
      const createdAt = Date.now();
      const sessionBase: ValidationSession = {
        setup,
        validationContent: markdown,
        messages: [{ id: newId(), role: "opponent", content: markdown }],
        createdAt,
        interviewChats: {},
        ...(scoreReconciliation ? { scoreReconciliation } : {}),
      };
      sessionBase.ideaCategory = ideaCategoryFromSetup(sessionBase);

      // Fetch structured dashboard data so charts/sections populate from THIS idea.
      setPhase("dashboard");
      try {
        const res = await fetch("/api/dashboard-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: setup.topic,
            position: setup.position,
            context: setup.context,
            markdown,
          }),
        });
        if (res.ok) {
          const dashboardData = await res.json();
          if (dashboardData && typeof dashboardData === "object" && !dashboardData.error) {
            sessionBase.dashboardData = dashboardData;
          }
        }
      } catch {
        // Non-fatal: results page falls back to markdown parsing.
      }

      saveSession(sessionBase);
      clearPanelFlowPersist();
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate a verdict.");
    } finally {
      setPending(false);
      setPhase("idle");
    }
  }, [canRun, idea, router]);

  return (
    <div
      id="idea-validation"
      className="scroll-mt-28 border-2 border-[--ink-0] bg-[--bg] p-4 text-left shadow-[8px_8px_0_0_var(--ink-0)] md:p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[--ink-2]">
          Idea validation
        </span>
        <span
          className={cn(
            "font-mono text-[10px] tabular-nums",
            len >= MIN_CHARS ? "text-[--go]" : "text-[--ink-2]"
          )}
        >
          {len}/{MIN_CHARS}+
        </span>
      </div>

      <textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        rows={6}
        placeholder="Pitch your idea in one shot: what you are building, who pays, the pain, why now, and what is hard. The panel needs enough signal to argue — aim for at least a few dense paragraphs."
        className="min-h-[160px] w-full resize-y border-2 border-[--line] bg-[--surface-2]/55 px-4 py-3 font-sans text-[15px] leading-[1.55] text-[--ink-0] outline-none transition placeholder:text-[--ink-3] focus:border-[--ink-0] focus:bg-[--bg]"
      />

      {error && (
        <p className="mt-3 text-[13px] leading-snug text-[--no-go]" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] leading-relaxed text-[--ink-2]" data-testid="run-status">
          {pending
            ? phase === "panel"
              ? "Five personas are tearing your pitch apart… (~20s)"
              : phase === "dashboard"
                ? "Structuring the dossier — charts, segments, competitors… (~15s)"
                : "Generating…"
            : canRun
              ? "Ready — five personas will tear this apart and you’ll land on a scored dossier."
              : `Add at least ${MIN_CHARS} characters so the panel has enough context.`}
        </p>
        <Button type="button" size="lg" disabled={!canRun} onClick={run} className="w-full shrink-0 sm:w-auto" data-testid="run-validation-btn">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {phase === "panel" ? "Panel debating…" : phase === "dashboard" ? "Building dossier…" : "Generating…"}
            </>
          ) : (
            <>
              Run validation
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
