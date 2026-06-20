/**
 * Shopping agents — ask the SAME real AI assistants a buyer would use
 * (ChatGPT / Claude / Gemini) to recommend where to buy, with live web access
 * so they name real, currently-operating stores.
 *
 * Each provider is independent and fails soft: a missing key, dead quota, or a
 * bad response resolves to `null` rather than throwing, so the buyer test
 * degrades provider-by-provider and the caller can honestly report which models
 * actually answered. We deliberately use raw REST for Anthropic/Gemini to avoid
 * adding SDK dependencies.
 */

import OpenAI from "openai";

export type AgentId = "ChatGPT" | "Claude" | "Gemini";

export interface AgentAnswer {
  agent: AgentId;
  model: string;
  text: string;
}

const SYSTEM =
  "You are a helpful AI shopping assistant with live web access. When a shopper asks what to buy, recommend the best SPECIFIC, real, currently-operating stores or brands to buy from. Be concrete and name names — never refuse or give generic advice.";

function buyerInstruction(query: string): string {
  return (
    `A shopper asks: "${query}"\n\n` +
    "Recommend the top 5 specific stores or brands to buy from right now. " +
    "Reply ONLY as a numbered list, one per line, in the exact format:\n" +
    "1. Brand or store name — one short reason\n" +
    "Name only real sellers. No intro, no conclusion."
  );
}

const PER_CALL_TIMEOUT_MS = 14_000;

function withTimeout<T>(p: Promise<T>, ms = PER_CALL_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("agent timeout")), ms)),
  ]);
}

/* ---------------- OpenAI (ChatGPT) ---------------- */

export async function askChatGPT(query: string): Promise<AgentAnswer | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  const model = process.env.COMMERCE_OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const openai = new OpenAI({ apiKey: key });
  try {
    // Prefer the Responses API with live web search for grounded recommendations.
    const res = await withTimeout(
      openai.responses.create({
        model,
        instructions: SYSTEM,
        input: buyerInstruction(query),
        tools: [{ type: "web_search" }],
        max_output_tokens: 600,
      }),
    );
    const text = (res as { output_text?: string }).output_text?.trim();
    if (text) return { agent: "ChatGPT", model, text };
  } catch {
    /* fall through to plain completion */
  }
  try {
    const completion = await withTimeout(
      openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: buyerInstruction(query) },
        ],
        temperature: 0.4,
        max_completion_tokens: 500,
      }),
    );
    const text = completion.choices[0]?.message?.content?.trim();
    if (text) return { agent: "ChatGPT", model, text };
  } catch {
    return null;
  }
  return null;
}

/* ---------------- Anthropic (Claude) ---------------- */

export async function askClaude(query: string): Promise<AgentAnswer | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  const model = process.env.COMMERCE_ANTHROPIC_MODEL?.trim() || "claude-3-5-haiku-latest";
  try {
    const res = await withTimeout(
      fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 600,
          system: SYSTEM,
          tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
          messages: [{ role: "user", content: buyerInstruction(query) }],
        }),
      }),
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = (data.content ?? [])
      .filter((b) => b.type === "text" && b.text)
      .map((b) => b.text)
      .join("\n")
      .trim();
    if (text) return { agent: "Claude", model, text };
  } catch {
    return null;
  }
  return null;
}

/* ---------------- Google (Gemini) ---------------- */

export async function askGemini(query: string): Promise<AgentAnswer | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;
  const model = process.env.COMMERCE_GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  try {
    const res = await withTimeout(
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM }] },
            contents: [{ role: "user", parts: [{ text: buyerInstruction(query) }] }],
            tools: [{ google_search: {} }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
          }),
        },
      ),
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = (data.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? "")
      .join("")
      .trim();
    if (text) return { agent: "Gemini", model, text };
  } catch {
    return null;
  }
  return null;
}

export const ALL_AGENTS: ((q: string) => Promise<AgentAnswer | null>)[] = [
  askChatGPT,
  askClaude,
  askGemini,
];

/** True when at least one provider key is configured. */
export function anyAgentConfigured(): boolean {
  return Boolean(
    process.env.OPENAI_API_KEY?.trim() ||
      process.env.ANTHROPIC_API_KEY?.trim() ||
      process.env.GEMINI_API_KEY?.trim(),
  );
}
