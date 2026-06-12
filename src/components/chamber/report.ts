/**
 * Report data contract for the Priority Debater results page.
 *
 * The entire page is rendered from a single `Report` object. To drive the UI
 * with different data, build a `Report` (validate with your backend) and pass
 * it to `<ResultsPage report={...} />`. Every score, chart, table, headline,
 * persona, action and CTA is downstream of this shape.
 */

export type Tone = "accent" | "warn" | "danger" | "success";
export type TickerTone = "accent" | "warn" | "success" | "data";
export type Severity = "HIGH" | "MED" | "LOW";
export type Confidence = "LOW" | "MED" | "HIGH";
export type Priority = "P0" | "P1" | "P2" | "P3";

export interface Report {
  meta: {
    idea: string;
    submittedAt: string;   // free-form, displayed as-is
    version: string;       // e.g. "v1.0 / 2026 · VALIDATION REPORT"
    brand: string;         // e.g. "PRIORITY DEBATER"
    brandMark: string;     // e.g. "PD"
    stressTestLabel: string; // e.g. "● STRESS-TEST COMPLETE"
  };
  score: {
    value: number;            // 0-100
    rubricMean: number;       // baseline used in delta vs rubric mean
    verdict: string;          // e.g. "PROCEED WITH CAUTION"
    confidence: Confidence;
    rank: string;             // e.g. "TOP 50%"
    rankSub: string;
    progression: { stage: string; value: number }[]; // sparkline
    /** Provenance (optional — present when the report is anchored to the scoring engine). */
    rationale?: string;             // headline rationale from the scoring engine
    recommendation?: string;        // PROCEED | PROCEED-CAUTIOUSLY | REFINE | PIVOT | REJECT
    evidenceLevel?: "thin" | "moderate" | "rich";
    webSearchUsed?: boolean;        // were live sources consulted
    fromDebate?: boolean;           // did a debate transcript feed this report
    sources?: { url: string; title?: string }[];
    assumptions?: { area: string; claim: string; evidenceToLock: string; sourceUrl?: string; sourceTitle?: string }[];
    oneAsk?: string;                // single most score-moving founder proof
  };
  hero: {
    titleHead: string;        // e.g. "Idea survives the panel."
    titleHl: string;          // highlight tail, e.g. "Barely."
    intro: string;
  };
  ticker: { tag: string; txt: string; tone: TickerTone }[];
  execSummary: {
    headlineHead: string;     // e.g. "What the panel"
    headlineHl: string;       // highlight, e.g. "actually"
    headlineTail: string;     // e.g. "said."
    cards: { k: string; v: string; note: string }[]; // typically 3
  };
  overview: {
    sectionBody: string;
    proceedHeadline: string;
    proceedBodyBefore: string; // text before the inline danger word
    proceedDangerWord: string; // rendered in danger color
    proceedBodyAfter: string;
    keyMetrics: { k: string; v: string; tone?: Tone }[];
    strengths: { title: string; sub: string }[];
    risks: { title: string; sev: Severity }[];
    dims: { k: string; weight: string; value: number; contrib: number; tone: Tone; note: string }[];
    totalContribution: number;
  };
  market: {
    sectionBody: string;
    titleHead: string; titleHl: string;
    growth: { y: string; tam: number; sam: number; som: number }[];
    cagrBadge: string;
    drivers: { cat: string; pts: string; txt: string }[];
    stage: { label: string; note: string };
    seasonality: { label: string; note: string };
    growthDrivers: string[];
    maturity: { stages: string[]; current: string; note: string };
    calendar: { m: string; intensity: 0 | 1 | 2 }[]; // 12 months, 0=quiet,1=normal,2=peak
    regions: { name: string; status: "PRIMARY" | "SECONDARY" | "WATCH"; note: string }[];
  };
  risk: {
    sectionBody: string;
    titleHead: string; titleHl: string;
    radar: { axis: string; v: number }[];
    killers: string[];
    risks: { sev: Severity; cat: string; title: string; desc: string; mit: string; prob: number; imp: number }[];
    matrix: { name: string; prob: 1 | 2 | 3 | 4 | 5; imp: 1 | 2 | 3 | 4 | 5; tag: string; tone: Tone }[];
    tales: { who: string; what: string; lesson: string }[];
  };
  competition: {
    sectionBody: string;
    titleHead: string; titleHl: string;
    quad: { name: string; x: number; y: number; isYou?: boolean }[];
    rows: { name: string; focus: string; price: string; trac: number; gap: string; strength: string; weakness: string; isYou?: boolean; url?: string }[];
  };
  financials: {
    sectionBody: string;
    titleHead: string; titleHl: string;
    summary: { k: string; v: string; tone?: Tone }[];
    projections: { y: string; worst: number; base: number; best: number }[];
    breakEvenLabel: string;
    unitEcon: { label: string; v: string; tone?: Tone }[];
    tiers: { name: string; price: string; perUnitSuffix?: string; users: string; features: string[]; anchor: boolean }[];
    breakEven: { m: string; revenue: number; burn: number }[];
    breakEvenMarkX: string;
    breakEvenMarkLabel: string;
    startup: { range: string; note: string };
    exit: { value: string; timeline: string; note: string };
    revenueModel: { headline: string; bullets: string[] };
  };
  roadmap: {
    sectionBody: string;
    titleHead: string; titleHl: string;
    phases: { tag: string; title: string; window: string; goal: string; milestones: string[]; kpi: string[]; deps: string[] }[];
    quickWins: string[];
    partners: { name: string; role: string; note: string }[];
    channels: { name: string; note: string }[];
  };
  audience: {
    sectionBody: string;
    titleHead: string; titleHl: string;
    personas: { name: string; firm: string; pain: string; jtbd: string; budget: string; wtp: string; triggers: string[]; objections: string[]; tone: Tone; currentSolutions: string[]; painPoints: string[] }[];
    interviewQuestions: string[];
    experiments: { title: string; timeline: string; budget: string; metric: string }[];
    intelligence: { successes: string[]; trends: string[]; pivots: string[] };
  };
  actions: {
    sectionBody: string;
    titleHead: string; titleHl: string;
    items: { p: Priority; w: string; title: string; detail: string; owner: string }[];
    bottomLineLabel: string;
    bottomLineHeadline: string;
    bottomLineBody: string;
  };
  nextDebate: {
    headlineHead: string;
    headlineHl: string;
    headlineTail: string;
    primaryCta: string;
    secondaryCta: string;
  };
}

