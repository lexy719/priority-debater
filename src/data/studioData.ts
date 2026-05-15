// Shared mock data for the Founder Studio showcase pages (Brand Kit, Landing Page, Pitch Deck)
// All derived from the validated idea so the kit feels like a real downstream artefact.

export const project = {
  code: "CARGOBYTE",
  fullName: "Cargobyte Mobility",
  descriptor: "Autonomous e-cargo fleet for last-mile B2B logistics.",
  domain: "cargobyte.eu",
};

// ─── BRAND KIT ────────────────────────────────────────────────────────────────
export const brand = {
  taglineOptions: [
    "ZERO EMISSIONS. ZERO EXCUSES.",
    "THE LAST MILE, REDESIGNED.",
    "FLEETS, REINVENTED FOR 2030.",
    "DELIVERY WITHOUT THE DIESEL.",
  ],
  palette: [
    { name: "INK", hex: "#0A0A0A", role: "Primary surface", contrast: "#FFFFFF" },
    { name: "PAPER", hex: "#F4F3EF", role: "Canvas / light surface", contrast: "#0A0A0A" },
    { name: "SKY", hex: "#7DD3FC", role: "Signal / accent", contrast: "#0A0A0A" },
    { name: "DEEP", hex: "#38BDF8", role: "Charts / highlight", contrast: "#FFFFFF" },
    { name: "SIGNAL", hex: "#FF3B30", role: "Risk / alert", contrast: "#FFFFFF" },
    { name: "BONE", hex: "#EBE9E2", role: "Sub-surface", contrast: "#0A0A0A" },
  ],
  typography: {
    display: { family: "Anton", role: "Display & headlines", sample: "EVERY ANGLE." },
    mono: { family: "JetBrains Mono", role: "Metadata, ticker, code", sample: "§01 / SYSTEM" },
    body: { family: "Inter", role: "Body & paragraphs", sample: "Engineered for the last mile." },
  },
  voice: [
    { tag: "DIRECT", body: "Short sentences. No marketing fluff. We trust the reader's time." },
    { tag: "ENGINEERED", body: "Numbers over adjectives. We name the kilometre, the kilo, the cost." },
    { tag: "FOUNDER-LED", body: "Written like a builder, not a brand. First person allowed." },
    { tag: "NEVER PREACHY", body: "Sustainability is a footnote, never the hero. We earn the bonus." },
  ],
  logoVariants: [
    { id: "monogram", label: "MONOGRAM", note: "MAX 32 PX · FAVICON, APP ICON" },
    { id: "wordmark", label: "WORDMARK", note: "STANDALONE PRODUCT MARK" },
    { id: "lockup", label: "LOCKUP", note: "PRIMARY BRAND LOCKUP" },
  ],
};

// ─── TYPOGRAPHY SCALE ────────────────────────────────────────────────────────
export const typeScale = [
  { token: "DISPLAY / H1", size: "112 / 88 PX", lh: "0.88", role: "Hero · landing & deck cover", sample: "EVERY ANGLE." },
  { token: "DISPLAY / H2", size: "72 / 64 PX", lh: "0.92", role: "Section openers", sample: "ONE STACK." },
  { token: "DISPLAY / H3", size: "44 / 36 PX", lh: "1.0", role: "Sub-headlines", sample: "Defensible by design." },
  { token: "BODY / LEAD", size: "18 PX", lh: "1.45", role: "Intro paragraphs", sample: "Built for fleets that move things." },
  { token: "BODY / DEFAULT", size: "14 PX", lh: "1.55", role: "Long-form copy", sample: "Cargobyte replaces diesel last-mile delivery with autonomous e-cargo fleets." },
  { token: "META / MONO", size: "11 PX", lh: "1.4", role: "Labels · ticker · timestamps", sample: "§02 / SYSTEM · 02-2026" },
  { token: "LABEL / MICRO", size: "10 PX", lh: "1.2", role: "All-caps badges & chips", sample: "◆ STRESS-TEST COMPLETE" },
];

