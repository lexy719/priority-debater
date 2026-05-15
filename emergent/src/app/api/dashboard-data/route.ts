import OpenAI from "openai";
import type { DashboardData } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a senior startup analyst converting a validation report into a structured dashboard payload.

CRITICAL RULES:
- Output ONLY valid JSON. No markdown, no code fences, no commentary.
- Every field must be SPECIFIC to the idea provided. Do NOT use generic placeholders, "—", "TBD", "N/A", or copy example values verbatim.
- Numbers must be plausible for THIS idea's market.
- Lists must contain idea-specific items (real competitor names where plausible; otherwise descriptive archetypes like "Incumbent spreadsheet workflow").
- Vary numbers across ideas — no two ideas should produce identical scores or projections.
- All money values in growth arrays are NUMBERS (no currency symbols). TAM in $B, SAM/SOM in $M.
- All percentages are integers 0-100.
- All scores are integers 0-100.`;

function buildUserPrompt(idea: string, position: string, context: string, markdown: string): string {
  return `Generate the JSON dashboard payload for this startup idea.

IDEA: ${idea}
${position ? `\nFOUNDER REASONING: ${position}` : ""}
${context ? `\nCONTEXT: ${context}` : ""}

VALIDATION REPORT (use as the authoritative source of facts):
${markdown.slice(0, 14000)}

