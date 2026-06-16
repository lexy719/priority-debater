/**
 * /api/campaign
 * ─────────────────────────────────────────────────────────────────────────
 * Turns the validated idea into a launch-ready video-ad campaign: objective,
 * angle, budget split, audience, KPIs, and 4 platform-specific ad cuts (hook +
 * scene-by-scene storyboard + ad copy).
 *
 * Mirrors /api/launch-kit: guards on OPENAI_API_KEY, gpt-4.1-mini + json_object,
 * defensive parse, and ALWAYS returns a renderable payload (MINUTA fallback).
 * The fixed platform/format scaffolding (placement, aspect, duration, colors)
 * comes from the fallback so the 4-cut layout stays clean; the model fills the
 * creative fields (concept, hook, scenes, ad copy).
 * ─────────────────────────────────────────────────────────────────────────
 */

import OpenAI from "openai";
import type { CampaignPayload, CampaignAd } from "@/lib/flow/types";
import { CAMPAIGN } from "@/lib/flow/flowMock";
import { guardAndSpend, guardFailResponse, refund } from "@/lib/credits/server";

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

function fallbackPayload(): CampaignPayload {
  return CAMPAIGN;
}

function parsePayload(raw: string): CampaignPayload {
  const fb = fallbackPayload();
  let parsed: Partial<CampaignPayload>;
  try {
    parsed = JSON.parse(raw.replace(/^```json\s*|```$/g, "").trim()) as Partial<CampaignPayload>;
  } catch {
    return fb;
  }

  const str = (v: unknown, d: string, max = 400) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : d);

  // Merge model creative onto the fixed 4-cut scaffold so layout never breaks.
  const ads: CampaignAd[] = fb.ads.map((scaffold, i) => {
    const a = Array.isArray(parsed.ads) ? parsed.ads[i] : undefined;
    if (!a) return scaffold;
    const scenes =
      Array.isArray(a.scenes) && a.scenes.length
        ? a.scenes.slice(0, 4).map((s, si) => ({
            t: str(s?.t, scaffold.scenes[si]?.t ?? "0:00", 8),
            visual: str(s?.visual, scaffold.scenes[si]?.visual ?? "", 120),
            line: str(s?.line, scaffold.scenes[si]?.line ?? "", 160),
          }))
        : scaffold.scenes;
    while (scenes.length < scaffold.scenes.length) scenes.push(scaffold.scenes[scenes.length]);
    return {
      ...scaffold,
      concept: str(a.concept, scaffold.concept, 40),
      hook: str(a.hook, scaffold.hook, 160),
      scenes,
      adCopy: {
        headline: str(a.adCopy?.headline, scaffold.adCopy.headline, 60),
        primary: str(a.adCopy?.primary, scaffold.adCopy.primary, 240),
      },
      cta: str(a.cta, scaffold.cta, 28),
    };
  });

  const kpis =
    Array.isArray(parsed.kpis) && parsed.kpis.length
      ? parsed.kpis.slice(0, 4).map((k, i) => ({
          k: str(k?.k, fb.kpis[i]?.k ?? "KPI", 24),
          v: str(k?.v, fb.kpis[i]?.v ?? "—", 16),
          c: fb.kpis[i]?.c ?? "#ff3b30",
        }))
      : fb.kpis;
  while (kpis.length < 4) kpis.push(fb.kpis[kpis.length]);

  const totalStr = str(parsed.budget?.total, fb.budget.total, 16);
  const totalNum = parseInt(totalStr.replace(/[^0-9]/g, ""), 10) || 500;
  // Keep the four platforms + colors fixed; let the model tune the percentages
  // (and recompute the euro amounts) so the split reflects the audience.
  const budgetSplit = Array.isArray(parsed.budgetSplit) && parsed.budgetSplit.length
    ? fb.budgetSplit.map((b, i) => {
        const raw = parsed.budgetSplit![i]?.pct;
        const pct = typeof raw === "number" && raw >= 0 && raw <= 100 ? Math.round(raw) : b.pct;
        return { ...b, pct, amount: `€${Math.round((totalNum * pct) / 100)}` };
      })
    : fb.budgetSplit;

  return {
    objective: str(parsed.objective, fb.objective, 200),
    angle: str(parsed.angle, fb.angle, 320),
    budget: {
      total: totalStr,
      daily: str(parsed.budget?.daily, fb.budget.daily, 24),
      window: str(parsed.budget?.window, fb.budget.window, 24),
    },
    audience: str(parsed.audience, fb.audience, 320),
    kpis,
    budgetSplit,
    ads,
    adAccounts: fb.adAccounts,
  };
}

