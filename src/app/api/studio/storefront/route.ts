import { NextResponse } from "next/server";

/**
 * POST /api/studio/storefront — real catalog synthesis for the site fabricator.
 *
 * Claude (Anthropic) turns the brand kit into a 6-SKU agent-first catalog +
 * store manifest. Text/structure only — imagery (logos, product shots, video)
 * is Higgsfield's lane, never Claude's. Stateless like every studio route:
 * the client owns the result. Falls back client-side to the stock catalog
 * when this route errors.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

type KitIn = {
  projectCode: string; fullName: string; descriptor: string; domain: string; oneLiner?: string;
  brandKit?: { audience?: string; positioning?: string };
};

type SynthProduct = {
  name: string; description: string; price: string; priceValue: number;
  currency?: string; sku: string; category: string; availability: "InStock" | "PreOrder";
};

const MODEL = "claude-sonnet-5";

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY missing" }, { status: 500 });

  let kit: KitIn;
  try {
    kit = (await req.json())?.kit;
    if (!kit?.projectCode || !kit?.fullName) throw new Error("bad kit");
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const prompt = [
    "You are the catalog synthesizer inside PDR Studio's storefront fabricator.",
    "The output storefront is built for AI shopping agents (LLMs), not for humans scrolling a landing page.",
    "",
    "From the business spec below, output ONLY strict JSON — no markdown fences, no commentary — with exactly this shape:",
    '{"products":[{"name":string,"description":string,"price":string,"priceValue":number,"currency":"EUR","sku":string,"category":string,"availability":"InStock"|"PreOrder"}],"manifest":{"ships":string,"returns":string,"tagline":string}}',
    "",
    "Rules:",
    "- exactly 6 products, each a distinct purchasable SKU for this business",
    "- descriptions: factual spec-sheet copy an agent can rely on, <=140 chars, no hype, no exclamation marks",
    '- price: EUR display string (e.g. "€18/mo", "€120"); priceValue: the number; realistic for the market',
    "- sku: kebab-case; category: one or two words (e.g. Subscription, Hardware, Gift, Service)",
    "- mix recurring and one-off offers where the business allows; at most one PreOrder",
    "- manifest.ships / manifest.returns: one short factual line each; manifest.tagline: <=8 words, no punctuation flourish",
    "",
    "Business spec:",
    `- mark: ${kit.projectCode}`,
    `- legal name: ${kit.fullName}`,
    `- what it is: ${kit.descriptor}`,
    `- one-liner: ${kit.oneLiner ?? kit.descriptor}`,
    `- domain: ${kit.domain}`,
    `- audience: ${kit.brandKit?.audience ?? "general"}`,
    `- positioning: ${kit.brandKit?.positioning ?? "n/a"}`,
  ].join("\n");

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 2200, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return NextResponse.json({ ok: false, error: `anthropic ${r.status}`, detail: detail.slice(0, 300) }, { status: 502 });
    }
    const data = (await r.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? []).map((b) => (b.type === "text" ? b.text ?? "" : "")).join("");
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : text) as { products?: SynthProduct[]; manifest?: { ships?: string; returns?: string; tagline?: string } };

    const products = (parsed.products ?? [])
      .filter((p) => p && p.name && p.price && p.sku)
      .slice(0, 6)
      .map((p) => ({
        name: String(p.name), description: String(p.description ?? ""), price: String(p.price),
        priceValue: Number(p.priceValue) || undefined, currency: "EUR",
        sku: String(p.sku).toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
        category: String(p.category ?? "Product"),
        availability: p.availability === "PreOrder" ? ("PreOrder" as const) : ("InStock" as const),
      }));
    if (products.length < 3) return NextResponse.json({ ok: false, error: "synthesis too thin" }, { status: 502 });

    return NextResponse.json({ ok: true, source: "claude", model: MODEL, products, manifest: parsed.manifest ?? {} });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
