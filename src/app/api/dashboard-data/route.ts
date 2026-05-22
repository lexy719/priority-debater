import OpenAI from "openai";
import type { DashboardData } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// ─── Rubric: 6 weighted dimensions. Weights MUST sum to 100. ──────────────
const RUBRIC = [
    { key: "problemSolutionFit", label: "Problem Severity", weight: 20 },
    { key: "marketOpportunity",  label: "Market Size",   weight: 15 },
    { key: "competitiveEdge",    label: "Competitive Advantage / Moat", weight: 15 },
    { key: "businessModel",      label: "Monetization Potential",       weight: 15 },
    { key: "timingTrends",       label: "Distribution + Innovation Signal",      weight: 20 },
    { key: "teamExecution",      label: "Execution Feasibility", weight: 15 },
] as const;
type RubricKey = (typeof RUBRIC)[number]["key"];

const RUBRIC_ANCHORS: Record<RubricKey, string> = {
    problemSolutionFit:
        "0=no real pain, founder solution looking for problem · 25=pain exists but rare/tolerable · 50=clear pain, weak evidence of urgency · 75=acute frequent pain, target buyer can articulate it · 100=hair-on-fire pain, customers paying for inferior workarounds today",
    marketOpportunity:
        "0=TAM <$100M and niche shrinking · 25=TAM <$500M, fragmented · 50=TAM $0.5-2B, growth flat · 75=TAM $2-10B, growing >15% CAGR · 100=TAM >$10B with >25% CAGR or category creation",
    competitiveEdge:
        "0=zero differentiation, dominant incumbents · 25=cheaper-or-better but easy to copy · 50=2-3 incumbents, our edge is positioning · 75=defensible moat (data, network, regulatory, distribution) · 100=structural unfair advantage compounding over time",
    businessModel:
        "0=no realistic path to revenue · 25=transactional, low LTV, high CAC · 50=SaaS with weak retention OR services scaling linearly · 75=recurring revenue with expansion mechanics · 100=high LTV/CAC, embedded expansion, software margins",
    timingTrends:
        "0=tailwind already passed or never existed · 25=neutral, slow steady · 50=mild tailwind from one trend · 75=2+ converging tailwinds making this possible NOW · 100=once-in-a-decade enabling shift (regulatory, tech, behavioral)",
    teamExecution:
        "0=zero founder context, no domain · 25=hobbyist or first-time, no signal · 50=adjacent experience, learning the domain · 75=domain expert, prior shipping experience · 100=repeat founder or world-class expert in this exact space",
};

// ─── Score → verdict band (deterministic, NOT trusted from AI) ────────────
function scoreToVerdict(score: number): "GO" | "CAUTION" | "NO-GO" {
    if (score >= 70) return "GO";
    if (score >= 45) return "CAUTION";
    return "NO-GO";
}

function scoreToConfidence(score: number, spread: number): { label: "HIGH" | "MED" | "LOW"; pct: number } {
    // Confidence = how tight the rubric scores cluster + how extreme the overall is.
    const extremity = Math.abs(score - 50) / 50; // 0..1
    const clustering = Math.max(0, 1 - spread / 50); // tight = high confidence
    const pct = Math.round(40 + (extremity * 0.5 + clustering * 0.5) * 55); // 40..95
    const label: "HIGH" | "MED" | "LOW" = pct >= 75 ? "HIGH" : pct >= 55 ? "MED" : "LOW";
    return { label, pct };
}

function rankFromScore(score: number): string {
    if (score >= 88) return "Top 5%";
    if (score >= 80) return "Top 12%";
    if (score >= 72) return "Top 22%";
    if (score >= 62) return "Top 35%";
    if (score >= 50) return "Top 50%";
    if (score >= 35) return "Bottom 40%";
    return "Bottom 20%";
}

// ─── Prompt ───────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a senior startup idea scoring engine using the emergent v2 rubric adapted into six dashboard rows.

