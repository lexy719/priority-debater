import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadStore } from "@/lib/studio/storeRepo";
import { MONO, StoreFooter, StoreHeader, mkTheme } from "../store-ui";

/**
 * /store/[slug]/shipping — shipping & returns policy. Agents parse policy
 * data before recommending a purchase; this page states it in plain rows and
 * the same facts ride in the Offer JSON-LD (shippingDetails / return policy).
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await loadStore(slug);
  return { title: s ? `Shipping & Returns · ${s.store.brand.fullName}` : "Shipping & Returns" };
}

export default async function ShippingPage({ params }: Props) {
  const { slug } = await params;
  const s = await loadStore(slug);
  if (!s) notFound();
  const { b, hair, sub, label } = mkTheme(s);
  const ships = s.manifest.ships ?? "EU · 3–5 business days";
  const returns = s.manifest.returns ?? "30 days, unopened";

  const sections: [string, [string, string][]][] = [
    ["SHIPPING", [
      ["REGION & TIME", ships],
      ["CARRIER HANDOFF", "Dispatch confirmation with tracking id by email"],
      ["COSTS", "Included in listed prices unless stated on the product page"],
      ["SUBSCRIPTIONS", "Recurring SKUs ship on their stated cadence"],
    ]],
    ["RETURNS", [
      ["WINDOW", returns],
      ["HOW", `Email orders@${b.domain} with your order id — no forms, no labels to hunt`],
      ["REFUND", "Full refund to the original method within 5 business days of receipt"],
      ["EXCLUSIONS", "Opened consumables and personalized items"],
    ]],
    ["ORDERS", [
      ["CHECKOUT", "Guest checkout, no account required"],
      ["AGENTS", `Structured order-intent: POST JSON to /api/store/${s.slug}/order`],
      ["PAYMENT", "No payment is taken at order time — orders are received, then confirmed"],
      ["CANCELLATION", "Free until dispatch, by email with the order id"],
    ]],
  ];

  return (
    <main style={{ backgroundColor: b.bg, color: b.ink, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px 56px" }}>
        <StoreHeader s={s} active="shipping" />
        <section style={{ padding: "26px 0" }}>
          <div style={label}>POLICY · SHIPPING & RETURNS</div>
          <h1 style={{ margin: "10px 0 0", fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 800 }}>Shipping & returns, stated plainly.</h1>
          {sections.map(([title, rows]) => (
            <div key={title} style={{ marginTop: 26 }}>
              <div style={{ ...label, color: b.accent }}>{title}</div>
              <table style={{ borderCollapse: "collapse", marginTop: 8, width: "100%", maxWidth: 640 }}>
                <tbody>
                  {rows.map(([k, v]) => (
                    <tr key={k}>
                      <th scope="row" style={{ ...label, textAlign: "left", letterSpacing: "0.14em", borderBottom: `1px solid ${hair}`, padding: "9px 24px 9px 0", width: 160, verticalAlign: "top" }}>{k}</th>
                      <td style={{ fontFamily: MONO, fontSize: 13, lineHeight: 1.55, borderBottom: `1px solid ${hair}`, padding: "9px 0", color: b.ink }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <p style={{ ...label, letterSpacing: "0.12em", marginTop: 20, color: sub }}>
            THESE FACTS ALSO RIDE IN THE PRODUCT JSON-LD — AGENTS DON&apos;T HAVE TO TRUST PROSE
          </p>
        </section>
        <StoreFooter s={s} />
      </div>
    </main>
  );
}
