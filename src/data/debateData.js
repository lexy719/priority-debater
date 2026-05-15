// Debate Mode mock data
// 5 panellists each fire 1 challenge per round. User picks 1 of 3 responses.
// Each response = shield rating (1-3) + persona reaction + flaw caught + recommendation.

export const debateIdea = {
    title: "Carbon-neutral last-mile delivery using autonomous e-cargo bikes",
    one_liner: "Hardware + autonomy stack for B2B logistics fleets across EU metros.",
    stage: "Pre-seed",
    deck_version: "v.1.0 / 2026-02",
};

export const debatePersonas = [
    {
        id: "vera",
        name: "Vera Klein",
        role: "SKEPTICAL VC PARTNER",
        bio: "12 yrs at Tier-1 fund. Killed more pitches than she funded.",
        accent: "#ff3b30",
        lens: "Distribution density, dilution math, second-logo risk.",
        avatar: "VK",
    },
    {
        id: "marcus",
        name: "Marcus Reed",
        role: "VETERAN FOUNDER",
        bio: "3 hard-tech exits. Survived two down-rounds and a recall.",
        accent: "#ff8a00",
        lens: "Survival paths, burn discipline, founder honesty.",
        avatar: "MR",
    },
    {
        id: "anjali",
        name: "Anjali Rao",
        role: "TECH ARCHITECT / CTO",
        bio: "Shipped fleet autonomy at scale. Doesn't believe in demos.",
        accent: "#2f6bff",
        lens: "Roadmap honesty, telemetry, what breaks under load.",
        avatar: "AR",
    },
    {
        id: "leo",
        name: "Leo Costa",
        role: "MARKETING GURU / CMO",
        bio: "Repositioned 4 category-creators. Loves narrative, hates fluff.",
        accent: "#ffd60a",
        lens: "Wedge, ICP language, what closes vs. what charms.",
        avatar: "LC",
    },
    {
        id: "sam",
        name: "Sam Okafor",
        role: "VOICE OF THE CUSTOMER",
        bio: "Runs ops at a regional 3PL. Has signed and torn up MSAs.",
        accent: "#ff2d87",
        lens: "SLAs, real-world failure, procurement friction.",
        avatar: "SO",
    },
];

