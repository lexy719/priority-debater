<...snip...>
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
