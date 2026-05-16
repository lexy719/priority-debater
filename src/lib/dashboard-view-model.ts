import * as mock from "@/data/mockData";
import {
  audienceSegmentsFromParsed,
  competitorScatterFromMatrix,
  marketGrowthFromSizing,
  parseMoneyToken,
  revenueProjectionFromFinancialRows,
  scoreHistoryFromCategories,
  threatTractionScore,
} from "@/lib/chart-data";
import { dossierFromSession, sessionMatchesDossierShape } from "@/lib/dossier-from-session";
import {
  buildRiskBreakdown,
  buildRiskRadar,
  countParsedRubricScores,
  weakestRubricDimension,
} from "@/lib/risk-view-model";
import { cleanMarkdownText, extractDashboardData, getCategoryScoreAggregate, type CategoryScores } from "@/lib/parse";
import type { DashboardData, ValidationSession } from "@/lib/types";

export { parseMoneyToken };

function bulletsFromMarkdown(text: string | null | undefined, max = 12): string[] {
  if (!text) return [];
  return text
    .replace(/\s+-\s+\*\*/g, "\n- **")
    .replace(/\s+(\d+\.)\s+\*\*/g, "\n$1 **")
    .split(/\n+/)
    .map((l) => cleanMarkdownText(l).replace(/^[A-Z][A-Za-z &/()-]{2,36}:\s*/, "").trim())
    .filter((l) => l.length > 8)
    .slice(0, max);
}

function confidenceFromScore(score: number): { label: string; pct: number } {
  if (score >= 78) return { label: "HIGH", pct: Math.min(96, 68 + Math.round(score / 4)) };
  if (score >= 62) return { label: "MED", pct: Math.min(88, 58 + Math.round(score / 3)) };
  return { label: "LOW", pct: Math.max(42, 45 + Math.round(score / 5)) };
}

function marketSignalsFromSummary(summary: string | null): typeof mock.marketSignals {
  const chunks = bulletsFromMarkdown(summary, 6).map((c) => c.slice(0, 96));
  const tags = ["REGULATORY", "MARKET", "ECONOMIC", "RISK", "TECH", "GTM"];
  return chunks.slice(0, 4).map((label, i) => ({
    tag: tags[i % tags.length],
    label,
    weight: i % 3 === 2 ? "-2 pts" : `+${4 + (i % 4)} pts`,
  }));
}

function marketSignalsFromCategories(cat: CategoryScores, score: number): typeof mock.marketSignals {
  const rows = [
    {
      tag: "MARKET",
      label: "Market opportunity score",
      value: cat.marketOpportunity ?? score,
    },
    {
      tag: "TIMING",
      label: "Timing and trend support",
      value: cat.timingTrends ?? score,
    },
    {
      tag: "MODEL",
      label: "Business model confidence",
      value: cat.businessModel ?? score,
    },
    {
      tag: "EDGE",
      label: "Competitive edge strength",
      value: cat.competitiveEdge ?? score,
    },
  ];
  return rows.map((r) => ({
    tag: r.tag,
    label: `${r.label}: ${Math.round(r.value)}/100`,
    weight: r.value >= 70 ? "+8 pts" : r.value >= 55 ? "+3 pts" : "-4 pts",
  }));
}

function swotFromDashboard(dm: ReturnType<typeof extractDashboardData>): typeof mock.swot {
  const strengths = dm.strengths.slice(0, 6);
  const risks = dm.risks;
  const half = Math.ceil(risks.length / 2);
  const weaknesses = risks.slice(0, half).map((t) => t.replace(/^\d+\.\s*/, ""));
  const threats = risks.slice(half).map((t) => t.replace(/^\d+\.\s*/, ""));
  const opportunities = dm.recommendations.slice(0, 5);
  return {
    strengths,
    weaknesses,
    opportunities,
    threats,
  };
}

function recommendationsFromDossier(
  dm: ReturnType<typeof extractDashboardData>,
  next: { id: string; text: string; eta: string }[],
): typeof mock.recommendations {
  const src =
    next.length > 0
      ? next.map((a, i) => ({
          priority: i < 2 ? ("P0" as const) : i < 4 ? ("P1" as const) : ("P2" as const),
          title: a.text,
          impact: `ETA ${a.eta}`,
          horizon: a.eta,
          tags: ["VALIDATION"],
        }))
      : dm.recommendations.slice(0, 6).map((text, i) => ({
          priority: i < 2 ? ("P0" as const) : ("P1" as const),
          title: text.replace(/^\d+\.\s*/, "").slice(0, 200),
          impact: "Report evidence",
          horizon: `${2 + i}w`,
          tags: ["NEXT STEP"],
        }));
  if (src.length === 0) return [];
  return src;
}

function fieldFromMarkdown(text: string | null | undefined, label: string): string {
  if (!text) return "";
  const normalized = text.replace(/\s+-\s+\*\*/g, "\n- **");
  const re = new RegExp(`(?:^|\\n)\\s*[-*]?\\s*\\*\\*${label}\\*\\*\\s*:?\\s*(.+?)(?=\\n\\s*[-*]?\\s*\\*\\*|\\n\\s*\\d+\\.|$)`, "is");
  const match = normalized.match(re);
  return cleanMarkdownText(match?.[1] ?? "");
}

function fieldFromLooseText(text: string | null | undefined, label: string): string {
  if (!text) return "";
  const normalized = cleanMarkdownText(text);
  const labels = [
    "TAM/SAM/SOM",
    "Market timing",
    "Growth drivers",
    "Headwinds",
    "Primary segment",
    "Jobs to be done",
    "Buying triggers",
    "Channels to reach them",
    "Revenue model",
    "Pricing strategy",
    "Key metrics",
  ];
  const next = labels.filter((l) => l !== label).map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const re = new RegExp(`\\b${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*(.+?)(?=\\s+(?:${next})\\s*:|$)`, "i");
  return cleanMarkdownText(normalized.match(re)?.[1] ?? "");
}

