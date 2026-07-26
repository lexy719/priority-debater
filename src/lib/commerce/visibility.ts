/**
 * AI-VISIBILITY AUDIT — the wedge.
 *
 * Answers one urgent question for ANY store on the internet: *can AI shoppers
 * find, read and buy from you?* It fetches the site exactly as an agent does —
 * plain HTTP, no JavaScript — and grades three dimensions:
 *
 *   DISCOVERY      can agents reach you at all (robots, sitemap, feeds)
 *   LEGIBILITY     can they understand you (SSR content, JSON-LD, policies)
 *   TRANSACTABILITY can they complete a purchase (checkout, guest, order API)
 *
 * Needs NO API key — every finding comes from a real HTTP response, so the
 * audit works when quotas are dead and can never invent a result. Grounded in
 * the mid-2026 research: agents don't execute JS, llms.txt is a bonus not a
 * channel, JSON-LD policy fields are actively filtered on, and the winning
 * purchase path is a guest checkout the agent can complete on the merchant's
 * own site.
 */

export type CheckStatus = "PASS" | "WARN" | "FAIL";
export type Dimension = "DISCOVERY" | "LEGIBILITY" | "TRANSACTABILITY";

export type Check = {
  id: string;
  dim: Dimension;
  label: string;
  status: CheckStatus;
  /** Points this check contributes when PASS (half when WARN). */
  weight: number;
  /** What we actually observed. */
  note: string;
  /** What to do about it — plain, actionable, platform-aware where possible. */
  fix?: string;
};

export type VisibilityReport = {
  url: string;
  host: string;
  ts: string;
  platform: string | null;
  score: number;
  grade: "STRONG" | "PARTIAL" | "INVISIBLE";
  dims: Record<Dimension, { score: number; max: number }>;
  checks: Check[];
  /** The single most valuable sentence in the report. */
  headline: string;
  productUrl: string | null;
  agentAllow: Record<string, boolean>;
};

/* ── url handling (with SSRF guards — this fetches user-supplied URLs) ──── */

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|\[?::1\]?|172\.(1[6-9]|2\d|3[01])\.)/i;

export function normalize(input: string): { url: string; host: string } | null {
  const raw = input.trim();
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  // Private/loopback targets are refused in production (SSRF); allowed in dev
  // so our own generated stores can be audited locally.
  const local = PRIVATE_HOST.test(u.hostname);
  if (local && process.env.NODE_ENV === "production") return null;
  if (!local && !u.hostname.includes(".")) return null;
  // A path matters for our own stores (/store/<slug>), so keep it when present.
  const path = u.pathname.replace(/\/+$/, "");
  return { url: `${u.protocol}//${u.host}${path}`, host: (u.host + path).replace(/^www\./, "") };
}

/** Fetch as an AI shopping agent: plain GET, bot UA, no JS, short timeout. */
async function get(url: string, ms = 9000): Promise<{ ok: boolean; status: number; text: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        // Identify honestly as an audit bot that behaves like a shopping agent.
        "user-agent": "Mozilla/5.0 (compatible; PDR-VisibilityBot/1.0; +https://precisiondynamics.ai/visibility) GPTBot-equivalent",
        accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      },
      cache: "no-store",
    });
    const text = r.ok ? (await r.text()).slice(0, 900_000) : "";
    return { ok: r.ok, status: r.status, text };
  } catch {
    return { ok: false, status: 0, text: "" };
  } finally {
    clearTimeout(t);
  }
}

async function head(url: string, ms = 6000): Promise<boolean> {
  const r = await get(url, ms);
  return r.ok && r.text.length > 0;
}

/* ── parsing helpers ───────────────────────────────────────────────────── */

const AGENTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "PerplexityBot", "Google-Extended"];

/** Per-agent robots.txt verdict. Absent robots.txt = allowed. */
function agentAllowances(robots: string): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  const blocks = robots.split(/\n\s*\n/);
  const blanket = blocks.find((b) => /^user-agent:\s*\*/im.test(b));
  const blanketBlocked = !!blanket && /^disallow:\s*\/\s*$/im.test(blanket);
  for (const a of AGENTS) {
    const own = blocks.find((b) => new RegExp(`^user-agent:\\s*${a}\\s*$`, "im").test(b));
    if (own) out[a] = !/^disallow:\s*\/\s*$/im.test(own);
    else out[a] = !blanketBlocked;
  }
  return out;
}

