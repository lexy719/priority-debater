/**
 * AI-native storefront generator.
 *
 * The core of PD Studio's "website generation for AI shopping": from a Business
 * Brain it emits a storefront that is legible to BOTH humans AND AI shopping
 * agents. Where a typical generated site is a client-rendered SPA shell
 * (`<div id="root"></div>`, no content, no structured data — invisible to
 * agents), this bakes the content and machine-readable layer straight into the
 * HTML:
 *
 *  - real rendered content (an agent fetching the URL sees products, not a shell)
 *  - schema.org JSON-LD (Organization + Product + Offer) in the <head>
 *  - proper <title>, description, Open Graph
 *  - a companion agent catalog (product intelligence) + llms.txt
 *
 * Pure functions, no framework — so this can be fed by the demo Brain now, by a
 * real Business Brain generator later, or layered onto the Loam design engine's
 * output as the AI-native envelope.
 */

/**
 * Provenance — the attributes that survive a machine comparison.
 *
 * `madeBy` is deliberately first-class: once agents do the choosing, "made by a
 * person" stops being a story on an about page and becomes a filter value.
 */
export type ProductProvenance = {
  /** What it is made of, e.g. "stoneware clay, ash glaze". schema.org/material. */
  material?: string;
  /** Where it was made, e.g. "Portugal". schema.org/countryOfOrigin. */
  origin?: string;
  madeBy?: "human" | "machine" | "hybrid";
  /** How long before it ships, e.g. "made to order, 10 days". */
  leadTime?: string;
  /** Care or usage constraints agents get asked about ("dishwasher safe"). */
  care?: string;
  /** e.g. "2 years". schema.org/warranty. */
  warranty?: string;
  /** e.g. "1.2 kg". */
  weight?: string;
  /** e.g. "26 × 26 × 3 cm". */
  dimensions?: string;
};

export const PROVENANCE_FIELDS = ["material", "origin", "madeBy", "leadTime", "care", "warranty", "weight", "dimensions"] as const;

/**
 * What is being sold. The endpoint primitive has to be general: a business
 * operated by PDR may sell an object, a file, an hour of someone's attention or
 * a seat. The kind changes real behaviour — whether stock exists, whether
 * anything ships, which schema.org type the offer carries, and whether the item
 * belongs in a Google Merchant feed at all.
 */
export type SellableKind = "good" | "digital" | "service" | "access";
export const SELLABLE_KINDS = ["good", "digital", "service", "access"] as const;

/** What one unit of the price buys. Agents compare per-unit, not per-listing. */
export type PricingUnit = "item" | "hour" | "day" | "seat" | "month" | "year" | "1k-words" | "project";
export const PRICING_UNITS = ["item", "hour", "day", "seat", "month", "year", "1k-words", "project"] as const;

/** Only physical goods are counted, reserved and shipped. */
export function isStocked(kind?: SellableKind): boolean {
  return (kind ?? "good") === "good";
}
export function shipsPhysically(kind?: SellableKind): boolean {
  return (kind ?? "good") === "good";
}
/** UN/CEFACT codes, for the schema.org UnitPriceSpecification. */
const UNIT_CODE: Record<PricingUnit, string> = {
  item: "C62", hour: "HUR", day: "DAY", seat: "C62", month: "MON", year: "ANN", "1k-words": "C62", project: "C62",
};
export function unitCodeFor(u?: PricingUnit): string {
  return UNIT_CODE[u ?? "item"] ?? "C62";
}
/** "€90 per hour" — how a price reads once it is not per item. */
export function priceWithUnit(price: string, unit?: PricingUnit): string {
  return !unit || unit === "item" ? price : `${price} per ${unit.replace("1k-words", "1,000 words")}`;
}

