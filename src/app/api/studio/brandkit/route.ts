import { NextResponse } from "next/server";

/**
 * POST /api/studio/brandkit — the live spindle behind the studio's RUN LINE.
 *
 * Claude (Anthropic) manufactures the full brand kit + campaign parameters
 * from one line of spec: designation, palette, type, voice, positioning,
 * campaign objective, audience segments, video shot plans. Text/structure
 * only — imagery is Higgsfield's lane. Stateless; the client owns the result
 * and falls back to demo stock when this route errors.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-5";
const HEX = /^#[0-9A-Fa-f]{6}$/;

type Swatch = { name: string; hex: string; role: string; contrast: string };
type KitOut = {
  projectCode: string; fullName: string; descriptor: string; domain: string;
  oneLiner: string; taglines: string[];
  brandKit: {
    audience: string; personality: string; positioning: string; tone: string;
    palette: Swatch[];
    typography: { display: { family: string; role: string }; body: { family: string; role: string }; mono: { family: string; role: string } };
    voice: { tag: string; body: string }[];
  };
  campaign?: { objective?: string; audiences?: string[]; shots?: { v916?: string[]; v169?: string[]; v11?: string[] } };
};

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY missing" }, { status: 500 });

  let topic = "";
  try {
    const body = await req.json();
    topic = String(body?.topic ?? "").trim();
    if (!topic) throw new Error("no topic");
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const prompt = [
    "You are the brand fabrication spindle inside PDR Studio, a machine that manufactures a business from one line of spec.",
    "From the spec below, output ONLY strict JSON — no markdown fences, no commentary — with exactly this shape:",
    "",
    `{"projectCode":string,"fullName":string,"descriptor":string,"domain":string,"oneLiner":string,"taglines":[string,string,string],`
    + `"brandKit":{"audience":string,"personality":string,"positioning":string,"tone":string,`
    + `"palette":[{"name":string,"hex":string,"role":string,"contrast":string}],`
    + `"typography":{"display":{"family":string,"role":"DISPLAY"},"body":{"family":string,"role":"BODY"},"mono":{"family":string,"role":"META"}},`
    + `"voice":[{"tag":string,"body":string}]},`
    + `"campaign":{"objective":string,"audiences":[string],"shots":{"v916":[string],"v169":[string],"v11":[string]}}}`,
    "",
    "Rules:",
    "- projectCode: one invented, distinctive uppercase mark (5-9 letters), specific to THIS business — never generic",
    "- fullName: plausible legal/trading name; domain: realistic lowercase domain for it",
    "- descriptor: one factual sentence of what the business is; oneLiner: one sharp sentence of what it does for whom",
    "- taglines: 3 short options, <=6 words each, no punctuation flourish",
    "- palette: exactly 6 swatches in this role order: Primary ink, Surface, Accent, Support, Background, Dark surface;"
    + " hex = valid #RRGGBB tuned to the business's world; name = one evocative word; contrast = #FFFFFF or #0A0A0A for text on that swatch",
    "- typography: real Google-font family names that fit the brand (display can have character; body must be workhorse)",
    "- voice: exactly 4 parameters, tag = one uppercase word, body = one instruction sentence",
    "- audience/personality/positioning/tone: tight phrases, <=6 words each",
    "- campaign.objective: one quantified goal for the next quarter (number + metric)",
    "- campaign.audiences: exactly 5 short targetable segments for this business",
    "- campaign.shots: storyboard shot labels for video ads — v916: 4 labels, v169: 5, v11: 3; each ONE word, uppercase, <=7 chars, specific to this business; first label MUST be HOOK, last MUST be CTA, the beats between are the business story",
    "",
    `Spec: ${topic}`,
  ].join("\n");

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 2600, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return NextResponse.json({ ok: false, error: `anthropic ${r.status}`, detail: detail.slice(0, 300) }, { status: 502 });
    }
    const data = (await r.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? []).map((b) => (b.type === "text" ? b.text ?? "" : "")).join("");
    const match = text.match(/\{[\s\S]*\}/);
    const kit = JSON.parse(match ? match[0] : text) as KitOut;

    // Minimal structural validation — a broken kit must fall back, not render.
    const bk = kit?.brandKit;
    if (!kit?.projectCode || !kit?.fullName || !kit?.domain || !bk) throw new Error("kit incomplete");
    bk.palette = (bk.palette ?? []).filter((s) => s?.name && HEX.test(s?.hex ?? "")).slice(0, 6);
    if (bk.palette.length < 6) throw new Error("palette incomplete");
    bk.palette.forEach((s) => { if (!/^#(FFFFFF|0A0A0A)$/i.test(s.contrast ?? "")) s.contrast = "#FFFFFF"; });
    bk.voice = (bk.voice ?? []).filter((v) => v?.tag && v?.body).slice(0, 4);
    if (bk.voice.length < 3) throw new Error("voice incomplete");
    if (!bk.typography?.display?.family || !bk.typography?.body?.family) throw new Error("type incomplete");
    bk.typography.mono = bk.typography.mono?.family ? bk.typography.mono : { family: "JetBrains Mono", role: "META" };
    kit.taglines = (kit.taglines ?? []).filter(Boolean).slice(0, 3);
    if (!kit.taglines.length) kit.taglines = [kit.brandKit.positioning ?? kit.oneLiner ?? kit.projectCode];
    kit.projectCode = kit.projectCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || "UNIT";
    const up = (a?: string[], n = 4) => (a ?? []).filter(Boolean).map((s) => String(s).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7)).filter(Boolean).slice(0, n);
    if (kit.campaign?.shots) kit.campaign.shots = { v916: up(kit.campaign.shots.v916, 4), v169: up(kit.campaign.shots.v169, 5), v11: up(kit.campaign.shots.v11, 3) };

    return NextResponse.json({ ok: true, source: "claude", model: MODEL, kit });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