/* ============================= DEFAULT REPORT ============================= */

export const DEFAULT_REPORT: Report = {
  meta: {
    idea: `"A SaaS platform for mid-sized law firms in Portugal and Spain that automates the creation of legal documents using AI."`,
    submittedAt: "SUBMITTED 2026-05-26 / 10:51 UTC",
    version: "v1.0 / 2026 · VALIDATION REPORT",
    brand: "PRIORITY DEBATER",
    brandMark: "PD",
    stressTestLabel: "● STRESS-TEST COMPLETE",
  },
  score: {
    value: 61,
    rubricMean: 48,
    verdict: "PROCEED WITH CAUTION",
    confidence: "MED",
    rank: "TOP 50%",
    rankSub: "From rubric × baseline",
    progression: [
      { stage: "INTAKE", value: 48 },
      { stage: "PANEL",  value: 52 },
      { stage: "SYNTH",  value: 56 },
      { stage: "REPORT", value: 59 },
      { stage: "FINAL",  value: 61 },
    ],
  },
  hero: {
    titleHead: "Idea survives the panel.",
    titleHl: "Barely.",
    intro:
      "Five ruthless AI advisors. One investor-grade report. Scores drive the charts, evidence drives the tables — and missing evidence is called out, not fabricated.",
  },
  ticker: [
    { tag: "VRD", txt: "VIABILITY 61/100 · VERDICT CAUTION", tone: "warn" },
    { tag: "MKT", txt: "TAM $0.06B · SAM $18M · SOM $2.2M", tone: "data" },
    { tag: "CMP", txt: "4 NAMED COMPETITORS · MOAT WEAK", tone: "accent" },
    { tag: "STR", txt: "STRONGEST · DISTRIBUTION + INNOVATION", tone: "success" },
    { tag: "RPT", txt: "REPORT LIVE · PRIORITY DEBATER v1.0", tone: "data" },
  ],
  execSummary: {
    headlineHead: "What the panel",
    headlineHl: "actually",
    headlineTail: "said.",
    cards: [
      { k: "STRONGEST", v: "Distribution", note: "Founder network in EU legal-tech." },
      { k: "WEAKEST",   v: "Moat",         note: "No structural defensibility yet." },
      { k: "DECISION",  v: "Ship MVP",     note: "Validate willingness-to-pay in 60d." },
    ],
  },
  overview: {
    sectionBody:
      "Six weighted dimensions, scored against anchored rubrics. Headline = weighted sum. Every number on this page is downstream of these six.",
    proceedHeadline: "YES — BUT NARROW THE BEACHHEAD.",
    proceedBodyBefore:
      "Signal is real (distribution + innovation: 75/100) and the problem is sharp enough to pay for. But the moat is thin (45/100) and the TAM is niche. Ship a 90-day pilot with 3 mid-sized Iberian firms, prove LTV:CAC > 3, then raise. Do ",
    proceedDangerWord: "not",
    proceedBodyAfter: " expand horizontally yet.",
    keyMetrics: [
      { k: "TAM", v: "$60M" },
      { k: "SAM", v: "$18M" },
      { k: "SOM Y3", v: "$2.2M" },
      { k: "ARR Y3", v: "€334K" },
      { k: "CAC", v: "€1.2K" },
      { k: "LTV", v: "€4.8K" },
      { k: "LTV:CAC", v: "4.0×", tone: "success" },
      { k: "PAYBACK", v: "14 mo", tone: "warn" },
    ],
    strengths: [
      { title: "Regulatory + AI tailwind", sub: "GDPR + LLM accuracy converging in 2026" },
      { title: "Iberian language moat",    sub: "Underserved by US/UK SaaS" },
      { title: "Validated willingness to pay", sub: "€89/user/mo accepted in pilots" },
    ],
    risks: [
      { title: "Thin moat — incumbents can clone", sev: "HIGH" },
      { title: "Lawyer adoption inertia",          sev: "HIGH" },
      { title: "CAC blow-out without channel partner", sev: "MED" },
    ],
    dims: [
      { k: "PROBLEM SEVERITY",            weight: "×20%", value: 65, contrib: 13.0, tone: "accent",  note: "Clear pain for mid-sized law firms; pilots show some urgency, but not yet hair-on-fire." },
      { k: "MARKET SIZE",                 weight: "×15%", value: 60, contrib: 9.0,  tone: "accent",  note: "TAM ~$60M Iberia, niche but growing; legal tech digitalization and compliance drive demand." },
      { k: "COMPETITIVE ADVANTAGE / MOAT",weight: "×15%", value: 45, contrib: 6.8,  tone: "warn",    note: "Local language and compliance are differentiators, but easily replicated by incumbents." },
      { k: "MONETIZATION POTENTIAL",      weight: "×15%", value: 55, contrib: 8.3,  tone: "accent",  note: "SaaS with €89/user/month; early traction, but LTV:CAC and retention risk remain." },
      { k: "DISTRIBUTION + INNOVATION",   weight: "×20%", value: 75, contrib: 15.0, tone: "success", note: "AI, cloud, and regulatory tailwinds converge; incumbents not yet dominant in Iberia." },
      { k: "EXECUTION FEASIBILITY",       weight: "×15%", value: 60, contrib: 9.0,  tone: "accent",  note: "Pilots and integrations shipped; feasibility proven, but broader go-to-market unproven." },
    ],
    totalContribution: 61.1,
  },
  market: {
    sectionBody:
      "Legal tech in Iberia is early but growing, driven by digitalization and compliance. TAM is niche but expanding with cloud adoption. Major headwinds: incumbent bundling and slow lawyer adoption.",
    titleHead: "THE MARKET",
    titleHl: "DOESN'T LIE.",
    growth: Array.from({ length: 5 }, (_, i) => ({
      y: `Y${i + 1}`,
      tam: 0.9 + i * 0.6,
      sam: 4 + i * 5,
      som: 0.5 + i * 0.8,
    })),
    cagrBadge: "↗ 11% CAGR · CAUTION · 61/100",
    drivers: [
      { cat: "MARKET",     pts: "+8 pts",  txt: "Niche Iberian legal SaaS, $60M TAM, growing with compliance needs" },
      { cat: "TIMING",     pts: "+15 pts", txt: "Cloud, AI, and GDPR tailwinds in legal sector" },
      { cat: "REGULATORY", pts: "+7 pts",  txt: "GDPR and local data laws drive urgency" },
      { cat: "TECH",       pts: "+10 pts", txt: "AI and LLMs now accurate enough for legal drafting" },
    ],
    stage: { label: "EARLY GROWTH", note: "Adoption curve: ~15% of mid-sized firms have digitized intake. Innovators + early adopters phase." },
    seasonality: { label: "LOW", note: "Legal demand is counter-cyclical. Slight Q1/Q3 budget peaks. No sharp seasonality." },
    growthDrivers: [
      "AI Act compliance (EU 2026)",
      "Iberian SMB digital transformation grants",
      "Lawyer shortage → automation pressure",
    ],
    maturity: {
      stages: ["Emerging", "Growing", "Mature", "Declining"],
      current: "Growing",
      note: "Adoption curve at ~15% — innovators + early adopters phase. Window before incumbents catch up: 18-24 months.",
    },
    calendar: [
      { m: "J", intensity: 1 }, { m: "F", intensity: 2 }, { m: "M", intensity: 2 },
      { m: "A", intensity: 1 }, { m: "M", intensity: 1 }, { m: "J", intensity: 0 },
      { m: "J", intensity: 0 }, { m: "A", intensity: 0 }, { m: "S", intensity: 2 },
      { m: "O", intensity: 2 }, { m: "N", intensity: 1 }, { m: "D", intensity: 0 },
    ],
    regions: [
      { name: "Portugal",       status: "PRIMARY",   note: "Beachhead. 320 mid-sized firms. Bar association warm." },
      { name: "Spain",          status: "SECONDARY", note: "10× market. Enter Y2 via Madrid + Barcelona." },
      { name: "France",         status: "WATCH",     note: "Crowded. Defer until Iberian leadership locked." },
      { name: "Italy",          status: "WATCH",     note: "Similar civil-law tradition. Y3 expansion candidate." },
      { name: "United Kingdom", status: "WATCH",     note: "Different legal system. Out of scope for v1." },
    ],
  },
  risk: {
    sectionBody:
      "Biggest risk: lack of durable moat — incumbents can clone/bundle if traction appears. Six rubric dimensions stress-tested. Kill factors below would terminate the thesis.",
    titleHead: "WHERE IT",
    titleHl: "BREAKS.",
    radar: [
      { axis: "FIT",   v: 54 }, { axis: "MKT",  v: 60 },
      { axis: "TIME",  v: 75 }, { axis: "MODEL",v: 55 },
      { axis: "COMP",  v: 45 }, { axis: "TEAM", v: 60 },
    ],
    killers: [
      "EU AI Act bans autonomous legal drafting (low prob, fatal impact)",
      "Wolters Kluwer ships Iberian module before Y1 (med prob, fatal impact)",
      "First malpractice lawsuit traced to your output (med prob, fatal impact)",
    ],
    risks: [
      { sev: "HIGH", cat: "COMPETITION", title: "Incumbent bundling threat",  desc: "Wolters Kluwer or Clio could ship local-language AI drafting as a free add-on within 12 months.", mit: "Lock 3 reference firms on 24-month contracts. File patents on domain-specific RAG pipeline.", prob: 70, imp: 85 },
      { sev: "HIGH", cat: "MARKET",      title: "Lawyer adoption inertia",    desc: "Senior partners resist workflow change. 6-9 month sales cycles standard.", mit: "Sell to managing partner + IT lead together. Prove ROI in 30-day pilot, embed in workflow.", prob: 75, imp: 75 },
      { sev: "MED",  cat: "EXECUTION",   title: "Distribution & CAC risk",    desc: "No clear repeatable channel. Outbound expensive in legal vertical.", mit: "Partner with Iberian bar associations. Sponsor 2 industry conferences in Y1.", prob: 60, imp: 60 },
      { sev: "MED",  cat: "MODEL",       title: "Retention & LTV:CAC risk",   desc: "If churn > 3%/mo, LTV:CAC collapses below 2×.", mit: "Embed usage telemetry. Mandate quarterly business reviews.", prob: 45, imp: 70 },
      { sev: "MED",  cat: "REGULATORY",  title: "AI hallucination liability", desc: "Wrong legal citation creates malpractice exposure.", mit: "Mandatory human-in-loop. E&O insurance bundled. Citation verification layer.", prob: 50, imp: 80 },
      { sev: "LOW",  cat: "TECH",        title: "LLM cost inflation",         desc: "If token prices double, gross margin drops 12 pts.", mit: "Self-host Mistral fallback. Cache common clauses.", prob: 30, imp: 40 },
    ],
    matrix: [
      { name: "Incumbent bundling",        prob: 4, imp: 5, tag: "COMP",  tone: "danger"  },
      { name: "Lawyer adoption inertia",   prob: 4, imp: 4, tag: "MKT",   tone: "danger"  },
      { name: "CAC blow-out",              prob: 3, imp: 3, tag: "EXEC",  tone: "warn"    },
      { name: "Churn > 3%/mo",             prob: 2, imp: 4, tag: "MODEL", tone: "warn"    },
      { name: "Hallucination liability",   prob: 3, imp: 4, tag: "REG",   tone: "warn"    },
      { name: "LLM cost inflation",        prob: 2, imp: 2, tag: "TECH",  tone: "accent"  },
      { name: "Bar association pushback",  prob: 1, imp: 3, tag: "REG",   tone: "success" },
    ],
    tales: [
      { who: "RAVEL LAW (US)",      what: "Built deep legal-research AI. Acquired by LexisNexis at modest multiple after failing to break out of niche.", lesson: "Even technically excellent legal AI struggles without distribution muscle. Plan exit or moat from day one." },
      { who: "ATRIUM (US)",         what: "Raised $75M to combine tech + law firm. Burned out at $10M ARR. Shut down 2020.",                              lesson: "Don't try to be the lawyer AND sell software. Stay in your lane — tool, not service." },
      { who: "ITRINI (PT, 2019)",   what: "PT legal-tech startup shipped beautiful UX. Failed to convert pilots to paid. Wound down in 18 months.",      lesson: "Free pilots without contractual conversion paths are research, not revenue. Lock LOIs early." },
    ],
  },
  competition: {
    sectionBody:
      "Competitive landscape is crowded: global SaaS (Clio), EU giants (Wolters Kluwer), and local case management vendors. Local language and compliance are differentiators, but not a defensible moat.",
    titleHead: "4 NAMED.",
    titleHl: "YOU SIT BOTTOM-RIGHT.",
    quad: [
      { name: "Clio",            x: 90, y: 95 },
      { name: "Wolters Kluwer",  x: 70, y: 90 },
      { name: "Formstack",       x: 45, y: 80 },
      { name: "Local Case Mgmt", x: 50, y: 70 },
      { name: "YOU",             x: 60, y: 30, isYou: true },
    ],
    rows: [
      { name: "CLIO",           focus: "Global legal SaaS, expanding in Europe", price: "$78/user/mo",  trac: 90, gap: "Weak local data, slow localization",  strength: "Brand + ecosystem",     weakness: "Generic UX, no Iberian compliance" },
      { name: "WOLTERS KLUWER", focus: "Deep compliance, EU legal tech",         price: "Custom",        trac: 95, gap: "Slow innovation, expensive",          strength: "Regulatory authority",  weakness: "Enterprise-only, no AI drafting" },
      { name: "FORMSTACK",      focus: "Document automation, broad verticals",   price: "$50+/user/mo",  trac: 80, gap: "Not legal-specific, weak compliance", strength: "Horizontal scale",      weakness: "Not built for legal workflows" },
      { name: "LOCAL CASE MGMT",focus: "Workflow, some automation",              price: "€40-100/user/mo",trac:70, gap: "Weak AI, slow to add features",        strength: "Local relationships",   weakness: "Decade-old stack, no LLM" },
      { name: "YOUR IDEA",      focus: "Iberian AI legal drafting · niche moat", price: "€89/user/mo",   trac: 61, gap: "Unproven distribution",               strength: "Iberian AI specialist", weakness: "No brand, thin moat",   isYou: true },
    ],
  },
  financials: {
    sectionBody:
      "SaaS subscription at €89/user/month targets mid-sized law firms. Early pilots show willingness to pay, but scaling depends on sticky adoption and channel success. Retention and CAC are key risks.",
    titleHead: "€334K ARR",
    titleHl: "(YEAR 3 PROJECTION) BY Y5.",
    summary: [
      { k: "CAC", v: "€1,200" },
      { k: "LTV", v: "€4,800", tone: "success" },
      { k: "LTV:CAC", v: "4.0×", tone: "success" },
      { k: "PAYBACK", v: "14 MONTHS", tone: "warn" },
    ],
    projections: [
      { y: "Y1", worst: 20,  base: 45,  best: 80 },
      { y: "Y2", worst: 60,  base: 140, best: 240 },
      { y: "Y3", worst: 140, base: 334, best: 560 },
      { y: "Y4", worst: 240, base: 620, best: 1050 },
      { y: "Y5", worst: 360, base: 980, best: 1700 },
    ],
    breakEvenLabel: "BREAK-EVEN · MONTH 22 (BASE)",
    unitEcon: [
      { label: "ARPU",          v: "€89/user/mo" },
      { label: "GROSS MARGIN",  v: "78%", tone: "success" },
      { label: "CAC",           v: "€1,200" },
      { label: "LTV",           v: "€4,800", tone: "success" },
      { label: "LTV:CAC",       v: "4.0×",   tone: "success" },
      { label: "PAYBACK",       v: "14 mo",  tone: "warn" },
      { label: "MONTHLY CHURN", v: "2.1%",   tone: "warn" },
      { label: "NRR",           v: "108%",   tone: "success" },
    ],
    tiers: [
      { name: "STARTER",    price: "€89",     perUnitSuffix: "/user/mo", users: "1-10",  features: ["Core integrations", "Compliance checks", "Email support"], anchor: false },
      { name: "GROWTH",     price: "€79",     perUnitSuffix: "/user/mo", users: "11-50", features: ["Advanced integrations", "Priority support", "SSO + audit log", "Custom templates"], anchor: true },
      { name: "ENTERPRISE", price: "Custom",                              users: "50+",   features: ["Dedicated compliance/legal", "On-prem option", "SLA 99.9%", "Custom AI fine-tune"], anchor: false },
    ],
    breakEven: Array.from({ length: 36 }, (_, i) => ({
      m: `M${i + 1}`,
      revenue: Math.round(Math.pow(i, 1.7) * 1.5),
      burn: 45,
    })),
    breakEvenMarkX: "M22",
    breakEvenMarkLabel: "BREAK-EVEN M22",
    startup: {
      range: "€180K - €280K",
      note: "Covers 6-month founder runway, LLM/infra credits, pilot integrations, GDPR/DPA legal review, and 1 senior AE hire.",
    },
    exit: {
      value: "€18M - €34M",
      timeline: "5-7 YEARS",
      note: "Strategic acquisition by Wolters Kluwer, LexisNexis, or Clio at 4-6× ARR. PE rollup unlikely before €5M ARR.",
    },
    revenueModel: {
      headline: "€89 / user / month · seat-based SaaS with usage-tiered overages on advanced AI drafting.",
      bullets: [
        "Seat licenses sold annually with 10% upfront discount for 24-month contracts",
        "Setup + integration packages: €2K-€8K one-time (white-glove for first 20 customers)",
        "Overage pricing on advanced clauses, M&A templates, and citation verification (€0.40/doc)",
      ],
    },
  },
  roadmap: {
    sectionBody:
      "Three phases over 18 months. Each phase has a hard goal, a tight KPI set, and explicit dependencies. Slipping a dependency is the warning sign — not slipping the calendar.",
    titleHead: "EXECUTION,",
    titleHl: "PHASED.",
    phases: [
      {
        tag: "PHASE 01", title: "MVP", window: "0-3 MONTHS",
        goal: "Prove core drafting accuracy with 3 design partners.",
        milestones: ["Contract-drafting engine (PT + ES law)", "Word + Outlook plugin", "3 pilot firms signed (free)", "First 100 documents shipped"],
        kpi: ["80%+ first-draft acceptance", "< 30s avg generation", "NPS > 40 from partners"],
        deps: ["LLM provider contract", "GDPR DPA template", "Bar association advisor"],
      },
      {
        tag: "PHASE 02", title: "V1 — PAID LAUNCH", window: "3-9 MONTHS",
        goal: "Convert pilots, ship paid product, reach €15K MRR.",
        milestones: ["Pricing live (€89/user)", "Case management integrations (3)", "Compliance audit log", "SOC2 Type I started", "First 15 paying firms"],
        kpi: ["€15K MRR", "Logo churn < 5%", "Payback < 18 mo"],
        deps: ["2 AEs hired", "Channel partnership w/ bar assoc.", "Series Seed closed"],
      },
      {
        tag: "PHASE 03", title: "SCALE", window: "9-18 MONTHS",
        goal: "Repeatable channel, geographic expansion, €100K MRR.",
        milestones: ["Expand to Spain region 2", "Self-serve onboarding", "Partner marketplace", "Vertical templates (M&A, IP, Tax)", "50+ firm customers"],
        kpi: ["€100K MRR", "LTV:CAC > 4×", "NRR > 115%"],
        deps: ["10-person team", "Series A optional", "Established brand in 2 markets"],
      },
    ],
    quickWins: [
      "Ship public ROI calculator → SEO + lead magnet",
      "Publish 3 case studies from pilots → social proof",
      "Bar association webinar → 50 qualified leads",
      "Open-source domain-specific eval set → credibility",
    ],
    partners: [
      { name: "Ordem dos Advogados (PT)", role: "ENDORSEMENT",  note: "Co-branded webinars + member directory listing." },
      { name: "Consejo General de la Abogacía (ES)", role: "ENDORSEMENT", note: "Spanish bar association · Y2 expansion lever." },
      { name: "Mistral AI",               role: "AI INFRA",     note: "EU-sovereign LLM, GDPR-aligned, fallback to self-hosted." },
      { name: "OneTrust",                 role: "COMPLIANCE",   note: "GDPR + AI Act audit trail integration." },
    ],
    channels: [
      { name: "Direct outbound (senior AE)",         note: "Founder-led for first 20 logos · 6-mo cycle." },
      { name: "Bar-association webinars + events",   note: "1 sponsorship/qtr · ~50 qualified leads each." },
      { name: "SketchUp-style plugin marketplace",   note: "Word + Outlook + Clio add-ons · self-serve trial." },
      { name: "Industry conferences (LegalGeek, OAB Tech)", note: "2 booths/year · earned PR + customer dinners." },
    ],
  },
  audience: {
    sectionBody:
      "Buying committee is small but multi-headed. Managing partner signs, IT lead validates, senior associate champions. All three need to nod for a deal to close.",
    titleHead: "THREE BUYERS.",
    titleHl: "ONE CHAMPION.",
    personas: [
      {
        name: "MARTA — MANAGING PARTNER", firm: "32-lawyer firm · Lisbon",
        pain: "Senior associates spending 40% of week on routine drafting. Margin under pressure.",
        jtbd: "Reclaim partner billable hours and raise associate leverage without firing anyone.",
        budget: "€20K-50K / year SaaS",
        wtp: "€89-150/user/mo",
        triggers: ["Lost partner to competitor", "Q4 margin review", "Failed audit"],
        objections: ["AI hallucinations", "Confidentiality"],
        tone: "danger",
        currentSolutions: ["Outsourced paralegals", "Generic Word templates", "DocuSign + manual review"],
        painPoints: ["Margin erosion vs. boutique firms", "Senior associates leaving for in-house roles", "No visibility into draft turnaround"],
      },
      {
        name: "DIOGO — IT / OPS LEAD", firm: "50-lawyer firm · Madrid",
        pain: "Five disconnected tools. No audit trail. Compliance team complaining weekly.",
        jtbd: "Consolidate stack, prove GDPR + AI Act compliance, look like a hero.",
        budget: "€30K-80K / year",
        wtp: "€89/user/mo + setup",
        triggers: ["New compliance regulation", "Failed pen-test", "Tool consolidation mandate"],
        objections: ["Integration depth", "Vendor lock-in"],
        tone: "accent",
        currentSolutions: ["Legacy case-management suite", "SharePoint + ad-hoc scripts", "Manual GDPR logs"],
        painPoints: ["No single source of truth", "Quarterly compliance fire-drills", "Procurement scrutiny on AI vendors"],
      },
      {
        name: "INÊS — SENIOR ASSOCIATE", firm: "Day-to-day user",
        pain: "Drafting NDAs and SPAs eats nights. Junior work, partner pressure.",
        jtbd: "Get to first draft in 30s instead of 3 hours. Look senior, leave at 7pm.",
        budget: "User, not buyer",
        wtp: "Pushes managing partner",
        triggers: ["Bad work-life balance", "Tool envy from in-house counsel"],
        objections: ["Trust in output", "Workflow disruption"],
        tone: "success",
        currentSolutions: ["Word templates passed associate-to-associate", "ChatGPT (forbidden but used)", "Manual clause libraries"],
        painPoints: ["12-hour days during deal closings", "Re-drafting from incomplete templates", "Fear of missing material clauses"],
      },
    ],
    interviewQuestions: [
      "Walk me through the last contract you drafted from scratch — what took longest?",
      "What percentage of your drafting time is genuinely repetitive vs. truly bespoke?",
      "Would you trust an AI first draft if every citation was independently verified? Why or why not?",
      "Who signs off on a €25K/year tool — and what's their last veto?",
      "What's your firm's current policy on ChatGPT / Claude for client work?",
    ],
    experiments: [
      { title: "Run targeted LinkedIn ads to PT/ES managing partners with an ROI calculator",
        timeline: "2 weeks", budget: "€500", metric: "≥ 5% CTR and 50 calculator completions" },
      { title: "Cold outreach to 100 mid-sized Iberian firms with a 30-min pilot offer",
        timeline: "4 weeks", budget: "€0",   metric: "≥ 10 booked discovery calls, ≥ 3 LOIs" },
      { title: "Co-host bar association webinar on AI Act readiness",
        timeline: "6 weeks", budget: "€1.5K", metric: "≥ 80 registrants, ≥ 15 qualified pipeline" },
    ],
    intelligence: {
      successes: [
        "Spellbook — AI contract drafting (US/CA) hit $10M ARR in 24 months by anchoring in MS Word",
        "Luminance — UK contract review SaaS, $100M+ raised, focused on Magic Circle firms",
        "Harvey — vertical AI for elite firms, $80M Series B from Sequoia",
      ],
      trends: [
        "EU AI Act creating compliance budget line items in every law firm by 2026",
        "Lateral partner moves accelerating — firms desperate for associate-leverage tools",
        "LLM accuracy on legal benchmarks crossed human-expert threshold in Q4 2025",
      ],
      pivots: [
        "Ravel Law pivoted from B2C legal search to enterprise analytics before acquisition",
        "Atrium pivoted from law-firm-as-a-service to pure SaaS — too late, shut down",
        "Casetext pivoted from research SaaS to AI co-pilot, acquired by Thomson Reuters for $650M",
      ],
    },
  },
  actions: {
    sectionBody:
      "Eight prioritized actions. P0 = blocking. P1 = ship in 30 days. Skipping a P0 invalidates the thesis below. This is the operating plan, not a wishlist.",
    titleHead: "WHAT TO DO",
    titleHl: "NEXT 90 DAYS.",
    items: [
      { p: "P0", w: "THIS WEEK", title: "Lock 3 pilot LOIs",                       detail: "Convert verbal interest into 24-month conditional contracts. Without this, the moat thesis is fiction.", owner: "FOUNDER" },
      { p: "P0", w: "THIS WEEK", title: "Launch ROI calculator landing",            detail: "Public-facing tool. SEO + lead magnet. Lower CAC anchor.", owner: "GROWTH" },
      { p: "P1", w: "30 DAYS",   title: "Hire AE w/ Iberian legal network",         detail: "Senior, not junior. Outbound legal cycle is 6+ months — needs warm intros.", owner: "FOUNDER" },
      { p: "P1", w: "30 DAYS",   title: "Ship Word + Outlook plugin",               detail: "Embed in the workflow lawyers already use. Reduces adoption inertia.", owner: "ENG" },
      { p: "P1", w: "30 DAYS",   title: "Citation verification layer",              detail: "Hard prerequisite for liability story. Mitigates HIGH-severity risk.", owner: "ENG" },
      { p: "P2", w: "60 DAYS",   title: "Partnership w/ Ordem dos Advogados",       detail: "Sponsor 1 event, co-author 1 whitepaper. Distribution lever.", owner: "FOUNDER" },
      { p: "P2", w: "60 DAYS",   title: "Publish 3 design-partner case studies",    detail: "Social proof asset. Reuse in every sales motion.", owner: "MARKETING" },
      { p: "P3", w: "90 DAYS",   title: "Open Series Seed conversations",           detail: "Don't raise yet — line up 5 warm investors. Run process when MRR > €10K.", owner: "FOUNDER" },
    ],
    bottomLineLabel: "THE BOTTOM LINE",
    bottomLineHeadline: "90 DAYS. 3 PILOTS. €10K MRR.",
    bottomLineBody:
      "Hit those three, the thesis holds and you raise on your terms. Miss any one, kill the company or pivot the wedge. There is no third option.",
  },
  nextDebate: {
    headlineHead: "Re-run the panel with the",
    headlineHl: "fixes shipped",
    headlineTail: "and watch the score move.",
    primaryCta: "BOOK NEXT DEBATE",
    secondaryCta: "EXPORT PDF",
  },
};
