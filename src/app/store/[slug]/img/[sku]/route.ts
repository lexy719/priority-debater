import { loadStore } from "@/lib/studio/storeRepo";

/**
 * Deterministic brand-palette product art — /store/[slug]/img/[sku].svg
 *
 * Every SKU gets a machined geometric composition derived from its hash and
 * the brand palette, so the catalog/gallery/feed have real image URLs today.
 * This is the placeholder lane Higgsfield replaces later (photoreal renders);
 * the URLs stay stable so the swap is invisible.
 */

export const dynamic = "force-dynamic";

function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string; sku: string }> }) {
  const { slug, sku } = await params;
  const skuId = sku.replace(/\.svg$/, "");
  const s = await loadStore(slug);
  const p = s?.store.products.find((x) => x.sku === skuId);
  if (!s || !p) return new Response("not found", { status: 404 });
  const b = s.store.brand;
  const h = hash(skuId);
  const pick = (n: number) => [b.accent, b.ink, b.surface, `${b.ink}55`][n % 4];

  // 3 layered shapes + product initials — same sku, same art, forever.
  const shapes = Array.from({ length: 3 }, (_, i) => {
    const r = (h >> (i * 7)) & 127;
    const x = 40 + (r % 320), y = 40 + ((r * 13) % 220), w = 60 + ((r * 7) % 180);
    return (h >> i) % 2 === 0
      ? `<rect x="${x}" y="${y}" width="${w}" height="${w * 0.62}" fill="${pick(i + (h % 2))}" opacity="${i === 0 ? 1 : 0.85}"/>`
      : `<circle cx="${x + w / 2}" cy="${y + w / 3}" r="${w / 2.6}" fill="${pick(i + 1 + (h % 2))}" opacity="${i === 0 ? 1 : 0.85}"/>`;
  }).join("");
  const initials = p.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" width="480" height="360">
  <rect width="480" height="360" fill="${b.bg}"/>
  <rect x="12" y="12" width="456" height="336" fill="none" stroke="${b.ink}22" stroke-width="1"/>
  ${shapes}
  <rect x="24" y="288" width="200" height="48" fill="${b.bg}" opacity="0.92"/>
  <text x="34" y="312" font-family="ui-monospace, Menlo, monospace" font-size="13" font-weight="700" fill="${b.ink}">${initials} · ${skuId.slice(0, 18)}</text>
  <text x="34" y="328" font-family="ui-monospace, Menlo, monospace" font-size="9" letter-spacing="2" fill="${b.ink}90">${b.name} · STUDIO ART</text>
</svg>`;
  return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600", "access-control-allow-origin": "*" } });
}
