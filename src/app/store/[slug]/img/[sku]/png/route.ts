import { createElement } from "react";
import { ImageResponse } from "next/og";
import { loadStore } from "@/lib/studio/storeRepo";

/**
 * Raster product art — /store/[slug]/img/[sku]/png
 *
 * The SVG lane next door is fine for our own pages, but **Google Merchant
 * Center, Meta's catalogue and every shopping-ads surface reject SVG outright**
 * (JPEG · PNG · GIF · BMP · TIFF · WebP only). A feed pointing at .svg is
 * disapproved item by item, so the feeds point here instead.
 *
 * Deliberately geometric and text-free: Merchant Center prohibits promotional
 * overlays, watermarks and borders on product imagery. This is honest
 * placeholder art in the brand's own palette — it makes the feed FORMAT-valid.
 * Approval still needs a photograph of the actual product, which is the lane
 * Higgsfield (or the merchant's own photography) fills. The URL never changes,
 * so that swap is invisible to every feed already submitted.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string; sku: string }> }) {
  const { slug, sku } = await params;
  const skuId = sku.replace(/\.(png|jpg|jpeg)$/, "");
  const s = await loadStore(slug);
  const p = s?.store.products.find((x) => x.sku === skuId);
  if (!s || !p) return new Response("not found", { status: 404 });

  const b = s.store.brand;
  const h = hash(skuId);
  const palette = [b.accent, b.ink, b.bg, b.surface ?? b.bg].filter(Boolean) as string[];
  const pick = (n: number) => palette[n % palette.length];

  // Three layered forms, seeded by the sku — same product, same art, forever.
  const shapes = Array.from({ length: 3 }, (_, i) => {
    const r = (h >> (i * 7)) & 127;
    const size = 180 + ((r * 7) % 380);
    const round = (h >> i) % 2 === 0 ? 0 : 9999;
    return createElement("div", {
      key: i,
      style: {
        position: "absolute",
        left: 60 + (r % 520),
        top: 40 + ((r * 13) % 380),
        width: size,
        height: (h >> (i + 3)) % 2 === 0 ? size : size * 0.62,
        backgroundColor: pick(i + (h % 2)),
        opacity: i === 0 ? 1 : 0.82,
        borderRadius: round,
      },
    });
  });

  return new ImageResponse(
    createElement(
      "div",
      {
        style: {
          display: "flex",
          position: "relative",
          width: "100%",
          height: "100%",
          backgroundColor: b.bg ?? "#111111",
          overflow: "hidden",
        },
      },
      ...shapes,
    ),
    {
      width: 1200,
      height: 1200, // square: what Merchant Center and Meta both prefer
      headers: { "cache-control": "public, max-age=86400, stale-while-revalidate=604800" },
    },
  );
}
