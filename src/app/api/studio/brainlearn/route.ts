import { NextResponse } from "next/server";
import { setLearnedRules } from "@/lib/studio/brainRepo";
import { loadTraffic } from "@/lib/studio/hitRepo";
import { loadOrdersSummary } from "@/lib/studio/orderRepo";
import { loadStore } from "@/lib/studio/storeRepo";

/**
 * POST /api/studio/brainlearn — the performance feedback loop.
 *
 * Reads the MEASURED data for the company's published store (agent traffic +
 * received orders — never the simulated meters) and distills up to 3 learned
 * rules, each citing its evidence. Learned rules supersede the previous set
 * and steer every future generation. Refuses to conclude from thin data.
 */

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-sonnet-5";
const MIN_SIGNAL = 5; // agent hits + orders below this = not enough evidence

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY missing" }, { status: 500 });

  let body: { code?: string; slug?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const code = String(body.code ?? "").toUpperCase();
  const slug = String(body.slug ?? "");
  if (!code || !slug) return NextResponse.json({ ok: false, error: "code and slug required" }, { status: 400 });

  const [traffic, orders, store] = await Promise.all([loadTraffic(slug), loadOrdersSummary(slug), loadStore(slug)]);
  const signal = traffic.agents + orders.count;
  if (signal < MIN_SIGNAL) {
    return NextResponse.json({ ok: false, error: `not enough signal (${signal}/${MIN_SIGNAL}) — publish, share, let agents read it first` }, { status: 422 });
  }

  const orderedNames = orders.recent.map((o) => `${o.productName} ×${o.qty} (${o.channel === "agent-json" ? o.agent : "web"})`).join("; ");
  const prompt = [
    "You distill LEARNED marketing rules from MEASURED store data. No speculation — every rule must cite its number.",
    "Output ONLY strict JSON — no fences:",
    '{"rules":[{"kind":"do"|"dont","txt":string}]}',
    "",
    "Rules for the rules:",
    "- at most 3, only what the data actually supports; fewer is better than padded",
    '- each txt MUST cite its evidence inline, e.g. "GPTBot placed 2 of 3 orders — keep the feed price-exact"',
    "- actionable for future ad copy / feed / storefront decisions; <= 130 chars",
    "",
    "MEASURED DATA:",
    `- agent reads by agent: ${JSON.stringify(traffic.byAgent)}`,
    `- reads by surface: ${JSON.stringify(traffic.byKind)} (store=catalog page, feed=product feed, product=PDPs)`,
    `- human reads: ${traffic.humans}`,
    `- orders: ${orders.count} · revenue €${Math.round(orders.revenue)} · by channel ${JSON.stringify(orders.byChannel)} · by agent ${JSON.stringify(orders.byAgent)}`,
    `- ordered items: ${orderedNames || "none"}`,
    `- catalog: ${store?.store.products.map((p) => `${p.name} ${p.price}`).join("; ") ?? "unknown"}`,
  ].join("\n");

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 700, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) return NextResponse.json({ ok: false, error: `anthropic ${r.status}` }, { status: 502 });
    const data = (await r.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? []).map((b) => (b.type === "text" ? b.text ?? "" : "")).join("");
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : text) as { rules?: { kind: "do" | "dont"; txt: string }[] };
    const brain = await setLearnedRules(code, parsed.rules ?? []);
    if (!brain) return NextResponse.json({ ok: false, error: "bad code" }, { status: 400 });
    const learnedRules = brain.rules.filter((r) => r.src === "learned");
    const { recordActivity } = await import("@/lib/studio/activityRepo");
    await recordActivity(slug, "MARKETING", `Learning pass distilled ${learnedRules.length} rule(s) from ${signal} measured signals`);
    return NextResponse.json({ ok: true, brain, learned: learnedRules, signal, model: MODEL });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