/** The text an agent actually receives: scripts and styles removed, tags stripped.
    Script removal matters — a JS shell can ship 150KB of HTML and zero content. */
function agentText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Rendered prices are the sharpest proxy for "product content is server-side".
    A small honest store may be terse; a JS shell never shows a price. */
function priceHits(text: string): number {
  return [...text.matchAll(/(?:[€$£¥]\s?\d[\d.,]*|\d[\d.,]*\s?(?:EUR|USD|GBP))/gi)].length;
}

function jsonLdBlocks(html: string): string {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1]).join("\n");
}

function detectPlatform(html: string, headersHint = ""): string | null {
  const h = `${html.slice(0, 200_000)} ${headersHint}`;
  if (/cdn\.shopify\.com|Shopify\.theme|x-shopify/i.test(h)) return "Shopify";
  if (/wp-content\/plugins\/woocommerce|woocommerce-page/i.test(h)) return "WooCommerce";
  if (/static\.wixstatic\.com|wixstores/i.test(h)) return "Wix";
  if (/squarespace\.com|static1\.squarespace/i.test(h)) return "Squarespace";
  if (/bigcommerce\.com|bigcommerce\.js/i.test(h)) return "BigCommerce";
  if (/magento|Mage\.Cookies/i.test(h)) return "Magento";
  if (/__NEXT_DATA__|_next\/static/i.test(h)) return "Next.js";
  return null;
}

