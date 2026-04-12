import OpenAI from "openai";
import {
  CONTENT_POLICY_ERROR,
  isContentPolicyViolation,
  validateGuidedJourneyIdea,
} from "@/lib/contentModeration";
import type {
  BuildAssets,
  DebateRound,
  RealityCheck,
  TaggedIssue,
  Verdict,
  VerdictLabel,
} from "@/lib/journey-types";
import { ROUND_DEFINITIONS } from "@/lib/journey-types";

const MAX_IDEA = 800;

const TAGGED: TaggedIssue[] = [
  "Weak Assumption",
  "Market Risk",
  "Execution Risk",
  "Differentiation Gap",
];

function getClientId(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 2 * 60 * 1000;
const RATE_LIMIT_MAX = 30;

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);
  if (!entry) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (now > entry.resetAt) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

function clampScore(n: unknown): number {
  const x = typeof n === "number" ? n : Number(n);
  if (Number.isNaN(x)) return 50;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function normalizeTagged(raw: unknown): TaggedIssue {
  const s = typeof raw === "string" ? raw.trim() : "";
  const hit = TAGGED.find((t) => t.toLowerCase() === s.toLowerCase());
  if (hit) return hit;
  if (/market/i.test(s)) return "Market Risk";
  if (/execution|build|distribut/i.test(s)) return "Execution Risk";
  if (/different|feature|alternativ/i.test(s)) return "Differentiation Gap";
  return "Weak Assumption";
}

function normalizeVerdict(raw: unknown): VerdictLabel {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (s.includes("kill")) return "Kill";
  if (s.includes("pivot")) return "Pivot";
  if (s.includes("proceed")) return "Proceed";
  return "Pivot";
}

function sliceBullets(arr: unknown, min: number, max: number): string[] {
  if (!Array.isArray(arr)) return Array(min).fill("Insufficient structured output — re-run this step.") as string[];
  const out = arr.map((x) => (typeof x === "string" ? x.trim() : String(x))).filter(Boolean);
  while (out.length < min) out.push("—");
  return out.slice(0, max);
}

function mockRealityCheck(): RealityCheck {
  return {
    score: 62,
    summary:
      "There is plausible demand language, but you have not proven urgency, willingness to pay, or distribution. Treat this as an unvalidated hypothesis until you have 10 structured customer conversations with a defined ICP.",
  };
}

function mockRound(idx: number): DebateRound {
  const def = ROUND_DEFINITIONS[idx] ?? ROUND_DEFINITIONS[0];
  return {
    title: def.title,
    riskLevel: idx <= 1 ? "Medium" : "High",
    insights: [
      `Specific gap ${idx + 1}a: name who pays, by when, and what they switch from — avoid “everyone” language.`,
      `Specific gap ${idx + 1}b: cite one competitor or workflow substitute and why you win on a metric they care about.`,
      `Specific gap ${idx + 1}c: state the riskiest assumption and the cheapest experiment to falsify it.`,
    ].slice(0, 3),
    taggedIssue: idx === 0 ? "Weak Assumption" : idx === 1 ? "Differentiation Gap" : idx === 2 ? "Execution Risk" : "Market Risk",
    personaId: def.personaId as DebateRound["personaId"],
  };
}

function mockVerdict(): Verdict {
  return {
    finalScore: 58,
    verdict: "Pivot",
    reasoning: [
      "Pain is plausible but unsegmented: no ICP, no urgency signal, and no proof anyone will pay.",
      "Competitive alternatives are hand-waved; differentiation reads like a feature unless you own a workflow.",
      "Execution path is undefined: acquisition, build scope, and first milestone are not testable.",
    ],
    requiredFixes: [
      "Interview 10 buyers in one narrow segment; capture current spend, workaround cost, and buying triggers.",
      "Pick one wedge metric (time saved, compliance, or cost) and map 2 substitutes you beat on that metric alone.",
      "Ship a 2-week smoke test: landing + manual service or concierge MVP with a success criterion you can measure.",
    ],
  };
}

function mockBuild(): BuildAssets {
  return {
    landing: {
      hero: "Stop guessing if anyone will pay — prove demand in 10 conversations",
      valueBullets: [
        "Names the #1 objection: “this is a feature, not a product” — and answers it with a wedge workflow.",
        "Leads with the validated pain: time lost to manual workarounds, not buzzwords.",
        "Clear next step: book a 15-minute fit check, not “learn more.”",
      ],
      structure: ["Hero + objection", "Proof plan (10 interviews)", "Wedge vs substitutes", "CTA"],
      biggestObjectionAddressed: "That this is a nice-to-have feature buyers can ignore.",
      strongestPain: "Teams bleeding time/money on a workaround they already pay to tolerate.",
    },
    pitchDeck: {
      slides: ROUND_DEFINITIONS.map((r, i) => ({
        title: r.title.replace(/^Round \d+: /, ""),
        bullets: [`Focus: ${r.focus}`, `What we must prove in this section`],
      })),
    },
    launchStatement: "Ship a one-page offer and 10 buyer calls this week — that is a launch you can actually execute.",
  };
}

const ANALYTICAL_SYSTEM = `You are a senior venture analyst running a STRUCTURED AUDIT — not a chatbot.
Rules:
- Be brutally direct. Challenge assumptions. Do not flatter. Never say "great idea" without evidence.
- Be specific to THIS idea; ban generic platitudes ("validate the market", "talk to customers" without who/when/how).
- Output MUST follow the JSON schema exactly. No markdown. No extra keys.`;

export async function POST(request: Request) {
  try {
    const clientId = getClientId(request);
    if (!checkRateLimit(clientId)) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a minute and try again." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI engine is not configured. Please contact support." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = (await request.json()) as {
      action: "reality-check" | "debate-round" | "verdict" | "build-assets";
      idea: string;
      roundIndex?: number;
      rounds?: DebateRound[];
      realityCheck?: RealityCheck | null;
      verdict?: Verdict | null;
    };

    const idea = String(body.idea ?? "")
      .slice(0, MAX_IDEA)
      .trim();
    if (!idea) {
      return new Response(JSON.stringify({ error: "Missing idea." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (isContentPolicyViolation(idea)) {
      return new Response(JSON.stringify({ error: CONTENT_POLICY_ERROR }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const quality = validateGuidedJourneyIdea(idea);
    if (quality) {
      return new Response(JSON.stringify({ error: quality }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (process.env.TEST_MODE === "true" && process.env.NODE_ENV === "development") {
      if (body.action === "reality-check") {
        return new Response(JSON.stringify({ ok: true, data: mockRealityCheck() }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      if (body.action === "debate-round" && typeof body.roundIndex === "number") {
        return new Response(JSON.stringify({ ok: true, data: mockRound(body.roundIndex) }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      if (body.action === "verdict") {
        return new Response(JSON.stringify({ ok: true, data: mockVerdict() }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      if (body.action === "build-assets") {
        return new Response(JSON.stringify({ ok: true, data: mockBuild() }), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    if (body.action === "reality-check") {
      const user = `Startup idea (one sentence):\n"${idea}"\n\nReturn JSON only:\n{"score": number from 0-100, "summary": string containing EXACTLY two sentences separated by a space. Sentence 1: hardest viability critique. Sentence 2: what must be proven next.}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: ANALYTICAL_SYSTEM },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.35,
        max_completion_tokens: 600,
      });
      const text = completion.choices[0]?.message?.content?.trim() || "{}";
      let parsed: { score?: unknown; summary?: unknown };
      try {
        parsed = JSON.parse(text) as { score?: unknown; summary?: unknown };
      } catch {
        return new Response(JSON.stringify({ error: "Failed to parse reality check." }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      const summary =
        typeof parsed.summary === "string"
          ? parsed.summary.trim()
          : "Viability is unproven at this stage; you must replace assertions with evidence before building.";
      const sentences = summary.split(/(?<=[.!?])\s+/).filter(Boolean);
      const fixedSummary =
        sentences.length >= 2 ? `${sentences[0]} ${sentences[1]}` : `${summary} Next: run a narrow buyer test with a clear success metric.`;

      const data: RealityCheck = {
        score: clampScore(parsed.score),
        summary: fixedSummary.slice(0, 500),
      };
      return new Response(JSON.stringify({ ok: true, data }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (body.action === "debate-round") {
      const roundIndex = body.roundIndex;
      if (typeof roundIndex !== "number" || roundIndex < 0 || roundIndex > 3) {
        return new Response(JSON.stringify({ error: "roundIndex must be 0–3." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const def = ROUND_DEFINITIONS[roundIndex];
      const prior =
        Array.isArray(body.rounds) && body.rounds.length > 0
          ? `\nPrior rounds (JSON excerpts):\n${JSON.stringify(
              body.rounds.map((r) => ({
                title: r.title,
                risk: r.riskLevel,
                tag: r.taggedIssue,
              })),
            )}`
          : "";

      const fiveLensNote =
        roundIndex === 3
          ? "\nYou must internally weigh five analytical lenses (Adversary, Investor, Customer, Operator, Competitor) and compress into this single structured round — still output one JSON object only.\n"
          : "";

      const user = `Idea:\n"${idea}"\n\nMandatory evaluation round:\nTitle: ${def.title}\nPrimary analytical lens: ${def.personaId}\nFocus question: ${def.focus}\n${fiveLensNote}${prior}\n\nReturn JSON only:\n{"title": "${def.title}", "riskLevel": "Low" | "Medium" | "High", "insights": [2-3 short bullet strings, sharp and specific to THIS idea], "taggedIssue": one of ${JSON.stringify(TAGGED)}, "personaId": "${def.personaId}"}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: ANALYTICAL_SYSTEM },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_completion_tokens: 900,
      });
      const text = completion.choices[0]?.message?.content?.trim() || "{}";
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(text) as Record<string, unknown>;
      } catch {
        return new Response(JSON.stringify({ error: "Failed to parse debate round." }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      const insightsRaw = parsed.insights;
      const insightsArr = Array.isArray(insightsRaw)
        ? insightsRaw.map((x) => (typeof x === "string" ? x.trim() : String(x))).filter(Boolean)
        : [];
      const insights = insightsArr.slice(0, 3);
      while (insights.length < 2) insights.push("Name one concrete fact you still need to gather this week.");

      const risk = typeof parsed.riskLevel === "string" && ["Low", "Medium", "High"].includes(parsed.riskLevel) ? parsed.riskLevel : "Medium";

      const round: DebateRound = {
        title: def.title,
        riskLevel: risk as DebateRound["riskLevel"],
        insights: insights.slice(0, 3),
        taggedIssue: normalizeTagged(parsed.taggedIssue),
        personaId: def.personaId,
      };
      return new Response(JSON.stringify({ ok: true, data: round }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (body.action === "verdict") {
      const rounds = Array.isArray(body.rounds) ? body.rounds : [];
      if (rounds.length < 4) {
        return new Response(JSON.stringify({ error: "Complete all four rounds before requesting a verdict." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const user = `Idea:\n"${idea}"\n\nCompleted structured rounds:\n${JSON.stringify(rounds)}\n\nReturn JSON only:\n{"finalScore": number 0-100, "verdict": "Kill" | "Pivot" | "Proceed", "reasoning": [exactly 3 strings, sharp], "requiredFixes": [exactly 3 strings, concrete actions with a measurable criterion where possible]}\n\nVerdict rubric:\n- Kill: fundamental flaw, unethical, or no believable path with stated constraints.\n- Pivot: promising kernel but wrong segment, positioning, or scope.\n- Proceed: clear buyer, credible wedge, and falsifiable plan — still list risks.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: ANALYTICAL_SYSTEM },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.35,
        max_completion_tokens: 900,
      });
      const text = completion.choices[0]?.message?.content?.trim() || "{}";
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(text) as Record<string, unknown>;
      } catch {
        return new Response(JSON.stringify({ error: "Failed to parse verdict." }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      const verdict: Verdict = {
        finalScore: clampScore(parsed.finalScore),
        verdict: normalizeVerdict(parsed.verdict),
        reasoning: sliceBullets(parsed.reasoning, 3, 3),
        requiredFixes: sliceBullets(parsed.requiredFixes, 3, 3),
      };

      return new Response(JSON.stringify({ ok: true, data: verdict }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (body.action === "build-assets") {
      const rounds = Array.isArray(body.rounds) ? body.rounds : [];
      const v = body.verdict ?? null;
      if (!v || rounds.length < 4) {
        return new Response(JSON.stringify({ error: "Missing verdict or rounds for asset generation." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (v.verdict === "Kill") {
        return new Response(JSON.stringify({ error: "Build assets are only available when the verdict is Proceed or Pivot." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const rc = body.realityCheck;
      const user = `Idea:\n"${idea}"\n\nReality check score: ${rc && typeof rc.score === "number" ? rc.score : "n/a"}\n\nStructured rounds:\n${JSON.stringify(rounds)}\n\nFinal verdict JSON:\n${JSON.stringify(v)}\n\nReturn JSON only with this shape:\n{"landing": {"hero": string, "valueBullets": [3 strings], "structure": [3-5 short section titles], "biggestObjectionAddressed": string, "strongestPain": string}, "pitchDeck": {"slides": [{"title": string, "bullets": [2-3 strings]}] }, "launchStatement": string}\n\nRequirements:\n- Landing copy must confront the biggest objection found in the rounds (name it).\n- Highlight the strongest validated pain from the rounds (specific).\n- Pitch slides must map to the four rounds: Problem Reality, Competition & Alternatives, Execution Risk, Blind Spots (use those themes in order).\n- launchStatement: one sentence, pragmatic, about shipping a test in ~10 minutes of focused work (not hype).`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: ANALYTICAL_SYSTEM },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.45,
        max_completion_tokens: 2500,
      });
      const text = completion.choices[0]?.message?.content?.trim() || "{}";
      let parsed: unknown;
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        return new Response(JSON.stringify({ error: "Failed to parse build assets." }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      const p = parsed as Record<string, unknown>;
      const landing = p.landing && typeof p.landing === "object" ? (p.landing as Record<string, unknown>) : {};
      const pitchDeck = p.pitchDeck && typeof p.pitchDeck === "object" ? (p.pitchDeck as Record<string, unknown>) : {};

      const assets: BuildAssets = {
        landing: {
          hero: typeof landing.hero === "string" ? landing.hero : "Prove the pain before you polish the product.",
          valueBullets: sliceBullets(landing.valueBullets, 3, 3),
          structure: Array.isArray(landing.structure)
            ? (landing.structure as unknown[]).map((x) => String(x)).slice(0, 6)
            : ["Hero", "Objection", "Proof", "Offer", "CTA"],
          biggestObjectionAddressed:
            typeof landing.biggestObjectionAddressed === "string"
              ? landing.biggestObjectionAddressed
              : "Why switch from the status quo?",
          strongestPain: typeof landing.strongestPain === "string" ? landing.strongestPain : "Unquantified pain and urgency.",
        },
        pitchDeck: {
          slides: Array.isArray(pitchDeck.slides)
            ? (pitchDeck.slides as unknown[]).map((s) => {
                const o = s && typeof s === "object" ? (s as Record<string, unknown>) : {};
                return {
                  title: typeof o.title === "string" ? o.title : "Slide",
                  bullets: sliceBullets(o.bullets, 2, 3),
                };
              })
            : ROUND_DEFINITIONS.map((r) => ({
                title: r.title,
                bullets: [r.focus, "What we prove on this slide"],
              })),
        },
        launchStatement:
          typeof p.launchStatement === "string"
            ? p.launchStatement.slice(0, 400)
            : "Publish a one-paragraph offer and message five precise buyers today.",
      };

      return new Response(JSON.stringify({ ok: true, data: assets }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("guided-journey error:", e);
    return new Response(JSON.stringify({ error: "Request failed. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
