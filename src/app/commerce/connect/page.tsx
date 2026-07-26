"use client";

/**
 * CONNECT A STORE PDR DOES NOT HOST — `/commerce/connect`
 *
 * The door for a merchant who already sells somewhere else. One form, one call,
 * and their real catalogue is under management: the workers read it, the agent
 * layer publishes for it, the statement counts it.
 *
 * Design LOCKED: docs/pdr-commerce-design.md v3 — Swiss Editorial Ledger.
 * The copy states the limits as plainly as the capabilities: a connection is
 * READ-ONLY until the merchant grants write access, and PDR publishes an agent
 * layer for their shop rather than a copy of it.
 *
 * The previous OAuth/import implementation lives unrouted in
 * `_legacy-import.tsx` — its Shopify OAuth dance is what the write-scope flow
 * will reuse.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Action, AuditLine, DIMB, FAINTB, FAULTB, HAIRB, Heads, INKB, INSETB,
  LIVE, MICRO, MONO, Num, OKB, PAPER, Pick, Row, SANS, Section, Stamp, Thin, WARNB,
} from "../command/ledger-ui";

type Connected = {
  slug: string; platform: string; domain: string; siteUrl: string; name: string;
  products: number; lastSyncedAt: string | null;
  scopes: { read: boolean; write: boolean }; syncNote: string | null;
};

const PLATFORMS = [
  {
    id: "shopify", label: "Shopify",
    needs: "Admin API access token",
    domainLabel: "myshop.myshopify.com",
    help: "In Shopify: Settings → Apps and sales channels → Develop apps → Create an app → Configure Admin API scopes → tick read_products (and read_orders, so agent-attributed sales can be counted) → Install app → reveal the Admin API access token. It starts with shpat_.",
  },
  {
    id: "woo", label: "WooCommerce",
    needs: "consumer key : consumer secret",
    domainLabel: "yourstore.com",
    help: "In WooCommerce: Settings → Advanced → REST API → Add key, permission Read. Paste the pair as key:secret.",
  },
  {
    id: "generic", label: "Any other store",
    needs: "nothing",
    domainLabel: "yourstore.com or a feed URL",
    help: "No credentials. PDR reads a product feed, or crawls the sitemap when there is none. Prices only arrive if the site exposes them in a machine-readable way — the sync says plainly when it could not read them.",
  },
] as const;

export default function ConnectPage() {
  const [platform, setPlatform] = useState<string>("shopify");
  const [domain, setDomain] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [list, setList] = useState<Connected[] | null>(null);
  const [result, setResult] = useState<{ products?: number; orders?: number; agentLayer?: Record<string, string> } | null>(null);

  const pull = useCallback(() => {
    fetch("/api/commerce/connect/sync").then((r) => r.json())
      .then((d) => { if (d?.ok) setList(d.connected); }).catch(() => {});
  }, []);
  useEffect(() => { pull(); }, [pull]);

  const spec = PLATFORMS.find((p) => p.id === platform)!;

  const connect = async () => {
    setBusy("connect"); setNotice(null); setResult(null);
    try {
      const r = await fetch("/api/commerce/connect/sync", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          platform, domain: domain.trim(),
          name: name.trim() || undefined,
          siteUrl: siteUrl.trim() || undefined,
          accessToken: token.trim() || undefined,
        }),
      });
      const d = await r.json();
      if (!d?.ok) { setNotice(String(d?.error ?? "connection failed")); return; }
      setResult(d);
      setNotice(`${d.products} product(s) under management${d.orders ? ` · ${d.orders} order(s)` : ""}`);
      setDomain(""); setToken(""); setName(""); setSiteUrl("");
      pull();
    } catch (e) {
      setNotice((e as Error).message);
    } finally { setBusy(null); }
  };

  const resync = async (slug: string) => {
    setBusy(slug); setNotice(null);
    try {
      const r = await fetch("/api/commerce/connect/sync", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug }),
      });
      const d = await r.json();
      setNotice(d?.ok ? `${slug} — ${d.products} product(s) as of now` : String(d?.error ?? "sync failed"));
      pull();
    } finally { setBusy(null); }
  };

  const field: React.CSSProperties = {
    fontFamily: SANS, border: `1px solid ${HAIRB}`, backgroundColor: "transparent", color: INKB, outline: "none",
  };

  return (
    <main style={{ backgroundColor: PAPER, color: INKB, minHeight: "100vh", fontFamily: SANS }}>
      <div className="mx-auto max-w-[1040px] px-5 pb-24 pt-6 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-3" style={{ borderBottom: `2px solid ${INKB}` }}>
          <div>
            <div style={MICRO}>PDR COMMERCE · CONNECTION</div>
            <h1 className="mt-1 font-display leading-[0.9]" style={{ fontSize: "clamp(2rem,5vw,3.2rem)" }}>
              Bring a store you already run
            </h1>
          </div>
          <Link href="/commerce/command" className="text-[12px] font-semibold no-underline" style={{ color: LIVE }}>the OS →</Link>
        </div>
        <p className="max-w-[70ch] py-3 text-[13.5px] leading-relaxed" style={{ color: DIMB }}>
          Your catalogue comes into Commerce and the workers start reading it — margins, stock, agent visibility, marketing
          written against your real products. PDR publishes an <b style={{ color: INKB }}>agent layer</b> for your shop: a
          product feed, structured data, an MCP endpoint and a measured seller record, all pointing at your own product
          pages. Buyers still check out on your site, and the connection is{" "}
          <b style={{ color: INKB }}>read-only</b> — nothing in your store changes until you grant write access.
        </p>

        <Section n={1} title="Connect" right={<span style={MICRO}>{spec.needs === "nothing" ? "NO CREDENTIALS NEEDED" : `NEEDS · ${spec.needs.toUpperCase()}`}</span>}>
          <div className="flex flex-wrap items-center gap-2 py-3">
            {PLATFORMS.map((p) => (
              <Pick key={p.id} active={platform === p.id} onClick={() => setPlatform(p.id)}>{p.label}</Pick>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 pb-3">
            <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder={spec.domainLabel}
              className="h-9 min-w-[240px] flex-1 px-3 text-[13px]" style={field} />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Business name (optional)"
              className="h-9 w-[200px] px-3 text-[13px]" style={field} />
          </div>
          <div className="flex flex-wrap items-center gap-2 pb-3">
            <input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="Public storefront URL (optional — where buyers go)"
              className="h-9 min-w-[240px] flex-1 px-3 text-[13px]" style={field} />
            {spec.needs !== "nothing" && (
              <input value={token} onChange={(e) => setToken(e.target.value)} placeholder={spec.needs} type="password"
                className="h-9 min-w-[210px] flex-1 px-3 text-[13px]" style={{ ...field, fontFamily: MONO }} />
            )}
            <Action onClick={connect} disabled={!!busy || !domain.trim()}>
              {busy === "connect" ? "READING THE CATALOGUE…" : "CONNECT & SYNC"}
            </Action>
          </div>
          <div className="text-[12.5px] leading-relaxed" style={{ color: DIMB }}>{spec.help}</div>
          {notice && (
            <div className="mt-3 px-3 py-2 text-[13px]" style={{ backgroundColor: INSETB, color: /fail|error|not read|refus|invalid/i.test(notice) ? FAULTB : OKB }}>
              {notice}
            </div>
          )}
          {result?.agentLayer && (
            <div className="mt-3 px-3 py-3" style={{ backgroundColor: INSETB }}>
              <div style={MICRO}>THE AGENT LAYER PDR NOW PUBLISHES FOR THIS STORE</div>
              {Object.entries(result.agentLayer).map(([k, v]) => (
                <div key={k} className="mt-1 text-[12.5px]" style={{ fontFamily: MONO }}>
                  <a href={v} target="_blank" rel="noreferrer" style={{ color: LIVE }}>{v}</a>
                  <span style={{ color: FAINTB }}> · {k}</span>
                </div>
              ))}
              <Link href="/commerce/command" className="mt-3 inline-block text-[12px] font-semibold no-underline" style={{ color: LIVE }}>
                open it in Commerce →
              </Link>
            </div>
          )}
        </Section>

        <Section n={2} title="Under management" right={<span style={MICRO}>{list ? `${list.length} CONNECTED` : "LOADING…"}</span>}>
          {list?.length === 0 && (
            <Thin>
              No connected stores yet. A business Studio built does not appear here — PDR hosts it, so it is already under
              management in the OS.
            </Thin>
          )}
          {list && list.length > 0 && <Heads cols="minmax(0,1fr) 92px 84px 128px auto" labels={["STORE", "PLATFORM", "PRODUCTS", "LAST SYNC", ""]} />}
          {(list ?? []).map((c) => (
            <Row key={c.slug} cols="minmax(0,1fr) 92px 84px 128px auto">
              <span className="min-w-0">
                <span className="text-[13.5px] font-semibold">{c.name}</span>
                <span className="ml-2 text-[12px]" style={{ color: FAINTB }}>{c.domain}</span>
                {c.syncNote && <div className="text-[12px]" style={{ color: WARNB }}>{c.syncNote}</div>}
              </span>
              <Stamp text={c.platform} color={DIMB} />
              <Num color={c.products ? INKB : FAINTB} bold>{c.products}</Num>
              <Num color={FAINTB}>{c.lastSyncedAt ? c.lastSyncedAt.slice(5, 16).replace("T", " ") : "never"}</Num>
              <span className="flex flex-wrap items-center justify-end gap-1.5">
                <Stamp text={c.scopes.write ? "read + write" : "read-only"} color={c.scopes.write ? OKB : DIMB} />
                <Pick onClick={() => resync(c.slug)} disabled={!!busy}>{busy === c.slug ? "…" : "Re-sync"}</Pick>
                <Link href="/commerce/command" className="text-[11.5px] font-semibold no-underline" style={{ color: LIVE }}>open</Link>
              </span>
            </Row>
          ))}
        </Section>

        <Section n={3} title="What connecting does, and what it does not">
          {([
            ["Reads your catalogue", "Products, prices, descriptions and images come into Commerce. Margins, stock signals and the operator statement work against your real range."],
            ["Publishes an agent layer", "A product feed, structured data, an MCP endpoint and a measured seller record — all pointing at YOUR product pages. This is what lets an AI shopper find you, compare you and trust you."],
            ["Writes marketing for your products", "Campaigns, creative variants and landing pages grounded in your actual catalogue, through the brain. Publishing to social still needs a channel connection."],
            ["Does not change your store", "Read-only. Prices, stock and content stay exactly as they are. Operations and Products propose; they do not act until you grant write access."],
            ["Does not take your orders", "Buyers check out on your site. An agent that asks to buy through PDR is sent to your own product page."],
          ] as const).map(([t, d]) => (
            <Row key={t}>
              <span className="w-[212px] shrink-0 text-[13px] font-semibold">{t}</span>
              <span className="min-w-0 flex-1 text-pretty text-[13px]" style={{ color: DIMB }}>{d}</span>
            </Row>
          ))}
        </Section>

        <AuditLine
          measured="catalogue as of the last sync · orders where the platform reports them · agent reads of the layer PDR publishes"
          awaiting="write scopes (per platform) · channel connections for publishing"
        />
      </div>
    </main>
  );
}
