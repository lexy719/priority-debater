/**
 * Demo-store seed (Phase 6). Loads a realistic, fully-populated demo store so the
 * Command Center, product fix view, monitor and billing pages are explorable
 * before a real store connects. NEVER auto-seeded — the dashboard empty state
 * offers an explicit "LOAD DEMO STORE" action, and a persistent DEMO banner shows
 * while it is active. Idempotent: re-calling returns the existing demo store.
 */

import type { ContentStatus, ContentType, ProductScore, Store } from "./types";
import {
  createAttributionEvent,
  createContentItem,
  createCustomer,
  createFix,
  createProduct,
  createReturnRiskEvent,
  createScan,
  createStore,
  listStores,
  setModuleUnlock,
} from "./store";

export const DEMO_STORE_NAME = "Vela Studio";
const DEMO_URL = "https://velastudio.example";

export function isDemoStore(store: Pick<Store, "url" | "name"> | null): boolean {
  return !!store && store.url === DEMO_URL;
}

export function findDemoStore(): Store | null {
  return listStores().find((s) => s.url === DEMO_URL) ?? null;
}

/** Remove the demo store and every entity attached to it. */
export function clearDemoData(): void {
  if (typeof window === "undefined") return;
  const demo = findDemoStore();
  if (!demo) return;
  try {
    const raw = localStorage.getItem("pd-commerce-data");
    if (!raw) return;
    const db = JSON.parse(raw) as Record<string, unknown[]>;
    const keep = (arr: unknown[] | undefined) =>
      (arr ?? []).filter((row) => (row as { store_id?: string; id?: string }).store_id !== demo.id);
    db.stores = ((db.stores as { id: string }[]) ?? []).filter((s) => s.id !== demo.id);
    for (const k of [
      "products", "scans", "fixes", "attribution_events", "return_risk_events",
      "module_unlocks", "content_items", "customers", "autonomy_settings",
    ]) db[k] = keep(db[k] as unknown[]);
    localStorage.setItem("pd-commerce-data", JSON.stringify(db));
  } catch { /* ignore */ }
}

/* Demo catalog — a small candle/home-fragrance brand. Scores + € losses give the
   dashboard a believable red/blue/black spread sorted by impact. */
const DEMO_PRODUCTS: { title: string; handle: string; score: ProductScore; loss: number }[] = [
  { title: "Amber Noir Candle 220g", handle: "amber-noir-candle", score: "invisible", loss: 118 },
  { title: "Fig & Sea Salt Diffuser", handle: "fig-sea-salt-diffuser", score: "invisible", loss: 96 },
  { title: "Cedar Room Spray", handle: "cedar-room-spray", score: "invisible", loss: 74 },
  { title: "Linen Candle 3-Wick", handle: "linen-candle-3-wick", score: "at_risk", loss: 52 },
  { title: "Santal Votive Set (4)", handle: "santal-votive-set", score: "at_risk", loss: 43 },
  { title: "Bergamot Hand Cream", handle: "bergamot-hand-cream", score: "at_risk", loss: 31 },
  { title: "Oud Incense Cones", handle: "oud-incense-cones", score: "at_risk", loss: 24 },
  { title: "Matchstick Bottle", handle: "matchstick-bottle", score: "winning", loss: 0 },
  { title: "Wick Trimmer", handle: "wick-trimmer", score: "winning", loss: 0 },
  { title: "Candle Care Kit", handle: "candle-care-kit", score: "winning", loss: 6 },
  { title: "Gift Card", handle: "gift-card", score: "winning", loss: 0 },
  { title: "Seasonal Sampler Box", handle: "seasonal-sampler-box", score: "at_risk", loss: 38 },
];

function iso(daysAgo: number, hour = 12): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 24 - ((daysAgo * 7) % 50), 0, 0);
  return d.toISOString();
}

/**
 * Create (or return the existing) demo store with a full data set:
 * 12 products, 1 completed scan, 7 fixes, ~30 attribution events across two
 * billing periods, 4 return-risk events, module unlocks, 5 content items,
 * 8 customers. Deterministic enough to demo billing reconciliation.
 */
