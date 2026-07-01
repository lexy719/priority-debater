"use client";

/**
 * useIdeaRun — runs the real 5-agent validation from a single pitch and routes
 * to /results. Extracted so both the hero input and the ValidateNow section can
 * trigger the exact same flow (auth + credit pre-checks, stream, save session).
 */

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ideaCategoryFromSetup } from "@/lib/dossier-from-session";
import { clearPanelFlowPersist } from "@/lib/panel-debate-session";
import { saveSession } from "@/lib/session";
import { streamDebateMarkdown } from "@/lib/stream-debate-markdown";
import type { ValidationSession } from "@/lib/types";
import { buildValidateDebateSetupFromSingleIdea } from "@/lib/validate-brief-setup";
import { useCreditsState } from "@/components/credits/CreditsProvider";
import { CREDIT_COSTS } from "@/lib/credits/costs";

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useIdeaRun() {
  const router = useRouter();
  const { state, refresh } = useCreditsState();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditGate, setCreditGate] = useState<{ balance: number } | null>(null);

  const run = useCallback(
    async (pitch: string) => {
      const idea = pitch.trim();
      if (idea.length < 120 || pending) return;
      if (state.configured && !state.authed) {
        router.push("/login?next=" + encodeURIComponent("/#validate"));
        return;
      }
      if (state.configured && (state.balance ?? 0) < CREDIT_COSTS.validation) {
        setCreditGate({ balance: state.balance ?? 0 });
        return;
      }
      setError(null);
      setPending(true);
      try {
        const setup = buildValidateDebateSetupFromSingleIdea(idea);
        let scoreReconciliation: ValidationSession["scoreReconciliation"];
        const markdown = await streamDebateMarkdown(
          "start",
          { setup, validationContent: "" },
          () => {},
          { onScoreReconciliation: (next) => { scoreReconciliation = next; } },
        );
        const session: ValidationSession = {
          setup,
          validationContent: markdown,
          messages: [{ id: newId(), role: "opponent", content: markdown }],
          createdAt: Date.now(),
          interviewChats: {},
          ...(scoreReconciliation ? { scoreReconciliation } : {}),
        };
        session.ideaCategory = ideaCategoryFromSetup(session);
        saveSession(session);
        clearPanelFlowPersist();
        void refresh();
        router.push("/results");
      } catch (err) {
        setPending(false);
        const status = (err as { status?: number })?.status;
        if (status === 401) {
          router.push("/login?next=" + encodeURIComponent("/#validate"));
          return;
        }
        if (status === 402) {
          setCreditGate({ balance: state.balance ?? 0 });
          return;
        }
        setError(err instanceof Error ? err.message : "The panel couldn't convene. Try again.");
      }
    },
    [pending, router, state, refresh],
  );

  return { pending, error, creditGate, setCreditGate, run };
}
