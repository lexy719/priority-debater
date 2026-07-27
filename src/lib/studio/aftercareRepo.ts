/**
 * Aftercare — what happens after "thanks for your order".
 *
 * An agent that can buy from you and then has no way to ask anything is an
 * agent that buys once. This holds the two post-purchase objects a buyer (or
 * their agent) actually needs: a RETURN they can request against the real
 * policy, and a QUESTION that gets answered from real data or escalated to the
 * owner — never guessed at.
 *
 * The support answerer is deliberately deterministic. A language model would
 * sound better and would occasionally invent a delivery date; matching a
 * question against known intents and answering from the order record cannot.
 * When nothing matches, it says so and hands the question to the owner, which
 * is the honest behaviour and also the useful one.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { blobConfigured, getJson, putJson } from "./blobStore";
import type { StoreOrder } from "./orderRepo";

export type ReturnRequest = {
  id: string;
  orderId: string;
  reason: string;
  ts: string;
  status: "requested" | "approved" | "declined" | "refunded";
  /** Why it was allowed or refused, in policy terms. */
  verdict: string;
};

export type SupportQuestion = {
  id: string;
  orderId: string | null;
  question: string;
  ts: string;
  /** Present when the question was answerable from the record. */
  answer: string | null;
  /** True when it went to the owner instead. */
  escalated: boolean;
};

type Aftercare = { returns: ReturnRequest[]; questions: SupportQuestion[] };

const DIR = path.join(process.cwd(), ".data", "aftercare");
const SLUG_RE = /^[a-z0-9-]{3,64}$/;
const EMPTY: Aftercare = { returns: [], questions: [] };

async function readAll(slug: string): Promise<Aftercare> {
  if (blobConfigured()) {
    const a = await getJson<Aftercare>(`aftercare/${slug}.json`);
    if (a) return { returns: a.returns ?? [], questions: a.questions ?? [] };
  }
  try { return JSON.parse(await fs.readFile(path.join(DIR, `${slug}.json`), "utf8")) as Aftercare; } catch { return { ...EMPTY }; }
}

async function writeAll(slug: string, a: Aftercare): Promise<void> {
  if (blobConfigured()) { await putJson(`aftercare/${slug}.json`, a); return; }
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, `${slug}.json`), JSON.stringify(a, null, 2), "utf8");
}

export async function loadAftercare(slug: string): Promise<Aftercare> {
  return SLUG_RE.test(slug) ? readAll(slug) : { ...EMPTY };
}

/** Days the policy allows, read out of the seller's own words. */
export function returnWindowDays(policy: string | undefined): number {
  const m = /(\d{1,3})\s*(?:days?|dias)/i.exec(policy ?? "");
  return m ? Math.min(365, Number(m[1])) : 30;
}

/**
 * A return, judged against the policy the store actually publishes — not a
 * generic rule. Digital goods are refused by default unless the policy says
 * otherwise, which is the law in most of the EU and the truth for a file
 * already downloaded.
 */
export async function requestReturn(slug: string, input: {
  order: StoreOrder; reason: string; policy: string | undefined; isDigital: boolean; delivered: boolean;
}): Promise<ReturnRequest> {
  const a = await readAll(slug);
  const days = returnWindowDays(input.policy);
  const ageDays = Math.floor((Date.now() - Date.parse(input.order.ts)) / 86400000);
  const digitalAllowed = /digital|download|file/i.test(input.policy ?? "");

  let status: ReturnRequest["status"] = "requested";
  let verdict: string;
  if (input.order.status === "cancelled") {
    status = "declined"; verdict = "This order was already cancelled, so there is nothing to return.";
  } else if (ageDays > days) {
    status = "declined"; verdict = `The published return window is ${days} days and this order is ${ageDays} days old.`;
  } else if (input.isDigital && !digitalAllowed) {
    status = "declined"; verdict = "This is a digital item and the published policy does not cover returns on digital goods once delivered.";
  } else {
    verdict = `Within the published ${days}-day window — passed to the seller to approve and refund.`;
  }

  const r: ReturnRequest = {
    id: `RET-${(a.returns.length + 1).toString().padStart(3, "0")}`,
    orderId: input.order.id,
    reason: input.reason.slice(0, 300),
    ts: new Date().toISOString(),
    status, verdict,
  };
  a.returns.push(r);
  await writeAll(slug, a);
  return r;
}

export async function setReturnStatus(slug: string, id: string, status: ReturnRequest["status"]): Promise<ReturnRequest | null> {
  const a = await readAll(slug);
  const r = a.returns.find((x) => x.id === id);
  if (!r) return null;
  r.status = status;
  await writeAll(slug, a);
  return r;
}

/* ── support: answer from the record, or escalate ─────────────────────────── */

export type SupportContext = {
  order: StoreOrder | null;
  ships: string;
  returns: string;
  deliveryUrl: string | null;
  deliveryNote: string | null;
  paid: boolean | null;
};

/**
 * Match the question to an intent and answer it from the order in front of us.
 * Returns null when nothing matches — the caller escalates rather than guessing.
 */
export function answerFromRecord(question: string, c: SupportContext): string | null {
  const q = question.toLowerCase();
  const o = c.order;

  if (/where|status|arriv|ship|when|track|entreg|estado/.test(q)) {
    if (!o) return null;
    const line = `Order ${o.id} (${o.productName} ×${o.qty}) is currently ${o.status.toUpperCase()}, placed ${o.ts.slice(0, 10)}.`;
    if (c.deliveryUrl) return `${line} It is a digital item and is available now at ${c.deliveryUrl}${c.deliveryNote ? ` — note: ${c.deliveryNote}` : ""}.`;
    return `${line} Shipping: ${c.ships}. No carrier tracking is recorded for this order — the seller confirms dispatch.`;
  }
  if (/cancel/.test(q)) {
    if (!o) return null;
    return o.status === "received" || o.status === "confirmed"
      ? `Order ${o.id} is ${o.status} and can still be cancelled — call cancel_order with this order id, or reply asking the seller to cancel it.`
      : `Order ${o.id} is ${o.status.toUpperCase()} and can no longer be cancelled. A return may apply instead: ${c.returns}.`;
  }
  if (/return|refund|devolu|money back/.test(q)) {
    return `The published policy is: ${c.returns}. To start one, call request_return with the order id and a reason — it is judged against that policy and passed to the seller.`;
  }
  if (/what did i|what was|which product|my order|contents/.test(q)) {
    if (!o) return null;
    return `Order ${o.id}: ${o.productName} ×${o.qty} at ${o.price}${o.total != null ? ` (total €${o.total})` : ""}, placed ${o.ts.slice(0, 10)}.`;
  }
  if (/paid|payment|invoice|charge/.test(q)) {
    if (c.paid === true) return `Payment for this order is recorded as received.`;
    if (c.paid === false) return `No payment has been taken for this order yet — this store confirms the order first and sends payment instructions separately.`;
    return `No payment was taken at checkout; this store runs order-intent checkout and the seller follows up with instructions.`;
  }
  return null;
}

export async function recordQuestion(slug: string, input: { orderId: string | null; question: string; answer: string | null }): Promise<SupportQuestion> {
  const a = await readAll(slug);
  const q: SupportQuestion = {
    id: `ASK-${(a.questions.length + 1).toString().padStart(3, "0")}`,
    orderId: input.orderId,
    question: input.question.slice(0, 400),
    ts: new Date().toISOString(),
    answer: input.answer,
    escalated: input.answer == null,
  };
  a.questions.push(q);
  await writeAll(slug, a);
  return q;
}
