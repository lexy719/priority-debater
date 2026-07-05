/**
 * GET /api/commerce/connect/shopify/callback — Shopify OAuth callback (Phase 8).
 *
 * Verifies the state cookie (CSRF) + Shopify's HMAC, exchanges the code for a
 * permanent Admin token, then redirects to /commerce/connect with the token in
 * the fragment-free query for the CLIENT to persist into its credentials store.
 *
 * SECURITY TODO (matches connectors/types.ts contract): passing the token
 * through a redirect is acceptable only for the current localStorage
 * architecture. When Supabase persistence lands, the token is stored
 * server-side here and only a store_id crosses the wire.
 */

import { NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  normalizeShopDomain,
  verifyCallbackHmac,
} from "@/lib/commerce/connectors/shopify";

export const runtime = "nodejs";

function fail(origin: string, error: string): NextResponse {
  const res = NextResponse.redirect(new URL(`/commerce/connect?platform=shopify&error=${error}`, origin));
  res.cookies.delete("pd_shopify_oauth_state");
  return res;
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const q = url.searchParams;

  const shop = normalizeShopDomain(q.get("shop"));
  const code = q.get("code") ?? "";
  const state = q.get("state") ?? "";
  const cookieState = req.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)pd_shopify_oauth_state=([^;]+)/)?.[1];

  if (!shop || !code) return fail(url.origin, "invalid_callback");
  if (!state || !cookieState || state !== cookieState) return fail(url.origin, "state_mismatch");

  const hmac = verifyCallbackHmac(q);
  if (!hmac.ok) return fail(url.origin, hmac.reason);

  const token = await exchangeCodeForToken(shop, code);
  if (!token.ok) return fail(url.origin, token.reason);

  const dest = new URL("/commerce/connect", url.origin);
  dest.searchParams.set("platform", "shopify");
  dest.searchParams.set("shop", shop);
  dest.searchParams.set("token", token.accessToken);
  const res = NextResponse.redirect(dest);
  res.cookies.delete("pd_shopify_oauth_state");
  return res;
}
