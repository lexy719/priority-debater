import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { offerPriceJsonLd, priceWithUnit, provenanceJsonLd, shipsPhysically } from "@/lib/studio/aiStorefront";
import { recordHit } from "@/lib/studio/hitRepo";
import { loadStore } from "@/lib/studio/storeRepo";
import { MONO, StoreFooter, StoreHeader, mkTheme } from "../../store-ui";

/**
 * /store/[slug]/p/[sku] — server-rendered product page. Full offer data with
 * shipping + return policy in its JSON-LD (the fields agents filter on), art,
 * and a straight line to guest checkout. No client JS.
 */

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string; sku: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, sku } = await params;
  const s = await loadStore(slug);
  const p = s?.store.products.find((x) => x.sku === sku);
  if (!s || !p) return { title: "Product not found" };
  return { title: `${p.name} · ${s.store.brand.fullName}`, description: p.description };
}

export default async function ProductPage({ params }: Params) {
  const { slug, sku } = await params;
  const s = await loadStore(slug);
  const p = s?.store.products.find((x) => x.sku === sku);
  if (!s || !p) notFound();
  await recordHit(slug, "product", `/store/${slug}/p/${sku}`, (await headers()).get("user-agent"));
  const { b, hair, sub, label } = mkTheme(s);
  const site = `https://${b.domain}`;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    // Service and access are not Products — the type tells an agent what kind
    // of transaction this is before it reads a single field.
    "@type": p.kind === "service" || p.kind === "access" ? "Service" : "Product",
    name: p.name,
    description: p.description,
    sku: p.sku,
    category: p.category,
    image: `/store/${s.slug}/img/${p.sku}.svg`,
    ...provenanceJsonLd(p.provenance),
    brand: { "@type": "Brand", name: b.name },
    offers: {
      "@type": "Offer",
      ...offerPriceJsonLd(p),
      availability: `https://schema.org/${p.availability ?? "InStock"}`,
      seller: { "@type": "Organization", name: b.fullName, url: `${site}`, additionalProperty: { "@type": "PropertyValue", name: "sellerRecord", value: `/store/${s.slug}/.well-known/seller-record.json` } },
      url: `${site}/products/${p.sku}`,
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "EU",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 30,
        returnFees: "https://schema.org/FreeReturn",
        description: s.manifest.returns ?? "30 days, unopened",
      },
      ...(shipsPhysically(p.kind) ? {
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingDestination: { "@type": "DefinedRegion", addressCountry: "EU" },
          description: s.manifest.ships ?? "EU · 3–5 business days",
        },
      } : {}),
    },
  });

  const pv = p.provenance;
  const rows: [string, string][] = [
    ["SKU", p.sku ?? "—"],
    ["CATEGORY", p.category ?? "—"],
    ["PRICE", priceWithUnit(p.price, p.unit)],
    ...(p.kind && p.kind !== "good" ? [["TYPE", p.kind === "service" ? "service — work booked, nothing shipped" : p.kind === "access" ? "access — a pass, nothing shipped" : "digital — delivered by email"] as [string, string]] : []),
    ["AVAILABILITY", p.availability ?? "InStock"],
    ["BRAND", b.name],
    // Provenance sits in the same spec table as price — checkable facts, in the
    // order an agent under a mandate asks for them.
    ...(pv?.material ? [["MATERIAL", pv.material] as [string, string]] : []),
    ...(pv?.origin ? [["MADE IN", pv.origin] as [string, string]] : []),
    ...(pv?.madeBy ? [["MADE BY", pv.madeBy === "human" ? "a person" : pv.madeBy === "machine" ? "machine" : "person + machine"] as [string, string]] : []),
    ...(pv?.dimensions ? [["DIMENSIONS", pv.dimensions] as [string, string]] : []),
    ...(pv?.weight ? [["WEIGHT", pv.weight] as [string, string]] : []),
    ...(pv?.leadTime ? [["LEAD TIME", pv.leadTime] as [string, string]] : []),
    ...(pv?.care ? [["CARE", pv.care] as [string, string]] : []),
    ...(pv?.warranty ? [["WARRANTY", pv.warranty] as [string, string]] : []),
    ...(shipsPhysically(p.kind)
      ? [["SHIPS", s.manifest.ships ?? "EU · 3–5 business days"] as [string, string]]
      : [["DELIVERY", p.kind === "service" ? "scheduled with you after the order" : "by email, no shipping"] as [string, string]]),
    ["RETURNS", s.manifest.returns ?? "30 days, unopened"],
  ];

  return (
    <main style={{ backgroundColor: b.bg, color: b.ink, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div style={{ maxWidth: 940, margin: "0 auto", padding: "0 20px 56px" }}>
        <StoreHeader s={s} active="" />
        <section style={{ padding: "26px 0", display: "grid", gap: 32, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element -- deterministic SVG art route */}
            <img src={`/store/${s.slug}/img/${p.sku}.svg`} alt={p.name} width={480} height={360} style={{ width: "100%", height: "auto", border: `1px solid ${hair}` }} />
            <div style={{ ...label, letterSpacing: "0.12em", marginTop: 8 }}>STUDIO ART · PHOTOREAL RENDER SLOTS IN WITHOUT CHANGING THIS URL</div>
          </div>
          <div>
            <div style={label}>PRODUCT · {p.sku}</div>
            <h1 style={{ margin: "8px 0 0", fontSize: "clamp(1.7rem,4vw,2.6rem)", fontWeight: 800, lineHeight: 1.03 }}>{p.name}</h1>
            <p style={{ marginTop: 10, fontSize: 14.5, lineHeight: 1.6, color: sub }}>{p.description}</p>
            <table style={{ borderCollapse: "collapse", marginTop: 16, width: "100%" }}>
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k}>
                    <th scope="row" style={{ ...label, textAlign: "left", letterSpacing: "0.14em", borderBottom: `1px solid ${hair}`, padding: "8px 20px 8px 0", width: 120 }}>{k}</th>
                    <td style={{ fontFamily: MONO, fontSize: 12.5, borderBottom: `1px solid ${hair}`, padding: "8px 0" }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* A retired product keeps its page — the answer changes, not the URL. */}
            {p.availability === "Discontinued" ? (
              <div style={{ marginTop: 20, border: `1px solid ${hair}`, padding: "14px 16px" }}>
                <div style={{ ...label, letterSpacing: "0.12em" }}>NO LONGER SOLD</div>
                <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.6, color: sub }}>
                  {p.name} has been discontinued and cannot be ordered. This page stays online so anyone — person or agent — holding the link
                  gets a straight answer. <Link href={`/store/${s.slug}`} style={{ color: b.accent }}>See what is available →</Link>
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, marginTop: 20 }}>
                <Link href={`/store/${s.slug}/checkout?sku=${p.sku}`} style={{ fontFamily: MONO, backgroundColor: b.accent, color: b.onAccent, fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.13em", padding: "13px 24px", textDecoration: "none" }}>
                  ORDER · {p.price}
                </Link>
                <span style={{ ...label, letterSpacing: "0.12em" }}>GUEST CHECKOUT · NO ACCOUNT · AGENTS: POST /api/store/{s.slug}/order</span>
              </div>
            )}
          </div>
        </section>

        <section style={{ borderTop: `1px solid ${hair}`, padding: "16px 0" }}>
          <div style={label}>OTHER SKUS</div>
          <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, maxWidth: 560 }}>
            {s.store.products.filter((x) => x.sku !== p.sku).map((x) => (
              <li key={x.sku} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderBottom: `1px solid ${hair}`, padding: "8px 0" }}>
                <Link href={`/store/${s.slug}/p/${x.sku}`} style={{ color: b.ink, textDecoration: "none", fontWeight: 700, fontSize: 13.5 }}>{x.name}</Link>
                <span style={{ fontFamily: MONO, fontSize: 12, color: sub }}>{x.price}</span>
              </li>
            ))}
          </ul>
        </section>
        <StoreFooter s={s} />
      </div>
    </main>
  );
}
