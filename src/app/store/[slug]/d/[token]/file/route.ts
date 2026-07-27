import { loadArtefact } from "@/lib/studio/artefactRepo";
import { claimDelivery, loadDelivery } from "@/lib/studio/deliveryRepo";

/**
 * GET /store/[slug]/d/[token]/file — the deliverable as a real download.
 *
 * The delivery page is for reading; this is for keeping. Same token, same
 * claim accounting, served as Markdown so it opens anywhere and stays readable
 * to a person and to an agent alike.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await params;
  const d = await loadDelivery(slug, token);
  if (!d) return new Response("not found", { status: 404 });
  const a = await loadArtefact(slug, d.sku);
  if (!a) return new Response("nothing produced for this order", { status: 404 });
  await claimDelivery(slug, token);

  const name = `${a.sku}.md`;
  return new Response(a.body, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "no-store",
    },
  });
}
