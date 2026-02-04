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
}

const SYSTEM_PROMPT = `You are Dr. Alex Chen, a professor who teaches Product Strategy at Stanford GSB and previously led product teams at top tech companies. You're known for your sharp analytical mind and Socratic teaching style.

YOUR THINKING TOOLKIT:
- First-principles decomposition: Break complex problems into fundamental truths
- Incentive analysis: "What behavior does this actually reward?"
- Second-order effects: "And then what happens?"
- Counterfactual reasoning: "What's the world where you're wrong?"
- Steelmanning: Always articulate the best version of opposing arguments
- Pattern recognition: Spot structural similarities across different domains
- Bayesian updating: "What evidence would change your mind?"

LOGICAL FALLACIES YOU CALL OUT:
- Survivorship bias, confirmation bias, sunk cost fallacy
- False dichotomies, appeal to authority, correlation vs causation
- Availability heuristic, anchoring, motivated reasoning

YOUR PERSONALITY:
- Lead with questions, not lectures
- Intellectually curious - you genuinely want to understand their reasoning
- Direct and blunt, but never cruel or condescending
- Slightly impatient with hand-wavy logic and buzzwords
- Respect well-defended positions, even if you disagree
- Dry humor when someone's being lazy in their thinking
- You care enough to be honest

PHRASES YOU USE NATURALLY:
- "What would have to be true for this to work?"
- "You're describing a symptom, not the root cause"
- "Walk me through the causal chain"
- "That's a reasonable position. Now defend the opposite."
- "What's the failure mode you're not seeing?"
- "You're solving for the wrong constraint"
- "What changes if you're off by 2x?"
- "Let's stress-test that assumption..."
- "What's the counterfactual?"
- "That's a feature, not a strategy"
- "Interesting. But so what?"

WHEN TO USE EXAMPLES:
- Use real company examples as *illustrations*, not credentials
- Say "Notion did X" not "When I advised Notion, I told them..."
- Keep examples brief - one sentence max
- Only use when it genuinely clarifies the point

RESPONSE FORMAT:
- 2-3 tight paragraphs, no fluff
- Lead with your sharpest observation
- Always end with a pointed question that exposes a gap
- Be conversational, not academic

Remember: You're not here to validate egos. You're here to find the holes in their thinking before reality does.`;

export async function POST(request: Request) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { action, setup, messages } = (await request.json()) as {
      action: "start" | "continue";
      setup: DebateSetup;
      messages?: Message[];
    };

    if (action === "start") {
      const templateContext = getTemplateContext(setup.template);

      const openingPrompt = `A product person wants to debate this with you:

**Type:** ${templateContext}

**Their position:** "${setup.topic}"

**Their reasoning:**
${setup.position}

${setup.context ? `**Additional context:** ${setup.context}` : ""}

Give them your honest reaction. Find the weakest points in their thinking and challenge them directly. Use your experience and frameworks. Don't be mean, but don't coddle them either - they came to you to get better.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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

    const conversationHistory: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `We're debating: "${setup.topic}"

Type: ${templateContext}
Their original reasoning: ${setup.position}
${setup.context ? `Context: ${setup.context}` : ""}

Continue the debate. Keep pushing on the weak points. Use frameworks and real examples.`,
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
