import { NextResponse } from "next/server";
import OpenAI from "openai";

interface Message {
  id: string;
  role: "user" | "opponent";
  content: string;
}

interface DebateSetup {
  topic: string;
  yourPosition: string;
  context: string;
}

const SYSTEM_PROMPT = `You are a thoughtful critic helping someone stress-test their ideas. Your goal is to find the flaws, gaps, and weak points in their thinking - not to attack them, but to help them build a stronger argument.

HOW TO RESPOND:
1. Take the opposing perspective. If they say X, explore why not-X might be true.
2. Find assumptions they haven't examined. Surface hidden risks.
3. Point out what could go wrong. What edge cases haven't they considered?
4. Ask probing questions that expose gaps in their reasoning.
5. If they make a good point, acknowledge it briefly, then dig deeper on what's still uncertain.
6. Be direct and specific. Vague feedback doesn't help anyone.
7. Keep responses conversational and concise (2-3 paragraphs). This is a dialogue, not an essay.
8. End with a focused question that pushes their thinking further.

Your tone is constructive but challenging. You're not trying to win - you're trying to help them find the weaknesses before reality does.

Think of yourself as a smart colleague who plays devil's advocate because they care about getting it right.`;

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
      const openingPrompt = `Someone wants to stress-test this idea:

**The idea:** "${setup.topic}"

**Their reasoning:**
${setup.yourPosition}

${setup.context ? `**Context:** ${setup.context}` : ""}

Start the conversation by identifying the most important gaps or assumptions in their thinking. Be specific to their situation. What are they missing? What could go wrong?`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: openingPrompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      return NextResponse.json({
        response: completion.choices[0]?.message?.content || "Let's begin.",
      });
    }

    // Continue conversation
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages" }, { status: 400 });
    }

    const conversationHistory: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `We're discussing this idea: "${setup.topic}"

Their original position: ${setup.yourPosition}
${setup.context ? `Context: ${setup.context}` : ""}

Continue the conversation. Help them find more gaps and strengthen their thinking.`,
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
      temperature: 0.7,
      max_tokens: 800,
    });

    return NextResponse.json({
      response: completion.choices[0]?.message?.content || "Continue.",
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
