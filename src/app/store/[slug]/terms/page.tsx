import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadStore } from "@/lib/studio/storeRepo";
import { MONO, StoreFooter, StoreHeader, mkTheme } from "../store-ui";

/** /store/[slug]/terms — terms of service, numbered and factual. */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await loadStore(slug);
  return { title: s ? `Terms · ${s.store.brand.fullName}` : "Terms" };
}

export default async function TermsPage({ params }: Props) {
  const { slug } = await params;
  const s = await loadStore(slug);
  if (!s) notFound();
  const { b, hair, sub, label } = mkTheme(s);
  const ships = s.manifest.ships ?? "EU · 3–5 business days";
  const returns = s.manifest.returns ?? "30 days, unopened";

  const terms: [string, string][] = [
    ["1 · OPERATOR", `${b.fullName} ("${b.name}"), reachable at orders@${b.domain}, operates this store and is the merchant of record for every order.`],
    ["2 · ORDERS", `Placing an order — via the checkout form or the structured endpoint (POST /api/store/${s.slug}/order) — is an offer to purchase. The contract forms when we confirm the order by email with an order id.`],
    ["3 · PRICES", "All prices are in EUR and include applicable VAT. The price shown at the moment of ordering is the price that applies. Structured price data (JSON-LD, product feed) mirrors displayed prices."],
    ["4 · PAYMENT", "No payment is collected at order time. Payment instructions accompany the order confirmation. Orders unpaid after 14 days are cancelled automatically."],
    ["5 · SHIPPING", `${ships}. Risk passes to you on delivery. Delays are communicated to your order email.`],
    ["6 · RETURNS & WITHDRAWAL", `${returns}. EU consumers additionally hold the statutory 14-day right of withdrawal. Refunds go to the original payment method within 5 business days of the return arriving.`],
    ["7 · SUBSCRIPTIONS", "Recurring SKUs renew on their stated cadence and can be cancelled any time effective the next cycle, by email with the order id."],
    ["8 · AI AGENTS", "Orders placed by AI agents on behalf of a person are accepted on the same terms; the person the agent acts for is the customer. Structured endpoints exist for this purpose and carry identical prices and policies."],
    ["9 · LIABILITY", "Liability is limited to the order value, except where law says otherwise. Statutory warranty rights are unaffected."],
    ["10 · LAW", "EU consumer law applies. Disputes go first to orders@" + b.domain + " — most things resolve in one email."],
  ];

  return (
    <main style={{ backgroundColor: b.bg, color: b.ink, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px 56px" }}>
        <StoreHeader s={s} active="terms" />
        <section style={{ padding: "26px 0" }}>
          <div style={label}>TERMS OF SERVICE · REV A</div>
          <h1 style={{ margin: "10px 0 0", fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 800 }}>Terms, without the fog.</h1>
          <div style={{ marginTop: 20, maxWidth: 680 }}>
            {terms.map(([k, v]) => (
              <div key={k} style={{ borderBottom: `1px solid ${hair}`, padding: "13px 0" }}>
                <div style={{ ...label, letterSpacing: "0.14em", color: b.accent }}>{k}</div>
                <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.65, color: b.ink }}>{v}</p>
              </div>
            ))}
          </div>
          <p style={{ ...label, letterSpacing: "0.12em", marginTop: 18, color: sub }}>
            PLAIN-LANGUAGE BY DESIGN — PARSEABLE BY HUMANS AND AGENTS ALIKE · {MONO ? "" : ""}
          </p>
        </section>
        <StoreFooter s={s} />
      </div>
    </main>
  );
}