Return a JSON object matching exactly this schema (replace ALL values with idea-specific data):
{
  "score": <int 0-100, headline viability>,
  "verdict": "GO" | "CAUTION" | "NO-GO",
  "confidenceLabel": "HIGH" | "MED" | "LOW",
  "confidencePct": <int 30-95>,
  "rankLabel": "<e.g. 'Top 18%'>",
  "oneLineThesis": "<one sharp sentence specific to this idea>",
  "scoreHeroBlurb": "<2 sentences summarizing the validation read>",
  "scoreHistory": [
    {"v":"INTAKE","score":<int>},{"v":"PANEL","score":<int>},
    {"v":"SYNTH","score":<int>},{"v":"REPORT","score":<int>},{"v":"FINAL","score":<int>}
  ],
  "categoryScores": {
    "problemSolutionFit": <int>, "marketOpportunity": <int>,
    "competitiveEdge": <int>, "businessModel": <int>,
    "teamExecution": <int>, "timingTrends": <int>
  },
  "market": {
    "tam": "<e.g. '$24B'>", "sam": "<e.g. '$3.2B'>", "som": "<e.g. '$240M'>",
    "cagrPct": <int>,
    "intro": "<2-3 sentences on market timing, drivers, headwinds for THIS idea>",
    "growth": [
      {"year":"Y1","tam":<num B>,"sam":<num M>,"som":<num M>},
      {"year":"Y2","tam":<num>,"sam":<num>,"som":<num>},
      {"year":"Y3","tam":<num>,"sam":<num>,"som":<num>},
      {"year":"Y4","tam":<num>,"sam":<num>,"som":<num>},
      {"year":"Y5","tam":<num>,"sam":<num>,"som":<num>}
    ],
    "signals": [
      {"tag":"MARKET","label":"<specific signal>","weight":"+6 pts"},
      {"tag":"TIMING","label":"<specific signal>","weight":"+4 pts"},
      {"tag":"REGULATORY","label":"<specific signal>","weight":"-3 pts"},
      {"tag":"TECH","label":"<specific signal>","weight":"+5 pts"}
    ]
  },
  "risk": {
    "intro": "<one sentence on where it breaks for THIS idea>",
    "radar": [
      {"dim":"FIT","value":<0-100 — higher = MORE risk = 100 - rubric score>,"full":100},
      {"dim":"MKT","value":<int>,"full":100},
      {"dim":"TIME","value":<int>,"full":100},
      {"dim":"MODEL","value":<int>,"full":100},
      {"dim":"COMP","value":<int>,"full":100},
      {"dim":"TEAM","value":<int>,"full":100}
    ],
    "breakdown": [
      {"category":"MARKET","severity":"HIGH"|"MED"|"LOW","title":"<specific risk>","mitigation":"<specific action>"},
      {"category":"EXECUTION","severity":"HIGH"|"MED"|"LOW","title":"<specific risk>","mitigation":"<specific action>"},
      {"category":"COMPETITION","severity":"HIGH"|"MED"|"LOW","title":"<specific risk>","mitigation":"<specific action>"},
      {"category":"MODEL","severity":"HIGH"|"MED"|"LOW","title":"<specific risk>","mitigation":"<specific action>"}
    ]
  },
  "competition": {
    "intro": "<2 sentences on competitive landscape specific to THIS idea>",
    "competitors": [
      {"name":"<real or archetype>","focus":"<short>","price":"<$/mo or 'free' or 'enterprise'>","traction":<int 0-100>,"weakness":"<short>","url":""},
      {"name":"<>","focus":"<>","price":"<>","traction":<int>,"weakness":"<>","url":""},
      {"name":"<>","focus":"<>","price":"<>","traction":<int>,"weakness":"<>","url":""},
      {"name":"<>","focus":"<>","price":"<>","traction":<int>,"weakness":"<>","url":""}
    ],
    "scatter": [
      {"x":<int 0-100, price low->high>,"y":<int 0-100, traction low->high>,"name":"YOU","you":true},
      {"x":<int>,"y":<int>,"name":"<comp1>"},
      {"x":<int>,"y":<int>,"name":"<comp2>"},
      {"x":<int>,"y":<int>,"name":"<comp3>"},
      {"x":<int>,"y":<int>,"name":"<comp4>"}
    ]
  },
  "revenue": {
    "headline": "<e.g. '€4.8M' or 'FORECAST PENDING'>",
    "narrative": "<2-3 sentences on revenue model and trajectory>",
    "projection": [
      {"year":"Y1","total":<num M>,"base":<num>,"expansion":<num>},
      {"year":"Y2","total":<num>,"base":<num>,"expansion":<num>},
      {"year":"Y3","total":<num>,"base":<num>,"expansion":<num>},
      {"year":"Y4","total":<num>,"base":<num>,"expansion":<num>},
      {"year":"Y5","total":<num>,"base":<num>,"expansion":<num>}
    ],
    "pricingModels": [
      {"plan":"STARTER","price":"<$X/mo>","terms":"<short>"},
      {"plan":"GROWTH","price":"<$Y/mo>","terms":"<short>"},
      {"plan":"ENTERPRISE","price":"<Custom or $Z>","terms":"<short>"}
    ]
  },
  "audience": {
    "intro": "<2 sentences on the buyer specific to THIS idea>",
    "segments": [
      {"name":"<primary ICP>","value":<int sums~100>,"color":"#7dd3fc"},
      {"name":"<secondary>","value":<int>,"color":"#ff8a00"},
      {"name":"<tertiary>","value":<int>,"color":"#2f6bff"},
      {"name":"<niche>","value":<int>,"color":"#ffd60a"}
    ],
    "personas": [
      {"title":"<role>","org":"<company type>","budget":"<$ or 'self-funded'>","pain":"<short>","why":"<short>"},
      {"title":"<role>","org":"<>","budget":"<>","pain":"<>","why":"<>"},
      {"title":"<role>","org":"<>","budget":"<>","pain":"<>","why":"<>"}
    ]
  },
  "swot": {
    "strengths": ["<idea-specific>","<>","<>","<>"],
    "weaknesses": ["<idea-specific>","<>","<>"],
    "opportunities": ["<idea-specific>","<>","<>","<>"],
    "threats": ["<idea-specific>","<>","<>"]
  },
  "recommendations": [
    {"priority":"P0","title":"<concrete next step>","impact":"<short>","horizon":"2w","tags":["VALIDATION"]},
    {"priority":"P0","title":"<>","impact":"<>","horizon":"3w","tags":["GTM"]},
    {"priority":"P1","title":"<>","impact":"<>","horizon":"4w","tags":["PRODUCT"]},
    {"priority":"P1","title":"<>","impact":"<>","horizon":"6w","tags":["GROWTH"]},
    {"priority":"P2","title":"<>","impact":"<>","horizon":"8w","tags":["HIRING"]}
  ],
  "personaVerdicts": [
    {"name":"The Investor","role":"VC","accent":"#ff3b30","verdict":"GO"|"CONDITIONAL GO"|"NO-GO","score":<int>,"quote":"<voice in character about THIS idea>"},
    {"name":"The Customer","role":"BUYER","accent":"#ff8a00","verdict":"<>","score":<int>,"quote":"<>"},
    {"name":"The Operator","role":"COO","accent":"#2f6bff","verdict":"<>","score":<int>,"quote":"<>"},
    {"name":"The Mentor","role":"3X FOUNDER","accent":"#ffd60a","verdict":"<>","score":<int>,"quote":"<>"},
    {"name":"The Adversary","role":"SKEPTIC","accent":"#ff2d87","verdict":"<>","score":<int>,"quote":"<>"}
  ],
  "ticker": ["VIABILITY <N>/100","VERDICT <X>","TAM <>","SAM <>","SOM <>","<>","REPORT LIVE","PRIORITY DEBATER"]
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
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500 });
    }
    const body = await req.json() as {
      topic?: string; position?: string; context?: string; markdown?: string;
    };
    const topic = String(body.topic ?? "").slice(0, 1000).trim();
    const position = String(body.position ?? "").slice(0, 3000).trim();
    const context = String(body.context ?? "").slice(0, 4000).trim();
    const markdown = String(body.markdown ?? "").slice(0, 30000);
    if (!topic) {
      return new Response(JSON.stringify({ error: "topic required" }), { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.6,
      max_completion_tokens: 4500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(topic, position, context, markdown) },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = tryParseJson(raw);
    if (!parsed || typeof parsed !== "object") {
      return new Response(JSON.stringify({ error: "AI returned invalid JSON" }), { status: 502 });
    }
    return new Response(JSON.stringify(parsed as DashboardData), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
