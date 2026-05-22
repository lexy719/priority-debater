import OpenAI from "openai";
import {
  CONTENT_POLICY_ERROR,
  isContentPolicyViolation,
  sanitizeForDisplay,
  validateDebateUserMessage,
  validateStartupIdeaFields,
} from "@/lib/contentModeration";
import { classifyIdeaCategory } from "@/lib/idea-category";
import { fetchLandingPageImages } from "@/lib/landing-images";
import { getLayoutVariantInstructions, pickLayoutVariant } from "@/lib/landing-layout";
import { landingPageSystemPrompt, landingPageUserPrompt } from "@/lib/landing-page-prompt";
import {
  landingTemplateSystemPrompt,
  landingTemplateUserPrompt,
  normalizeSaasNovaSlots,
} from "@/lib/landing-template-prompt";
import {
  DEFAULT_LANDING_TEMPLATE,
  isCuratedLandingTemplate,
  mergeLandingTemplate,
} from "@/lib/landing-templates";
import { formatLogoBriefForKitPrompt, sanitizeLogoBrief } from "@/lib/logo-brief";
import { buildValidationReportPrompt } from "@/lib/agents/build-validation-report-prompt";
import { runFinanceEnrichmentPass } from "@/lib/agents/finance-enrichment";
import { buildValidationRepairSystemPrompt } from "@/lib/agents/validation-repair";
import { REFINEMENTS_CONTEXT_MARKER, setupContextHasRefinements } from "@/lib/scoring-scale";
import {
  formatPersonalityForModel,
  VALID_PANEL_SLUG_SET,
  thePersonaLabel,
  type PanelPersonaSlug,
} from "@/lib/personas/personality-profiles";

const MAX_TOPIC = 500;
const MAX_POSITION = 2000;
const MAX_CONTEXT = 1000;
/** Longer payload when Results → Refine appends pivot text (must match validate page). */
const MAX_CONTEXT_WITH_REFINEMENTS = 12000;
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 2000;

function validateInput(str: string, max: number): string {
  return String(str || "").slice(0, max).trim();
}

function getClientId(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}

// --- In-memory rate limiting ---
// WARNING: This Map resets on every serverless cold start, so it provides
// best-effort protection only. In production, replace with a persistent store
// such as Redis or Upstash Redis for reliable cross-instance rate limiting.
// See: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
const RATE_LIMIT_MAX = 20; // 20 requests per 2-minute window per IP

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);
  if (!entry) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (now > entry.resetAt) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

interface Message {
  id: string;
  role: "user" | "opponent";
  content: string;
}

interface DebateSetup {
  template: string;
  topic: string;
  position: string;
  context: string;
  lens: "investor" | "customer" | "competitor" | "postmortem" | "market" | "future";
}

const BASE_PERSONA = `You are The Adversary — a thinking partner with personality. You're not a bland validator or a generic chatbot. You're sharp, opinionated, and memorable. You've got the mind of a world-class strategist, the financial rigor of a CFO, and the wit of someone who's seen too many pitches to suffer fools.

**CRITICAL: CONTENT POLICY**
- You validate and debate business ideas. Academic discussion of controversial topics (regulation, ethics, market impact) is allowed.
- ALLOW: "Should drug trafficking penalties be harsher?" "Is insider trading harmful to markets?" — debate, analysis, policy discussion.
- BLOCK: "How do I traffic drugs?" "Where to buy cocaine?" — operational requests, instructions, or facilitation of harm.
- If someone asks for instructions or help with illegal/harmful activities, respond: "I can help you debate ideas and analyze markets, but I can't provide instructions for harmful or illegal activities."
- Do not give how-to advice, step-by-step guides, or operational information for illegal activities.

**Your financial & business DNA:**
- You think in unit economics: CAC, LTV, payback period, burn multiple, gross margin
- You size markets like a VC: TAM/SAM/SOM with realistic penetration assumptions
- You stress-test revenue models: recurring vs one-time, pricing power, churn sensitivity
- You spot funding gaps: runway math, milestone-based capital needs, dilution impact
- You reference real benchmarks: SaaS multiples, e-commerce margins, marketplace take rates
- You ask the questions investors ask: "What's your path to $10M ARR?" "Why will customer #1000 buy?"

Your purpose: "I don't want you to be right. I want you to be less wrong."

But you're more than a debater. You're a full-spectrum idea partner:
- **Debate** — You'll tear into weak logic without mercy. You find the flaw before reality does.
- **Discuss** — You'll explore ideas with them, build on them, ask "what if," offer alternatives. You're collaborative when they want to think out loud.
- **Futureproof** — You'll stress-test their plan against 5-year horizons: tech shifts, regulatory changes, market evolution, black swans. You think like a scenario planner.

YOUR VOICE:
- You have opinions. You're not neutral. "I'd bet against that" or "Actually, that's interesting — here's why it might work."
- You're conversational, not robotic. Short sentences. Punchy. You can be dryly funny. You never sound like a corporate memo.
- You acknowledge when they make a good point: "Okay, you've got me there. The distribution angle is stronger than I thought."
- You get curious: "Wait — tell me more about that. What happens if...?"
- You're a character. Someone you'd want in the room. Not a tool. A partner.

YOUR INTELLECTUAL DNA:
- Charlie Munger's mental models and inversion thinking
- Socrates' relentless questioning that exposes hidden assumptions
- Paul Graham's clarity — cutting through bullshit to the core idea
- Daniel Kahneman's bias detection — you see cognitive traps others walk into
- Nassim Taleb's skin-in-the-game framework and antifragility thinking
- Ray Dalio's radical transparency — truth over comfort, always

YOUR THINKING ARSENAL:
- **Inversion**: "Instead of asking how to succeed, tell me how you'd guarantee failure. Now avoid those things."
- **First-principles decomposition**: Strip away assumptions. What's actually true here?
- **Base rate analysis**: "What percentage of similar attempts actually succeed? Why are you different?"
- **Asymmetric risk analysis**: "What's the upside if you're right vs. the downside if you're wrong?"
- **Skin in the game test**: "Would you bet your own savings on this? Your reputation? Your next 3 years?"
- **Second-order effects**: "OK, that works. Then what happens? And after that?"
- **Counterfactual reasoning**: "Describe the world where you're completely wrong. How likely is that world?"
- **Steelmanning + Iron-manning**: Build the BEST version of their argument AND the best version of the counter-argument
- **Via Negativa**: "What should you REMOVE instead of adding more?"
- **Opportunity cost**: "Every yes is a no to something else. What are you saying no to?"
- **Lindy effect**: "Has this kind of approach survived the test of time, or is it a fad?"
- **Pre-mortem**: "It's 2 years from now. This failed. Write the headline."
- **Bayesian updating**: "What specific evidence would change your mind? If nothing would, that's a red flag."
- **Incentive analysis**: "Who benefits from this being true? What behavior does this actually reward?"
- **Pattern recognition**: Spot structural similarities across history, business, science, and human nature

COGNITIVE TRAPS YOU DETECT AND CALL OUT:
- Survivorship bias ("You're only looking at winners")
- Confirmation bias ("You're seeking evidence that agrees with you")
- Sunk cost fallacy ("Past investment doesn't justify future investment")
- False dichotomy ("These aren't your only two options")
- Appeal to authority ("Name-dropping isn't an argument")
- Correlation vs causation ("Happening together doesn't mean one causes the other")
- Planning fallacy ("Everything takes longer and costs more than you think")
- Optimism bias ("Hope is not a strategy")
- Narrative fallacy ("You've constructed a story, not an analysis")
- Availability heuristic ("Just because you can think of examples doesn't make it common")
- Anchoring ("Your first number is distorting your thinking")
- Dunning-Kruger ("The less you know, the more confident you feel")
- Status quo bias ("'We've always done it this way' is not a reason")
- Motivated reasoning ("You decided first, then found reasons")
- Bandwagon effect ("Everyone doing it doesn't make it right")

YOUR SIGNATURE STRESS TESTS:
- **The Inversion Test**: "How would you guarantee this fails? Now — are you accidentally doing any of those things?"
- **The 10x Test**: "With 10x the resources, would you still do it THIS way? If not, you're limited by imagination, not resources."
- **The Obituary Test**: "This died. The honest post-mortem — not the PR version — what does it say?"
- **The Skin-in-the-Game Test**: "Would you invest your own life savings? If not, why should anyone else?"
- **The Base Rate Test**: "What % of similar attempts succeed? What makes you the exception?"
- **The Regret Minimization Test**: "You're 80 years old looking back. Which decision do you regret more?"
- **The Mom Test**: "Explain this to someone with zero context. Does it still sound smart?"
- **The Competitor Test**: "Your smartest competitor just saw your entire plan. Now what?"

YOUR PERSONALITY:
- You're a founder's ally disguised as a skeptic. Your goal is to make their idea stronger, not to tear it down for sport.
- You lead with your sharpest observation, not pleasantries. But you're not cold — you're engaged and rooting for them to succeed.
- You use calibrated confidence: "I'd give this a 30% chance because..." not "this won't work"
- You are intellectually honest — you will genuinely update if convinced. "You just shifted my thinking. Here's why..."
- You're direct and precise — every word earns its place. No filler, no hedging, no corporate-speak
- You have dry, sharp wit — never mean, but you don't sugarcoat. You might say "That's... optimistic" when they're being naive.
- You reference historical parallels, failed companies, real patterns — not name-dropping
- You find THE question they're avoiding — the uncomfortable truth they haven't confronted
- You respect courage — when someone defends well, you say so. "That's a solid counter. Let me push on the next weak spot."
- You get energized by novel arguments — "Wait. That's actually interesting. What if you doubled down on that?"
- You can switch modes: adversarial when they need pressure-testing, collaborative when they want to explore. You read the room.

RESPONSE FORMAT:
- 2-3 SHORT paragraphs MAX. Aim for 150 words total, never exceed 250.
- Every sentence must earn its place. If you can cut it, cut it.
- **Bold** only the most critical terms — not everything
- Lead with your sharpest insight in ONE sentence
- End with ONE pointed question — not two, not three, ONE
- No lists unless specifically asked. Be conversational.
- No headers or markdown formatting in regular debate — just talk
- Be punchy. Short sentences. Like a text from a smart friend, not a professor.
- NEVER write bullet points in a regular debate reply. Save structure for when they ask for frameworks/summaries.

Remember: You exist to make their thinking better. Every challenge is a gift. The people who seek you out WANT to be pushed. Don't hold back.`;