// One challenge per persona. Each with 3 response options.
export const debateRounds = [
    {
        personaId: "vera",
        challenge:
            "Show me the second logo. One LOI is a press release. I want pipeline density before I write a check at this round size.",
        flaw: "Distribution risk is being hidden behind a single anchor account.",
        options: [
            {
                text: "We've signed 1 LOI with DHL Express plus 4 verbal commits in active legal review — pipeline density is real.",
                strength: 3,
                reaction:
                    "Better. Get those to paper before seed close. Don't show me a deck again without dated contracts.",
                fix: "Convert 2 verbal commits to signed LOIs within 30 days. Add a 'signed' column to your pipeline slide.",
            },
            {
                text: "Market timing matters more than logos right now. Speed wins the category.",
                strength: 1,
                reaction:
                    "Speed without distribution dies in pilot. I've seen this movie. Pass.",
                fix: "Stop leading with timing. Lead with named, paying customers.",
            },
            {
                text: "Our funnel shows €18M weighted pipeline across 14 named accounts.",
                strength: 2,
                reaction:
                    "Weighted is fund-speak. Show me three that signed and three that ghosted — and why.",
                fix: "Replace 'weighted pipeline' with a 3-column status table: SIGNED / PILOT / LOST.",
            },
        ],
    },
    {
        personaId: "marcus",
        challenge:
            "Founder honesty check — what dies first when capital gets tight in Q4 2027? Tell me the truth, not the deck.",
        flaw: "Survival path under capital stress is not modelled or rehearsed.",
        options: [
            {
                text: "Hardware capex. We pivot to capital-light fleet-as-service with leasing partners absorbing the BoM.",
                strength: 3,
                reaction:
                    "Smart. That's the real survival path. Rehearse it. Pre-sign the leasing partner now while you don't need them.",
                fix: "Add a 'capital-light fallback' slide to the deck. Pre-sign a leasing MoU in Q2.",
            },
            {
                text: "We'd cut headcount and double down on enterprise sales.",
                strength: 1,
                reaction:
                    "That's panic talk. You'd kill velocity exactly when you need it. Boards smell that response in a minute.",
                fix: "Replace headcount cuts with a pre-built scenario: 18-month runway extension via leasing pivot.",
            },
            {
                text: "We have 24 months runway minimum — that scenario doesn't trigger.",
                strength: 2,
                reaction:
                    "Optimism is fine in a deck, not in board prep. You'll lose a quarter to the question alone.",
                fix: "Build a stress-tested 36-month cashflow model with 3 contraction scenarios.",
            },
        ],
    },
    {
        personaId: "anjali",
        challenge:
            "Your autonomy stack still needs tele-op fallback in 18% of routes. What's your honest L4 timeline, and what breaks before then?",
        flaw: "L4 timeline is being over-promised; tele-op failure mode is under-explained.",
        options: [
            {
                text: "L4 in 30% of routes by Q4 2027, full L4 in 2029. Until then we instrument the 18% and turn tele-op data into our training moat.",
                strength: 3,
                reaction:
                    "Now I trust the roadmap. Ship the telemetry pipeline before any L4 marketing copy goes out.",
                fix: "Reframe tele-op publicly as 'human-in-loop data engine.' Add telemetry KPIs to the deck.",
            },
            {
                text: "We're aiming for L4 across all routes by end of 2026.",
                strength: 1,
                reaction:
                    "That's marketing copy. No serious team commits full L4 in 10 months. You just lost the technical diligence room.",
                fix: "Pull every full-L4-by-2026 claim from external materials. Reset expectations publicly.",
            },
            {
                text: "We won't claim full autonomy publicly until validated — staged rollout.",
                strength: 2,
                reaction:
                    "Honest, but you'll need a metric to ship against. 'Staged' without a number is a delay disguised as discipline.",
                fix: "Define one shippable autonomy metric (e.g., disengagements per 1k km) and gate releases on it.",
            },
        ],
    },
    {
        personaId: "leo",
        challenge:
            "Your narrative is 'green delivery.' Half your competitors say that. What's the wedge that makes a CFO sign — not a sustainability officer?",
        flaw: "Positioning is sustainability-led — that's a tailwind, not a sales tool.",
        options: [
            {
                text: "Per-drop unit cost €0.42 vs €1.10 diesel. Sustainability is the bonus, not the pitch.",
                strength: 3,
                reaction:
                    "Lead with cost in every deck from tomorrow. Sustainability gets a footnote, never a hero slide.",
                fix: "Rewrite hero deck slide to lead with €0.42/drop. Move sustainability to slide 11.",
            },
            {
                text: "We have the strongest brand and design language in the category.",
                strength: 1,
                reaction:
                    "Brand doesn't close enterprise procurement. Re-write your wedge in one sentence — money-led, not vibe-led.",
                fix: "Workshop a single-sentence wedge that names the buyer, the saving, and the timeline.",
            },
            {
                text: "Compliance — EU 2035 ICE ban makes us inevitable.",
                strength: 2,
                reaction:
                    "Tailwind, not a sales tool. Pair it with cost or the procurement team yawns through your deck.",
                fix: "Stack ranking: 1) cost saving, 2) SLA, 3) compliance. Re-order every deck section accordingly.",
            },
        ],
    },
    {
        personaId: "sam",
        challenge:
            "I run a regional 3PL. €11,800/mo for 10 vehicles is fine until vehicle #2 breaks in week 3. What's your real SLA, and what's the penalty if you miss it?",
        flaw: "Operational reliability commitments are vague — procurement will not sign.",
        options: [
            {
                text: "99.2% fleet availability SLA. Below that, prorated credit + free replacement vehicle in 12h. Service partner network pre-signed DE/NL/FR.",
                strength: 3,
                reaction:
                    "That I sign. Get the MSA template drafted with that exact language. You just unlocked 70% of mid-market procurement.",
                fix: "Publish the SLA terms in the MSA template before any new pilot signature.",
            },
            {
                text: "We'd handle it case by case based on customer relationship.",
                strength: 1,
                reaction:
                    "Case by case is how procurement says no. I can't get sign-off without contractual penalty clauses.",
                fix: "Replace 'case by case' with named tiers: bronze 24h / silver 12h / gold 6h replacement.",
            },
            {
                text: "98% availability target with a 24h replacement window.",
                strength: 2,
                reaction:
                    "Acceptable but you'll lose to ZeroFleet's 12h promise. Procurement teams compare line items, not stories.",
                fix: "Tighten to 99% + 12h. Add a 'real-time fleet uptime' public dashboard as social proof.",
            },
        ],
    },
];

export const verdictTiers = [
    { min: 13, label: "BULLETPROOF", note: "Would close at seed today.", color: "#14b870" },
    { min: 9, label: "DEFENSIBLE", note: "Polish before pitch — close to fundable.", color: "#7dd3fc" },
    { min: 5, label: "VULNERABLE", note: "Rebuild key answers before going to market.", color: "#ff8a00" },
    { min: 0, label: "FATAL", note: "Re-architect the pitch. Don't pitch yet.", color: "#ff3b30" },
];

export const debateTickerItems = [
    "STRESS-TEST MODE / LIVE",
    "5 / 5 PANELLISTS ONLINE",
    "ROUND 01 / 01",
    "CLAUDE SONNET 4.5",
    "NO CARD REQUIRED",
    "AVG SESSION 4 MIN",
    "26,606+ IDEAS DEBATED",
    "FAIL-PROOF YOUR PITCH",
];