// ─── ICON SET (matches lucide-react import names) ────────────────────────────
export const iconSet = [
  { name: "ROUTE", icon: "Route", use: "Last-mile path" },
  { name: "BATTERY", icon: "BatteryCharging", use: "Energy state" },
  { name: "CARGO", icon: "Package", use: "Drop payload" },
  { name: "MAP", icon: "MapPin", use: "Hub / dropzone" },
  { name: "BIKE", icon: "Bike", use: "Vehicle SKU" },
  { name: "SENSOR", icon: "Radar", use: "Autonomy telemetry" },
  { name: "GAUGE", icon: "Gauge", use: "Speed / SLA" },
  { name: "BOLT", icon: "Zap", use: "Energy / charge" },
  { name: "LEAF", icon: "Leaf", use: "Carbon claim" },
  { name: "CHIP", icon: "Cpu", use: "On-board compute" },
  { name: "API", icon: "Plug", use: "Integration / API" },
  { name: "SLA", icon: "ShieldCheck", use: "Uptime guarantee" },
];

// ─── EXPORT TARGETS (paywalled) ──────────────────────────────────────────────
export const exportTargets = [
  { id: "figma", label: "FIGMA · BRAND FILE", note: "Auto-Layout · variables · 240 components", tier: "BUILDER" },
  { id: "framer", label: "FRAMER · LANDING", note: "Live components · CMS-ready", tier: "BUILDER" },
  { id: "webflow", label: "WEBFLOW · LANDING", note: "Tailwind + CMS · 1-click sync", tier: "FOUNDER" },
  { id: "keynote", label: "KEYNOTE · DECK", note: "10 slides · brand-locked", tier: "BUILDER" },
  { id: "notion", label: "NOTION · MEMO", note: "Investor memo + transcripts", tier: "STARTER" },
  { id: "zip", label: "ZIP · LOGO PACK", note: "SVG · PNG · PDF · 18 surfaces", tier: "STARTER" },
];

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
export const landingThemes = [
  { id: "editorial", label: "EDITORIAL", bg: "#F4F3EF", fg: "#0A0A0A", note: "Brutalist · default" },
  { id: "ink", label: "INK", bg: "#0A0A0A", fg: "#FFFFFF", note: "Dark · investor mode" },
  { id: "sky", label: "SKY", bg: "#E8F6FE", fg: "#0A0A0A", note: "Light blue · launch mode" },
];

export const landingHeroVariants = [
  {
    id: "cost",
    kicker: "FOR FLEET CFOs",
    title: "€0.42 PER DROP. NO DIESEL.",
    sub: "Cargobyte replaces diesel last-mile with autonomous e-cargo fleets — at a third of the per-drop cost. Real contracts. Real metrics. Real margins.",
    cta: "BOOK A PILOT",
  },
  {
    id: "story",
    kicker: "FOR FOUNDERS WHO MOVE THINGS",
    title: "THE LAST MILE, REDESIGNED.",
    sub: "Autonomous e-cargo bikes plus a fleet OS, engineered for the European logistics stack. Built by operators, for operators.",
    cta: "SEE THE FLEET",
  },
  {
    id: "compliance",
    kicker: "EU 2035 / ICE BAN READY",
    title: "DELIVERY WITHOUT THE DIESEL.",
    sub: "Get ahead of the ICE deadline with a fleet that's already compliant, already cheaper, already deployed in three metros.",
    cta: "CHECK ELIGIBILITY",
  },
];

export const landingSections = [
  { id: "hero", label: "HERO", required: true },
  { id: "logos", label: "LOGO BAR", required: false },
  { id: "problem", label: "THE PROBLEM", required: true },
  { id: "product", label: "PRODUCT GRID", required: true },
  { id: "metrics", label: "TRACTION METRICS", required: false },
  { id: "quote", label: "OPERATOR QUOTE", required: false },
  { id: "pricing", label: "PRICING TEASER", required: false },
  { id: "cta", label: "FINAL CTA", required: true },
];

export const landingFeatures = [
  { kicker: "OS", title: "FLEET COMMAND", body: "One pane for routing, tele-op, billing, SLAs." },
  { kicker: "HW", title: "CARGOBYTE-01", body: "240kg payload, 80km range, swap-pack battery." },
  { kicker: "AI", title: "AUTONOMY+", body: "Tele-op fallback today. L4 in 30% of routes by Q4 2027." },
  { kicker: "SLA", title: "99.2% UPTIME", body: "12h replacement promise. Pre-signed network DE / NL / FR." },
  { kicker: "ESG", title: "AUDITED CARBON", body: "Tier-1 verified per-drop emissions reporting." },
  { kicker: "API", title: "OPEN INTEGRATIONS", body: "Plug into SAP, Oracle TMS, Shopify, custom WMS." },
];

