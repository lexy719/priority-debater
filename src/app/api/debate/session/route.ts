/**
 * /api/debate/session
 * ─────────────────────────────────────────────────────────────────────────
 * Single OpenAI call. Returns a 5-round debate session tailored to the
 * user's validated idea:
 *
 *   {
 *     idea:     { title, oneLiner, stage },
 *     personas: [ { id, name, role, lens, accent, avatar, bio }, ... 5 ],
 *     rounds:   [ { personaId, challenge, flaw }, ... 5 ]
 *   }
 *
 * The five panel slots are FIXED (vera/marcus/anjali/leo/sam — same as the
 * static debateData.js so the UI roster stays consistent), but each
 * persona's `lens` and the `challenge` + `flaw` for their round are
 * regenerated from the idea so the questions actually matter.
 *
 * The client is expected to cache this in localStorage by idea so the
 * endpoint fires once per idea.
 * ─────────────────────────────────────────────────────────────────────────
 */

import OpenAI from "openai";

/* Fixed persona slots — keeps the UI roster + avatar colors consistent  */
const PANEL = [
  { id: "vera",    name: "Vera Klein",   role: "SKEPTICAL VC PARTNER", accent: "#ff3b30", avatar: "VK",
    defaultLens: "Distribution density, dilution math, second-logo risk.",
    bio: "12 yrs at Tier-1 fund. Killed more pitches than she funded." },
  { id: "marcus",  name: "Marcus Reed",  role: "VETERAN FOUNDER",      accent: "#ff8a00", avatar: "MR",
    defaultLens: "Survival paths, burn discipline, founder honesty.",
    bio: "3 hard-tech exits. Survived two down-rounds and a recall." },
  { id: "anjali",  name: "Anjali Rao",   role: "TECH ARCHITECT / CTO", accent: "#2f6bff", avatar: "AR",
    defaultLens: "Roadmap honesty, telemetry, what breaks under load.",
    bio: "Shipped fleet autonomy at scale. Doesn't believe in demos." },
  { id: "leo",     name: "Leo Costa",    role: "MARKETING GURU / CMO", accent: "#ffd60a", avatar: "LC",
    defaultLens: "Wedge, narrative, channel-fit and pricing tension.",
    bio: "Built two category leaders. Loves a clean naming wedge." },
  { id: "sam",     name: "Sam Okafor",   role: "VOICE OF THE CUSTOMER", accent: "#ff2d87", avatar: "SO",
    defaultLens: "Real urgency, switching cost, willingness-to-pay signals.",
    bio: "Ex-buyer at a Tier-1 logistics network. Signs the contracts." },
] as const;

type PanelSlot = (typeof PANEL)[number];

type RoundOut = { personaId: string; challenge: string; flaw: string };
type LensOverride = { id: string; lens: string };

type SessionResponse = {
  idea: { title: string; oneLiner: string; stage: string };
  personas: Array<Omit<PanelSlot, "defaultLens"> & { lens: string }>;
  rounds: RoundOut[];
};

function clamp(v: unknown, max: number): string {
  return String(v || "").slice(0, max).trim();
}

function fallbackSession(idea: string, stage: string): SessionResponse {
  return {
    idea: {
      title: idea || "Untitled idea",
      oneLiner: "A pre-seed concept undergoing adversarial review.",
      stage: stage || "Pre-seed",
    },
    personas: PANEL.map((p) => ({
      id: p.id, name: p.name, role: p.role, lens: p.defaultLens,
      accent: p.accent, avatar: p.avatar, bio: p.bio,
    })),
    rounds: PANEL.map((p) => ({
      personaId: p.id,
      challenge: defaultChallengeFor(p.id, idea),
      flaw: defaultFlawFor(p.id),
    })),
  };
}

function defaultChallengeFor(id: string, idea: string): string {
  const it = idea ? `"${idea}"` : "this idea";
  switch (id) {
    case "vera":   return `Show me the second logo for ${it}. One LOI is a press release. I want pipeline density before I write a check.`;
    case "marcus": return `Walk me through your kill criteria. What kills ${it} in the next 90 days, and how would you spot it before I do?`;
    case "anjali": return `Which part of ${it} breaks first under real load — and what's your evidence it won't?`;
    case "leo":    return `If I had to put ${it} on a billboard tomorrow, what's the one-line wedge? And why won't an incumbent copy it in a quarter?`;
    case "sam":    return `Find me one named buyer who'll pay full price for ${it} this quarter. Not a pilot. A contract.`;
    default:       return `What's the single biggest risk to ${it} in the next 12 months?`;
  }
}

function defaultFlawFor(id: string): string {
  switch (id) {
    case "vera":   return "Distribution risk is being hidden behind a single anchor account.";
    case "marcus": return "Kill criteria are vague — survival path isn't pre-committed.";
    case "anjali": return "Load assumptions are based on demos, not production telemetry.";
    case "leo":    return "Positioning is feature-led, not narrative-led — easily copied.";
    case "sam":    return "Willingness-to-pay is unproven at the named-buyer level.";
    default:       return "Largest risk isn't named, dated, or measurable.";
  }
}

