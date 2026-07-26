import { loadStore } from "@/lib/studio/storeRepo";

/** sitemap.xml for the published store — every page, agent-crawlable. */
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await loadStore(slug);
  if (!s) return new Response("not found", { status: 404 });
  const origin = new URL(req.url).origin;
  const base = `${origin}/store/${slug}`;
  const urls = [
    base, `${base}/gallery`, `${base}/about`, `${base}/shipping`, `${base}/terms`, `${base}/checkout`,
    ...s.store.products.map((p) => `${base}/p/${p.sku}`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "no-store" } });
}