function marketIntroFromSummary(summary: string | null): string {
  const timing = fieldFromLooseText(summary, "Market timing");
  const drivers = fieldFromLooseText(summary, "Growth drivers");
  const headwinds = fieldFromLooseText(summary, "Headwinds");
  const parts = [
    timing ? `Timing: ${timing}` : "",
    drivers ? `Drivers: ${drivers}` : "",
    headwinds ? `Headwinds: ${headwinds}` : "",
  ].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return cleanMarkdownText(summary).slice(0, 360);
}

function cleanFinancialNarrative(summary: string | null, hasProjection: boolean): string {
  const raw = cleanMarkdownText(summary)
    .replace(/\|\s*Metric\s*\|[\s\S]*$/i, "")
    .replace(/\s+\|[-:\s|]+\|[\s\S]*$/i, "")
    .replace(/\bDisclaimer\s*\(required\)\s*:\s*/gi, "")
    .replace(/\bSensitivity\s*\(required\)\s*:\s*/gi, "Sensitivity: ")
    .replace(/\s*\|\s*/g, " ")
    .trim();

  if (!hasProjection) {
    return "The validation provides pricing evidence, but not enough forecast inputs to model revenue responsibly. Use this tab as the current pricing view until adoption, ARR, MRR, or customer ramp data is available.";
  }

  if (raw.length > 20) return short(raw, 360);

  if (hasProjection) {
    return "The revenue view uses explicit financial rows from the validation dossier and separates base revenue from expansion upside.";
  }

  return "Revenue evidence is not detailed enough to chart yet.";
}

function pricingFromBusinessModel(
  businessModel: string | null,
  unit: ReturnType<typeof extractDashboardData>["unitEconomics"],
  breakEven: ReturnType<typeof extractDashboardData>["breakEven"],
): typeof mock.pricingModels {
  const text = cleanMarkdownText(businessModel);
  const explicitPrices = Array.from(text.matchAll(/([$€£]\s?[\d,.]+)\s*(?:\/\s*(mo|month|seat|user|yr|year)|per\s+(month|seat|user|yr|year))?/gi))
    .map((m) => `${m[1].replace(/\s+/g, "")}${m[2] ? ` / ${m[2].replace("month", "mo").replace("year", "yr")}` : ""}`)
    .slice(0, 3);

  const model =
    fieldFromMarkdown(businessModel, "Revenue model") ||
    fieldFromLooseText(businessModel, "Revenue model") ||
    text.slice(0, 100);
  const strategy =
    fieldFromMarkdown(businessModel, "Pricing strategy") ||
    fieldFromLooseText(businessModel, "Pricing strategy") ||
    "Validate willingness to pay before locking the ladder.";
  const metrics =
    fieldFromMarkdown(businessModel, "Key metrics") ||
    fieldFromLooseText(businessModel, "Key metrics") ||
    "Track activation, retention, CAC, LTV, and payback.";

  if (explicitPrices.length > 0) {
    const [first, second, third] = explicitPrices;
    return [
      { plan: "STARTER", price: first, terms: short(strategy, 64) },
      { plan: "GROWTH", price: second ?? first, terms: short(model, 64) },
      { plan: "ENTERPRISE", price: third ?? "Custom", terms: short(metrics, 64) },
    ];
  }

  return [
    { plan: "PILOT", price: "Price test", terms: short(strategy, 64) || "Price-test with design partners." },
    { plan: "CORE", price: unit.arpu ? `ARPU ${unit.arpu}` : "Validate", terms: unit.ltv ? `LTV ${unit.ltv}` : short(model, 64) },
    { plan: "SCALE", price: "Custom", terms: breakEven.point ? `Break-even ${breakEven.point}` : short(metrics, 64) },
  ];
}

function buyerPersonasFromSections(
  targetCustomer: string | null,
  valueProposition: string | null,
): typeof mock.personas {
  const primary = fieldFromMarkdown(targetCustomer, "Primary segment") || fieldFromLooseText(targetCustomer, "Primary segment") || bulletsFromMarkdown(targetCustomer, 1)[0];
  const secondary = fieldFromMarkdown(targetCustomer, "Secondary") || fieldFromLooseText(targetCustomer, "Secondary");
  const anti = fieldFromMarkdown(targetCustomer, "Anti-ICP") || fieldFromLooseText(targetCustomer, "Anti-ICP");
  const jobs = fieldFromMarkdown(targetCustomer, "Jobs to be done") || fieldFromLooseText(targetCustomer, "Jobs to be done");
  const triggers = fieldFromMarkdown(targetCustomer, "Buying triggers") || fieldFromLooseText(targetCustomer, "Buying triggers");
  const channels = fieldFromMarkdown(targetCustomer, "Channels to reach them") || fieldFromLooseText(targetCustomer, "Channels to reach them");
  const benefit = fieldFromMarkdown(valueProposition, "Headline") || fieldFromMarkdown(valueProposition, "Key benefits");

  const rows = [
    {
      title: primary ? short(primary, 42) : "",
      org: channels ? short(channels, 80) : "Primary ICP",
      budget: "Validate",
      pain: jobs ? short(jobs, 100) : short(benefit || "Pain and willingness to pay need validation.", 100),
      why: triggers ? short(triggers, 100) : short(benefit || "Best-fit buyer from the validation report.", 100),
    },
    {
      title: secondary ? short(secondary, 42) : "",
      org: "Secondary segment",
      budget: "Validate",
      pain: short(benefit || jobs || "Adjacent demand needs proof.", 100),
      why: short(triggers || "Only pursue after the primary segment shows pull.", 100),
    },
    {
      title: anti ? `Avoid: ${short(anti, 34)}` : "",
      org: "Anti-ICP / low-fit buyer",
      budget: "—",
      pain: "Low urgency or high adoption friction.",
      why: "Useful boundary for positioning and sales qualification.",
    },
  ].filter((row) => row.title);

  return rows;
}

