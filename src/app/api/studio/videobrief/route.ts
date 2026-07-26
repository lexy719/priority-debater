import { NextResponse } from "next/server";
import { briefCheck, type BriefShot, type VideoBrief } from "@/lib/studio/brain";
import { loadBrain } from "@/lib/studio/brainRepo";
import { loadStore } from "@/lib/studio/storeRepo";

/**
 * POST /api/studio/videobrief — compile a video ad into a RENDER SPEC.
 *
 * The gap between "storyboard labels" and "good Higgsfield ads every time" is
 * this document: per shot, a full visual prompt in the company's persisted
 * visual world, a DoP camera move, exact seconds, and the overlay line —
 * grounded in a real catalog product and constrained by every brain rule.
 * When HIGGSFIELD_API_KEY lands, shots[i] IS the payload (Soul keyframe →
 * DoP image-to-video); until then it is the reviewable production brief.
 */

export const runtime = "nodejs";
export const maxDuration = 45;

const MODEL = "claude-sonnet-5";

/** Placement grammar — how ads are SHOT per platform, not just sized. */
const GRAMMAR: Record<string, string> = {
  TIKTOK: "native UGC energy: handheld, imperfect, first-person, feels found not produced; hook is a hard visual interrupt",
  INSTAGRAM: "polished-casual reel: intentional framing, tactile close-ups, satisfying motion loops",
  YOUTUBE: "mini-documentary: establish, story beats, brand present early, calmer pacing",
  META: "product-centric loop: the product is on screen from frame one, seamless loop potential",
  X: "punchy and captioned: assume muted autoplay in-feed, high contrast",
};

type KitIn = { projectCode: string; fullName?: string; oneLiner?: string; descriptor?: string; brandKit?: { audience?: string; positioning?: string; palette?: { name: string; hex: string }[] } };

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY missing" }, { status: 500 });

  let body: { kit?: KitIn; slug?: string; platform?: string; fmt?: string; dur?: string; shots?: string[]; hook?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const kit = body.kit;
  const platform = String(body.platform ?? "TIKTOK").toUpperCase().split(" ")[0];
  const fmt = String(body.fmt ?? "9:16");
  const dur = String(body.dur ?? "0:15");
  if (!kit?.projectCode) return NextResponse.json({ ok: false, error: "bad input" }, { status: 400 });

  const brain = await loadBrain(kit.projectCode);
  const vRules = (brain?.rules ?? []).filter((r) => r.domain === "video" || r.src === "company" || r.src === "learned");
  const visual = brain?.visual;
  const published = body.slug ? await loadStore(String(body.slug)) : null;
  const product = published?.store.products[0] ?? null;
  const palette = (kit.brandKit?.palette ?? []).slice(0, 4).map((p) => `${p.name} ${p.hex}`).join(" · ");

  const prompt = [
    `Compile a shot-level RENDER SPEC for one ${fmt} · ${dur} video ad on ${platform}.`,
    "Output ONLY strict JSON — no fences:",
    '{"hook":string,"shots":[{"beat":string,"prompt":string,"camera":string,"seconds":number,"overlay":string}]}',
    "",
    "Hard requirements:",
    `- placement grammar: ${GRAMMAR[platform] ?? GRAMMAR.TIKTOK}`,
    "- first shot beat = HOOK (a visual interrupt, not a logo); last = CTA (product + exact next step)",
    `- seconds must sum to the total duration (${dur}); no shot longer than 4s`,
    "- prompt per shot: >= 25 words — subject, setting, lighting, texture, mood; leave clean negative space where the overlay sits",
    "- camera per shot: one concrete move (slow push-in, orbit, crash-zoom, whip-pan, locked-off macro, handheld follow)",
    "- overlay: <= 7 words, rendered as caption overlay (video models garble burned-in text — prompts must describe scenes WITHOUT text in them)",
    ...(product ? [`- the ad sells "${product.name}" at exactly ${product.price} — it must appear by name in at least one shot prompt and in the CTA overlay`] : []),
    ...(visual ? [
      "",
      "THE COMPANY'S VISUAL WORLD (every shot lives inside it):",
      `- setting: ${visual.setting}`,
      `- lighting: ${visual.lighting}`,
      `- materials: ${visual.materials}`,
      `- camera language: ${visual.camera}`,
      `- never show: ${visual.avoid}`,
    ] : []),
    ...(palette ? [`- brand palette to echo in scenes: ${palette}`] : []),
    ...(vRules.length ? ["", "BRAIN RULES (hard constraints):", ...vRules.map((r) => `- ${r.kind === "do" ? "ALWAYS" : "NEVER"}: ${r.txt}`)] : []),
    "",
    `Business: ${kit.projectCode} (${kit.fullName ?? ""}) — ${kit.oneLiner ?? kit.descriptor ?? ""} · audience: ${kit.brandKit?.audience ?? "general"}`,
    ...(body.hook ? [`Working hook line to build from (may refine): ${body.hook}`] : []),
    ...(body.shots?.length ? [`Beat skeleton to follow: ${body.shots.join(" → ")}`] : []),
  ].join("\n");

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 2000, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) return NextResponse.json({ ok: false, error: `anthropic ${r.status}` }, { status: 502 });
    const data = (await r.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? []).map((b) => (b.type === "text" ? b.text ?? "" : "")).join("");
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : text) as { hook?: string; shots?: BriefShot[] };

    const shots = (parsed.shots ?? [])
      .filter((s) => s?.beat && s?.prompt)
      .slice(0, 8)
      .map((s) => ({
        beat: String(s.beat).toUpperCase().slice(0, 10),
        prompt: String(s.prompt).slice(0, 500),
        camera: String(s.camera ?? "static").slice(0, 60),
        seconds: Math.max(1, Math.min(6, Number(s.seconds) || 2)),
        overlay: String(s.overlay ?? "").slice(0, 60),
      }));
    if (shots.length < 3) return NextResponse.json({ ok: false, error: "brief too thin" }, { status: 502 });

    const brief: VideoBrief = {
      platform, fmt, dur,
      hook: String(parsed.hook ?? body.hook ?? "").slice(0, 140),
      product: product ? { name: product.name, price: product.price } : null,
      shots,
    };
    return NextResponse.json({ ok: true, brief, lint: briefCheck(brief), model: MODEL });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
