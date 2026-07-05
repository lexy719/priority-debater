"use client";

/**
 * Attribution sync — layers 1 & 2 (§1.5), client-side classifier (Phase 11).
 *
 * Pulls orders via POST /api/commerce/orders (stateless connector proxy) and
 * classifies each into the attribution ledger:
 *   Layer 1 — direct agent-checkout signal: order source/tags/note_attributes
 *             carry an AI-agent marker (ground truth, no estimation).
 *   Layer 2 — referral match: landing/referring site is an AI surface
 *             (chatgpt.com, perplexity.ai, gemini.google.com, copilot.microsoft.com).
 *   Anything else is NOT recorded — layer 3 estimates are a separate, never-
 *   billed view and are not fabricated from order data.
 *
 * Every event stores the REAL order id (§1.5 transparency requirement).
 * Dedupes against existing events by order_id.
 */

import type { ConnectorOrder, ConnectorStoreRef } from "./connectors/types";
import type { Store } from "./data/types";
import { createAttributionEvent, listAttributionEvents } from "./data/store";

const AGENT_MARKERS = /(chatgpt|openai|copilot|gemini|perplexity|ucp|agentic|ai[-_ ]?agent)/i;
const AI_REFERRERS = /(chatgpt\.com|chat\.openai\.com|perplexity\.ai|gemini\.google\.com|copilot\.microsoft\.com)/i;

export function classifyOrder(o: ConnectorOrder): { layer: 1 | 2; source: string } | null {
  const l1Haystack = [o.source_name ?? "", ...o.tags, ...o.note_attributes.map((a) => `${a.name}=${a.value}`)].join(" ");
  const l1 = l1Haystack.match(AGENT_MARKERS);
  if (l1) return { layer: 1, source: l1[1].toLowerCase() };

  const l2Haystack = `${o.referring_site ?? ""} ${o.landing_site ?? ""}`;
  const l2 = l2Haystack.match(AI_REFERRERS);
  if (l2) {
    const host = l2[1].toLowerCase();
    const source = host.includes("openai") || host.includes("chatgpt") ? "chatgpt"
      : host.includes("perplexity") ? "perplexity"
      : host.includes("gemini") ? "gemini"
      : "copilot";
    return { layer: 2, source };
  }
  return null;
}

export interface SyncResult {
  ok: boolean;
  detail?: string;
  ordersSeen: number;
  eventsCreated: number;
}

export async function syncAttribution(store: Store, ref: ConnectorStoreRef): Promise<SyncResult> {
  const existing = listAttributionEvents(store.id);
  const known = new Set(existing.map((e) => e.order_id));
  // Incremental: only ask for orders since the newest event we already have.
  const since = existing.length
    ? existing.map((e) => e.occurred_at).sort().at(-1)!
    : null;

  const res = await fetch("/api/commerce/orders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ref, since }),
  }).then((r) => r.json()).catch(() => null);

  if (!res?.ok) {
    return { ok: false, detail: res?.detail ?? "Order sync failed.", ordersSeen: 0, eventsCreated: 0 };
  }

  const orders = res.orders as ConnectorOrder[];
  let created = 0;
  for (const o of orders) {
    const orderId = o.name || o.external_id;
    if (known.has(orderId)) continue;
    const cls = classifyOrder(o);
    if (!cls) continue;
    createAttributionEvent({
      store_id: store.id,
      product_id: null, // order→product mapping needs line items; not claimed when unknown
      fix_id: null,
      order_id: orderId,
      layer: cls.layer,
      incremental_revenue: o.total_price,
      source: cls.source,
      occurred_at: o.created_at,
    });
    known.add(orderId);
    created++;
  }
  return { ok: true, ordersSeen: orders.length, eventsCreated: created };
}