export type StoreProduct = {
  name: string;
  description: string;
  /** Display price, e.g. "€18/mo" or "€42". */
  price: string;
  /** Numeric price for structured data, in `currency`. */
  priceValue?: number;
  currency?: string; // ISO 4217, default EUR
  sku?: string;
  category?: string;
  /** Schema.org ItemAvailability. Discontinued = retired from the shelf: the
      product page still resolves (agents cache links) but feeds drop it. */
  availability?: "InStock" | "OutOfStock" | "PreOrder" | "Discontinued";
  /** Units on hand — orders decrement it; 0 flips availability to OutOfStock.
      Managed by the Commerce Operations Agent. */
  stock?: number;
  /** The state a retired product came from, so restoring is exact (a pre-order
      goes back to being a pre-order, not to InStock). */
  retiredFrom?: "InStock" | "OutOfStock" | "PreOrder";
  /** Checkable facts about the thing itself. Agents buying under a mandate
      ("EU-made, under €100, machine washable") filter on exactly these, so they
      ride into JSON-LD, both feeds and the MCP tools — never marketing prose. */
  provenance?: ProductProvenance;
  /** What kind of thing this is. Absent = a physical good (every store built
      before this existed sells objects). */
  kind?: SellableKind;
  /** What one unit of the price buys. Absent = one item. */
  unit?: PricingUnit;
  /** Canonical product URL on the merchant's OWN domain, for a business PDR
      operates but does not host. Absent = PDR hosts the page. Feeds, JSON-LD
      and the MCP tools must send agents here, never to a copy of somebody
      else's shop. */
  url?: string;
};

export type StorefrontBrand = {
  name: string; // short mark, e.g. MERIDIAN
  fullName: string; // Meridian Coffee Collective
  domain: string; // meridian.coffee
  oneLiner: string;
  positioning?: string;
  audience?: string;
  /** Resolved theme colors. */
  ink: string;
  bg: string;
  surface: string;
  accent: string;
  onAccent: string;
};

export type StorefrontInput = {
  brand: StorefrontBrand;
  products: StoreProduct[];
};

/* ── helpers ───────────────────────────────────────────────────────────── */

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function httpsDomain(domain: string): string {
  const d = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return `https://${d}`;
}

/* ── schema.org JSON-LD (what AI shopping agents actually read) ─────────── */

export type JsonLdExtras = {
  /** Relative image base, e.g. `/store/slug/img` — appended as `${base}/${sku}.svg`. */
  imageBase?: string;
  manifest?: { ships?: string; returns?: string };
};

export function buildJsonLd(input: StorefrontInput, extras?: JsonLdExtras): Record<string, unknown> {
  const { brand, products } = input;
  const site = httpsDomain(brand.domain);
  // Policies agents actually filter on ("free returns", "arrives by Friday").
  const returnPolicy = {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "EU",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 30,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/FreeReturn",
    description: extras?.manifest?.returns ?? "30 days, unopened",
  };
  const shippingDetails = {
    "@type": "OfferShippingDetails",
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "EU" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 2, unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 5, unitCode: "DAY" },
    },
    description: extras?.manifest?.ships ?? "EU · 3–5 business days",
  };
  const org = {
    "@type": "Organization",
    "@id": `${site}/#org`,
    name: brand.fullName,
    alternateName: brand.name,
    url: site,
    slogan: brand.oneLiner,
    description: brand.positioning || brand.oneLiner,
    ...(brand.audience ? { audience: { "@type": "Audience", audienceType: brand.audience } } : {}),
  };
  const itemList = {
    "@type": "ItemList",
    name: `${brand.fullName} — catalog`,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        // A service is not a Product: agents (and Google) read the type to know
        // what kind of transaction this is.
        "@type": p.kind === "service" || p.kind === "access" ? "Service" : "Product",
        "@id": `${site}/products/${(p.sku || slug(p.name))}#product`,
        name: p.name,
        description: p.description,
        ...(p.category ? { category: p.category } : {}),
        ...(p.sku ? { sku: p.sku } : {}),
        ...(extras?.imageBase ? { image: `${extras.imageBase}/${p.sku || slug(p.name)}.svg` } : {}),
        ...provenanceJsonLd(p.provenance),
        brand: { "@type": "Brand", name: brand.name },
        offers: {
          "@type": "Offer",
          ...offerPriceJsonLd(p),
          availability: `https://schema.org/${p.availability || "InStock"}`,
          url: `${site}/products/${p.sku || slug(p.name)}`,
          hasMerchantReturnPolicy: returnPolicy,
          // Nothing ships for a file, an hour or a seat — claiming shipping
          // details on them would be a lie an agent could catch.
          ...(shipsPhysically(p.kind) ? { shippingDetails } : {}),
        },
      },
    })),
  };
  return { "@context": "https://schema.org", "@graph": [org, itemList] };
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "item";
}

/**
 * Price → schema.org. A per-item price is a plain `price`; anything sold by the
 * hour, seat or month becomes a UnitPriceSpecification, which is the only shape
 * that tells a comparing agent what the number actually buys.
 */
