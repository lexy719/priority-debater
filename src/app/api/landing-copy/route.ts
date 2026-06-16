import OpenAI from "openai";
import type { LandingCopy, TemplateId } from "@/lib/landing-template-types";
import { guardAndSpend, guardFailResponse, refund } from "@/lib/credits/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a senior B2B/B2C copywriter generating a ready-to-launch landing page for a specific startup idea.

CRITICAL RULES:
- Output ONLY valid JSON. No markdown, no commentary, no code fences.
- Every line must be specific to the idea — no generic placeholders, no "Lorem ipsum", no "TBD".
- Match the template's voice (editorial=confident & literary, warm=friendly & encouraging, tech=precise & engineering-grade, brutalist=direct & opinionated).
- Use the dashboard data when present (TAM, audience, competitors) to ground copy in real numbers.
- Headlines must hook in <8 words. Sub-copy <30 words. Feature bodies <22 words. Quotes feel real.
- No emoji. No exclamation marks except in the brutalist template (max 1).`;

function voiceForTemplate(t: TemplateId): string {
    switch (t) {
        case "editorial": return "Confident, literary, B2B premium. Long-form opening, em-dashes welcome.";
        case "warm": return "Friendly, encouraging, second-person. Talks WITH the reader, not AT them.";
        case "tech": return "Precise, engineering-grade, dense with verbs. Specs over adjectives.";
        case "brutalist": return "Direct, opinionated, mono-type-friendly. ALL CAPS okay for emphasis. One sharp claim.";
    }
}

function buildUserPrompt(args: {
    topic: string; position: string; context: string;
    templateId: TemplateId;
    dashboard: unknown;
}): string {
    const { topic, position, context, templateId, dashboard } = args;
    const voice = voiceForTemplate(templateId);
    const dashStr = dashboard ? JSON.stringify(dashboard).slice(0, 6000) : "(no dashboard data)";
    return `Generate a landing-page copy payload for this idea.

IDEA: ${topic}
${position ? `\nFOUNDER REASONING: ${position}` : ""}
${context ? `\nCONTEXT: ${context}` : ""}

TEMPLATE: ${templateId.toUpperCase()}
VOICE: ${voice}

DASHBOARD DATA (use for grounding): ${dashStr}

Return JSON matching exactly this schema:
{
  "brand": { "name": "<short product name, 1-2 words>", "tagline": "<5-7 word positioning>" },
  "hero": {
    "kicker": "<3-5 word tag like 'NEW · YC W26' or category>",
    "title": "<headline in 6-10 words, can use period breaks for line splits>",
    "sub": "<sub-copy 18-28 words explaining what + who + why now>",
    "primaryCta": "<2-3 word action, e.g. 'GET EARLY ACCESS'>",
    "secondaryCta": "<2-3 word action, e.g. 'WATCH DEMO'>",
    "proofLine": "<one-line social proof: numbers, logos, or status>"
  },
  "problem": {
    "eyebrow": "THE PROBLEM",
    "title": "<3-7 words naming the pain>",
    "body": "<35-55 words, three short sentences max>"
  },
  "features": [
    {"kicker":"F-01","title":"<4-6 words>","body":"<14-22 words>"},
    {"kicker":"F-02","title":"<>","body":"<>"},
    {"kicker":"F-03","title":"<>","body":"<>"},
    {"kicker":"F-04","title":"<>","body":"<>"},
    {"kicker":"F-05","title":"<>","body":"<>"},
    {"kicker":"F-06","title":"<>","body":"<>"}
  ],
  "metrics": [
    {"value":"<short e.g. '4.2x'>","label":"<8-12 chars>"},
    {"value":"<>","label":"<>"},
    {"value":"<>","label":"<>"},
    {"value":"<>","label":"<>"}
  ],
  "testimonial": {
    "quote": "<25-40 words, sounds like a real operator from the target audience>",
    "author": "<plausible name>",
    "role": "<role · company-type>"
  },
  "pricing": [
    {"name":"STARTER","price":"$X","period":"/mo","features":["<>","<>","<>","<>"],"cta":"START FREE","featured":false},
    {"name":"GROWTH","price":"$Y","period":"/mo","features":["<>","<>","<>","<>","<>"],"cta":"START TRIAL","featured":true},
    {"name":"SCALE","price":"$Z or 'CUSTOM'","period":"/mo","features":["<>","<>","<>","<>"],"cta":"TALK TO US","featured":false}
  ],
  "finalCta": {
    "title": "<5-8 words, urgent>",
    "body": "<20-35 words, removes objections>",
    "cta": "<2-3 word action>"
  },
  "seo": {
    "title": "<60-65 chars>",
    "description": "<155-160 chars>"
  },
  "imageQuery": "<2-4 word phrase for stock photo search, describes the SCENE not the product, e.g. 'modern warehouse logistics' or 'designer working laptop'>"
}

Return JSON only.`;
}

function tryParseJson(raw: string): unknown {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    try { return JSON.parse(cleaned); } catch {
        const s = cleaned.indexOf("{");
        const e = cleaned.lastIndexOf("}");
        if (s >= 0 && e > s) {
            try { return JSON.parse(cleaned.slice(s, e + 1)); } catch { return null; }
        }
        return null;
    }
}

export async function POST(req: Request) {
    const guard = await guardAndSpend("landing");
    if (!guard.ok) return guardFailResponse(guard);
    try {
        if (!process.env.OPENAI_API_KEY) {
            await refund("landing");
            return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500 });
        }
        const body = await req.json() as {
            topic?: string; position?: string; context?: string;
            templateId?: TemplateId; dashboardData?: unknown;
        };
        const topic = String(body.topic ?? "").slice(0, 1000).trim();
        const position = String(body.position ?? "").slice(0, 3000).trim();
        const context = String(body.context ?? "").slice(0, 4000).trim();
        const templateId = (["editorial", "warm", "tech", "brutalist"].includes(String(body.templateId))
            ? body.templateId
            : "editorial") as TemplateId;
        if (!topic) {
            await refund("landing");
            return new Response(JSON.stringify({ error: "topic required" }), { status: 400 });
        }

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
            model: "gpt-4.1",
            temperature: 0.7,
            max_completion_tokens: 2800,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: buildUserPrompt({ topic, position, context, templateId, dashboard: body.dashboardData }) },
            ],
        });

        const raw = completion.choices[0]?.message?.content ?? "";
        const parsed = tryParseJson(raw);
        if (!parsed || typeof parsed !== "object") {
            await refund("landing");
            return new Response(JSON.stringify({ error: "AI returned invalid JSON" }), { status: 502 });
        }
        return new Response(JSON.stringify(parsed as LandingCopy), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (e) {
        await refund("landing");
        const msg = e instanceof Error ? e.message : "unknown error";
        return new Response(JSON.stringify({ error: msg }), { status: 500 });
    }
}
