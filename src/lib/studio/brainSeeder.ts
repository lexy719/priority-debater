import "server-only";

/**
 * Seeding a company's own marketing mind.
 *
 * This used to live only inside POST /api/studio/brainseed, which meant it ran
 * only when a human clicked "do it" on a dashboard proposal — so every business
 * PDR fabricated was born with sixteen generic craft rules, zero rules of its
 * own, and no visual world. Nothing it wrote sounded like the company and any
 * video it rendered would have been handsome and anonymous.
 *
 * Now the publish path calls this directly and the route is a thin wrapper.
 *
 * Idempotent per company: `seedCompanyRules` keeps the first successful seed,
 * so a re-publish or a manual re-run cannot overwrite rules the owner has since
 * taught or the brain has since learned.
 */

import { recordActivity } from "./activityRepo";
import type { Brain } from "./brain";
import { seedCompanyRules, setVisualWorld } from "./brainRepo";

const MODEL = "claude-sonnet-5";

export type SeedKit = {
  projectCode: string;
  fullName?: string;
  descriptor?: string;
  oneLiner?: string;
  brandKit?: { audience?: string; positioning?: string; personality?: string; tone?: string };
};

export type SeedOutcome =
  | { ok: true; brain: Brain; model: string }
  | { ok: false; error: string };

function buildPrompt(kit: SeedKit): string {
  return [
    "You write the COMPANY-SPECIFIC ad guidelines AND the visual world for a marketing brain.",
    "Output ONLY strict JSON — no fences, no commentary:",
    '{"rules":[{"kind":"do"|"dont","txt":string,"domain":"copy"|"video"}],'
      + '"visual":{"setting":string,"lighting":string,"materials":string,"camera":string,"avoid":string}}',
    "",
    "Rules for the rules:",
    "- exactly 5: three copy-domain, two video-domain; mix of do and dont",
    "- each could ONLY belong to THIS business — name its materials, rituals, proof points, audience taboos",
    "- NEVER generic ad craft (hooks, CTAs, hashtags are already covered by core rules)",
    "- txt <= 110 chars, concrete and enforceable, no fluff",
    "",
    "The visual world = the ONE consistent look every video ad for this business is shot in:",
    "- setting: the physical world the footage lives in (specific, ownable)",
    "- lighting: the light signature (<=140 chars)",
    "- materials: textures the camera should dwell on",
    "- camera: default movement language (e.g. slow push-ins, handheld intimacy, locked-off macro)",
    "- avoid: visuals that must NEVER appear for this business",
    "",
    `Business: ${kit.projectCode} (${kit.fullName ?? ""})`,
    `- What it is: ${kit.descriptor ?? kit.oneLiner ?? ""}`,
    `- One-liner: ${kit.oneLiner ?? ""}`,
    `- Audience: ${kit.brandKit?.audience ?? "general"} · Positioning: ${kit.brandKit?.positioning ?? "n/a"} · Personality: ${kit.brandKit?.personality ?? "n/a"} · Tone: ${kit.brandKit?.tone ?? "direct"}`,
  ].join("\n");
}

export async function seedBrain(kit: SeedKit, slug?: string, timeoutMs = 45_000): Promise<SeedOutcome> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, error: "ANTHROPIC_API_KEY missing" };
  if (!kit.projectCode) return { ok: false, error: "no project code" };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 1400, messages: [{ role: "user", content: buildPrompt(kit) }] }),
      signal: ctrl.signal,
    });
    if (!r.ok) return { ok: false, error: `anthropic ${r.status}` };
    const data = (await r.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? []).map((b) => (b.type === "text" ? b.text ?? "" : "")).join("");
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : text) as {
      rules?: { kind: "do" | "dont"; txt: string; domain?: "copy" | "video" }[];
      visual?: { setting: string; lighting: string; materials: string; camera: string; avoid: string };
    };
    let brain = await seedCompanyRules(kit.projectCode, parsed.rules ?? []);
    if (parsed.visual) brain = (await setVisualWorld(kit.projectCode, parsed.visual)) ?? brain;
    if (!brain) return { ok: false, error: "bad code" };
    if (slug) {
      await recordActivity(slug, "MARKETING",
        `Seeded ${parsed.rules?.length ?? 0} company guidelines + a visual world for ${kit.projectCode} — every ad from here is written and shot in this company's own terms`,
        "auto");
    }
    return { ok: true, brain, model: MODEL };
  } catch (e) {
    return { ok: false, error: (e as Error).name === "AbortError" ? "timed out" : (e as Error).message };
  } finally {
    clearTimeout(timer);
  }
}
