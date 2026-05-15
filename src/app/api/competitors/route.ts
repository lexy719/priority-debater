import OpenAI from "openai";

type Setup = {
  topic?: string;
  position?: string;
  context?: string;
};

type CompetitorBlueprint = {
  executive: {
    landscape: string;
    wedge: string;
    biggestThreat: string;
    biggestOpportunity: string;
    nextValidation: string;
    marketDensity: "open" | "moderate" | "crowded";
  };
  marketMap: {
    direct: string[];
    indirect: string[];
    incumbents: string[];
  };
  players: Array<{
    name: string;
    type: "direct" | "indirect" | "incumbent";
    positioning: string;
    pricingSignal: string;
    strength: string;
    weakness: string;
    threatLevel: number;
    switchingRisk: string;
    howWeWin: string;
  }>;
  matrix: Array<{
    dimension: string;
    ourClaim: string;
    competitorReality: string;
    gapAction: string;
  }>;
  winLoss: Array<{
    scenario: "win" | "loss";
    trigger: string;
    playbook: string;
  }>;
  intelligenceTasks: Array<{
    task: string;
    source: string;
    timebox: string;
    signal: string;
  }>;
  ninetyDayPlan: string[];
};

function clean(value: unknown, max: number): string {
  return String(value || "").slice(0, max).trim();
}

function defaultBlueprint(topic: string): CompetitorBlueprint {
  return {
    executive: {
      landscape: `The market around "${topic}" has active alternatives and strong inertia from incumbent workflows.`,
      wedge: "Win by being measurably faster to value and simpler to adopt.",
      biggestThreat: "Incumbent bundling can erase superficial feature differentiation.",
      biggestOpportunity: "A focused wedge for one buyer segment before broad expansion.",
      nextValidation: "Interview 10 recent buyers and quantify the top switching blocker.",
      marketDensity: "moderate",
    },
    marketMap: {
      direct: ["Specialized startup in same category", "Feature-adjacent niche tool"],
      indirect: ["Manual spreadsheet workflow", "Agency or consultant workaround"],
      incumbents: ["Platform suite likely to bundle adjacent capability"],
    },
    players: [
      {
        name: "Specialized startup",
        type: "direct",
        positioning: "Focused product for the same primary job-to-be-done.",
        pricingSignal: "Mid-market monthly subscription.",
        strength: "Sharp feature depth for one user type.",
        weakness: "Narrow use-case and weaker distribution.",
        threatLevel: 7,
        switchingRisk: "Medium",
        howWeWin: "Own speed-to-value and clearer onboarding metrics.",
      },
      {
        name: "Manual workflow",
        type: "indirect",
        positioning: "Good-enough process with zero new tooling.",
        pricingSignal: "Looks free but high hidden time cost.",
        strength: "No procurement friction.",
        weakness: "Poor consistency and limited scale.",
        threatLevel: 6,
        switchingRisk: "High",
        howWeWin: "Prove 3x productivity gain within first week.",
      },
    ],
    matrix: [
      {
        dimension: "Time to first value",
        ourClaim: "Fast onboarding and immediate output",
        competitorReality: "Long setup and learning curve",
        gapAction: "Create a guided trial path with metric proof in 10 minutes",
      },
      {
        dimension: "Buyer trust",
        ourClaim: "Transparent outcomes and clear guardrails",
        competitorReality: "Vague ROI claims",
        gapAction: "Publish benchmark case studies with hard numbers",
      },
    ],
    winLoss: [
      {
        scenario: "win",
        trigger: "Buyer has urgent pain and a clear owner for the problem.",
        playbook: "Lead with quantified outcome and low-risk pilot offer.",
      },
      {
        scenario: "loss",
        trigger: "Procurement prefers bundled incumbent contracts.",
        playbook: "Position as wedge integration, then land-and-expand.",
      },
    ],
    intelligenceTasks: [
      {
        task: "Track pricing and packaging shifts monthly",
        source: "Competitor pricing pages + changelog",
        timebox: "2h/week",
        signal: "New tiers, feature gates, free plan limits",
      },
      {
        task: "Mine win/loss language from public reviews",
        source: "G2, Reddit, LinkedIn comments",
        timebox: "3h/week",
        signal: "Repeated complaints and switching triggers",
      },
    ],
    ninetyDayPlan: [
      "Week 1-2: build competitor dossier and objection map.",
      "Week 3-6: run 10 buyer interviews focused on switching friction.",
      "Week 7-10: ship wedge messaging and pilot offer experiments.",
      "Week 11-12: review outcomes, double down on highest-conversion segment.",
    ],
  };
}

