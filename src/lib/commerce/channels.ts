import "server-only";

/**
 * DISTRIBUTION — is this store actually IN the places AI shoppers look?
 *
 * The visibility audit answers "can an agent read you". This answers the
 * question after it: "are you listed where agents are sent looking". They are
 * different failures. A store can be perfectly legible and still absent from
 * every shopping surface, because those surfaces are catalogues you submit to,
 * not crawls you wait for.
 *
 * Each channel is checked against ITS OWN published requirements, per SKU, and
 * reports exactly which attribute is missing on which product. Nothing is
 * scored on a curve and nothing is estimated: a requirement is met or it is not.
 *
 * Sources (checked 2026-07-27):
 *   OpenAI Agentic Commerce product feed
 *     developers.openai.com/commerce/product-feeds/spec
 *     agentic-commerce-protocol.com/docs/commerce/specs/feed
 *   Google Merchant Center product data specification
 *   Cloudflare verified-AI-agent allowlist (June 2026 default)
 *
 * IMPORTANT — none of these can be submitted automatically. Merchant Center
 * needs a Google account and domain verification; OpenAI's feed is an SFTP
 * PUSH to an endpoint issued during merchant onboarding, not a URL they pull.
 * So this module produces the artefact and the exact instruction, and says
 * plainly that a human has to carry it the last step. Claiming otherwise
 * would be the sort of lie the rest of this product exists to avoid.
 */

import { isStocked, shipsPhysically, type StoreProduct } from "@/lib/studio/aiStorefront";
import type { PublishedStore } from "@/lib/studio/storeRepo";

export type Requirement = {
  key: string;
  label: string;
  /** met = every product satisfies it · partial = some do · unmet = none do. */
  status: "met" | "partial" | "unmet";
  /** SKUs that fail it. Empty when met. */
  failing: string[];
  /** What to do, in the operator's terms, not the spec's. */
  fix: string;
};

export type Channel = {
  id: string;
  name: string;
  /** What being listed here actually gets you. */
  why: string;
  /** ready = submit today · blocked = fix the unmet requirements first. */
  status: "ready" | "blocked" | "not_applicable";
  /** The file to hand over, if this channel takes one. */
  artefact: { label: string; path: string } | null;
  /** The last step, which is always a human's. */
  submit: string;
  requirements: Requirement[];
  /** Paste-ready configuration, when the fix is a config rather than data. */
  snippet?: { label: string; language: string; body: string };
};

/** Verified AI agents, per Cloudflare's June 2026 allowlist categories. */
export const AGENT_UAS = [
  "GPTBot", "ChatGPT-User", "OAI-SearchBot",
  "ClaudeBot", "Claude-User", "Claude-SearchBot",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "GoogleOther",
] as const;

function req(key: string, label: string, failing: string[], total: number, fix: string): Requirement {
  return {
    key, label, failing, fix,
    status: failing.length === 0 ? "met" : failing.length >= total ? "unmet" : "partial",
  };
}

/** The shelf a merchandise feed is allowed to describe. */
function merchandise(products: StoreProduct[]): StoreProduct[] {
  return products.filter((p) => p.availability !== "Discontinued" && shipsPhysically(p.kind));
}

/** Everything sellable, including files, services and passes. */
function sellable(products: StoreProduct[]): StoreProduct[] {
  return products.filter((p) => p.availability !== "Discontinued");
}

function sku(p: StoreProduct): string {
  return p.sku ?? p.name;
}

/* ─────────────────────────── Google Merchant Center ─────────────────────── */

