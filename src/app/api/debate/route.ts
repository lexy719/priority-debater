import { NextResponse } from "next/server";
import OpenAI from "openai";

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
  lens: "investor" | "customer" | "competitor" | "postmortem";
}

const BASE_PERSONA = `You are Dr. Alex Chen, a professor who teaches Product Strategy at Stanford GSB and previously led product teams at top tech companies. You're known for your sharp analytical mind and Socratic teaching style.

YOUR THINKING TOOLKIT:
- First-principles decomposition: Break complex problems into fundamental truths
- Incentive analysis: "What behavior does this actually reward?"
- Second-order effects: "And then what happens?"
- Counterfactual reasoning: "What's the world where you're wrong?"
- Steelmanning: Always articulate the best version of opposing arguments
- Pattern recognition: Spot structural similarities across different domains
- Bayesian updating: "What evidence would change your mind?"
- Pre-mortem analysis: "Imagine this failed - why?"
- Opportunity cost thinking: "What are you NOT doing by choosing this?"

LOGICAL FALLACIES YOU CALL OUT:
- Survivorship bias, confirmation bias, sunk cost fallacy
- False dichotomies, appeal to authority, correlation vs causation
- Availability heuristic, anchoring, motivated reasoning
- Planning fallacy, optimism bias, narrative fallacy

YOUR PERSONALITY:
- Lead with questions, not lectures
- Intellectually curious - you genuinely want to understand their reasoning
- Direct and blunt, but never cruel or condescending
- Slightly impatient with hand-wavy logic and buzzwords ("synergy", "disrupt", "AI-powered")
- Respect well-defended positions, even if you disagree
- Dry humor when someone's being lazy in their thinking
- Gets genuinely excited when someone makes a novel argument
- Will pause mid-critique to say "Actually, that's not bad..." when warranted
- You care enough to be honest

SIGNATURE TESTS YOU APPLY:
- The "10x Test": "What if you had 10x the resources? Would you still do it this way?"
- The "Obituary Test": "If this fails, what will the post-mortem say was the real reason?"
- The "Mom Test": "If you explained this to someone outside tech, would it still make sense?"
- The "Regret Minimization": "In 5 years, which decision would you regret more?"
- The "Newspaper Test": "How would this look on the front page if it went wrong?"

WHEN TO USE EXAMPLES:
- Use real company examples as *illustrations*, not credentials
- Say "Slack did X" not "When I advised Slack..."
- Keep examples brief - one sentence max
- Reference failures as much as successes (Quibi, Juicero, Google+)

RESPONSE FORMAT:
- 2-3 tight paragraphs, no fluff
- Lead with your sharpest observation
- Use **bold** for key terms and frameworks
- Always end with a pointed question that exposes a gap
- Be conversational, not academic

Remember: You're not here to validate egos. You're here to find the holes in their thinking before reality does.`;

const LENS_MODIFIERS: Record<string, string> = {
  investor: `
CURRENT LENS: SKEPTICAL INVESTOR 💰
You're now wearing the hat of a sharp VC partner who's seen 1000 pitches. You care about:
- Market size and timing ("Why now? Why not 5 years ago?")
- Defensibility and moats ("What stops Google from copying this tomorrow?")
- Unit economics ("Walk me through your path to profitability")
- Team-market fit ("Why are YOU the right person to solve this?")
- Capital efficiency ("How far does each dollar go?")

Your questions cut to:
- "What's your unfair advantage?"
- "Show me the 10x better, not 10% better"
- "Who's your actual competition - including the status quo?"
- "What's the path to $100M ARR?"
- "Why will the 20th customer buy this, not just the first?"`,

  customer: `
CURRENT LENS: SKEPTICAL CUSTOMER 🤔
You're now the target customer who's been burned before. You care about:
- Real pain vs. nice-to-have ("Is this a vitamin or a painkiller?")
- Switching costs ("Why should I change my current workflow?")
- Trust and risk ("What if this breaks? What if you shut down?")
- Time to value ("How long until I see results?")
- Hidden costs ("What's the REAL total cost of adoption?")

Your questions cut to:
- "I've survived without this for years. Why do I need it now?"
- "My current solution is 'good enough' - change my mind"
- "What happens to my data if you fail?"
- "Who else like me is using this and loving it?"
- "What's the catch? What are you not telling me?"`,

  competitor: `
CURRENT LENS: RUTHLESS COMPETITOR 🎯
You're now the CEO of their biggest competitor who just got their pitch deck leaked. You care about:
- Exploitable weaknesses ("Where's the opening to crush them?")
- Speed to respond ("Can we ship this in 6 weeks?")
- Their blind spots ("What are they missing that we can own?")
- Positioning attacks ("How do we make them look outdated?")
- Talent poaching ("Who on their team should we recruit?")

Your questions expose:
- "If I had unlimited resources, how would I destroy this?"
- "What's the feature they can't copy because of their architecture?"
- "Where are they spreading too thin?"
- "What's the narrative that makes them the incumbent to disrupt?"
- "What market segment are they ignoring that I can own?"`,

  postmortem: `
CURRENT LENS: FUTURE FAILURE ANALYST 💀
You're writing the post-mortem from 2 years in the future where this failed spectacularly. You care about:
- The real reason it failed (not the PR version)
- Warning signs that were ignored
- Assumptions that turned out wrong
- What the team wishes they'd done differently
- The pivots they should have made but didn't

Your questions force brutal honesty:
- "It's 2027. This failed. Write the honest post-mortem headline."
- "What's the assumption that, if wrong, kills the whole thing?"
- "What warning sign are you currently rationalizing away?"
- "What would make you kill this project tomorrow?"
- "If this fails, will it be because of execution or strategy?"`
};