CRITICAL RULES:
- Output ONLY valid JSON. No markdown, no commentary.
- For EACH rubric dimension you MUST: (a) pick an integer score 0-100 anchored to the rubric, (b) give a ≤18-word justification grounded in THIS idea's specifics.
- Do not anchor on "most ideas land 35-62"; that old rule is retired.
- Do not punish missing founder/team context. teamExecution means Execution Feasibility, not founder biography.
- Weak moat should not nuke the whole score. If no moat is stated, competitiveEdge can still score up to 60.
- Score strong ambitious ideas as strong while still reflecting execution difficulty in risks.
- Every other field (market sizing, competitors, audience, personas, risks) MUST be internally consistent with your rubric scores — if you scored marketOpportunity 30, do NOT claim TAM is $50B.`;

function buildUserPrompt(idea: string, position: string, context: string, markdown: string): string {
    const rubricBlock = RUBRIC.map(
        (r) => `  - "${r.key}" (${r.label}, weight ${r.weight}%) → anchors: ${RUBRIC_ANCHORS[r.key]}`,
    ).join("\n");

    return `Score this startup idea against the rubric, then produce a dashboard payload INTERNALLY CONSISTENT with those scores.

IDEA: ${idea}
${position ? `\nFOUNDER REASONING: ${position}` : "\nFOUNDER REASONING: (not provided - keep founder context neutral; score execution feasibility from the idea)"}
${context ? `\nCONTEXT: ${context}` : ""}

VALIDATION REPORT (additional grounding):
${(markdown || "").slice(0, 12000) || "(no prior report)"}

RUBRIC:
${rubricBlock}

