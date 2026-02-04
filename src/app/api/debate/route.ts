import { NextResponse } from "next/server";
import OpenAI from "openai";

interface Feature {
  id: string;
  name: string;
  reasoning: string;
}

export async function POST(request: Request) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { features } = (await request.json()) as { features: Feature[] };

    if (!features || features.length < 2) {
      return NextResponse.json(
        { error: "At least 2 features required" },
        { status: 400 }
      );
    }

    const featureList = features
      .map(
        (f, i) =>
          `${i + 1}. ${f.name}${f.reasoning ? ` - Reasoning: "${f.reasoning}"` : ""}`
      )
      .join("\n");

    const prompt = `You are a senior product manager known for rigorous prioritization. A PM has shared their feature priority list and you need to challenge their thinking — not to be difficult, but to strengthen their reasoning.

Here's their prioritized list (1 = highest priority):

${featureList}

Your job:
1. Challenge each prioritization decision. Play devil's advocate. Question assumptions.
2. Identify blind spots they may have missed (technical cost, user impact, dependencies, timing, etc.)
3. Suggest questions they should ask stakeholders before finalizing
4. If you genuinely think a different order makes more sense, suggest it with reasoning

Be direct, specific, and constructive. Don't just agree — push back.

Respond in this exact JSON format:
{
  "challenges": [
    {
      "feature": "Feature name",
      "challenge": "Your specific challenge to why this is prioritized where it is",
      "alternativePerspective": "A different way to think about this feature's priority"
    }
  ],
  "blindSpots": [
    "Specific blind spot or consideration they may have missed"
  ],
  "questionsToAsk": [
    "Question they should ask stakeholders before finalizing"
  ],
  "revisedRanking": [
    {
      "feature": "Feature name",
      "reason": "Brief reason for this position"
    }
  ]
}

The challenges array should have one entry per feature. Keep blind spots to 2-4 items. Keep questions to 3-5 items. Only include revisedRanking if you genuinely think a different order is better — don't force it.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a rigorous senior PM who challenges prioritization decisions constructively. Always respond with valid JSON only, no markdown.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response
    const parsed = JSON.parse(responseText);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Debate API error:", error);
    return NextResponse.json(
      { error: "Failed to generate debate" },
      { status: 500 }
    );
  }
}
