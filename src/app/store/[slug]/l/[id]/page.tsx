import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { recordHit } from "@/lib/studio/hitRepo";
import { loadLanding, recordLandingView } from "@/lib/studio/landingRepo";
import { loadStore } from "@/lib/studio/storeRepo";
import { MONO, StoreFooter, StoreHeader, mkTheme } from "../../store-ui";

/**
 * /store/[slug]/l/[id] — a campaign landing page, SERVER-RENDERED.
 *
 * Written by the Marketing worker, served by the store: brand-styled, one
 * product, one offer, one CTA into guest checkout — and, like every other page
 * here, complete HTML plus Product/Offer JSON-LD so an agent following an ad
 * link reads the same truth a human does. Views are counted, never modelled.
 */

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string; id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, id } = await params;
  const [s, l] = await Promise.all([loadStore(slug), loadLanding(slug, id)]);
  if (!s || !l) return { title: "Page not found" };
  return { title: `${l.headline} · ${s.store.brand.fullName}`, description: l.subhead };
}

export default async function LandingPage({ params }: Params) {
  const { slug, id } = await params;
  const [s, l] = await Promise.all([loadStore(slug), loadLanding(slug, id)]);
  if (!s || !l) notFound();

  const ua = (await headers()).get("user-agent");
  await Promise.all([recordHit(slug, "store", `/store/${slug}/l/${id}`, ua), recordLandingView(slug, id)]);

  const { b, hair, sub, label } = mkTheme(s);
  const product = l.sku ? s.store.products.find((p) => p.sku === l.sku) : null;
  const site = `https://${b.domain}`;

  const jsonLd = product
    ? JSON.stringify({
        "@context": "https://schema.org", "@type": "Product",
        name: product.name, description: product.description, sku: product.sku,
        image: `/store/${slug}/img/${product.sku}.svg`,
        brand: { "@type": "Brand", name: b.name },
        offers: {
          "@type": "Offer",
          ...(product.priceValue != null ? { price: product.priceValue, priceCurrency: product.currency ?? "EUR" } : {}),
          availability: `https://schema.org/${product.availability ?? "InStock"}`,
          url: `${site}/products/${product.sku}`,
        },
      })
    : null;

  return (
    <main style={{ backgroundColor: b.bg, color: b.ink, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px 64px" }}>
        <StoreHeader s={s} active="" />

        <section style={{ padding: "56px 0 8px" }}>
          <div style={label}>{l.audience ? `FOR ${l.audience.toUpperCase()}` : "OFFER"}</div>
          <h1 style={{ margin: "14px 0 0", fontSize: "clamp(2rem,6vw,3.6rem)", fontWeight: 800, lineHeight: 1.02, textWrap: "balance" }}>{l.headline}</h1>
          <p style={{ marginTop: 18, maxWidth: "52ch", fontSize: 17, lineHeight: 1.6, color: sub }}>{l.subhead}</p>

          {l.bullets.length > 0 && (
            <ul style={{ listStyle: "none", margin: "26px 0 0", padding: 0, maxWidth: "56ch" }}>
              {l.bullets.map((x) => (
                <li key={x} style={{ display: "flex", gap: 10, alignItems: "baseline", borderTop: `1px solid ${hair}`, padding: "11px 0", fontSize: 14.5 }}>
                  <span style={{ color: b.accent, fontFamily: MONO }}>—</span>{x}
                </li>
              ))}
            </ul>
          )}

          {product && (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20, marginTop: 34 }}>
              <Link href={`/store/${slug}/checkout?sku=${product.sku}`}
                style={{ fontFamily: MONO, backgroundColor: b.accent, color: b.onAccent, fontWeight: 800, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.12em", padding: "16px 30px", textDecoration: "none" }}>
                {l.cta}
              </Link>
              <span style={{ ...label, letterSpacing: "0.12em" }}>
                {product.name} · {product.price} · {product.availability ?? "InStock"} · {s.manifest.ships ?? "EU · 3–5 business days"}
              </span>
            </div>
          )}
        </section>

        {product && (
          <section style={{ borderTop: `1px solid ${hair}`, padding: "22px 0" }}>
            <div style={label}>WHAT YOU GET</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 26, marginTop: 14, alignItems: "flex-start" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- deterministic SVG art route */}
              <img src={`/store/${slug}/img/${product.sku}.svg`} alt={product.name} width={320} height={240} style={{ width: 320, maxWidth: "100%", height: "auto", border: `1px solid ${hair}` }} />
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{product.name}</div>
                <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: sub }}>{product.description}</p>
                <div style={{ ...label, letterSpacing: "0.12em", marginTop: 12 }}>
                  RETURNS · {s.manifest.returns ?? "30 days, unopened"} · <Link href={`/store/${slug}/p/${product.sku}`} style={{ color: b.accent }}>FULL SPEC →</Link>
                </div>
              </div>
            </div>
          </section>
        )}

        <section style={{ borderTop: `1px solid ${hair}`, padding: "16px 0" }}>
          <span style={{ ...label, letterSpacing: "0.12em" }}>
            SERVER-RENDERED CAMPAIGN PAGE · JSON-LD EMBEDDED · READABLE BY HUMANS AND AI AGENTS ALIKE
          </span>
        </section>

        <StoreFooter s={s} />
      </div>
    </main>
  );
}
