/**
 * GET /api/commerce/connect/shopify/start?shop=my-shop.myshopify.com
 *
 * Builds the Shopify OAuth authorize URL and 302-redirects to it. The OAuth
 * state nonce rides in an httpOnly cookie for the callback's CSRF check.
 * Connectivity is free/bundled — no auth wall, no credits (§1.3).
 */

import { NextResponse } from "next/server";
import {
  buildAuthorizeUrl,
  generateOAuthState,
  normalizeShopDomain,
  shopifyConfigured,
} from "@/lib/commerce/connectors/shopify";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const shop = normalizeShopDomain(url.searchParams.get("shop"));
  if (!shop) {
    return NextResponse.redirect(
      new URL("/commerce/connect?platform=shopify&error=invalid_shop", url.origin),
    );
  }
  if (!shopifyConfigured()) {
    return NextResponse.redirect(
      new URL("/commerce/connect?platform=shopify&error=not_configured", url.origin),
    );
  }

  const state = generateOAuthState();
  const redirectUri = `${url.origin}/api/commerce/connect/shopify/callback`;
  const authorize = buildAuthorizeUrl(shop, redirectUri, state);
  if (!authorize.ok) {
    return NextResponse.redirect(
      new URL(`/commerce/connect?platform=shopify&error=${authorize.reason}`, url.origin),
    );
  }

  const res = NextResponse.redirect(authorize.url);
  res.cookies.set("pd_shopify_oauth_state", state, {
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
