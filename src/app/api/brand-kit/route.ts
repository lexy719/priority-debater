/**
 * /api/brand-kit
 * ─────────────────────────────────────────────────────────────────────────
 * Single OpenAI call that returns EVERYTHING the BrandKitPage needs to feel
 * dynamic without burning extra tokens: project identity (code / descriptor
 * / domain), 4 taglines, 6-color palette with WCAG-friendly contrast tokens,
 * 3-pair typography pairing, 4-principle voice block, AND the original
 * design-anchor / consistency-rules / concept-variants / logo-rules /
 * competitor-guardrails / rollout-checklist payload (so nothing downstream
 * breaks).
 *
 * Backward-compatible: all previously returned fields are preserved.
 * ─────────────────────────────────────────────────────────────────────────
 */

import OpenAI from "openai";
import { sanitizeLogoBrief } from "@/lib/logo-brief";
import { guardAndSpend, guardFailResponse, refund } from "@/lib/credits/server";

type Setup = {
  topic?: string;
  position?: string;
  context?: string;
};

export type PaletteSwatch = {
  name: string;       // short token, e.g. "INK", "PAPER", "SKY"
  hex: string;        // #RRGGBB
  role: string;       // semantic role
  contrast: string;   // #FFFFFF or #0A0A0A — readable text color on top
};

export type TypographyEntry = {
  family: string;
  role: string;
  sample: string;
};

export type VoicePrinciple = {
  tag: string;        // single uppercase word, e.g. "DIRECT"
  body: string;       // ≤140 chars
};

export type BrandKitDynamic = {
  // dynamic identity ↓ new
  projectCode: string;       // single-word brand, UPPERCASE, 4–14 chars
  fullName: string;          // longer human-readable name
  descriptor: string;        // one-line product descriptor
  domain: string;            // suggested available-looking domain
  taglines: string[];        // 4 uppercase taglines

  // ↓ extended brand-narrative fields (drive the /brand-kit flow page)
  pronunciation: string;     // how to say the name + why
  alternates: string[];      // 3 also-considered names
  rationale: string;         // why this name wins
  oneLiner: string;          // the single positioning sentence
  boilerplateShort: string;  // 1-sentence boilerplate
  boilerplateLong: string;   // 2-3 sentence boilerplate
  dos: string[];             // 3 phrases to say
  donts: string[];           // 3 phrases to never say

  // ↓ original fields (preserved)
  designAnchor: string;
  consistencyRules: string[];
  conceptVariants: Array<{
    label: string;
    rationale: string;
    promptDelta: string;
  }>;
  brandKit: {
    audience: string;
    personality: string;
    positioning: string;
    tone: string;
    palette: PaletteSwatch[];                         // now 6 entries
    typography: {
      display: TypographyEntry;
      body: TypographyEntry;
      mono: TypographyEntry;
    };
    voice: VoicePrinciple[];                          // 4 entries
    logoRules: string[];
    competitorGuardrails: Array<{ risk: string; response: string }>;
    rolloutChecklist: string[];
  };
};

function clampText(value: unknown, max: number): string {
  return String(value || "").slice(0, max).trim();
}

function clampHex(v: unknown, fallback: string): string {
  const s = String(v || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s.toUpperCase() : fallback;
}

/* Pick #fff or #0a0a0a depending on perceived luminance */
function readableOn(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#FFFFFF";
  const r = parseInt(m[1].slice(0, 2), 16);
  const g = parseInt(m[1].slice(2, 4), 16);
  const b = parseInt(m[1].slice(4, 6), 16);
  // Rec.709 luma
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.55 ? "#0A0A0A" : "#FFFFFF";
}

function slugifyDomain(topic: string): string {
  const root = topic.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 14) || "studio";
  return `${root}.com`;
}

