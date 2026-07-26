import "server-only";

/**
 * Transactional mail — the one message commerce cannot do without.
 *
 * A store that takes an order and sends nothing is broken, however good the
 * confirmation page looks. This is the seam: with RESEND_API_KEY set, the buyer
 * gets a real email; without it, nothing is sent and — critically — nothing
 * CLAIMS to have been sent. Every caller gets back what actually happened so
 * the confirmation page and the ops ledger can tell the truth either way.
 *
 * Resend is used directly over HTTPS (no SDK, no build weight). Any provider
 * with a POST-a-JSON-body API drops into `send()` unchanged.
 */

export type MailResult = { sent: boolean; reason: string; id?: string };

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

export async function send(input: { to: string; subject: string; text: string; replyTo?: string }): Promise<MailResult> {
  if (!mailConfigured()) {
    return { sent: false, reason: "no mail provider configured — set RESEND_API_KEY and MAIL_FROM" };
  }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to: [input.to],
        subject: input.subject.slice(0, 180),
        text: input.text,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    });
    if (!r.ok) return { sent: false, reason: `provider refused: ${r.status}` };
    const j = (await r.json()) as { id?: string };
    return { sent: true, reason: "delivered to the provider", id: j.id };
  } catch (e) {
    return { sent: false, reason: (e as Error).message.slice(0, 120) };
  }
}

/** The order confirmation, in plain text an agent or a person can both read. */
export function orderConfirmation(input: {
  brand: string; orderId: string; product: string; qty: number; total: string;
  confirmationUrl: string; ships: string; returns: string; physical: boolean;
}): { subject: string; text: string } {
  return {
    subject: `${input.brand} — order ${input.orderId} received`,
    text: [
      `Your order is received.`,
      ``,
      `Order:    ${input.orderId}`,
      `Item:     ${input.product} × ${input.qty}`,
      `Total:    ${input.total}`,
      ``,
      input.physical ? `Shipping: ${input.ships}` : `Delivery: arranged by email — nothing ships`,
      `Returns:  ${input.returns}`,
      ``,
      `Confirmation page: ${input.confirmationUrl}`,
      ``,
      `No payment has been taken. Payment instructions follow separately;`,
      `${input.brand} remains the merchant of record for this order.`,
    ].join("\n"),
  };
}
