import { NextResponse } from "next/server";

/**
 * POST /api/studio/palette — Claude regenerates the brand palette.
 * A fresh 6-swatch material spec for THIS business, avoiding hexes already
 * shown. The BRAND studio's ⟳ REGENERATE calls it; the canned sets remain the
 * offline fallback.
 */

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-sonnet-5";
const HEX = /^#[0-9A-Fa-f]{6}$/;

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY missing" }, { status: 500 });

  let body: { kit?: { projectCode?: string; descriptor?: string; positioning?: string; audience?: string }; avoid?: string[] };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const kit = body.kit;
  if (!kit?.projectCode) return NextResponse.json({ ok: false, error: "bad input" }, { status: 400 });
  const avoid = (body.avoid ?? []).filter((h) => HEX.test(h)).slice(0, 24);

  const prompt = [
    "You are the palette spindle inside PDR Studio. Generate ONE fresh brand palette for this business.",
    "Output ONLY strict JSON — no fences, no commentary:",
    '{"name":string,"palette":[{"name":string,"hex":string,"role":string,"contrast":string}]}',
    "",
    "Rules:",
    "- exactly 6 swatches in this role order: Primary ink, Surface, Accent, Support, Background, Dark surface",
    "- hex = valid #RRGGBB tuned to the business's world; readable pairs (ink on background, contrast on accent)",
    "- swatch name = ONE evocative word; set name = ONE uppercase word for the whole palette",
    '- contrast = "#FFFFFF" or "#0A0A0A" — whichever is readable on that swatch',
    ...(avoid.length ? [`- make it visibly DIFFERENT from these already-used hexes: ${avoid.join(", ")}`] : []),
    "",
    `Business: ${kit.projectCode} — ${kit.descriptor ?? ""} · positioning: ${kit.positioning ?? "n/a"} · audience: ${kit.audience ?? "general"}`,
  ].join("\n");

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 600, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) return NextResponse.json({ ok: false, error: `anthropic ${r.status}` }, { status: 502 });
    const data = (await r.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? []).map((b) => (b.type === "text" ? b.text ?? "" : "")).join("");
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : text) as { name?: string; palette?: { name: string; hex: string; role: string; contrast: string }[] };
    const pal = (parsed.palette ?? []).filter((s) => s?.name && HEX.test(s?.hex ?? "")).slice(0, 6);
    if (pal.length < 6) return NextResponse.json({ ok: false, error: "palette incomplete" }, { status: 502 });
    pal.forEach((s) => { if (!/^#(FFFFFF|0A0A0A)$/i.test(s.contrast ?? "")) s.contrast = "#FFFFFF"; });
    const name = String(parsed.name ?? "FRESH").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) || "FRESH";
    return NextResponse.json({ ok: true, name, palette: pal, model: MODEL });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
