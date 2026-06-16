// Shared mock content for the post-validation business-creation flow.
// Example idea is carried over from the validation report (legal-tech SaaS).

export const IDEA = {
  title: "AI legal-document drafting for Iberian law firms",
  pitch:
    "A SaaS platform for mid-sized law firms in Portugal and Spain that automates the creation of legal documents using AI.",
  viability: 61,
  verdict: "PROCEED WITH CAUTION",
  band: "TOP 50%",
  tam: "€60M",
  sam: "€18M",
  som: "€2.2M",
  price: "€89 / seat / mo",
};

export const TICKER = [
  { tag: "IDEA", text: "AI LEGAL DRAFTING — IBERIA", color: "#007aff" },
  { tag: "SCORE", text: "VIABILITY 61/100 · VERDICT CAUTION", color: "#ffd60a" },
  { tag: "MARKET", text: "TAM €60M · SAM €18M · SOM €2.2M", color: "#32d74b" },
  { tag: "BRAND", text: "IDENTITY LOCKED · MINUTA", color: "#ff3b30" },
  { tag: "LAUNCH", text: "SHIP-IN-24H KIT GENERATED", color: "#007aff" },
  { tag: "CAMPAIGN", text: "4 VIDEO AD CUTS · €500 TEST", color: "#32d74b" },
  { tag: "PAGE", text: "LANDING HTML EXPORTED · WP/SHOPIFY", color: "#ffd60a" },
];

export const BRAND = {
  name: "MINUTA",
  pronunciation: "/miˈnuta/ — the word lawyers in PT & ES use for a draft.",
  alternates: ["Cláusula", "TOGA", "Parecer"],
  rationale:
    "“Minuta” is the exact term lawyers in Portugal and Spain use for a document draft. The brand owns the category verb — “make me a minuta” already means “draft this”.",
  taglines: [
    "Your first draft, already written.",
    "Drafts in minutes. Defensible in court.",
    "Less billable hours. More billable work.",
  ],
  oneLiner:
    "MINUTA turns a one-line brief into a court-ready first draft of any contract, NDA or pleading — in native Portuguese and Spanish legal language, in minutes.",
  boilerplateShort:
    "MINUTA is AI drafting built for Iberian law firms. From brief to editable, house-style draft in minutes.",
  boilerplateLong:
    "MINUTA is an AI drafting copilot built specifically for mid-sized law firms in Portugal and Spain. It turns a short brief into a court-ready first draft — grounded in the firm's own templates and approved clauses, written in native PT/ES legal language. Partners review instead of rewrite, cutting routine drafting time by up to 70%.",
  palette: [
    { name: "Oxblood", hex: "#6B1F2A", note: "Authority, legal gravitas" },
    { name: "Parchment", hex: "#F3EEE3", note: "Document surface" },
    { name: "Ink", hex: "#14110F", note: "Body text" },
    { name: "Seal Gold", hex: "#C8A24B", note: "Accent / trust mark" },
    { name: "Signal", hex: "#FF3B30", note: "Action / CTA" },
  ],
  type: [
    { role: "Display", font: "Spectral", note: "Editorial serif — reads like a legal document, not a startup." },
    { role: "Body", font: "Inter", note: "Neutral, legible UI text." },
    { role: "Mono", font: "JetBrains Mono", note: "Clause refs, metadata, version tags." },
  ],
  voice: [
    { p: "Precise, not pompous", d: "Say exactly what it does. No legalese theatre." },
    { p: "Confident, never reckless", d: "We draft — the lawyer decides. Always." },
    { p: "Plain language, legal rigor", d: "A partner and a paralegal both understand it." },
  ],
  dos: ["“Court-ready first draft”", "“Review, don't rewrite”", "“Your templates, enforced”"],
  donts: ["“Replace your lawyers”", "“100% automated”", "“AI magic”"],
};