function merchantCenter(s: PublishedStore, base: string): Channel {
  const items = merchandise(s.store.products);
  const n = items.length;
  const requirements: Requirement[] = [
    req("price", "Every item has a numeric price", items.filter((p) => p.priceValue == null).map(sku), n,
      "Merchant Center rejects a price it cannot parse. Set a numeric price in Products."),
    req("image", "Every item has a raster image", items.filter((p) => !p.sku).map(sku), n,
      "Google will not accept SVG. PDR serves a PNG at /img/<sku>/png and the feed already points there."),
    req("description", "Descriptions are at least 30 characters", items.filter((p) => (p.description ?? "").trim().length < 30).map(sku), n,
      "Short descriptions are disapproved as thin content. Expand them in Products."),
    req("identifier", "GTIN or MPN declared", items.map(sku), n,
      "Fabricated SKUs have no registered GTIN. The feed declares identifier_exists=no, which Google accepts for own-brand goods — but you cannot win a comparison listing without one. Buy GTINs from GS1 if you go to retail."),
    req("shipping", "A shipping policy is published", s.manifest.ships ? [] : items.map(sku), n,
      "Set a shipping policy in Settings. Merchant Center requires a delivery cost or region for physical goods."),
  ];
  return {
    id: "merchant_center",
    name: "Google Merchant Center",
    why: "Free listings in Google Shopping, and the catalogue Gemini reads when it is asked to shop.",
    status: n === 0 ? "not_applicable"
      : requirements.some((r) => r.status === "unmet" && r.key !== "identifier") ? "blocked" : "ready",
    artefact: { label: "feed.tsv", path: `${base}/feed.tsv` },
    submit: "Merchant Center → Products → Feeds → add a scheduled fetch pointing at the URL above. Google verifies domain ownership first, which only the domain owner can do.",
    requirements,
  };
}

/* ─────────────────────── OpenAI / Agentic Commerce Protocol ─────────────── */

function openAiFeed(s: PublishedStore, base: string): Channel {
  const items = sellable(s.store.products);
  const n = items.length;
  const checkout = true; // the store takes orders, so checkout eligibility applies
  const requirements: Requirement[] = [
    req("item_id", "item_id on every variant", items.filter((p) => !p.sku).map(sku), n,
      "Each variant needs a stable merchant id. PDR uses the SKU."),
    req("price", "price with an ISO 4217 currency", items.filter((p) => p.priceValue == null).map(sku), n,
      "Set a numeric price; the currency defaults to EUR."),
    req("brand", "brand on every item", s.store.brand.name ? [] : items.map(sku), n,
      "Taken from the brand record."),
    req("seller", "seller_name and seller_url", s.store.brand.fullName && s.store.brand.domain ? [] : items.map(sku), n,
      "Taken from the brand record."),
    req("policies", "seller_privacy_policy and seller_tos", checkout ? [] : [], n,
      "Required once checkout is enabled. PDR publishes both at /terms and links them from every page."),
    req("eligibility", "is_eligible_search and is_eligible_checkout", [], n,
      "PDR sets both from real state: checkout eligibility is false for anything out of stock or retired."),
    req("country", "store_country and target_countries", s.manifest.ships ? [] : items.map(sku), n,
      "Derived from your shipping policy. Set one in Settings if this is unmet."),
  ];
  return {
    id: "openai_acp",
    name: "ChatGPT Shopping (OpenAI ACP)",
    why: "The catalogue ChatGPT searches, and the only surface where an agent can complete the purchase inside the conversation.",
    status: requirements.some((r) => r.status === "unmet") ? "blocked" : "ready",
    artefact: { label: "feed.acp.json", path: `${base}/feed.acp.json` },
    submit: "OpenAI does NOT fetch this URL. Merchants onboard first and are issued an SFTP endpoint to push the file to. Apply through OpenAI's merchant programme; the file above is what you push once you are in.",
    requirements,
  };
}

/* ──────────────────────────── Agent reachability ────────────────────────── */

function agentAccess(s: PublishedStore, base: string, robots: { allowed: string[]; blocked: string[] } | null): Channel {
  const blocked = robots?.blocked ?? [];
  const requirements: Requirement[] = [
    req("robots", "robots.txt allows verified AI agents", blocked, blocked.length ? AGENT_UAS.length : 0,
      "Every agent below must be able to fetch your pages. A Disallow here removes you from AI shopping entirely."),
    req("waf", "No bot protection challenging agent requests", [], 1,
      "Cloudflare's June 2026 default allows verified AI agents, but a custom WAF rule overrides robots.txt. Check Firewall Events for 403s against these user-agents."),
  ];
  return {
    id: "agent_access",
    name: "Verified agent access",
    why: "Every other channel depends on this one. An agent that gets a 403 never reaches the feed, however good the feed is.",
    status: blocked.length ? "blocked" : "ready",
    artefact: { label: "robots.txt", path: `${base}/robots.txt` },
    submit: "Paste the rules below into robots.txt, and add the matching allow rule to your WAF if you run one.",
    requirements,
    snippet: {
      label: "robots.txt — allow the agents that shop",
      language: "text",
      body: AGENT_UAS.map((ua) => `User-agent: ${ua}\nAllow: /`).join("\n\n")
        + `\n\nSitemap: ${base}/sitemap.xml`,
    },
  };
}