function competitorsFromInlineSummary(summary: string | null): ReturnType<typeof extractDashboardData>["competitiveMatrix"] {
  const text = cleanMarkdownText(summary);
  if (!text) return [];
  const directMatch = text.match(/Direct competitors?:\s*(.+?)(?=\bIndirect competitors?:|\bPositioning gap\b|\bDefensibility\b|$)/i);
  const direct = directMatch?.[1] ?? "";
  const parenthesized = Array.from(direct.matchAll(/([A-Z0-9][\w .&+-]{1,44}?)\s*\(([^)]+)\)/g));
  if (parenthesized.length > 0) {
    return parenthesized
      .map((m) => ({
        name: cleanMarkdownText(m[1]),
        approach: cleanMarkdownText(m[2]),
        weakness: "Threat level and switching gap need validation.",
      }))
      .filter((row) => row.name && !/^(AI|No|Direct|Indirect)$/i.test(row.name))
      .slice(0, 8);
  }

  const commaParts = direct
    .split(/\s*,\s*(?=[A-Z0-9][\w .&+-]{1,44}(?:\s|$))/)
    .map((name) => cleanMarkdownText(name))
    .filter((name) => name.length > 1 && !/\bcompetitors?:$/i.test(name));
  return commaParts.slice(0, 8).map((name) => ({
    name,
    approach: "Named in the competitive landscape.",
    weakness: "Threat level and switching gap need validation.",
  }));
}

export type ReportTabVm = { id: string; num: string; label: string; hint: string };

export type SectionUiVm = {
  eyebrow: string;
  headline1: string;
  headlineAccent: string;
};

export type DashboardUiVm = {
  scoreHeroBlurb: string;
  market: SectionUiVm & { chartSubhead: string; growthLabel: string };
  risk: SectionUiVm;
  competition: SectionUiVm;
  revenue: SectionUiVm;
  audience: SectionUiVm;
  swot: SectionUiVm;
  recommendations: SectionUiVm;
  personas: SectionUiVm;
  metrics: SectionUiVm;
};

const PERSONA_ACCENTS = ["#ff3b30", "#ff8a00", "#2f6bff", "#ffd60a", "#ff2d87"];

export type DashboardViewModel = {
  live: boolean;
  idea: typeof mock.idea;
  overallScore: typeof mock.overallScore;
  coldMetrics: typeof mock.coldMetrics;
  marketGrowth: typeof mock.marketGrowth;
  marketSignals: typeof mock.marketSignals;
  marketIntro: string;
  marketCagrLabel: string;
  riskRadar: typeof mock.riskRadar;
  riskRadarHasData: boolean;
  riskIntro: string;
  riskBreakdown: typeof mock.riskBreakdown;
  competitors: typeof mock.competitors;
  competitorScatter: typeof mock.competitorScatter;
  competitionIntro: string;
  revenueProjection: typeof mock.revenueProjection;
  revenueSourceMetric: string;
  revenueEndYearLabel: string;
  pricingModels: typeof mock.pricingModels;
  revenueHeadline: string;
  revenueNarrative: string;
  audienceSegments: typeof mock.audienceSegments;
  audienceIntro: string;
  personas: typeof mock.personas;
  swot: typeof mock.swot;
  recommendations: typeof mock.recommendations;
  recommendationsIntro: string;
  personaVerdicts: typeof mock.personaVerdicts;
  panelAggregateVerdict: string;
  panelConsensusScore: number;
  tickerItems: string[];
  yourTractionScore: number;
  yourIdeaStrapline: string;
  reportTabs: ReportTabVm[];
  dashboardUi: DashboardUiVm;
};

function formatUtc(ts: number): string {
  try {
    const d = new Date(ts);
    return `${d.toISOString().slice(0, 10)} / ${d.toISOString().slice(11, 16)} UTC`;
  } catch {
    return "—";
  }
}