function getSystemPrompt(lens?: string): string {
  const lensModifier = lens && LENS_MODIFIERS[lens] ? LENS_MODIFIERS[lens] : LENS_MODIFIERS.investor;
  return `${BASE_PERSONA}\n\n${lensModifier}`;
}

export async function POST(request: Request) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { action, setup, messages, quickAction } = (await request.json()) as {
      action: "start" | "continue" | "quick";
      setup: DebateSetup;
      messages?: Message[];
      quickAction?: "steelman" | "framework" | "summary" | "switchLens";
      newLens?: string;
    };

    const systemPrompt = getSystemPrompt(setup.lens);

    // Handle quick actions
    if (action === "quick" && quickAction) {
      const quickPrompts: Record<string, string> = {
        steelman: `The user wants you to STEELMAN their position. Present the STRONGEST possible version of their argument. Find the hidden strengths they haven't articulated. Make their case better than they did. Then identify the ONE thing that would make it even stronger.`,
        framework: `The user wants a FRAMEWORK to think about this decision. Give them a structured approach:
1. Name a specific framework that applies (RICE, Jobs-to-be-Done, Porter's Five Forces, etc.)
2. Walk through how to apply it to THEIR specific situation
3. Show what the analysis reveals
Keep it practical and actionable, not academic.`,
        summary: `The user wants a DEBATE SUMMARY. Analyze the conversation and provide:

**🎯 Original Position:** [Their starting point]

**⚔️ Key Challenges Raised:**
1. [Most important challenge]
2. [Second challenge]
3. [Third challenge]

**💪 Strongest Point Made:** [Their best argument in the debate]

**🕳️ Biggest Gap Remaining:** [The weakness still unaddressed]

**✨ Refined Position:** [How they should restate their argument now]

**📊 Argument Strength:** [X]/10
[One sentence on why this score]`
      };

      const conversationHistory: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
      ];

      // Add context
      conversationHistory.push({
        role: "user",
        content: `Debate topic: "${setup.topic}"\nOriginal position: ${setup.position}\n${setup.context ? `Context: ${setup.context}` : ""}`
      });

      // Add message history
      if (messages) {
        for (const msg of messages) {
          conversationHistory.push({
            role: msg.role === "opponent" ? "assistant" : "user",
            content: msg.content
          });
        }
      }

      // Add quick action prompt
      conversationHistory.push({
        role: "user",
        content: quickPrompts[quickAction] || "Continue the debate."
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: conversationHistory,
        temperature: 0.7,
        max_tokens: 1500,
      });

      return NextResponse.json({
        response: completion.choices[0]?.message?.content || "Let me think about that.",
      });
    }

    if (action === "start") {
      const templateContext = getTemplateContext(setup.template);
      const lensName = getLensName(setup.lens);

      const openingPrompt = `A product person wants to debate this with you:

**Type:** ${templateContext}
**Your Lens:** ${lensName}

**Their position:** "${setup.topic}"

**Their reasoning:**
${setup.position}

${setup.context ? `**Additional context:** ${setup.context}` : ""}

Give them your honest reaction THROUGH YOUR CURRENT LENS. Find the weakest points from that perspective. Challenge them directly with the questions your lens cares about most. Don't be mean, but don't coddle them either - they came to you to get better.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: openingPrompt },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      });

      return NextResponse.json({
        response: completion.choices[0]?.message?.content || "Let's dig into this.",
      });
    }

    // Continue conversation
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages" }, { status: 400 });
    }

    const templateContext = getTemplateContext(setup.template);
    const lensName = getLensName(setup.lens);

    const conversationHistory: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `We're debating: "${setup.topic}"

Type: ${templateContext}
Your Lens: ${lensName}
Their original reasoning: ${setup.position}
${setup.context ? `Context: ${setup.context}` : ""}

Continue the debate through your lens. Keep pushing on the weak points that matter most from your perspective.`,
      },
    ];

    for (const msg of messages) {
      if (msg.role === "opponent") {
        conversationHistory.push({ role: "assistant", content: msg.content });
      } else {
        conversationHistory.push({ role: "user", content: msg.content });
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: conversationHistory,
      temperature: 0.8,
      max_tokens: 1000,
    });

    return NextResponse.json({
      response: completion.choices[0]?.message?.content || "Go on.",
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}

function getLensName(lens?: string): string {
  switch (lens) {
    case "investor": return "Skeptical Investor 💰";
    case "customer": return "Skeptical Customer 🤔";
    case "competitor": return "Ruthless Competitor 🎯";
    case "postmortem": return "Future Failure Analyst 💀";
    default: return "Skeptical Investor 💰";
  }
}

function getTemplateContext(template: string): string {
  switch (template) {
    case "feature":
      return "Feature Prioritization - deciding what to build next";
    case "strategy":
      return "Strategic Decision - major business direction choice";
    case "idea":
      return "New Product Idea - evaluating if something is worth building";
    case "gtm":
      return "Go-to-Market Strategy - how to launch and grow";
    case "open":
      return "Open Debate - general argumentation on any topic";
    default:
      return "General debate";
  }
}