export const PRODUCT_PAGE = {
  headline: "Stop drafting from scratch.",
  subhead:
    "MINUTA writes court-ready first drafts of contracts, NDAs and pleadings in Portuguese and Spanish — in minutes, from a one-line brief.",
  valueProps: [
    {
      title: "Brief to draft in 4 minutes",
      body: "Type the matter, pick the document type, get an editable draft grounded in your firm's templates.",
    },
    {
      title: "Iberian law, natively",
      body: "Built on PT/ES legal language and clause libraries — not a US tool with a translation bolted on.",
    },
    {
      title: "Your templates, enforced",
      body: "Every draft follows your house style and approved clauses. Partners review, never rewrite.",
    },
  ],
  pricing: [
    { name: "Solo", price: "€89", per: "/seat · mo", note: "1–4 seats", cta: "Start free draft" },
    { name: "Firm", price: "€69", per: "/seat · mo", note: "5+ seats", featured: true, cta: "Book a pilot" },
    { name: "Enterprise", price: "Custom", per: "", note: "SSO · DPA · on-prem", cta: "Talk to us" },
  ],
  primaryCta: "Book a 20-min pilot",
  secondaryCta: "See a sample draft",
};

export const ACQUISITION = [
  {
    n: "01",
    channel: "Founder-led LinkedIn",
    target: "Managing partners & legal-ops leads at 20–80-lawyer firms",
    why: "Your unfair advantage is founder credibility in Iberian legal-tech. Warm, personal DMs out-convert any ad at this stage.",
    cadence: "10 hyper-targeted DMs/day · 2-step (connect → value note 48h later)",
    sample:
      "Hi {name} — saw {firm} handles a lot of corporate work. Quick one: how many partner-hours go into first drafts of NDAs/contracts each week? Building something that turns a brief into a house-style draft in minutes (PT/ES). Worth a 15-min look?",
  },
  {
    n: "02",
    channel: "Iberian legal communities",
    target: "r/advogados, r/Abogacia, OA/ICAB forums, legal-tech Slack & Discord",
    why: "Lawyers trust peers, not vendors. Show up as a useful operator answering drafting pain — not as an ad.",
    cadence: "2 value posts/week + daily helpful replies for 3 weeks",
    sample:
      "I timed how long 5 Iberian firms spend on routine first drafts. Median: 3.2 partner-hours/week just re-typing boilerplate. Here's the template stack that cut it to <40 min — and where AI actually helps (and where it dangerously doesn't).",
  },
  {
    n: "03",
    channel: "Cold email — mid-sized firms",
    target: "Sourced from bar directories (PT Ordem dos Advogados, ES ICAB) — 20–80 lawyers",
    why: "Predictable, scalable, and partners still read email. A tight 3-step sequence books pilots while you sleep.",
    cadence: "25 sends/day · 3-email sequence over 8 days",
    sample:
      "Subject: 3 partner-hours/week back at {firm}\n\n{name} — first drafts of contracts and NDAs eat partner time that should be billable strategy. MINUTA turns a brief into a court-ready PT/ES draft in minutes, using your templates. 3 Iberian firms are piloting now. Open to being the 4th?",
  },
];