export async function POST(request: Request) {
  const guard = await guardAndSpend("campaign");
  if (!guard.ok) return guardFailResponse(guard);
  try {
    const key = process.env.OPENAI_API_KEY?.trim();
    const body = (await request.json()) as Body;
    const topic = clampText(body.topic, 220);
    if (!topic) { await refund("campaign"); return Response.json({ error: "Missing startup topic." }, { status: 400 }); }

    if (!key) { await refund("campaign"); return Response.json(fallbackPayload()); }

    const position = clampText(body.position, 1200);
    const context = clampText(body.context, 1200);
    const validationContent = clampText(body.validationContent, 5000);
    const brandName = clampText(body.brandName, 40);

    const openai = new OpenAI({ apiKey: key });

    const systemPrompt =
      "You are a senior performance-creative director. Return strict JSON only. No markdown. No backticks. Write scroll-stopping, specific ad creative — no generic placeholders.";

    const userPrompt = `Design a €500 video-ad test campaign for this validated startup idea. The output drives a live campaign page with 4 platform ad cuts (hook + storyboard + ad copy). There are exactly 4 cuts: a YouTube pre-roll (16:9, 0:15), an Instagram/TikTok reel (9:16, 0:20), a Meta feed testimonial (1:1, 0:30), and a LinkedIn founder POV (1:1, 0:25). Keep that order and those placements.

Startup idea: ${topic}
${brandName ? `Brand name (use it): ${brandName}` : ""}
Founder reasoning: ${position || "N/A"}
Context: ${context || "N/A"}
Validation summary: ${validationContent || "N/A"}

Return EXACTLY this JSON shape. No extra keys. No prose.

{
  "objective": "one-sentence campaign objective tied to a concrete conversion goal",
  "angle": "the core scroll-stopping angle / cost-of-status-quo (<=45 words)",
  "budget": {"total":"€500","daily":"€35 / day","window":"14 days"},
  "audience": "exact targeting: roles, company size, geo, interests (<=45 words)",
  "kpis": [
    {"k":"Target CPA","v":"≤€NN"},
    {"k":"Hook rate","v":">NN%"},
    {"k":"Ad cuts","v":"4"},
    {"k":"Test budget","v":"€500"}
  ],
  "budgetSplit": [
    {"platform":"YouTube","pct":35},
    {"platform":"Meta (IG/FB)","pct":35},
    {"platform":"TikTok","pct":20},
    {"platform":"LinkedIn","pct":10}
  ],
  "ads": [
    {"concept":"<=4 word concept","hook":"the spoken/on-screen hook line","scenes":[{"t":"0:00","visual":"what we see","line":"VO/on-screen line"},{"t":"0:04","visual":"...","line":"..."},{"t":"0:08","visual":"...","line":"..."},{"t":"0:12","visual":"...","line":"CTA line →"}],"adCopy":{"headline":"<=6 words","primary":"<=30 word primary text"},"cta":"button label"},
    {"concept":"...","hook":"...","scenes":[ ...4 scenes... ],"adCopy":{"headline":"...","primary":"..."},"cta":"..."},
    {"concept":"...","hook":"...","scenes":[ ...4 scenes... ],"adCopy":{"headline":"...","primary":"..."},"cta":"..."},
    {"concept":"...","hook":"...","scenes":[ ...4 scenes... ],"adCopy":{"headline":"...","primary":"..."},"cta":"..."}
  ]
}

Rules:
- EXACTLY 4 ads in the stated placement order; each ad has EXACTLY 4 scenes.
- Hooks must be specific to the idea's buyer pain — not generic.
- budgetSplit: keep the four platforms in that order; tune each pct to the audience (e.g. a B2B/LinkedIn-native buyer shifts budget toward LinkedIn) so the four values sum to 100.
- No fake metrics in copy, no markdown — JSON only.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_completion_tokens: 3500,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    return Response.json(parsePayload(raw));
  } catch (error) {
    console.error("campaign route error:", error);
    await refund("campaign");
    return Response.json(fallbackPayload());
  }
}
