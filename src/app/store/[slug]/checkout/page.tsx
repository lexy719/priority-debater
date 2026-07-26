import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { priceWithUnit, shipsPhysically } from "@/lib/studio/aiStorefront";
import { loadStore } from "@/lib/studio/storeRepo";
import { MONO, StoreFooter, StoreHeader, mkTheme } from "../store-ui";

/**
 * /store/[slug]/checkout?sku= — guest checkout as a PURE HTML FORM.
 * Works with JavaScript off (the agent-compatible pattern: agents hand off to
 * a merchant checkout they can parse and fill). No payment fields — orders
 * are received, not charged.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ sku?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await loadStore(slug);
  return { title: s ? `Checkout · ${s.store.brand.fullName}` : "Checkout" };
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sku } = await searchParams;
  const s = await loadStore(slug);
  if (!s) notFound();
  const { b, hair, sub, label } = mkTheme(s);
  // Never open a checkout on a retired product — fall back to the live shelf.
  const live = s.store.products.filter((x) => x.availability !== "Discontinued");
  const asked = s.store.products.find((x) => x.sku === sku);
  const p = (asked && asked.availability !== "Discontinued" ? asked : live[0]) ?? s.store.products[0];
  const redirected = asked != null && asked !== p;
  const ships = shipsPhysically(p.kind);

  const field: React.CSSProperties = { display: "block", width: "100%", border: `1px solid ${hair}`, background: b.bg, color: b.ink, fontFamily: MONO, fontSize: 13, padding: "10px 12px", marginTop: 6 };

  return (
    <main style={{ backgroundColor: b.bg, color: b.ink, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px 56px" }}>
        <StoreHeader s={s} active="checkout" />
        <section style={{ padding: "26px 0", display: "grid", gap: 32, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          <div>
            <div style={label}>ORDER · GUEST CHECKOUT</div>
            <h1 style={{ margin: "10px 0 0", fontSize: "clamp(1.5rem,3.5vw,2.2rem)", fontWeight: 800, lineHeight: 1.05 }}>Complete your order</h1>
            {redirected && (
              <p style={{ marginTop: 10, fontFamily: MONO, fontSize: 11.5, lineHeight: 1.7, color: sub, border: `1px solid ${hair}`, padding: "10px 12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {asked?.name} IS DISCONTINUED · SHOWING {p.name} INSTEAD
              </p>
            )}
            <p style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.6, color: sub }}>
              No account needed. No payment is taken on this form — the order is received and confirmed with an order id.{" "}
              {ships
                ? <>Shipping: {s.manifest.ships ?? "EU · 3–5 business days"}. Returns: {s.manifest.returns ?? "30 days, unopened"}.</>
                : <>Nothing ships: this is {p.kind === "service" ? "work booked" : p.kind === "access" ? "access granted" : "a file delivered"} against the email you give here.</>}
            </p>
            <form method="POST" action={`/api/store/${s.slug}/order`} style={{ marginTop: 18 }}>
              <input type="hidden" name="sku" value={p.sku} />
              <label style={{ ...label, letterSpacing: "0.14em" }}>FULL NAME
                <input name="name" required autoComplete="name" placeholder="Ada Lovelace" style={field} />
              </label>
              <label style={{ ...label, letterSpacing: "0.14em", display: "block", marginTop: 14 }}>EMAIL
                <input name="email" type="email" required autoComplete="email" placeholder="ada@example.com" style={field} />
              </label>
              {ships && (
                <label style={{ ...label, letterSpacing: "0.14em", display: "block", marginTop: 14 }}>SHIPPING ADDRESS
                  <input name="address" required autoComplete="street-address" placeholder="1 Analytical St, London" style={field} />
                </label>
              )}
              <label style={{ ...label, letterSpacing: "0.14em", display: "block", marginTop: 14 }}>
                {p.unit && p.unit !== "item" ? `HOW MANY ${p.unit.replace("1k-words", "1,000-word blocks").toUpperCase()}` : "QUANTITY"}
                <input name="qty" type="number" min={1} max={99} defaultValue={1} style={{ ...field, width: 110 }} />
              </label>
              <button type="submit" style={{ marginTop: 20, fontFamily: MONO, backgroundColor: b.accent, color: b.onAccent, border: "none", fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.14em", padding: "13px 26px", cursor: "pointer" }}>
                PLACE ORDER · {priceWithUnit(p.price, p.unit)}
              </button>
              <p style={{ ...label, letterSpacing: "0.12em", marginTop: 12 }}>
                BY ORDERING YOU ACCEPT THE <Link href={`/store/${s.slug}/terms`} style={{ color: b.accent }}>TERMS</Link> · AGENTS MAY POST JSON TO /api/store/{s.slug}/order
              </p>
            </form>
          </div>
          <div>
            <div style={label}>YOU ARE ORDERING</div>
            {/* eslint-disable-next-line @next/next/no-img-element -- deterministic SVG art route */}
            <img src={`/store/${s.slug}/img/${p.sku}.svg`} alt={p.name} width={480} height={360} style={{ width: "100%", height: "auto", border: `1px solid ${hair}`, marginTop: 10 }} />
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 17, fontWeight: 800 }}>{p.name}</span>
              <span style={{ fontFamily: MONO, fontWeight: 800, fontSize: 15 }}>{p.price}</span>
            </div>
            <p style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: sub }}>{p.description}</p>
            <div style={{ fontFamily: MONO, fontSize: 10.5, color: sub, marginTop: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              SKU {p.sku} · {p.availability ?? "InStock"}{p.kind && p.kind !== "good" ? ` · ${p.kind}` : ""}{p.unit && p.unit !== "item" ? ` · per ${p.unit}` : ""} · <Link href={`/store/${s.slug}/p/${p.sku}`} style={{ color: b.accent }}>full spec →</Link>
            </div>
          </div>
        </section>
        <StoreFooter s={s} />
      </div>
    </main>
  );
}