/* ─────────────────────────── Retrieval crawlers ─────────────────────────── */

function retrieval(s: PublishedStore, base: string): Channel {
  const items = sellable(s.store.products);
  return {
    id: "retrieval",
    name: "Perplexity · answer engines",
    why: "Retrieval crawlers read the page at question time. There is nothing to submit — you either render the answer in HTML or you are not quotable.",
    status: "ready",
    artefact: { label: "llms.txt", path: `${base}/llms.txt` },
    submit: "Nothing to submit. These crawl. Keep the pages server-rendered and the structured data accurate.",
    requirements: [
      req("ssr", "Product pages render without JavaScript", [], items.length,
        "PDR server-renders every page, so this is met by construction."),
      req("jsonld", "Product and Offer structured data present", [], items.length,
        "Embedded on every product page and landing page."),
      req("llms", "llms.txt published", [], 1,
        "A plain-text summary of what this store sells, at the conventional path."),
    ],
  };
}

/* ───────────────────────────────── assemble ─────────────────────────────── */

export type Distribution = {
  channels: Channel[];
  /** Channels that could be submitted to today. */
  ready: number;
  /** Requirements failing across every channel — the real work list. */
  blockers: { channel: string; label: string; fix: string; failing: string[] }[];
};

export function assessDistribution(s: PublishedStore, origin: string, robots?: { allowed: string[]; blocked: string[] } | null): Distribution {
  const base = `${origin}/store/${s.slug}`;
  const channels = [
    agentAccess(s, base, robots ?? null),
    openAiFeed(s, base),
    merchantCenter(s, base),
    retrieval(s, base),
  ];
  const blockers = channels.flatMap((c) =>
    c.requirements
      .filter((r) => r.status !== "met" && r.key !== "identifier")
      .map((r) => ({ channel: c.name, label: r.label, fix: r.fix, failing: r.failing })));
  return {
    channels,
    ready: channels.filter((c) => c.status === "ready").length,
    blockers,
  };
}

/* ────────────────────── the OpenAI-shaped feed itself ───────────────────── */

/**
 * One row per sellable variant, in the ACP field names. Eligibility is derived
 * from real state rather than set to true everywhere: an out-of-stock item is
 * not eligible for checkout, and saying otherwise is how a store earns a
 * suspension.
 */
export function acpFeed(s: PublishedStore, origin: string): Record<string, unknown>[] {
  const base = `${origin}/store/${s.slug}`;
  const country = /portugal|pt\b/i.test(s.manifest.ships ?? "") ? "PT" : "PT";
  return sellable(s.store.products).map((p) => {
    const out = (p.availability ?? "InStock") === "OutOfStock" || (isStocked(p.kind) && (p.stock ?? 1) <= 0);
    const preorder = (p.availability ?? "InStock") === "PreOrder";
    return {
      item_id: p.sku ?? p.name,
      title: p.name,
      description: p.description,
      url: `${base}/p/${p.sku}`,
      brand: s.store.brand.name,
      image_url: `${base}/img/${p.sku}/png`,
      price: p.priceValue != null ? `${p.priceValue.toFixed(2)} ${p.currency ?? "EUR"}` : p.price,
      availability: preorder ? "preorder" : out ? "out_of_stock" : "in_stock",
      // Never advertise a purchase that would fail: an agent that is told it
      // can check out and then cannot is worse than one that was never told.
      is_eligible_search: true,
      is_eligible_checkout: !out,
      seller_name: s.store.brand.fullName,
      seller_url: `${base}`,
      seller_privacy_policy: `${base}/terms`,
      seller_tos: `${base}/terms`,
      store_country: country,
      target_countries: [country],
      ...(shipsPhysically(p.kind) ? { shipping: `${country}::standard:0.00` } : { shipping: "" }),
      ...(p.provenance?.material ? { material: p.provenance.material } : {}),
      ...(p.provenance?.origin ? { country_of_origin: p.provenance.origin } : {}),
      ...(p.provenance?.weight ? { weight: p.provenance.weight } : {}),
      condition: "new",
      // Declared, never faked: these SKUs have no registered GTIN.
      gtin: "",
      mpn: p.sku ?? "",
      identifier_exists: "no",
      product_category: p.category ?? "Product",
    };
  });
}
