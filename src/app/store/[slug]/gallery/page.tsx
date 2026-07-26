import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadStore } from "@/lib/studio/storeRepo";
import { MONO, StoreFooter, StoreHeader, mkTheme } from "../store-ui";

/** /store/[slug]/gallery — every SKU's art, one grid. Server-rendered. */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await loadStore(slug);
  return { title: s ? `Gallery · ${s.store.brand.fullName}` : "Gallery" };
}

export default async function GalleryPage({ params }: Props) {
  const { slug } = await params;
  const s = await loadStore(slug);
  if (!s) notFound();
  const { b, hair, sub, label } = mkTheme(s);

  return (
    <main style={{ backgroundColor: b.bg, color: b.ink, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1020, margin: "0 auto", padding: "0 20px 56px" }}>
        <StoreHeader s={s} active="gallery" />
        <section style={{ padding: "24px 0" }}>
          <div style={label}>GALLERY · {String(s.store.products.length).padStart(2, "0")} SKUS</div>
          <p style={{ marginTop: 8, maxWidth: "64ch", fontSize: 13, lineHeight: 1.6, color: sub }}>
            Studio art per SKU — deterministic brand-palette compositions. Photoreal renders slot in per product without changing a single URL.
          </p>
          <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", marginTop: 18 }}>
            {s.store.products.map((p) => (
              <Link key={p.sku} href={`/store/${s.slug}/p/${p.sku}`} style={{ textDecoration: "none", color: b.ink }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- deterministic SVG art route */}
                <img src={`/store/${s.slug}/img/${p.sku}.svg`} alt={p.name} width={480} height={360} style={{ width: "100%", height: "auto", border: `1px solid ${hair}`, display: "block" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 8 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 800 }}>{p.name}</span>
                  <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800 }}>{p.price}</span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.12em", color: sub, marginTop: 3 }}>{p.sku} · {p.category}</div>
              </Link>
            ))}
          </div>
        </section>
        <StoreFooter s={s} />
      </div>
    </main>
  );
}
