import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadStore } from "@/lib/studio/storeRepo";
import { MONO, StoreFooter, StoreHeader, mkTheme } from "../store-ui";

/** /store/[slug]/about — operator information, stated plainly for humans and agents. */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await loadStore(slug);
  return { title: s ? `About · ${s.store.brand.fullName}` : "About" };
}

export default async function AboutPage({ params }: Props) {
  const { slug } = await params;
  const s = await loadStore(slug);
  if (!s) notFound();
  const { b, hair, sub, label } = mkTheme(s);
  const rows: [string, string][] = [
    ["OPERATOR", b.fullName],
    ["MARK", b.name],
    ["DOMAIN", b.domain],
    ["WHAT WE SELL", s.spec ?? b.positioning ?? b.oneLiner],
    ["FOR", b.audience ?? "—"],
    ["POSITIONING", b.positioning ?? "—"],
    ["CONTACT", `orders@${b.domain}`],
    ["CATALOG", `${s.store.products.length} SKUs · all priced · EUR`],
  ];

  return (
    <main style={{ backgroundColor: b.bg, color: b.ink, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px 56px" }}>
        <StoreHeader s={s} active="about" />
        <section style={{ padding: "26px 0" }}>
          <div style={label}>ABOUT · OPERATOR RECORD</div>
          <h1 style={{ margin: "10px 0 0", fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 800 }}>{b.fullName}</h1>
          <p style={{ marginTop: 12, maxWidth: "62ch", fontSize: 15, lineHeight: 1.65, color: sub }}>{b.oneLiner}</p>
          <table style={{ borderCollapse: "collapse", marginTop: 22, width: "100%", maxWidth: 620 }}>
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <th scope="row" style={{ ...label, textAlign: "left", letterSpacing: "0.14em", borderBottom: `1px solid ${hair}`, padding: "9px 24px 9px 0", width: 150 }}>{k}</th>
                  <td style={{ fontFamily: MONO, fontSize: 13, borderBottom: `1px solid ${hair}`, padding: "9px 0" }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ ...label, letterSpacing: "0.12em", marginTop: 18 }}>
            FOR AI AGENTS: THIS OPERATOR RECORD IS ALSO IN THE ORGANIZATION JSON-LD ON THE CATALOG PAGE AND IN /store/{s.slug}/agent-catalog.json
          </p>
        </section>
        <StoreFooter s={s} />
      </div>
    </main>
  );
}