export function offerPriceJsonLd(p: StoreProduct): Record<string, unknown> {
  if (p.priceValue == null) return { priceSpecification: p.price };
  const currency = p.currency || "EUR";
  if (!p.unit || p.unit === "item") return { price: p.priceValue, priceCurrency: currency };
  return {
    price: p.priceValue,
    priceCurrency: currency,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: p.priceValue,
      priceCurrency: currency,
      unitCode: unitCodeFor(p.unit),
      unitText: p.unit,
      referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: unitCodeFor(p.unit), unitText: p.unit },
    },
  };
}

/**
 * Provenance → schema.org. Named properties where the vocabulary has them
 * (material, countryOfOrigin, weight, size), `additionalProperty` for the rest,
 * because a PropertyValue pair is the one shape every consumer already parses.
 */
export function provenanceJsonLd(pv?: ProductProvenance): Record<string, unknown> {
  if (!pv) return {};
  const extra: { "@type": "PropertyValue"; name: string; value: string }[] = [];
  const add = (name: string, value?: string) => { if (value) extra.push({ "@type": "PropertyValue", name, value }); };
  add("madeBy", pv.madeBy);
  add("leadTime", pv.leadTime);
  add("care", pv.care);
  add("dimensions", pv.dimensions);
  return {
    ...(pv.material ? { material: pv.material } : {}),
    ...(pv.origin ? { countryOfOrigin: { "@type": "Country", name: pv.origin } } : {}),
    ...(pv.weight ? { weight: { "@type": "QuantitativeValue", description: pv.weight } } : {}),
    ...(pv.dimensions ? { size: pv.dimensions } : {}),
    ...(pv.warranty ? { warranty: { "@type": "WarrantyPromise", durationOfWarranty: { "@type": "QuantitativeValue", description: pv.warranty } } } : {}),
    ...(extra.length ? { additionalProperty: extra } : {}),
  };
}

/** One-line human/agent summary, e.g. "stoneware · Portugal · human-made". */
export function provenanceLine(pv?: ProductProvenance): string {
  if (!pv) return "";
  return [pv.material, pv.origin, pv.madeBy ? `${pv.madeBy}-made` : "", pv.leadTime, pv.care, pv.warranty ? `${pv.warranty} warranty` : ""]
    .filter(Boolean).join(" · ");
}

/* ── the agent catalog: product intelligence a shopping agent can query ─── */

export function buildAgentCatalog(input: StorefrontInput): Record<string, unknown> {
  const { brand, products } = input;
  return {
    version: "1.0",
    generator: "PDR Studio",
    business: {
      name: brand.fullName,
      mark: brand.name,
      url: httpsDomain(brand.domain),
      positioning: brand.positioning || brand.oneLiner,
      audience: brand.audience,
      summary: brand.oneLiner,
    },
    capabilities: ["browse-catalog", "product-intelligence", "price-query", "availability-query", "provenance-query"],
    endpoints: {
      catalog: "/.well-known/agent-catalog.json",
      llms: "/llms.txt",
      sellerRecord: "/.well-known/seller-record.json",
    },
    products: products.map((p) => ({
      id: p.sku || slug(p.name),
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.price,
      priceValue: p.priceValue,
      currency: p.currency || "EUR",
      availability: p.availability || "InStock",
      kind: p.kind ?? "good",
      pricingUnit: p.unit ?? "item",
      ships: shipsPhysically(p.kind),
      // Filterable facts, not adjectives — the shape a mandate is matched against.
      ...(p.provenance ? { provenance: p.provenance } : {}),
      forAudience: brand.audience,
    })),
  };
}

/* ── llms.txt: the plain-text brief agents/crawlers look for ────────────── */

export function buildLlmsTxt(input: StorefrontInput): string {
  const { brand, products } = input;
  const lines = [
    `# ${brand.fullName}`,
    "",
    `> ${brand.oneLiner}`,
    "",
    brand.positioning ? `Positioning: ${brand.positioning}` : "",
    brand.audience ? `For: ${brand.audience}` : "",
    "",
    "## Products",
    ...products.map((p) => {
      const pv = provenanceLine(p.provenance);
      const kind = (p.kind ?? "good") === "good" ? "" : ` [${p.kind}]`;
      return `- [${p.name}](${httpsDomain(brand.domain)}/products/${p.sku || slug(p.name)}): ${p.description} — ${priceWithUnit(p.price, p.unit)} (${p.availability || "InStock"})${kind}${pv ? ` — ${pv}` : ""}`;
    }),
    "",
    "## For AI agents",
    `- Structured catalog: ${httpsDomain(brand.domain)}/.well-known/agent-catalog.json`,
    `- Schema.org JSON-LD is embedded in every page.`,
  ];
  return lines.filter((l) => l !== "").join("\n") + "\n";
}

