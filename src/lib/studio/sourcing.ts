import "server-only";

/**
 * SOURCING — the buying agent's hands.
 *
 * Given a requisition, find who can supply it and at what price. Two lanes,
 * and the difference between them matters more than it looks:
 *
 *   PDR LANE      other PDR-run stores. Their catalogues are real, priced,
 *                 stock-checked and orderable over MCP, so a quote from one is
 *                 VERIFIED — read from a live catalogue, not guessed — and can
 *                 be acted on unattended.
 *
 *   OPEN LANE     the rest of the world. There is no universal supplier API, so
 *                 this asks Claude for candidate suppliers. Those quotes are
 *                 UNVERIFIED by construction: a language model's recollection of
 *                 a price is a lead, not an offer. They are shown, labelled, and
 *                 never auto-accepted.
 *
 * That distinction is the whole safety model of the buy side. `verified` is not
 * a nicety — `compareQuotes` refuses to crown an unverified quote, so an
 * unattended worker cannot spend money against a number nobody checked.
 *
 * PDR-to-PDR is also how the network escapes its cold start. Business A's buying
 * agent orders from business B's store; both halves already exist, and neither
 * waits on the outside world to show up.
 */

import type { Quote, Requisition } from "./procurementRepo";
import { listStores, loadStore, type PublishedStore } from "./storeRepo";
import { isStocked } from "./aiStorefront";

const MODEL = "claude-sonnet-5";

/* ── the PDR lane ──────────────────────────────────────────────────────── */

/** Terms a word appears in, lowercased, for a cheap relevance match. */
function tokens(s: string): string[] {
  return s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
}

/**
 * Search every other PDR store's real catalogue for something that satisfies
 * this requisition. Matching is deliberately conservative — a wrong supplier is
 * worse than no supplier, because the whole point is that these can be bought
 * without a human looking.
 */
export async function quoteFromPdrStores(req: Requisition, buyerSlug: string): Promise<Omit<Quote, "id" | "requisitionId" | "ts">[]> {
  const want = new Set([...tokens(req.what), ...(req.sku ? tokens(req.sku) : [])]);
  if (want.size === 0) return [];

  // The register holds names only, so each catalogue is a separate read. Fine
  // at this size; if the network grows past a few dozen stores this wants a
  // shared product index rather than a fan-out over every store on file.
  const roster = await listStores().catch(() => [] as { slug: string; name: string }[]);
  const stores = (await Promise.all(
    roster.filter((r) => r.slug !== buyerSlug).map((r) => loadStore(r.slug).catch(() => null)),
  )).filter((s): s is PublishedStore => Boolean(s));

  const out: Omit<Quote, "id" | "requisitionId" | "ts">[] = [];
  for (const s of stores) {
    for (const p of s.store.products) {
      if (p.availability === "Discontinued") continue;
      if (p.priceValue == null) continue; // an unparseable price is not an offer
      // Out of stock is not a quote. Offering something that cannot be shipped
      // is exactly the lie the sell side already refuses to tell.
      if (isStocked(p.kind) && (p.stock ?? 0) <= 0) continue;
      if (p.availability === "OutOfStock") continue;

      const hay = new Set([...tokens(p.name), ...tokens(p.description ?? ""), ...tokens(p.category ?? "")]);
      const overlap = [...want].filter((w) => hay.has(w)).length;
      if (overlap < 1) continue;

      out.push({
        supplier: `${s.store.brand.fullName} · ${p.name}`,
        pdrSlug: s.slug,
        sourceUrl: `/store/${s.slug}/p/${p.sku}`,
        unitPrice: p.priceValue,
        currency: p.currency ?? "EUR",
        ...(p.provenance?.leadTime ? { terms: p.provenance.leadTime } : {}),
        leadTimeDays: isStocked(p.kind) ? 3 : 0,
        // Read from a live catalogue with real stock. This is an actual offer.
        verified: true,
      });
    }
  }
  // Best price first, and never more than a handful: a wall of near-identical
  // rows is not a comparison, it is a way of avoiding a decision.
  return out.sort((a, b) => a.unitPrice - b.unitPrice).slice(0, 5);
}

/* ── the open lane ─────────────────────────────────────────────────────── */

type Suggested = { supplier: string; unitPrice: number; currency?: string; leadTimeDays?: number; terms?: string; sourceUrl?: string };

/**
 * Ask Claude who supplies this. Returns leads, explicitly unverified.
 *
 * The prompt forbids inventing a precise price for a named vendor, because a
 * confident fabricated figure is worse than a range: it reads as researched and
 * would sit in a comparison table next to real numbers.
 */
export async function quoteFromOpenMarket(req: Requisition): Promise<Omit<Quote, "id" | "requisitionId" | "ts">[]> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return [];

  const prompt = [
    "You are sourcing a supplier for a small business. Output ONLY strict JSON, no fences:",
    '{"suppliers":[{"supplier":string,"unitPrice":number,"currency":string,"leadTimeDays":number,"terms":string}]}',
    "",
    "Rules:",
    "- at most 3 suppliers, real categories of vendor that plausibly serve Europe",
    "- unitPrice is a TYPICAL MARKET RATE for this category, not a claim about a specific vendor's current price",
    "- if you cannot give a defensible typical rate, omit that supplier entirely rather than guessing",
    "- terms <= 60 chars, concrete (minimum order, payment terms)",
    "- never invent a URL",
    "",
    `Needed: ${req.what}`,
    req.qty != null ? `Quantity: ${req.qty}${req.unit ? " " + req.unit : ""}` : "",
    req.budget != null ? `Budget: ${req.budget} ${req.currency ?? "EUR"}` : "",
    `Why: ${req.need}`,
  ].filter(Boolean).join("\n");

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 800, messages: [{ role: "user", content: prompt }] }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) return [];
    const data = (await r.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? []).map((b) => (b.type === "text" ? b.text ?? "" : "")).join("");
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : text) as { suppliers?: Suggested[] };
    return (parsed.suppliers ?? [])
      .filter((s) => s.supplier && Number.isFinite(s.unitPrice) && s.unitPrice > 0)
      .slice(0, 3)
      .map((s) => ({
        supplier: s.supplier.slice(0, 90),
        unitPrice: Math.round(s.unitPrice * 100) / 100,
        currency: (s.currency ?? "EUR").toUpperCase().slice(0, 3),
        ...(s.leadTimeDays != null ? { leadTimeDays: Math.round(s.leadTimeDays) } : {}),
        ...(s.terms ? { terms: s.terms.slice(0, 60) } : {}),
        // A typical market rate is a lead. It is never an offer, and
        // compareQuotes will not let it win.
        verified: false,
      }));
  } catch {
    return [];
  }
}

/** Both lanes, PDR first — a verified offer outranks a lead every time. */
export async function sourceQuotes(req: Requisition, buyerSlug: string): Promise<Omit<Quote, "id" | "requisitionId" | "ts">[]> {
  const [pdr, open] = await Promise.all([
    quoteFromPdrStores(req, buyerSlug),
    quoteFromOpenMarket(req),
  ]);
  return [...pdr, ...open];
}
