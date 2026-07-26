import { NextResponse } from "next/server";
import { saveStore, slugify, type PublishedStore } from "@/lib/studio/storeRepo";
import type { StorefrontInput } from "@/lib/studio/aiStorefront";

/**
 * POST /api/store/publish — persists a fabricated storefront so it exists as
 * a server-rendered, agent-readable site at /store/[slug] (+ feed pack).
 * Input: { store: StorefrontInput, manifest?, source?, spec? } — the client
 * (the /studio/site fabricator) maps kit → StorefrontInput and posts it here.
 */

export const runtime = "nodejs";

function hash6(s: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 6);
}

export async function POST(req: Request) {
  let body: { store?: StorefrontInput; manifest?: PublishedStore["manifest"]; source?: string; spec?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const store = body.store;
  if (!store?.brand?.name || !store?.brand?.domain || !Array.isArray(store.products) || store.products.length === 0) {
    return NextResponse.json({ ok: false, error: "invalid store" }, { status: 400 });
  }
  // Inventory: every SKU launches with stock on hand (Ops Agent manages it).
  store.products = store.products.map((p) => ({ ...p, stock: p.stock ?? 24 }));
  const slug = slugify(store.brand.name, hash6(store.brand.domain + store.products.length));
  const published: PublishedStore = {
    slug,
    createdAt: new Date().toISOString(),
    source: body.source === "claude" ? "claude" : "stock",
    spec: typeof body.spec === "string" ? body.spec.slice(0, 300) : undefined,
    store,
    manifest: body.manifest ?? {},
  };
  try {
    await saveStore(published);
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    slug,
    urls: {
      store: `/store/${slug}`,
      feed: `/store/${slug}/feed.jsonl`,
      llms: `/store/${slug}/llms.txt`,
      catalog: `/store/${slug}/agent-catalog.json`,
      report: `/api/store/${slug}/report`,
    },
  });
}
