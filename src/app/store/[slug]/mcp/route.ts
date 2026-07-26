import { NextResponse } from "next/server";
import { recordActivity } from "@/lib/studio/activityRepo";
import { isStocked, shipsPhysically } from "@/lib/studio/aiStorefront";
import { orderConfirmation, send as sendMail } from "@/lib/studio/mailer";
import { classifyAgent, recordHit } from "@/lib/studio/hitRepo";
import { loadFulfilmentRecord, orderId, saveOrder, type StoreOrder } from "@/lib/studio/orderRepo";
import { adjustStock,  } from "@/lib/studio/storeRepo";
import { loadBusiness, loadBusinessStore } from "@/lib/studio/businessSource";

/**
 * /store/[slug]/mcp — the store as an MCP SERVER.
 *
 * Protocols over integrations: any MCP-capable agent (Claude, an assistant, a
 * shopping bot) can discover, read and BUY from this store without anyone
 * signing a partnership. JSON-RPC 2.0 over HTTP POST implementing the minimum
 * useful surface: initialize · tools/list · tools/call.
 *
 * Tools: search_products · get_product · place_order.
 * Every call is attributed like any other agent read, and orders run through
 * the same repo, stock and ledger path as the web checkout — one truth.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROTOCOL_VERSION = "2025-06-18";

type RpcReq = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };

const ok = (id: RpcReq["id"], result: unknown) =>
  NextResponse.json({ jsonrpc: "2.0", id: id ?? null, result }, { headers: { "access-control-allow-origin": "*", "cache-control": "no-store" } });
const err = (id: RpcReq["id"], code: number, message: string) =>
  NextResponse.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, { headers: { "access-control-allow-origin": "*" } });
/** MCP tool results are content blocks; JSON goes in a text block. */
const textResult = (data: unknown) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  // A GET is a discovery courtesy: describe the endpoint rather than 405.
  const { slug } = await params;
  const s = await loadBusinessStore(slug);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  const base = `${new URL(req.url).origin}/store/${slug}`;
  return NextResponse.json({
    transport: "http-jsonrpc", protocol_version: PROTOCOL_VERSION,
    server: { name: `${s.store.brand.name} store`, version: "1.0" },
    usage: `POST JSON-RPC 2.0 to ${base}/mcp — methods: initialize, tools/list, tools/call`,
    tools: ["search_products", "get_product", "place_order"],
  }, { headers: { "access-control-allow-origin": "*" } });
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await loadBusinessStore(slug);
  if (!s) return err(null, -32001, "store not found");

  let body: RpcReq;
  try { body = (await req.json()) as RpcReq; } catch { return err(null, -32700, "parse error"); }
  const { id = null, method } = body;
  const ua = req.headers.get("user-agent");
  const agent = classifyAgent(ua);
  const origin = new URL(req.url).origin;
  const base = `${origin}/store/${slug}`;
  const products = s.store.products;

  if (method === "initialize") {
    await recordHit(slug, "catalog", `/store/${slug}/mcp:initialize`, ua);
    return ok(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: { name: `${s.store.brand.name} · PDR Commerce store`, version: "1.0" },
      instructions: `${s.store.brand.fullName}. ${s.store.brand.oneLiner} Ships: ${s.manifest.ships ?? "EU · 3–5 business days"}. Returns: ${s.manifest.returns ?? "30 days, unopened"}. Prices in EUR. Use search_products to browse, get_product for full specs, place_order to buy (no payment data — an order id and confirmation URL are returned).`,
    });
  }

  if (method === "tools/list") {
    return ok(id, {
      tools: [
        {
          name: "search_products",
          description: `Search the ${s.store.brand.name} catalogue (${products.length} SKUs). Returns name, sku, price, availability, category and provenance (material, origin, made by a person or a machine).`,
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Free-text match against name, description, category and provenance. Omit to list everything." },
              maxPrice: { type: "number", description: "Only products at or below this price in EUR." },
              inStockOnly: { type: "boolean", description: "Exclude out-of-stock and pre-order items." },
              madeBy: { type: "string", enum: ["human", "machine", "hybrid"], description: "Only products made this way. Products that do not declare it are excluded." },
              origin: { type: "string", description: "Only products made in this country or region (substring match on the declared origin)." },
              kind: { type: "string", enum: ["good", "digital", "service", "access"], description: "Only sellables of this kind. A good ships; digital is delivered by email; a service is work booked; access is a pass." },
            },
          },
        },
        {
          name: "get_product",
          description: "Full specification for one SKU: description, price, availability, stock, provenance (material, origin, maker, lead time, care, warranty), policies and the product URL.",
          inputSchema: { type: "object", properties: { sku: { type: "string", description: "The product sku." } }, required: ["sku"] },
        },
        {
          name: "get_seller_record",
          description: "The seller's measured record: orders taken, how they moved through the lifecycle, median hours to confirm and ship, cancellation rate, catalogue facts and the literal policy text. Self-reported from this store's own order ledger, with its own limits declared. Use it to decide whether to trust this seller.",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "place_order",
          description: "Place an order on behalf of the customer. No payment data is accepted; returns an order id and a confirmation URL. The merchant remains merchant of record.",
          inputSchema: {
            type: "object",
            properties: {
              sku: { type: "string" }, qty: { type: "number", description: "Default 1." },
              name: { type: "string", description: "Customer full name." },
              email: { type: "string", description: "Customer email for the confirmation." },
              address: { type: "string", description: "Shipping address." },
            },
            required: ["sku", "name", "email", "address"],
          },
        },
      ],
    });
  }

  if (method === "tools/call") {
    const name = String((body.params as { name?: string } | undefined)?.name ?? "");
    const args = ((body.params as { arguments?: Record<string, unknown> } | undefined)?.arguments ?? {}) as Record<string, unknown>;

    if (name === "search_products") {
      await recordHit(slug, "catalog", `/store/${slug}/mcp:search_products`, ua);
      const q = String(args.query ?? "").toLowerCase();
      const maxPrice = Number(args.maxPrice);
      const inStockOnly = args.inStockOnly === true;
      const madeBy = String(args.madeBy ?? "").toLowerCase();
      const origin = String(args.origin ?? "").toLowerCase();
      const kind = String(args.kind ?? "").toLowerCase();
      const rows = products.filter((p) => {
        // Retired products are never offered; get_product still explains them.
        if (p.availability === "Discontinued") return false;
        const pv = p.provenance;
        // A provenance filter excludes anything that does not DECLARE the fact —
        // an undeclared origin is never assumed to match.
        if (madeBy && (pv?.madeBy ?? "") !== madeBy) return false;
        if (origin && !(pv?.origin ?? "").toLowerCase().includes(origin)) return false;
        if (kind && (p.kind ?? "good") !== kind) return false;
        if (q && !(`${p.name} ${p.description} ${p.category ?? ""} ${pv?.material ?? ""} ${pv?.origin ?? ""} ${pv?.madeBy ?? ""}`.toLowerCase().includes(q))) return false;
        if (Number.isFinite(maxPrice) && (p.priceValue ?? Infinity) > maxPrice) return false;
        // Unknown stock is not out-of-stock: availability rules, and a numeric
        // stock level only excludes when it is genuinely zero.
        if (inStockOnly && ((p.availability ?? "InStock") !== "InStock" || (p.stock != null && p.stock <= 0))) return false;
        return true;
      });
      return ok(id, textResult({
        store: s.store.brand.fullName, currency: "EUR", count: rows.length,
        products: rows.map((p) => ({
          sku: p.sku, name: p.name, price: p.price, priceValue: p.priceValue ?? null,
          availability: p.availability ?? "InStock", stock: isStocked(p.kind) ? p.stock ?? null : null,
          category: p.category ?? null,
          kind: p.kind ?? "good", pricingUnit: p.unit ?? "item", ships: shipsPhysically(p.kind),
          provenance: p.provenance ?? null,
          url: p.url ?? `${base}/p/${p.sku}`,
        })),
        sellerRecord: `${base}/.well-known/seller-record.json`,
      }));
    }

    if (name === "get_product") {
      const sku = String(args.sku ?? "");
      const p = products.find((x) => x.sku === sku);
      await recordHit(slug, "product", `/store/${slug}/p/${sku}`, ua);
      if (!p) return ok(id, textResult({ error: `No product with sku "${sku}".`, availableSkus: products.map((x) => x.sku) }));
      return ok(id, textResult({
        sku: p.sku, name: p.name, description: p.description, price: p.price, priceValue: p.priceValue ?? null,
        currency: p.currency ?? "EUR", availability: p.availability ?? "InStock",
        stock: isStocked(p.kind) ? p.stock ?? null : null,
        category: p.category ?? null, brand: s.store.brand.name, url: p.url ?? `${base}/p/${p.sku}`,
        image: `${base}/img/${p.sku}.svg`,
        kind: p.kind ?? "good", pricingUnit: p.unit ?? "item", ships: shipsPhysically(p.kind),
        ...(shipsPhysically(p.kind) ? {} : { deliveryNote: p.kind === "service" ? "work booked — scheduling confirmed with the buyer after the order" : "delivered to the buyer's email; no shipping address needed" }),
        ...(p.unit && p.unit !== "item" ? { quantityMeans: `each unit of qty is one ${p.unit}` } : {}),
        provenance: p.provenance ?? null,
        sellerRecord: `${base}/.well-known/seller-record.json`,
        shipping: s.manifest.ships ?? "EU · 3–5 business days",
        returns: s.manifest.returns ?? "30 days, unopened",
        orderVia: { mcp: "place_order", http: `${origin}/api/store/${slug}/order`, web: `${base}/checkout?sku=${p.sku}` },
      }));
    }

    if (name === "get_seller_record") {
      await recordHit(slug, "catalog", `/store/${slug}/mcp:get_seller_record`, ua);
      const f = await loadFulfilmentRecord(slug);
      const sellable = products.filter((p) => p.availability !== "Discontinued");
      return ok(id, textResult({
        seller: s.store.brand.fullName,
        url: base,
        ordersReceived: f.ordersReceived,
        byStatus: f.byStatus,
        cancellationRatePct: f.cancellationRatePct,
        medianHoursToConfirm: f.medianHoursToConfirm,
        medianHoursToShip: f.medianHoursToShip,
        ordersBehindMedians: f.timedOrders,
        firstOrder: f.firstOrderTs,
        ordersFromAgents: f.agentOrders,
        sellableSkus: sellable.length,
        shipping: s.manifest.ships ?? "EU · 3–5 business days",
        returns: s.manifest.returns ?? "30 days, unopened",
        paymentTakenAtOrder: false,
        accountRequiredToBuy: false,
        verification: {
          method: "self-reported, machine-generated from this store's own order ledger",
          thirdPartyAttested: false,
          evidenceStrength: f.ordersReceived === 0 ? "no trading history yet"
            : f.ordersReceived < 10 ? "thin — fewer than 10 orders on record" : "measured across 10+ orders",
        },
        document: `${base}/.well-known/seller-record.json`,
      }));
    }

    if (name === "place_order") {
      const sku = String(args.sku ?? "");
      const qty = Math.max(1, Math.min(99, Number(args.qty) || 1));
      const buyerName = String(args.name ?? "").trim();
      const email = String(args.email ?? "").trim();
      const address = String(args.address ?? "").trim();
      const p = products.find((x) => x.sku === sku);
      if (!p) return ok(id, textResult({ ok: false, error: `No product with sku "${sku}".` }));
      // PDR publishes the agent layer for a connected merchant, but the sale is
      // theirs: send the agent to the real checkout rather than take an order we
      // cannot fulfil.
      const biz = await loadBusiness(slug);
      if (biz?.buyAt === "merchant") {
        return ok(id, textResult({
          ok: false,
          error: `${s.store.brand.fullName} completes orders on its own checkout, not through this endpoint.`,
          buyAt: p.url ?? biz.connection?.siteUrl ?? null,
          note: "PDR publishes this store's agent layer (catalogue, provenance, seller record). Follow buyAt to purchase.",
        }));
      }
      // Nothing ships for a file, an hour or a pass — do not demand an address
      // the buyer has no reason to hand over.
      const needsAddress = shipsPhysically(p.kind);
      if (!buyerName || !email.includes("@") || (needsAddress && !address)) {
        return ok(id, textResult({
          ok: false,
          error: needsAddress
            ? "name, a valid email and address are all required to place an order."
            : `${p.name} is ${p.kind ?? "digital"} — name and a valid email are required; no shipping address is needed.`,
        }));
      }
      if (p.availability === "Discontinued") {
        return ok(id, textResult({ ok: false, error: `${p.name} has been discontinued and cannot be ordered.`, alternatives: products.filter((x) => x.availability !== "Discontinued").map((x) => ({ sku: x.sku, name: x.name, price: x.price })) }));
      }
      if ((p.availability ?? "InStock") === "OutOfStock") {
        return ok(id, textResult({ ok: false, error: `${p.name} is out of stock.` }));
      }
      const order: StoreOrder = {
        id: orderId(slug + sku), slug, ts: new Date().toISOString(),
        sku, productName: p.name, price: p.price, qty,
        total: p.priceValue != null ? p.priceValue * qty : undefined,
        buyer: {
          name: buyerName.slice(0, 120), email: email.slice(0, 160),
          address: needsAddress ? address.slice(0, 300) : (address.slice(0, 300) || `no shipping — ${p.kind ?? "digital"} delivered to ${email.slice(0, 160)}`),
        },
        channel: "agent-json", agent, status: "received",
      };
      try {
        await saveOrder(order);
      } catch (e) {
        return ok(id, textResult({ ok: false, error: (e as Error).message }));
      }
      const left = await adjustStock(slug, sku, qty);
      const mail = await sendMail({
        to: order.buyer.email,
        ...orderConfirmation({
          brand: s.store.brand.fullName, orderId: order.id, product: p.name, qty,
          total: p.priceValue != null ? `${(p.priceValue * qty).toFixed(2)} EUR` : p.price,
          confirmationUrl: `${base}/order/${order.id}`,
          ships: s.manifest.ships ?? "EU · 3–5 business days",
          returns: s.manifest.returns ?? "30 days, unopened",
          physical: needsAddress,
        }),
      });
      await recordActivity(slug, "OPERATIONS",
        mail.sent ? `Confirmation emailed to ${order.buyer.email} for ${order.id}` : `No confirmation email for ${order.id} — ${mail.reason}`, "auto");
      await recordActivity(slug, "OPERATIONS", `Order ${order.id} received over MCP — ${p.name} ×${qty} via ${agent}${left != null ? ` · stock ${left}` : ""}`, "auto");
      return ok(id, textResult({
        ok: true, orderId: order.id, status: "received", sku, qty,
        ...(p.unit && p.unit !== "item" ? { quantityMeans: `${qty} × ${p.unit}` } : {}),
        total: p.priceValue != null ? `${(p.priceValue * qty).toFixed(2)} EUR` : p.price,
        confirmation: `${base}/order/${order.id}`,
        buyerEmailed: mail.sent,
        fulfilment: shipsPhysically(p.kind) ? "ships to the address given"
          : p.kind === "service" ? "the seller confirms scheduling by email"
          : "delivered to the email given",
        note: "No payment was taken. Payment instructions accompany the confirmation email; the merchant remains merchant of record.",
      }));
    }

    return err(id, -32601, `unknown tool: ${name}`);
  }

  // Notifications (no id) are acknowledged silently per JSON-RPC.
  if (method?.startsWith("notifications/")) return new NextResponse(null, { status: 204 });
  return err(id, -32601, `unknown method: ${method ?? "(none)"}`);
}