function fallbackPayload(topic: string): BrandKitDynamic {
  const code = topic.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 10) || "STUDIO";
  return {
    projectCode: code,
    fullName: topic || "Studio Project",
    descriptor: `A focused product built around "${topic}".`,
    domain: slugifyDomain(topic),
    taglines: [
      "BUILT FOR THE WORK.",
      "SHIP IT. DEFEND IT.",
      "DESIGNED TO HOLD.",
      "FEWER WORDS. MORE PROOF.",
    ],
    pronunciation: `/${code.toLowerCase()}/ — built around "${topic}".`,
    alternates: ["Northbound", "Cardinal", "Keystone"],
    rationale: `"${code}" is short, ownable, and easy to say — it anchors the product's promise without boxing it into one feature.`,
    oneLiner: `${code} turns "${topic}" into a product people can adopt today — clear, focused, and built to earn trust fast.`,
    boilerplateShort: `${code} is a focused product built around "${topic}".`,
    boilerplateLong: `${code} is a focused product built around "${topic}". It does one job exceptionally well, earns trust through clarity, and is designed to hold up under real-world use — not just a demo.`,
    dos: ["“Built for the work”", "“Show the proof”", "“One job, done well”"],
    donts: ["“Revolutionary”", "“AI-powered everything”", "“Trust us”"],
    designAnchor: `Professional, minimal identity for "${topic}" with a strong silhouette and small-size legibility.`,
    consistencyRules: [
      "Keep geometry simple and reproducible.",
      "Preserve one clear visual metaphor across all variants.",
      "Avoid decorative effects, gradients, and noisy textures.",
      "Prioritize icon legibility at 16px and 32px.",
    ],
    conceptVariants: [
      { label: "Concept A", rationale: "Balanced, founder-safe direction.", promptDelta: "Conservative, restrained contrast." },
      { label: "Concept B", rationale: "Classic and timeless route.",        promptDelta: "Typographic clarity and symmetry." },
      { label: "Concept C", rationale: "Bolder expression.",                 promptDelta: "Increase contrast and icon distinctiveness." },
    ],
    brandKit: {
      audience: "Early adopters and pragmatic buyers evaluating reliability and clarity.",
      personality: "Confident, modern, clear.",
      positioning: "A focused, trustworthy product with practical outcomes.",
      tone: "Direct, calm, and specific.",
      palette: [
        { name: "INK",    hex: "#0A0A0A", role: "Primary surface",        contrast: "#FFFFFF" },
        { name: "PAPER",  hex: "#F4F3EF", role: "Canvas / light surface", contrast: "#0A0A0A" },
        { name: "SKY",    hex: "#7DD3FC", role: "Signal / accent",        contrast: "#0A0A0A" },
        { name: "DEEP",   hex: "#38BDF8", role: "Charts / highlight",     contrast: "#FFFFFF" },
        { name: "SIGNAL", hex: "#FF3B30", role: "Risk / alert",           contrast: "#FFFFFF" },
        { name: "BONE",   hex: "#EBE9E2", role: "Sub-surface",            contrast: "#0A0A0A" },
      ],
      typography: {
        display: { family: "Anton",          role: "Display & headlines",         sample: "EVERY ANGLE." },
        body:    { family: "Inter",          role: "Body & paragraphs",           sample: "Engineered for the work." },
        mono:    { family: "JetBrains Mono", role: "Metadata, ticker, code",      sample: "§01 / SYSTEM" },
      },
      voice: [
        { tag: "DIRECT",     body: "Short sentences. No marketing fluff. We trust the reader's time." },
        { tag: "ENGINEERED", body: "Numbers over adjectives. We name the metric, the unit, the cost." },
        { tag: "FOUNDER-LED",body: "Written like a builder, not a brand. First person allowed." },
        { tag: "NEVER PREACHY", body: "Outcome over ideology. We earn the bonus, never preach it." },
      ],
      logoRules: [
        "Keep clear-space equal to the icon's inner negative-space radius.",
        "Do not use effects or drop-shadows on the mark.",
        "Use monochrome version when background contrast is uncertain.",
      ],
      competitorGuardrails: [
        { risk: "Looks like generic SaaS gradient logos",
          response: "Anchor on one distinct shape metaphor and reduce color count." },
        { risk: "Too playful for serious buyers",
          response: "Use calmer typography and preserve geometric discipline." },
      ],
      rolloutChecklist: [
        "Primary lockup (horizontal + stacked)",
        "Icon-only mark for favicon/app icon",
        "Monochrome and reversed versions",
        "Social avatar safe-crop variant",
      ],
    },
  };
}

