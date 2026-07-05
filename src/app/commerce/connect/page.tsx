"use client";

/**
 * /commerce/connect — platform picker + connect flows (§4.3).
 *
 * Shopify → OAuth via /api/commerce/connect/shopify/start (token returns in the
 *           callback redirect and is persisted client-side — SECURITY TODO in
 *           the callback route documents the Supabase seam).
 * WooCommerce → store URL + consumer key/secret, verified by reading the catalog.
 * Generic → feed/sitemap/store URL or pasted CSV; export-mode note shown.
 *
 * On success: createStore + setCredentials + bulk product import, and any
 * pending free-scan report (localStorage) is attached as the store's first scan.
 * Connectivity is free/bundled on every platform — never paywalled (§1.3).
 */

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { createProduct, createScan, createStore } from "@/lib/commerce/data/store";
import { setCredentials } from "@/lib/commerce/data/credentials";
import { setActiveStoreId } from "@/lib/commerce/data/useCommerceStore";
import type { Platform } from "@/lib/commerce/data/types";
import type { ConnectorProduct, ConnectorStoreRef } from "@/lib/commerce/connectors/types";
import type { CommerceReport } from "@/lib/commerce/scan/report-types";

const PENDING_SCAN_KEY = "pd-commerce-pending-scan";

type Panel = "picker" | "shopify" | "woo" | "generic";

const PLATFORMS: { id: Panel; name: string; note: string }[] = [
  { id: "shopify", name: "Shopify", note: "OAuth · one-click fixes push live" },
  { id: "woo", name: "WooCommerce", note: "REST keys · one-click fixes push live" },
  { id: "generic", name: "My store isn't listed", note: "Feed / sitemap / CSV · export-mode fixes" },
];

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

const OAUTH_ERRORS: Record<string, string> = {
  invalid_shop: "That doesn't look like a *.myshopify.com shop — check the domain.",
  not_configured: "Shopify OAuth isn't configured on this deployment (SHOPIFY_API_KEY/SECRET missing).",
  state_mismatch: "The OAuth handshake expired — try connecting again.",
  invalid_callback: "Shopify returned an incomplete callback — try again.",
  invalid_credentials: "Shopify rejected the handshake — try connecting again.",
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

  return (
    <main className="min-h-[100dvh] bg-fk-black text-fk-cream" style={{ borderRadius: 0 }}>
      <SiteNav subtitle="AI Commerce" />
      <div className="mx-auto max-w-[860px] px-6 py-16 lg:py-24">
        <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
          Connect your store — free on every platform
        </div>
        <h1 className="mt-6 font-display text-[clamp(2rem,5vw,3.75rem)] uppercase leading-[0.95]">
          {panel === "picker" ? "Pick your platform" : PLATFORMS.find((p) => p.id === panel)?.name}
        </h1>
        <p className="mt-4 max-w-xl font-mono text-[12px] leading-relaxed text-white/55">
          Read + write access to product catalog only. Reversible. Disconnect anytime.
        </p>

        {error && <p className="mt-6 border border-fk-red/40 p-3 font-mono text-[12px] text-fk-red">{error}</p>}
        {status && <p className="mt-6 font-mono text-[12px] text-fk-blue">{status}</p>}

        {panel === "picker" && (
          <div className="mt-10 grid gap-px bg-fk-ink-border sm:grid-cols-3">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setPanel(p.id); setError(null); }}
                className="cursor-pointer border-0 bg-fk-card-dark p-6 text-left text-fk-cream hover:bg-fk-blue hover:text-white"
                style={{ transition: "none", borderRadius: 0 }}
              >
                <div className="font-display text-xl uppercase">{p.name}</div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] opacity-60">{p.note}</div>
              </button>
            ))}
          </div>
        )}

        {panel === "shopify" && (
          <ShopifyPanel busy={busy} onBack={() => setPanel("picker")} />
        )}
        {panel === "woo" && (
          <WooPanel
            busy={busy}
            onBack={() => setPanel("picker")}
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
            onBack={() => setPanel("picker")}
            onSubmit={(url, csvText) => {
              const cleanUrl = url || "csv-upload";
              const host = url ? url.replace(/^https?:\/\//, "").split("/")[0] : "CSV import";
              return importAndEnter("generic", host, cleanUrl, { platform: "generic", domain: url, accessToken: null }, csvText);
            }}
          />
        )}
      </div>
    </main>
  );
}

/* ── Panels ────────────────────────────────────────────────────────────────── */

const LABEL = "block font-mono text-[10px] uppercase tracking-[0.22em] text-white/45";
const BACK = "mt-8 inline-block cursor-pointer border-0 bg-transparent p-0 font-mono text-[11px] uppercase tracking-[0.2em] text-white/40 hover:text-white/80";

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="inline-flex cursor-pointer items-center gap-3 border-0 px-8 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.2em] disabled:opacity-50"
      style={{ background: "var(--fk-yellow)", color: "var(--fk-black)", borderRadius: 0 }}
    >
      {label} <ArrowRight className="h-4 w-4" />
    </button>
  );
}

function ShopifyPanel({ busy, onBack }: { busy: boolean; onBack: () => void }) {
  const [shop, setShop] = useState("");
  return (
    <form
      className="mt-10 max-w-xl space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const s = shop.trim();
        if (s) window.location.href = `/api/commerce/connect/shopify/start?shop=${encodeURIComponent(s)}`;
      }}
    >
      <div>
        <label className={LABEL}>Shop domain</label>
        <input className="pd2-input mt-2" placeholder="my-shop.myshopify.com" value={shop} onChange={(e) => setShop(e.target.value)} autoFocus />
      </div>
      <SubmitButton busy={busy} label="Connect with Shopify" />
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
        Redirects to Shopify to approve read/write on products + read on orders
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
      className="mt-10 max-w-xl space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (base.trim() && key.trim() && secret.trim()) onSubmit(base.trim(), key.trim(), secret.trim());
      }}
    >
      <div>
        <label className={LABEL}>Store URL (https)</label>
        <input className="pd2-input mt-2" placeholder="https://your-store.com" value={base} onChange={(e) => setBase(e.target.value)} autoFocus />
      </div>
      <div>
        <label className={LABEL}>Consumer key</label>
        <input className="pd2-input mt-2" placeholder="ck_…" value={key} onChange={(e) => setKey(e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Consumer secret</label>
        <input className="pd2-input mt-2" placeholder="cs_…" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} />
      </div>
      <SubmitButton busy={busy} label="Connect WooCommerce" />
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
        WooCommerce → Settings → Advanced → REST API → Add key (read/write)
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
      className="mt-10 max-w-xl space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const u = url.trim();
        const c = csv.trim();
        if (u || c) onSubmit(u, c || undefined);
      }}
    >
      <div>
        <label className={LABEL}>Store, feed or sitemap URL</label>
        <input className="pd2-input mt-2" placeholder="https://your-store.com (or …/feed.json, …/sitemap.xml)" value={url} onChange={(e) => setUrl(e.target.value)} autoFocus />
      </div>
      <div>
        <label className={LABEL}>…or paste a product CSV (headers: title, description, price, image, url, sku)</label>
        <textarea
          className="pd2-input mt-2 min-h-[120px]"
          placeholder="title,description,price,url&#10;Amber Candle,Hand-poured…,24,https://…"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
      </div>
      <SubmitButton busy={busy} label="Import catalog" />
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
        We'll read your catalog and generate fixes. Since we can't auto-publish to your platform
        yet, you'll get a ready-to-use export instead of one-click push.
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
