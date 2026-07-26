import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildJsonLd } from "@/lib/studio/aiStorefront";
import { recordHit } from "@/lib/studio/hitRepo";
import { loadStore } from "@/lib/studio/storeRepo";
import { MONO, StoreFooter, StoreHeader, mkTheme } from "./store-ui";

/**
 * /store/[slug] — the published agent-first storefront, SERVER-RENDERED.
 *
 * Complete HTML + JSON-LD (with shipping + return policies — the fields agents
 * filter on), parseable with JavaScript off. Part of a complete site:
 * catalog · product pages · gallery · about · shipping · terms · checkout.
 */

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const s = await loadStore(slug);
  if (!s) return { title: "Store not found" };
  return {
    title: `${s.store.brand.fullName} — ${s.store.brand.oneLiner}`,
    description: s.store.brand.oneLiner,
    alternates: { canonical: `https://${s.store.brand.domain}` },
  };
}

export default async function PublishedStorePage({ params }: Params) {
  const { slug } = await params;
  const s = await loadStore(slug);
  if (!s) notFound();
  await recordHit(slug, "store", `/store/${slug}`, (await headers()).get("user-agent"));
  const { b, hair, sub, label } = mkTheme(s);
  // The shelf is what can be bought; retired SKUs are listed once, plainly,
  // so an agent that indexed them learns the truth instead of hitting a wall.
  const products = s.store.products.filter((p) => p.availability !== "Discontinued");
  const retired = s.store.products.filter((p) => p.availability === "Discontinued");
  const jsonLd = JSON.stringify(buildJsonLd({ ...s.store, products }, { imageBase: `/store/${s.slug}/img`, manifest: s.manifest }));

  return (
    <main style={{ backgroundColor: b.bg, color: b.ink, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      {/* What agents actually read — server-embedded structured data incl. policies. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div style={{ maxWidth: 1020, margin: "0 auto", padding: "0 20px 56px" }}>
        <StoreHeader s={s} active="" />

        <section style={{ borderBottom: `1px solid ${hair}`, padding: "22px 0" }}>
          <div style={label}>STORE MANIFEST</div>
          <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "8px 36px", margin: "12px 0 0", fontFamily: MONO, fontSize: 12.5 }}>
            {[
              ["OPERATOR", b.fullName],
              ["SELLS", b.positioning ?? b.oneLiner],
              ["FOR", b.audience ?? "—"],
              ["SHIPS", s.manifest.ships ?? "EU · 3–5 business days"],
              ["RETURNS", s.manifest.returns ?? "30 days, unopened"],
              ["CHECKOUT", "guest · no account · agents: JSON order-intent"],
              ["CURRENCY", "EUR"],
              ["CATALOG", `${products.length} SKUS · ALL PRICED`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 10 }}>
                <dt style={{ color: sub, minWidth: 82 }}>{k}</dt>
                <dd style={{ margin: 0 }}>{v}</dd>
              </div>
            ))}
          </dl>
          <p style={{ maxWidth: "68ch", marginTop: 14, fontSize: 14, lineHeight: 1.6, color: sub }}>{b.oneLiner}</p>
        </section>

        <section style={{ padding: "22px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={label}>CATALOG · {String(products.length).padStart(2, "0")} SKUS</div>
            <div style={{ ...label, letterSpacing: "0.14em" }}>SELECT A ROW FOR THE FULL SPEC</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
            <thead>
              <tr>
                {["", "PRODUCT", "CATEGORY", "PRICE", "AVAILABILITY", ""].map((h, i) => (
                  <th key={i} style={{ ...label, textAlign: i >= 3 && i < 5 ? "right" : "left", borderBottom: `1px solid ${hair}`, padding: "6px 8px 6px 0", letterSpacing: "0.14em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.sku}>
                  <td style={{ borderBottom: `1px solid ${hair}`, padding: "10px 12px 10px 0", width: 84, verticalAlign: "top" }}>
                    <Link href={`/store/${s.slug}/p/${p.sku}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- deterministic SVG art route */}
                      <img src={`/store/${s.slug}/img/${p.sku}.svg`} alt={p.name} width={80} height={60} style={{ display: "block", border: `1px solid ${hair}` }} />
                    </Link>
                  </td>
                  <td style={{ borderBottom: `1px solid ${hair}`, padding: "10px 8px 10px 0" }}>
                    <Link href={`/store/${s.slug}/p/${p.sku}`} style={{ color: b.ink, textDecoration: "none", fontWeight: 700, fontSize: 15 }}>{p.name}</Link>
                    <div style={{ fontSize: 12.5, color: sub, marginTop: 2 }}>{p.description}</div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: sub, marginTop: 3 }}>
                      {p.sku}{p.kind && p.kind !== "good" ? ` · ${p.kind.toUpperCase()} · NOTHING SHIPS` : ""}
                    </div>
                  </td>
                  <td style={{ fontFamily: MONO, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: sub, borderBottom: `1px solid ${hair}`, padding: "10px 8px 10px 0", verticalAlign: "top" }}>{p.category}</td>
                  <td style={{ fontFamily: MONO, fontWeight: 800, fontSize: 14, textAlign: "right", borderBottom: `1px solid ${hair}`, padding: "10px 0 10px 8px", verticalAlign: "top", whiteSpace: "nowrap" }}>
                    {p.price}
                    {p.unit && p.unit !== "item" && <div style={{ fontWeight: 400, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: sub, marginTop: 2 }}>PER {p.unit}</div>}
                  </td>
                  <td style={{ fontFamily: MONO, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", textAlign: "right", color: (p.availability ?? "InStock") === "PreOrder" ? sub : b.accent, borderBottom: `1px solid ${hair}`, padding: "10px 0 10px 8px", verticalAlign: "top" }}>{p.availability ?? "InStock"}</td>
                  <td style={{ textAlign: "right", borderBottom: `1px solid ${hair}`, padding: "10px 0 10px 12px", verticalAlign: "top", whiteSpace: "nowrap" }}>
                    <Link href={`/store/${s.slug}/checkout?sku=${p.sku}`} style={{ fontFamily: MONO, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", backgroundColor: b.accent, color: b.onAccent, padding: "7px 12px", textDecoration: "none" }}>ORDER</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {retired.length > 0 && (
            <p style={{ fontFamily: MONO, fontSize: 10.5, lineHeight: 1.9, color: sub, marginTop: 10, letterSpacing: "0.04em" }}>
              DISCONTINUED · NO LONGER SOLD ·{" "}
              {retired.map((p, i) => (
                <span key={p.sku}>
                  {i > 0 && " · "}
                  <Link href={`/store/${s.slug}/p/${p.sku}`} style={{ color: sub }}>{p.name}</Link>
                </span>
              ))}
            </p>
          )}
        </section>

        <section style={{ borderTop: `1px solid ${hair}`, padding: "16px 0" }}>
          <div style={label}>MACHINE LAYER · FOR AGENTS</div>
          <p style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.8, color: sub, marginTop: 8, maxWidth: "78ch" }}>
            SSR HTML + schema.org JSON-LD with shipping &amp; return policies on every page · product feed at /store/{s.slug}/feed.jsonl · order-intent: POST JSON {"{"}sku, qty, name, email, address{"}"} to /api/store/{s.slug}/order · guest checkout, no CAPTCHA, no account wall · sitemap at /store/{s.slug}/sitemap.xml
          </p>
        </section>

        <StoreFooter s={s} />
      </div>
    </main>
  );
}
