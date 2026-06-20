/**
 * Pull a few REAL products from a Shopify storefront (the public
 * `/products.json` endpoint) so generated schema and feeds use the merchant's
 * actual catalogue — not placeholders. Keyless and best-effort: any failure
 * returns an empty list and the generators fall back to editable templates.
 */

export interface ShopProduct {
  title: string;
  handle: string;
  url: string;
  price: string;
  available: boolean;
  image?: string;
  description: string;
  vendor?: string;
  productType?: string;
}

import { decodeEntities } from "@/lib/commerce/store-profile";

const UA = "Mozilla/5.0 (compatible; PriorityDebaterAuditBot/1.0)";

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

export async function fetchShopifyProducts(origin: string, limit = 6): Promise<ShopProduct[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(`${origin}/products.json?limit=${limit}`, {
      signal: ctrl.signal,
      cache: "no-store",
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      products?: Array<{
        title?: string;
        handle?: string;
        body_html?: string;
        vendor?: string;
        product_type?: string;
        variants?: Array<{ price?: string; available?: boolean }>;
        images?: Array<{ src?: string }>;
      }>;
    };
    return (data.products ?? []).slice(0, limit).map((p) => ({
      title: p.title ?? "Untitled product",
      handle: p.handle ?? "",
      url: `${origin}/products/${p.handle ?? ""}`,
      price: p.variants?.[0]?.price ?? "0.00",
      available: p.variants?.some((v) => v.available) ?? true,
      image: p.images?.[0]?.src,
      description: stripHtml(p.body_html ?? ""),
      vendor: p.vendor,
      productType: p.product_type,
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
