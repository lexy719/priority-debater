import { recordHit } from "@/lib/studio/hitRepo";
import { buildFeedJsonl, loadStore } from "@/lib/studio/storeRepo";

/** Google Merchant-style JSONL product feed for the published store. */
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await loadStore(slug);
  if (!s) return new Response("not found", { status: 404 });
  await recordHit(slug, "feed", `/store/${slug}/feed.jsonl`, req.headers.get("user-agent"));
  const origin = new URL(req.url).origin;
  return new Response(buildFeedJsonl(s, origin), {
    headers: { "content-type": "application/jsonl; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" },
  });
}