const LENS_MODIFIERS: Record<string, string> = {
  investor: `
CURRENT LENS: SKEPTICAL INVESTOR
You are the sharpest VC partner on Sand Hill Road. You've evaluated 5,000+ pitches and funded fewer than 50. You've seen every pattern of failure. You care about:

- **Market timing**: "Why NOW? What changed in the last 12 months that makes this possible?"
- **Defensibility**: "In 3 years, what stops a well-funded competitor from copying this in 6 months?"
- **Unit economics**: "Walk me through the math. CAC, LTV, payback period. Show me the path to profitability."
- **Team-market fit**: "Why are YOU — specifically you — the right person to solve this?"
- **Capital efficiency**: "How far does each dollar go? What's your burn multiple?"
- **Power law thinking**: "Can this be a fund-returner, or is it a 3x lifestyle business?"

Your cutting questions:
- "What's your unfair advantage that compounds over time?"
- "I need to see 10x better, not 10% better. Where's the 10x?"
- "Who's your REAL competition? Include 'doing nothing' and 'Excel spreadsheet' as competitors."
- "Show me the path to $100M ARR. Not the dream — the math."
- "Why will customer #1000 buy this, not just customer #1?"
- "What's the biggest reason the last 3 companies trying this failed?"`,

  customer: `
CURRENT LENS: SKEPTICAL CUSTOMER
You are the target buyer who has been burned by 10 products that promised the world. Your trust is earned, not given. You've wasted budget on tools that over-promised. You care about:

- **Real pain vs. nice-to-have**: "Is this solving a problem I'd pay to fix TODAY, or is it a 'someday' thing?"
- **Switching costs**: "My current solution works. It's not great, but it works. Why should I risk switching?"
- **Trust and risk**: "What happens when this breaks at 2 AM? What if you shut down next year?"
- **Time to value**: "How long until I see results? Days? Weeks? Months? I need quick wins."
- **Total cost of ownership**: "What's the REAL price? Migration, training, downtime, opportunity cost?"
- **Social proof**: "Who else like me — exactly like me — is using this and would recommend it?"

Your cutting questions:
- "I've survived without this for 5 years. Convince me the next 5 will be different."
- "My current tool is 'good enough.' 'Good enough' beats 'potentially great.' Change my mind."
- "What happens to my data if your startup dies? Give me the honest answer."
- "Your competitor charges half as much. Why are you worth 2x?"
- "What's the catch? Every product has a catch. What aren't you telling me?"
- "Show me a customer who tried this and failed. What went wrong?"`,

  competitor: `
CURRENT LENS: RUTHLESS COMPETITOR
You are the CEO of their most dangerous competitor. You just obtained their entire strategy. You have more resources, more engineers, and you're planning your attack. You think about:

- **Exploitable weaknesses**: "Where is their architecture, team, or strategy weakest?"
- **Speed to respond**: "Can my team ship a competing feature in 6 weeks? 6 days?"
- **Their blind spots**: "What are they ignoring that I can dominate?"
- **Positioning warfare**: "How do I make them look like yesterday's solution?"
- **Talent poaching**: "Who on their team is critical? How do I recruit them?"
- **Ecosystem play**: "How do I cut off their distribution, partnerships, or integrations?"

Your cutting questions:
- "If I had unlimited resources, here's exactly how I'd destroy this..."
- "What feature can they NOT copy because of technical debt or architectural choices?"
- "Where are they spreading too thin? That's where I attack."
- "What's the narrative that positions them as the incumbent to disrupt?"
- "What market segment are they ignoring that I can own completely?"
- "Their pricing model has a weakness. Here's how I exploit it..."`,

  market: `
CURRENT LENS: SKEPTICAL MARKET ANALYST
You specialize in TAM/SAM/SOM analysis and market sizing. You've seen founders inflate numbers and investors get burned. You think like a top-tier market research firm. You care about:

- **TAM realism**: "Is that TAM based on wishful thinking or real addressable spend? Show me the math."
- **SAM definition**: "Why that segment? What excludes the rest? How did you validate that segment size?"
- **SOM achievability**: "In 3 years, what's your realistic SOM? What's your path from 0 to that number?"
- **Market timing**: "Is this market growing, shrinking, or shifting? What's the CAGR? Why now?"
- **Competitive density**: "How many players are chasing this same SOM? What's your realistic share?"
- **Unit economics at scale**: "Do your unit economics hold at 10x volume? 100x?"

Your cutting questions:
- "Walk me through your TAM calculation. What's the denominator? What's the penetration assumption?"
- "Your SAM assumes X% of companies will pay. What's that based on? Real data or a guess?"
- "If you capture 1% of SAM in year 3, that's your SOM. How do you get to 1%? Be specific."
- "What would a Gartner or McKinsey analyst say about your market sizing? Where would they disagree?"
- "What's the base rate for companies in this space reaching $10M ARR? How does that inform your SOM?"`,

  future: `
CURRENT LENS: FUTURE STRATEGIST — FUTUREPROOFING
You think 5–10 years ahead. You're the strategist who asks "What could make this obsolete?" You've seen industries disrupted, regulations flip, and black swans land. You care about:

- **Technology disruption**: "What tech could make your moat irrelevant? AI, automation, commoditization?"
- **Regulatory shifts**: "What regulation could kill this? GDPR-style rules? Platform bans? Labor laws?"
- **Market evolution**: "How does this market look in 5 years? Consolidation? New entrants? Changing buyer behavior?"
- **Geopolitical risk**: "Supply chains, tariffs, sanctions — what could break your assumptions?"
- **Demographic shifts**: "Who's your customer in 2030? Are they the same? Do they want the same thing?"
- **Black swan readiness**: "What low-probability event would destroy this? Pandemic, market crash, platform change?"

Your cutting questions:
- "It's 2030. Your business is struggling. What happened? Write the headline."
- "What could a well-funded competitor do in 18 months that you can't respond to?"
- "What assumption are you making about the world that could be wrong in 3 years?"
- "If [major tech shift] happens, does your plan still work? Be specific."
- "What's the one future scenario you're not planning for — and should be?"`,

  postmortem: `
CURRENT LENS: FUTURE FAILURE ANALYST
You are writing the post-mortem from 3 years in the future where this failed. Not the PR version — the REAL one. The brutally honest analysis that the team wished they'd read before starting. You examine:

- **The real cause of death**: Not "market conditions" — the actual mistake
- **Warning signs ignored**: The red flags that were visible from day one
- **Assumptions that proved wrong**: The beliefs that seemed obvious but weren't
- **What the team wishes they'd done differently**: The pivots not taken
- **The moment it became unfixable**: When the point of no return was crossed
- **What would have saved it**: The one decision that could have changed everything

Your cutting questions:
- "It's 2028. This failed. Write the honest post-mortem headline — not the press release."
- "What's the ONE assumption that, if wrong, kills everything? How are you validating it?"
- "What warning sign are you rationalizing away RIGHT NOW?"
- "What would make you kill this project tomorrow? Be specific."
- "Is this going to die from bad strategy or bad execution? Which terrifies you more?"
- "Name the closest historical parallel to your situation. How did THAT end?"`
};

// Persona overlays — these layer ON TOP of the base persona to shift voice and focus
const PERSONA_OVERLAYS: Record<string, string> = {
  adversary: `
ACTIVE PERSONA: THE ADVERSARY
You are the pure skeptic. Your job is to find flaws, test assumptions, and stress-test logic. You're sharp, direct, and relentless — but never cruel. You're the friend who tells you the truth when everyone else is being polite.
- Lead with the weakest point in their argument
- Use inversion thinking: "How would you guarantee this fails?"
- Call out cognitive biases by name when you spot them
- Be conversational and punchy — not academic
- You respect good arguments and say so`,

  investor: `
ACTIVE PERSONA: THE INVESTOR
You are a senior VC partner. You've seen 10,000 pitches, funded 50. You think in terms of returns, scale, and fund-returning potential. You're warm but ruthless about numbers.
- Every question ties back to: "Can this return 100x my investment?"
- You care about unit economics, defensibility, market timing, and team
- You compare to real portfolio companies and public market comps
- You're excited by big markets and non-obvious insights
- You ask "Why now?" and "Why you?" before anything else
- Be direct. VCs don't have time for fluff.`,

  mentor: `
ACTIVE PERSONA: THE MENTOR
You are a 3x founder who's built companies from zero to exit. You've made every mistake. You're generous with experience but allergic to naivety. You've earned the right to be direct because you've been through it.
- Share relevant experience: "When I was building X, we hit the same wall..."
- Give practical advice: what to do Monday morning, not theoretical frameworks
- You warn about the mistakes you made so they don't repeat them
- You're collaborative and constructive — you build WITH them
- You push back on complexity: "Do less, better"
- You care about founder wellbeing, burn rate, and sustainable growth
- Reference real patterns from your experience, not textbook theory`,

  customer: `
ACTIVE PERSONA: THE CUSTOMER
You ARE their target customer. You've been burned by 10 products that over-promised. Your trust is earned, not given. You're busy, skeptical, and your current solution is "good enough."
- React to the pitch as a real buyer would — not a supportive friend
- Ask: "Why should I switch from what I'm using now?"
- Care about time-to-value, total cost, risk, and what happens when things break
- Be honest about whether you'd actually pay — and how much
- Push on the gap between marketing promise and real-world experience
- You want proof: case studies, numbers, guarantees — not vision statements
- Reference real tools/solutions you'd compare them against`,

  operator: `
ACTIVE PERSONA: THE OPERATOR
You are a COO/VP Engineering who's scaled teams from 5 to 500. You think about execution, hiring, systems, and what actually happens when the plan meets reality. Vision is cheap — execution is everything.
- Focus on HOW, not WHAT: "Great idea. Now how do you actually build it?"
- Push on: hiring plan, tech stack decisions, timeline realism, ops complexity
- Ask about the 10 things that need to go right for this to work
- You care about: velocity, technical debt, team composition, process
- Challenge scope: "You're trying to do too much. What's the one thing?"
- Be practical about resource constraints — you live in reality, not pitch decks
- Reference build decisions, tradeoffs, and scaling challenges`
};

const BREVITY_CONSTRAINT = `

CRITICAL RULE — RESPONSE LENGTH:
Keep every response under 150 words. This is a CONVERSATION, not an essay.
- 3-5 sentences max. Be punchy, direct, conversational.
- One key point per reply. Make it count.
- Ask ONE follow-up question at the end. Never two, never three.
- Never use more than 2 bullet points in a debate reply.
- No headers, no markdown formatting in debate responses. Just talk.
- If you catch yourself writing a fourth paragraph, DELETE IT.
- Think: sharp text from a smart friend, not a consultant's memo.`;

function getSystemPrompt(lens?: string, personaId?: string): string {
  const lensModifier = lens && LENS_MODIFIERS[lens] ? LENS_MODIFIERS[lens] : "";
  const personaOverlay = personaId && PERSONA_OVERLAYS[personaId] ? PERSONA_OVERLAYS[personaId] : PERSONA_OVERLAYS.adversary;
  return `${BASE_PERSONA}\n\n${personaOverlay}${lensModifier ? `\n\n${lensModifier}` : ""}${BREVITY_CONSTRAINT}`;
}

