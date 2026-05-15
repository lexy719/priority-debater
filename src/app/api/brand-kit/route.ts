import OpenAI from "openai";
import { sanitizeLogoBrief } from "@/lib/logo-brief";

type Setup = {
  topic?: string;
  position?: string;
  context?: string;
};

type KitResponse = {
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
    palette: Array<{ token: string; hex: string; usage: string }>;
    typography: {
      primary: string;
      secondary: string;
      guidance: string;
    };
    logoRules: string[];
    competitorGuardrails: Array<{ risk: string; response: string }>;
    rolloutChecklist: string[];
  };
};

function clampText(value: unknown, max: number): string {
  return String(value || "").slice(0, max).trim();
}

function fallbackPayload(topic: string): KitResponse {
  return {
    designAnchor: `Professional, minimal identity for "${topic}" with a strong silhouette and small-size legibility.`,
    consistencyRules: [
      "Keep geometry simple and reproducible.",
      "Preserve one clear visual metaphor across all variants.",
      "Avoid decorative effects, gradients, and noisy textures.",
      "Prioritize icon legibility at 16px and 32px.",
    ],
    conceptVariants: [
      {
        label: "Concept A",
        rationale: "Balanced, founder-safe direction with clear category signal.",
        promptDelta: "Keep a conservative, trustworthy execution with restrained contrast.",
      },
      {
        label: "Concept B",
        rationale: "Classic and timeless route for broad market trust.",
        promptDelta: "Push typographic clarity and symmetry. Avoid novelty.",
      },
      {
        label: "Concept C",
        rationale: "Bolder expression while preserving recognizability.",
        promptDelta: "Increase contrast and icon distinctiveness without adding clutter.",
      },
    ],
    brandKit: {
      audience: "Early adopters and pragmatic buyers evaluating reliability and clarity.",
      personality: "Confident, modern, clear.",
      positioning: "A focused, trustworthy product with practical outcomes.",
      tone: "Direct, calm, and specific.",
      palette: [
        { token: "Primary", hex: "#4F46E5", usage: "Primary CTAs and highlights" },
        { token: "Secondary", hex: "#8B5CF6", usage: "Secondary emphasis and accents" },
        { token: "Neutral / Text", hex: "#0B1020", usage: "Text and high-contrast marks" },
      ],
      typography: {
        primary: "Inter SemiBold",
        secondary: "Inter Regular",
        guidance: "Use tight heading tracking and generous body spacing.",
      },
      logoRules: [
        "Keep clear-space equal to the icon's inner negative-space radius.",
        "Do not use effects or drop-shadows on the mark.",
        "Use monochrome version when background contrast is uncertain.",
      ],
      competitorGuardrails: [
        {
          risk: "Looks like generic SaaS gradient logos",
          response: "Anchor on one distinct shape metaphor and reduce color count.",
        },
        {
          risk: "Too playful for serious buyers",
          response: "Use calmer typography and preserve geometric discipline.",
        },
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

function parseKitResponse(rawText: string, topic: string): KitResponse {
  const cleaned = rawText.replace(/^```json\s*|```$/g, "").trim();
  const parsed = JSON.parse(cleaned) as Partial<KitResponse>;
  const fallback = fallbackPayload(topic);

  const toStr = (v: unknown, d: string) => (typeof v === "string" && v.trim() ? v.trim() : d);
  const toStrList = (v: unknown, d: string[]) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 8) : d;

  return {
    designAnchor: toStr(parsed.designAnchor, fallback.designAnchor),
    consistencyRules: toStrList(parsed.consistencyRules, fallback.consistencyRules),
    conceptVariants: Array.isArray(parsed.conceptVariants) && parsed.conceptVariants.length > 0
      ? parsed.conceptVariants.slice(0, 3).map((item, idx) => ({
          label: toStr(item?.label, fallback.conceptVariants[idx]?.label ?? `Concept ${idx + 1}`),
          rationale: toStr(item?.rationale, fallback.conceptVariants[idx]?.rationale ?? ""),
          promptDelta: toStr(item?.promptDelta, fallback.conceptVariants[idx]?.promptDelta ?? ""),
        }))
      : fallback.conceptVariants,
    brandKit: {
      audience: toStr(parsed.brandKit?.audience, fallback.brandKit.audience),
      personality: toStr(parsed.brandKit?.personality, fallback.brandKit.personality),
      positioning: toStr(parsed.brandKit?.positioning, fallback.brandKit.positioning),
      tone: toStr(parsed.brandKit?.tone, fallback.brandKit.tone),
      palette: Array.isArray(parsed.brandKit?.palette) && parsed.brandKit.palette.length > 0
        ? parsed.brandKit.palette.slice(0, 6).map((row) => ({
            token: toStr(row?.token, "Token"),
            hex: toStr(row?.hex, "#4F46E5"),
            usage: toStr(row?.usage, "General use"),
          }))
        : fallback.brandKit.palette,
      typography: {
        primary: toStr(parsed.brandKit?.typography?.primary, fallback.brandKit.typography.primary),
        secondary: toStr(parsed.brandKit?.typography?.secondary, fallback.brandKit.typography.secondary),
        guidance: toStr(parsed.brandKit?.typography?.guidance, fallback.brandKit.typography.guidance),
      },
      logoRules: toStrList(parsed.brandKit?.logoRules, fallback.brandKit.logoRules),
      competitorGuardrails: Array.isArray(parsed.brandKit?.competitorGuardrails)
        ? parsed.brandKit.competitorGuardrails
            .slice(0, 6)
            .map((row) => ({
              risk: toStr(row?.risk, "Unclear differentiation"),
              response: toStr(row?.response, "Clarify symbol logic and positioning."),
            }))
        : fallback.brandKit.competitorGuardrails,
      rolloutChecklist: toStrList(parsed.brandKit?.rolloutChecklist, fallback.brandKit.rolloutChecklist),
    },
  };
}

export async function POST(request: Request) {
  try {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) {
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
    if (!topic) return Response.json({ error: "Missing startup topic." }, { status: 400 });

    const brief = sanitizeLogoBrief(body.logoBrief);
    const briefText = brief
      ? JSON.stringify(brief)
      : "No explicit logo brief provided. Choose reasonable defaults.";

    const openai = new OpenAI({ apiKey: key });

    const systemPrompt =
      "You are a senior brand strategist and identity designer. Return strict JSON only. No markdown.";
    const userPrompt = `Build an identity blueprint for this startup.

Startup: ${topic}
Reasoning: ${position || "N/A"}
Context: ${context || "N/A"}
Validation summary: ${validationContent || "N/A"}
Founder logo brief: ${briefText}

Output JSON with this exact shape:
{
  "designAnchor": "1-2 sentence direction anchor",
  "consistencyRules": ["rule 1", "rule 2", "rule 3", "rule 4"],
  "conceptVariants": [
    {"label":"Concept A","rationale":"short why","promptDelta":"how this variant differs"},
    {"label":"Concept B","rationale":"short why","promptDelta":"how this variant differs"},
    {"label":"Concept C","rationale":"short why","promptDelta":"how this variant differs"}
  ],
  "brandKit": {
    "audience":"string",
    "personality":"string",
    "positioning":"string",
    "tone":"string",
    "palette":[
      {"token":"Primary","hex":"#RRGGBB","usage":"string"},
      {"token":"Secondary","hex":"#RRGGBB","usage":"string"},
      {"token":"Neutral / Text","hex":"#RRGGBB","usage":"string"}
    ],
    "typography":{"primary":"string","secondary":"string","guidance":"string"},
    "logoRules":["rule", "rule", "rule"],
    "competitorGuardrails":[{"risk":"string","response":"string"},{"risk":"string","response":"string"}],
    "rolloutChecklist":["item","item","item","item"]
  }
}

Rules:
- Keep practical, specific language.
- Hex colors must be valid #RRGGBB.
- Competitor guardrails must be concrete and non-generic.
- No legal claims, no fake certainty.
- JSON only.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.45,
      max_completion_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    const payload = parseKitResponse(raw, topic);
    return Response.json(payload);
  } catch (error) {
    console.error("brand-kit route error:", error);
    return Response.json({ error: "Failed to generate brand blueprint." }, { status: 500 });
  }
}

