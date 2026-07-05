"use client";

/**
 * /commerce/connect — platform picker + connect flows (§4.3).
 *
 * Shopify → OAuth via /api/commerce/connect/shopify/start (token returns in the
 *           callback redirect and is persisted client-side — SECURITY TODO in
 *           the callback route documents the Supabase seam).
 * WooCommerce → store URL + consumer key/secret, verified by reading the catalog.
 * Generic → feed/sitemap/store URL or pasted CSV; export-mode note shown.
 * BigCommerce / Magento have no native connector yet — they degrade to the
 *           generic export-mode flow (§0.1 graceful-degradation table).
 *
 * On success: createStore + setCredentials + bulk product import, and any
 * pending free-scan report (localStorage) is attached as the store's first scan.
 * Connectivity is free/bundled on every platform — never paywalled (§1.3).
 *
 * PRESENTATION rebuilt to the brutalist --fk-* design system; connector wiring
 * (OAuth start, catalog import, credentials write, completeConnect) is verbatim.
 */

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { CommerceShell } from "@/components/commerce/Shell";
import { createProduct, createScan, createStore } from "@/lib/commerce/data/store";
import { setCredentials } from "@/lib/commerce/data/credentials";
import { setActiveStoreId } from "@/lib/commerce/data/useCommerceStore";
import type { Platform } from "@/lib/commerce/data/types";
import type { ConnectorProduct, ConnectorStoreRef } from "@/lib/commerce/connectors/types";
import type { CommerceReport } from "@/lib/commerce/scan/report-types";

const PENDING_SCAN_KEY = "pd-commerce-pending-scan";

type Panel = "picker" | "shopify" | "woo" | "generic";

/**
 * Platform tiles. `panel` routes into the matching connect flow — BigCommerce and
 * Magento have no native connector yet, so they enter the generic export-mode flow
 * (connectorFor() maps them to the generic connector) rather than promising a push
 * we can't do. Connectivity is free on all of them — tiles never show a price.
 */
const TILES: { id: Panel; name: string; kind: string; monogram: string }[] = [
  { id: "shopify", name: "Shopify", kind: "OAuth · one-click push", monogram: "S" },
  { id: "woo", name: "WooCommerce", kind: "REST keys · one-click push", monogram: "W" },
  { id: "generic", name: "BigCommerce", kind: "Feed / export mode", monogram: "B" },
  { id: "generic", name: "Magento", kind: "Feed / export mode", monogram: "M" },
  { id: "generic", name: "My store isn't listed", kind: "Feed · sitemap · CSV", monogram: "+" },
];

const TRUST_LINE = "Read + write access to product catalog only. Reversible. Disconnect anytime.";

function readPendingReport(): CommerceReport | null {
  try {
    const raw = localStorage.getItem(PENDING_SCAN_KEY);
    return raw ? (JSON.parse(raw) as CommerceReport) : null;
  } catch {
    return null;
  }
}

/** Create the store + credentials + products (+ pending scan) and enter the app. */
function completeConnect(opts: {
  platform: Platform;
  name: string;
  url: string;
  ref: ConnectorStoreRef;
  products: ConnectorProduct[];
}): string {
  const store = createStore({
    name: opts.name,
    url: opts.url,
    platform: opts.platform,
    plan: "starter",
    user_id: null,
  });
  setCredentials(store.id, opts.ref);
  for (const p of opts.products) {
    createProduct({
      store_id: store.id,
      title: p.title,
      url: p.url,
      external_id: p.external_id,
      current_score: "at_risk", // unknown until the first store scan scores it
      estimated_monthly_loss: null,
      description: p.description || null,
      body_html: p.body_html || null,
    });
  }
  const pending = readPendingReport();
  if (pending) {
    createScan({
      store_id: store.id,
      status: "complete",
      result: pending as unknown as Record<string, unknown>,
      completed_at: new Date().toISOString(),
    });
    try { localStorage.removeItem(PENDING_SCAN_KEY); } catch { /* ignore */ }
  }
  setActiveStoreId(store.id);
  return store.id;
}

/**
 * OAuth-return error copy. Where the platform rejected the grant, name the exact
 * fix (§4.3) — "grant product read/write access … check both boxes" — not a
 * generic failure string.
 */
