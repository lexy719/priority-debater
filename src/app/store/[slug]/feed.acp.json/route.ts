import { acpFeed } from "@/lib/commerce/channels";
import { recordHit } from "@/lib/studio/hitRepo";
import { loadStore } from "@/lib/studio/storeRepo";

/**
 * GET /store/[slug]/feed.acp.json — the catalogue in OpenAI's Agentic Commerce
 * field names (item_id, is_eligible_checkout, seller_tos, …).
 *
 * OpenAI does not fetch this. Their feed is an SFTP push to an endpoint issued
 * during merchant onboarding, so this URL exists so the operator can see the
 * exact file, check it, and push it once they are onboarded — and so PDR can
 * validate its own catalogue against the spec rather than assuming it complies.
 *
 * Retired products are excluded. Anything out of stock ships with
 * is_eligible_checkout false: advertising a purchase that would fail is how a
 * merchant gets suspended, and it is a lie besides.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await loadStore(slug);
  if (!s) return new Response("not found", { status: 404 });
  await recordHit(slug, "feed", `/store/${slug}/feed.acp.json`, req.headers.get("user-agent"));

  const origin = new URL(req.url).origin;
  const items = acpFeed(s, origin);
  const body = JSON.stringify({
    spec: "openai.agentic-commerce.product-feed",
    generated_at: new Date().toISOString(),
    seller: { name: s.store.brand.fullName, url: `${origin}/store/${slug}` },
    count: items.length,
    items,
  }, null, 2);

  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-robots-tag": "noindex",
    },
  });
}
