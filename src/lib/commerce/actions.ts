/**
 * Today's Actions aggregator (§1.7 / §4.4) + restock velocity model (§12.3).
 *
 * Pure client-side derivation over the localStorage repo snapshot: every module
 * contributes actionable items into ONE ranked list — draft fixes by € impact,
 * draft content approvals, restock warnings from AI-attributed sales velocity,
 * high return-risk flags. The merchant works from one list, not module tabs.
 * Reused by both /commerce/dashboard and /commerce/monitor.
 */

import type {
  AttributionEvent,
  ContentItem,
  Fix,
  Product,
  ReturnRiskEvent,
} from "./data/types";

export type ActionKind = "fix" | "content" | "restock" | "return_risk";

export interface TodayAction {
  id: string;
  kind: ActionKind;
  /** Ranking weight — € impact where known, else a comparable heuristic. */
  impact: number;
  /** Mono figure shown on the row, e.g. "€118/MO" or "~9 DAYS". */
  figure: string;
  title: string;
  /** Verb CTA label, e.g. "Review fix". */
  cta: string;
  href: string;
  productId: string | null;
  contentId: string | null;
}

export interface RestockSignal {
  product: Product;
  /** AI-attributed orders in the window. */
  attributedOrders: number;
  /** Plain-language estimate, e.g. "at this rate, sold out in ~9 days". */
  estimate: string;
  daysToStockout: number;
}

const RESTOCK_WINDOW_DAYS = 14;
/** §1.6 threshold: restock signals need ≥5 attributed orders in the window. */
const RESTOCK_MIN_ORDERS = 5;
/** Advisory stock assumption when no inventory feed exists (stated in the UI). */
const ASSUMED_STOCK_UNITS = 25;

/**
 * §12.3 simple velocity model over attribution_events: AI-attributed order
 * rate per product vs. an assumed stock level. Explicitly advisory.
 */
export function restockSignals(products: Product[], events: AttributionEvent[]): RestockSignal[] {
  const cutoff = Date.now() - RESTOCK_WINDOW_DAYS * 86_400_000;
  const counts = new Map<string, number>();
  for (const e of events) {
    if (!e.product_id) continue;
    if (Date.parse(e.occurred_at) < cutoff) continue;
    counts.set(e.product_id, (counts.get(e.product_id) ?? 0) + 1);
  }
  const signals: RestockSignal[] = [];
  for (const p of products) {
    const n = counts.get(p.id) ?? 0;
    if (n < RESTOCK_MIN_ORDERS) continue;
    const perDay = n / RESTOCK_WINDOW_DAYS;
    const days = Math.max(1, Math.round(ASSUMED_STOCK_UNITS / perDay));
    if (days > 30) continue; // only warn when it's actually close
    signals.push({
      product: p,
      attributedOrders: n,
      daysToStockout: days,
      estimate: `at this rate, sold out in ~${days} days`,
    });
  }
  return signals.sort((a, b) => a.daysToStockout - b.daysToStockout);
}

export function buildTodaysActions(input: {
  products: Product[];
  fixes: Fix[];
  contentItems: ContentItem[];
  attributionEvents: AttributionEvent[];
  returnRiskEvents: ReturnRiskEvent[];
}): TodayAction[] {
  const byId = new Map(input.products.map((p) => [p.id, p]));
  const actions: TodayAction[] = [];

  // 1. Draft fixes, ranked by the product's estimated €/mo loss.
  for (const f of input.fixes) {
    if (f.status !== "draft") continue;
    const product = f.product_id ? byId.get(f.product_id) : null;
    const impact = product?.estimated_monthly_loss ?? 20;
    actions.push({
      id: `fix_${f.id}`,
      kind: "fix",
      impact,
      figure: `€${Math.round(impact)}/MO`,
      title: f.title,
      cta: "Review fix",
      href: f.product_id ? `/commerce/product/${f.product_id}` : "/commerce/dashboard",
      productId: f.product_id,
      contentId: null,
    });
  }

  // 2. Draft content approvals (Studio lane).
  for (const c of input.contentItems) {
    if (c.status !== "draft") continue;
    actions.push({
      id: `content_${c.id}`,
      kind: "content",
      impact: 15,
      figure: c.type.toUpperCase(),
      title: `Approve: ${c.title}`,
      cta: "Approve",
      href: "/commerce/dashboard#studio",
      productId: c.product_id,
      contentId: c.id,
    });
  }

  // 3. Restock warnings (velocity over the attribution ledger, §12.3).
  for (const s of restockSignals(input.products, input.attributionEvents)) {
    actions.push({
      id: `restock_${s.product.id}`,
      kind: "restock",
      impact: 60 - s.daysToStockout, // sooner stockout ranks higher
      figure: `~${s.daysToStockout} DAYS`,
      title: `Restock ${s.product.title} — ${s.estimate} (${s.attributedOrders} AI-attributed orders)`,
      cta: "View trend",
      href: "/commerce/monitor",
      productId: s.product.id,
      contentId: null,
    });
  }

  // 4. High return-risk flags.
  for (const r of input.returnRiskEvents) {
    if (r.risk !== "high") continue;
    const product = r.product_id ? byId.get(r.product_id) : null;
    actions.push({
      id: `risk_${r.id}`,
      kind: "return_risk",
      impact: Math.round(r.probability * 100),
      figure: `${Math.round(r.probability * 100)}% RISK`,
      title: `Return risk on ${product?.title ?? "a product"}${r.reason ? ` — ${r.reason}` : ""}`,
      cta: product ? "Fix listing" : "Review",
      href: product ? `/commerce/product/${product.id}` : "/commerce/monitor",
      productId: r.product_id,
      contentId: null,
    });
  }

  return actions.sort((a, b) => b.impact - a.impact);
}
