import { NextResponse } from "next/server";
import { seedCompanyRules, setVisualWorld } from "@/lib/studio/brainRepo";

/**
 * POST /api/studio/brainseed — Claude writes THIS company's ad guidelines.
 *
 * Five rules that could only belong to this business (its materials, rituals,
 * proof points, taboos) — never generic ad craft, which the core rules already
 * cover. Idempotent per company: the first successful seed wins; teaching and
 * forgetting remain the human's controls.
 */

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-sonnet-5";

type KitIn = {
  projectCode: string; fullName?: string; descriptor?: string; oneLiner?: string;
  brandKit?: { audience?: string; positioning?: string; personality?: string; tone?: string };
};

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY missing" }, { status: 500 });

  let kit: KitIn; let slug = "";
  try {
    const body = await req.json();
    kit = body?.kit;
    slug = typeof body?.slug === "string" ? body.slug : "";
    if (!kit?.projectCode) throw new Error("bad kit");
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const prompt = [
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

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 1400, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) return NextResponse.json({ ok: false, error: `anthropic ${r.status}` }, { status: 502 });
    const data = (await r.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? []).map((b) => (b.type === "text" ? b.text ?? "" : "")).join("");
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : text) as {
      rules?: { kind: "do" | "dont"; txt: string; domain?: "copy" | "video" }[];
      visual?: { setting: string; lighting: string; materials: string; camera: string; avoid: string };
    };
    let brain = await seedCompanyRules(kit.projectCode, parsed.rules ?? []);
    if (parsed.visual) brain = (await setVisualWorld(kit.projectCode, parsed.visual)) ?? brain;
    if (!brain) return NextResponse.json({ ok: false, error: "bad code" }, { status: 400 });
    if (slug) {
      const { recordActivity } = await import("@/lib/studio/activityRepo");
      await recordActivity(slug, "MARKETING", `Seeded company guidelines + visual world for ${kit.projectCode}`);
    }
    return NextResponse.json({ ok: true, brain, model: MODEL });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