export function seedDemoData(): Store {
  const existing = findDemoStore();
  if (existing) return existing;

  const store = createStore({
    name: DEMO_STORE_NAME,
    url: DEMO_URL,
    platform: "generic",
    plan: "growth",
    user_id: null,
  });

  /* products — invisible ones get thin/empty descriptions so the fix diff view
     has real gaps to highlight; winning ones get complete content */
  const products = DEMO_PRODUCTS.map((p) => {
    const thin = p.score === "invisible";
    const description = thin
      ? p.title
      : `${p.title} — hand-poured in small batches from a coconut-soy wax blend. Clean burn, reusable vessel, recyclable packaging. Ships in 2–3 days from Porto.`;
    return createProduct({
      store_id: store.id,
      title: p.title,
      url: `${DEMO_URL}/products/${p.handle}`,
      external_id: p.handle,
      current_score: p.score,
      estimated_monthly_loss: p.loss,
      description,
      body_html: thin ? `<p>${p.title}</p>` : `<p>${description}</p>`,
    });
  });

  /* one completed scan with a realistic result payload */
  createScan({
    store_id: store.id,
    status: "complete",
    result: {
      url: DEMO_URL,
      estimated_monthly_loss: DEMO_PRODUCTS.reduce((s, p) => s + p.loss, 0),
      providers: {
        chatgpt: { checked: 12, cited: 4, status: "ok" },
        gemini: { checked: 12, cited: 3, status: "ok" },
        perplexity: { checked: 12, cited: 5, status: "ok" },
      },
      verdicts: {
        invisible: DEMO_PRODUCTS.filter((p) => p.score === "invisible").length,
        at_risk: DEMO_PRODUCTS.filter((p) => p.score === "at_risk").length,
        winning: DEMO_PRODUCTS.filter((p) => p.score === "winning").length,
      },
      demo: true,
    },
    completed_at: iso(21),
  });

  /* fixes — mix of draft / pushed / rejected across the worst products */
  const fixSpecs: { i: number; type: string; title: string; status: "draft" | "pushed" | "rejected" }[] = [
    { i: 0, type: "description", title: "Rewrite Amber Noir description with scent notes + burn time", status: "draft" },
    { i: 1, type: "structured_data", title: "Add Product JSON-LD to Fig & Sea Salt Diffuser", status: "draft" },
    { i: 2, type: "description", title: "Cedar Room Spray: add ingredients + room-size guidance", status: "draft" },
    { i: 3, type: "structured_data", title: "Add GTIN + availability schema to Linen 3-Wick", status: "pushed" },
    { i: 4, type: "description", title: "Santal Votive Set: name the fragrance family explicitly", status: "pushed" },
    { i: 5, type: "meta", title: "Bergamot Hand Cream: rewrite meta title/description", status: "pushed" },
    { i: 11, type: "description", title: "Sampler Box: list every included scent by name", status: "rejected" },
  ];
  const fixes = fixSpecs.map((f) =>
    createFix({
      store_id: store.id,
      product_id: products[f.i].id,
      type: f.type,
      title: f.title,
      description:
        "Generated fix (demo): rewrites the missing content the AI agents could not read — specific attributes, materials and use-cases in the merchant's voice.",
      status: f.status,
    }),
  );

  /* attribution events — ~30 across the current + previous period.
     Layers 1/2 billable, a few layer 3 shown as directional-only. */
  const sources = ["chatgpt", "perplexity", "gemini"];
  let order = 1041;
  for (let k = 0; k < 30; k++) {
    const daysAgo = 2 + Math.floor(k * 1.9); // spread ~2–58 days back
    const layer = k % 5 === 4 ? 3 : k % 3 === 2 ? 2 : 1;
    const productIdx = [3, 4, 5, 7, 8, 9, 10][k % 7];
    createAttributionEvent({
      store_id: store.id,
      product_id: products[productIdx].id,
      fix_id: layer === 1 ? fixes[3 + (k % 3)].id : null,
      order_id: `#${order++}`,
      layer,
      incremental_revenue: [34, 58, 22, 79, 41, 65, 28][k % 7] + (k % 4) * 3,
      source: sources[k % 3],
      occurred_at: iso(daysAgo),
    });
  }

  /* return-risk events */
  const riskSpecs: { i: number; risk: "low" | "medium" | "high"; p: number; reason: string }[] = [
    { i: 0, risk: "high", p: 0.42, reason: "Scent intensity unclear — buyers report 'stronger than expected'" },
    { i: 3, risk: "medium", p: 0.24, reason: "No burn-time guidance on listing" },
    { i: 5, risk: "medium", p: 0.21, reason: "Size (50ml vs 100ml) ambiguous in photos" },
    { i: 11, risk: "low", p: 0.09, reason: "Occasional 'expected more items' feedback" },
  ];
  riskSpecs.forEach((r, k) =>
    createReturnRiskEvent({
      store_id: store.id,
      product_id: products[r.i].id,
      order_id: `#${1020 + k}`,
      risk: r.risk,
      probability: r.p,
      reason: r.reason,
    }),
  );

  /* module unlocks — §1.6 thresholds: core live, growth modules partially */
  setModuleUnlock(store.id, "visibility", true);
  setModuleUnlock(store.id, "fixes", true);
  setModuleUnlock(store.id, "attribution", true);
  setModuleUnlock(store.id, "content", true); // growth tier, immediate (§1.6)
  setModuleUnlock(store.id, "return_risk", false); // needs 30d + 10 returns
  setModuleUnlock(store.id, "autonomy", false); // opt-in track record required

  /* content items — the Studio queue lane */
  const contentSpecs: { title: string; type: ContentType; status: ContentStatus; i: number | null }[] = [
    { title: "IG post — Amber Noir is back in stock", type: "image", status: "draft", i: 0 },
    { title: "Email — 'What burns 60 hours?' (Linen 3-Wick fix follow-up)", type: "text", status: "draft", i: 3 },
    { title: "Buyer's guide — choosing a diffuser by room size", type: "text", status: "scheduled", i: 1 },
    { title: "Product video — Santal Votive Set 360°", type: "video", status: "draft", i: 4 },
    { title: "FAQ block — candle care essentials", type: "text", status: "published", i: 9 },
  ];
  contentSpecs.forEach((c) =>
    createContentItem({
      store_id: store.id,
      product_id: c.i === null ? null : products[c.i].id,
      type: c.type,
      title: c.title,
      body: "Draft generated from a store signal (demo content).",
      status: c.status,
      scheduled_for: c.status === "scheduled" ? iso(-3) : null,
      published_at: c.status === "published" ? iso(9) : null,
    }),
  );

  /* customers — thin segment layer */
  const names = ["Maria S.", "Joana P.", "Tiago R.", "Ana L.", "Pedro M.", "Inês C.", "Rui F.", "Carla V."];
  names.forEach((name, k) =>
    createCustomer({
      store_id: store.id,
      external_id: `cust_${1000 + k}`,
      email: `${name.split(" ")[0].toLowerCase()}@example.com`,
      name,
      ltv: 40 + k * 27,
    }),
  );

  return store;
}