export const landingMetrics = [
  { v: "26,606", l: "ROUTES PILOTED" },
  { v: "€0.42", l: "COST PER DROP" },
  { v: "99.2%", l: "FLEET UPTIME" },
  { v: "T-3", l: "EU METROS LIVE" },
];

export const landingQuote = {
  body: "If you can hit €0.42 per drop at scale, I sign a 3-year contract today.",
  author: "Sam Okafor",
  role: "Ops Director, EU regional 3PL",
};

// ─── PITCH DECK ───────────────────────────────────────────────────────────────
export const deck = [
  {
    no: "01",
    kicker: "PROBLEM",
    title: "LAST-MILE IS BROKEN.",
    body: "Diesel TCO +34% YoY. City-centre access bans in 18 EU metros by 2027. Same-day expectation is now baseline, but unit economics aren't.",
    stat: { v: "+34%", l: "DIESEL COST YOY" },
  },
  {
    no: "02",
    kicker: "SOLUTION",
    title: "AUTONOMOUS E-CARGO FLEETS, AS A SERVICE.",
    body: "Vertical hardware + autonomy + fleet OS. We replace diesel last-mile at a third of the per-drop cost — with an SLA procurement actually signs.",
    stat: { v: "€0.42", l: "PER DROP" },
  },
  {
    no: "03",
    kicker: "MARKET",
    title: "€2.1B TODAY. €4.7B BY 2030.",
    body: "EU last-mile e-cargo SAM growing 22.4% CAGR. We are wedge-positioned in the high-density B2B segment — 46% of total spend.",
    stat: { v: "22.4%", l: "CAGR" },
  },
  {
    no: "04",
    kicker: "PRODUCT",
    title: "CARGOBYTE-01 + FLEET COMMAND OS.",
    body: "240kg payload e-cargo platform with tele-op fallback, paired with a real-time fleet OS — routing, billing, SLA, tele-op, telemetry.",
    stat: { v: "240KG", l: "PAYLOAD" },
  },
  {
    no: "05",
    kicker: "TRACTION",
    title: "1 SIGNED · 4 VERBAL · 12 IN LEGAL.",
    body: "DHL Express LOI signed. 4 named verbal commits in legal review. 12 active mid-market pilots. €18M weighted pipeline in 60 days.",
    stat: { v: "€18M", l: "PIPELINE" },
  },
  {
    no: "06",
    kicker: "MODEL",
    title: "€11,800 / MO PER 10-VEHICLE FLEET.",
    body: "3-tier ladder: Pilot · Fleet · Enterprise. Software-led margin compounds — SaaS revenue dominates by year 3.",
    stat: { v: "€42M", l: "ARR Y5" },
  },
  {
    no: "07",
    kicker: "GTM",
    title: "ANCHOR LOGISTICS PARTNERS FIRST.",
    body: "Two named anchor partners pre-signed before seed close. Q-Commerce VPs and Tier-1 logistics directors are the two-buyer wedge.",
    stat: { v: "T-3", l: "EU METROS" },
  },
  {
    no: "08",
    kicker: "COMPETITION",
    title: "FIVE NAMED. WE SIT TOP-RIGHT.",
    body: "URB-X (hardware-only), Pedal Robotics (no autonomy IP), ZeroFleet (hybrid diesel), Cargonaut (single-city), Velos (no vehicle). We own the full stack.",
    stat: { v: "5", l: "NAMED RIVALS" },
  },
  {
    no: "09",
    kicker: "TEAM",
    title: "OPERATORS WHO'VE SHIPPED.",
    body: "Helena Voss · 3 fleet products shipped, 2 exited. Engineering team from a Tier-1 OEM. Advisor: former CTO of a top-3 EU postal operator.",
    stat: { v: "12", l: "ENGINEERS" },
  },
  {
    no: "10",
    kicker: "ASK",
    title: "€4M SEED · 18-MONTH RUNWAY.",
    body: "Capital deployment: 40% hardware ramp, 30% autonomy R&D, 20% GTM, 10% reserve. Closing in 60 days. Lead has €1.5M committed.",
    stat: { v: "€4M", l: "ROUND SIZE" },
  },
];
