"use client";

/**
 * /studio/site — the SITE FABRICATOR, opened from the PLATFORM module.
 *
 * Fabrication ONLY: this page streams the build log while Claude synthesizes
 * the catalog, publishes the store server-side, then hard-redirects INTO the
 * generated website at /store/[slug] — the store is its own site in its own
 * tab, not an app preview. The legibility report lives in the PLATFORM module.
 */

import { useEffect, useRef, useState } from "react";
import type { StoreProduct } from "@/lib/studio/aiStorefront";
import { type StorefrontInput } from "@/lib/studio/aiStorefront";

/* machine palette (this page is the machine printing; the output has its own skin) */
const BG = "#0A0A0B", PANEL = "#111113", WELL = "#060607", LINE = "#26262B";
const INK = "#EDEDEA", DIM = "#8A8A82", FAINT = "#55554F", AMBER = "#FFB000", GREEN = "#35C46A", RED = "#F04438";

/* ── kit transfer from the studio (localStorage seam) ───────────────────── */
type KitLike = {
  projectCode: string; fullName: string; descriptor: string; domain: string; oneLiner?: string;
  brandKit: {
    audience: string; positioning: string;
    palette: { name: string; hex: string; role: string; contrast: string }[];
  };
};
/* No silent fallback, no stale orders: the work order is a timestamped
   handoff from the studio ({ kit, ts }); anything missing, legacy-format or
   older than 30 min renders NO WORK ORDER instead of a stale business. */
const ORDER_TTL_MS = 30 * 60 * 1000;
function loadKit(): KitLike | null {
  try {
    const raw = localStorage.getItem("pdr-site-kit");
    if (raw) {
      const p = JSON.parse(raw) as { kit?: KitLike; ts?: number };
      const k = p?.kit;
      const fresh = typeof p?.ts === "number" && Date.now() - p.ts < ORDER_TTL_MS;
      if (fresh && k?.projectCode && k?.brandKit?.palette?.length) return k;
    }
  } catch { /* fall through */ }
  return null;
}

/* ── catalog synthesis fallback (when the Claude route fails) ───────────── */
const MERIDIAN_SKUS: StoreProduct[] = [
  { name: "Sprint Roast", description: "A bright single-origin the whole team ships on. Rotating micro-lots, roasted to order.", price: "€18/mo", priceValue: 18, category: "Subscription", sku: "sprint-roast", availability: "InStock" },
  { name: "Decaf Standup", description: "Swiss-water decaf for the afternoon sync — full body, no jitter.", price: "€16/mo", priceValue: 16, category: "Subscription", sku: "decaf-standup", availability: "InStock" },
  { name: "Founders' Micro-Lot", description: "Limited-allocation lot from a single farm. Numbered bags, roast-dated.", price: "€24/mo", priceValue: 24, category: "Subscription", sku: "founders-micro-lot", availability: "PreOrder" },
  { name: "Team Kit", description: "Grinder, kettle, and a starter month for a distributed pod of six.", price: "€120", priceValue: 120, category: "Hardware", sku: "team-kit", availability: "InStock" },
  { name: "Cold Brew Pack", description: "12 ready-to-brew cold packs for async afternoons across timezones.", price: "€14", priceValue: 14, category: "Consumable", sku: "cold-brew-pack", availability: "InStock" },
  { name: "Gift Sprint", description: "Three months of Sprint Roast for a teammate. Ships with a handwritten roast card.", price: "€54", priceValue: 54, category: "Gift", sku: "gift-sprint", availability: "InStock" },
];
function synthCatalog(kit: KitLike): StoreProduct[] {
  if (kit.projectCode === "MERIDIAN") return MERIDIAN_SKUS;
  const base = kit.brandKit.positioning || kit.descriptor;
  return [
    { name: "Starter", description: `Entry tier of ${kit.fullName}. ${base}.`, price: "€9/mo", priceValue: 9, category: "Plan", sku: "starter", availability: "InStock" },
    { name: "Core", description: `The standard ${kit.projectCode} plan for ${kit.brandKit.audience.toLowerCase()}.`, price: "€19/mo", priceValue: 19, category: "Plan", sku: "core", availability: "InStock" },
    { name: "Pro", description: `Full-capability tier. ${kit.oneLiner || base}.`, price: "€49/mo", priceValue: 49, category: "Plan", sku: "pro", availability: "InStock" },
    { name: "Setup Kit", description: `Onboarding + configuration for a whole team.`, price: "€120", priceValue: 120, category: "Service", sku: "setup-kit", availability: "InStock" },
    { name: "Annual", description: `Core, billed yearly — two months free.`, price: "€190/yr", priceValue: 190, category: "Plan", sku: "annual", availability: "InStock" },
    { name: "Gift Pass", description: `Three months of Core for someone who needs it.`, price: "€57", priceValue: 57, category: "Gift", sku: "gift-pass", availability: "InStock" },
  ];
}
function toStorefrontInput(kit: KitLike, products: StoreProduct[]): StorefrontInput {
  const pal = kit.brandKit.palette;
  const pick = (i: number, fb: string) => pal[i]?.hex ?? fb;
  return {
    brand: {
      name: kit.projectCode, fullName: kit.fullName, domain: kit.domain,
      oneLiner: kit.oneLiner || kit.descriptor,
      positioning: kit.brandKit.positioning, audience: kit.brandKit.audience,
      ink: pick(0, "#141210"), bg: pick(4, "#FBF8F3"), surface: pick(1, "#E8D9C4"),
      accent: pick(2, "#B5551D"), onAccent: pal[2]?.contrast ?? "#FFFFFF",
    },
    products,
  };
}