Return JSON matching this schema exactly. Replace ALL values with idea-specific data:
{
  "rubric": {
    "problemSolutionFit": { "score": <int 0-100>, "reason": "<≤18 words, specific>" },
    "marketOpportunity":  { "score": <int>, "reason": "<>" },
    "competitiveEdge":    { "score": <int>, "reason": "<>" },
    "businessModel":      { "score": <int>, "reason": "<>" },
    "timingTrends":       { "score": <int>, "reason": "<>" },
    "teamExecution":      { "score": <int>, "reason": "<>" }
  },
  "oneLineThesis": "<one sharp sentence specific to this idea>",
  "scoreHeroBlurb": "<2 sentences explaining the read — reference the strongest and weakest dimension by name>",
  "rankLabel": "<your gut rank, e.g. 'Top 30%' — code will override if it disagrees>",
  "market": {
    "tam": "<$XB — must match marketOpportunity score>",
    "sam": "<$XM>",
    "som": "<$XM>",
    "cagrPct": <int — must match marketOpportunity>,
    "intro": "<2-3 sentences on market timing/drivers/headwinds>",
    "growth": [
      {"year":"Y1","tam":<num B>,"sam":<num M>,"som":<num M>},
      {"year":"Y2","tam":<num>,"sam":<num>,"som":<num>},
      {"year":"Y3","tam":<num>,"sam":<num>,"som":<num>},
      {"year":"Y4","tam":<num>,"sam":<num>,"som":<num>},
      {"year":"Y5","tam":<num>,"sam":<num>,"som":<num>}
    ],
    "signals": [
      {"tag":"MARKET","label":"<idea-specific>","weight":"<+N pts or -N pts>"},
      {"tag":"TIMING","label":"<>","weight":"<>"},
      {"tag":"REGULATORY","label":"<>","weight":"<>"},
      {"tag":"TECH","label":"<>","weight":"<>"}
    ]
  },
  "risk": {
    "intro": "<one sentence on where it breaks for THIS idea>",
    "breakdown": [
      {"category":"MARKET","severity":"HIGH"|"MED"|"LOW","title":"<specific>","mitigation":"<specific>"},
      {"category":"EXECUTION","severity":"<>","title":"<>","mitigation":"<>"},
      {"category":"COMPETITION","severity":"<>","title":"<>","mitigation":"<>"},
      {"category":"MODEL","severity":"<>","title":"<>","mitigation":"<>"}
    ]
  },
  "competition": {
    "intro": "<2 sentences on landscape — must match competitiveEdge score>",
    "competitors": [
      {"name":"<real or archetype>","focus":"<>","price":"<>","traction":<int 0-100>,"weakness":"<>","url":""},
      {"name":"<>","focus":"<>","price":"<>","traction":<int>,"weakness":"<>","url":""},
      {"name":"<>","focus":"<>","price":"<>","traction":<int>,"weakness":"<>","url":""},
      {"name":"<>","focus":"<>","price":"<>","traction":<int>,"weakness":"<>","url":""}
    ],
    "scatter": [
      {"x":<int 0-100 price>,"y":<int 0-100 traction>,"name":"YOU","you":true},
      {"x":<int>,"y":<int>,"name":"<>"},
      {"x":<int>,"y":<int>,"name":"<>"},
      {"x":<int>,"y":<int>,"name":"<>"},
      {"x":<int>,"y":<int>,"name":"<>"}
    ]
  },
  "revenue": {
    "headline": "<e.g. '€4.8M' or 'PRE-REVENUE'>",
    "narrative": "<2-3 sentences — must match businessModel score>",
    "projection": [
      {"year":"Y1","total":<num M>,"base":<num>,"expansion":<num>},
      {"year":"Y2","total":<num>,"base":<num>,"expansion":<num>},
      {"year":"Y3","total":<num>,"base":<num>,"expansion":<num>},
      {"year":"Y4","total":<num>,"base":<num>,"expansion":<num>},
      {"year":"Y5","total":<num>,"base":<num>,"expansion":<num>}
    ],
    "pricingModels": [
      {"plan":"STARTER","price":"<>","terms":"<>"},
      {"plan":"GROWTH","price":"<>","terms":"<>"},
      {"plan":"ENTERPRISE","price":"<>","terms":"<>"}
    ]
  },
  "audience": {
    "intro": "<2 sentences on buyer specific to THIS idea>",
    "segments": [
      {"name":"<primary ICP>","value":<int>,"color":"#7dd3fc"},
      {"name":"<secondary>","value":<int>,"color":"#ff8a00"},
      {"name":"<tertiary>","value":<int>,"color":"#2f6bff"},
      {"name":"<niche>","value":<int>,"color":"#ffd60a"}
    ],
    "personas": [
      {"title":"<role>","org":"<>","budget":"<>","pain":"<>","why":"<>"},
      {"title":"<>","org":"<>","budget":"<>","pain":"<>","why":"<>"},
      {"title":"<>","org":"<>","budget":"<>","pain":"<>","why":"<>"}
    ]
  },
  "swot": {
    "strengths": ["<idea-specific>","<>","<>","<>"],
    "weaknesses": ["<>","<>","<>"],
    "opportunities": ["<>","<>","<>","<>"],
    "threats": ["<>","<>","<>"]
  },
  "recommendations": [
    {"priority":"P0","title":"<concrete>","impact":"<>","horizon":"2w","tags":["VALIDATION"]},
    {"priority":"P0","title":"<>","impact":"<>","horizon":"3w","tags":["GTM"]},
    {"priority":"P1","title":"<>","impact":"<>","horizon":"4w","tags":["PRODUCT"]},
    {"priority":"P1","title":"<>","impact":"<>","horizon":"6w","tags":["GROWTH"]},
    {"priority":"P2","title":"<>","impact":"<>","horizon":"8w","tags":["HIRING"]}
  ],
  "personas": [
    {"name":"The Investor","role":"VC","accent":"#ff3b30","quote":"<in voice, specific to THIS idea>"},
    {"name":"The Customer","role":"BUYER","accent":"#ff8a00","quote":"<>"},
    {"name":"The Operator","role":"COO","accent":"#2f6bff","quote":"<>"},
    {"name":"The Mentor","role":"3X FOUNDER","accent":"#ffd60a","quote":"<>"},
    {"name":"The Adversary","role":"SKEPTIC","accent":"#ff2d87","quote":"<>"}
  ]
}

