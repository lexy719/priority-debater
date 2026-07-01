import "server-only";

/**
 * PD Agent skills — server-side prompt modules that generate REAL, store-specific
 * content from a CommerceReport. The non-negotiable: every output uses the store's
 * real name, category, and real competitor names from the buyer test. No
 * placeholders ("[STORE NAME]", "Criterion 1", "Competitor A") ever ship.
 */

import OpenAI from "openai";
import type { CommerceReport } from "@/lib/commerce/types";
import type { FixType } from "@/lib/commerce/types";
import type { AgentArtifact, ArtifactFormat, SkillId } from "./types";

export const SKILLS: Record<SkillId, { label: string; desc: string; format: ArtifactFormat; isAction: boolean }> = {
  buying_guide: { label: "Buying guide", desc: "Win the AI comparison queries", format: "markdown", isAction: true },
  product_rewrite: { label: "Product rewrite", desc: "Make a product machine-readable", format: "markdown", isAction: true },
  llms_txt: { label: "llms.txt manifest", desc: "Open your store to AI shoppers", format: "txt", isAction: true },
  schema: { label: "Product schema", desc: "Make your products machine-readable", format: "json", isAction: true },
  faq: { label: "FAQ + schema", desc: "Answer the questions AI assistants ask", format: "markdown", isAction: true },
  comparison_page: { label: "Comparison page", desc: "Become the answer when buyers compare", format: "markdown", isAction: true },
  competitor_analysis: { label: "Competitor analysis", desc: "Why you're losing to a rival", format: "text", isAction: false },
  social_post: { label: "Social post", desc: "A scroll-stopping post built from your gaps", format: "markdown", isAction: true },
  content_calendar: { label: "Content calendar", desc: "A 7-day posting plan from your report", format: "markdown", isAction: true },
  video_ad_script: { label: "Video ad script", desc: "A short-form ad script, ready to film or render", format: "markdown", isAction: true },
};

/** Map a report fix to the skill that resolves it. */
export function skillForFixType(type: FixType): SkillId {
  switch (type) {
    case "buying_guide":
      return "buying_guide";
    case "schema_missing":
    case "reviews_structured":
      return "schema";
    case "ai_crawlers_allowed":
    case "llms_txt":
    case "product_feed":
      return "llms_txt";
    case "faq_schema":
      return "faq";
    case "comparison_page":
      return "comparison_page";
    default:
      return "buying_guide";
  }
}

function client(): OpenAI {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("OPENAI_API_KEY missing");
  return new OpenAI({ apiKey: key });
}

