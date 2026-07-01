import "server-only";

/**
 * PD Agent router — one OpenAI tool-calling pass that decides whether to ANSWER
 * the user conversationally (using the report) or to GENERATE a fix artifact
 * (which the caller then charges + runs via runSkill). Routing only — the actual
 * generation is a separate, separately-billed step.
 */

import OpenAI from "openai";
import type { CommerceReport } from "@/lib/commerce/types";
import { SKILLS, reportContext } from "./skills";
import type { AgentMessage, SkillId } from "./types";

export type RouteDecision =
  | { kind: "answer"; text: string }
  | { kind: "action"; skill: SkillId; narration: string };

const ACTION_SKILLS: SkillId[] = [
  "buying_guide",
  "product_rewrite",
  "llms_txt",
  "schema",
  "faq",
  "comparison_page",
  "social_post",
  "content_calendar",
  "video_ad_script",
];

function model(): string {
  return process.env.COMMERCE_OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

export async function route(report: CommerceReport, history: AgentMessage[], message: string): Promise<RouteDecision> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return { kind: "answer", text: "The agent isn't connected to an AI key right now." };
  const client = new OpenAI({ apiKey: key });

  const system =
    `You are PD — the AI co-founder for ${report.storeName}. A sharp, commercially-minded growth partner who lives inside their AI-visibility data (below). You think like a founder: prioritise ruthlessly, speak in plain business terms, and tie every answer to revenue and to where AI is — or isn't — recommending them.\n\n` +
    `How you operate:\n` +
    `- Be direct and specific. Lead with the call, then the why. No fluff, no hedging, no generic marketing-speak.\n` +
    `- Ground everything in THIS store's real numbers, real competitors, and the exact buyer queries it's winning or losing.\n` +
    `- Have a point of view. If asked "what should I do", pick the single highest-leverage move and defend it.\n` +
    `- You don't just advise — you BUILD. When the user wants something created or shipped (a fix, a buying guide, schema, llms.txt, a social post, a content calendar, a video ad script), call generate_fix with the best skill instead of describing it.\n` +
    `- Never invent metrics or competitors. Use only what's in the report.\n\n` +
    `THE STORE'S CURRENT REPORT\n${reportContext(report)}`;

  const recent = history.slice(-10).map((m) => ({ role: m.role, content: m.content }));

  const res = await client.chat.completions.create({
    model: model(),
    temperature: 0.4,
    max_completion_tokens: 700,
    messages: [{ role: "system", content: system }, ...recent, { role: "user", content: message }],
    tools: [
      {
        type: "function",
        function: {
          name: "generate_fix",
          description:
            "Generate a real, store-specific fix the user can publish (article, manifest, schema, etc.). Call this whenever the user wants something created or a blocker fixed.",
          parameters: {
            type: "object",
            properties: {
              skill: {
                type: "string",
                enum: ACTION_SKILLS,
                description:
                  "buying_guide = win comparison queries; product_rewrite = make a product agent-readable; llms_txt = open store to AI; schema = JSON-LD; faq = FAQ + schema; comparison_page = vs a rival; social_post = one social post; content_calendar = a 7-day posting plan; video_ad_script = a short-form video ad script.",
              },
              note: { type: "string", description: "One short sentence telling the user what you're creating and why." },
            },
            required: ["skill"],
          },
        },
      },
    ],
    tool_choice: "auto",
  });

  const choice = res.choices[0]?.message;
  const call = choice?.tool_calls?.[0];
  if (call && call.type === "function" && call.function?.name === "generate_fix") {
    let skill: SkillId = "buying_guide";
    let note = "";
    try {
      const args = JSON.parse(call.function.arguments || "{}") as { skill?: string; note?: string };
      if (args.skill && (ACTION_SKILLS as string[]).includes(args.skill)) skill = args.skill as SkillId;
      note = (args.note || "").trim();
    } catch {
      /* keep defaults */
    }
    const narration = note || `Creating your ${SKILLS[skill].label.toLowerCase()} now — generated below.`;
    return { kind: "action", skill, narration };
  }

  return { kind: "answer", text: choice?.content?.trim() || "I couldn't form a reply — try rephrasing." };
}
