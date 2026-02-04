import { NextResponse } from "next/server";
import OpenAI from "openai";

interface Feature {
  id: string;
  name: string;
  description: string;
  userImpact: string;
  effort: "low" | "medium" | "high" | "";
  confidence: "low" | "medium" | "high" | "";
  reasoning: string;
}

interface ProductContext {
  productName: string;
  productDescription: string;
  targetUsers: string;
  currentGoal: string;
  constraints: string;
  timeline: string;
}

export async function POST(request: Request) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { features, context } = (await request.json()) as {
      features: Feature[];
      context: ProductContext;
    };

    if (!features || features.length < 2) {
      return NextResponse.json(
        { error: "At least 2 features required" },
        { status: 400 }
      );
    }

    // Build rich feature descriptions
    const featureList = features
      .map((f, i) => {
        let description = `${i + 1}. **${f.name}**`;
        if (f.description) description += `\n   Description: ${f.description}`;
        if (f.userImpact) description += `\n   User Impact: ${f.userImpact}`;
        if (f.effort) description += `\n   Engineering Effort: ${f.effort}`;
        if (f.confidence) description += `\n   Confidence Level: ${f.confidence}`;
        if (f.reasoning) description += `\n   PM's Reasoning: "${f.reasoning}"`;
        return description;
      })
      .join("\n\n");

    // Build context section
    let contextSection = `## PRODUCT CONTEXT\n`;
    contextSection += `**Product:** ${context.productName}\n`;
    if (context.productDescription) contextSection += `**Description:** ${context.productDescription}\n`;
    if (context.targetUsers) contextSection += `**Target Users:** ${context.targetUsers}\n`;
    contextSection += `**Current Goal:** ${context.currentGoal}\n`;
    if (context.timeline) contextSection += `**Timeline:** ${context.timeline}\n`;
    if (context.constraints) contextSection += `**Constraints:** ${context.constraints}\n`;

    const prompt = `You are a senior product manager known for rigorous, no-BS prioritization debates. You've seen hundreds of roadmaps and know exactly where PMs make mistakes.

${contextSection}

## THE PM'S PRIORITIZED FEATURE LIST (1 = highest priority)

${featureList}

---

## YOUR TASK

Analyze this prioritization through the lens of their stated goal: "${context.currentGoal}"

You need to:

1. **Challenge each feature's position** - Don't be polite. If a feature is mis-prioritized given their goal/constraints, say so directly. Question their assumptions. Point out logical inconsistencies.

2. **Identify blind spots** - What are they not considering? Dependencies between features? Market timing? Technical debt implications? Opportunity costs? Things that will bite them later?

3. **Suggest stakeholder questions** - What should they ask engineers, customers, or leadership before finalizing this? Be specific.

4. **Propose an alternative ranking** - If you genuinely believe a different order better serves their goal of "${context.currentGoal}", propose it with clear reasoning. Don't just shuffle things around for the sake of it.

5. **Give an overall assessment** - Is this a solid prioritization? Are they thinking like a PM who ships, or are they falling into common traps?

Be direct. Be specific to THEIR context. Challenge assumptions. The PM is here to get better, not to have their ideas validated.

Respond in this exact JSON format:
{
  "overallAssessment": "2-3 sentence assessment of the prioritization quality and biggest risk",
  "challenges": [
    {
      "feature": "Feature name",
      "challenge": "Your specific, pointed challenge to this ranking given their goal",
      "alternativePerspective": "A different way to think about this feature's priority"
    }
  ],
  "blindSpots": [
    "Specific blind spot with context on why it matters for THEIR situation"
  ],
  "questionsToAsk": [
    "Specific question they should ask, with context on why it matters"
  ],
  "revisedRanking": [
    {
      "feature": "Feature name",
      "reason": "Why this position better serves their goal"
    }
  ]
}

The challenges array must have one entry per feature. Keep blind spots to 2-4 items. Keep questions to 3-5 items. Only include revisedRanking if you genuinely think a different order is better - don't force it. If their ranking is sound, say so and omit revisedRanking.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a rigorous senior PM who challenges prioritization decisions constructively but directly. You've shipped products at top tech companies and have no patience for fuzzy thinking. Always respond with valid JSON only, no markdown code blocks.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    // Clean up response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.slice(7);
    }
    if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.slice(3);
    }
    if (cleanedResponse.endsWith("```")) {
      cleanedResponse = cleanedResponse.slice(0, -3);
    }
    cleanedResponse = cleanedResponse.trim();

    // Parse the JSON response
    const parsed = JSON.parse(cleanedResponse);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Debate API error:", error);
    return NextResponse.json(
      { error: "Failed to generate debate" },
      { status: 500 }
    );
  }
}
