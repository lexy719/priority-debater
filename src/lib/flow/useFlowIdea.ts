"use client";

/**
 * useFlowIdea — the bridge between the validated idea (stored in the session by
 * the validator) and the post-validation flow pages.
 *
 * It reads loadSession() once on mount and derives a normalized FlowIdea from
 * setup + dashboardData. When there is no session yet (e.g. someone lands on
 * /launch-kit directly), it returns the MINUTA demo idea so the page still
 * renders a complete, believable surface.
 *
 * It also exposes the raw session bits the AI routes need as input
 * (topic/position/context/validationContent) and an idea-keyed localStorage
 * cache so brand/launch/campaign payloads are never re-spent for the same idea.
 */

import { useEffect, useState } from "react";
import { loadSession, loadDebateHandoff } from "@/lib/session";
import type { DebateHandoff } from "@/lib/chamber-handoff";
import type { FlowIdea } from "./types";
import { IDEA as MOCK_IDEA } from "./flowMock";

export type FlowSource = {
  /** Normalized idea used for ticker, hero bands, journey recap. */
  idea: FlowIdea;
  /** Raw inputs forwarded to /api/{brand-kit,launch-kit,campaign}. */
  input: { topic: string; position: string; context: string; validationContent: string };
  /**
   * The weak-point handoff from the Chamber for THIS idea (null if the founder
   * never debated it). Seeds downstream generation with what the panel exposed.
   */
  debate: DebateHandoff | null;
  /** True once the (client-only) session read has completed. */
  ready: boolean;
  /** True when we fell back to the demo idea (no validated idea on file). */
  isDemo: boolean;
  /** True when real score/market numbers exist (demo, or a session with dashboardData). */
  hasMetrics: boolean;
};

function firstSentence(text: string, max = 180): string {
  const t = (text || "").trim();
  if (!t) return "";
  const dot = t.indexOf(". ");
  const clipped = dot > 20 ? t.slice(0, dot + 1) : t;
  return clipped.length > max ? `${clipped.slice(0, max - 1).trim()}…` : clipped;
}

export function useFlowIdea(): FlowSource {
  const [state, setState] = useState<FlowSource>({
    idea: MOCK_IDEA,
    input: { topic: "", position: "", context: "", validationContent: "" },
    debate: null,
    ready: false,
    isDemo: true,
    hasMetrics: true,
  });

  useEffect(() => {
    const session = loadSession();
    if (!session?.setup?.topic) {
      // Demo: the MINUTA example is a complete idea, so its metrics are real.
      setState((s) => ({ ...s, ready: true, isDemo: true, hasMetrics: true }));
      return;
    }

    // The Chamber's weak-point handoff for this idea, if it was debated.
    const debate = loadDebateHandoff(session.setup.topic);

    const { setup, validationContent, dashboardData } = session;
    const topic = setup.topic.trim();
    const dash = dashboardData;
    // Only trust score/market when the validation actually produced a dashboard.
    const hasMetrics = typeof dash?.score === "number";

    const idea: FlowIdea = {
      title: topic,
      pitch:
        dash?.oneLineThesis?.trim() ||
        firstSentence(setup.position) ||
        firstSentence(validationContent) ||
        topic,
      viability: hasMetrics ? (dash!.score as number) : 0,
      verdict: hasMetrics
        ? dash!.verdict === "GO"
          ? "GO — BUILD IT"
          : dash!.verdict === "NO-GO"
          ? "NO-GO — RETHINK"
          : "PROCEED WITH CAUTION"
        : "AWAITING SCORE",
      band: dash?.rankLabel?.trim() || "—",
      tam: dash?.market?.tam?.trim() || "—",
      sam: dash?.market?.sam?.trim() || "—",
      som: dash?.market?.som?.trim() || "—",
      price: dash?.revenue?.pricingModels?.[0]?.price?.trim() || "—",
      // brandName resolves from the cached brand kit on pages that have it; default upper-cases the topic root.
      brandName: topic.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(" ")[0]?.toUpperCase() || MOCK_IDEA.brandName,
    };

    setState({
      idea,
      input: {
        topic,
        position: (setup.position || "").trim(),
        context: (setup.context || "").trim(),
        validationContent: (validationContent || "").trim(),
      },
      debate,
      ready: true,
      isDemo: false,
      hasMetrics,
    });
  }, []);

  return state;
}

/* ── idea-keyed localStorage payload cache ───────────────────────────────── */

export function readFlowCache<T>(key: string, idea: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { idea?: string; payload?: T };
    if (parsed?.idea !== idea) return null;
    return parsed.payload ?? null;
  } catch {
    return null;
  }
}

export function writeFlowCache<T>(key: string, idea: string, payload: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify({ idea, payload, savedAt: Date.now() }));
  } catch {
    /* quota — ignore */
  }
}

export function clearFlowCache(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const FLOW_CACHE = {
  brandKit: "priority-debater-flow-brand-kit",
  launchKit: "priority-debater-flow-launch-kit",
  campaign: "priority-debater-flow-campaign",
} as const;
