import { NextResponse } from "next/server";
import { recordActivity } from "@/lib/studio/activityRepo";
import { loadBrain } from "@/lib/studio/brainRepo";
import { deleteLanding, listLandings, saveLanding } from "@/lib/studio/landingRepo";
import { loadStore } from "@/lib/studio/storeRepo";

/**
 * Landing pages, written by the Marketing worker.
 *
 * GET    ?slug=              → the pages on file (with measured view counts)
 * POST   {slug, sku?, campaignId?, audience?} → Claude writes one through the
 *         brain, grounded in a real product; persisted and served SSR by the store
 * DELETE {slug, id}          → remove
 */

export const runtime = "nodejs";
export const maxDuration = 45;
export const dynamic = "force-dynamic";

const MODEL = "claude-sonnet-5";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  return NextResponse.json({ ok: true, landings: await listLandings(slug) }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY missing" }, { status: 500 });

  let body: { slug?: string; sku?: string; campaignId?: string; audience?: string; objective?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const slug = String(body.slug ?? "");
  const store = await loadStore(slug);
  if (!store) return NextResponse.json({ ok: false, error: "store not found" }, { status: 404 });

  const b = store.store.brand;
  const code = b.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const brain = await loadBrain(code);
  const rules = (brain?.rules ?? []).filter((r) => r.domain !== "video");
  const product = body.sku ? store.store.products.find((p) => p.sku === body.sku) : store.store.products[0];
  if (!product) return NextResponse.json({ ok: false, error: "no product to sell" }, { status: 400 });
  const audience = String(body.audience ?? b.audience ?? "general");

  const prompt = [
    "Write a conversion-focused LANDING PAGE for one product. Output ONLY strict JSON — no fences:",
    '{"headline":string,"subhead":string,"bullets":[string,string,string],"cta":string}',
    "",
    "Rules:",
    "- headline: <= 60 characters, concrete, no hype words",
    "- subhead: one sentence, <= 130 characters, states the offer plainly",
    "- bullets: exactly 3, each <= 80 characters, each a specific reason to buy (material, process, guarantee, cadence) — never generic filler",
    `- cta: <= 30 characters, states the exact next step, and the price ${product.price} must appear either in the subhead or the cta`,
    "- no invented facts: only what the product data and brand below support",
    "",
    "MARKETING BRAIN — hard constraints:",
    "ALWAYS:", rules.filter((r) => r.kind === "do").map((r) => `- ${r.txt}`).join("\n") || "- (none)",
    "NEVER:", rules.filter((r) => r.kind === "dont").map((r) => `- ${r.txt}`).join("\n") || "- (none)",
    "",
    `Business: ${b.name} (${b.fullName}) — ${b.oneLiner}`,
    `Positioning: ${b.positioning ?? "n/a"} · Audience for THIS page: ${audience}`,
    `Product: ${product.name} · ${product.price} · ${product.description}`,
    ...(body.objective ? [`Campaign objective: ${body.objective}`] : []),
  ].join("\n");

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 900, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) return NextResponse.json({ ok: false, error: `anthropic ${r.status}` }, { status: 502 });
    const data = (await r.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? []).map((x) => (x.type === "text" ? x.text ?? "" : "")).join("");
    const m = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m ? m[0] : text) as { headline?: string; subhead?: string; bullets?: string[]; cta?: string };
    if (!parsed.headline || !parsed.subhead || !parsed.cta) return NextResponse.json({ ok: false, error: "page too thin" }, { status: 502 });

    const landing = await saveLanding(slug, {
      headline: String(parsed.headline).slice(0, 90),
      subhead: String(parsed.subhead).slice(0, 180),
      bullets: (parsed.bullets ?? []).filter(Boolean).slice(0, 3).map((x) => String(x).slice(0, 110)),
      cta: String(parsed.cta).slice(0, 40),
      sku: product.sku ?? null,
      audience,
      campaignId: body.campaignId ? String(body.campaignId) : null,
    });
    await recordActivity(slug, "MARKETING", `Landing page ${landing.id} written for ${product.name} (${audience}) — ${rules.length} brain rules applied`);
    return NextResponse.json({ ok: true, landing, rulesApplied: rules.length, url: `/store/${slug}/l/${landing.id}` });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}

export async function DELETE(req: Request) {
  let body: { slug?: string; id?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const landings = await deleteLanding(String(body.slug ?? ""), String(body.id ?? ""));
  return NextResponse.json({ ok: true, landings });
}
