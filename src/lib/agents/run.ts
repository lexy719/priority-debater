import "server-only";

/**
 * Shared agent core — one place every server-side AI agent (the five Chamber
 * seats, the Mentor debrief, Quick Cross) runs through, so model choice, JSON
 * parsing and error handling are consistent instead of copy-pasted into each
 * route. Auth/credit guarding stays in the routes; this is only the model call.
 *
 * A single seam like this is where retries, logging, timeouts or a model swap
 * get added once and apply everywhere.
 */

import OpenAI from "openai";

/** Chamber model, overridable via env without touching code. */
export function agentModel(fallback = "gpt-4.1-mini"): string {
  return process.env.CHAMBER_OPENAI_MODEL?.trim() || fallback;
}

let _client: OpenAI | null = null;

/** Lazily-built shared client, or null when no key is configured. */
export function openaiClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  if (!_client) _client = new OpenAI({ apiKey: key });
  return _client;
}

/** True when an OpenAI key is present — lets a route refund + 503 before calling. */
export function hasOpenAIKey(): boolean {
  return !!process.env.OPENAI_API_KEY?.trim();
}

/** Trim + hard-cap an untrusted string. */
export function clampStr(v: unknown, max: number): string {
  return String(v ?? "").slice(0, max).trim();
}

/** Tolerantly parse a model's JSON reply (strips ```json fences). Null on failure. */
export function parseJsonLoose<T = Record<string, unknown>>(raw: string): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw.replace(/^```json\s*|```$/g, "").trim()) as T; }
  catch { return null; }
}

export type AgentCall = {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
};

/**
 * Run one system+user JSON-mode completion and return the parsed object, or null
 * on any failure (no key, network, non-JSON). Callers decide how to fall back.
 */
export async function runAgentJSON<T = Record<string, unknown>>(opts: AgentCall): Promise<T | null> {
  const client = openaiClient();
  if (!client) return null;
  try {
    const res = await client.chat.completions.create({
      model: opts.model ?? agentModel(),
      temperature: opts.temperature ?? 0.6,
      max_completion_tokens: opts.maxTokens ?? 400,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    });
    return parseJsonLoose<T>(res.choices[0]?.message?.content?.trim() ?? "");
  } catch (e) {
    console.error("runAgentJSON failed:", e instanceof Error ? e.message : e);
    return null;
  }
}