function short(s: string, max: number): string {
  const t = cleanMarkdownText(s);
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function buildReportTabs(topic: string, live: boolean): ReportTabVm[] {
  const hint = live ? short(topic, 40) : "Run validation from home";
  return [
    { id: "market", num: "§03", label: "MARKET", hint },
    { id: "risk", num: "§04", label: "RISK", hint },
    { id: "competition", num: "§05", label: "COMPETITION", hint },
    { id: "revenue", num: "§06", label: "REVENUE", hint },
    { id: "audience", num: "§07", label: "AUDIENCE", hint },
    { id: "swot", num: "§08", label: "SWOT", hint },
    { id: "recommendations", num: "§09", label: "ACTIONS", hint },
    { id: "personas", num: "§10", label: "PERSONAS", hint },
  ];
}

function buildDashboardUi(
  live: boolean,
  topicRaw: string,
  score: number,
  verdict: string,
  compCount: number,
  revenueHeadline: string,
  audienceLead: string,
): DashboardUiVm {
  const topic = topicRaw.trim() || "Your idea";
  const sh = short(topic, 44).toUpperCase();
  if (!live) {
    return {
      scoreHeroBlurb:
        "Submit an idea from the homepage (#idea-validation). When a session is saved, the report turns its evidence into charts, tables, and tab-specific decisions.",
      market: {
        eyebrow: "§03 / MARKET · NO SESSION",
        headline1: "NO LIVE",
        headlineAccent: "REPORT LOADED",
        chartSubhead: "TAM / SAM / SOM — run validation to chart your sizing.",
        growthLabel: "—",
      },
      risk: {
        eyebrow: "§04 / RISK · NO SESSION",
        headline1: "RISK RADAR",
        headlineAccent: "IDLE",
      },
      competition: {
        eyebrow: "§05 / COMPETITION · NO SESSION",
        headline1: "NAMED PLAYERS",
        headlineAccent: "PENDING",
      },
      revenue: {
        eyebrow: "§06 / REVENUE · NO SESSION",
        headline1: "REVENUE",
        headlineAccent: "STACK",
      },
      audience: {
        eyebrow: "§07 / AUDIENCE · NO SESSION",
        headline1: "WHO PAYS",
        headlineAccent: "WAITING",
      },
      swot: {
        eyebrow: "§08 / SWOT · NO SESSION",
        headline1: "POSITIONING",
        headlineAccent: "MAP",
      },
      recommendations: {
        eyebrow: "§09 / ACTIONS · NO SESSION",
        headline1: "NEXT STEPS",
        headlineAccent: "EMPTY",
      },
      personas: {
        eyebrow: "§10 / PERSONAS · NO SESSION",
        headline1: "FIVE VOICES",
        headlineAccent: "WAITING",
      },
      metrics: {
        eyebrow: "§02 / METRICS · NO SESSION",
        headline1: "COLD METRICS",
        headlineAccent: "LOCKED",
      },
    };
  }
  return {
    scoreHeroBlurb: `This report is tied to the current validation session. Scores drive the charts, evidence drives the tables, and missing evidence is called out instead of fabricated.`,
    market: {
      eyebrow: `§03 / MARKET · ${short(topic, 56)}`,
      headline1: "MARKET",
      headlineAccent: "SIZING",
      chartSubhead: "TAM / SAM / SOM from report assumptions",
      growthLabel: `${verdict} · ${score}/100`,
    },
    risk: {
      eyebrow: `§04 / RISK · ${short(topic, 56)}`,
      headline1: "WHERE IT",
      headlineAccent: "BREAKS",
    },
    competition: {
      eyebrow: `§05 / COMPETITION · ${short(topic, 56)}`,
      headline1: "NAMED PLAYERS.",
      headlineAccent: `${compCount} IN REPORT`,
    },
    revenue: {
      eyebrow: `§06 / REVENUE · ${short(topic, 56)}`,
      headline1: "REVENUE",
      headlineAccent: "MODEL",
    },
    audience: {
      eyebrow: `§07 / AUDIENCE · ${short(topic, 56)}`,
      headline1: "WHO PAYS",
      headlineAccent: "SEGMENTS",
    },
    swot: {
      eyebrow: `§08 / SWOT · ${short(topic, 56)}`,
      headline1: "FORCES ON",
      headlineAccent: short(verdict, 16),
    },
    recommendations: {
      eyebrow: `§09 / ACTIONS · ${short(topic, 56)}`,
      headline1: "DO THESE",
      headlineAccent: "NEXT",
    },
    personas: {
      eyebrow: `§10 / PERSONAS · ${short(topic, 56)}`,
      headline1: "FIVE VOICES.",
      headlineAccent: short(verdict, 20),
    },
    metrics: {
      eyebrow: `§02 / METRICS · ${short(topic, 56)}`,
      headline1: "YOUR REPORT,",
      headlineAccent: "IN COLD METRICS.",
    },
  };
}

export function buildDashboardViewModel(session: ValidationSession | null): DashboardViewModel {
  // Preferred path: structured AI-generated dashboard data (per-idea).
  if (session && session.dashboardData) {
    return buildFromStructured(session, session.dashboardData);
  }
  if (!session || !sessionMatchesDossierShape(session)) {
    const topic = "";
    const reportTabs = buildReportTabs(topic, false);
    const dashboardUi = buildDashboardUi(false, topic, 0, "—", 0, "—", "");
    const emptyRiskRadar = [
      { dim: "FIT", value: 50, full: 100 },
      { dim: "MKT", value: 50, full: 100 },
      { dim: "TIME", value: 50, full: 100 },
      { dim: "MODEL", value: 50, full: 100 },
      { dim: "COMP", value: 50, full: 100 },
      { dim: "TEAM", value: 50, full: 100 },
    ];
    return {
      live: false,
      idea: {
        title: "No validation session loaded",
        submittedBy: "—",
        submittedAt: "—",
        runtime: "—",
        model: "—",
        verdict: "CAUTION",
        confidence: "LOW",
        confidencePct: 14,
      },
      overallScore: {
        score: 0,
        benchmark: 58,
        rank: "—",
        history: [
          { v: "INTAKE", score: 8 },
          { v: "PANEL", score: 12 },
          { v: "SYNTH", score: 10 },
          { v: "REPORT", score: 6 },
          { v: "FINAL", score: 0 },
        ],
      },
      coldMetrics: [
        { label: "VIABILITY", value: "0", suffix: "/ 100" },
        { label: "CONFIDENCE", value: "—", suffix: "" },
        { label: "TAM", value: "—", suffix: "" },
        { label: "SAM", value: "—", suffix: "" },
        { label: "SOM", value: "—", suffix: "" },
        { label: "COMPETITORS", value: "0", suffix: "named" },
      ],
      marketGrowth: [],
      marketSignals: [
        { tag: "INFO", label: "Run validation from the homepage to capture market signals.", weight: "—" },
      ],
      marketIntro:
        "This section charts TAM / SAM / SOM when the report includes defensible sizing evidence.",
      marketCagrLabel: "NO SESSION",
      riskRadar: emptyRiskRadar.map((r) => ({ ...r, rubricScore: null, axisLabel: r.dim })),
      riskRadarHasData: false,
      riskIntro: "Risk rows and radar come from category scores and explicit risk flags in the report.",
      riskBreakdown: [
        {
          category: "SESSION",
          severity: "LOW",
          title: "No dossier in session storage",
          mitigation: "Submit an idea from /#idea-validation — the panel output drives this register.",
        },
      ],
      competitors: [],
      competitorScatter: [{ x: 50, y: 50, name: "YOU", you: true }] as typeof mock.competitorScatter,
      competitionIntro: "Competitive matrix appears when the report names rivals with enough comparable detail.",
      revenueProjection: [],
      revenueSourceMetric: "",
      revenueEndYearLabel: "",
      pricingModels: mock.pricingModels.map((p) => ({ ...p, price: "—", terms: "—" })),
      revenueHeadline: "—",
      revenueNarrative: "Revenue stacks appear when the report includes enough financial evidence to chart.",
      audienceSegments: [{ name: "Run validation to map ICP", value: 100, color: "#7dd3fc" }],
      audienceIntro: "Segments come from target customer and value proposition evidence in the dossier.",
      personas: [],
      swot: {
        strengths: ["Submit a validation run to extract strengths from your report."],
        weaknesses: ["—"],
        opportunities: ["—"],
        threats: ["—"],
      },
      recommendations: [],
      recommendationsIntro: "Ranked actions appear when the dossier provides concrete next steps.",
      personaVerdicts: [],
      panelAggregateVerdict: "CAUTION",
      panelConsensusScore: 0,
      tickerItems: ["NO SESSION", "RUN VALIDATION FROM HOME", "IDEA DEBATER"],
      yourTractionScore: 0,
      yourIdeaStrapline: "Awaiting your pitch.",
      reportTabs,
      dashboardUi,
    };
  }

  const dm = extractDashboardData(session.validationContent);
  const dossier = dossierFromSession(session);
  const reconciled = session.scoreReconciliation?.final;
  const score = reconciled?.viability ?? dm.score ?? dossier.score ?? 62;
  const conf = confidenceFromScore(score);
  const cat = reconciled
    ? {
        problemSolutionFit: reconciled.problemSolutionFit,
        marketOpportunity: reconciled.marketOpportunity,
        competitiveEdge: reconciled.competitiveEdge,
        businessModel: reconciled.businessModel,
        teamExecution: reconciled.teamExecution,
        timingTrends: reconciled.timingTrends,
      }
    : dm.categoryScores;
  const agg = getCategoryScoreAggregate(cat);
  const benchmark = agg ? Math.round(Math.max(40, agg.mean - 12)) : 58;

  const idea = {
    title: session.setup.topic.slice(0, 220),
    submittedBy: session.setup.context?.trim() ? session.setup.context.trim().slice(0, 80) : "Founder",
    submittedAt: formatUtc(session.createdAt),
    runtime: "—",
    model: "VALIDATION PANEL",
    verdict: dossier.verdict,
    confidence: conf.label,
    confidencePct: conf.pct,
  };

  const overallScore = {
    score: Math.round(score),
    benchmark,
    rank: agg ? `Top ${Math.max(5, 100 - Math.round(agg.mean))}%` : "—",
    history: scoreHistoryFromCategories(score, cat),
  };

  const tam = dm.tamSamSom.tam;
  const sam = dm.tamSamSom.sam;
  const som = dm.tamSamSom.som;
  const matrix = dm.competitiveMatrix.length > 0 ? dm.competitiveMatrix : competitorsFromInlineSummary(dm.competitiveSummary);

  const coldMetrics = [
    { label: "VIABILITY", value: String(Math.round(score)), suffix: "/ 100" },
    { label: "CONFIDENCE", value: conf.label, suffix: "" },
    { label: "TAM", value: tam ?? "—", suffix: "" },
    { label: "SAM", value: sam ?? "—", suffix: "" },
    { label: "SOM", value: som ?? "—", suffix: "" },
    { label: "COMPETITORS", value: String(Math.max(0, matrix.length)), suffix: "named" },
  ];

  const marketGrowth = marketGrowthFromSizing(tam, sam, som, dm.marketCagr);
  const marketCagrLabel =
    dm.marketCagr != null
      ? `${dm.marketCagr}% CAGR · ${dossier.verdict} · ${Math.round(score)}/100`
      : `${dossier.verdict} · ${Math.round(score)}/100`;

  const marketSignalsFromReport = marketSignalsFromSummary(dm.marketSummary);
  const marketSignals = marketSignalsFromReport.length > 0 ? marketSignalsFromReport : marketSignalsFromCategories(cat, score);

  const marketIntro =
    marketIntroFromSummary(dm.marketSummary) ||
    "Market view summarizes sizing, timing, growth drivers, and headwinds from the validation dossier.";

  const riskRadar = buildRiskRadar(cat);
  const riskRadarHasData = countParsedRubricScores(cat) >= 3;
  const riskBreakdown = buildRiskBreakdown(cat, dm.risks);

  const weakest = weakestRubricDimension(cat);
  const riskIntro =
    dm.risks[0]?.replace(/^\d+\.\s*/, "").slice(0, 220) ||
    (weakest
      ? `Highest risk on ${weakest.dim} (rubric ${weakest.score}/100). Severity map = 100 − category score from this report.`
      : "Risk posture combines rubric scores with explicit risk flags in the report.");

  const competitors =
    matrix.length > 0
      ? matrix.map((c) => ({
          name: c.name,
          focus: cleanMarkdownText(c.approach).slice(0, 48) || "—",
          price: "—",
          traction: threatTractionScore(c.weakness, c.approach),
          weakness: cleanMarkdownText(c.weakness) || "—",
          url: "",
        }))
      : [];

  const competitorScatter = competitorScatterFromMatrix(matrix, Math.round(score)) as typeof mock.competitorScatter;

  const competitionIntro =
    (dm.competitiveSummary && cleanMarkdownText(dm.competitiveSummary).slice(0, 360)) ||
    "Competitive view compares named rivals when the dossier gives enough focus, pricing, or traction evidence.";

  const revenueBundle = revenueProjectionFromFinancialRows(dm.financialProjections);
  const revenueProjection = revenueBundle?.points ?? [];
  const revenueSourceMetric = revenueBundle?.sourceMetric ?? "";
  const revenueEndYearLabel = revenueProjection[revenueProjection.length - 1]?.year ?? "";
  const hasRevenueProjection = revenueProjection.length > 0;
  const yEnd = revenueProjection[revenueProjection.length - 1]?.total;
  const revenueHeadline =
    yEnd != null && Number.isFinite(yEnd)
      ? yEnd >= 100
        ? `€${Math.round(yEnd)}M`
        : `€${Math.round(yEnd * 10) / 10}M`
      : "FORECAST PENDING";
  const revenueNarrative = cleanFinancialNarrative(dm.financialSummary, hasRevenueProjection);

  const pricingModels = pricingFromBusinessModel(dm.businessModel, dm.unitEconomics, dm.breakEven);

  const primarySegment = fieldFromMarkdown(dm.targetCustomer, "Primary segment") || fieldFromLooseText(dm.targetCustomer, "Primary segment");
  const jobsSegment = fieldFromMarkdown(dm.targetCustomer, "Jobs to be done") || fieldFromLooseText(dm.targetCustomer, "Jobs to be done");
  const triggerSegment = fieldFromMarkdown(dm.targetCustomer, "Buying triggers") || fieldFromLooseText(dm.targetCustomer, "Buying triggers");
  const channelsSegment = fieldFromMarkdown(dm.targetCustomer, "Channels to reach them") || fieldFromLooseText(dm.targetCustomer, "Channels to reach them");
  const segLines = [primarySegment, jobsSegment, triggerSegment, channelsSegment].filter(Boolean);
  const audienceSegments = audienceSegmentsFromParsed(dm.audienceSegmentShares, segLines);

  const audienceIntro =
    (dm.targetCustomer && cleanMarkdownText(dm.targetCustomer).slice(0, 280)) ||
    "Audience view focuses on the clearest buyer segment, jobs to be done, triggers, and channels named in the dossier.";

  const personas = buyerPersonasFromSections(dm.targetCustomer, dm.valueProposition);

  const swot = swotFromDashboard(dm);

  const recommendations = recommendationsFromDossier(dm, dossier.nextActions);
  const recommendationsIntro = `Ranked actions from the validation dossier. Viability index ${Math.round(score)}/100: close execution gaps before raising.`;

  const personaVerdicts = dossier.personas.map((p, i) => ({
    name: p.persona,
    role: p.archetype.toUpperCase(),
    accent: PERSONA_ACCENTS[i % PERSONA_ACCENTS.length],
    verdict: p.verdict === "CAUTION" ? "CONDITIONAL GO" : p.verdict === "NO-GO" ? "NO-GO" : "GO",
    score: Math.round((p.confidence ?? 0.72) * 100),
    quote: p.pullQuote || p.quote.slice(0, 220),
  }));

  const panelConsensusScore =
    personaVerdicts.length > 0
      ? Math.round((personaVerdicts.reduce((a, p) => a + p.score, 0) / personaVerdicts.length) * 10) / 10
      : 0;

  const panelAggregateVerdict = dossier.verdict;

  const audienceLead = audienceSegments[0]?.name ?? session.setup.topic.slice(0, 40);
  const reportTabs = buildReportTabs(session.setup.topic, true);
  const dashboardUi = buildDashboardUi(
    true,
    session.setup.topic,
    Math.round(score),
    dossier.verdict,
    Math.max(0, matrix.length),
    revenueHeadline,
    audienceLead,
  );

  const tickerItems = [
    `VIABILITY ${Math.round(score)} / 100`,
    `VERDICT: ${dossier.verdict}`,
    `CONFIDENCE ${conf.label}`,
    tam ? `TAM ${tam}` : "",
    sam ? `SAM ${sam}` : "",
    som ? `SOM ${som}` : "",
    `${dossier.personas.length} / 5 PERSONAS`,
    session.ideaCategory?.label ? `VERTICAL ${session.ideaCategory.label.toUpperCase()}` : "",
    "REPORT LIVE",
    "PRIORITY DEBATER",
  ].filter(Boolean);

  return {
    live: true,
    idea,
    overallScore,
    coldMetrics,
    marketGrowth,
    marketSignals,
    marketIntro,
    marketCagrLabel,
    riskRadar,
    riskRadarHasData,
    riskIntro,
    riskBreakdown,
    competitors,
    competitorScatter,
    competitionIntro,
    revenueProjection,
    revenueSourceMetric,
    revenueEndYearLabel,
    pricingModels,
    revenueHeadline,
    revenueNarrative,
    audienceSegments,
    audienceIntro,
    personas,
    swot,
    recommendations,
    recommendationsIntro,
    personaVerdicts,
    panelAggregateVerdict,
    panelConsensusScore,
    tickerItems,
    yourTractionScore: Math.round(score),
    yourIdeaStrapline:
      session.setup.position?.trim().slice(0, 140) ||
      session.setup.context?.trim().slice(0, 140) ||
      "Positioning from your validation brief.",
    reportTabs,
    dashboardUi,
  };
}


// ────────────────────────────────────────────────────────────────────────────
// Structured-data path: when the validate flow successfully fetches
// /api/dashboard-data, every chart + section is populated directly from the
// AI-generated JSON for THIS idea — no fragile markdown parsing.
// ────────────────────────────────────────────────────────────────────────────

const clampInt = (n: unknown, lo: number, hi: number, fallback: number): number => {
  const v = typeof n === "number" ? n : parseFloat(String(n));
  if (!Number.isFinite(v)) return fallback;
  return Math.max(lo, Math.min(hi, Math.round(v)));
};

const safeStr = (s: unknown, fallback = ""): string => {
  if (typeof s !== "string") return fallback;
  const t = s.trim();
  return t || fallback;
};

function buildFromStructured(session: ValidationSession, d: DashboardData): DashboardViewModel {
  const topic = session.setup.topic || "Your idea";
  const score = clampInt(d.score, 0, 100, 60);
  const verdictRaw = String(d.verdict || "").toUpperCase();
  const verdict: "GO" | "CAUTION" | "NO-GO" =
    verdictRaw === "GO" ? "GO" : verdictRaw === "NO-GO" || verdictRaw === "NOGO" ? "NO-GO" : "CAUTION";
  const confLabel = (["HIGH", "MED", "LOW"].includes(String(d.confidenceLabel)) ? d.confidenceLabel : "MED") as "HIGH" | "MED" | "LOW";

  const idea = {
    title: topic.slice(0, 220),
    submittedBy: session.setup.context?.trim().slice(0, 80) || "Founder",
    submittedAt: formatUtc(session.createdAt),
    runtime: "—",
    model: "VALIDATION PANEL",
    verdict,
    confidence: confLabel,
    confidencePct: clampInt(d.confidencePct, 10, 100, 65),
  };

  const history = Array.isArray(d.scoreHistory) && d.scoreHistory.length > 0
    ? d.scoreHistory.slice(0, 5).map((h, i) => ({
        v: safeStr(h?.v, `S${i + 1}`),
        score: clampInt(h?.score, 0, 100, score),
      }))
    : [
        { v: "INTAKE", score: Math.max(0, score - 12) },
        { v: "PANEL", score: Math.max(0, score - 6) },
        { v: "SYNTH", score },
        { v: "REPORT", score },
        { v: "FINAL", score },
      ];

  const cat = {
    problemSolutionFit: clampInt(d.categoryScores?.problemSolutionFit, 0, 100, score),
    marketOpportunity: clampInt(d.categoryScores?.marketOpportunity, 0, 100, score),
    competitiveEdge: clampInt(d.categoryScores?.competitiveEdge, 0, 100, score),
    businessModel: clampInt(d.categoryScores?.businessModel, 0, 100, score),
    teamExecution: clampInt(d.categoryScores?.teamExecution, 0, 100, score),
    timingTrends: clampInt(d.categoryScores?.timingTrends, 0, 100, score),
  };
  const catAgg = getCategoryScoreAggregate(cat);
  const benchmark = catAgg ? Math.round(Math.max(40, catAgg.mean - 12)) : 58;

  const overallScore = {
    score,
    benchmark,
    rank: safeStr(d.rankLabel, catAgg ? `Top ${Math.max(5, 100 - Math.round(catAgg.mean))}%` : "—"),
    history,
  };

  const marketGrowthData = Array.isArray(d.market?.growth) ? d.market.growth : [];
  const marketGrowth = marketGrowthData.slice(0, 5).map((p, i) => ({
    year: safeStr(p?.year, `Y${i + 1}`),
    tam: clampInt(p?.tam, 0, 99999, 0),
    sam: clampInt(p?.sam, 0, 99999, 0),
    som: clampInt(p?.som, 0, 99999, 0),
  }));
  const cagrPct = clampInt(d.market?.cagrPct, 0, 80, 0);
  const marketCagrLabel = cagrPct > 0 ? `${cagrPct}% CAGR · ${verdict} · ${score}/100` : `${verdict} · ${score}/100`;

  const marketSignalsArr = Array.isArray(d.market?.signals) ? d.market.signals.slice(0, 4) : [];
  const marketSignals = marketSignalsArr.map((s, i) => ({
    tag: safeStr(s?.tag, "MARKET").toUpperCase().slice(0, 12),
    label: safeStr(s?.label, `Signal ${i + 1}`),
    weight: safeStr(s?.weight, "+0 pts"),
  }));

  const competitors = Array.isArray(d.competition?.competitors)
    ? d.competition.competitors.slice(0, 6).map((c) => ({
        name: safeStr(c?.name, "—"),
        focus: safeStr(c?.focus, "—"),
        price: safeStr(c?.price, "—"),
        traction: clampInt(c?.traction, 0, 100, 50),
        weakness: safeStr(c?.weakness, "—"),
        url: safeStr(c?.url, ""),
      }))
    : [];

  const scatter = Array.isArray(d.competition?.scatter) && d.competition.scatter.length > 0
    ? d.competition.scatter.slice(0, 8).map((p) => ({
        x: clampInt(p?.x, 0, 100, 50),
        y: clampInt(p?.y, 0, 100, 50),
        name: safeStr(p?.name, "—"),
        ...(p?.you ? { you: true } : {}),
      }))
    : [{ x: 50, y: 50, name: "YOU", you: true }];

  const revenueProjection = Array.isArray(d.revenue?.projection)
    ? d.revenue.projection.slice(0, 5).map((p, i) => {
        const total = clampInt(p?.total, 0, 99999, 0);
        const base = clampInt(p?.base, 0, 99999, Math.round(total * 0.75));
        const expansion = clampInt(p?.expansion, 0, 99999, Math.max(0, total - base));
        return {
          year: safeStr(p?.year, `Y${i + 1}`),
          subs: base,
          hardware: expansion,
          total,
        };
      })
    : [];

  const pricingModels = Array.isArray(d.revenue?.pricingModels) && d.revenue.pricingModels.length > 0
    ? d.revenue.pricingModels.slice(0, 3).map((p) => ({
        plan: safeStr(p?.plan, "PLAN").toUpperCase(),
        price: safeStr(p?.price, "—"),
        terms: safeStr(p?.terms, "—"),
      }))
    : mock.pricingModels;

  const audienceSegments = Array.isArray(d.audience?.segments) && d.audience.segments.length > 0
    ? d.audience.segments.slice(0, 5).map((s, i) => ({
        name: safeStr(s?.name, `Segment ${i + 1}`),
        value: clampInt(s?.value, 0, 100, 25),
        color: safeStr(s?.color, ["#7dd3fc", "#ff8a00", "#2f6bff", "#ffd60a", "#ff2d87"][i % 5]),
      }))
    : [{ name: "Primary ICP", value: 100, color: "#7dd3fc" }];

  const personas = Array.isArray(d.audience?.personas)
    ? d.audience.personas.slice(0, 4).map((p) => ({
        title: safeStr(p?.title, "—"),
        org: safeStr(p?.org, "—"),
        budget: safeStr(p?.budget, "—"),
        pain: safeStr(p?.pain, "—"),
        why: safeStr(p?.why, "—"),
      }))
    : [];

  const riskRadarRaw = Array.isArray(d.risk?.radar) && d.risk.radar.length > 0 ? d.risk.radar : [
    { dim: "FIT", value: 100 - cat.problemSolutionFit, full: 100 },
    { dim: "MKT", value: 100 - cat.marketOpportunity, full: 100 },
    { dim: "TIME", value: 100 - cat.timingTrends, full: 100 },
    { dim: "MODEL", value: 100 - cat.businessModel, full: 100 },
    { dim: "COMP", value: 100 - cat.competitiveEdge, full: 100 },
    { dim: "TEAM", value: 100 - cat.teamExecution, full: 100 },
  ];
  const riskRadar = riskRadarRaw.map((r) => ({
    dim: safeStr(r?.dim, "DIM").toUpperCase().slice(0, 8),
    value: clampInt(r?.value, 0, 100, 50),
    full: 100,
    rubricScore: 100 - clampInt(r?.value, 0, 100, 50),
    axisLabel: safeStr(r?.dim, "DIM").toUpperCase().slice(0, 8),
  })) as typeof mock.riskRadar;

  const riskBreakdown = Array.isArray(d.risk?.breakdown) && d.risk.breakdown.length > 0
    ? d.risk.breakdown.slice(0, 8).map((r) => ({
        category: safeStr(r?.category, "RISK").toUpperCase().slice(0, 20),
        severity: (["HIGH", "MED", "LOW"].includes(String(r?.severity)) ? r.severity : "MED") as "HIGH" | "MED" | "LOW",
        title: safeStr(r?.title, "—"),
        mitigation: safeStr(r?.mitigation, "—"),
      }))
    : [];

  const swotIn = d.swot ?? { strengths: [], weaknesses: [], opportunities: [], threats: [] };
  const swot = {
    strengths: (swotIn.strengths ?? []).filter(Boolean).slice(0, 6),
    weaknesses: (swotIn.weaknesses ?? []).filter(Boolean).slice(0, 6),
    opportunities: (swotIn.opportunities ?? []).filter(Boolean).slice(0, 6),
    threats: (swotIn.threats ?? []).filter(Boolean).slice(0, 6),
  };

  const recommendations = Array.isArray(d.recommendations)
    ? d.recommendations.slice(0, 8).map((r, i) => ({
        priority: (["P0", "P1", "P2"].includes(String(r?.priority)) ? r.priority : i < 2 ? "P0" : i < 4 ? "P1" : "P2") as "P0" | "P1" | "P2",
        title: safeStr(r?.title, "—"),
        impact: safeStr(r?.impact, "—"),
        horizon: safeStr(r?.horizon, `${(i + 2) * 2}w`),
        tags: Array.isArray(r?.tags) ? r.tags.slice(0, 3) : ["NEXT STEP"],
      }))
    : [];

  const personaVerdicts = Array.isArray(d.personaVerdicts)
    ? d.personaVerdicts.slice(0, 5).map((p, i) => ({
        name: safeStr(p?.name, `Persona ${i + 1}`),
        role: safeStr(p?.role, "—").toUpperCase(),
        accent: safeStr(p?.accent, ["#ff3b30", "#ff8a00", "#2f6bff", "#ffd60a", "#ff2d87"][i % 5]),
        verdict: safeStr(p?.verdict, "CONDITIONAL GO").toUpperCase(),
        score: clampInt(p?.score, 0, 100, score),
        quote: safeStr(p?.quote, "—"),
      }))
    : [];
  const panelConsensusScore = personaVerdicts.length > 0
    ? Math.round((personaVerdicts.reduce((a, p) => a + p.score, 0) / personaVerdicts.length) * 10) / 10
    : score;

  const ticker = Array.isArray(d.ticker) && d.ticker.length > 0
    ? d.ticker.filter((t): t is string => typeof t === "string" && t.length > 0).slice(0, 12)
    : [`VIABILITY ${score} / 100`, `VERDICT ${verdict}`, `CONFIDENCE ${confLabel}`, "REPORT LIVE", "PRIORITY DEBATER"];

  const tam = safeStr(d.market?.tam, "—");
  const sam = safeStr(d.market?.sam, "—");
  const som = safeStr(d.market?.som, "—");
  const coldMetrics = [
    { label: "VIABILITY", value: String(score), suffix: "/ 100" },
    { label: "CONFIDENCE", value: confLabel, suffix: "" },
    { label: "TAM", value: tam, suffix: "" },
    { label: "SAM", value: sam, suffix: "" },
    { label: "SOM", value: som, suffix: "" },
    { label: "COMPETITORS", value: String(competitors.length), suffix: "named" },
  ];

  const reportTabs = buildReportTabs(topic, true);
  const dashboardUi = buildDashboardUi(
    true,
    topic,
    score,
    verdict,
    competitors.length,
    safeStr(d.revenue?.headline, "—"),
    audienceSegments[0]?.name ?? topic.slice(0, 40),
  );

  return {
    live: true,
    idea,
    overallScore,
    coldMetrics,
    marketGrowth,
    marketSignals,
    marketIntro: safeStr(d.market?.intro, "Market view summarizes sizing, timing, growth drivers, and headwinds for this idea."),
    marketCagrLabel,
    riskRadar,
    riskRadarHasData: true,
    riskIntro: safeStr(d.risk?.intro, "Where the idea is most likely to break."),
    riskBreakdown,
    competitors,
    competitorScatter: scatter as typeof mock.competitorScatter,
    competitionIntro: safeStr(d.competition?.intro, "Competitive view of named players for this idea."),
    revenueProjection,
    revenueSourceMetric: revenueProjection.length > 0 ? "Total revenue ($M)" : "",
    revenueEndYearLabel: revenueProjection[revenueProjection.length - 1]?.year ?? "",
    pricingModels,
    revenueHeadline: safeStr(d.revenue?.headline, "—"),
    revenueNarrative: safeStr(d.revenue?.narrative, "Revenue trajectory based on the validation report."),
    audienceSegments,
    audienceIntro: safeStr(d.audience?.intro, "Buyer view: primary segment, jobs, and channels for this idea."),
    personas,
    swot,
    recommendations,
    recommendationsIntro: `Ranked actions for this idea · viability ${score}/100.`,
    personaVerdicts,
    panelAggregateVerdict: verdict,
    panelConsensusScore,
    tickerItems: ticker,
    yourTractionScore: score,
    yourIdeaStrapline: safeStr(d.oneLineThesis, session.setup.position?.slice(0, 140) || "Positioning from your validation brief."),
    reportTabs,
    dashboardUi,
  };
}