const OAUTH_ERRORS: Record<string, string> = {
  invalid_shop: "That doesn't look like a *.myshopify.com shop — check the domain.",
  not_configured: "Shopify OAuth isn't configured on this deployment (SHOPIFY_API_KEY/SECRET missing).",
  state_mismatch: "The OAuth handshake expired — try connecting again.",
  invalid_callback: "Shopify returned an incomplete callback — try again.",
  invalid_credentials:
    "You'll need to grant product read/write access — try connecting again and check both boxes.",
};

function ConnectInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [panel, setPanel] = useState<Panel>("picker");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const finishedOauth = useRef(false);

  /* Shopify OAuth return leg: ?platform=shopify&shop=…&token=… (or &error=…) */
  useEffect(() => {
    if (finishedOauth.current) return;
    if (params.get("platform") !== "shopify") return;
    const err = params.get("error");
    if (err) {
      setPanel("shopify");
      setError(OAUTH_ERRORS[err] ?? `Shopify connect failed (${err}).`);
      return;
    }
    const shop = params.get("shop");
    const token = params.get("token");
    if (!shop || !token) return;
    finishedOauth.current = true;
    const ref: ConnectorStoreRef = { platform: "shopify", domain: shop, accessToken: token };
    setPanel("shopify");
    setBusy(true);
    setStatus("Connected — importing your catalog…");
    void (async () => {
      const res = await fetch("/api/commerce/catalog", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ref }),
      }).then((r) => r.json()).catch(() => null);
      if (!res?.ok) {
        setBusy(false);
        setError(res?.detail ?? "Catalog import failed — you can retry from the dashboard.");
        return;
      }
      completeConnect({
        platform: "shopify",
        name: shop.replace(".myshopify.com", ""),
        url: `https://${shop}`,
        ref,
        products: res.products as ConnectorProduct[],
      });
      router.replace("/commerce/dashboard");
    })();
  }, [params, router]);

  async function importAndEnter(platform: Platform, name: string, url: string, ref: ConnectorStoreRef, csvText?: string) {
    setBusy(true);
    setError(null);
    setStatus("Reading your catalog…");
    const res = await fetch("/api/commerce/catalog", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(csvText ? { ref, csvText } : { ref }),
    }).then((r) => r.json()).catch(() => null);
    if (!res?.ok) {
      setBusy(false);
      setStatus(null);
      setError(res?.detail ?? "Could not read the catalog — check the details and try again.");
      return;
    }
    const products = res.products as ConnectorProduct[];
    setStatus(`Imported ${products.length} products — opening your Command Center…`);
    completeConnect({ platform, name, url, ref, products });
    router.replace("/commerce/dashboard");
  }

  const backToPicker = () => { setPanel("picker"); setError(null); setStatus(null); };

  return (
    <CommerceShell subtitle="Connect">
      {/* ── BAND 1 · BLACK — platform picker ──────────────────────────────── */}
      <section className="border-b border-fk-ink-border bg-fk-black py-16 lg:py-24">
        <div className="mx-auto max-w-[1120px] px-6 lg:px-10">
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-fk-muted">
            Connect your store — free on every platform
          </div>
          <h1 className="mt-6 font-display text-[clamp(2.25rem,6vw,4.5rem)] uppercase leading-[0.92] text-fk-cream">
            {panel === "picker" ? "Pick your platform" : TILES.find((t) => t.id === panel)?.name}
          </h1>
          <p className="mt-5 max-w-2xl font-mono text-[12px] leading-relaxed tracking-[0.02em] text-fk-cream/60">
            {TRUST_LINE}
          </p>

          {(error || status) && (
            <div className="mt-8 max-w-2xl space-y-3">
              {error && (
                <p className="border border-fk-red/50 bg-fk-red/5 px-4 py-3 font-mono text-[12px] leading-relaxed text-fk-red">
                  {error}
                </p>
              )}
              {status && (
                <p className="border border-fk-blue/40 bg-fk-blue/5 px-4 py-3 font-mono text-[12px] leading-relaxed text-fk-blue">
                  {status}
                </p>
              )}
            </div>
          )}

          {panel === "picker" && (
            <div className="mt-12 grid gap-px border border-fk-ink-border bg-fk-ink-border sm:grid-cols-2 lg:grid-cols-3">
              {TILES.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => { setPanel(t.id); setError(null); setStatus(null); }}
                  className="group flex min-h-[168px] cursor-pointer flex-col justify-between border-0 bg-fk-card-dark p-6 text-left text-fk-cream hover:bg-fk-blue hover:text-white"
                  style={{ transition: "none", borderRadius: 0 }}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center border border-fk-cream/25 font-mono text-lg font-bold group-hover:border-white/60"
                    aria-hidden
                  >
                    {t.monogram}
                  </div>
                  <div>
                    <div className="font-display text-2xl uppercase leading-none">{t.name}</div>
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] opacity-55 group-hover:opacity-80">
                      {t.kind}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── BAND 2 · CREAM — connect card (only once a platform is chosen) ──── */}
      {panel !== "picker" && (
        <section className="bg-fk-cream py-16 text-fk-black lg:py-24">
          <div className="mx-auto max-w-[1120px] px-6 lg:px-10">
            <div className="mx-auto max-w-xl border border-fk-cream-border bg-fk-cream shadow-hard">
              {panel === "shopify" && <ShopifyPanel busy={busy} onBack={backToPicker} />}
              {panel === "woo" && (
                <WooPanel
                  busy={busy}
                  onBack={backToPicker}
                  onSubmit={(base, key, secret) =>
                    importAndEnter("woo", new URL(/^https?:/.test(base) ? base : `https://${base}`).hostname, base, {
                      platform: "woo",
                      domain: base,
                      accessToken: `${key}:${secret}`,
                    })
                  }
                />
              )}
              {panel === "generic" && (
                <GenericPanel
                  busy={busy}
                  onBack={backToPicker}
                  onSubmit={(url, csvText) => {
                    const cleanUrl = url || "csv-upload";
                    const host = url ? url.replace(/^https?:\/\//, "").split("/")[0] : "CSV import";
                    return importAndEnter("generic", host, cleanUrl, { platform: "generic", domain: url, accessToken: null }, csvText);
                  }}
                />
              )}
            </div>
          </div>
        </section>
      )}
    </CommerceShell>
  );
}