/* ── the human-facing storefront — content rendered in HTML, JSON-LD baked in ── */

export function buildStorefrontHtml(input: StorefrontInput): string {
  const { brand, products } = input;
  const jsonLd = JSON.stringify(buildJsonLd(input));
  const site = httpsDomain(brand.domain);

  const productCards = products
    .map(
      (p) => `
      <article class="card" itemscope itemtype="https://schema.org/Product">
        <div class="card-top">
          <span class="cat" itemprop="category">${esc(p.category || "Product")}</span>
          <span class="price" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <span itemprop="price">${esc(p.price)}</span>
          </span>
        </div>
        <h3 itemprop="name">${esc(p.name)}</h3>
        <p itemprop="description">${esc(p.description)}</p>
        <div class="avail">${esc(p.availability || "InStock")}</div>
      </article>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(brand.fullName)} — ${esc(brand.oneLiner)}</title>
  <meta name="description" content="${esc(brand.oneLiner)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${esc(brand.fullName)}" />
  <meta property="og:title" content="${esc(brand.fullName)}" />
  <meta property="og:description" content="${esc(brand.oneLiner)}" />
  <meta property="og:url" content="${esc(site)}" />
  <link rel="canonical" href="${esc(site)}" />
  <script type="application/ld+json">${jsonLd}</script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; border-radius:0; }
    body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background:${brand.bg}; color:${brand.ink}; }
    .wrap { max-width: 980px; margin: 0 auto; padding: 0 24px; }
    header { display:flex; align-items:center; justify-content:space-between; padding:20px 0; border-bottom:1px solid ${brand.ink}22; }
    .mark { font-weight:800; letter-spacing:0.02em; font-size:20px; text-transform:uppercase; }
    nav a { color:${brand.ink}99; text-decoration:none; font-size:12px; text-transform:uppercase; letter-spacing:0.14em; margin-left:20px; }
    .hero { padding:88px 0 64px; }
    .hero h1 { font-size:clamp(2.2rem,6vw,4.2rem); line-height:0.98; text-transform:uppercase; letter-spacing:-0.02em; max-width:16ch; }
    .hero p { margin-top:20px; max-width:52ch; font-size:18px; line-height:1.6; color:${brand.ink}b0; }
    .cta { display:inline-block; margin-top:28px; background:${brand.accent}; color:${brand.onAccent}; padding:14px 26px; text-decoration:none; font-weight:700; font-size:13px; text-transform:uppercase; letter-spacing:0.16em; }
    .catalog { padding:24px 0 96px; }
    .catalog h2 { font-size:12px; text-transform:uppercase; letter-spacing:0.24em; color:${brand.ink}80; margin-bottom:20px; }
    .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; }
    .card { background:${brand.surface}; border:1px solid ${brand.ink}18; padding:20px; }
    .card-top { display:flex; justify-content:space-between; align-items:center; }
    .cat { font-size:10px; text-transform:uppercase; letter-spacing:0.14em; color:${brand.ink}80; }
    .price { font-weight:800; }
    .card h3 { margin-top:12px; font-size:18px; }
    .card p { margin-top:8px; font-size:14px; line-height:1.5; color:${brand.ink}a0; }
    .avail { margin-top:14px; font-size:10px; text-transform:uppercase; letter-spacing:0.14em; color:${brand.accent}; }
    footer { border-top:1px solid ${brand.ink}22; padding:28px 0; font-size:12px; color:${brand.ink}80; display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <span class="mark">${esc(brand.name)}</span>
      <nav><a href="#catalog">Catalog</a><a href="/llms.txt">For agents</a></nav>
    </header>
    <section class="hero">
      <h1>${esc(brand.oneLiner)}</h1>
      <p>${esc(brand.positioning || brand.fullName)}${brand.audience ? ` Built for ${esc(brand.audience.toLowerCase())}.` : ""}</p>
      <a class="cta" href="#catalog">Shop the catalog</a>
    </section>
    <section class="catalog" id="catalog">
      <h2>Catalog · ${products.length} products</h2>
      <div class="grid">${productCards}</div>
    </section>
    <footer>
      <span>${esc(brand.fullName)}</span>
      <span>Machine-readable · JSON-LD + /.well-known/agent-catalog.json</span>
    </footer>
  </div>
</body>
</html>`;
}