function parseSessionResponse(raw: string, idea: string, stage: string): SessionResponse {
  const fb = fallbackSession(idea, stage);
  let parsed: any;
  try { parsed = JSON.parse(raw.replace(/^```json\s*|```$/g, "").trim()); }
  catch { return fb; }

  const overrides: Record<string, LensOverride> = {};
  if (Array.isArray(parsed?.personas)) {
    for (const p of parsed.personas) {
      const id = clamp(p?.id, 20);
      if (id && PANEL.find((x) => x.id === id)) {
        overrides[id] = { id, lens: clamp(p?.lens, 200) || PANEL.find((x) => x.id === id)!.defaultLens };
      }
    }
  }

  const roundsByPersona: Record<string, RoundOut> = {};
  if (Array.isArray(parsed?.rounds)) {
    for (const r of parsed.rounds) {
      const personaId = clamp(r?.personaId, 20);
      if (!personaId || !PANEL.find((x) => x.id === personaId)) continue;
      roundsByPersona[personaId] = {
        personaId,
        challenge: clamp(r?.challenge, 320) || defaultChallengeFor(personaId, idea),
        flaw:      clamp(r?.flaw, 160) || defaultFlawFor(personaId),
      };
    }
  }

  return {
    idea: {
      title:    clamp(parsed?.idea?.title, 220) || fb.idea.title,
      oneLiner: clamp(parsed?.idea?.oneLiner, 200) || fb.idea.oneLiner,
      stage:    clamp(parsed?.idea?.stage, 24) || fb.idea.stage,
    },
    personas: PANEL.map((p) => ({
      id: p.id, name: p.name, role: p.role, accent: p.accent, avatar: p.avatar, bio: p.bio,
      lens: overrides[p.id]?.lens || p.defaultLens,
    })),
    rounds: PANEL.map((p) => roundsByPersona[p.id] || {
      personaId: p.id,
      challenge: defaultChallengeFor(p.id, idea),
      flaw: defaultFlawFor(p.id),
    }),
  };
}

export async function POST(request: Request) {
  try {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) return Response.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });

    const body = (await request.json()) as { idea?: string; stage?: string };
    const idea = clamp(body.idea, 260);
    const stage = clamp(body.stage, 24) || "Pre-seed";
    if (!idea) return Response.json({ error: "Missing idea." }, { status: 400 });

    const openai = new OpenAI({ apiKey: key });

    const systemPrompt =
      "You are a panel of 5 adversarial debate personas reviewing an early-stage startup idea. Return strict JSON only. No markdown. No prose.";
    const userPrompt = `Idea under review: ${idea}
Funding stage: ${stage}

You will customise this fixed 5-person panel for THIS idea. The panel is:
- vera   (Skeptical VC partner)         — distribution, dilution, capital efficiency
- marcus (Veteran founder)              — survival paths, burn, founder honesty
- anjali (Tech architect / CTO)         — what breaks under load, roadmap honesty
- leo    (Marketing guru / CMO)         — wedge, narrative, channel-fit
- sam    (Voice of the customer)        — real urgency, switching cost, WTP

Return EXACTLY this JSON shape (no extra keys, no commentary):

{
  "idea": {
    "title": "the original idea text, lightly cleaned up (<=160 chars)",
    "oneLiner": "one short descriptor sentence (<=140 chars)",
    "stage": "pre-seed | seed | series-a (one of these)"
  },
  "personas": [
    {"id":"vera","lens":"1-line lens specific to this idea"},
    {"id":"marcus","lens":"..."},
    {"id":"anjali","lens":"..."},
    {"id":"leo","lens":"..."},
    {"id":"sam","lens":"..."}
  ],
  "rounds": [
    {"personaId":"vera",   "challenge":"...","flaw":"..."},
    {"personaId":"marcus", "challenge":"...","flaw":"..."},
    {"personaId":"anjali", "challenge":"...","flaw":"..."},
    {"personaId":"leo",    "challenge":"...","flaw":"..."},
    {"personaId":"sam",    "challenge":"...","flaw":"..."}
  ]
}

Rules:
- Each "challenge" is delivered in the persona's voice, in the first person, as a SHORT spoken sentence (<= 220 chars).
- Each "challenge" probes a real risk specific to the idea — name a number, a metric, a buyer or a failure mode whenever possible.
- Each "flaw" is the underlying weakness the challenge is probing (<= 120 chars).
- "lens" is the persona's angle on THIS idea (<= 140 chars). Reuse the lens family but tailor it.
- No markdown, no JSON comments, no surrounding text — JSON only.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.55,
      max_completion_tokens: 1400,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    return Response.json(parseSessionResponse(raw, idea, stage));
  } catch (e) {
    console.error("debate/session error:", e);
    return Response.json({ error: "Failed to generate debate session." }, { status: 500 });
  }
}
