export type Verdict = "GO" | "CAUTION" | "NO-GO";
export type PersonaName = "Investor" | "Customer" | "Operator" | "Adversary" | "Mentor";

export type DossierPersona = {
  persona: PersonaName;
  archetype: string;
  verdict: Verdict;
  confidence: number;
  quote: string;
  pullQuote: string;
};

export type DossierRisk = {
  id: string;
  title: string;
  severity: "HIGH" | "MED" | "LOW";
  evidenceGap: number;
  nextStep: string;
};

export type DossierScore = {
  label: string;
  score: number;
  note: string;
};

export const exampleDossier = {
  caseId: "№017 / 2026",
  title: "Linden — rideshare for elders",
  oneLiner:
    "A concierge rideshare built for seniors. Trained drivers, family-pays billing, same driver every week, and phone-only booking. Priced for the daughter, designed for the parent.",
  date: "03 May 2026",
  time: "03:14",
  verdict: "CAUTION" as Verdict,
  score: 62,
  thesis:
    "The buyer pain is real and the emotional pull is strong — but unit economics are brutal at city scale, Uber Health is already circling, and the insurance class alone eats the margin advantage.",
  recommendation:
    "Run 30 recurring rides by hand in one city. Measure rebooking rate and family willingness-to-pay at $22/ride. Secure one senior-auto insurance LOI before writing code. Don't build the marketplace — build the trust.",
  scores: [
    { label: "Problem fit", score: 82, note: "Adult children already coordinate rides manually every week. Burnout, missed work, frayed relationships. The pain is visceral and recurring." },
    { label: "Market pull", score: 68, note: "65+ population growing 3.2% YoY. But serviceable market is hyperlocal — one city at a time, dense metro areas only." },
    { label: "Timing", score: 74, note: "Post-COVID seniors more open to ride services. Uber/Lyft still haven't built senior-specific UX. Window is 12–18 months before they notice." },
    { label: "Business model", score: 48, note: "Senior-auto insurance runs 1.8× baseline. Driver training costs $400/head. Family-pays billing adds payment infrastructure complexity." },
    { label: "Competition", score: 44, note: "Uber Health, GoGoGrandparent, NEMT fleets, and family & friends (free). The status quo — free rides from family — is the #1 competitor." },
    { label: "Execution edge", score: 58, note: "Founder has elder-care background. Pre-existing relationships with senior centers. No technical moat yet — the moat is trust and driver quality." },
  ] as DossierScore[],
  personas: [
    {
      persona: "Investor",
      archetype: "Series A partner, marketplace focus",
      verdict: "CAUTION",
      confidence: 0.68,
      pullQuote: "Show me the unit economics work at $22 per ride with 1.8× insurance.",
      quote:
        "The emotional story is a 10 out of 10. Every LP has a parent. But the math is hard. Senior-auto commercial insurance runs 1.8× baseline — that alone eats your margin advantage over Uber. Driver training at $400/head means you need 90%+ retention or you're bleeding onboarding cost. Family-pays billing is a wedge they can't easily copy, but it's a billing feature, not a moat. Show me 30 rides with rebooking data and a signed insurance LOI before I write a check.",
    },
    {
      persona: "Customer",
      archetype: "Adult daughter, manages parent's care",
      verdict: "GO",
      confidence: 0.89,
      pullQuote: "I'd pay $22 a ride to stop missing work every Tuesday.",
      quote:
        "I drive my mom to dialysis every Tuesday and Thursday. I've missed work 11 times this year. I tried Uber once — she couldn't figure out the app, the driver didn't help her to the door, and she called me crying. If your driver is trained, shows up on time, and is the same person every week, I'd pay $22 a ride without thinking. The trust piece is everything. My mom won't get in a stranger's car. But if it's 'her driver Dave,' she'll go happily.",
    },
    {
      persona: "Operator",
      archetype: "Ex-Lyft ops, city launcher",
      verdict: "CAUTION",
      confidence: 0.72,
      pullQuote: "The hard part is not the app. It's the first 15 drivers.",
      quote:
        "The hard part is not the app. It's driver training, insurance, no-show handling, and quality control in the first city. You need 15 drivers to cover a metro area with reliable scheduling. Each one needs CPR training, fall-risk awareness, and a clean background check beyond what Uber requires. Your dispatch is manual at first — that's fine. But the moment you hit 50 rides/week, you need scheduling software or you'll drown in WhatsApp messages. Don't build the marketplace. Build the operations manual.",
    },
    {
      persona: "Adversary",
      archetype: "Cynical marketplace investor",
      verdict: "NO-GO",
      confidence: 0.61,
      pullQuote: "Uber Health ships senior features and you're roadkill.",
      quote:
        "Uber has 7 million drivers. Lyft has 2 million. GoGoGrandparent already solved phone-only booking a decade ago. Uber Health is already in 3,000 healthcare facilities. The moment senior rideshare shows traction, Uber adds a 'trained driver' badge and a family billing toggle — two product sprints. Your wedge is trust and driver quality, which doesn't scale. You're building a local services company cosplaying as a tech startup. The exit is a $5M acqui-hire, not a venture outcome.",
    },
    {
      persona: "Mentor",
      archetype: "Two-time marketplace founder",
      verdict: "GO",
      confidence: 0.78,
      pullQuote: "Run 30 rides by hand. The rebooking rate is your answer.",
      quote:
        "Don't build the marketplace yet. Run 30 recurring rides by hand in one zip code. Measure rebooking rate — if 70%+ of riders keep the same driver across 4 weeks, you have something Uber structurally cannot copy. Their model is algorithmic matching; yours is relationship matching. That's not a feature difference, it's an architecture difference. The Adversary is right that Uber can add a badge. But they can't give Mom 'the same driver every Tuesday' without breaking their dispatch model. Prove that, then raise.",
    },
  ] as DossierPersona[],
  risks: [
    {
      id: "01",
      title: "Uber Health or Lyft ship senior-specific features",
      severity: "HIGH",
      evidenceGap: 0.31,
      nextStep: "Document defensibility beyond surface features — driver relationships, family billing architecture",
    },
    {
      id: "02",
      title: "Senior-auto insurance class eats unit margins",
      severity: "HIGH",
      evidenceGap: 0.22,
      nextStep: "Secure underwriter LOI; get 3 carrier quotes; model breakeven at $22/ride",
    },
    {
      id: "03",
      title: "Driver retention below 80% burns onboarding investment",
      severity: "HIGH",
      evidenceGap: 0.38,
      nextStep: "Design driver incentive structure; survey 20 potential drivers on pay expectations",
    },
    {
      id: "04",
      title: "Family willingness-to-pay ceiling below $22/ride",
      severity: "MED",
      evidenceGap: 0.44,
      nextStep: "Run 30 paid rides; measure price sensitivity at $18, $22, $28 tiers",
    },
    {
      id: "05",
      title: "Liability exposure from fall injuries or medical incidents during rides",
      severity: "HIGH",
      evidenceGap: 0.29,
      nextStep: "Consult plaintiff counsel; spec liability waiver; price umbrella policy",
    },
    {
      id: "06",
      title: "Hyperlocal density — not enough riders per zip code to sustain drivers",
      severity: "MED",
      evidenceGap: 0.52,
      nextStep: "Map senior density by zip; identify 3 launch metros with highest concentration",
    },
  ] as DossierRisk[],
  nextActions: [
    { id: "01", text: "Run 30 paid rides by hand in one metro zip code", eta: "4w" },
    { id: "02", text: "Measure rebooking rate — target 70%+ same-driver retention", eta: "6w" },
    { id: "03", text: "Secure senior-auto insurance LOI from one carrier", eta: "8w" },
    { id: "04", text: "Recruit and train first 15 drivers (CPR, fall-risk, dementia awareness)", eta: "10w" },
    { id: "05", text: "Build family-pays billing prototype on Stripe", eta: "12w" },
  ],
};

export type ExampleDossier = typeof exampleDossier;