function model(): string {
  return process.env.COMMERCE_OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

/** The shared, store-specific context fed into every skill prompt. */
export function reportContext(report: CommerceReport): string {
  const comps = report.competitors.slice(0, 4).map((c) => c.name).join(", ") || "(none named)";
  const queries = report.buyerQueries
    .map((q) => `- "${q.query}" → named ${report.storeName}: ${q.namedYou ? "YES" : "NO"}`)
    .join("\n");
  return [
    `Store: ${report.storeName}`,
    `Website: ${report.url}`,
    `Category: ${report.category || "(unknown)"}`,
    `Country / region: ${report.country || "global"}`,
    `Overall AI visibility score: ${report.scores.overall}/100`,
    `Competitors AI recommends instead: ${comps}`,
    `Top rival: ${report.topCompetitor || "(none)"}`,
    `Buyer queries we ran through ChatGPT:`,
    queries,
  ].join("\n");
}

const STYLE =
  "You write for ONE specific real store. Use its real name and the real competitor names given — never placeholders like [STORE NAME], [CATEGORY], 'Criterion 1', or 'Competitor A'. Be concrete, specific, and honest. Write as a consultant who knows this exact store.";

const PROMPTS: Record<SkillId, (r: CommerceReport, ctx: string, arg?: string) => { system: string; user: string }> = {
  buying_guide: (r, ctx) => ({
    system: `${STYLE} You are writing a category buying guide that ChatGPT/Perplexity will cite when buyers ask comparison questions. Output ONLY the article in Markdown — no preamble.`,
    user: `${ctx}\n\nWrite a 900–1100 word buyer's guide to ${r.category} ${r.country ? `in ${r.country}` : ""}, authored by ${r.storeName}. Open by establishing ${r.storeName}'s expertise. Give genuinely useful, specific buying advice with concrete numbers and tradeoffs. Where natural, compare honestly to ${r.topCompetitor || "competitors"} (and the others) so the guide reads as fair, not promotional. Use clear H2 headers and short scannable sections so an AI assistant can quote it. End with a practical "how to decide" section.`,
  }),
  product_rewrite: (r, ctx, arg) => ({
    system: `${STYLE} You rewrite a product description to be agent-readable: structured attributes, clear specs, comparison-friendly language. Output Markdown with a short intro, a bulleted spec list, and a one-line "best for" summary.`,
    user: `${ctx}\n\nRewrite the description for ${r.storeName}'s ${arg || "bestselling product"} so AI shopping assistants can read, compare, and recommend it. Invent NO fake specs — where a concrete spec is unknown, use a clearly-labelled placeholder line the merchant fills in (e.g. "Material: <add>"). Make the structure and comparison language excellent.`,
  }),
  llms_txt: (r, ctx) => ({
    system: `${STYLE} You generate an llms.txt manifest (the emerging standard that tells AI agents what a store sells and how to buy). Output ONLY the file contents — start with "# ${r.storeName}". No code fences, no commentary.`,
    user: `${ctx}\n\nWrite a complete llms.txt for ${r.url}. Include: an H1 with the store name, a blockquote one-line summary, a short "About" paragraph positioning ${r.storeName} in ${r.category}, and Markdown link sections (## Products, ## Buying guides, ## Policies) using plausible paths under ${r.url}. Keep it concise and accurate to what this store plausibly sells.`,
  }),
  schema: (r, ctx) => ({
    system: `${STYLE} You generate valid Schema.org JSON-LD. Output ONLY a single JSON object (an @graph array containing Organization, a representative Product with an Offer, and FAQPage). No code fences, no commentary. It must be valid JSON.`,
    user: `${ctx}\n\nGenerate JSON-LD for ${r.storeName} (${r.url}) in the ${r.category} category. Use the real store name and URL. For the Product, use a representative example clearly named so the merchant swaps in real values; do not invent a fake price — use a placeholder string "ADD_PRICE". Include 3 realistic FAQ entries buyers in this category ask.`,
  }),
  faq: (r, ctx) => ({
    system: `${STYLE} You write a customer FAQ AND its FAQPage JSON-LD. Output Markdown: first a "## FAQ" section with Q/A pairs, then a "## Schema" section containing the JSON-LD in a fenced \`\`\`json block.`,
    user: `${ctx}\n\nWrite 6 FAQs ${r.storeName} should answer for ${r.category} buyers (sizing/fit, shipping, returns, materials/quality, comparisons, trust). Answer in ${r.storeName}'s voice. Then give the matching FAQPage JSON-LD.`,
  }),
  comparison_page: (r, ctx) => ({
    system: `${STYLE} You write an honest comparison page that makes the store the credible answer for "best value" and "{store} alternatives" queries. Output ONLY Markdown.`,
    user: `${ctx}\n\nWrite a fair comparison page positioning ${r.storeName} against ${r.topCompetitor || "the main alternatives"} for ${r.category} buyers. Use a comparison table, be honest about where rivals are strong, and make a clear, specific case for when ${r.storeName} is the better choice. This should earn the AI's citation by being genuinely balanced.`,
  }),
  competitor_analysis: (r, ctx, arg) => ({
    system: `${STYLE} You are an analyst. Output a tight, prioritized action list (plain text / light Markdown) — no fluff.`,
    user: `${ctx}\n\nExplain specifically why AI recommends ${arg || r.topCompetitor || "the leading rival"} over ${r.storeName} for ${r.category}, based on the report, and give the 3–4 highest-leverage moves to close the gap. Reference the real buyer queries where ${r.storeName} lost.`,
  }),
  social_post: (r, ctx, arg) => ({
    system: `${STYLE} You write ONE scroll-stopping organic social post for an ecommerce brand, informed by its AI-visibility report. Output Markdown: a **Platform** line, a strong hook line, 2-4 short body lines, a clear CTA, then a "Hashtags:" line of 5-8 relevant tags. No preamble.`,
    user: `${ctx}\n\nWrite one high-performing ${arg || "Instagram / TikTok"} post for ${r.storeName} that, without naming them negatively, wins the ground where buyers currently pick ${r.topCompetitor || "rivals"} in ${r.category}. Lead with a genuinely scroll-stopping hook and make it specific to ${r.category}.`,
  }),
  content_calendar: (r, ctx) => ({
    system: `${STYLE} You plan a 7-day social content calendar for an ecommerce brand from its AI-visibility report. Output ONLY a Markdown table with columns: Day | Angle | Hook | Caption idea | Format. Use 7 DISTINCT angles (education, comparison, social proof, product spotlight, FAQ/objection, behind-the-scenes, UGC prompt).`,
    user: `${ctx}\n\nBuild a postable 7-day calendar for ${r.storeName} in ${r.category}. Where it fits, target the exact buyer journeys and competitors (${r.topCompetitor || "rivals"}) where ${r.storeName} is losing AI visibility. Be specific — real hooks a shopper would stop for, not placeholders.`,
  }),
  video_ad_script: (r, ctx, arg) => ({
    system: `${STYLE} You write a 20-30 second short-form video ad script for an ecommerce brand, producible with an AI video tool (Higgsfield/Creatify) or a phone. Output Markdown: a bold **Hook (0-3s)** line, then a shot-by-shot table (Time | Visual | Voiceover / on-screen text), then a closing **CTA**.`,
    user: `${ctx}\n\nWrite a punchy, conversion-focused ${arg || "UGC-style"} video ad for ${r.storeName}'s ${r.category}, positioned to win against ${r.topCompetitor || "the main alternatives"}. Keep it specific and honest; no fake claims or invented stats.`,
  }),
};

/** Run a skill → a store-specific artifact. Throws on missing key / API failure. */
export async function runSkill(skill: SkillId, report: CommerceReport, arg?: string): Promise<AgentArtifact> {
  const meta = SKILLS[skill];
  const ctx = reportContext(report);
  const { system, user } = PROMPTS[skill](report, ctx, arg);

  const completion = await client().chat.completions.create({
    model: model(),
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.6,
    max_completion_tokens: 1800,
  });
  const body = completion.choices[0]?.message?.content?.trim();
  if (!body) throw new Error("empty generation");

  return {
    skill,
    title: titleFor(skill, report),
    format: meta.format,
    body,
    installSteps: INSTALL[skill],
  };
}

function titleFor(skill: SkillId, r: CommerceReport): string {
  switch (skill) {
    case "buying_guide":
      return `Buying guide — ${r.category || "your category"}`;
    case "product_rewrite":
      return `Agent-ready product description`;
    case "llms_txt":
      return `llms.txt for ${r.storeName}`;
    case "schema":
      return `JSON-LD schema for ${r.storeName}`;
    case "faq":
      return `FAQ + schema — ${r.storeName}`;
    case "comparison_page":
      return `${r.storeName} vs ${r.topCompetitor || "rivals"}`;
    case "competitor_analysis":
      return `Why you're losing to ${r.topCompetitor || "rivals"}`;
    case "social_post":
      return `Social post — ${r.storeName}`;
    case "content_calendar":
      return `7-day content calendar — ${r.storeName}`;
    case "video_ad_script":
      return `Video ad script — ${r.category || "your category"}`;
  }
}

const INSTALL: Record<SkillId, string[]> = {
  buying_guide: [
    "Shopify admin → Online Store → Blog posts → Add blog post",
    "Paste this as the content and publish",
    "Link it from your homepage and relevant product pages",
  ],
  product_rewrite: [
    "Open the product in Shopify admin → Products",
    "Replace the description with this (fill any <add> placeholders)",
    "Save",
  ],
  llms_txt: [
    "Save this as a file named llms.txt",
    "Serve it at yourstore.com/llms.txt (theme app proxy or a redirect — Shopify can't serve root files directly)",
    "Re-run the scan to confirm it's detected",
  ],
  schema: [
    "Shopify admin → Online Store → Themes → Edit code → theme.liquid",
    'Paste inside <head>, wrapped in <script type="application/ld+json"> … </script>',
    "Swap ADD_PRICE and example values for real product data, then Save",
  ],
  faq: [
    "Add the FAQ copy to a page or product (Shopify → Pages)",
    "Paste the JSON-LD into theme.liquid <head> inside a <script type=\"application/ld+json\"> tag",
    "Save and re-scan",
  ],
  comparison_page: [
    "Shopify admin → Online Store → Pages → Add page",
    "Paste this, publish, and link it from your nav",
    "Re-run the scan in a week to watch the comparison queries shift",
  ],
  competitor_analysis: ["This is analysis, not a file — work the action list top-down."],
  social_post: [
    "Add your product image or a short clip",
    "Paste the caption + hashtags into your scheduler",
    "Connect your socials below to let PD auto-post (coming soon)",
  ],
  content_calendar: [
    "Pick the days that fit your week",
    "Ask the agent to write each day's full post + visual",
    "Schedule them via your social tool — or PD's auto-poster (coming soon)",
  ],
  video_ad_script: [
    "Feed the hook + shot list into Higgsfield or Creatify, or film it on a phone",
    "Add captions and your product",
    "Export and post organically, or run it as a paid ad",
  ],
};
