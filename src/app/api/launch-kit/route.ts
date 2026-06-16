/**
 * /api/launch-kit
 * ─────────────────────────────────────────────────────────────────────────
 * Single OpenAI call that turns the user's validated idea into a complete,
 * copy-paste-ready launch kit: product-page copy + pricing, exactly 3
 * acquisition channels, 20 cold messages, 5 Reddit posts, 5 X hooks, and an
 * offer-framing block (founding-10 / beta script / urgency / guarantee).
 *
 * Mirrors /api/brand-kit: guards on OPENAI_API_KEY, uses gpt-4.1-mini with a
 * json_object response, parses defensively, and ALWAYS returns a renderable
 * payload by falling back to the MINUTA demo (lib/flow/flowMock) on any error.
 * ─────────────────────────────────────────────────────────────────────────
 */

import OpenAI from "openai";
import type { LaunchKitPayload } from "@/lib/flow/types";
import { guardAndSpend, guardFailResponse, refund } from "@/lib/credits/server";
import {
  PRODUCT_PAGE,
  ACQUISITION,
  COLD_MESSAGES,
  REDDIT_POSTS,
  X_HOOKS,
  OFFER,
} from "@/lib/flow/flowMock";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  topic?: string;
  position?: string;
  context?: string;
  validationContent?: string;
  brandName?: string;
};

function clampText(value: unknown, max: number): string {
  return String(value || "").slice(0, max).trim();
}

function fallbackPayload(): LaunchKitPayload {
  return {
    productPage: PRODUCT_PAGE,
    acquisition: ACQUISITION,
    coldMessages: COLD_MESSAGES,
    redditPosts: REDDIT_POSTS,
    xHooks: X_HOOKS,
    offer: OFFER,
  };
}

function strArray(v: unknown, fallback: string[], count: number, maxLen = 600): string[] {
  const out = Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim().slice(0, maxLen))
    : [];
  const result = out.slice(0, count);
  let i = 0;
  while (result.length < count) result.push(fallback[i++ % fallback.length]);
  return result;
}

function parsePayload(raw: string): LaunchKitPayload {
  const fb = fallbackPayload();
  let parsed: Partial<LaunchKitPayload>;
  try {
    parsed = JSON.parse(raw.replace(/^```json\s*|```$/g, "").trim()) as Partial<LaunchKitPayload>;
  } catch {
    return fb;
  }

  const str = (v: unknown, d: string, max = 400) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : d);

  // Product page
  const pp: Partial<LaunchKitPayload["productPage"]> = parsed.productPage ?? {};
  const valueProps =
    Array.isArray(pp.valueProps) && pp.valueProps.length
      ? pp.valueProps.slice(0, 3).map((vp, i) => ({
          title: str(vp?.title, fb.productPage.valueProps[i]?.title ?? "", 80),
          body: str(vp?.body, fb.productPage.valueProps[i]?.body ?? "", 240),
        }))
      : fb.productPage.valueProps;
  while (valueProps.length < 3) valueProps.push(fb.productPage.valueProps[valueProps.length]);

  const pricing =
    Array.isArray(pp.pricing) && pp.pricing.length
      ? pp.pricing.slice(0, 3).map((pr, i) => ({
          name: str(pr?.name, fb.productPage.pricing[i]?.name ?? "Plan", 24),
          price: str(pr?.price, fb.productPage.pricing[i]?.price ?? "—", 16),
          per: str(pr?.per, fb.productPage.pricing[i]?.per ?? "", 24),
          note: str(pr?.note, fb.productPage.pricing[i]?.note ?? "", 40),
          featured: Boolean(pr?.featured),
          cta: str(pr?.cta, fb.productPage.pricing[i]?.cta ?? "Get started", 28),
        }))
      : fb.productPage.pricing;
  while (pricing.length < 3) pricing.push(fb.productPage.pricing[pricing.length]);

  const productPage: LaunchKitPayload["productPage"] = {
    headline: str(pp.headline, fb.productPage.headline, 80),
    subhead: str(pp.subhead, fb.productPage.subhead, 240),
    valueProps,
    pricing,
    primaryCta: str(pp.primaryCta, fb.productPage.primaryCta, 32),
    secondaryCta: str(pp.secondaryCta, fb.productPage.secondaryCta, 32),
  };

  // Acquisition — exactly 3 channels
  const acquisition =
    Array.isArray(parsed.acquisition) && parsed.acquisition.length
      ? parsed.acquisition.slice(0, 3).map((c, i) => ({
          n: String(i + 1).padStart(2, "0"),
          channel: str(c?.channel, fb.acquisition[i]?.channel ?? "Channel", 60),
          target: str(c?.target, fb.acquisition[i]?.target ?? "", 120),
          why: str(c?.why, fb.acquisition[i]?.why ?? "", 320),
          cadence: str(c?.cadence, fb.acquisition[i]?.cadence ?? "", 120),
          sample: str(c?.sample, fb.acquisition[i]?.sample ?? "", 700),
        }))
      : fb.acquisition;
  while (acquisition.length < 3) acquisition.push(fb.acquisition[acquisition.length]);

  // Offer
  const of: Partial<LaunchKitPayload["offer"]> = parsed.offer ?? {};
  const offer: LaunchKitPayload["offer"] = {
    founding: str(of.founding, fb.offer.founding, 320),
    beta: str(of.beta, fb.offer.beta, 600),
    urgency: str(of.urgency, fb.offer.urgency, 240),
    guarantee: str(of.guarantee, fb.offer.guarantee, 240),
  };

  // Reddit posts — 5
  const redditPosts =
    Array.isArray(parsed.redditPosts) && parsed.redditPosts.length
      ? parsed.redditPosts.slice(0, 5).map((p, i) => ({
          sub: str(p?.sub, fb.redditPosts[i]?.sub ?? "r/startups", 40),
          title: str(p?.title, fb.redditPosts[i]?.title ?? "", 160),
          body: str(p?.body, fb.redditPosts[i]?.body ?? "", 400),
        }))
      : fb.redditPosts;
  while (redditPosts.length < 5) redditPosts.push(fb.redditPosts[redditPosts.length]);

  return {
    productPage,
    acquisition,
    coldMessages: strArray(parsed.coldMessages, fb.coldMessages, 20, 600),
    redditPosts,
    xHooks: strArray(parsed.xHooks, fb.xHooks, 5, 320),
    offer,
  };
}

