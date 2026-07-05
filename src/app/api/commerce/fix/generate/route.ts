/**
 * POST /api/commerce/fix/generate — AI fix generation (Phase 10).
 *
 * Body: { product: { title, description, body_html, url }, gaps?: string[],
 *         storeName?: string, category?: string }
 * Returns: { ok: true, fix: { title, body_html, jsonld, rationale } } or a
 * typed failure. Stateless — the client persists the Fix (status draft).
 *
 * Uses the shared OpenAI conventions (src/lib/agents/run.ts). The rewrite is
 * asked for in the merchant's voice with concrete attributes — the fix engine's
 * whole value is specificity, not generic AI copy (§4.5, moat test §0).
 */

import { clampStr, hasOpenAIKey, runAgentJSON } from "@/lib/agents/run";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You rewrite e-commerce product content so AI shopping assistants (ChatGPT, Gemini, Perplexity) can find, quote and recommend the product. You write in the merchant's voice — specific, concrete, honest. Never invent facts not implied by the existing content; when an attribute is unknown, structure the copy so the merchant can fill it in with [BRACKETED PLACEHOLDERS].

Reply ONLY with a JSON object:
{
  "title": "<improved product title, <=70 chars, keeps the brand/product name>",
  "body_html": "<improved description as simple HTML (<p>, <ul>, <li>, <strong> only). 120-220 words. Lead with what it is + who it's for, then concrete attributes (materials, dimensions, use-case, care), then shipping/returns pointer.>",
  "jsonld": "<a complete schema.org Product JSON-LD object as a STRING, using the real title/description and [PLACEHOLDER] for unknown gtin/price fields>",
  "rationale": "<1-2 sentences: what was missing and why this version gets cited>"
}`;

export async function POST(req: Request): Promise<Response> {
  if (!hasOpenAIKey()) {
    return Response.json(
      { ok: false, reason: "not_configured", detail: "OPENAI_API_KEY is not set on this deployment." },
      { status: 503 },
    );
  }

  let body: {
    product?: { title?: string; description?: string; body_html?: string; url?: string };
    gaps?: string[];
    storeName?: string;
    category?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, reason: "invalid_input", detail: "Malformed JSON body." }, { status: 400 });
  }

  const title = clampStr(body.product?.title, 300);
  if (!title) {
    return Response.json({ ok: false, reason: "invalid_input", detail: "product.title is required." }, { status: 400 });
  }
  const description = clampStr(body.product?.body_html || body.product?.description, 6_000);
  const gaps = (body.gaps ?? []).map((g) => clampStr(g, 200)).filter(Boolean).slice(0, 10);

  const user =
    `Store: ${clampStr(body.storeName, 120) || "(unknown)"}\n` +
    `Category: ${clampStr(body.category, 120) || "(unknown)"}\n` +
    `Product title: ${title}\n` +
    `Product URL: ${clampStr(body.product?.url, 500) || "(none)"}\n` +
    `Current description (may be thin or empty):\n${description || "(empty)"}\n\n` +
    (gaps.length ? `Known gaps flagged by the scan: ${gaps.join("; ")}\n\n` : "") +
    "Rewrite per the system instructions.";

  const fix = await runAgentJSON<{ title?: string; body_html?: string; jsonld?: string; rationale?: string }>({
    system: SYSTEM,
    user,
    temperature: 0.5,
    maxTokens: 1400,
  });

  if (!fix || (!fix.body_html && !fix.title)) {
    return Response.json(
      { ok: false, reason: "platform_error", detail: "Generation failed — try again." },
      { status: 502 },
    );
  }

  return Response.json({
    ok: true,
    fix: {
      title: clampStr(fix.title, 300) || title,
      body_html: String(fix.body_html ?? "").slice(0, 20_000),
      jsonld: String(fix.jsonld ?? "").slice(0, 20_000),
      rationale: clampStr(fix.rationale, 600),
    },
  });
}
