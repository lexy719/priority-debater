import { NextResponse } from "next/server";
import { recordActivity } from "@/lib/studio/activityRepo";
import { currentOwnerId } from "@/lib/commerce/owner";
import { connectorFor } from "@/lib/commerce/connectors";
import type { ConnectorOrder, ConnectorProduct } from "@/lib/commerce/connectors/types";
import type { StoreProduct } from "@/lib/studio/aiStorefront";
import {
  listConnectedFor, loadConnected, loadSecret, priceNumber, saveConnected, saveSecret,
  type ConnectedBusiness, type ConnectedPlatform,
} from "@/lib/studio/connectedRepo";
import { orderId, saveOrder, type StoreOrder } from "@/lib/studio/orderRepo";
import { listStoresFor, recordOwnership, slugify } from "@/lib/studio/storeRepo";

/**
 * POST /api/commerce/connect/sync — bring a store PDR does not host under
 * management, and keep it current.
 *
 * First call: {platform, domain, accessToken, siteUrl, name?} connects it.
 * Later calls: {slug} re-syncs.
 *
 * The platform's catalogue is normalised into PDR's own product shape and
 * cached, so every existing worker reads it without knowing the difference. Two
 * things are deliberate:
 *  · Products keep their CANONICAL URL on the merchant's domain. We publish an
 *    agent layer for their shop; we never mirror their shop.
 *  · The connection is READ-ONLY until the merchant grants write scopes. Until
 *    then Operations and Products propose rather than act, and say so.
 */

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const PLATFORMS: ConnectedPlatform[] = ["shopify", "woo", "bigcommerce", "generic"];

/** A platform product, in the shape the rest of Commerce already speaks. */
function toStoreProduct(p: ConnectorProduct, i: number): StoreProduct {
  const value = priceNumber(p.price);
  return {
    name: p.title || `Item ${i + 1}`,
    description: (p.description || "").slice(0, 400),
    price: value != null ? `€${value}` : (p.price ?? "—"),
    ...(value != null ? { priceValue: value } : {}),
    currency: "EUR",
    // A generic connector hands back the product URL as its handle; the last
    // path segment is the sku a human would recognise.
    sku: (((p.handle || p.external_id || "").split("?")[0].replace(/\/+$/, "").split("/").pop() || `item-${i + 1}`)
      .toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64)) || `item-${i + 1}`,
    category: p.product_type || "Product",
    // A live platform reports availability per variant; until we read variants,
    // "active" is the only honest signal, and stock stays unknown rather than
    // invented — an unknown count must never masquerade as a shelf.
    availability: (p.status ?? "active") === "active" ? "InStock" : "OutOfStock",
    url: p.url || undefined,
  };
}

/** A platform order, mapped onto the ledger every worker already reads. */
function toStoreOrder(slug: string, o: ConnectorOrder): StoreOrder {
  // Shopify's own channel metadata is the ground truth for attribution: an
  // agentic checkout tags itself. Anything else is a human until proven not.
  const src = (o.source_name ?? "").toLowerCase();
  const tags = o.tags.map((t) => t.toLowerCase());
  const agentish = /gpt|openai|claude|perplexity|agent|assistant/;
  const agent = agentish.test(src) ? o.source_name!
    : tags.find((t) => agentish.test(t))?.toUpperCase() ?? "HUMAN";
  return {
    id: `EXT-${o.external_id}`.slice(0, 40),
    slug,
    ts: o.created_at ?? new Date().toISOString(),
    sku: "", productName: o.name || `Order ${o.external_id}`,
    price: `${o.total_price} ${o.currency}`,
    total: o.total_price,
    qty: 1,
    buyer: { name: "—", email: "—", address: "—" },
    channel: agent === "HUMAN" ? "web-form" : "agent-json",
    agent,
    status: "received",
  };
}

