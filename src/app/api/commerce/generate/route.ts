import { fetchStoreProfile } from "@/lib/commerce/store-profile";
import { normalizeUrl } from "@/lib/commerce/audit-scoring";
import { fetchShopifyProducts } from "@/lib/commerce/shopify";
import { buildArtifacts } from "@/lib/commerce/generators";
import { guardAndSpend, guardFailResponse, refund } from "@/lib/credits/server";

/**
 * POST /api/commerce/generate — build the installable fix artifacts for a store.
 *
 * Costs credits (commerce_toolkit). The "re-check my store" call (recheck:true)
 * re-runs verification for free. Keyless under the hood, so it works regardless
 * of AI provider quota.
 */
export async function POST(request: Request) {
  let body: { url?: string; recheck?: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const normalized = normalizeUrl(String(body.url ?? ""));
  if (!normalized) {
    return Response.json({ error: "Enter a valid store URL (e.g. your-store.com)." }, { status: 400 });
  }

  // First generation costs credits; a re-check (verify-only) is free.
  const charge = body.recheck !== true;
  if (charge) {
    const guard = await guardAndSpend("commerce_toolkit");
    if (!guard.ok) return guardFailResponse(guard);
  }

  try {
    const profile = await fetchStoreProfile(normalized.url, normalized.host);
    const products =
      profile.signals.platform === "shopify" ? await fetchShopifyProducts(profile.origin, 50) : [];
    return Response.json({
      url: profile.url,
      host: profile.host,
      storeName: profile.name,
      category: profile.category,
      reachable: profile.reachable,
      platform: profile.signals.platform,
      productsFound: products.length,
      artifacts: buildArtifacts(profile, products),
    });
  } catch (error) {
    if (charge) await refund("commerce_toolkit");
    const message = error instanceof Error ? error.message : "Generation failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
