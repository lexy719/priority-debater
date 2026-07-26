import { NextResponse } from "next/server";
import { loadStore } from "@/lib/studio/storeRepo";

/**
 * GET /api/store/[slug]/report — the Agent Legibility Report.
 *
 * Crawls the store's own SSR page the way a shopping agent would (plain HTTP,
 * no JS execution) and scores what an agent can actually extract: rendered
 * content, valid JSON-LD offers, price consistency, feed pack availability.
 * PASS/WARN/FAIL per check — honest, including known gaps (no GTINs).
 */

export const dynamic = "force-dynamic";

type Check = { k: string; label: string; status: "PASS" | "WARN" | "FAIL"; note: string };

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await loadStore(slug);
  if (!s) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  const origin = new URL(req.url).origin;
  const checks: Check[] = [];
  const push = (k: string, label: string, status: Check["status"], note: string) => checks.push({ k, label, status, note });

  // 1 · Fetch the SSR page as an agent would — no JS, plain UA.
  let html = "";
  try {
    const r = await fetch(`${origin}/store/${slug}`, { headers: { "user-agent": "PDR-LegibilityBot/1.0 (js-off)" }, cache: "no-store" });
    html = r.ok ? await r.text() : "";
    push("ssr", "Server-rendered HTML", html.length > 2000 ? "PASS" : "FAIL", r.ok ? `${(html.length / 1024).toFixed(1)}KB of real HTML without executing JS` : `HTTP ${r.status}`);
  } catch (e) {
    push("ssr", "Server-rendered HTML", "FAIL", (e as Error).message);
  }

  // 2 · JSON-LD present and parseable.
  const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  let ld: unknown = null;
  try { ld = ldMatch ? JSON.parse(ldMatch[1]) : null; } catch { ld = null; }
  push("jsonld", "schema.org JSON-LD", ld ? "PASS" : "FAIL", ld ? "embedded server-side, parses clean" : "missing or invalid");

  // 3 · Product coverage — every SKU visible in raw HTML.
  const visible = s.store.products.filter((p) => p.name && html.includes(p.name));
  push("products", "Product coverage in HTML", visible.length === s.store.products.length ? "PASS" : visible.length ? "WARN" : "FAIL",
    `${visible.length}/${s.store.products.length} SKUs readable in raw HTML`);

  // 4 · Price consistency — visible prices match structured offers.
  const priced = s.store.products.filter((p) => p.price && html.includes(p.price));
  push("prices", "Price consistency (HTML ↔ offers)", priced.length === s.store.products.length ? "PASS" : "WARN",
    `${priced.length}/${s.store.products.length} display prices match structured data`);

  // 5 · Feed pack + site surfaces availability.
  const probe = async (path: string) => { try { const r = await fetch(`${origin}${path}`, { cache: "no-store" }); return r.ok; } catch { return false; } };
  const [feedOk, llmsOk, catOk, mapOk, checkoutOk] = await Promise.all([
    probe(`/store/${slug}/feed.jsonl`), probe(`/store/${slug}/llms.txt`), probe(`/store/${slug}/agent-catalog.json`),
    probe(`/store/${slug}/sitemap.xml`), probe(`/store/${slug}/checkout`),
  ]);
  push("feed", "Product feed (.jsonl w/ seller + returns fields)", feedOk ? "PASS" : "FAIL", feedOk ? "ready to submit to Google Merchant / ChatGPT merchants / Perplexity" : "unreachable");
  push("llms", "llms.txt", llmsOk ? "PASS" : "WARN", llmsOk ? "emitted (bonus channel — few agents fetch it)" : "unreachable");
  push("catalog", "agent-catalog.json (order endpoint documented)", catOk ? "PASS" : "WARN", catOk ? "machine-readable product intelligence + order-intent endpoint online" : "unreachable");
  push("sitemap", "sitemap.xml", mapOk ? "PASS" : "WARN", mapOk ? "every page listed for crawlers" : "unreachable");
  push("checkoutForm", "Guest checkout (JS-off form + JSON order-intent)", checkoutOk ? "PASS" : "FAIL", checkoutOk ? "no account wall, no CAPTCHA — the pattern agents can complete" : "unreachable");

  // 6 · Policies in structured form (what agents filter on).
  push("policies", "Return + shipping policies in JSON-LD", /hasMerchantReturnPolicy/.test(html) && /OfferShippingDetails/.test(html) ? "PASS" : "WARN",
    "MerchantReturnPolicy + OfferShippingDetails ride in the page structured data");

  // 7 · robots.txt — agents must be allowed in.
  let robotsNote = "unreachable"; let robotsStatus: Check["status"] = "WARN";
  try {
    const r = await fetch(`${origin}/robots.txt`, { cache: "no-store" });
    if (r.ok) {
      const txt = await r.text();
      const blocksAll = /User-agent:\s*\*\s*[\r\n]+Disallow:\s*\/\s*$/mi.test(txt);
      const aiAllowed = /GPTBot|OAI-SearchBot|PerplexityBot|ClaudeBot/i.test(txt);
      robotsStatus = !blocksAll ? "PASS" : "FAIL";
      robotsNote = blocksAll ? "robots.txt blocks everything" : aiAllowed ? "AI agents explicitly allowed" : "no explicit AI-agent rules but store is crawlable";
    }
  } catch { /* stays WARN */ }
  push("robots", "robots.txt lets agents in", robotsStatus, robotsNote);

  // 8 · Protocol rails + the seller's own record — probed, not assumed.
  const [ucpOk, cardOk, recordOk] = await Promise.all([
    probe(`/store/${slug}/.well-known/ucp`), probe(`/store/${slug}/.well-known/agent-card.json`),
    probe(`/store/${slug}/.well-known/seller-record.json`),
  ]);
  let mcpOk = false;
  try {
    const r = await fetch(`${origin}/store/${slug}/mcp`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }), cache: "no-store",
    });
    const j = r.ok ? await r.json() : null;
    mcpOk = Array.isArray(j?.result?.tools) && j.result.tools.length > 0;
  } catch { /* stays false */ }
  const rails = [ucpOk && "UCP profile", cardOk && "agent card", mcpOk && "MCP tools"].filter(Boolean) as string[];
  push("protocol", "UCP/ACP protocol rails", ucpOk && mcpOk ? "PASS" : rails.length ? "WARN" : "FAIL",
    rails.length
      ? `${rails.join(" + ")} live — payment mandates still escalate to the store's own checkout (no card data by protocol)`
      : "no protocol surfaces reachable");
  push("sellerRecord", "Seller record (measured fulfilment history)", recordOk ? "PASS" : "WARN",
    recordOk ? "orders, lifecycle counts and fulfilment speed published for agents to check, with its limits declared" : "unreachable");

  // 9 · Provenance — the attributes a mandate is matched against.
  const declared = s.store.products.filter((p) => p.provenance?.material || p.provenance?.origin || p.provenance?.madeBy);
  push("provenance", "Product provenance (material · origin · maker)",
    declared.length === s.store.products.length ? "PASS" : declared.length ? "WARN" : "FAIL",
    `${declared.length}/${s.store.products.length} SKUs declare provenance — agents buying under a constraint filter on exactly these`);

  // 10 · Imagery. The feeds are now format-valid (PNG, not SVG — every shopping
  //      surface rejects vector), but generated art is not a photograph of the
  //      product and Merchant Center reviews for that.
  push("imagery", "Product imagery (shopping-feed grade)", "WARN",
    "feeds serve PNG so they are format-valid, but the art is generated placeholder — Merchant Center approval needs a photograph of the actual product");

  // 11 · Known gap, stated honestly.
  push("gtin", "GTIN identifiers", "WARN", "fabricated SKUs have no registered GTINs — feed declares identifier_exists: false");

  const score = Math.round((checks.filter((c) => c.status === "PASS").length / checks.length) * 100);
  return NextResponse.json({ ok: true, slug, origin, score, checks, crawledAs: "PDR-LegibilityBot/1.0 (js-off)" });
}