/* ── Panels ────────────────────────────────────────────────────────────────── */

const CARD = "p-8 lg:p-10";
const LABEL = "block font-mono text-[10px] uppercase tracking-[0.22em] text-fk-black/55";
const NOTE = "font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-fk-black/45";
const TRUST = "font-mono text-[11px] leading-relaxed tracking-[0.02em] text-fk-black/55";
const BACK =
  "mt-2 inline-block cursor-pointer border-0 bg-transparent p-0 font-mono text-[11px] uppercase tracking-[0.2em] text-fk-black/40 hover:text-fk-black";

/** Cream-band inputs — dark-on-cream, hairline border, hard-cut focus. */
const CREAM_INPUT =
  "mt-2 w-full border border-fk-cream-border bg-white px-4 py-3.5 font-mono text-[14px] text-fk-black outline-none placeholder:text-fk-black/30 focus:border-fk-blue";

function KindTag({ label }: { label: string }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-fk-blue">{label}</div>
  );
}

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="inline-flex w-full cursor-pointer items-center justify-center gap-3 border-0 px-8 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.2em] disabled:opacity-50"
      style={{ background: "var(--fk-yellow)", color: "var(--fk-black)", borderRadius: 0, transition: "none" }}
    >
      {busy ? "Working…" : label}
      {!busy && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

function ShopifyPanel({ busy, onBack }: { busy: boolean; onBack: () => void }) {
  const [shop, setShop] = useState("");
  return (
    <form
      className={CARD}
      onSubmit={(e) => {
        e.preventDefault();
        const s = shop.trim();
        if (s) window.location.href = `/api/commerce/connect/shopify/start?shop=${encodeURIComponent(s)}`;
      }}
    >
      <KindTag label="Shopify · OAuth" />
      <h2 className="mt-3 font-display text-3xl uppercase leading-none">Connect Shopify</h2>
      <p className={`mt-4 ${TRUST}`}>{TRUST_LINE}</p>

      <div className="mt-8">
        <label className={LABEL}>Shop domain</label>
        <input
          className={CREAM_INPUT}
          placeholder="my-shop.myshopify.com"
          value={shop}
          onChange={(e) => setShop(e.target.value)}
          autoFocus
        />
      </div>

      <div className="mt-6">
        <SubmitButton busy={busy} label="Connect with Shopify" />
      </div>
      <p className={`mt-4 ${NOTE}`}>
        Redirects to Shopify to approve read/write on products + read on orders. Check both boxes.
      </p>
      <button type="button" onClick={onBack} className={BACK}>← All platforms</button>
    </form>
  );
}

function WooPanel({ busy, onBack, onSubmit }: { busy: boolean; onBack: () => void; onSubmit: (base: string, key: string, secret: string) => void }) {
  const [base, setBase] = useState("");
  const [key, setKey] = useState("");
  const [secret, setSecret] = useState("");
  return (
    <form
      className={CARD}
      onSubmit={(e) => {
        e.preventDefault();
        if (base.trim() && key.trim() && secret.trim()) onSubmit(base.trim(), key.trim(), secret.trim());
      }}
    >
      <KindTag label="WooCommerce · REST keys" />
      <h2 className="mt-3 font-display text-3xl uppercase leading-none">Connect WooCommerce</h2>
      <p className={`mt-4 ${TRUST}`}>{TRUST_LINE}</p>

      <div className="mt-8 space-y-5">
        <div>
          <label className={LABEL}>Store URL (https)</label>
          <input className={CREAM_INPUT} placeholder="https://your-store.com" value={base} onChange={(e) => setBase(e.target.value)} autoFocus />
        </div>
        <div>
          <label className={LABEL}>Consumer key</label>
          <input className={CREAM_INPUT} placeholder="ck_…" value={key} onChange={(e) => setKey(e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Consumer secret</label>
          <input className={CREAM_INPUT} placeholder="cs_…" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} />
        </div>
      </div>

      <div className="mt-6">
        <SubmitButton busy={busy} label="Connect WooCommerce" />
      </div>
      <p className={`mt-4 ${NOTE}`}>
        WooCommerce → Settings → Advanced → REST API → Add key (read/write).
      </p>
      <button type="button" onClick={onBack} className={BACK}>← All platforms</button>
    </form>
  );
}

function GenericPanel({ busy, onBack, onSubmit }: { busy: boolean; onBack: () => void; onSubmit: (url: string, csvText?: string) => void }) {
  const [url, setUrl] = useState("");
  const [csv, setCsv] = useState("");
  return (
    <form
      className={CARD}
      onSubmit={(e) => {
        e.preventDefault();
        const u = url.trim();
        const c = csv.trim();
        if (u || c) onSubmit(u, c || undefined);
      }}
    >
      <KindTag label="Any store · export mode" />
      <h2 className="mt-3 font-display text-3xl uppercase leading-none">Connect by feed</h2>
      <p className={`mt-4 ${TRUST}`}>
        We&apos;ll read your catalog and generate fixes. Since we can&apos;t auto-publish to your platform
        yet, you&apos;ll get a ready-to-use export instead of one-click push.
      </p>

      <div className="mt-8 space-y-5">
        <div>
          <label className={LABEL}>Store, feed or sitemap URL</label>
          <input
            className={CREAM_INPUT}
            placeholder="https://your-store.com (or …/feed.json, …/sitemap.xml)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className={LABEL}>…or paste a product CSV (title, description, price, image, url, sku)</label>
          <textarea
            className={`${CREAM_INPUT} min-h-[120px] resize-y`}
            placeholder="title,description,price,url&#10;Amber Candle,Hand-poured…,24,https://…"
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6">
        <SubmitButton busy={busy} label="Import catalog" />
      </div>
      <p className={`mt-4 ${NOTE}`}>
        Reversible. Disconnect anytime. Connectivity is always free.
      </p>
      <button type="button" onClick={onBack} className={BACK}>← All platforms</button>
    </form>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={null}>
      <ConnectInner />
    </Suspense>
  );
}
