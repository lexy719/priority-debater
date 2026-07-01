/**
 * /api/campaign
 * ─────────────────────────────────────────────────────────────────────────
 * Turns the validated idea into a launch-ready STATIC-ad campaign: objective,
 * angle, budget split, audience, KPIs, and 4 platform-specific static creatives
 * (on-creative headline + subhead + post copy). No video, no people, no voice —
 * simple image ads that sell.
 *
 * Mirrors /api/launch-kit: guards on OPENAI_API_KEY, gpt-4.1-mini + json_object,
 * defensive parse, and ALWAYS returns a renderable payload (MINUTA fallback).
 * The fixed platform/format scaffolding (placement, aspect, colors) comes from
 * the fallback so the 4-creative layout stays clean; the model fills the
 * creative fields (concept, headline, subhead, ad copy).
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
  debateBrief?: string;
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

  // Merge model creative onto the fixed 4-creative scaffold so layout never breaks.
  const ads: CampaignAd[] = fb.ads.map((scaffold, i) => {
    const a = Array.isArray(parsed.ads) ? parsed.ads[i] : undefined;
    if (!a) return scaffold;
    return {
      ...scaffold,
      concept: str(a.concept, scaffold.concept, 40),
      headline: str(a.headline, scaffold.headline, 80),
      subhead: str(a.subhead, scaffold.subhead, 120),
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
    const debateBrief = clampText(body.debateBrief, 1200);

    const openai = new OpenAI({ apiKey: key });

    const systemPrompt =
      "You are a senior performance-creative director who writes STATIC image ads (no video, no people, no voiceover). Return strict JSON only. No markdown. No backticks. Write scroll-stopping, specific ad copy — no generic placeholders.";

    const userPrompt = `Design a €500 STATIC-ad test campaign for this validated startup idea. The output drives a live campaign page with 4 platform-specific static creatives (a bold on-creative headline + subhead set in the brand color, plus the post copy). There are exactly 4 creatives: a YouTube static display (16:9), an Instagram/TikTok story (9:16), a Meta feed square (1:1), and a LinkedIn square (1:1). Keep that order and those placements.

These are SIMPLE STATIC IMAGE ADS — typographic creatives. Do NOT describe video, scenes, footage, actors, spokespeople, voiceover, or any human figures. The creative is just words on a colored background.

Startup idea: ${topic}
${brandName ? `Brand name (use it): ${brandName}` : ""}
Founder reasoning: ${position || "N/A"}
Context: ${context || "N/A"}
Validation summary: ${validationContent || "N/A"}
${debateBrief ? `\nAdversarial debate — UNRESOLVED gaps: lead the ad ANGLE with the strongest counter to these, since they're the objections real buyers will raise:\n${debateBrief}\n` : ""}
Return EXACTLY this JSON shape. No extra keys. No prose.

{
  "objective": "one-sentence campaign objective tied to a concrete conversion goal",
  "angle": "the core scroll-stopping angle / cost-of-status-quo (<=45 words)",
  "budget": {"total":"€500","daily":"€35 / day","window":"14 days"},
  "audience": "exact targeting: roles, company size, geo, interests (<=45 words)",
  "kpis": [
    {"k":"Target CPA","v":"≤€NN"},
    {"k":"CTR","v":">N%"},
    {"k":"Creatives","v":"4"},
    {"k":"Test budget","v":"€500"}
  ],
  "budgetSplit": [
    {"platform":"YouTube","pct":35},
    {"platform":"Meta (IG/FB)","pct":35},
    {"platform":"TikTok","pct":20},
    {"platform":"LinkedIn","pct":10}
  ],
  "ads": [
    {"concept":"<=4 word concept","headline":"the bold on-creative headline (<=8 words, can be UPPERCASE)","subhead":"one supporting line on the creative (<=14 words)","adCopy":{"headline":"<=6 words","primary":"<=30 word primary post text"},"cta":"button label"},
    {"concept":"...","headline":"...","subhead":"...","adCopy":{"headline":"...","primary":"..."},"cta":"..."},
    {"concept":"...","headline":"...","subhead":"...","adCopy":{"headline":"...","primary":"..."},"cta":"..."},
    {"concept":"...","headline":"...","subhead":"...","adCopy":{"headline":"...","primary":"..."},"cta":"..."}
  ]
}

Rules:
- EXACTLY 4 ads in the stated placement order.
- headline + subhead are the words PRINTED on the static creative; make the headline punchy and specific to the idea's buyer pain — not generic.
- No video/scene/voiceover/people language anywhere.
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
