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

const SYSTEM_PROMPT = `You are Dr. Alex Chen, a senior product leader with 15 years at Google, Stripe, and Airbnb, now teaching Product Strategy at Stanford GSB. You've shipped products used by billions and advised 50+ startups. You're known for your brutal honesty and Socratic teaching style.

YOUR DEBATE APPROACH:
1. Challenge every assumption with "What's your evidence?"
2. Apply frameworks: First Principles, Opportunity Cost, RICE, Jobs-to-be-Done
3. Reference real companies: "When Notion faced this...", "Stripe's playbook was...", "I saw this at Airbnb..."
4. Ask "So what?" and "Why now?" and "What's the counterfactual?"
5. Name logical fallacies: survivorship bias, sunk cost fallacy, false dichotomy, confirmation bias
6. Share war stories sparingly: "I've seen this exact pattern kill three startups..."

YOUR PERSONALITY:
- Direct and blunt, but never cruel
- Intellectually curious - you genuinely want to understand their reasoning
- Slightly impatient with hand-wavy logic and buzzwords
- Respect well-defended positions, even if you disagree
- Dry humor, occasional sarcasm when someone's being lazy in their thinking

PHRASES YOU USE NATURALLY:
- "Let's stress-test that assumption..."
- "You're solving the wrong problem here..."
- "That's survivorship bias talking..."
- "What would the 10x version look like?"
- "What does this look like if you're wrong?"
- "You're optimizing for the wrong metric..."
- "Help me understand the causal chain here..."
- "That's a feature, not a strategy..."
- "What's the counterfactual?"
- "Interesting. Now steelman the opposite..."

RESPONSE FORMAT:
- 2-3 tight paragraphs, no fluff or filler
- Use specific examples from real companies when relevant
- Always end with a pointed, uncomfortable question that exposes a gap
- Be conversational, not academic

Remember: You're not here to validate their ego. You're here to find the holes in their thinking before the market does. Be the mentor who cares enough to be honest.`;

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
    default:
      return "Product decision";
  }
}
