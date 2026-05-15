// Mock data for "Idea Validation Results" dashboard
// Idea being validated:
export const idea = {
    title: "Carbon-neutral last-mile delivery using autonomous e-cargo bikes",
    submittedBy: "Helena Voss",
    submittedAt: "2026-02-11 / 23:48 UTC",
    runtime: "118s",
    model: "claude-sonnet-4.5",
    verdict: "GO", // GO | NO-GO | CONDITIONAL
    confidence: "HIGH",
    confidencePct: 87,
};

export const overallScore = {
    score: 82,
    benchmark: 64, // industry avg
    rank: "Top 12%",
    history: [
        { v: "v1", score: 58 },
        { v: "v2", score: 67 },
        { v: "v3", score: 74 },
        { v: "v4", score: 78 },
        { v: "Final", score: 82 },
    ],
};

export const coldMetrics = [
    { label: "VIABILITY", value: "82", suffix: "/ 100" },
    { label: "CONFIDENCE", value: "HIGH", suffix: "" },
    { label: "TAM", value: "$2.1B", suffix: "global" },
    { label: "SAM", value: "$420M", suffix: "serviceable" },
    { label: "SOM", value: "$42M", suffix: "obtainable" },
    { label: "COMPETITORS", value: "5", suffix: "named" },
];

// Market growth projection
export const marketGrowth = [
    { year: "2024", tam: 1.4, sam: 290, som: 18 },
    { year: "2025", tam: 1.7, sam: 350, som: 28 },
    { year: "2026", tam: 2.1, sam: 420, som: 42 },
    { year: "2027", tam: 2.6, sam: 510, som: 64 },
    { year: "2028", tam: 3.2, sam: 620, som: 92 },
    { year: "2029", tam: 3.9, sam: 740, som: 128 },
    { year: "2030", tam: 4.7, sam: 880, som: 168 },
];

export const marketSignals = [
    { tag: "REGULATORY", label: "EU 2035 ICE ban accelerates demand", weight: "+12 pts" },
    { tag: "BEHAVIOURAL", label: "Same-day expectation now baseline in T1 cities", weight: "+8 pts" },
    { tag: "ECONOMIC", label: "Diesel cost +34% YoY pressures fleets", weight: "+9 pts" },
    { tag: "RISK", label: "Battery cost curve flattening", weight: "-3 pts" },
];

// Risk radar (lower = better; values are risk severity 0-100)
export const riskRadar = [
    { dim: "MARKET", value: 28, full: 100 },
    { dim: "TECH", value: 46, full: 100 },
    { dim: "FINANCIAL", value: 38, full: 100 },
    { dim: "OPERATIONAL", value: 52, full: 100 },
    { dim: "REGULATORY", value: 22, full: 100 },
    { dim: "TEAM", value: 31, full: 100 },
];

export const riskBreakdown = [
    {
        category: "OPERATIONAL",
        severity: "HIGH",
        title: "Fleet maintenance scaling beyond 200 units",
        mitigation: "Pre-sign 2 regional service partners in Q3 before scaling.",
    },
    {
        category: "TECH",
        severity: "MED",
        title: "Autonomy reliability in mixed traffic",
        mitigation: "Phase rollout: tele-op assisted → progressive autonomy.",
    },
    {
        category: "FINANCIAL",
        severity: "MED",
        title: "CapEx per vehicle still €4,800 in 2026",
        mitigation: "Lease-to-own model for fleet operators reduces CAC.",
    },
    {
        category: "MARKET",
        severity: "LOW",
        title: "Late-mover entrants from China (Q4 2027)",
        mitigation: "Lock 3-year contracts with anchor logistics partners.",
    },
    {
        category: "REGULATORY",
        severity: "LOW",
        title: "City-level cargo-bike permitting fragmentation",
        mitigation: "Lobby via EU Bike Industry Federation.",
    },
];

// Competition
export const competitors = [
    { name: "URB-X Mobility", focus: "Hardware-only", price: "€€€", traction: 78, weakness: "No software stack", url: "urb-x.co" },
    { name: "Pedal Robotics", focus: "Fleet SaaS", price: "€€", traction: 62, weakness: "No autonomy IP", url: "pedalr.io" },
    { name: "ZeroFleet", focus: "B2B logistics", price: "€€€€", traction: 84, weakness: "Diesel hybrid only", url: "zerofleet.eu" },
    { name: "Cargonaut", focus: "Last-mile DaaS", price: "€€", traction: 41, weakness: "Single-city pilot", url: "cargonaut.app" },
    { name: "Velos AI", focus: "Autonomy software", price: "€", traction: 55, weakness: "No vehicle partner", url: "velos.ai" },
];

// Scatter: x = autonomy maturity, y = market traction
export const competitorScatter = [
    { x: 22, y: 78, name: "URB-X" },
    { x: 38, y: 62, name: "Pedal" },
    { x: 18, y: 84, name: "ZeroFleet" },
    { x: 12, y: 41, name: "Cargonaut" },
    { x: 76, y: 55, name: "Velos AI" },
    { x: 82, y: 88, name: "YOU", you: true },
];

// Revenue projection (€ M)
export const revenueProjection = [
    { year: "Y1", subs: 0.4, hardware: 1.1, total: 1.5 },
    { year: "Y2", subs: 1.8, hardware: 3.4, total: 5.2 },
    { year: "Y3", subs: 5.6, hardware: 7.2, total: 12.8 },
    { year: "Y4", subs: 12.4, hardware: 11.6, total: 24.0 },
    { year: "Y5", subs: 24.7, hardware: 17.3, total: 42.0 },
];