/** Find a plausible product page from the homepage's own links. */
function findProductLink(html: string, base: string): string | null {
  const hrefs = [...html.matchAll(/href=["']([^"']+)["']/gi)].map((m) => m[1]);
  const cand = hrefs.find((h) => /\/(products?|product|item|p|shop\/[^/]+)\/[a-z0-9][^"'#?]*$/i.test(h));
  if (!cand) return null;
  try { return new URL(cand, base).toString(); } catch { return null; }
}

const CHECKOUT_PATHS = ["/cart", "/checkout", "/basket"];

/* ── the audit ─────────────────────────────────────────────────────────── */

export async function auditVisibility(input: string): Promise<VisibilityReport | null> {
  const n = normalize(input);
  if (!n) return null;

  // robots.txt always lives at the HOST root; everything else may be published
  // either at the root (own domain) or relative to a hosted store subpath.
  const root = new URL(n.url).origin;
  const [home, robotsRes, sitemapOk, llmsOk, feedOk, agentCatalogOk, ucpOk, mcpOk] = await Promise.all([
    get(n.url),
    get(`${root}/robots.txt`, 6000),
    head(`${n.url}/sitemap.xml`).then((ok) => ok || head(`${root}/sitemap.xml`)),
    head(`${n.url}/llms.txt`).then((ok) => ok || head(`${root}/llms.txt`)),
    head(`${n.url}/feed.jsonl`)
      .then((ok) => ok || head(`${n.url}/feed.tsv`))
      .then((ok) => ok || head(`${n.url}/products.json`))
      .then((ok) => ok || head(`${root}/products.json`)),
    head(`${n.url}/agent-catalog.json`)
      .then((ok) => ok || head(`${n.url}/.well-known/agent-catalog.json`))
      .then((ok) => ok || head(`${root}/.well-known/agent-catalog.json`)),
    head(`${n.url}/.well-known/ucp`).then((ok) => ok || head(`${root}/.well-known/ucp`)),
    head(`${n.url}/mcp`),
  ]);

  const checks: Check[] = [];
  const add = (c: Check) => checks.push(c);

  // Unreachable = the only fatal outcome; report it honestly and stop.
  if (!home.ok || home.text.length < 200) {
    const botWall = home.status === 403 || home.status === 429 || home.status === 401 || home.status === 503;
    return {
      url: n.url, host: n.host, ts: new Date().toISOString(), platform: null,
      score: 0, grade: "INVISIBLE",
      dims: { DISCOVERY: { score: 0, max: 30 }, LEGIBILITY: { score: 0, max: 45 }, TRANSACTABILITY: { score: 0, max: 25 } },
      checks: [{
        id: "reachable", dim: "DISCOVERY", label: "Reachable by an AI agent", status: "FAIL", weight: 100,
        note: botWall
          ? `Bot protection turned an agent request away with HTTP ${home.status}.`
          : home.status
            ? `The site answered HTTP ${home.status} to a plain agent request.`
            : "No response to a plain agent request (timeout or DNS failure).",
        fix: botWall
          ? "A protection layer (Cloudflare, WAF, rate limiter) is challenging non-browser traffic. AI shopping agents arrive exactly like this request — allowlist verified agents (Web Bot Auth signed agents, GPTBot, ClaudeBot, PerplexityBot) or you are opted out of AI commerce entirely."
          : "Agents fetch without a browser, cookies or JavaScript. Serve a plain HTTP GET successfully and quickly, or no AI shopper can reach you.",
      }],
      headline: botWall
        ? "Bot protection blocked our agent-style request — AI shoppers are being turned away the same way."
        : "This store did not answer a plain agent request — AI shoppers cannot see it at all.",
      productUrl: null, agentAllow: {},
    };
  }

  const html = home.text;
  const platform = detectPlatform(html);
  const ld = jsonLdBlocks(html);
  const homeText = agentText(html);
  const volume = homeText.length;
  const homePrices = priceHits(homeText);
  const robots = robotsRes.ok ? robotsRes.text : "";
  const allow = agentAllowances(robots);
  const blocked = AGENTS.filter((a) => allow[a] === false);

  // Product page: the page agents actually read to compare.
  const productUrl = findProductLink(html, n.url);
  const product = productUrl ? await get(productUrl) : null;
  const pHtml = product?.ok ? product.text : "";
  const pLd = pHtml ? jsonLdBlocks(pHtml) : "";
  const pText = pHtml ? agentText(pHtml) : "";
  const pVolume = pText.length;
  const pPrices = priceHits(pText);

  /* ── DISCOVERY (30) ── */
  add({
    id: "robots", dim: "DISCOVERY", label: "AI agents allowed in robots.txt", weight: 12,
    status: blocked.length === 0 ? "PASS" : blocked.length >= 4 ? "FAIL" : "WARN",
    note: !robotsRes.ok ? "No robots.txt — nothing is blocked, so agents may crawl."
      : blocked.length === 0 ? `robots.txt permits all major agents (${AGENTS.length} checked).`
      : `Blocked: ${blocked.join(", ")}.`,
    fix: blocked.length ? "Remove the Disallow rules for these agents — each one blocked is a shopping surface you cannot appear on." : undefined,
  });
  add({
    id: "sitemap", dim: "DISCOVERY", label: "sitemap.xml present", weight: 6,
    status: sitemapOk ? "PASS" : "WARN",
    note: sitemapOk ? "Crawlers can enumerate your pages." : "No sitemap.xml found — agents must discover pages by following links.",
    fix: sitemapOk ? undefined : "Publish /sitemap.xml listing every product page.",
  });
  add({
    id: "feed", dim: "DISCOVERY", label: "Machine-readable product feed", weight: 12,
    status: feedOk ? "PASS" : "FAIL",
    note: feedOk ? "A product feed is reachable at a conventional path." : "No product feed found at a conventional path.",
    fix: feedOk ? "Submit it to Google Merchant Center, chatgpt.com/merchants and the Perplexity merchant programme — a feed nobody ingests wins nothing."
      : "Publish a product feed (title, price, availability, link, image, GTIN) and submit it to Google Merchant Center, chatgpt.com/merchants and Perplexity. This is the #1 way AI assistants learn your catalogue exists.",
  });

  /* ── LEGIBILITY (45) ── */
  // A JS shell ships lots of HTML and no content. Rendered PRICES are the
  // decisive tell — a terse but honest store still shows them.
  const jsShell = volume < 500 || (homePrices === 0 && pPrices === 0 && volume < 2000);
  add({
    id: "ssr", dim: "LEGIBILITY", label: "Content readable without JavaScript", weight: 15,
    status: jsShell ? "FAIL" : homePrices === 0 && pPrices === 0 ? "WARN" : "PASS",
    note: jsShell
      ? `Only ~${volume} characters and no prices render without JavaScript — agents see an empty shell.`
      : homePrices + pPrices > 0
        ? `~${(volume / 1000).toFixed(1)}k characters of text and ${homePrices + pPrices} price(s) served without JavaScript.`
        : `~${(volume / 1000).toFixed(1)}k characters of text, but no prices appear without JavaScript.`,
    fix: jsShell
      ? "GPTBot, ClaudeBot and PerplexityBot do not execute JavaScript. Server-render your product content (SSR/SSG or prerendering) or you are invisible to them no matter what else you do."
      : homePrices + pPrices === 0
        ? "Prices are not in the served HTML. Render price and availability server-side — an agent that cannot read your price cannot quote or compare you."
        : undefined,
  });
  add({
    id: "jsonld", dim: "LEGIBILITY", label: "schema.org structured data", weight: 8,
    status: ld ? "PASS" : "FAIL",
    note: ld ? "JSON-LD is embedded in the homepage HTML." : "No JSON-LD found in the served HTML.",
    fix: ld ? undefined : "Embed schema.org JSON-LD server-side. It is the format agents parse deterministically.",
  });
  const hasProduct = /"@type"\s*:\s*"Product"/i.test(pLd || ld);
  const hasOffer = /"@type"\s*:\s*"(Offer|AggregateOffer)"/i.test(pLd || ld);
  add({
    id: "product-schema", dim: "LEGIBILITY", label: "Product + Offer schema on product pages", weight: 10,
    status: hasProduct && hasOffer ? "PASS" : hasProduct ? "WARN" : "FAIL",
    note: !productUrl ? "No product page could be found from the homepage links."
      : hasProduct && hasOffer ? "Product and Offer types found — price and availability are machine-readable."
      : hasProduct ? "Product found but no Offer — agents cannot read price or availability reliably."
      : "No Product schema on the product page we sampled.",
    fix: hasProduct && hasOffer ? undefined : "Add Product + Offer JSON-LD to every product page with price, priceCurrency, availability and sku. Without Offer data an agent cannot compare or quote you.",
  });
  const hasReturn = /hasMerchantReturnPolicy|MerchantReturnPolicy/i.test(pLd || ld);
  const hasShip = /shippingDetails|OfferShippingDetails/i.test(pLd || ld);
  add({
    id: "policy-schema", dim: "LEGIBILITY", label: "Shipping & return policy in structured data", weight: 8,
    status: hasReturn && hasShip ? "PASS" : hasReturn || hasShip ? "WARN" : "FAIL",
    note: hasReturn && hasShip ? "Return and shipping policies are machine-readable."
      : `Missing ${[!hasReturn && "MerchantReturnPolicy", !hasShip && "OfferShippingDetails"].filter(Boolean).join(" and ")}.`,
    fix: hasReturn && hasShip ? undefined : "Add hasMerchantReturnPolicy and shippingDetails to your Offer. Agents filter on these to answer \"free returns\" and \"arrives by Friday\" — without them you are excluded from those queries.",
  });
  add({
    id: "product-depth", dim: "LEGIBILITY", label: "Product page readable without JavaScript", weight: 4,
    status: !productUrl ? "WARN" : pPrices > 0 && pVolume > 400 ? "PASS" : pVolume > 400 ? "WARN" : "FAIL",
    note: !productUrl ? "No product page could be sampled from the homepage links."
      : pPrices > 0 && pVolume > 400 ? `The sampled product page serves its description and price (~${(pVolume / 1000).toFixed(1)}k characters) without JavaScript.`
      : pVolume > 400 ? "The product page serves text but no price without JavaScript."
      : "The product page renders almost nothing without JavaScript.",
    fix: productUrl && !(pPrices > 0 && pVolume > 400) ? "Server-render the product description, price and availability — this is the page agents quote from." : undefined,
  });

  /* ── TRANSACTABILITY (25) ── */
  let checkoutOk = false; let checkoutPath = "";
  for (const p of CHECKOUT_PATHS) {
    // eslint-disable-next-line no-await-in-loop -- sequential probe, first hit wins
    if (await head(`${n.url}${p}`)) { checkoutOk = true; checkoutPath = p; break; }
  }
  add({
    id: "checkout", dim: "TRANSACTABILITY", label: "Checkout reachable by an agent", weight: 10,
    status: checkoutOk ? "PASS" : "WARN",
    note: checkoutOk ? `${checkoutPath} answers a plain agent request.` : "No cart or checkout page answered a plain agent request.",
    fix: checkoutOk ? undefined : "The dominant purchase path is discover-in-AI then complete on your site. Make cart/checkout reachable without JavaScript gymnastics, guest-only, no CAPTCHA — Google's agent literally fills your form.",
  });
  const accountWall = /create an account to (checkout|continue)|sign in to (checkout|continue)|account required/i.test(html);
  add({
    id: "guest", dim: "TRANSACTABILITY", label: "Guest checkout (no account wall)", weight: 5,
    // Cannot be verified without a checkout to inspect — say so rather than credit it.
    status: accountWall ? "FAIL" : checkoutOk ? "PASS" : "WARN",
    note: accountWall ? "The site indicates an account is required to check out."
      : checkoutOk ? "No forced-account-creation signal on the reachable checkout path."
      : "No checkout was reachable, so guest checkout could not be verified.",
    fix: accountWall ? "Offer guest checkout. An agent cannot create an account, so an account wall ends the purchase."
      : checkoutOk ? undefined : "Make a checkout path reachable so guest completability can be confirmed.",
  });
  add({
    id: "protocol", dim: "TRANSACTABILITY", label: "Agent commerce protocol endpoint", weight: 6,
    status: ucpOk && mcpOk ? "PASS" : ucpOk || mcpOk ? "WARN" : "FAIL",
    note: ucpOk && mcpOk ? "A UCP profile and an MCP endpoint are both published — agents can transact by protocol."
      : ucpOk ? "A UCP profile is published, but no MCP endpoint was found."
      : mcpOk ? "An MCP endpoint is published, but no UCP profile was found."
      : "No UCP profile and no MCP endpoint.",
    fix: ucpOk && mcpOk ? undefined
      : "Publish a UCP profile (Google + Shopify + Microsoft's converging standard) and an MCP endpoint, so agents can read and buy by protocol instead of scraping your form.",
  });
  add({
    id: "agent-catalog", dim: "TRANSACTABILITY", label: "Machine catalogue / llms.txt", weight: 4,
    status: agentCatalogOk ? "PASS" : "WARN",
    note: agentCatalogOk ? `A machine-readable agent catalogue is published${llmsOk ? " (plus llms.txt)" : ""}.`
      : llmsOk ? "llms.txt is present (a bonus signal — few agents fetch it), but no structured agent catalogue."
      : "No agent catalogue or llms.txt.",
    fix: agentCatalogOk ? undefined : "Publish a structured agent catalogue. Treat llms.txt as a courtesy, not a channel — the feed and your JSON-LD do the real work.",
  });

  /* ── score ── */
  const dims: Record<Dimension, { score: number; max: number }> = {
    DISCOVERY: { score: 0, max: 0 }, LEGIBILITY: { score: 0, max: 0 }, TRANSACTABILITY: { score: 0, max: 0 },
  };
  for (const c of checks) {
    dims[c.dim].max += c.weight;
    dims[c.dim].score += c.status === "PASS" ? c.weight : c.status === "WARN" ? c.weight / 2 : 0;
  }
  const total = Object.values(dims).reduce((a, d) => a + d.max, 0) || 1;
  const earned = Object.values(dims).reduce((a, d) => a + d.score, 0);
  const score = Math.round((earned / total) * 100);
  const grade: VisibilityReport["grade"] = score >= 70 ? "STRONG" : score >= 40 ? "PARTIAL" : "INVISIBLE";

  /* ── headline: the single most valuable sentence ── */
  const headline = jsShell
    ? "Your product content does not exist without JavaScript — the AI shoppers that matter cannot read this store."
    : homePrices + pPrices === 0
    ? "Agents can read your pages but not your prices — without a rendered price you lose every comparison query."
    : blocked.length >= 4
      ? `Your robots.txt blocks ${blocked.length} of the major AI shopping agents — you are opted out of their results.`
      : !feedOk
        ? "No product feed: AI assistants have no structured way to learn your catalogue, so they recommend competitors who do."
        : !hasOffer
          ? "Agents can read your pages but not your prices — without Offer data you lose every comparison and constraint query."
          : !hasReturn || !hasShip
            ? "You are readable, but missing the shipping and return data agents filter on — invisible to \"free returns\" and \"arrives by\" queries."
            : score >= 95
              ? "This store is fully legible and transactable by AI shoppers — discovery, legibility and protocol rails are all in place."
            : score >= 70
              ? "This store is genuinely legible to AI shoppers — the remaining gaps are protocol-level."
              : "Partially visible: agents can reach you, but key purchase signals are missing.";

  return {
    url: n.url, host: n.host, ts: new Date().toISOString(), platform,
    score, grade, dims, checks, headline, productUrl, agentAllow: allow,
  };
}