export async function POST(request: Request) {
  const guard = await guardAndSpend("launch_kit");
  if (!guard.ok) return guardFailResponse(guard);
  try {
    const key = process.env.OPENAI_API_KEY?.trim();
    const body = (await request.json()) as Body;
    const topic = clampText(body.topic, 220);
    if (!topic) { await refund("launch_kit"); return Response.json({ error: "Missing startup topic." }, { status: 400 }); }

    // No key / quota → still return a complete, renderable kit (don't charge for demo).
    if (!key) { await refund("launch_kit"); return Response.json(fallbackPayload()); }

    const position = clampText(body.position, 1200);
    const context = clampText(body.context, 1200);
    const validationContent = clampText(body.validationContent, 7000);
    const brandName = clampText(body.brandName, 40);

    const openai = new OpenAI({ apiKey: key });

    const systemPrompt =
      "You are a senior go-to-market strategist + direct-response copywriter. Return strict JSON only. No markdown. No backticks. Everything must be specific to the idea — no generic placeholders.";

    const userPrompt = `Build a complete, copy-paste-ready LAUNCH KIT for this validated startup idea. The output drives a live page (product-page copy, acquisition plan, outreach pack, offer framing), so every line must be concrete and shippable today.

Startup idea: ${topic}
${brandName ? `Brand name (use it): ${brandName}` : ""}
Founder reasoning / position: ${position || "N/A"}
Context: ${context || "N/A"}
Validation summary: ${validationContent || "N/A"}

Return EXACTLY this JSON shape. No extra keys. No prose.

{
  "productPage": {
    "headline": "punchy <8-word headline",
    "subhead": "<=30 word value prop: what + who + why now",
    "valueProps": [
      {"title":"<=6 words","body":"<=22 words"},
      {"title":"<=6 words","body":"<=22 words"},
      {"title":"<=6 words","body":"<=22 words"}
    ],
    "pricing": [
      {"name":"Tier","price":"€NN","per":"/seat · mo","note":"who it's for","featured":false,"cta":"action"},
      {"name":"Tier","price":"€NN","per":"/seat · mo","note":"who it's for","featured":true,"cta":"action"},
      {"name":"Enterprise","price":"Custom","per":"","note":"SSO · DPA","cta":"Talk to us"}
    ],
    "primaryCta":"2-4 word action",
    "secondaryCta":"2-4 word action"
  },
  "acquisition": [
    {"channel":"name","target":"who exactly","why":"why this channel first (<=45 words)","cadence":"concrete weekly cadence","sample":"a real sample message using {name}/{firm} tokens"},
    {"channel":"name","target":"who","why":"why","cadence":"cadence","sample":"sample"},
    {"channel":"name","target":"who","why":"why","cadence":"cadence","sample":"sample"}
  ],
  "coldMessages": ["20 distinct, ready-to-send DMs/emails, each <=55 words, using {name} and {firm} tokens"],
  "redditPosts": [
    {"sub":"r/relevant","title":"post title","body":"<=60 word body"}
  ],
  "xHooks": ["5 punchy standalone X/Twitter hooks, <=240 chars each"],
  "offer": {
    "founding":"founding-10 style offer (<=45 words)",
    "beta":"a beta-invite DM script using {name} (<=80 words)",
    "urgency":"honest scarcity line (no fake countdowns)",
    "guarantee":"a concrete risk-reversal guarantee"
  }
}

Rules:
- EXACTLY 3 acquisition channels, EXACTLY 20 coldMessages, EXACTLY 5 redditPosts, EXACTLY 5 xHooks.
- Match the language of the idea's market where natural (e.g. local-language outreach for a regional product).
- No legal claims, no fake metrics, no markdown — JSON only.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_completion_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    return Response.json(parsePayload(raw));
  } catch (error) {
    console.error("launch-kit route error:", error);
    // Never blank the page — fall back to the demo kit (and refund the charge).
    await refund("launch_kit");
    return Response.json(fallbackPayload());
  }
}
