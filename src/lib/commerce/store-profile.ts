/**
 * Store profile — fetch the merchant's REAL homepage and read what's actually
 * there. No API key required, so this is the honest, always-live foundation of
 * the audit: the store's real name, what it sells, and which agent-readability
 * signals (schema, llms.txt, feeds, meta) are present or missing.
 *
 * Everything downstream (the buyer test prompts, the readiness checklist, the
 * fix list) is grounded in this so the report is about THEIR store, never a
 * hash-seeded fiction.
 */

export interface StoreSignals {
  llmsTxt: boolean;
  productJsonLd: boolean;
  offerJsonLd: boolean;
  organizationJsonLd: boolean;
  faqJsonLd: boolean;
  breadcrumbJsonLd: boolean;
  aggregateRating: boolean;
  ogTags: boolean;
  metaDescription: boolean;
  sitemap: boolean;
  productFeed: boolean;
  /** Detected review app/platform name, or "" if none found. */
  reviewPlatform: string;
  hasBlog: boolean;
  jsonLdTypes: string[];
  platform: "shopify" | "woocommerce" | "bigcommerce" | "unknown";
}

export interface StoreProfile {
  url: string;
  host: string;
  origin: string;
  reachable: boolean;
  name: string;
  description: string;
  /** Short human category guess, e.g. "specialty coffee equipment". */
  category: string;
  /** Best-effort ISO currency code read from the store (defaults to USD). */
  currency: string;
  /** Logo / hero image (og:image) if present. */
  image: string;
  /** Social profile URLs found on the homepage (for sameAs schema). */
  socials: string[];
  /** Name variants used to detect whether an AI mentions this store. */
  aliases: string[];
  signals: StoreSignals;
}

const UA =
  "Mozilla/5.0 (compatible; PriorityDebaterAuditBot/1.0; +https://priority-debater.vercel.app)";

async function fetchWithTimeout(url: string, ms: number, method: "GET" | "HEAD" = "GET") {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      method,
      redirect: "follow",
      signal: ctrl.signal,
      cache: "no-store",
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    });
  } finally {
    clearTimeout(timer);
  }
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&(?:#0?39|apos|lsquo|rsquo);/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&hellip;/g, "…")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function attr(html: string, re: RegExp): string {
  const m = html.match(re);
  return m ? m[1].trim() : "";
}

/** Pull <meta name|property=X content=Y> in either attribute order. */
function meta(html: string, key: string): string {
  return (
    attr(html, new RegExp(`<meta[^>]*(?:name|property)=["']${key}["'][^>]*content=["']([^"']*)["']`, "i")) ||
    attr(html, new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${key}["']`, "i"))
  );
}

function collectJsonLdTypes(html: string): string[] {
  const types = new Set<string>();
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const walk = (node: unknown) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (node && typeof node === "object") {
          const obj = node as Record<string, unknown>;
          const t = obj["@type"];
          if (typeof t === "string") types.add(t);
          if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && types.add(x));
          if (obj.aggregateRating) types.add("AggregateRating");
          Object.values(obj).forEach(walk);
        }
      };
      walk(JSON.parse(m[1].trim()));
    } catch {
      /* malformed JSON-LD — ignore */
    }
  }
  return [...types];
}

function cleanName(raw: string): string {
  // Drop the tagline after a separator: "Acme Coffee — Single Origin Beans" → "Acme Coffee".
  return raw.split(/\s[|–—\-–—:]\s/)[0].trim().slice(0, 80);
}

function buildAliases(name: string, host: string): string[] {
  const bare = host.replace(/^www\./, "").split(".")[0];
  const stripped = name.replace(/\b(inc|llc|ltd|co|store|shop|the)\b/gi, "").trim();
  const aliases = new Set(
    [name, stripped, name.split(/\s+/)[0], bare].map((s) => s.trim()).filter((s) => s.length >= 3),
  );
  return [...aliases];
}

function inferCategory(name: string, description: string, jsonLdTypes: string[]): string {
  const text = `${name} ${description}`.toLowerCase();
  const map: [RegExp, string][] = [
    [/coffee|espresso|roast|grinder|barista/, "specialty coffee equipment"],
    [/skincare|beauty|cosmetic|serum|makeup/, "beauty & skincare"],
    [/jewel|ring|necklace|earring/, "jewelry"],
    [/apparel|clothing|fashion|wear|outfit|tee|shirt/, "apparel & fashion"],
    [/supplement|vitamin|protein|wellness|nutrition/, "health supplements"],
    [/furniture|home decor|interior|lamp|sofa/, "home & furniture"],
    [/pet|dog|cat/, "pet products"],
    [/candle|fragrance|perfume|scent/, "candles & fragrance"],
    [/tea|matcha/, "tea"],
    [/wine|spirits|whisky|whiskey/, "wine & spirits"],
    [/shoe|sneaker|footwear|boot/, "footwear"],
    [/bike|cycling|outdoor|hiking|camping/, "outdoor & sports gear"],
    [/electronic|gadget|device|headphone|charger/, "consumer electronics"],
  ];
  for (const [re, label] of map) if (re.test(text)) return label;
  if (jsonLdTypes.includes("Product")) return "online retail";
  return "online retail";
}

