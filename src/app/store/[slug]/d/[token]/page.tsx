import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadArtefact } from "@/lib/studio/artefactRepo";
import { claimDelivery, loadDelivery } from "@/lib/studio/deliveryRepo";
import { loadBusinessStore } from "@/lib/studio/businessSource";
import { MONO, StoreFooter, StoreHeader, mkTheme } from "../../store-ui";

/**
 * /store/[slug]/d/[token] — the delivery.
 *
 * For anything that does not need packing, this page IS the fulfilment: the
 * buyer (or the agent holding the link) lands here and has the thing. Opening
 * it is recorded, so "sent" and "received" stay different facts.
 *
 * When the seller has attached nothing yet, the page says exactly that instead
 * of pretending — a promise dated and on the record beats a broken link.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your delivery", robots: { index: false, follow: false } };

type Params = { params: Promise<{ slug: string; token: string }> };

export default async function DeliveryPage({ params }: Params) {
  const { slug, token } = await params;
  const [s, d0] = await Promise.all([loadBusinessStore(slug), loadDelivery(slug, token)]);
  if (!s || !d0) notFound();
  const d = (await claimDelivery(slug, token)) ?? d0;
  // When PDR produced the thing itself, the delivery IS the document.
  const doc = d.kind === "document" ? await loadArtefact(slug, d.sku) : null;
  const { b, hair, sub, label } = mkTheme(s);
  const isUrl = d.payload != null && /^https?:\/\//i.test(d.payload);

  return (
    <main style={{ backgroundColor: b.bg, color: b.ink, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 56px" }}>
        <StoreHeader s={s} active="" />
        <section style={{ padding: "30px 0" }}>
          <div style={label}>{d.kind === "pending" ? "DELIVERY PENDING" : "YOUR DELIVERY"}</div>
          <h1 style={{ margin: "10px 0 0", fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 800, lineHeight: 1.05 }}>
            {d.productName}
          </h1>
          <p style={{ marginTop: 10, maxWidth: "58ch", fontSize: 14, lineHeight: 1.6, color: sub }}>
            Order {d.orderId} · issued {d.issuedAt.slice(0, 16).replace("T", " ")} UTC
            {d.claims > 1 ? ` · opened ${d.claims} times` : ""}
          </p>

          {d.kind === "pending" && (
            <div style={{ marginTop: 22, border: `1px solid ${hair}`, padding: "16px 18px" }}>
              <div style={{ ...label, letterSpacing: "0.12em" }}>NOTHING ATTACHED YET</div>
              <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.6, color: sub }}>{d.note}</p>
            </div>
          )}

          {doc && (
            <div style={{ marginTop: 22 }}>
              <a href={`/store/${slug}/d/${token}/file`}
                style={{ fontFamily: MONO, backgroundColor: b.accent, color: b.onAccent, fontWeight: 800, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.12em", padding: "16px 30px", textDecoration: "none", display: "inline-block" }}>
                DOWNLOAD · {doc.words} WORDS
              </a>
              <div style={{ ...label, letterSpacing: "0.12em", marginTop: 10 }}>
                PRODUCED {doc.generatedAt.slice(0, 16).replace("T", " ")} UTC · READ IT BELOW OR KEEP THE FILE
              </div>
              <article style={{ marginTop: 24, borderTop: `1px solid ${hair}`, paddingTop: 20, fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-wrap", maxWidth: "70ch" }}>
                {doc.body}
              </article>
            </div>
          )}

          {d.kind === "file" && isUrl && (
            <div style={{ marginTop: 22 }}>
              <a href={d.payload!} style={{ fontFamily: MONO, backgroundColor: b.accent, color: b.onAccent, fontWeight: 800, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.12em", padding: "16px 30px", textDecoration: "none", display: "inline-block" }}>
                DOWNLOAD →
              </a>
              <div style={{ ...label, letterSpacing: "0.12em", marginTop: 10 }}>KEEP THIS PAGE — IT IS YOUR RECEIPT AND YOUR ACCESS</div>
            </div>
          )}

          {(d.kind === "licence" || d.kind === "booking") && d.payload && (
            <div style={{ marginTop: 22, border: `1px solid ${hair}`, padding: "16px 18px" }}>
              <div style={{ ...label, letterSpacing: "0.12em" }}>{d.kind === "licence" ? "YOUR LICENCE KEY" : "YOUR BOOKING"}</div>
              <div style={{ fontFamily: MONO, fontSize: d.kind === "licence" ? 20 : 14, marginTop: 8, wordBreak: "break-word", lineHeight: 1.6 }}>
                {d.payload}
              </div>
            </div>
          )}

          <table style={{ borderCollapse: "collapse", marginTop: 26, width: "100%", maxWidth: 520 }}>
            <tbody>
              {([["ORDER", d.orderId], ["ITEM", d.sku], ["ISSUED TO", d.buyerEmail], ["TYPE", d.kind.toUpperCase()]] as [string, string][]).map(([k, v]) => (
                <tr key={k}>
                  <th scope="row" style={{ ...label, textAlign: "left", letterSpacing: "0.14em", borderBottom: `1px solid ${hair}`, padding: "9px 24px 9px 0", width: 120 }}>{k}</th>
                  <td style={{ fontFamily: MONO, fontSize: 13, borderBottom: `1px solid ${hair}`, padding: "9px 0" }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ ...label, letterSpacing: "0.12em", marginTop: 20 }}>
            AGENTS · ORDER STATUS, CANCELLATION, RETURNS AND QUESTIONS ARE CALLABLE AT {`/store/${slug}/mcp`}
          </div>
          <Link href={`/store/${slug}/order/${d.orderId}`} style={{ display: "inline-block", marginTop: 16, fontFamily: MONO, fontSize: 12, color: b.accent }}>
            ← the order
          </Link>
        </section>
        <StoreFooter s={s} />
      </div>
    </main>
  );
}