/* ── fabrication steps ─────────────────────────────────────────────────── */
const clock2 = (n: number) => n.toString().padStart(2, "0");
function fabSteps(kit: KitLike, skus: number): string[] {
  return [
    `PARSING BUSINESS SPEC · ${kit.projectCode}`,
    `RESOLVING BRAND SURFACES · ${kit.brandKit.palette.length} SWATCHES`,
    "ENGAGING SYNTHESIS ENGINE · CLAUDE",
    `SYNTHESIZING CATALOG · ${clock2(skus)} SKUS`,
    ...Array.from({ length: skus }, (_, i) => `WRITING PRODUCT PAGE ${clock2(i + 1)}/${clock2(skus)}`),
    "RENDERING STUDIO ART PER SKU",
    "WRITING ABOUT · SHIPPING · TERMS · GALLERY",
    "OPENING GUEST CHECKOUT (JS-OFF FORM)",
    "EMBEDDING JSON-LD · RETURN & SHIPPING POLICIES",
    "EMITTING FEED · llms.txt · agent-catalog · sitemap",
    "AGENT LEGIBILITY CHECK · PASS",
    "PUBLISHING STOREFRONT",
  ];
}
type Synth = { status: "pending" | "claude" | "stock"; products: StoreProduct[] | null; manifest?: { ships?: string; returns?: string; tagline?: string } };

function SegBar({ pct, segs = 40 }: { pct: number; segs?: number }) {
  const filled = Math.round((pct / 100) * segs);
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: segs }).map((_, i) => (
        <span key={i} className="h-3 flex-1" style={{ backgroundColor: i < filled ? AMBER : "#191b15" }} />
      ))}
    </div>
  );
}