function parseBlueprint(raw: string, topic: string): CompetitorBlueprint {
  const fallback = defaultBlueprint(topic);
  const cleaned = raw.replace(/^```json\s*|```$/g, "").trim();
  const parsed = JSON.parse(cleaned) as Partial<CompetitorBlueprint>;

  const str = (v: unknown, d: string) => (typeof v === "string" && v.trim() ? v.trim() : d);
  const list = (v: unknown, d: string[]) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 8) : d;
  const density = parsed.executive?.marketDensity;
  const marketDensity: "open" | "moderate" | "crowded" =
    density === "open" || density === "moderate" || density === "crowded"
      ? density
      : fallback.executive.marketDensity;

  return {
    executive: {
      landscape: str(parsed.executive?.landscape, fallback.executive.landscape),
      wedge: str(parsed.executive?.wedge, fallback.executive.wedge),
      biggestThreat: str(parsed.executive?.biggestThreat, fallback.executive.biggestThreat),
      biggestOpportunity: str(parsed.executive?.biggestOpportunity, fallback.executive.biggestOpportunity),
      nextValidation: str(parsed.executive?.nextValidation, fallback.executive.nextValidation),
      marketDensity,
    },
    marketMap: {
      direct: list(parsed.marketMap?.direct, fallback.marketMap.direct),
      indirect: list(parsed.marketMap?.indirect, fallback.marketMap.indirect),
      incumbents: list(parsed.marketMap?.incumbents, fallback.marketMap.incumbents),
    },
    players: Array.isArray(parsed.players) && parsed.players.length > 0
      ? parsed.players.slice(0, 8).map((p, i) => {
          const type = p?.type;
          const safeType: "direct" | "indirect" | "incumbent" =
            type === "direct" || type === "indirect" || type === "incumbent" ? type : "direct";
          const rawThreat = Number(p?.threatLevel);
          return {
            name: str(p?.name, fallback.players[0]?.name ?? `Player ${i + 1}`),
            type: safeType,
            positioning: str(p?.positioning, "No positioning captured."),
            pricingSignal: str(p?.pricingSignal, "Pricing unknown"),
            strength: str(p?.strength, "Unknown"),
            weakness: str(p?.weakness, "Unknown"),
            threatLevel: Number.isFinite(rawThreat) ? Math.max(1, Math.min(10, Math.round(rawThreat))) : 5,
            switchingRisk: str(p?.switchingRisk, "Medium"),
            howWeWin: str(p?.howWeWin, "Define a sharper wedge."),
          };
        })
      : fallback.players,
    matrix: Array.isArray(parsed.matrix) && parsed.matrix.length > 0
      ? parsed.matrix.slice(0, 8).map((m) => ({
          dimension: str(m?.dimension, "Dimension"),
          ourClaim: str(m?.ourClaim, "Our claim"),
          competitorReality: str(m?.competitorReality, "Competitor reality"),
          gapAction: str(m?.gapAction, "Action"),
        }))
      : fallback.matrix,
    winLoss: Array.isArray(parsed.winLoss) && parsed.winLoss.length > 0
      ? parsed.winLoss.slice(0, 8).map((w, i) => ({
          scenario: w?.scenario === "loss" ? "loss" : "win",
          trigger: str(w?.trigger, fallback.winLoss[i]?.trigger ?? "Trigger"),
          playbook: str(w?.playbook, fallback.winLoss[i]?.playbook ?? "Playbook"),
        }))
      : fallback.winLoss,
    intelligenceTasks: Array.isArray(parsed.intelligenceTasks) && parsed.intelligenceTasks.length > 0
      ? parsed.intelligenceTasks.slice(0, 12).map((t) => ({
          task: str(t?.task, "Task"),
          source: str(t?.source, "Source"),
          timebox: str(t?.timebox, "2h"),
          signal: str(t?.signal, "Signal"),
        }))
      : fallback.intelligenceTasks,
    ninetyDayPlan: list(parsed.ninetyDayPlan, fallback.ninetyDayPlan),
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
    };
    const setup = body.setup ?? {};
    const topic = clean(setup.topic, 240);
    const position = clean(setup.position, 1400);
    const context = clean(setup.context, 1400);
    const validation = clean(body.validationContent, 8000);
    if (!topic) return Response.json({ error: "Topic is required." }, { status: 400 });

    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an investor-grade competitive strategist. Return strict JSON only, no markdown.",
        },
        {
          role: "user",
          content: `Create a practical competitor blueprint for this startup.

Startup idea: ${topic}
Founder reasoning: ${position || "N/A"}
Context: ${context || "N/A"}
Validation report context: ${validation || "N/A"}

Return exactly this JSON shape:
{
  "executive": {
    "landscape": "string",
    "wedge": "string",
    "biggestThreat": "string",
    "biggestOpportunity": "string",
    "nextValidation": "string",
    "marketDensity": "open|moderate|crowded"
  },
  "marketMap": {
    "direct": ["string"],
    "indirect": ["string"],
    "incumbents": ["string"]
  },
  "players": [
    {
      "name": "string",
      "type": "direct|indirect|incumbent",
      "positioning": "string",
      "pricingSignal": "string",
      "strength": "string",
      "weakness": "string",
      "threatLevel": 1,
      "switchingRisk": "string",
      "howWeWin": "string"
    }
  ],
  "matrix": [
    {
      "dimension": "string",
      "ourClaim": "string",
      "competitorReality": "string",
      "gapAction": "string"
    }
  ],
  "winLoss": [
    {
      "scenario": "win|loss",
      "trigger": "string",
      "playbook": "string"
    }
  ],
  "intelligenceTasks": [
    {
      "task": "string",
      "source": "string",
      "timebox": "string",
      "signal": "string"
    }
  ],
  "ninetyDayPlan": ["string"]
}

Rules:
- Prefer real competitors when plausible; otherwise explicit archetypes.
- Keep actions specific and testable.
- threatLevel must be integer 1-10.
- Do not output commentary. JSON only.`,
        },
      ],
      temperature: 0.35,
      max_completion_tokens: 2600,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    const blueprint = parseBlueprint(raw, topic);
    return Response.json(blueprint);
  } catch (error) {
    console.error("competitors route error:", error);
    return Response.json({ error: "Failed to generate competitor blueprint." }, { status: 500 });
  }
}