export const COLD_MESSAGES = [
  "Hi {name} — quick one: how many partner-hours/week go into first drafts of routine contracts at {firm}? Building a tool that turns a brief into a house-style PT/ES draft in minutes. Worth 15 min?",
  "{name}, saw {firm} does a lot of corporate/commercial work. We cut routine drafting time ~70% for mid-sized Iberian firms. Can I send a 90-sec demo?",
  "Hi {name} — not selling, genuinely researching: what's your firm's biggest time-sink that *isn't* billable? For most it's first drafts. Curious if that's true for you.",
  "{name}, you posted about associate burnout — a chunk of that is re-typing boilerplate. MINUTA drafts the first version in your templates so they review, not rewrite. Open to a look?",
  "Hi {name} — we're picking 10 founding Iberian firms to shape MINUTA (AI drafting, PT/ES). 50% off for a year for honest feedback. {firm} would be a great fit — interested?",
  "{name}, how do you currently keep clause language consistent across associates? MINUTA enforces your approved clauses on every draft. Happy to show you in 10 min.",
  "Hi {name} — what doc type eats the most time at {firm}: NDAs, employment contracts, or pleadings? Whichever it is, I can show a court-ready draft generated in <4 min.",
  "{name}, congrats on the {firm} expansion. More lawyers = more drafting drift. We standardize first drafts to your house style automatically. Worth a quick call?",
  "Hi {name} — would a court-ready first draft of a standard NDA in 3 minutes (in your template, PT) be useful, or is that not your bottleneck? Genuinely asking before I build more.",
  "{name}, last one I promise — sending a 60-sec video of MINUTA drafting a real contract in Portuguese. If it's not relevant just say 'no' and I'll stop. Cool?",
  "Hi {name} — does {firm} use fixed templates for NDAs, or does every associate start from a blank page? If it's the latter, I can show you a 5-minute fix.",
  "{name}, what's worse at {firm}: the hours spent drafting, or the partner time spent fixing junior drafts? MINUTA shrinks both. 10-min demo?",
  "Hi {name} — I'm validating before building more. Would your firm pay €89/seat for court-ready PT/ES first drafts in minutes? Brutal honesty welcome.",
  "{name}, you mentioned hiring more paralegals. Before you do — most of that workload is repeatable drafting MINUTA already handles. Worth comparing the math?",
  "Hi {name} — quick favour, not a pitch: what document type would you NEVER trust to AI? Trying to find the real line between useful and reckless in legal drafting.",
  "{name}, we just shipped Spanish labour-contract templates. {firm} does a lot of employment work — want early access before we open it up?",
  "Hi {name} — if I handed you a court-ready first draft of your most common document right now, would that save real time or just shift it? Genuinely asking.",
  "{name}, founders in our pilot say the win isn't speed — it's consistency across associates. Is clause drift a problem at {firm} as you scale?",
  "Hi {name} — 2 of the 10 founding spots are taken by Lisbon firms. Madrid is still open. Want me to hold one for {firm} while you take a look?",
  "{name}, simple question: if your associates could review drafts instead of writing them from zero, how many more matters could {firm} take on a month?",
];

export const REDDIT_POSTS = [
  {
    sub: "r/advogados",
    title: "Cronometrei quanto tempo 5 escritórios gastam em minutas. O resultado assustou-me.",
    body: "Mediana: 3,2 horas de sócio/semana só a redigir boilerplate. Partilho o stack de templates que reduziu isto para <40 min e onde a IA ajuda mesmo (e onde é perigosa).",
  },
  {
    sub: "r/Abogacia",
    title: "¿Cuánto tiempo facturable pierdes redactando primeros borradores?",
    body: "He hablado con 12 despachos medianos. Casi todos subestiman el coste. Aquí está el desglose y un experimento con IA para borradores en español jurídico.",
  },
  {
    sub: "r/legaltech",
    title: "Why most 'AI for lawyers' tools fail in non-English jurisdictions",
    body: "Translation layers butcher legal nuance. Built a drafting tool trained natively on PT/ES legal language + firm clause libraries. Sharing what worked and what broke.",
  },
  {
    sub: "r/smallbusiness",
    title: "We're giving 10 founding customers 50% off for a year — here's the catch",
    body: "Building drafting software for small/mid law firms. We only want 10 firms now, and you have to actually give feedback weekly. Honest experiment in customer-led building.",
  },
  {
    sub: "r/SaaS",
    title: "Niche down brutally: from 'AI legal tool' to 'PT/ES drafting for 20–80-lawyer firms'",
    body: "Our debate panel scored us 45/100 on moat. Narrowing the beachhead this hard is how we're trying to fix it. Roast the positioning.",
  },
];

export const X_HOOKS = [
  "Lawyers don't fear AI. They fear re-typing the same NDA for the 400th time. We fixed the second one.",
  "We niched down from “AI for lawyers” to “PT/ES drafting for 20–80-lawyer firms.” Pipeline 3x'd in a week. Specificity is the growth hack.",
  "A partner bills €300/h and spends 3 of them re-typing boilerplate. That's a €900/week leak per partner. MINUTA plugs it.",
  "Hot take: every “AI replaces lawyers” startup will die. The ones that say “review, don't rewrite” will win. Tools, not oracles.",
  "First 10 customers > first $10k. We're handpicking 10 Iberian firms and building MINUTA with them in the room. DMs open.",
];