export const pricingModels = [
    { plan: "PILOT", price: "€2,400 / mo", terms: "1 vehicle, 6-mo min" },
    { plan: "FLEET", price: "€11,800 / mo", terms: "10 vehicles, 24-mo" },
    { plan: "ENTERPRISE", price: "Custom", terms: "100+ vehicles, SLAs" },
];

// Audience
export const audienceSegments = [
    { name: "B2B Logistics", value: 46, color: "#7dd3fc" },
    { name: "Q-Commerce", value: 27, color: "#0a0a0a" },
    { name: "Postal / Mail", value: 17, color: "#38bdf8" },
    { name: "Municipal", value: 10, color: "#cfe9ff" },
];

export const personas = [
    {
        title: "Fleet Operations Director",
        org: "Tier-1 logistics, EU",
        budget: "€2M+ / yr",
        pain: "Diesel TCO + city-center access bans",
        why: "Direct cost saving + compliance",
    },
    {
        title: "Q-Commerce VP",
        org: "Grocery 15-min vertical",
        budget: "€600k / yr",
        pain: "Unit economics on dense urban routes",
        why: "Lower per-drop CAPEX vs cars",
    },
    {
        title: "Sustainability Officer",
        org: "Retail conglomerate",
        budget: "Capex pooled",
        pain: "Scope 3 emissions reporting",
        why: "Defensible carbon claim w/ data",
    },
];

// SWOT
export const swot = {
    strengths: [
        "Vertical hardware + autonomy stack — full margin capture.",
        "Patentable cargo-balancing algorithm filed Jan 2026.",
        "EU manufacturing → 0% import tariff exposure.",
        "Founder shipped 3 prior fleet products (2 exited).",
    ],
    weaknesses: [
        "Production capacity capped at 480 units / year through Q4.",
        "No US regulatory pathway yet — EU-locked through 2028.",
        "Autonomy still requires tele-op fallback in 18% of routes.",
        "Service network limited to 4 metros at launch.",
    ],
    opportunities: [
        "Postal incumbents are RFP-active for 2027 fleet refresh.",
        "EU CBAM rebates eligible (~9% effective discount).",
        "Adjacent: micro-warehouse network as 2028 expansion.",
    ],
    threats: [
        "Chinese e-cargo OEMs entering EU in Q4 2027.",
        "Lithium price shock (>+22%) breaks unit economics.",
        "Permit fragmentation per municipality slows rollout.",
    ],
};

// AI recommendations
export const recommendations = [
    {
        priority: "P0",
        title: "Lock in 2 anchor logistics partners before seed close",
        impact: "+14 pts viability",
        horizon: "30 days",
        tags: ["GO-TO-MARKET", "FINANCIAL"],
    },
    {
        priority: "P0",
        title: "Phase autonomy: ship tele-op assisted first, defer L4",
        impact: "+11 pts viability",
        horizon: "Q1 → Q3",
        tags: ["TECH", "RISK"],
    },
    {
        priority: "P1",
        title: "Switch CapEx model: lease-to-own for fleet operators",
        impact: "-23% CAC",
        horizon: "Pricing v2",
        tags: ["FINANCIAL", "GTM"],
    },
    {
        priority: "P1",
        title: "Pre-sign 2 regional service partners (DE, NL)",
        impact: "Unblocks scale to 500+ units",
        horizon: "60 days",
        tags: ["OPERATIONAL"],
    },
    {
        priority: "P2",
        title: "File US regulatory pre-application via NHTSA exemption track",
        impact: "Opens 2028 expansion",
        horizon: "Q3 2026",
        tags: ["REGULATORY"],
    },
];

// Persona verdicts (5-Persona Debate)
export const personaVerdicts = [
    {
        name: "Vera Klein",
        role: "SKEPTICAL VC PARTNER",
        accent: "#ff3b30",
        verdict: "CONDITIONAL GO",
        score: 74,
        quote: "Margins are compelling but show me the second logo before I write a term sheet.",
    },
    {
        name: "Marcus Reed",
        role: "VETERAN FOUNDER",
        accent: "#ff8a00",
        verdict: "GO",
        score: 86,
        quote: "Hard tech + regulated tailwind. This is the founder bet I would make in 2026.",
    },
    {
        name: "Anjali Rao",
        role: "TECH ARCHITECT / CTO",
        accent: "#2f6bff",
        verdict: "CONDITIONAL GO",
        score: 71,
        quote: "Don't sell L4 autonomy yet. Ship tele-op, instrument everything, earn the right.",
    },
    {
        name: "Leo Costa",
        role: "MARKETING GURU / CMO",
        accent: "#ffd60a",
        verdict: "GO",
        score: 81,
        quote: "Story sells itself. Lock the ZeroFleet defection narrative before they pivot.",
    },
    {
        name: "Sam Okafor",
        role: "VOICE OF THE CUSTOMER",
        accent: "#ff2d87",
        verdict: "GO",
        score: 88,
        quote: "If you can hit €0.42 per drop at scale, I sign a 3-year contract today.",
    },
];

// Ticker
export const tickerItems = [
    "VIABILITY 82 / 100",
    "VERDICT: GO",
    "CONFIDENCE HIGH",
    "TAM $2.1B → $4.7B BY 2030",
    "5 NAMED COMPETITORS",
    "5 / 5 PERSONAS DEBATED",
    "RUNTIME 118 S",
    "MODEL CLAUDE SONNET 4.5",
    "REPORT V.1.0 / 2026",
    "26,606+ IDEAS VALIDATED",
    "89% PREDICTION ACCURACY",
];
