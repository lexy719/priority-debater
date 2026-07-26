import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { shipsPhysically } from "@/lib/studio/aiStorefront";
import { loadOrder } from "@/lib/studio/orderRepo";
import { loadStore } from "@/lib/studio/storeRepo";
import { MONO, StoreFooter, StoreHeader, mkTheme } from "../../store-ui";

/** /store/[slug]/order/[id] — order confirmation as a spec sheet. */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${id}` };
}

export default async function OrderPage({ params }: Props) {
  const { slug, id } = await params;
  const s = await loadStore(slug);
  const o = await loadOrder(slug, id);
  if (!s || !o) notFound();
  const { b, hair, sub, label } = mkTheme(s);

  // What was bought decides what this sheet may claim: a booked hour has no
  // shipping line, and its quantity is hours, not pieces.
  const p = s.store.products.find((x) => x.sku === o.sku);
  const ships = shipsPhysically(p?.kind);
  const unit = p?.unit && p.unit !== "item" ? p.unit : null;
  const rows: [string, string][] = [
    ["ORDER", o.id],
    ["STATUS", "RECEIVED · CONFIRMATION SENT"],
    ["PLACED", o.ts.replace("T", " ").slice(0, 19) + " UTC"],
    ["ITEM", unit ? `${o.productName} — ${o.qty} × ${unit}` : `${o.productName} × ${o.qty}`],
    ["SKU", o.sku],
    ["PRICE", unit ? `${o.price} per ${unit}` : o.price],
    ...(o.total != null ? [["TOTAL", `€${o.total}`] as [string, string]] : []),
    ...(ships
      ? [
          ["SHIP TO", o.buyer.address] as [string, string],
          ["SHIPPING", s.manifest.ships ?? "EU · 3–5 business days"] as [string, string],
        ]
      : [
          ["DELIVERY", p?.kind === "service" ? `scheduling confirmed by email to ${o.buyer.email}` : `by email to ${o.buyer.email} — nothing ships`] as [string, string],
        ]),
    ["RETURNS", s.manifest.returns ?? "30 days, unopened"],
    ["CHANNEL", o.channel === "agent-json" ? `AGENT (${o.agent})` : "WEB CHECKOUT"],
  ];

  return (
    <main style={{ backgroundColor: b.bg, color: b.ink, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px 56px" }}>
        <StoreHeader s={s} active="" />
        <section style={{ padding: "28px 0" }}>
          <div style={label}>ORDER CONFIRMATION</div>
          <h1 style={{ margin: "10px 0 0", fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 800 }}>Order received.</h1>
          <p style={{ marginTop: 10, maxWidth: "58ch", fontSize: 14, lineHeight: 1.6, color: sub }}>
            {b.fullName} has your order. A confirmation goes to {o.buyer.email}. No payment was taken — this store runs order-intent checkout; payment rails arrive with UCP/ACP.
          </p>
          <table style={{ borderCollapse: "collapse", marginTop: 22, width: "100%", maxWidth: 560 }}>
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <th scope="row" style={{ ...label, textAlign: "left", letterSpacing: "0.14em", borderBottom: `1px solid ${hair}`, padding: "9px 24px 9px 0", width: 120 }}>{k}</th>
                  <td style={{ fontFamily: MONO, fontSize: 13, borderBottom: `1px solid ${hair}`, padding: "9px 0" }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link href={`/store/${s.slug}`} style={{ display: "inline-block", marginTop: 24, fontFamily: MONO, backgroundColor: b.accent, color: b.onAccent, fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em", padding: "12px 22px", textDecoration: "none" }}>
            ← BACK TO CATALOG
          </Link>
        </section>
        <StoreFooter s={s} />
      </div>
    </main>
  );
}