export const OFFER = {
  founding:
    "Founding 10 — 50% off for 12 months + lifetime priority support, locked the moment you give one piece of feedback in week one.",
  beta:
    "Hi {name} — we're opening MINUTA to exactly 10 founding firms. You'd get 50% off for a year and a direct line to me. In return: 15 min of feedback a week for the first month. Want one of the 10 spots?",
  urgency: "10 spots. When they're gone, pricing returns to €89/seat. No fake countdowns — when it's full, it's full.",
  guarantee: "If MINUTA doesn't save your firm 5+ hours in the first 30 days, you pay nothing and keep every draft.",
};

export const CHECKLIST = [
  "Publish the product page (headline + 3 value props + pricing live)",
  "Point a domain — minuta.legal or tryminuta.com",
  "Set up a booking link (Cal.com) for the 20-min pilot",
  "Load the 10 cold messages into LinkedIn — send the first 10 today",
  "Schedule the 5 X hooks + 5 Reddit posts across the week",
  "DM the founding-10 offer to your 10 warmest contacts",
  "Wire a simple intake form (idea brief → email) — no backend needed yet",
  "Set up one inbox rule: every reply gets answered within 2 hours",
];

export const CAMPAIGN = {
  objective: "Turn cold traffic into 10 pilot bookings with a €500 video-ad test.",
  angle:
    "The €900/week leak: every partner re-typing boilerplate instead of billing strategy. Make the cost of the status quo impossible to scroll past.",
  budget: { total: "€500", daily: "€35 / day", window: "14 days" },
  audience:
    "Managing partners & legal-ops at 20–80-lawyer firms in PT & ES. Interests: legal tech, practice management, contract automation, Clio.",
  kpis: [
    { k: "Target CPA", v: "≤€50", c: "#ff3b30" },
    { k: "Hook rate", v: ">30%", c: "#007aff" },
    { k: "Ad cuts", v: "4", c: "#32d74b" },
    { k: "Test budget", v: "€500", c: "#ffd60a" },
  ],
  budgetSplit: [
    { platform: "YouTube", pct: 35, amount: "€175", color: "#FF0000" },
    { platform: "Meta (IG/FB)", pct: 35, amount: "€175", color: "#007aff" },
    { platform: "TikTok", pct: 20, amount: "€100", color: "#1d1d1f" },
    { platform: "LinkedIn", pct: 10, amount: "€50", color: "#0a66c2" },
  ],
  ads: [
    {
      id: "yt-leak",
      platform: "YouTube",
      color: "#FF0000",
      format: "Skippable pre-roll",
      duration: "0:15",
      aspect: "16:9",
      concept: "The €900 Leak",
      hook: "\u201CYour best partner just spent 3 hours re-typing an NDA.\u201D",
      scenes: [
        { t: "0:00", visual: "Close-up: tired lawyer typing, clock spinning fast", line: "VO: Your best partner just spent three hours\u2026" },
        { t: "0:04", visual: "Hard cut \u2014 text slams on screen", line: "ON-SCREEN: \u20AC900 / WEEK. GONE." },
        { t: "0:08", visual: "Screen-record: one-line brief \u2192 full draft in MINUTA", line: "VO: MINUTA drafts it in four minutes." },
        { t: "0:12", visual: "Logo + red CTA button, calm music resolves", line: "CTA: Book a 20-min pilot \u2192" },
      ],
      adCopy: {
        headline: "Stop paying partners to re-type.",
        primary: "MINUTA turns a brief into a court-ready PT/ES draft in minutes. Partners review, never rewrite. Book a 20-min pilot.",
      },
      cta: "Book a pilot",
    },
    {
      id: "reel-demo",
      platform: "Instagram / TikTok",
      color: "#1d1d1f",
      format: "Reel / Short (UGC)",
      duration: "0:20",
      aspect: "9:16",
      concept: "Watch it draft itself",
      hook: "\u201CPOV: you never write a first draft again.\u201D",
      scenes: [
        { t: "0:00", visual: "Phone-shot over the shoulder, real desk", line: "ON-SCREEN: POV: you never write a first draft again" },
        { t: "0:03", visual: "Type one line: \u2018NDA, supplier, mutual, PT\u2019", line: "Captions: one line in\u2026" },
        { t: "0:07", visual: "Draft fills the screen, scrolling", line: "Captions: \u2026court-ready draft out. 4 minutes." },
        { t: "0:16", visual: "Founder to camera + sticker CTA", line: "CTA: Link in bio \u2192 try a free draft" },
      ],
      adCopy: {
        headline: "Your first draft, already written.",
        primary: "Native PT/ES legal drafting in minutes. Try a free draft \u2014 link in bio.",
      },
      cta: "Try a free draft",
    },
    {
      id: "meta-testimonial",
      platform: "Meta Feed",
      color: "#007aff",
      format: "Talking-head testimonial",
      duration: "0:30",
      aspect: "1:1",
      concept: "The partner who got her evenings back",
      hook: "\u201CI bill the same hours. I just stopped wasting them.\u201D",
      scenes: [
        { t: "0:00", visual: "Partner at her desk, warm light, to camera", line: "\u201CI bill the same hours. I just stopped wasting them.\u201D" },
        { t: "0:08", visual: "B-roll: she reviews a draft on screen", line: "VO: First drafts used to eat my Fridays." },
        { t: "0:18", visual: "Before/after time counter: 35 min \u2192 4 min", line: "ON-SCREEN: 35 min \u2192 4 min" },
        { t: "0:26", visual: "Logo lockup + CTA", line: "CTA: See how \u2192 minuta.legal" },
      ],
      adCopy: {
        headline: "Review, don\u2019t rewrite.",
        primary: "Mid-sized Iberian firms cut first-draft time ~70% with MINUTA. See a 90-second demo.",
      },
      cta: "See the demo",
    },
    {
      id: "li-founder",
      platform: "LinkedIn",
      color: "#0a66c2",
      format: "Founder POV",
      duration: "0:25",
      aspect: "1:1",
      concept: "Why we built MINUTA",
      hook: "\u201CI watched a \u20AC300/hour lawyer do \u20AC12/hour work.\u201D",
      scenes: [
        { t: "0:00", visual: "Founder to camera, office background", line: "\u201CI watched a \u20AC300-an-hour lawyer do \u20AC12-an-hour work.\u201D" },
        { t: "0:07", visual: "Cut to screen-record of the draft flow", line: "VO: So we built drafting that speaks Iberian legal natively." },
        { t: "0:16", visual: "Text: \u2018Review, don\u2019t rewrite\u2019", line: "VO: Partners decide. The AI just types." },
        { t: "0:22", visual: "CTA card", line: "CTA: Pilot it with your firm \u2192" },
      ],
      adCopy: {
        headline: "Built for Iberian firms, not translated for them.",
        primary: "AI drafting on PT/ES legal language and your templates. Pilot it with your firm.",
      },
      cta: "Request a pilot",
    },
  ],
  adAccounts: [
    { name: "Google Ads", color: "#FF0000" },
    { name: "Meta Ads", color: "#007aff" },
    { name: "TikTok Ads", color: "#1d1d1f" },
    { name: "LinkedIn Ads", color: "#0a66c2" },
  ],
};

export const JOURNEY = [
  { n: "01", stage: "Validate", artifact: "6-dimension viability score · 61/100", state: "done", href: "/" },
  { n: "02", stage: "Debate", artifact: "5-persona stress-test transcript", state: "done", href: "/" },
  { n: "03", stage: "Results", artifact: "Investor-grade dossier + score lab", state: "done", href: "/" },
  { n: "04", stage: "Brand", artifact: "MINUTA — name, palette, voice", state: "done", href: "/brand-kit" },
  { n: "05", stage: "Launch", artifact: "Product page, 3 channels, outreach pack", state: "done", href: "/launch-kit" },
  { n: "06", stage: "Campaign", artifact: "4 video ad cuts + scripts & storyboards", state: "done", href: "/campaign" },
  { n: "07", stage: "Landing", artifact: "Conversion page — HTML + WP/Shopify", state: "done", href: "/landing-builder" },
  { n: "08", stage: "Ship", artifact: "24-hour launch checklist", state: "current", href: "/ship" },
];
