/**
 * The grounded copy writer — ONE generator behind every piece of marketing text
 * Commerce produces (draft desk, campaign variants, social content).
 *
 * Two non-negotiables, both enforced here rather than per caller:
 *   1. the company's FULL brain (core · company · taught · learned rules) is
 *      injected as hard constraints;
 *   2. the copy must name a REAL product from the live catalogue at its EXACT
 *      price — no invented products, no invented prices.
 */

import { loadBrain } from "./brainRepo";
import { loadStore } from "./storeRepo";

const MODEL = "claude-sonnet-5";

/** Per-platform hard character limits. */
export const PLATFORM_LIMITS: Record<string, number> = {
  LINKEDIN: 1400, X: 240, INSTAGRAM: 1000, TIKTOK: 500, YOUTUBE: 900, META: 600, EMAIL: 1600,
};

/** How each placement is natively written. */
const REGISTER: Record<string, string> = {
  X: "lowercase, punchy, one or two sentences",
  LINKEDIN: "short line breaks, professional but human, ends with a CTA line",
  INSTAGRAM: "caption with line breaks, up to 3 hashtags at the end",
  TIKTOK: "a POV-style script: [HOOK] / [SHOW] / [CTA] lines",
  YOUTUBE: "a video title line then a 1-2 sentence description with CTA",
  META: "a single scroll-stopping paragraph with a clear offer and CTA",
  EMAIL: "a subject line, then a short body of 3-4 sentences, then one CTA line",
};

export type CopyKit = {
  projectCode: string; fullName?: string; descriptor?: string; domain?: string; oneLiner?: string;
  brandKit?: { audience?: string; positioning?: string; tone?: string };
};

export type CopyResult =
  | { ok: true; body: string; rulesApplied: number; model: string; grounded: boolean }
  | { ok: false; error: string; status: number };

export async function writeGroundedCopy(opts: {
  kit: CopyKit;
  platform: string;
  angle: string;
  slug?: string | null;
  /** Extra campaign-level intent, e.g. the campaign objective. */
  objective?: string | null;
  /** Copy to differentiate from (sibling variants in an experiment). */
  avoid?: string[];
}): Promise<CopyResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, error: "ANTHROPIC_API_KEY missing", status: 500 };

  const platform = opts.platform.toUpperCase();
  const limit = PLATFORM_LIMITS[platform];
  if (!opts.kit?.projectCode || !limit) return { ok: false, error: "bad input", status: 400 };

  const brain = await loadBrain(opts.kit.projectCode);
  // Copy obeys copy-domain rules; video rules govern storyboards.
  const rules = (brain?.rules ?? []).filter((r) => r.domain !== "video");
  const dos = rules.filter((r) => r.kind === "do").map((r) => `- ${r.txt}`).join("\n");
  const donts = rules.filter((r) => r.kind === "dont").map((r) => `- ${r.txt}`).join("\n");

  const published = opts.slug ? await loadStore(opts.slug) : null;
  const catalog = published?.store.products.slice(0, 8)
    .map((p) => `- ${p.name} · ${p.price} · ${p.description.slice(0, 70)}`).join("\n") ?? "";
  const kit = opts.kit;

  const prompt = [
    `Write ONE ${platform}-native marketing post for this business. Content pillar: ${opts.angle}.`,
    ...(opts.objective ? [`Campaign objective it must serve: ${opts.objective}`] : []),
    "",
    "Business:",
    `- ${kit.projectCode} (${kit.fullName ?? ""}) · ${kit.domain ?? ""}`,
    `- What it is: ${kit.descriptor ?? kit.oneLiner ?? ""}`,
    `- One-liner: ${kit.oneLiner ?? ""}`,
    `- Audience: ${kit.brandKit?.audience ?? "general"} · Positioning: ${kit.brandKit?.positioning ?? ""} · Tone: ${kit.brandKit?.tone ?? "direct"}`,
    "",
    "The MARKETING BRAIN for this company — hard constraints, every rule applies:",
    "ALWAYS:", dos || "- (none)",
    "NEVER:", donts || "- (none)",
    ...(catalog
      ? ["", "THE CATALOG (from the live store) — the post MUST name at least one of these products and quote its EXACT price; never invent products or prices:", catalog]
      : []),
    ...(opts.avoid?.length
      ? ["", "EXISTING VARIANTS in this experiment — take a genuinely different angle, do not paraphrase them:", ...opts.avoid.map((a) => `- ${a.slice(0, 160)}`)]
      : []),
    "",
    `Platform register: ${REGISTER[platform] ?? "clear and direct"}.`,
    `Hard limit: ${limit} characters. Output the post text ONLY — no preamble, no quotes, no commentary.`,
  ].join("\n");

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 900, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) return { ok: false, error: `anthropic ${r.status}`, status: 502 };
    const data = (await r.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? []).map((b) => (b.type === "text" ? b.text ?? "" : "")).join("").trim();
    if (!text) return { ok: false, error: "empty", status: 502 };
    return { ok: true, body: text.slice(0, limit), rulesApplied: rules.length, model: MODEL, grounded: !!catalog };
  } catch (e) {
    return { ok: false, error: (e as Error).message, status: 502 };
  }
}
