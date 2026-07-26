import { NextResponse } from "next/server";
import { ownedStore } from "@/lib/commerce/owner";
import { blobConfigured, getJson, putJson } from "@/lib/studio/blobStore";
import { loadBrain } from "@/lib/studio/brainRepo";
import { loadTraffic } from "@/lib/studio/hitRepo";
import { loadOrdersSummary } from "@/lib/studio/orderRepo";
import { loadStore } from "@/lib/studio/storeRepo";

/**
 * The ANALYSE stage of the Commerce operating loop.
 *
 * GET  ?slug=  → the cached situational analysis (if any).
 * POST {slug}  → Claude reads the ENTIRE business intelligence (measured data
 *                only) and writes situational awareness: one headline, the
 *                "AI finds:" chain connecting signals, and an operating
 *                posture (GROW / HOLD / FIX). Cached per business so the
 *                owner chooses when to spend an analysis.
 */

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-sonnet-5";

export type Analysis = {
  ts: string;
  posture: "GROW" | "HOLD" | "FIX";
  headline: string;
  findings: { signal: string; insight: string }[];
};

const cachePath = (slug: string) => `analysis/${slug}.json`;

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  const own = await ownedStore(slug);
  if (!own.ok) return NextResponse.json({ ok: false, error: own.error }, { status: own.status });
  if (!slug) return NextResponse.json({ ok: false, error: "slug required" }, { status: 400 });
  const cached = blobConfigured() ? await getJson<Analysis>(cachePath(slug)) : null;
  return NextResponse.json({ ok: true, analysis: cached }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY missing" }, { status: 500 });

  let slug = "";
  try { slug = String((await req.json())?.slug ?? ""); } catch { /* fall through */ }
  if (!slug) return NextResponse.json({ ok: false, error: "slug required" }, { status: 400 });

  const [store, traffic, orders] = await Promise.all([loadStore(slug), loadTraffic(slug), loadOrdersSummary(slug)]);
  if (!store) return NextResponse.json({ ok: false, error: "store not found" }, { status: 404 });
  const code = store.store.brand.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const brain = await loadBrain(code);
  const learned = (brain?.rules ?? []).filter((r) => r.src === "learned").map((r) => r.txt);

  const prompt = [
    "You are the ANALYSE stage of an autonomous commerce operating system. Build situational awareness from MEASURED data only — no speculation, every claim cites a number from the data.",
    "Output ONLY strict JSON — no fences:",
    '{"posture":"GROW"|"HOLD"|"FIX","headline":string,"findings":[{"signal":string,"insight":string}]}',
    "",
    "Rules:",
    "- headline: <= 95 chars — the one-sentence situation an owner should know",
    "- findings: 2-4, each signal = the measured fact (with its number), insight = what it means operationally",
    "- posture: FIX if something measurable is broken/blocked; GROW if signals support scaling; HOLD otherwise",
    "- thin data is itself a finding — say what's unmeasurable and what unlocks measurement; do not invent trends",
    "",
    `BUSINESS: ${store.store.brand.name} (${store.store.brand.fullName}) — ${store.store.brand.oneLiner}`,
    `CATALOG: ${store.store.products.map((p) => `${p.name} ${p.price}${p.availability === "PreOrder" ? " (PreOrder)" : ""}`).join("; ")}`,
    `AGENT READS: total ${traffic.agents} · by agent ${JSON.stringify(traffic.byAgent)} · by surface ${JSON.stringify(traffic.byKind)} · human reads ${traffic.humans}`,
    `ORDERS: ${orders.count} · revenue €${Math.round(orders.revenue)} · by channel ${JSON.stringify(orders.byChannel)} · by agent ${JSON.stringify(orders.byAgent)} · recent: ${orders.recent.map((o) => `${o.productName}×${o.qty} ${o.price} via ${o.channel === "agent-json" ? o.agent : "web"}`).join("; ") || "none"}`,
    `ALREADY LEARNED (do not repeat, build on): ${learned.join(" | ") || "nothing yet"}`,
    "CONTEXT: the store is not yet publicly hosted — all traffic so far is local/testing; feed not yet submitted to merchant programs.",
  ].join("\n");

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 1800, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) return NextResponse.json({ ok: false, error: `anthropic ${r.status}` }, { status: 502 });
    const data = (await r.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? []).map((b) => (b.type === "text" ? b.text ?? "" : "")).join("");
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : text) as { posture?: string; headline?: string; findings?: { signal: string; insight: string }[] };

    const analysis: Analysis = {
      ts: new Date().toISOString(),
      posture: parsed.posture === "GROW" || parsed.posture === "FIX" ? parsed.posture : "HOLD",
      headline: String(parsed.headline ?? "").slice(0, 140),
      findings: (parsed.findings ?? []).filter((f) => f?.signal && f?.insight).slice(0, 4)
        .map((f) => ({ signal: String(f.signal).slice(0, 160), insight: String(f.insight).slice(0, 200) })),
    };
    if (!analysis.headline || analysis.findings.length === 0) return NextResponse.json({ ok: false, error: "analysis too thin" }, { status: 502 });

    if (blobConfigured()) { try { await putJson(cachePath(slug), analysis); } catch { /* serve uncached */ } }
    const { recordActivity } = await import("@/lib/studio/activityRepo");
    await recordActivity(slug, "SYSTEM", `Situational analysis: posture ${analysis.posture} — ${analysis.headline.slice(0, 90)}`);
    return NextResponse.json({ ok: true, analysis, model: MODEL });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