function parseKitResponse(rawText: string, topic: string): BrandKitDynamic {
  const cleaned = rawText.replace(/^```json\s*|```$/g, "").trim();
  let parsed: Partial<BrandKitDynamic>;
  try { parsed = JSON.parse(cleaned) as Partial<BrandKitDynamic>; }
  catch { return fallbackPayload(topic); }

  const fb = fallbackPayload(topic);
  const str  = (v: unknown, d: string) => (typeof v === "string" && v.trim() ? v.trim() : d);
  const arr  = (v: unknown, d: string[]) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 8) : d;

  const palette = Array.isArray(parsed.brandKit?.palette) && parsed.brandKit.palette.length > 0
    ? parsed.brandKit.palette.slice(0, 6).map((row, idx) => {
        const hex = clampHex(row?.hex, fb.brandKit.palette[idx]?.hex ?? "#0A0A0A");
        const contrast = clampHex(row?.contrast, readableOn(hex));
        return {
          name: str(row?.name, fb.brandKit.palette[idx]?.name ?? "TOKEN").toUpperCase(),
          hex,
          role: str(row?.role, fb.brandKit.palette[idx]?.role ?? "General use"),
          contrast,
        };
      })
    : fb.brandKit.palette;
  while (palette.length < 6) palette.push(fb.brandKit.palette[palette.length]);

  const voice = Array.isArray(parsed.brandKit?.voice) && parsed.brandKit.voice.length > 0
    ? parsed.brandKit.voice.slice(0, 4).map((row, idx) => ({
        tag: str(row?.tag, fb.brandKit.voice[idx]?.tag ?? "DIRECT").toUpperCase().slice(0, 14),
        body: str(row?.body, fb.brandKit.voice[idx]?.body ?? "").slice(0, 200),
      }))
    : fb.brandKit.voice;
  while (voice.length < 4) voice.push(fb.brandKit.voice[voice.length]);

  const taglines = arr(parsed.taglines, fb.taglines)
    .map((t) => t.toUpperCase().slice(0, 60))
    .slice(0, 4);
  while (taglines.length < 4) taglines.push(fb.taglines[taglines.length]);

  return {
    projectCode: str(parsed.projectCode, fb.projectCode).toUpperCase().slice(0, 14),
    fullName:    str(parsed.fullName, fb.fullName).slice(0, 60),
    descriptor:  str(parsed.descriptor, fb.descriptor).slice(0, 140),
    domain:      str(parsed.domain, fb.domain).slice(0, 40),
    taglines,
    pronunciation:    str(parsed.pronunciation, fb.pronunciation).slice(0, 120),
    alternates:       arr(parsed.alternates, fb.alternates).slice(0, 3),
    rationale:        str(parsed.rationale, fb.rationale).slice(0, 400),
    oneLiner:         str(parsed.oneLiner, fb.oneLiner).slice(0, 280),
    boilerplateShort: str(parsed.boilerplateShort, fb.boilerplateShort).slice(0, 200),
    boilerplateLong:  str(parsed.boilerplateLong, fb.boilerplateLong).slice(0, 500),
    dos:              arr(parsed.dos, fb.dos).slice(0, 3),
    donts:            arr(parsed.donts, fb.donts).slice(0, 3),
    designAnchor: str(parsed.designAnchor, fb.designAnchor),
    consistencyRules: arr(parsed.consistencyRules, fb.consistencyRules),
    conceptVariants: Array.isArray(parsed.conceptVariants) && parsed.conceptVariants.length > 0
      ? parsed.conceptVariants.slice(0, 3).map((item, idx) => ({
          label: str(item?.label, fb.conceptVariants[idx]?.label ?? `Concept ${idx + 1}`),
          rationale: str(item?.rationale, fb.conceptVariants[idx]?.rationale ?? ""),
          promptDelta: str(item?.promptDelta, fb.conceptVariants[idx]?.promptDelta ?? ""),
        }))
      : fb.conceptVariants,
    brandKit: {
      audience: str(parsed.brandKit?.audience, fb.brandKit.audience),
      personality: str(parsed.brandKit?.personality, fb.brandKit.personality),
      positioning: str(parsed.brandKit?.positioning, fb.brandKit.positioning),
      tone: str(parsed.brandKit?.tone, fb.brandKit.tone),
      palette,
      typography: {
        display: {
          family: str(parsed.brandKit?.typography?.display?.family, fb.brandKit.typography.display.family),
          role:   str(parsed.brandKit?.typography?.display?.role,   fb.brandKit.typography.display.role),
          sample: str(parsed.brandKit?.typography?.display?.sample, fb.brandKit.typography.display.sample).slice(0, 40),
        },
        body: {
          family: str(parsed.brandKit?.typography?.body?.family, fb.brandKit.typography.body.family),
          role:   str(parsed.brandKit?.typography?.body?.role,   fb.brandKit.typography.body.role),
          sample: str(parsed.brandKit?.typography?.body?.sample, fb.brandKit.typography.body.sample).slice(0, 80),
        },
        mono: {
          family: str(parsed.brandKit?.typography?.mono?.family, fb.brandKit.typography.mono.family),
          role:   str(parsed.brandKit?.typography?.mono?.role,   fb.brandKit.typography.mono.role),
          sample: str(parsed.brandKit?.typography?.mono?.sample, fb.brandKit.typography.mono.sample).slice(0, 40),
        },
      },
      voice,
      logoRules: arr(parsed.brandKit?.logoRules, fb.brandKit.logoRules),
      competitorGuardrails: Array.isArray(parsed.brandKit?.competitorGuardrails)
        ? parsed.brandKit.competitorGuardrails.slice(0, 6).map((row) => ({
            risk: str(row?.risk, "Unclear differentiation"),
            response: str(row?.response, "Clarify symbol logic and positioning."),
          }))
        : fb.brandKit.competitorGuardrails,
      rolloutChecklist: arr(parsed.brandKit?.rolloutChecklist, fb.brandKit.rolloutChecklist),
    },
  };
}

