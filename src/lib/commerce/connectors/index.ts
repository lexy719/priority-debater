/**
 * Connector registry (Phase 8) — one lookup for the stateless API routes.
 * BigCommerce has no native connector yet; it degrades to the generic
 * export-mode connector per the §0.1 graceful-degradation table.
 */

import type { Platform } from "../data/types";
import type { CommerceConnector } from "./types";
import { genericConnector } from "./generic";
import { shopifyConnector } from "./shopify";
import { wooCommerceConnector } from "./woocommerce";

export function connectorFor(platform: Platform): CommerceConnector {
  switch (platform) {
    case "shopify":
      return shopifyConnector;
    case "woo":
      return wooCommerceConnector;
    case "bigcommerce":
    case "generic":
      return genericConnector;
  }
}
