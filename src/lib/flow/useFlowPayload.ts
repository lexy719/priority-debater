"use client";

/**
 * useFlowPayload — fetch + cache wrapper shared by the brand-kit, launch-kit
 * and campaign pages.
 *
 * - Waits for the session read (useFlowIdea) to settle.
 * - With a real idea on file: checks the idea-keyed localStorage cache, else
 *   POSTs the idea inputs to the route and caches the result.
 * - With no idea (demo): renders the provided fallback without spending tokens.
 * - The API routes always return a renderable payload, so the UI never blanks;
 *   `status` distinguishes ready (live) vs fallback (demo / unreachable).
 */

import { useCallback, useEffect, useState } from "react";
import { useFlowIdea, readFlowCache, writeFlowCache, clearFlowCache, type FlowSource } from "./useFlowIdea";

export type PayloadStatus = "loading" | "ready" | "fallback";

/**
 * Why we fell back to the sample. Lets the banner show an actionable message
 * (sign in / top up) instead of a catch-all "couldn't reach the engine".
 * - "demo"    → no validated idea in the session (pure preview).
 * - "auth"    → route returned 401 (not signed in).
 * - "credits" → route returned 402 (out of credits).
 * - "engine"  → 5xx / network / parse error.
 */
export type FallbackReason = "demo" | "auth" | "credits" | "engine" | null;

type Options<T> = {
  endpoint: string;
  cacheKey: string;
  fallback: T;
  /** Build the POST body from the resolved flow source. */
  buildBody?: (flow: FlowSource) => Record<string, unknown>;
};

export function useFlowPayload<T>(opts: Options<T>) {
  const flow = useFlowIdea();
  const [data, setData] = useState<T>(opts.fallback);
  const [status, setStatus] = useState<PayloadStatus>("loading");
  const [reason, setReason] = useState<FallbackReason>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!flow.ready) return;

    if (flow.isDemo) {
      setData(opts.fallback);
      setStatus("fallback");
      setReason("demo");
      return;
    }

    const idea = flow.input.topic;
    const cached = readFlowCache<T>(opts.cacheKey, idea);
    if (cached && nonce === 0) {
      setData(cached);
      setStatus("ready");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    const body = opts.buildBody
      ? opts.buildBody(flow)
      : { ...flow.input, brandName: flow.idea.brandName };

    fetch(opts.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (r) => ({ http: r.status, payload: (await r.json()) as T & { error?: string } }))
      .then(({ http, payload }) => {
        if (cancelled) return;
        if (http >= 200 && http < 300 && payload && !payload.error) {
          setData(payload);
          writeFlowCache(opts.cacheKey, idea, payload);
          setStatus("ready");
          setReason(null);
        } else {
          setData(opts.fallback);
          setStatus("fallback");
          setReason(http === 401 ? "auth" : http === 402 ? "credits" : "engine");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setData(opts.fallback);
        setStatus("fallback");
        setReason("engine");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.ready, flow.isDemo, nonce]);

  const regenerate = useCallback(() => {
    clearFlowCache(opts.cacheKey);
    setNonce((n) => n + 1);
  }, [opts.cacheKey]);

  return { flow, data, status, reason, regenerate };
}