export async function POST(request: Request) {
  const guard = await guardAndSpend("brand_kit");
  if (!guard.ok) return guardFailResponse(guard);
  try {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) {
      await refund("brand_kit");
      return Response.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });
    }

    const body = (await request.json()) as {
      setup?: Setup;
      validationContent?: string;
      logoBrief?: unknown;
    };

    const topic = clampText(body.setup?.topic, 220);
    const position = clampText(body.setup?.position, 1200);
    const context = clampText(body.setup?.context, 1200);
    const validationContent = clampText(body.validationContent, 7000);
    if (!topic) { await refund("brand_kit"); return Response.json({ error: "Missing startup topic." }, { status: 400 }); }

    const brief = sanitizeLogoBrief(body.logoBrief);
    const briefText = brief
      ? JSON.stringify(brief)
      : "No explicit logo brief provided. Choose reasonable defaults.";

    const openai = new OpenAI({ apiKey: key });

    const systemPrompt =
      "You are a senior brand strategist + identity designer. Return strict JSON only. No markdown. No backticks.";
    const userPrompt = `Build a COMPLETE brand identity blueprint for this startup. The output drives a live brand-kit page (project name, taglines, palette swatches, typography, voice, applied mockups), so every field must be specific to the idea — not generic.

Startup idea: ${topic}
Reasoning / position: ${position || "N/A"}
Context: ${context || "N/A"}
Validation summary: ${validationContent || "N/A"}
Founder logo brief: ${briefText}

Return EXACTLY this JSON shape. No extra keys. No prose.

{
  "projectCode": "SINGLE-WORD UPPERCASE BRAND NAME, 4-12 chars, derived from the idea",
  "fullName": "Human-readable brand, e.g. 'Cargobyte Mobility'",
  "descriptor": "ONE short sentence (<= 90 chars) describing what the product does",
  "domain": "available-looking domain, e.g. 'cargobyte.eu' (<= 30 chars)",
  "taglines": [
    "UPPERCASE TAGLINE 1.",
    "UPPERCASE TAGLINE 2.",
    "UPPERCASE TAGLINE 3.",
    "UPPERCASE TAGLINE 4."
  ],
  "pronunciation": "how to say the name + the one-line reason it resonates",
  "alternates": ["Alt name 1","Alt name 2","Alt name 3"],
  "rationale": "2-3 sentences on why this name wins for this idea",
  "oneLiner": "ONE positioning sentence: <brand> turns X into Y for Z",
  "boilerplateShort": "one-sentence boilerplate",
  "boilerplateLong": "2-3 sentence boilerplate",
  "dos": ["phrase to say","phrase to say","phrase to say"],
  "donts": ["phrase to NEVER say","phrase to NEVER say","phrase to NEVER say"],
  "designAnchor": "1-2 sentence direction anchor",
  "consistencyRules": ["rule 1","rule 2","rule 3","rule 4"],
  "conceptVariants": [
    {"label":"Concept A","rationale":"why","promptDelta":"how it differs"},
    {"label":"Concept B","rationale":"why","promptDelta":"how it differs"},
    {"label":"Concept C","rationale":"why","promptDelta":"how it differs"}
  ],
  "brandKit": {
    "audience": "string",
    "personality": "string",
    "positioning": "string",
    "tone": "string",
    "palette": [
      {"name":"INK","hex":"#RRGGBB","role":"Primary surface","contrast":"#FFFFFF or #0A0A0A"},
      {"name":"PAPER","hex":"#RRGGBB","role":"Canvas","contrast":"#0A0A0A or #FFFFFF"},
      {"name":"ACCENT","hex":"#RRGGBB","role":"Signal / CTA","contrast":"..."},
      {"name":"DEEP","hex":"#RRGGBB","role":"Charts / highlight","contrast":"..."},
      {"name":"SIGNAL","hex":"#RRGGBB","role":"Risk / alert","contrast":"..."},
      {"name":"SUB","hex":"#RRGGBB","role":"Sub-surface","contrast":"..."}
    ],
    "typography": {
      "display": {"family":"Font name","role":"Display & headlines","sample":"ONE LINE SAMPLE."},
      "body":    {"family":"Font name","role":"Body & paragraphs","sample":"One body sample sentence."},
      "mono":    {"family":"Font name","role":"Metadata / ticker","sample":"§01 / SYSTEM"}
    },
    "voice": [
      {"tag":"DIRECT","body":"<=120 char principle"},
      {"tag":"ENGINEERED","body":"<=120 char principle"},
      {"tag":"FOUNDER-LED","body":"<=120 char principle"},
      {"tag":"NEVER PREACHY","body":"<=120 char principle"}
    ],
    "logoRules": ["rule","rule","rule"],
    "competitorGuardrails": [
      {"risk":"string","response":"string"},
      {"risk":"string","response":"string"}
    ],
    "rolloutChecklist": ["item","item","item","item"]
  }
}

Rules:
- Every field MUST reflect the specific idea — name, taglines, palette mood, voice should obviously match the product.
- Hex must be valid #RRGGBB and FORM A COHERENT PALETTE (not random rainbow). Choose one ink, one paper, one signal/CTA accent, and 3 supporting tones.
- 'contrast' must be either '#FFFFFF' or '#0A0A0A' — whichever is more readable on top of 'hex'.
- Taglines: UPPERCASE, punchy, end with period. Each <= 50 chars.
- projectCode: single word, uppercase, no spaces.
- No legal claims, no fake metrics, no markdown — JSON only.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_completion_tokens: 2400,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    const payload = parseKitResponse(raw, topic);
    return Response.json(payload);
  } catch (error) {
    console.error("brand-kit route error:", error);
    await refund("brand_kit");
    return Response.json({ error: "Failed to generate brand blueprint." }, { status: 500 });
  }
}