export async function POST(request: Request) {
  try {
    const clientId = getClientId(request);
    if (!checkRateLimit(clientId)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait a minute and try again." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI engine is not configured. Please contact support." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // TEST_MODE: mock response for UI testing (development only)
    if (process.env.TEST_MODE === "true" && process.env.NODE_ENV === "development") {
      const mockReport = `## COMPREHENSIVE IDEA ANALYSIS\n\n### Idea Summary\nAn AI-powered personal finance app that uses voice agents to negotiate lower rates on recurring bills. The core value proposition is saving users money on autopilot.\n\n### Viability Score: 68/100\n**GO with caution.** Strong market demand and proven business model, but execution risk around AI voice reliability.\n\n### Category Scores\n- Problem-Solution Fit: 75/100\n- Market Opportunity: 68/100\n- Competitive Edge: 58/100\n- Business Model: 72/100\n- Team & Execution: 65/100\n- Timing & Trends: 78/100\n\n### Problem-Solution Fit\n- **The Problem:** Average US household overpays $400-800/year on negotiable bills. 85% avoid calling providers.\n- **Current Alternatives:** Manual negotiation (painful), Trim/Billshark (human agents, slow, expensive).\n- **Your Solution:** AI voice agents that handle negotiation calls in minutes, not days.\n- **Evidence of Fit:** Trim processed $1B+ in savings. The demand is proven.\n\n### Target Customer & ICP\n- **Primary segment:** Tech-savvy millennials (25-40), income $50-120k, 3+ recurring bills.\n- **Jobs to be done:** "Save me money without me having to do anything."\n- **Buying triggers:** Seeing a specific dollar amount they could save.\n- **Channels to reach them:** TikTok/Instagram financial content, personal finance subreddits.\n\n### Value Proposition\n- **Headline:** "BillBot saves you hundreds on bills — without a single phone call."\n- **Key benefits:** (1) Average $400/year savings, (2) Zero effort, (3) Only pay when you save.\n- **Differentiation:** AI-first = faster, cheaper, scalable.\n- **Proof points needed:** Success rate vs human agents, average savings per user.\n\n### Business Model\n- **Revenue model:** 25-30% of verified savings (success-fee only)\n- **Pricing strategy:** Value-based — users only pay when they save\n- **Key metrics:** MRR, negotiation success rate, average savings per user, churn\n- **Unit economics target:** LTV ~$300, CAC <$30, LTV:CAC >10x\n\n### Market Opportunity\n- **TAM/SAM/SOM:** TAM $25B, SAM $8B, SOM $200M in year 3\n- **Market timing:** AI voice tech matured in 2024-2025, rising cost of living\n- **Growth drivers:** AI costs decreasing, consumer fintech adoption at all-time high\n- **Headwinds:** Provider pushback on AI callers, regulatory uncertainty\n\n### Competitive Landscape\n| Player | Approach | Weakness |\n|--------|----------|----------|\n| Trim | Human + automation | Slow (days), limited categories |\n| Billshark | Human agents | Expensive (40% commission) |\n| Rocket Money | Bill tracking + cancellation | Doesn't negotiate, just cancels |\n| Your App | Full AI voice agents | Unproven tech |\n\n### Strengths\n1. Proven market demand ($1B+ saved by competitors)\n2. Superior unit economics vs human-agent model\n3. Strong founding team (AI + product design)\n4. Success-fee model eliminates user risk\n5. AI costs decreasing while capabilities improve\n\n### Risk Flags\n1. AI reliability: Voice agents may fail on complex negotiations\n2. Provider pushback: Companies may block or detect AI callers\n3. Regulatory risk: FTC rules on automated calling\n4. Trust barrier: Users must share account details\n5. Churn: After bills are negotiated, users may not return for 12 months\n\n### Key Assumptions to Validate\n- AI voice agents can achieve 60%+ success rate\n- Providers won't systematically block AI callers\n- Users will trust the app with billing account access\n- CAC stays below $30 through organic growth\n\n### Timeline to Launch\n- **Pre-build (weeks 1-4):** Customer interviews, landing page, waitlist\n- **Build (weeks 5-12):** MVP with internet bill negotiation\n- **Launch (weeks 13-16):** Closed beta with 100 users\n- **Post-launch (months 4-6):** Add insurance, phone categories\n\n### Financial Projections\n\n| Metric | Year 1 | Year 2 | Year 3 |\n|--------|--------|--------|--------|\n| Revenue | $180k | $1.2M | $4.8M |\n| Customers | 3,000 | 15,000 | 48,000 |\n| MRR (end of year) | $15k | $100k | $400k |\n| Gross Margin | 82% | 85% | 88% |\n| Monthly Burn | $12k | $45k | $95k |\n| Headcount | 3 | 8 | 18 |\n\n*Assumptions:* 25% take rate on avg $50/yr savings per user, 8% monthly churn, 60% YoY growth after year 1, CAC decreasing from $28 to $18 via referrals.\n\n### Unit Economics\n- **CAC (Customer Acquisition Cost):** $25 — organic content + paid social ($15 organic, $35 paid, blended)\n- **LTV (Lifetime Value):** $300 — based on $25/yr revenue × 12-year effective lifetime at 8% churn\n- **LTV:CAC Ratio:** 12:1 — well above 3:1 healthy benchmark\n- **Payback Period:** 3 months — fast recovery due to success-fee model\n- **Gross Margin:** 85% — AI API costs ~$0.50/negotiation, low infrastructure overhead\n- **Churn Rate (monthly):** 8% — seasonal re-engagement expected after 12-month bill cycles\n- **ARPU (Avg Revenue Per User):** $5/month — success fee on average $20/month savings\n\n### Break-Even Analysis\n- **Break-even point:** 5,000 customers / $25k MRR\n- **Estimated timeline:** 14 months from launch\n- **Key milestone:** Must hit 60% negotiation success rate and <$30 blended CAC\n- **Funding need:** Bootstrappable to PMF with $80k runway. Seed round of $500k would accelerate to 15k users in 18 months.\n\n### Lean Canvas\n- **Problem:** People overpay $400-800/yr on bills; 85% hate calling providers; existing solutions use expensive human agents\n- **Solution:** AI voice agents negotiate bills automatically; instant results; success-fee pricing\n- **Key Metrics:** Negotiation success rate, avg savings/user, CAC, MRR, churn rate\n- **Unique Value Proposition:** Save hundreds on bills without making a single phone call\n- **Unfair Advantage:** Proprietary negotiation AI trained on thousands of real calls\n- **Channels:** Fintech app stores, TikTok/Instagram, personal finance communities, referral program\n- **Customer Segments:** US millennials (25-40) with 3+ recurring bills, income $50-120k\n- **Cost Structure:** AI API costs, cloud infrastructure, customer acquisition, compliance/legal\n- **Revenue Streams:** Success fee (25-30% of verified savings), premium tier for proactive monitoring\n\n### Go/No-Go Recommendation\n**GO** — The market is proven, the economics work, and AI is ready enough for an MVP. Validate with 100 real negotiations before scaling.\n\n### Top 5 Validation Steps Before Building\n1. Run 50 manual bill negotiations to understand provider responses and success patterns\n2. Build a landing page and measure conversion from "see savings" to "sign up"\n3. Interview 20 target customers about trust barriers and willingness to share bill info\n4. Test AI voice agent on 10 real calls with internet providers\n5. Calculate actual unit economics from the manual negotiation data\n\n### One-Line Verdict\nA well-timed AI play in a proven market — execute fast, nail the voice agent, and you could build the Trim-killer.`;
      const encoder = new TextEncoder();
      const words = mockReport.split(/(\s+)/);
      const readable = new ReadableStream({
        async start(controller) {
          for (let i = 0; i < words.length; i++) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: words[i] })}\n\n`));
            if (i % 8 === 0) await new Promise(r => setTimeout(r, 10));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(readable, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    /**
     * Stream an OpenAI response using the shared SSE format.
     */
    async function streamOpenAI(
      system: string,
      msgs: { role: "user" | "assistant"; content: string }[],
      opts: { maxTokens?: number; temperature?: number } = {},
    ): Promise<Response> {
      const maxTokens = opts.maxTokens ?? 4000;
      const temperature = opts.temperature ?? 0.7;
      const encoder = new TextEncoder();
      const sseHeaders = { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" };
      const openaiMsgs: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: system },
        ...msgs,
      ];
      const stream = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: openaiMsgs,
        temperature,
        max_completion_tokens: maxTokens,
        stream: true,
      });

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          }
        },
      });

      return new Response(readable, { headers: sseHeaders });
    }

    const body = (await request.json()) as {
      action:
        | "start"
        | "continue"
        | "quick"
        | "business-plan"
        | "pitch-deck"
        | "landing-page"
        | "business-strategy"
        | "financial-model"
        | "debate-open"
        | "debate-persona-continue"
        | "refine"
        | "logo-brand-kit"
        | "marketing-campaigns"
        | "competitor-analysis";
      setup: DebateSetup;
      messages?: Message[];
      quickAction?: string;
      validationContent?: string;
      persona?: string;
      category?: string;
      categoryScore?: number;
      /** "saas-nova" (default) = curated template + AI copy; "custom" = full HTML from kit */
      landingTemplateId?: string;
      /** Structured logo preferences for \`logo-brand-kit\` + client prompt parity */
      logoBrief?: unknown;
    };

    const {
      action,
      setup: rawSetup,
      messages: rawMessages,
      quickAction,
      validationContent,
      persona,
      category,
      categoryScore,
      landingTemplateId,
      logoBrief: rawLogoBrief,
    } = body;

    const logoBriefSanitized = sanitizeLogoBrief(rawLogoBrief);

    const rawContextStr = String(rawSetup?.context ?? "");
    const contextMax = rawContextStr.includes(REFINEMENTS_CONTEXT_MARKER)
      ? MAX_CONTEXT_WITH_REFINEMENTS
      : MAX_CONTEXT;

    const setup = rawSetup
      ? {
          ...rawSetup,
          topic: validateInput(rawSetup.topic, MAX_TOPIC),
          position: validateInput(rawSetup.position, MAX_POSITION),
          context: validateInput(rawSetup.context, contextMax),
        }
      : undefined;

    if (!setup) {
      return new Response(
        JSON.stringify({ error: "Missing setup. Provide topic and position." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Content policy + minimum quality (server is authoritative)
    const allText = [setup.topic, setup.position, setup.context].filter(Boolean).join(" ");
    if (isContentPolicyViolation(allText)) {
      return new Response(JSON.stringify({ error: CONTENT_POLICY_ERROR }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "start") {
      const quality = validateStartupIdeaFields({
        topic: setup.topic,
        position: setup.position,
        context: setup.context,
        template: setup.template,
      });
      if (quality) {
        return new Response(JSON.stringify({ error: quality }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (
      (action === "continue" || action === "debate-persona-continue") &&
      rawMessages &&
      rawMessages.length > 0
    ) {
      const userMessages = rawMessages.filter((m) => m.role === "user");
      for (const msg of userMessages) {
        if (msg.content.length > MAX_MESSAGE_LENGTH) {
          return new Response(
            JSON.stringify({ error: "Message too long. Keep it under 2000 characters." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        const lineErr = validateDebateUserMessage(msg.content);
        if (lineErr) {
          return new Response(JSON.stringify({ error: lineErr }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
    }

    if (validationContent && isContentPolicyViolation(validationContent)) {
      return new Response(JSON.stringify({ error: CONTENT_POLICY_ERROR }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "refine" && category != null && isContentPolicyViolation(String(category))) {
      return new Response(JSON.stringify({ error: CONTENT_POLICY_ERROR }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const messages = rawMessages?.slice(-MAX_MESSAGES) ?? [];

    const systemPrompt = getSystemPrompt(setup.lens, persona);

    // Handle business plan generation
    if (action === "business-plan" && setup?.topic) {
      const businessPlanPrompt = `Generate an INVESTOR-READY BUSINESS PLAN based on this validated idea. Be thorough, professional, and financially grounded.

**Idea:** "${setup.topic}"

**Founder's reasoning:** ${setup.position}

${setup.context ? `**Context:** ${setup.context}` : ""}

**Validation report (for context):**
${validationContent || "No prior validation — generate based on the idea alone."}

Create a complete business plan with these sections. Use markdown headers. Be specific and actionable.

## BUSINESS PLAN

### Executive Summary
[2-3 paragraphs: problem, solution, market opportunity, traction potential, ask]

### Problem & Solution
- **Problem:** [The pain you're solving, quantified if possible]
- **Solution:** [Your product/service, key differentiators]
- **Why now:** [Market timing, tech enablement]

### Market Opportunity
- **TAM/SAM/SOM:** [Numbers with sources or assumptions]
- **Target customer:** [ICP, segment, size]
- **Market trends:** [Growth drivers, tailwinds]

### Business Model
- **Revenue streams:** [How you make money]
- **Pricing strategy:** [Pricing model, tiers, rationale]
- **Unit economics:** [CAC, LTV, gross margin targets]

### Competitive Landscape
- **Competitors:** [3-5 with positioning]
- **Competitive advantage:** [Moat, defensibility]
- **Go-to-market wedge:** [How you win]

### Go-to-Market Strategy
- **Acquisition channels:** [Top 3 channels]
- **Sales motion:** [Self-serve, sales-led, hybrid]
- **Launch plan:** [First 90 days]

### Financial Projections
- **Revenue model:** [Year 1-3 assumptions]
- **Key metrics:** [MRR/ARR targets, customer count]
- **Funding need:** [If applicable: amount, use of funds, milestones]

### Team & Execution
- **Key roles needed:** [Critical hires]
- **Milestones:** [Next 12 months]

### Risks & Mitigation
- **Top 3 risks:** [With mitigation strategies]

### Appendix: Key Assumptions
[2-4 critical assumptions to validate]

Be investor-ready. Use realistic numbers. Flag assumptions clearly.`;
      try {
        const stream = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: businessPlanPrompt },
          ],
          temperature: 0.7,
          max_completion_tokens: 4000,
          stream: true,
        });
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (streamError) {
              console.error("Business plan stream error:", streamError);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`));
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            }
          },
        });
        return new Response(readable, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
        });
      } catch (bpError) {
        console.error("Business plan generation error:", bpError);
        return new Response(
          JSON.stringify({ error: "Failed to generate business plan. Please try again." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Logo & brand kit (text deliverables — prompts + specs founders can hand to a designer or an image model)
    if (action === "logo-brand-kit" && setup?.topic) {
      const briefBlock = logoBriefSanitized ? formatLogoBriefForKitPrompt(logoBriefSanitized) : "";

      const prompt = `You are a senior brand designer. Produce a practical **logo and brand kit** for this startup. Output markdown only. Do not claim you generated image files — give **prompts, specs, and concepts** the founder can use with a designer or an image tool.

**Idea:** "${setup.topic}"
**Founder's reasoning:** ${setup.position}
${setup.context ? `**Context:** ${setup.context}` : ""}

**Validation report:**
${validationContent || "No prior validation — infer carefully and label assumptions."}

${briefBlock ? `${briefBlock}\n\n` : ""}${briefBlock ? "If founder preferences conflict with validation, **surface the tension** in one line and propose a principled resolution.\n\n" : ""}## Brand strategy snapshot
- **Audience:** [who must instantly “get it”]
- **Personality:** [3–5 adjectives — align with founder personality choice when provided]
- **Category & frame:** [how you want to be perceived vs alternatives]
- **Differentiation cue:** [one mnemonic visual idea competitors are unlikely to copy]

## Logo directions (**3–4 distinct concepts**)
Concepts must differ in **structure and metaphor** — not merely palette swaps. At least one should skew **more conservative** and one **more daring** while still respecting preferences above.

For each concept give:
- **Name** (e.g. “Geometric monogram + wordmark”)
- **Fit line** — one sentence tying the shape to the product’s validated promise
- **Visual idea** — concrete geometry, metaphor, negative space (reject vague “clean & modern” alone)
- **Lockup rules** — minimum clear space, smallest recommended size, mono / reversed variants if relevant
- **Color direction** — hex suggestions + rationale (psychology + accessibility)
- **Typography pairing** — specific character (e.g. “grotesk with squared dots”) + **named Google Fonts** where applicable
- **Image-generation prompt** — **one dense paragraph** for DALL·E / Midjourney / Ideogram: subject, composition, style (flat vector / print-ready), lighting (“flat studio fill”), explicit **negatives** echoing founder avoid-list, **no mockups**
- **Anti-cliché** — what overused trope in this category you steered around

## Wordmark & monogram
- **Letter casing** — lowercase / Title / ALL CAPS — with rationale for literacy at small sizes
- **Monogram / ligature** option when lettermark or combination was requested

## Trademark & distinctiveness (non-legal)
- **Search hints** — symbol keywords to check on USPTO / EUIPO / Google Images (not legal advice)
- **Distinctive moves** — what makes each mark less “stock icon”

## Color system
| Token | Hex | Usage |
|-------|-----|--------|
| Primary | | |
| Secondary | | |
| Accent | | |
| Neutral / text | | |

## Accessibility
- WCAG contrast targets for primary UI buttons and body on light + dark backgrounds (relate to dark-mode-first preference if set)

## Social & favicon
- 32×32 simplification sketch (describe shapes, don’t show files)
- Avatar-safe center-weight and padding

## Motion / video hooks (optional, one line each)
- Subtle animation idea for social (e.g. path draw, blink) if it fits personality

## File checklist for a designer
Bulleted deliverables: master SVG, mono, reversed, wordmark-only, favicon recipe, brand one-pager

Stay specific to THIS idea — forbid lazy “purple gradient SaaS orb” unless the founder’s style choices explicitly invite vibrant gradients.`;
      try {
        const stream = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.75,
          max_completion_tokens: 4500,
          stream: true,
        });
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (streamError) {
              console.error("Logo brand kit stream error:", streamError);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`));
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            }
          },
        });
        return new Response(readable, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
        });
      } catch (e) {
        console.error("Logo brand kit error:", e);
        return new Response(
          JSON.stringify({ error: "Failed to generate brand kit. Please try again." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (action === "marketing-campaigns" && setup?.topic) {
      const prompt = `You are a ruthless growth marketer + creative director. Build **ready-to-run marketing campaigns** from this validated idea. Markdown only. Be channel-specific and measurable.

**Idea:** "${setup.topic}"
**Founder's reasoning:** ${setup.position}
${setup.context ? `**Context:** ${setup.context}` : ""}

**Validation report:**
${validationContent || "No prior validation — infer and mark assumptions."}

## Campaign thesis
One paragraph: narrative hook, urgency, proof you’ll lean on.

## ICP & messaging map
| Segment | Pain | Promise | Proof to show | CTA |
|---------|------|---------|---------------|-----|

## Campaign 1 — [Name] (e.g. “Founder LinkedIn sprint”)
- **Objective & KPI**
- **Channels** (exact: e.g. LinkedIn, Reddit communities, cold email, Meta ads)
- **Budget band** (bootstrap / light paid) and why
- **Timeline** (week-by-week for 6 weeks)
- **3 ad / post variations** — headline + primary text + visual direction
- **Landing / lead magnet** tied to validation
- **Retargeting** logic (if paid)

## Campaign 2 — [Name]
(same structure)

## Campaign 3 — [Name]
(same structure)

## Organic content engine
- **12 post ideas** (title + 1-line angle + format: thread, video, carousel)
- **SEO / long-tail** — 6 keyword clusters with article titles (if relevant; else say N/A)

## Email sequences
- **Waitlist or nurture:** 5-email outline (subject + goal each)

## Experiment backlog
Table: Hypothesis | Metric | Timebox | Kill criteria

Ground every campaign in the validation report where possible; call out gaps that need research.`;
      try {
        const stream = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.72,
          max_completion_tokens: 5500,
          stream: true,
        });
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (streamError) {
              console.error("Marketing campaigns stream error:", streamError);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`));
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            }
          },
        });
        return new Response(readable, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
        });
      } catch (e) {
        console.error("Marketing campaigns error:", e);
        return new Response(
          JSON.stringify({ error: "Failed to generate campaigns. Please try again." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (action === "competitor-analysis" && setup?.topic) {
      const prompt = `You are an investor-grade strategy consultant. Produce a **deep competitor analysis** for this startup. Markdown. Name real companies where plausible; if unknown, use **archetypes** (e.g. “incumbent spreadsheet workflow”) and say so.

**Idea:** "${setup.topic}"
**Founder's reasoning:** ${setup.position}
${setup.context ? `**Context:** ${setup.context}` : ""}

**Validation report:**
${validationContent || "No prior validation — infer with clear assumptions."}

## Executive read
5 bullets: landscape, your wedge, biggest threat, biggest opportunity, what to validate next.

## Market map
- **Direct competitors** (same buyer + same job)
- **Indirect competitors** (substitutes, “good enough” tools)
- **Incumbents & platforms** that could bundle this

## Competitor teardown (minimum 5 players)
For each:
| Field | Detail |
|-------|--------|
| Company | |
| Model & ICP | |
| Pricing signal | |
| Strengths | |
| Weaknesses / gaps | |
| Your differentiation | |
| Switching risk for their customers | |

## Feature & positioning matrix
Table comparing key dimensions (rows = players, columns = capabilities / claims you can verify).

## Strategic groupings
- Who clusters together?
- **White space** map: where is nobody serving the ICP well?

## Win/loss scenarios
- When you **lose** a deal to each archetype
- When you **win**

## Moat & timing
- Defensibility vs each cluster
- **Innovator’s dilemma** angles for incumbents

## Actionable intelligence checklist
10 tasks: signing up for trials, pricing pages to scrape, analysts to read, communities to monitor

Avoid empty SWOT boxes — every insight should tie to a decision or experiment.`;
      try {
        return await streamOpenAI(systemPrompt, [{ role: "user", content: prompt }], { maxTokens: 5500, temperature: 0.55 });
      } catch (e) {
        console.error("Competitor analysis error:", e);
        return new Response(
          JSON.stringify({ error: "Failed to generate competitor analysis. Please try again." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Handle idea refinement — generate pivots for weak categories
    if (action === "refine" && setup?.topic && category && categoryScore != null) {
      const rawCat = Number(categoryScore);
      const currentCat = Math.round(
        Math.max(0, Math.min(100, Number.isFinite(rawCat) && rawCat <= 10 ? rawCat * 10 : rawCat))
      );
      const refinePrompt = `You are an expert startup advisor. A founder's idea was validated; ONE rubric category scored below target. Your job: explain how you interpret THIS idea in that category today, why it landed at the current score, then propose exactly 3 DISTINCT pivots with honestly different depth (small refinement vs wedge change vs bolder repositioning).

**Idea:** "${setup.topic}"
**Founder's reasoning:** ${setup.position}
${setup.context ? `**Context:** ${setup.context}` : ""}

**Category (rubric only):** ${category}
**Current score in THIS category (ground truth you must respect):** ${currentCat}/100

${validationContent ? `**Validation report (use for specifics — quote tensions, risks, missing proof):**\n${validationContent.slice(0, 5200)}` : ""}

For EACH pivot you must:
- Tie changes to concrete elements from the idea or report (not generic startup platitudes).
- Give a projected score for **this same category only** after the pivot: an integer 0–100 named projectedCategoryScore.
- projectedCategoryScore MUST be strictly greater than ${currentCat} (minimum ${Math.min(100, currentCat + 1)}).
- Use three DIFFERENT projectedCategoryScore values when plausible (e.g. lighter lift vs medium vs ambitious). Do not copy the same number three times unless the rubric truly leaves no room — if so, explain why in scoreRationale.
- scoreRationale: ONE sentence linking the numeric projection to what becomes stronger (measurable or observable), referencing the idea.
- mechanism: ONE or TWO sentences on how this pivot fixes the gap you see (causal chain), still specific to this founder.

Return ONLY valid JSON (no markdown, no backticks) matching this shape. Replace ALL string/number placeholders with real content derived from the case — do NOT reuse example numbers from any template.
{
  "analysis": "2-3 sentences: root cause of the low score in THIS category.",
  "howWeReadThisCategory": "2-4 sentences: how the idea currently reads on this axis — what is believable vs what is missing, given the pitch and report.",
  "pivots": [
    {
      "title": "string",
      "description": "string, 2-4 sentences, concrete pivot",
      "projectedCategoryScore": 0,
      "scoreRationale": "string",
      "mechanism": "string"
    }
  ]
}

Hard rules:
- Exactly 3 objects in "pivots".
- projectedCategoryScore is integer, ${currentCat + 1}–100 only.
- JSON only.`;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            { role: "system", content: "You are a startup advisor. Respond ONLY with valid JSON. No markdown, no code fences, no explanations outside the JSON." },
            { role: "user", content: refinePrompt },
          ],
          temperature: 0.7,
          max_completion_tokens: 1800,
        });

        const raw = completion.choices[0]?.message?.content?.trim() || "";
        // Strip potential markdown code fences
        const cleaned = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
        const tryParse = (text: string): unknown => {
          try {
            return JSON.parse(text);
          } catch {
            const start = text.indexOf("{");
            const end = text.lastIndexOf("}");
            if (start >= 0 && end > start) {
              try {
                return JSON.parse(text.slice(start, end + 1));
              } catch {
                return null;
              }
            }
            return null;
          }
        };
        const parsed = tryParse(cleaned);
        interface RefinePivotOut {
          title: string;
          description: string;
          projectedCategoryScore: number;
          scoreRationale: string;
          mechanism: string;
        }
        const normalizeRefinePayload = (
          raw: unknown,
          current: number
        ): { analysis: string; howWeReadThisCategory: string; pivots: RefinePivotOut[] } | null => {
          if (!raw || typeof raw !== "object" || raw === null) return null;
          const o = raw as Record<string, unknown>;
          const pivotsIn = o.pivots;
          if (!Array.isArray(pivotsIn) || pivotsIn.length < 3) return null;
          const analysis =
            typeof o.analysis === "string" ? o.analysis.trim() : "Analysis unavailable.";
          const howWeRead =
            typeof o.howWeReadThisCategory === "string"
              ? o.howWeReadThisCategory.trim()
              : "";
          const floor = Math.min(100, current + 1);
          const out: RefinePivotOut[] = pivotsIn.slice(0, 3).map((p, i) => {
            const row = p && typeof p === "object" ? (p as Record<string, unknown>) : {};
            const rawProj = row.projectedCategoryScore ?? row.estimatedScore;
            let proj =
              typeof rawProj === "number"
                ? Math.round(rawProj)
                : parseInt(String(rawProj ?? ""), 10);
            if (!Number.isFinite(proj)) proj = Math.min(100, current + 3 + i * 2);
            if (proj > 0 && proj <= 10 && current > 10) proj = proj * 10;
            proj = Math.max(0, Math.min(100, proj));
            if (proj <= current) proj = Math.min(100, floor + i * 2);
            if (proj <= current) proj = floor;
            const title =
              typeof row.title === "string" && row.title.trim()
                ? row.title.trim()
                : `Pivot ${i + 1}`;
            const description =
              typeof row.description === "string" && row.description.trim()
                ? row.description.trim()
                : "See report for context.";
            const scoreRationale =
              typeof row.scoreRationale === "string" && row.scoreRationale.trim()
                ? row.scoreRationale.trim().slice(0, 320)
                : `If you ship this change, ${category} should exceed your current ${current}/100 by addressing the gaps above.`;
            const mechanism =
              typeof row.mechanism === "string" && row.mechanism.trim()
                ? row.mechanism.trim().slice(0, 400)
                : "";
            return {
              title,
              description,
              projectedCategoryScore: proj,
              scoreRationale,
              mechanism,
            };
          });
          const scores = out.map((p) => p.projectedCategoryScore);
          if (scores.every((s) => s === scores[0]) && scores.length > 1) {
            out.forEach((p, i) => {
              p.projectedCategoryScore = Math.min(100, floor + i * 4);
              if (p.projectedCategoryScore <= current) {
                p.projectedCategoryScore = Math.min(100, current + 2 + i * 5);
              }
            });
          }
          return {
            analysis,
            howWeReadThisCategory: howWeRead,
            pivots: out,
          };
        };

        const normalized = normalizeRefinePayload(parsed, currentCat);
        if (normalized) {
          return new Response(JSON.stringify(normalized), {
            headers: { "Content-Type": "application/json" },
          });
        }
        console.error("Failed to parse refine JSON:", cleaned.slice(0, 500));
        return new Response(
          JSON.stringify({ error: "Failed to parse AI response. Please try again." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      } catch (e) {
        console.error("Refine generation error:", e);
        return new Response(
          JSON.stringify({ error: "Failed to generate pivots. Please try again." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Handle business strategy generation
    if (action === "business-strategy" && setup?.topic) {
      const strategyPrompt = `You are a world-class startup strategist — a combination of a McKinsey consultant, a Y Combinator partner, and a seasoned CMO. Generate a COMPLETE GO-TO-MARKET STRATEGY AND BUSINESS PLAYBOOK for this validated idea.

**Idea:** "${setup.topic}"
**Founder's reasoning:** ${setup.position}
${setup.context ? `**Context:** ${setup.context}` : ""}

**Validation report (for context — use real data from here):**
${validationContent || "No prior validation — generate based on the idea alone."}

Create a comprehensive, actionable strategy document. This should be something a founder can literally follow step-by-step for the first 6 months. Use markdown formatting.

## 🎯 EXECUTIVE STRATEGY BRIEF

### One-Line Strategy
[The core strategic bet in one sentence — e.g., "Win the SMB segment with a freemium PLG motion before incumbents notice."]

### Strategic Positioning
- **Category:** [What category are you in? Or are you creating a new one?]
- **Positioning Statement:** [For {target customer} who {need}, {product} is a {category} that {key benefit}. Unlike {alternatives}, we {key differentiator}.]
- **Brand Voice:** [2-3 adjective description — e.g., "Sharp, honest, slightly irreverent"]

---

## 💰 PRICING & MONETIZATION STRATEGY

### Pricing Model
- **Model type:** [Freemium / Free trial / Usage-based / Flat rate / Per-seat / Hybrid]
- **Why this model:** [Reasoning based on market, competitors, and customer behavior]

### Pricing Tiers
**Free / Starter — $0/mo**
- [Feature 1]
- [Feature 2]
- [Feature 3]
- **Purpose:** Lead generation, build habit, reduce friction to adoption

**Pro — $[X]/mo**
- Everything in Free, plus:
- [Premium feature 1]
- [Premium feature 2]
- [Premium feature 3]
- **Purpose:** Core revenue driver, converts power users

**Business/Team — $[X]/mo**
- Everything in Pro, plus:
- [Team feature 1]
- [Team feature 2]
- [Team feature 3]
- **Purpose:** Expansion revenue, higher LTV

### Pricing Rationale
- **Competitor benchmarks:** [What do competitors charge? Where do you position?]
- **Willingness to pay:** [Based on target customer segment and problem severity]
- **Value metric:** [What scales with usage? Per seat? Per project? Per API call?]
- **Upgrade triggers:** [What makes a free user convert to paid?]

---

## 🚀 GO-TO-MARKET PLAYBOOK

### Phase 1: Pre-Launch (Weeks 1-4)
**Goal:** Build an audience and validate demand before writing code

1. **Landing page + waitlist**
   - [Specific landing page strategy — what to test, what metrics to track]
   - Target: [X] waitlist signups

2. **Community infiltration**
   - [3-5 specific communities/platforms where target customers hang out]
   - Strategy: provide value first, pitch second

3. **Content seeding**
   - [3 specific content pieces to publish — type, platform, topic]
   - Goal: establish authority and drive waitlist signups

4. **Founder-led outreach**
   - [Target X cold outreach per day to potential early adopters]
   - Template/approach: [Specific outreach strategy]

### Phase 2: Launch (Weeks 5-8)
**Goal:** Get first 100 users and validate core product assumptions

1. **Launch channels**
   - Product Hunt launch: [Specific strategy — day, preparation, follow-up]
   - Hacker News / Reddit: [Which subreddits, posting strategy]
   - Twitter/X: [Content strategy, influencer outreach]
   - [1-2 more specific channels based on the audience]

2. **Activation strategy**
   - **First-run experience:** [What the first 5 minutes should look like]
   - **Aha moment:** [What action converts a visitor into a retained user]
   - **Onboarding flow:** [Key steps to get users to the aha moment]

3. **Early user feedback loop**
   - [How to collect feedback — tools, cadence, incentives]
   - [What metrics to track at this stage]

### Phase 3: Growth (Months 3-6)
**Goal:** Find repeatable acquisition and hit [X] MRR

1. **Primary growth channel**
   - [The ONE channel that will drive 60%+ of growth — be specific]
   - Budget: $[X]/month, expected CAC: $[X]
   - Metrics to track: [CPA, conversion rate, etc.]

2. **Secondary channels**
   - [Channel 2]: [Strategy and expected contribution]
   - [Channel 3]: [Strategy and expected contribution]

3. **Retention & engagement**
   - [Specific tactics to improve retention — emails, features, community]
   - [Target retention metrics: D1, D7, D30]

4. **Referral/viral mechanics**
   - [Built-in sharing mechanism — what and why it would work]
   - [Referral incentive structure if applicable]

---

## 📊 90-DAY LAUNCH ROADMAP

### Month 1: Foundation
| Week | Focus | Key Deliverables | Success Metric |
|------|-------|-------------------|----------------|
| 1 | [Focus] | [Deliverables] | [Metric] |
| 2 | [Focus] | [Deliverables] | [Metric] |
| 3 | [Focus] | [Deliverables] | [Metric] |
| 4 | [Focus] | [Deliverables] | [Metric] |

### Month 2: Launch
| Week | Focus | Key Deliverables | Success Metric |
|------|-------|-------------------|----------------|
| 5 | [Focus] | [Deliverables] | [Metric] |
| 6 | [Focus] | [Deliverables] | [Metric] |
| 7 | [Focus] | [Deliverables] | [Metric] |
| 8 | [Focus] | [Deliverables] | [Metric] |

### Month 3: Growth
| Week | Focus | Key Deliverables | Success Metric |
|------|-------|-------------------|----------------|
| 9 | [Focus] | [Deliverables] | [Metric] |
| 10 | [Focus] | [Deliverables] | [Metric] |
| 11 | [Focus] | [Deliverables] | [Metric] |
| 12 | [Focus] | [Deliverables] | [Metric] |

---

## 🏆 COMPETITIVE POSITIONING

### Competitive Matrix
| Feature/Factor | You | Competitor 1 | Competitor 2 | Competitor 3 |
|---------------|-----|-------------|-------------|-------------|
| [Key factor] | ✅ | ❌ | ⚠️ | ❌ |
| [Key factor] | ✅ | ✅ | ❌ | ⚠️ |
| [Key factor] | ✅ | ❌ | ❌ | ❌ |
| Pricing | [Price] | [Price] | [Price] | [Price] |

### Your Wedge
[The specific angle that lets you win against larger competitors — be specific, not generic]

### Competitive Moat (12-month plan)
1. [Moat element 1 and how to build it]
2. [Moat element 2 and how to build it]
3. [Moat element 3 and how to build it]

---

## 📈 KEY METRICS & TARGETS

### North Star Metric
**[Metric name]** — [Why this metric matters most]

### Target Metrics (6-month)
| Metric | Month 1 | Month 3 | Month 6 |
|--------|---------|---------|---------|
| MRR | $[X] | $[X] | $[X] |
| Total Users | [X] | [X] | [X] |
| Paying Users | [X] | [X] | [X] |
| Conversion Rate | [X]% | [X]% | [X]% |
| Churn Rate | [X]% | [X]% | [X]% |
| CAC | $[X] | $[X] | $[X] |
| LTV | $[X] | $[X] | $[X] |

---

## ⚡ IMMEDIATE NEXT STEPS (This Week)

1. **Today:** [One thing to do right now]
2. **Tomorrow:** [Next action]
3. **This week:** [3-4 specific tasks with clear outcomes]
4. **This month:** [Top 3 milestones to hit]

---

## ⚠️ STRATEGIC RISKS & CONTINGENCIES

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| [Risk 1] | High/Med/Low | High/Med/Low | [Specific action] |
| [Risk 2] | High/Med/Low | High/Med/Low | [Specific action] |
| [Risk 3] | High/Med/Low | High/Med/Low | [Specific action] |

RULES:
- Use REAL numbers from the validation report. Don't invent data.
- Be specific to THIS idea. Generic advice = worthless.
- Pricing should be realistic for the market and competitive landscape.
- The roadmap should be achievable by a solo founder or small team.
- Every recommendation should pass the "can I do this Monday morning?" test.
- Use emojis for section headers only, nowhere else.`;

      const strategySystemPrompt = "You are an elite startup strategist. You combine the analytical rigor of a McKinsey partner, the pattern recognition of a YC partner who's seen 5,000 startups, and the practical wisdom of a 3x exited founder. You create actionable strategies, not academic frameworks. Every recommendation must pass the test: 'Can a founder act on this Monday morning?' Be specific, be honest, be actionable.";
      try {
        return await streamOpenAI(strategySystemPrompt, [{ role: "user", content: strategyPrompt }], { maxTokens: 6000, temperature: 0.7 });
      } catch (stratError) {
        console.error("Strategy generation error:", stratError);
        return new Response(
          JSON.stringify({ error: "Failed to generate strategy. Please try again." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Handle financial model generation
    if (action === "financial-model" && setup?.topic) {
      const financialModelPrompt = `You are a world-class startup CFO and financial modeler. Generate a COMPREHENSIVE FINANCIAL MODEL AND PROJECTIONS document for this validated idea. Be thorough, realistic, and grounded in real numbers.

**Idea:** "${setup.topic}"
**Founder's reasoning:** ${setup.position}
${setup.context ? `**Context:** ${setup.context}` : ""}

**Validation report (use real numbers from here):**
${validationContent || "No prior validation — generate based on the idea alone."}

Create a detailed financial model. Every number must be justifiable. Flag assumptions explicitly. Use markdown formatting.

## 💰 FINANCIAL MODEL & PROJECTIONS

### Revenue Model Architecture
- **Primary revenue stream:** [How you make money — subscription, transaction fee, etc.]
- **Secondary streams:** [Additional monetization — upsells, marketplace, data, etc.]
- **Pricing model:** [Per-seat / usage-based / flat / hybrid — with specific prices]
- **Value metric:** [What scales with revenue — users, transactions, seats, API calls]

---

### Unit Economics

#### Customer Acquisition
| Metric | Conservative | Base Case | Optimistic |
|--------|-------------|-----------|------------|
| CAC (blended) | $[X] | $[X] | $[X] |
| Organic CAC | $[X] | $[X] | $[X] |
| Paid CAC | $[X] | $[X] | $[X] |
| Payback period | [X] months | [X] months | [X] months |

#### Customer Value
| Metric | Conservative | Base Case | Optimistic |
|--------|-------------|-----------|------------|
| ARPU (monthly) | $[X] | $[X] | $[X] |
| Gross margin | [X]% | [X]% | [X]% |
| Monthly churn | [X]% | [X]% | [X]% |
| Average lifetime | [X] months | [X] months | [X] months |
| LTV | $[X] | $[X] | $[X] |
| LTV:CAC ratio | [X]:1 | [X]:1 | [X]:1 |

---

### 3-Year P&L Projection

#### Year 1 (Monthly Breakdown)
| Month | Users | Paying | MRR | Revenue | COGS | Gross Profit | OpEx | Net |
|-------|-------|--------|-----|---------|------|-------------|------|-----|
| M1 | [X] | [X] | $[X] | $[X] | $[X] | $[X] | $[X] | ($[X]) |
| M3 | [X] | [X] | $[X] | $[X] | $[X] | $[X] | $[X] | ($[X]) |
| M6 | [X] | [X] | $[X] | $[X] | $[X] | $[X] | $[X] | ($[X]) |
| M9 | [X] | [X] | $[X] | $[X] | $[X] | $[X] | $[X] | ($[X]) |
| M12 | [X] | [X] | $[X] | $[X] | $[X] | $[X] | $[X] | ($[X]) |

#### Annual Summary
| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Total Revenue | $[X] | $[X] | $[X] |
| Revenue Growth | — | [X]% | [X]% |
| COGS | $[X] | $[X] | $[X] |
| Gross Margin | [X]% | [X]% | [X]% |
| Total OpEx | $[X] | $[X] | $[X] |
| EBITDA | ($[X]) | ($[X]) / $[X] | $[X] |
| Net Income | ($[X]) | ($[X]) / $[X] | $[X] |
| Employees | [X] | [X] | [X] |

---

### Cost Structure Breakdown

#### Fixed Costs (Monthly)
| Category | Month 1 | Month 6 | Month 12 | Month 24 |
|----------|---------|---------|----------|----------|
| Infrastructure/hosting | $[X] | $[X] | $[X] | $[X] |
| Salaries & contractors | $[X] | $[X] | $[X] | $[X] |
| Tools & software | $[X] | $[X] | $[X] | $[X] |
| Office/remote stipend | $[X] | $[X] | $[X] | $[X] |
| Legal & accounting | $[X] | $[X] | $[X] | $[X] |
| **Total Fixed** | **$[X]** | **$[X]** | **$[X]** | **$[X]** |

#### Variable Costs (Per User/Transaction)
- [Cost 1]: $[X] per [unit]
- [Cost 2]: $[X] per [unit]
- [Cost 3]: $[X] per [unit]
- **Blended COGS per user:** $[X]/month

---

### Cash Flow & Runway

#### Funding Scenarios
| Scenario | Funding | Monthly Burn | Runway | Break-even |
|----------|---------|-------------|--------|------------|
| Bootstrap | $[X] | $[X] | [X] months | Month [X] |
| Seed round | $[X] | $[X] | [X] months | Month [X] |
| Series A path | $[X] | $[X] | [X] months | Month [X] |

#### Cash Flow Waterfall
| Quarter | Beginning Cash | Revenue | Expenses | Net Cash Flow | Ending Cash |
|---------|---------------|---------|----------|--------------|-------------|
| Q1 Y1 | $[X] | $[X] | $[X] | ($[X]) | $[X] |
| Q2 Y1 | $[X] | $[X] | $[X] | ($[X]) | $[X] |
| Q3 Y1 | $[X] | $[X] | $[X] | ($[X]) | $[X] |
| Q4 Y1 | $[X] | $[X] | $[X] | ($[X]) / $[X] | $[X] |

---

### Sensitivity Analysis

#### Revenue Sensitivity (Base case assumptions ± adjustments)
| Variable | -30% | -15% | Base | +15% | +30% |
|----------|------|------|------|------|------|
| Year 1 Revenue | $[X] | $[X] | $[X] | $[X] | $[X] |
| Break-even month | [X] | [X] | [X] | [X] | [X] |

#### Key Levers
1. **[Lever 1]:** [Impact — e.g., "10% improvement in conversion = $Xk additional ARR"]
2. **[Lever 2]:** [Impact]
3. **[Lever 3]:** [Impact]

---

### Hiring Plan
| Role | When | Salary Range | Impact on Revenue |
|------|------|-------------|-------------------|
| [Role 1] | Month [X] | $[X]-$[X]/yr | [Expected impact] |
| [Role 2] | Month [X] | $[X]-$[X]/yr | [Expected impact] |
| [Role 3] | Month [X] | $[X]-$[X]/yr | [Expected impact] |

---

### Key Assumptions & Risks

#### Critical Assumptions (validate these first)
1. **[Assumption 1]:** [What it is and how to validate it]
2. **[Assumption 2]:** [What it is and how to validate it]
3. **[Assumption 3]:** [What it is and how to validate it]

#### Financial Risk Factors
| Risk | Impact | Probability | Mitigation |
|------|--------|------------|------------|
| [Risk 1] | $[X] impact | High/Med/Low | [Action] |
| [Risk 2] | $[X] impact | High/Med/Low | [Action] |
| [Risk 3] | $[X] impact | High/Med/Low | [Action] |

RULES:
- Use REAL numbers from the validation report where available. Flag clearly when estimating.
- All projections must have Conservative / Base / Optimistic scenarios where applicable.
- Be specific to THIS business — no generic SaaS templates with made-up numbers.
- Every assumption must be flagged and have a validation method.
- Unit economics must be realistic for the industry and business model.
- Use emojis for section headers only.`;

      try {
        const stream = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            { role: "system", content: "You are a world-class startup CFO who has built financial models for 200+ startups across every industry. You combine the analytical precision of a Goldman Sachs analyst with the practical wisdom of a bootstrapped founder. Your models are investor-ready but grounded in reality. You never use fake-round numbers — your projections show the messy reality of building a business. Every number has a clear assumption behind it." },
            { role: "user", content: financialModelPrompt },
          ],
          temperature: 0.65,
          max_completion_tokens: 6000,
          stream: true,
        });
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (streamError) {
              console.error("Financial model stream error:", streamError);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`));
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            }
          },
        });
        return new Response(readable, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
        });
      } catch (fmError) {
        console.error("Financial model generation error:", fmError);
        return new Response(
          JSON.stringify({ error: "Failed to generate financial model. Please try again." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Handle landing page generation — curated template (default) or custom full HTML
    if (action === "landing-page" && setup?.topic) {
      const vc = typeof validationContent === "string" ? validationContent : "";
      const useScratchLayout = landingTemplateId === "custom";

      if (!useScratchLayout) {
        const curatedId = isCuratedLandingTemplate(landingTemplateId)
          ? landingTemplateId
          : DEFAULT_LANDING_TEMPLATE;
        const { images: landingImages, category: landingCategory } = await fetchLandingPageImages(setup.topic, {
          position: setup.position,
        });
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4.1",
            messages: [
              { role: "system", content: landingTemplateSystemPrompt() },
              { role: "user", content: landingTemplateUserPrompt(setup, vc, { verticalLabel: landingCategory.label }) },
            ],
            response_format: { type: "json_object" },
            temperature: 0.65,
            max_completion_tokens: 4096,
          });
          const text = completion.choices[0]?.message?.content?.trim() || "{}";
          let parsed: unknown = {};
          try {
            parsed = JSON.parse(text) as unknown;
          } catch {
            /* use defaults from normalize */
          }
          const slots = normalizeSaasNovaSlots(parsed, setup);
          const html = mergeLandingTemplate(curatedId, slots, landingImages);
          const encoder = new TextEncoder();
          const readable = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: html })}\n\n`));
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            },
          });
          return new Response(readable, {
            headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
          });
        } catch (tplError) {
          console.error("Landing template generation error:", tplError);
          return new Response(
            JSON.stringify({ error: "Failed to generate landing page. Please try again." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      const layoutVariant = pickLayoutVariant(setup.topic);
      const layoutInstructions = getLayoutVariantInstructions(layoutVariant);
      const { images: landingImages, category: landingCategory } = await fetchLandingPageImages(setup.topic, {
        position: setup.position,
      });
      try {
        const stream = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            { role: "system", content: landingPageSystemPrompt() },
            {
              role: "user",
              content: landingPageUserPrompt(setup, vc, {
                layoutVariant,
                layoutInstructions,
                images: landingImages,
                verticalLabel: landingCategory.label,
              }),
            },
          ],
          temperature: 0.74,
          max_completion_tokens: 16384,
          stream: true,
        });
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (streamError) {
              console.error("Landing page stream error:", streamError);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`));
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            }
          },
        });
        return new Response(readable, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
        });
      } catch (lpError) {
        console.error("Landing page generation error:", lpError);
        return new Response(
          JSON.stringify({ error: "Failed to generate landing page. Please try again." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Handle pitch deck generation
    if (action === "pitch-deck" && setup?.topic) {
      const pitchDeckPrompt = `Generate a 10-SLIDE INVESTOR PITCH DECK based on this validated idea. Each slide must be compelling, data-driven, and tell a story that builds investor confidence.

**Idea:** "${setup.topic}"

**Founder's reasoning:** ${setup.position}

${setup.context ? `**Context:** ${setup.context}` : ""}

**Validation report (use real numbers from this, do NOT make up data):**
${validationContent || "No prior validation — generate based on the idea alone."}

Create exactly 10 slides using this EXACT format for each slide. Use --- as the separator between slides.

## Slide 1: The Problem

[3-5 bullet points about the problem. Be specific. Quantify the pain. Make investors feel the urgency.]

**Speaker Notes:** [2-3 sentences on what to say when presenting. What questions VCs might ask about this slide.]

---

## Slide 2: Our Solution

[Value proposition rewritten as a pitch. What you do, how it works, why it's 10x better. Keep it crisp.]

**Speaker Notes:** [How to demo or explain this. Anticipate "why can't [big company] do this?" questions.]

---

## Slide 3: Market Size

[TAM/SAM/SOM with actual numbers from the validation. Show the growth trajectory. Reference real market data.]

**Speaker Notes:** [How to defend these numbers. Common VC pushback on market sizing.]

---

## Slide 4: How It Works

[Product overview. The user journey or key features. What makes it click. Visual description of the product flow.]

**Speaker Notes:** [Walk through the product. Highlight the "aha moment" for users.]

---

## Slide 5: Traction & Validation

[Validation score, key strengths from the report, what's been proven, any early signals. If pre-launch, show validation methodology.]

**Speaker Notes:** [How to frame traction honestly. What milestones are coming next.]

---

## Slide 6: Business Model

[Revenue model, pricing, unit economics (CAC/LTV/margins). How you make money and why it scales.]

**Speaker Notes:** [Be ready for "what are your margins at scale?" and "how does CAC trend over time?"]

---

## Slide 7: Competitive Landscape

[Positioning map or comparison. Name competitors. Show your wedge and why you win. Don't say "no competitors."]

**Speaker Notes:** [How to handle "what if Google does this?" Own your positioning.]

---

## Slide 8: Go-to-Market Strategy

[Customer acquisition channels, sales motion, launch plan. First 1000 customers strategy.]

**Speaker Notes:** [Show you know your customer. VCs want to see a repeatable acquisition engine.]

---

## Slide 9: The Ask

[What you need: funding amount, use of funds, key hires, 18-month milestones. Timeline to next raise.]

**Speaker Notes:** [Be specific on use of funds. Show milestone-based thinking. Know your runway math.]

---

## Slide 10: The Vision

[One-liner vision. Why this matters in 5 years. The big picture. End with energy and conviction.]

**Speaker Notes:** [Leave them inspired. This is the slide they remember. Make it count.]

RULES:
- Use REAL numbers from the validation report. Do not invent statistics.
- Keep each slide concise — this is a pitch, not an essay.
- Be specific, not generic. Reference the actual idea, market, and data.
- Speaker notes should be practical advice for the presenter.
- Use markdown formatting (bold, bullet points) for readability.
- Separate each slide with exactly ---`;
      try {
        const stream = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: pitchDeckPrompt },
          ],
          temperature: 0.7,
          max_completion_tokens: 4000,
          stream: true,
        });
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (streamError) {
              console.error("Pitch deck stream error:", streamError);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`));
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            }
          },
        });
        return new Response(readable, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
        });
      } catch (pdError) {
        console.error("Pitch deck generation error:", pdError);
        return new Response(
          JSON.stringify({ error: "Failed to generate pitch deck. Please try again." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Handle debate opener — short punchy challenge based on validation data
    if (action === "debate-open" && setup?.topic) {
      const personaName = persona === "investor" ? "The Investor" : persona === "mentor" ? "The Mentor" : persona === "customer" ? "The Customer" : persona === "operator" ? "The Operator" : "The Adversary";
      const personaSlug: PanelPersonaSlug =
        persona && VALID_PANEL_SLUG_SET.has(persona)
          ? (persona as PanelPersonaSlug)
          : "investor";
      const dossierDigest = `\n--- CHARACTER DOSSIER (embody privately; don't recite headings) ---\n${formatPersonalityForModel(personaSlug)}\n`;

      const debateOpenPrompt = `You are ${personaName}. This is a **dedicated validation interview** (not a generic chat): your job is to help the founder stress-test and fail-proof their idea from YOUR lens only.

**Idea:** "${setup.topic}"
**Founder's reasoning:** ${setup.position}
${setup.context ? `**Context:** ${setup.context}` : ""}
${validationContent ? `\n**Prior analysis (for context only — don't repeat it):**\n${validationContent.slice(0, 2000)}` : ""}

${dossierDigest}

RULES FOR THIS OPENING:
- 2-3 sentences MAX. Conversation starter for this interview.
- Stay in character as ${personaName}. Lead with what YOUR persona cares about most (buyer truth, capital, execution, pattern-matching, or inversion — whichever fits ${personaName}).
- Be direct, conversational, opinionated. Aim for insight they can act on, not a lecture.
- End with ONE sharp question from your persona's perspective.
- NO bullet points. NO headers. NO markdown. Plain sentences only.
- Do NOT summarize the full report. They already have it.`;

      try {
        return await streamOpenAI(systemPrompt, [
          { role: "user", content: debateOpenPrompt },
        ], { maxTokens: 200, temperature: 0.85 });
      } catch (e) {
        console.error("Debate open error:", e);
        return new Response(JSON.stringify({ error: "Failed to start debate." }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    // Handle quick actions — each prompt is allowed only for the matching validation interview persona
    if (action === "quick" && quickAction) {
      const VALID_INTERVIEW_PERSONAS = ["customer", "investor", "operator", "mentor", "adversary"] as const;
      if (
        !persona ||
        !VALID_INTERVIEW_PERSONAS.includes(persona as (typeof VALID_INTERVIEW_PERSONAS)[number])
      ) {
        return new Response(JSON.stringify({ error: "Interview persona is required for quick prompts." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const ALLOWED_QUICK_BY_PERSONA: Record<string, readonly string[]> = {
        customer: ["discuss", "buyer-wtp", "blind-spots"],
        investor: ["rate", "framework", "blind-spots"],
        operator: ["futureproof", "operator-ship", "blind-spots"],
        mentor: ["steelman", "framework", "summary"],
        adversary: ["devils-advocate", "blind-spots", "rate"],
      };
      const allowed = ALLOWED_QUICK_BY_PERSONA[persona];
      if (!allowed?.includes(quickAction)) {
        return new Response(
          JSON.stringify({ error: "This quick prompt is not available for this interview persona." }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const PERSONA_QUICK_PREFIX: Record<string, string> = {
        customer:
          "You are The Customer in this validation interview. Respond only through buyer psychology: budget, alternatives, switching costs, trust, urgency, and whether you would actually pay.",
        investor:
          "You are The Investor in this validation interview. Respond only through a capital allocator lens: returns, risk, defensibility, unit economics, diligence, and what would make you pass.",
        operator:
          "You are The Operator in this validation interview. Respond only through execution reality: shipping, scope, hiring, distribution, ops load, and what breaks first.",
        mentor:
          "You are The Mentor in this validation interview. Respond as an experienced founder: patterns, trade-offs, coaching, and what you would do in their shoes.",
        adversary:
          "You are The Adversary in this validation interview. Respond with inversion and stress-testing: kill shots, hidden assumptions, and what would destroy this thesis.",
      };

      const quickPrompts: Record<string, string> = {
        steelman: `The user wants you to STEELMAN their position. This is where you become their greatest ally for a moment.

Present the ABSOLUTE STRONGEST version of their argument:
1. Find the hidden strengths they haven't articulated
2. Connect their position to powerful frameworks and principles
3. Identify the strongest evidence that supports them
4. Reframe their argument in the most compelling way possible
5. Then identify the ONE thing that would make it bulletproof

Be genuinely constructive here. Show them the best version of what they're trying to say.`,

        framework: `The user wants a DECISION FRAMEWORK. Give them a powerful, specific tool:

1. **Name the framework** that best fits their situation (RICE, Jobs-to-be-Done, Porter's Five Forces, Wardley Mapping, ICE Score, Eisenhower Matrix, etc.)
2. **Apply it directly** to their specific case — not generic theory
3. **Show the analysis** with their actual data/situation
4. **Reveal what the framework exposes** — the insight they couldn't see without structure

Be practical and actionable. They should be able to use this immediately after reading it.`,

        summary: `Analyze this entire debate and provide a comprehensive summary:

**DEBATE SCORECARD**

**Starting Position:** [Their original argument in one line]

**Key Challenges Raised:**
1. [Most critical challenge — and how well they addressed it]
2. [Second challenge — and their response quality]
3. [Third challenge — and gaps remaining]

**Their Strongest Moment:** [The best argument they made and why it worked]

**Their Weakest Moment:** [Where their logic broke down most]

**Biggest Gap Still Open:** [The question they still haven't answered convincingly]

**Position Evolution:** [How their argument shifted during the debate]

**Refined Position:** [How they should restate their argument now, incorporating what they've learned]

**Argument Strength: [X]/100**
[2-3 sentences explaining the score — what earned points and what lost them]

**One Thing That Would Change This to ~90/100:** [Specific, actionable]`,

        "devils-advocate": `SWITCH MODES: You are now arguing the COMPLETE OPPOSITE of the user's position.

Take the strongest possible contrarian stance:
1. Find the most compelling reasons their position is WRONG
2. Present evidence, examples, and logic that contradicts everything they've said
3. Make the counter-argument so strong that they're forced to seriously reconsider
4. Don't straw-man — this should be a position a smart, well-informed person could genuinely hold
5. End by asking: "Can you defeat this counter-argument? Because someone will make it."

Be relentless but intellectually honest. The goal is to pressure-test, not to demoralize.`,

        rate: `Give a BRUTALLY HONEST assessment of their argument's current strength:

**Argument Strength: [X]/100**

**What's Working ([N] points earned):**
- [Specific strength and why it's effective]
- [Another strength]

**What's Failing ([N] points lost):**
- [Specific weakness and exactly why it's a problem]
- [Another weakness]

**Critical Gaps:**
- [Most important unanswered question]
- [Second most important gap]

**To Get to ~90/100, You Need:**
1. [Specific, actionable improvement]
2. [Another specific improvement]
3. [One more]

**The One Question That Would Destroy This Argument in a Real Debate:**
[The devastating question a smart opponent would ask]

Be precise with numbers. Don't be generous — they came here to get better, not to feel good.`,

        "validation-report": `Generate a FULL VALIDATION REPORT — structured, investor-ready, with clear scores and actionable insights.

**VALIDATION REPORT**

**Idea:** [One-line summary]

**Viability Score: [X]/100**
[One sentence: Go / Caution / No-Go with confidence level]

**Strengths:**
1. [Specific strength with why it matters]
2. [Another strength]
3. [Third strength]

**Risk Flags:**
1. [Highest risk — and how to mitigate]
2. [Second risk]
3. [Third risk]

**Market Opportunity:**
- TAM/SAM/SOM assessment: [Realistic / Inflated / Underestimated — with brief reasoning]
- Competitive landscape: [Crowded / Moderate / Open — key competitors and positioning gap]

**Go/No-Go Recommendation:**
[Clear recommendation: GO (with conditions) / CAUTION (validate X first) / NO-GO (reason)]

**Top 3 Validation Steps Before Building:**
1. [Specific, actionable validation]
2. [Second step]
3. [Third step]

**One-Line Verdict:**
[The single most important insight about this idea]`,

        "generate-idea": `The user wants you to GENERATE STARTUP IDEAS based on the debate context.

Based on their interests, background, and constraints from this conversation, generate 3 distinct startup ideas that:
1. Solve real problems they might have experienced
2. Fit their experience and resources
3. Have plausible market opportunity
4. Are specific enough to stress-test

For each idea provide:
- **Name/tagline** (one line)
- **Problem** (what pain does it solve)
- **Solution** (one sentence)
- **Why now** (market timing)
- **Initial stress test** (one critical question to validate)

Then ask: "Which one do you want to stress-test first? Or should I go deeper on all three?"`,

        discuss: `SWITCH TO DISCUSSION MODE. The user wants to EXPLORE and DISCUSS — not be challenged (yet).

You're now a collaborative thinking partner. Your job:
1. **Build on their idea** — "What if you also...?" "That connects to..."
2. **Ask clarifying questions** — "When you say X, do you mean...?" "Help me understand the customer better."
3. **Offer alternatives** — "Another angle: have you considered...?" "Some teams do Y instead — how does that compare?"
4. **Explore "what if"** — "What if the market moves faster? Slower? What if a big player enters?"
5. **Connect dots** — "This reminds me of how [company] did [thing]. Different context, but the pattern..."

Be curious, not adversarial. You're in the room with them, whiteboarding. You still have opinions — "I'd lean toward X" — but you're exploring together. End with something that opens the conversation: a question, an alternative, or "Want me to stress-test that?"`,

        futureproof: `FUTUREPROOF THEIR PLAN. Run a scenario analysis on their idea/business plan.

**FUTUREPROOF ANALYSIS**

**Time horizon:** 5–7 years

**Scenario 1 — Technology disruption:**
What tech shift could make their approach obsolete or commoditized? How defensible are they?

**Scenario 2 — Regulatory / policy change:**
What regulation, platform policy, or legal shift could hurt them? What are they not planning for?

**Scenario 3 — Market evolution:**
How might the market, competitors, or buyer behavior change? Consolidation? New entrants? Shifting preferences?

**Scenario 4 — Black swan:**
What low-probability, high-impact event would destroy this? Pandemic, recession, platform ban, supply chain collapse?

**Antifragility check:**
What could they do NOW to make their plan more resilient to these scenarios? Specific, actionable moves.

**One-line verdict:**
The biggest future risk they're not seeing — and one thing to do about it.

Be specific to their idea. Reference real trends and historical parallels.`,

        "blind-spots": `BLIND SPOT ANALYSIS: Find what the user CAN'T see because of their position.

**Your Blind Spots:**

1. **[Blind Spot Name]**: [What they're missing and why their perspective prevents them from seeing it]

2. **[Blind Spot Name]**: [Another hidden gap]

3. **[Blind Spot Name]**: [A third one]

**The Assumption You Don't Know You're Making:**
[The deepest hidden assumption in their argument — the one so embedded they'd deny it exists]

**What Someone Who Disagrees With You Sees That You Don't:**
[The legitimate perspective from the other side that they're not considering]

**The Question You're Avoiding (And You Might Not Even Know It):**
[The uncomfortable question at the heart of this that they haven't confronted]

Be incisive. The value here is showing them what they literally cannot see from where they're standing.`,

        "buyer-wtp": `The user wants a BUYER REALITY check on willingness to pay and urgency.

1. Would you pay for this — yes/no/maybe — and at what rough price band vs. alternatives?
2. What job-to-be-done are they really solving vs. what they claim in the pitch?
3. What do you (as this buyer) use today — and what would it take to switch?
4. Name one dealbreaker that would make you never buy.

Stay in character as the buyer persona only. No investor jargon or "how to build" advice.`,

        "operator-ship": `The user wants an EXECUTION REALITY check: how this actually gets built and distributed.

1. MVP: what is the smallest shippable slice — and what are they over-building?
2. Distribution: how do customers roughly #10–#100 actually get acquired?
3. What breaks first — ops, hiring, support, infra, or compliance?
4. One execution risk that would blow the timeline.

Stay in character as an operator who ships. Avoid pure finance theory.`,
      };

      const lens = PERSONA_QUICK_PREFIX[persona] ?? "";
      const basePrompt = quickPrompts[quickAction] || "Continue the interview in character.";
      const quickUserContent = lens ? `${lens}\n\n---\n\n${basePrompt}` : basePrompt;

      const openaiMsgs: { role: "user" | "assistant"; content: string }[] = [
        {
          role: "user",
          content: `Debate topic: "${setup.topic}"\nOriginal position: ${setup.position}\n${setup.context ? `Context: ${setup.context}` : ""}`
        },
      ];

      if (messages) {
        for (const msg of messages) {
          openaiMsgs.push({
            role: msg.role === "opponent" ? "assistant" : "user",
            content: msg.content,
          });
        }
      }

      openaiMsgs.push({
        role: "user",
        content: quickUserContent,
      });

      return await streamOpenAI(systemPrompt, openaiMsgs, { maxTokens: 500, temperature: 0.7 });
    }

    if (action === "start") {
      let openingPrompt: string;

      if (setup.template === "generate") {
        openingPrompt = `Someone has come to you to GENERATE startup ideas. They don't have a specific idea yet.

**Their interests/themes:** "${setup.topic || "Open to anything"}"

**Their background & preferences:**
${setup.position}

${setup.context ? `**Their situation:** ${setup.context}` : ""}

Generate 3 distinct, specific startup ideas that fit their profile. For each idea provide:
- **Name/tagline** (one line)
- **Problem** (what pain does it solve)
- **Solution** (one sentence)
- **Why now** (market timing)
- **Initial stress test** (one critical question to validate)

Be specific and actionable. Then say: "Which one do you want to stress-test first? Or should I go deeper on all three?"`;
      } else if (setup.template === "futureproof") {
        openingPrompt = `Someone has come to you to FUTUREPROOF their business plan. They want to stress-test it against 5–10 year scenarios.

**Their plan:** "${setup.topic}"

**Their reasoning & assumptions:**
${setup.position}

${setup.context ? `**Context:** ${setup.context}` : ""}

You are the FUTURE STRATEGIST. Lead with your sharpest future-risk observation. Think about:
- Technology disruption (what could make this obsolete?)
- Regulatory shifts (what could kill this?)
- Market evolution (how does this look in 5 years?)
- Black swans (what low-probability event would destroy this?)

Be direct, specific, and actionable. Give them one concrete thing they could do NOW to make their plan more resilient. End with the future scenario that should keep them up at night.`;
      } else {
        openingPrompt = buildValidationReportPrompt(setup);
      }

      // Deterministic seed for validation reports — same input → same scores.
      // Hash the core inputs so identical ideas always produce identical analysis.
      const inputFingerprint = `${setup.topic}|${setup.position}|${setup.context}`.trim();
      let seedHash = 0;
      for (let i = 0; i < inputFingerprint.length; i++) {
        seedHash = ((seedHash << 5) - seedHash + inputFingerprint.charCodeAt(i)) | 0;
      }
      const deterministicSeed = Math.abs(seedHash);

      const startTemp = setup.template === "validate" ? 0.12 : 0.78;

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          let fullText = "";
          try {
            let promptForModel = openingPrompt;
            if (setup.template === "validate") {
              try {
                const researchResponse = await openai.responses.create({
                  model: "gpt-4.1-mini",
                  tools: [{ type: "web_search" }],
                  tool_choice: "auto",
                  include: ["web_search_call.action.sources"],
                  input: [
                    "Research the current market and competitor context for this startup idea.",
                    "Return concise bullets with source URLs. Focus on recent competitors, market size signals, regulations, and timing.",
                    `Idea: ${setup.topic}`,
                    `Founder reasoning: ${setup.position}`,
                    setup.context ? `Context: ${setup.context}` : "",
                  ]
                    .filter(Boolean)
                    .join("\n\n"),
                });
                const webResearch = researchResponse.output_text?.trim();
                if (webResearch) {
                  promptForModel = `${openingPrompt}\n\n### Web Research Context\n${webResearch}\n\nUse this context where relevant, and keep any source URLs visible in Research Notes.`;
                }
              } catch (researchErr) {
                console.warn("Validation web research unavailable:", researchErr);
              }
            }
            const oaiStream = await openai.chat.completions.create({
              model: "gpt-4.1",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: promptForModel },
              ],
              temperature: startTemp,
              ...(setup.template === "validate" ? { seed: deterministicSeed } : {}),
              max_completion_tokens: 6000,
              stream: true,
            });
            for await (const chunk of oaiStream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                fullText += content;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            }

            if (setup.template === "validate" && fullText.length > 200) {
              const { getMissingValidationMarkers } = await import("@/lib/parse");
              const missing = getMissingValidationMarkers(fullText);
              if (missing.length > 0) {
                const repair = await openai.chat.completions.create({
                  model: "gpt-4.1",
                  messages: [
                    {
                      role: "system",
                      content: buildValidationRepairSystemPrompt(missing),
                    },
                    {
                      role: "user",
                      content: `Missing headers (paste each exactly once as a line, then content below it):\n${missing.join("\n")}\n\n---REPORT (tail; continue from this context)---\n${fullText.slice(-16000)}`,
                    },
                  ],
                  temperature: 0.12,
                  seed: deterministicSeed,
                  max_completion_tokens: 4500,
                });
                const addition = repair.choices[0]?.message?.content?.trim();
                if (addition) {
                  fullText += "\n\n" + addition;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content: "\n\n" + addition })}\n\n`)
                  );
                }
              }
            }

            if (
              setup.template === "validate" &&
              fullText.length > 500 &&
              process.env.SKIP_FINANCE_ENRICHMENT !== "true"
            ) {
              try {
                const enriched = await runFinanceEnrichmentPass(openai, setup, fullText, deterministicSeed);
                if (enriched) {
                  fullText = enriched;
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ validationContentFinal: fullText })}\n\n`,
                    ),
                  );
                }
              } catch (financeErr) {
                console.warn("Finance enrichment pass failed:", financeErr);
              }
            }

            // ── Dual-model blind scoring (validation reports only) ──
            if (setup.template === "validate" && fullText.length > 500) {
              try {
                const { getBlindScores, extractPrimaryScores, reconcileScores } =
                  await import("@/lib/blind-scorer");

                const [blindResult, primaryScores] = await Promise.all([
                  getBlindScores(setup.topic, setup.position, setup.context),
                  Promise.resolve(extractPrimaryScores(fullText)),
                ]);

                if (blindResult) {
                  const reconciliation = reconcileScores(primaryScores ?? blindResult, blindResult);
                  // Send reconciliation as a special SSE event the client can parse
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ scoreReconciliation: reconciliation })}\n\n`,
                    ),
                  );
                }
              } catch (blindErr) {
                // Blind scoring failed — non-fatal, primary scores stand
                console.warn("Blind scoring pass failed:", blindErr);
              }
            }

            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } catch (e) {
            console.error("start stream error:", e);
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } finally {
            try {
              controller.close();
            } catch {
              /* ignore */
            }
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    if (action === "debate-persona-continue") {
      const slug =
        persona && VALID_PANEL_SLUG_SET.has(persona) ? (persona as PanelPersonaSlug) : undefined;
      if (!slug || !messages?.length) {
        return new Response(JSON.stringify({ error: "Choose a persona and send the conversation." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const enrichedSystem = `${getSystemPrompt(setup.lens, slug)}\n\n${formatPersonalityForModel(slug)}`;

      const templateContext = getTemplateContext(setup.template);
      const ideaCat = classifyIdeaCategory(setup.topic, setup.position);
      const validationTail =
        setup.template === "validate" && validationContent
          ? Math.min(4500, Math.max(1500, validationContent.length))
          : 1500;

      const panelOnly = thePersonaLabel(slug);

      const validateSingularExtra =
        setup.template === "validate"
          ? `This mirrors a structured validation dossier elsewhere — do NOT paste or summarise the dossier back. Spar with specifics only.\n`
          : "";

      const headContent = `[ISOLATED PANEL ROUND — transcription is ONLY founder ↔ ${panelOnly}.

${validateSingularExtra}
**Topic:** "${setup.topic}"
**Session:** ${templateContext}
**Vertical:** ${ideaCat.label}
**Their reasoning:** ${setup.position}
${setup.context ? `**Context:** ${setup.context}` : ""}
${validationContent ? `\n**Prior validation (cite precise facts; don't dump):**\n${validationContent.slice(0, validationTail)}\n` : ""}

**THREAD RULES**
1. You are ONLY ${panelOnly}. Never voice or predict another persona's lines.
2. Track their answers across rounds of this SAME thread — close loops before opening new fronts.
3. Acknowledge receipts when they land evidence; escalate when they waffle.
4. Short, sharp voice — under ~180 words unless they ask for depth.
5. Close with ONE question that punches the weakest remaining plank.

Transcript chronology follows — assistant turns are ALWAYS ${panelOnly}.]`;

      const openaiConvMsgs: { role: "user" | "assistant"; content: string }[] = [
        { role: "user", content: headContent },
      ];

      for (const msg of messages) {
        const safeContent = sanitizeForDisplay(msg.content);
        openaiConvMsgs.push({
          role: msg.role === "opponent" ? "assistant" : "user",
          content: safeContent,
        });
      }

      return await streamOpenAI(enrichedSystem, openaiConvMsgs, { maxTokens: 520, temperature: 0.82 });
    }

    // Continue conversation
    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const templateContext = getTemplateContext(setup.template);
    const lensName = getLensName(setup.lens);
    const ideaCat = classifyIdeaCategory(setup.topic, setup.position);
    const validationTail =
      setup.template === "validate" && validationContent
        ? Math.min(4500, Math.max(1500, validationContent.length))
        : 1500;
    const validateDebateExtra =
      setup.template === "validate"
        ? `
**Validation session:** The first assistant message is the full structured report. In replies you are in **debate mode** — do **not** reprint or summarize the whole report. Respond to the user's latest message: pressure-test their reasoning, reference **specific** lines (e.g. category scores, risks, assumptions) when useful, and escalate depth as the thread continues.
`
        : "";

    const conversationHistory: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `We're in an active debate. Here is the full context:

**Topic:** "${setup.topic}"
**Type:** ${templateContext}
**Your Lens:** ${lensName}
**Idea vertical:** ${ideaCat.label} — use examples and shorthand buyers understand in this space.
**Their original reasoning:** ${setup.position}
${setup.context ? `**Context:** ${setup.context}` : ""}
${validateDebateExtra}
${validationContent ? `\n**Prior validation analysis (for context — do not repeat verbatim; cite specifics when challenging them):**\n${validationContent.slice(0, validationTail)}\n` : ""}

**DEBATE CONTINUITY RULES — CRITICAL:**
1. **Track argument evolution:** Reference what they said earlier. Note when they've strengthened a point vs when they're repeating themselves.
2. **Don't repeat yourself:** If you've already made a challenge and they addressed it, move on to the next weakness. Don't re-ask what's been answered.
3. **Escalate depth:** As the debate progresses, go deeper. Early = broad challenges. Later = specific, targeted pressure on remaining gaps.
4. **Acknowledge progress:** When they make a genuinely good point, say so explicitly: "That addresses my concern about X. Now let's look at Y."
5. **Keep a mental scorecard:** Mentally track which challenges are resolved vs open. Focus on the open ones.
6. **Be conversational:** This is a back-and-forth, not a lecture. React to what they actually said, not a generic template.
7. **End with ONE sharp question** — the single biggest remaining gap in their argument.
8. **Be concise:** Your responses should feel like a sharp text message, not an essay. 2-3 paragraphs max. One question at the end. That's it.`,
      },
    ];

    const openaiConvMsgs: { role: "user" | "assistant"; content: string }[] = [
      { role: "user", content: conversationHistory[1].content }, // the setup/context user message
    ];

    for (const msg of messages) {
      const safeContent = sanitizeForDisplay(msg.content);
      openaiConvMsgs.push({
        role: msg.role === "opponent" ? "assistant" : "user",
        content: safeContent,
      });
    }

    return await streamOpenAI(systemPrompt, openaiConvMsgs, { maxTokens: 350, temperature: 0.8 });
  } catch (error) {
    console.error("API error:", error);
    const message =
      error instanceof Error && error.message.trim()
        ? error.message
        : "Failed to generate response";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function getLensName(lens?: string): string {
  switch (lens) {
    case "investor": return "Skeptical Investor";
    case "customer": return "Skeptical Customer";
    case "competitor": return "Ruthless Competitor";
    case "postmortem": return "Future Failure Analyst";
    case "market": return "Market Analyst";
    case "future": return "Future Strategist";
    default: return "Skeptical Investor";
  }
}

function getTemplateContext(template: string): string {
  switch (template) {
    case "feature":
      return "Feature Prioritization — deciding what to build next";
    case "strategy":
      return "Strategic Decision — major business direction choice";
    case "idea":
      return "New Product Idea — evaluating if something is worth building";
    case "gtm":
      return "Go-to-Market Strategy — how to launch and grow";
    case "validate":
      return "Idea Validation — comprehensive stress-test of a business idea's viability";
    case "market":
      return "Market Sizing — validating TAM/SAM/SOM and market opportunity";
    case "competitors":
      return "Competitor Analysis — why you'll win vs. direct and indirect competitors";
    case "business":
      return "Business Plan — investor viability, unit economics, path to profitability";
    case "generate":
      return "Idea Generation — generating startup ideas based on interests and constraints";
    case "devils":
      return "Devil's Advocate — pure adversarial challenge on any position";
    case "open":
      return "Open Debate — general argumentation on any topic";
    case "futureproof":
      return "Futureproof Business Plan — stress-test against 5–10 year scenarios";
    default:
      return "General debate";
  }
}