Return JSON only.`;
}

function tryParseJson(raw: string): unknown {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    try { return JSON.parse(cleaned); } catch {
        const s = cleaned.indexOf("{"); const e = cleaned.lastIndexOf("}");
        if (s >= 0 && e > s) { try { return JSON.parse(cleaned.slice(s, e + 1)); } catch { return null; } }
        return null;
    }
}

const clampInt = (n: unknown, lo: number, hi: number, fallback: number): number => {
    const v = typeof n === "number" ? n : parseFloat(String(n));
    if (!Number.isFinite(v)) return fallback;
    return Math.max(lo, Math.min(hi, Math.round(v)));
};
const safeStr = (s: unknown, fb = ""): string => (typeof s === "string" && s.trim() ? s.trim() : fb);

// ─── Build the canonical DashboardData from rubric + AI sections ──────────
type AiResp = Record<string, unknown> & {
    rubric?: Partial<Record<RubricKey, { score?: number; reason?: string }>>;
};

function assembleDashboard(raw: AiResp): DashboardData {
    // 1. Pull rubric scores + reasons.
    const cats: Record<RubricKey, { score: number; reason: string }> = {} as never;
    for (const r of RUBRIC) {
        const got = raw.rubric?.[r.key] ?? {};
        cats[r.key] = {
            score: clampInt(got.score, 0, 100, 50),
            reason: safeStr(got.reason, "—").slice(0, 140),
        };
    }

    // 2. Compute overall as DETERMINISTIC weighted sum.
    const overall = Math.round(
        RUBRIC.reduce((sum, r) => sum + cats[r.key].score * r.weight, 0) / 100,
    );

    // 3. Verdict + confidence derived from overall + spread.
    const scores = RUBRIC.map((r) => cats[r.key].score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const spread = Math.sqrt(scores.reduce((s, v) => s + (v - mean) ** 2, 0) / scores.length);
    const verdict = scoreToVerdict(overall);
    const conf = scoreToConfidence(overall, spread);

    // 4. Persona scores: AI gives quotes; we assign scores so they cluster within ±10 of overall
    //    but each persona varies slightly by archetype bias.
    const personaBias: Record<string, number> = {
        "The Investor": -2,        // tougher
        "The Customer": +1,
        "The Operator": -1,
        "The Mentor": +2,          // encouraging
        "The Adversary": -8,       // skeptical
    };
    type PRaw = { name?: string; role?: string; accent?: string; quote?: string };
    const personasRaw = Array.isArray(raw.personas) ? (raw.personas as PRaw[]) : [];
    const personaVerdicts = personasRaw.slice(0, 5).map((p, i) => {
        const name = safeStr(p?.name, ["The Investor","The Customer","The Operator","The Mentor","The Adversary"][i]);
        const bias = personaBias[name] ?? 0;
        const pScore = Math.max(0, Math.min(100, overall + bias + (i % 2 ? -2 : 2)));
        const pVerdict = scoreToVerdict(pScore);
        return {
            name,
            role: safeStr(p?.role, ["VC","BUYER","COO","3X FOUNDER","SKEPTIC"][i]).toUpperCase(),
            accent: safeStr(p?.accent, ["#ff3b30","#ff8a00","#2f6bff","#ffd60a","#ff2d87"][i]),
            verdict: pVerdict === "GO" ? "GO" : pVerdict === "CAUTION" ? "CONDITIONAL GO" : "NO-GO",
            score: pScore,
            quote: safeStr(p?.quote, "—"),
        };
    });

    // 5. Risk radar: derived from rubric (100 - score) so radar matches the math.
    const riskRadar = [
        { dim: "FIT",   value: 100 - cats.problemSolutionFit.score, full: 100 },
        { dim: "MKT",   value: 100 - cats.marketOpportunity.score, full: 100 },
        { dim: "TIME",  value: 100 - cats.timingTrends.score,      full: 100 },
        { dim: "MODEL", value: 100 - cats.businessModel.score,     full: 100 },
        { dim: "COMP",  value: 100 - cats.competitiveEdge.score,   full: 100 },
        { dim: "TEAM",  value: 100 - cats.teamExecution.score,     full: 100 },
    ];

    // 6. Risk breakdown: AI provides candidates; we OVERRIDE severities to match math.
    type RBI = { category?: string; severity?: string; title?: string; mitigation?: string };
    const rRiskMap = new Map<string, RubricKey>([
        ["MARKET", "marketOpportunity"],
        ["EXECUTION", "teamExecution"],
        ["COMPETITION", "competitiveEdge"],
        ["MODEL", "businessModel"],
        ["TIMING", "timingTrends"],
        ["FIT", "problemSolutionFit"],
    ]);
    const sevFromScore = (s: number): "HIGH" | "MED" | "LOW" => (s < 45 ? "HIGH" : s < 70 ? "MED" : "LOW");
    type Risk = { category: string; severity: "HIGH" | "MED" | "LOW"; title: string; mitigation: string };
    const breakdownAi = Array.isArray((raw.risk as { breakdown?: RBI[] })?.breakdown)
        ? ((raw.risk as { breakdown: RBI[] }).breakdown)
        : [];
    const riskBreakdown: Risk[] = breakdownAi.slice(0, 6).map((r) => {
        const cat = safeStr(r?.category, "MARKET").toUpperCase();
        const rubricKey = rRiskMap.get(cat);
        const score = rubricKey ? cats[rubricKey].score : 50;
        return {
            category: cat,
            severity: sevFromScore(score),
            title: safeStr(r?.title, "—"),
            mitigation: safeStr(r?.mitigation, "—"),
        };
    });

    // 7. Scatter — ensure YOU is present.
    type Sc = { x?: number; y?: number; name?: string; you?: boolean };
    const scatterAi = Array.isArray((raw.competition as { scatter?: Sc[] })?.scatter)
        ? (raw.competition as { scatter: Sc[] }).scatter
        : [];
    let scatter = scatterAi.slice(0, 8).map((p) => ({
        x: clampInt(p?.x, 0, 100, 50),
        y: clampInt(p?.y, 0, 100, 50),
        name: safeStr(p?.name, "—"),
        ...(p?.you ? { you: true } : {}),
    }));
    if (!scatter.some((p) => p.you)) {
        // Inject YOU based on competitive edge score.
        scatter = [{ x: 50, y: cats.competitiveEdge.score, name: "YOU", you: true }, ...scatter];
    }

    // 8. Market growth.
    type Gp = { year?: string; tam?: number; sam?: number; som?: number };
    const growthAi = Array.isArray((raw.market as { growth?: Gp[] })?.growth)
        ? (raw.market as { growth: Gp[] }).growth
        : [];
    const growth = growthAi.slice(0, 5).map((p, i) => ({
        year: safeStr(p?.year, `Y${i + 1}`),
        tam: clampInt(p?.tam, 0, 99999, 0),
        sam: clampInt(p?.sam, 0, 99999, 0),
        som: clampInt(p?.som, 0, 99999, 0),
    }));

    // 9. Build ticker referencing the score so it always feels connected.
    const ticker = [
        `VIABILITY ${overall}/100`,
        `VERDICT ${verdict}`,
        `CONFIDENCE ${conf.label}`,
        `STRONGEST ${strongestDim(cats)}`,
        `WEAKEST ${weakestDim(cats)}`,
        `TAM ${safeStr((raw.market as {tam?:string})?.tam, "—")}`,
        "REPORT LIVE",
        "PRIORITY DEBATER",
    ];

    // 10. Helper to safely pull arrays from AI for the remaining sections.
    const marketRaw = (raw.market as Record<string, unknown>) ?? {};
    const competitionRaw = (raw.competition as Record<string, unknown>) ?? {};
    const revenueRaw = (raw.revenue as Record<string, unknown>) ?? {};
    const audienceRaw = (raw.audience as Record<string, unknown>) ?? {};
    const swotRaw = (raw.swot as Record<string, string[]>) ?? {};
    const recsRaw = Array.isArray(raw.recommendations) ? raw.recommendations as Array<Record<string, unknown>> : [];

    return {
        score: overall,
        verdict,
        confidenceLabel: conf.label,
        confidencePct: conf.pct,
        rankLabel: rankFromScore(overall),
        oneLineThesis: safeStr(raw.oneLineThesis, "—"),
        scoreHeroBlurb: safeStr(raw.scoreHeroBlurb, `Strongest: ${strongestDim(cats)}. Weakest: ${weakestDim(cats)}.`),
        scoreHistory: [
            { v: "INTAKE", score: Math.max(0, overall - 14) },
            { v: "PANEL", score: Math.max(0, overall - 7) },
            { v: "SYNTH", score: overall },
            { v: "REPORT", score: overall },
            { v: "FINAL", score: overall },
        ],
        categoryScores: {
            problemSolutionFit: cats.problemSolutionFit.score,
            marketOpportunity: cats.marketOpportunity.score,
            competitiveEdge: cats.competitiveEdge.score,
            businessModel: cats.businessModel.score,
            teamExecution: cats.teamExecution.score,
            timingTrends: cats.timingTrends.score,
        },
        rubricBreakdown: RUBRIC.map((r) => ({
            key: r.key,
            label: r.label,
            weight: r.weight,
            score: cats[r.key].score,
            contribution: Math.round((cats[r.key].score * r.weight) / 10) / 10,
            reason: cats[r.key].reason,
        })),
        market: {
            tam: safeStr(marketRaw.tam as string, "—"),
            sam: safeStr(marketRaw.sam as string, "—"),
            som: safeStr(marketRaw.som as string, "—"),
            cagrPct: clampInt(marketRaw.cagrPct, 0, 80, 0),
            intro: safeStr(marketRaw.intro as string, "Market view for this idea."),
            growth,
            signals: Array.isArray(marketRaw.signals)
                ? (marketRaw.signals as Array<Record<string, string>>).slice(0, 4).map((s) => ({
                    tag: safeStr(s?.tag, "MARKET").toUpperCase().slice(0, 12),
                    label: safeStr(s?.label, "—"),
                    weight: safeStr(s?.weight, "+0 pts"),
                }))
                : [],
        },
        risk: {
            intro: safeStr((raw.risk as { intro?: string })?.intro, `Where this idea breaks: ${weakestDim(cats)}.`),
            radar: riskRadar,
            breakdown: riskBreakdown,
        },
        competition: {
            intro: safeStr(competitionRaw.intro as string, "Competitive landscape."),
            competitors: Array.isArray(competitionRaw.competitors)
                ? (competitionRaw.competitors as Array<Record<string, unknown>>).slice(0, 6).map((c) => ({
                    name: safeStr(c?.name, "—"),
                    focus: safeStr(c?.focus, "—"),
                    price: safeStr(c?.price, "—"),
                    traction: clampInt(c?.traction, 0, 100, 50),
                    weakness: safeStr(c?.weakness, "—"),
                    url: safeStr(c?.url, ""),
                }))
                : [],
            scatter,
        },
        revenue: {
            headline: safeStr(revenueRaw.headline as string, "—"),
            narrative: safeStr(revenueRaw.narrative as string, "—"),
            projection: Array.isArray(revenueRaw.projection)
                ? (revenueRaw.projection as Array<Record<string, unknown>>).slice(0, 5).map((p, i) => ({
                    year: safeStr(p?.year, `Y${i + 1}`),
                    total: clampInt(p?.total, 0, 99999, 0),
                    base: clampInt(p?.base, 0, 99999, 0),
                    expansion: clampInt(p?.expansion, 0, 99999, 0),
                }))
                : [],
            pricingModels: Array.isArray(revenueRaw.pricingModels)
                ? (revenueRaw.pricingModels as Array<Record<string, unknown>>).slice(0, 3).map((p) => ({
                    plan: safeStr(p?.plan, "PLAN").toUpperCase(),
                    price: safeStr(p?.price, "—"),
                    terms: safeStr(p?.terms, "—"),
                }))
                : [],
        },
        audience: {
            intro: safeStr(audienceRaw.intro as string, "Buyer view."),
            segments: Array.isArray(audienceRaw.segments)
                ? (audienceRaw.segments as Array<Record<string, unknown>>).slice(0, 5).map((s, i) => ({
                    name: safeStr(s?.name, `Segment ${i + 1}`),
                    value: clampInt(s?.value, 0, 100, 25),
                    color: safeStr(s?.color, ["#7dd3fc","#ff8a00","#2f6bff","#ffd60a","#ff2d87"][i % 5]),
                }))
                : [],
            personas: Array.isArray(audienceRaw.personas)
                ? (audienceRaw.personas as Array<Record<string, unknown>>).slice(0, 4).map((p) => ({
                    title: safeStr(p?.title, "—"),
                    org: safeStr(p?.org, "—"),
                    budget: safeStr(p?.budget, "—"),
                    pain: safeStr(p?.pain, "—"),
                    why: safeStr(p?.why, "—"),
                }))
                : [],
        },
        swot: {
            strengths: (swotRaw.strengths ?? []).filter(Boolean).slice(0, 6),
            weaknesses: (swotRaw.weaknesses ?? []).filter(Boolean).slice(0, 6),
            opportunities: (swotRaw.opportunities ?? []).filter(Boolean).slice(0, 6),
            threats: (swotRaw.threats ?? []).filter(Boolean).slice(0, 6),
        },
        recommendations: recsRaw.slice(0, 8).map((r, i) => ({
            priority: (["P0","P1","P2"].includes(String(r?.priority)) ? r.priority : i < 2 ? "P0" : i < 4 ? "P1" : "P2") as "P0"|"P1"|"P2",
            title: safeStr(r?.title, "—"),
            impact: safeStr(r?.impact, "—"),
            horizon: safeStr(r?.horizon, `${(i + 2) * 2}w`),
            tags: Array.isArray(r?.tags) ? (r.tags as string[]).slice(0, 3) : ["NEXT STEP"],
        })),
        personaVerdicts,
        ticker,
    } satisfies DashboardData;
}

function strongestDim(cats: Record<RubricKey, { score: number }>): string {
    let best: RubricKey = "problemSolutionFit"; let bestScore = -1;
    for (const r of RUBRIC) if (cats[r.key].score > bestScore) { best = r.key; bestScore = cats[r.key].score; }
    return RUBRIC.find((r) => r.key === best)!.label.toUpperCase();
}
function weakestDim(cats: Record<RubricKey, { score: number }>): string {
    let worst: RubricKey = "problemSolutionFit"; let worstScore = 101;
    for (const r of RUBRIC) if (cats[r.key].score < worstScore) { worst = r.key; worstScore = cats[r.key].score; }
    return RUBRIC.find((r) => r.key === worst)!.label.toUpperCase();
}

// ─── Route ────────────────────────────────────────────────────────────────
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
        if (!topic) return new Response(JSON.stringify({ error: "topic required" }), { status: 400 });

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
            model: "gpt-4.1",
            temperature: 0.35, // tighter — we want consistency
            max_completion_tokens: 4800,
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
        const dashboard = assembleDashboard(parsed as AiResp);
        return new Response(JSON.stringify(dashboard), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown error";
        return new Response(JSON.stringify({ error: msg }), { status: 500 });
    }
}