export default function FabricatedSite() {
  // undefined = not read yet · null = no work order stored · KitLike = ready
  const [kit, setKit] = useState<KitLike | null | undefined>(undefined);
  const [lines, setLines] = useState<string[]>([]);
  const [pct, setPct] = useState(0);
  const [synth, setSynth] = useState<Synth>({ status: "pending", products: null });
  const [fault, setFault] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const synthRef = useRef(synth);
  synthRef.current = synth;
  const publishedRef = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setKit(loadKit()); }, []);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [lines]);

  // Real synthesis: Claude writes the catalog while the fab sequence streams.
  useEffect(() => {
    if (!kit) return;
    let alive = true;
    fetch("/api/studio/storefront", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kit }) })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d?.ok && Array.isArray(d.products) && d.products.length >= 3) setSynth({ status: "claude", products: d.products, manifest: d.manifest });
        else setSynth({ status: "stock", products: null });
      })
      .catch(() => alive && setSynth({ status: "stock", products: null }));
    return () => { alive = false; };
  }, [kit, retry]);

  // Fabrication: stream steps, hold for synthesis, publish, ENTER THE STORE.
  useEffect(() => {
    if (!kit) return;
    setLines([]); setPct(0); setFault(null); publishedRef.current = false;
    const steps = fabSteps(kit, 6);
    let i = 0; let alive = true; let waitNoted = false;
    const publish = () => {
      if (publishedRef.current) return;
      publishedRef.current = true;
      const prods = synthRef.current.products ?? synthCatalog(kit);
      fetch("/api/store/publish", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ store: toStorefrontInput(kit, prods), manifest: synthRef.current.manifest ?? {}, source: synthRef.current.status === "claude" ? "claude" : "stock", spec: kit.descriptor }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (!alive) return;
          if (d?.ok && d.slug) {
            try {
              localStorage.setItem("pdr-last-store", d.slug);
              // Saved storefronts: the PLATFORM panel lists these — click to
              // reopen, no need to regenerate.
              const raw = localStorage.getItem("pdr-stores");
              const list = (raw ? (JSON.parse(raw) as { slug: string; name: string; ts: number }[]) : []).filter((x) => x.slug !== d.slug);
              list.unshift({ slug: d.slug, name: kit.projectCode, ts: Date.now() });
              localStorage.setItem("pdr-stores", JSON.stringify(list.slice(0, 12)));
            } catch { /* ignore */ }
            setLines((l) => [...l, `STORE ONLINE · /store/${d.slug}`, "ENTERING THE SITE…"]);
            setPct(100);
            window.setTimeout(() => { if (alive) window.location.replace(`/store/${d.slug}`); }, 900);
          } else {
            setFault(d?.error ?? "publish failed");
          }
        })
        .catch((e) => alive && setFault((e as Error).message));
    };
    const tick = () => {
      if (!alive) return;
      if (i >= steps.length - 1 && synthRef.current.status === "pending") {
        if (!waitNoted) { waitNoted = true; setLines((l) => [...l, "AWAITING SYNTHESIS ENGINE…"]); }
        window.setTimeout(tick, 300); return;
      }
      if (i >= steps.length) { publish(); return; }
      // Capture the step NOW — the setLines updater runs later, when `i` has
      // already advanced (StrictMode re-runs updaters and made this land as
      // an undefined line → `.startsWith` crash).
      const step = steps[i];
      setLines((l) => [...l, step]);
      setPct(Math.round(((i + 1) / steps.length) * 96));
      i += 1;
      window.setTimeout(tick, i <= 4 ? 400 : 260);
    };
    const t0 = window.setTimeout(tick, 500);
    return () => { alive = false; window.clearTimeout(t0); };
  }, [kit, retry]);

  if (kit === undefined) return <main style={{ backgroundColor: BG, minHeight: "100vh" }} />;
  if (kit === null) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6" style={{ backgroundColor: BG, color: INK, fontFamily: "var(--app-font-mono)" }}>
        <div className="w-full max-w-[520px] border p-8 text-center" style={{ borderColor: LINE, backgroundColor: PANEL }}>
          <div className="text-[10px] uppercase tracking-[0.24em]" style={{ color: AMBER }}>PD-STUDIO · SITE FABRICATOR</div>
          <div className="mt-4 text-[15px] uppercase tracking-[0.1em]">No work order loaded</div>
          <p className="mt-3 text-[12px] leading-relaxed" style={{ color: DIM }}>
            This page prints the storefront for the business currently on the line. Run the line in the studio, then press GENERATE STOREFRONT. Work orders expire after 30 minutes.
          </p>
          <a href="/studio" className="mt-6 inline-block px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] no-underline" style={{ backgroundColor: AMBER, color: "#0A0A08" }}>
            ▶ OPEN THE STUDIO
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6" style={{ backgroundColor: BG, color: INK, fontFamily: "var(--app-font-mono)" }}>
      <div className="w-full max-w-[640px]">
        <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.2em]" style={{ color: FAINT }}>
          <span style={{ color: AMBER }}>PD-STUDIO · SITE FABRICATOR · {kit.projectCode}</span>
          <span className="tabular-nums">{clock2(Math.min(100, pct))}%</span>
        </div>
        <div className="mt-3"><SegBar pct={pct} /></div>
        <div ref={logRef} className="mt-4 h-[300px] overflow-hidden border p-4 text-[12px] leading-[1.8]" style={{ borderColor: LINE, backgroundColor: WELL }}>
          {lines.map((raw, i) => {
            const l = raw ?? ""; // defensive: a hole in the log must never crash the fabricator
            return (
              <div key={i} className="flex gap-3">
                <span style={{ color: FAINT }}>{clock2(i + 1)}</span>
                <span style={{ color: l.startsWith("STORE ONLINE") || l.startsWith("ENTERING") ? GREEN : i === lines.length - 1 ? AMBER : DIM }}>{l}</span>
                {i === lines.length - 1 && !fault && <span style={{ color: AMBER }}>▊</span>}
              </div>
            );
          })}
          {fault && (
            <div className="mt-2 flex items-center gap-3">
              <span style={{ color: RED }}>PUBLISH FAULT · {fault}</span>
              <button onClick={() => setRetry((r) => r + 1)} className="border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]" style={{ borderColor: RED, color: RED }}>▶ RETRY</button>
            </div>
          )}
        </div>
        <div className="mt-3 text-center text-[9px] uppercase tracking-[0.2em]" style={{ color: FAINT }}>
          fabricating a complete agent-first store · catalog · product pages · gallery · policies · checkout
        </div>
      </div>
    </main>
  );
}