export async function fetchStoreProfile(url: string, host: string): Promise<StoreProfile> {
  let html = "";
  let reachable = false;
  try {
    const res = await fetchWithTimeout(url, 6000);
    reachable = res.ok;
    if (res.ok) html = (await res.text()).slice(0, 600_000);
  } catch {
    reachable = false;
  }

  const jsonLdTypes = collectJsonLdTypes(html);
  const title = attr(html, /<title[^>]*>([^<]+)<\/title>/i);
  const name = decodeEntities(cleanName(meta(html, "og:site_name") || title || host.replace(/^www\./, "")));
  const description = decodeEntities(meta(html, "description") || meta(html, "og:description")).slice(0, 300);

  const platform: StoreSignals["platform"] = /cdn\.shopify|shopify/i.test(html)
    ? "shopify"
    : /woocommerce|wp-content/i.test(html)
      ? "woocommerce"
      : /bigcommerce/i.test(html)
        ? "bigcommerce"
        : "unknown";

  // Side checks — fire in parallel, never block the main result for long.
  const [llmsTxt, sitemap, productFeed] = await Promise.all([
    probe(`${origin(url)}/llms.txt`),
    probe(`${origin(url)}/sitemap.xml`, "HEAD"),
    platform === "shopify" ? probe(`${origin(url)}/products.json`, "HEAD") : Promise.resolve(false),
  ]);

  const reviewApps: [RegExp, string][] = [
    [/judge\.me|jdgm/i, "Judge.me"],
    [/yotpo/i, "Yotpo"],
    [/okendo/i, "Okendo"],
    [/stamped\.io/i, "Stamped"],
    [/loox/i, "Loox"],
    [/trustpilot/i, "Trustpilot"],
    [/reviews\.io|reviewsio/i, "Reviews.io"],
    [/shopify-product-reviews|\bspr-/i, "Shopify Reviews"],
    [/feefo/i, "Feefo"],
  ];
  let reviewPlatform = "";
  for (const [re, label] of reviewApps) {
    if (re.test(html)) {
      reviewPlatform = label;
      break;
    }
  }
  const hasBlog = /href=["'][^"']*\/blogs?\b/i.test(html);

  const signals: StoreSignals = {
    llmsTxt,
    sitemap,
    productFeed,
    reviewPlatform,
    hasBlog,
    platform,
    jsonLdTypes,
    productJsonLd: jsonLdTypes.includes("Product"),
    offerJsonLd: jsonLdTypes.includes("Offer"),
    organizationJsonLd: jsonLdTypes.some((t) => t === "Organization" || t === "Store" || t === "LocalBusiness"),
    faqJsonLd: jsonLdTypes.includes("FAQPage"),
    breadcrumbJsonLd: jsonLdTypes.includes("BreadcrumbList"),
    aggregateRating: jsonLdTypes.includes("AggregateRating"),
    ogTags: !!meta(html, "og:title"),
    metaDescription: !!meta(html, "description"),
  };

  const currency =
    (attr(html, /["']?currency["']?\s*[:=]\s*["']([A-Z]{3})["']/) ||
      meta(html, "og:price:currency") ||
      meta(html, "product:price:currency") ||
      "USD").toUpperCase();

  const socials = [...new Set(
    [...html.matchAll(/https?:\/\/(?:www\.)?(?:instagram|facebook|twitter|x|tiktok|youtube|pinterest|linkedin)\.com\/[^\s"'<>]+/gi)]
      .map((m) => m[0].replace(/["'<>].*$/, ""))
      .filter((u) => !/\/(sharer|share|intent|plugins)/i.test(u)),
  )].slice(0, 6);

  return {
    url,
    host,
    origin: origin(url),
    reachable,
    name,
    description,
    category: inferCategory(name, description, jsonLdTypes),
    currency,
    image: meta(html, "og:image"),
    socials,
    aliases: buildAliases(name, host),
    signals,
  };
}

function origin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url.replace(/\/$/, "");
  }
}

async function probe(url: string, method: "GET" | "HEAD" = "GET"): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(url, 4000, method);
    if (!res.ok) return false;
    if (method === "HEAD") return true;
    const body = await res.text();
    return body.trim().length > 0 && !/<\!doctype html|<html/i.test(body.slice(0, 200));
  } catch {
    return false;
  }
}