export async function POST(req: Request) {
  let body: { slug?: string; platform?: string; domain?: string; accessToken?: string; siteUrl?: string; name?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }

  const ownerId = await currentOwnerId();
  let biz = body.slug ? await loadConnected(String(body.slug)) : null;

  // ── first connection ──────────────────────────────────────────────────────
  if (!biz) {
    const platform = String(body.platform ?? "") as ConnectedPlatform;
    const domain = String(body.domain ?? "").replace(/^https?:\/\//, "").replace(/\/+$/, "");
    const siteUrl = String(body.siteUrl ?? `https://${domain}`).replace(/\/+$/, "");
    if (!PLATFORMS.includes(platform) || !domain) {
      return NextResponse.json({ ok: false, error: "platform and domain are required" }, { status: 400 });
    }
    const mark = (body.name ?? domain.split(".")[0]).replace(/[^A-Za-z0-9 ]/g, "").trim() || "STORE";
    const slug = slugify(mark, domain);
    biz = {
      slug, ...(ownerId ? { ownerId } : {}),
      platform, domain, siteUrl,
      brand: {
        name: mark.toUpperCase().slice(0, 14), fullName: mark, domain: siteUrl.replace(/^https?:\/\//, ""),
        oneLiner: `${mark} — connected ${platform} store operated through PDR Commerce`,
        ink: "#111111", bg: "#FFFFFF", surface: "#F4F4F4", accent: "#0047FF", onAccent: "#FFFFFF",
      },
      products: [], createdAt: new Date().toISOString(), lastSyncedAt: null,
      scopes: { read: true, write: false },
      syncNote: null,
    };
    await saveSecret(slug, { platform, domain, accessToken: body.accessToken ?? null });
    await recordOwnership(ownerId, slug);
  }

  // ── pull the catalogue (and orders, where the platform allows) ────────────
  const secret = await loadSecret(biz.slug);
  const ref = { platform: biz.platform, domain: biz.domain, accessToken: secret?.accessToken ?? null };
  const connector = connectorFor(biz.platform);

  const cat = await connector.readCatalog(ref);
  if (!cat.ok) {
    biz.syncNote = `catalogue not read — ${cat.reason}${cat.detail ? `: ${cat.detail}` : ""}`;
    await saveConnected(biz);
    return NextResponse.json({ ok: false, slug: biz.slug, error: biz.syncNote }, { status: 502 });
  }
  biz.products = cat.products.map(toStoreProduct);
  biz.lastSyncedAt = new Date().toISOString();
  biz.syncNote = null;

  let ordersPulled = 0;
  if (connector.capabilities.canReadOrders) {
    const ord = await connector.readOrderMetadata(ref, null);
    if (ord.ok) {
      for (const o of ord.orders) {
        try { await saveOrder(toStoreOrder(biz.slug, o)); ordersPulled++; } catch { /* one bad row must not stop the sync */ }
      }
    } else {
      biz.syncNote = `catalogue synced; orders not read — ${ord.reason}`;
    }
  }

  await saveConnected(biz);
  await recordActivity(biz.slug, "SYSTEM",
    `Synced from ${biz.platform} (${biz.domain}) — ${biz.products.length} product(s)${ordersPulled ? `, ${ordersPulled} order(s)` : ""}${biz.scopes.write ? "" : " · read-only connection"}`,
    "auto");

  return NextResponse.json({
    ok: true, slug: biz.slug, platform: biz.platform, products: biz.products.length,
    orders: ordersPulled, lastSyncedAt: biz.lastSyncedAt, scopes: biz.scopes, note: biz.syncNote,
    agentLayer: {
      feedJsonl: `/store/${biz.slug}/feed.jsonl`,
      feedTsv: `/store/${biz.slug}/feed.tsv`,
      mcp: `/store/${biz.slug}/mcp`,
      sellerRecord: `/store/${biz.slug}/.well-known/seller-record.json`,
    },
  });
}

/** GET — the connected stores in this register. With ?slug=, just that one. */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!slug) {
    const ownerId = await currentOwnerId();
    const roster = await listStoresFor(ownerId);
    const connected = await listConnectedFor(roster.map((r) => r.slug));
    return NextResponse.json({
      ok: true,
      connected: connected.map((c) => ({
        slug: c.slug, platform: c.platform, domain: c.domain, siteUrl: c.siteUrl,
        name: c.brand.fullName, products: c.products.length,
        lastSyncedAt: c.lastSyncedAt, scopes: c.scopes, syncNote: c.syncNote,
      })),
    }, { headers: { "cache-control": "no-store" } });
  }
  const biz = await loadConnected(slug);
  if (!biz) return NextResponse.json({ ok: false, error: "not connected" }, { status: 404 });
  return NextResponse.json({
    ok: true,
    business: { ...biz, products: biz.products.length },
  }, { headers: { "cache-control": "no-store" } });
}
