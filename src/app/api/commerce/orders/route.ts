/**
 * POST /api/commerce/orders — read order metadata for attribution (Phase 11 feed).
 *
 * Body: { ref: ConnectorStoreRef, since: string | null }
 * Returns the connector's ConnectorResult<{ orders }> verbatim — the CLIENT
 * classifies layers (1: agent-checkout markers, 2: AI referrers) and writes
 * attribution_events into the localStorage ledger. Stateless by design.
 */

import { connectorFor } from "@/lib/commerce/connectors";
import { isPlatform, type ConnectorStoreRef } from "@/lib/commerce/connectors/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  let body: { ref?: Partial<ConnectorStoreRef>; since?: string | null };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, reason: "invalid_input", detail: "Malformed JSON body." }, { status: 400 });
  }

  const ref = body.ref;
  if (!ref || !isPlatform(ref.platform) || typeof ref.domain !== "string") {
    return Response.json(
      { ok: false, reason: "invalid_input", detail: "Body must include ref: { platform, domain, accessToken }." },
      { status: 400 },
    );
  }

  const result = await connectorFor(ref.platform).readOrderMetadata(
    {
      platform: ref.platform,
      domain: ref.domain,
      accessToken: typeof ref.accessToken === "string" ? ref.accessToken : null,
    },
    typeof body.since === "string" ? body.since : null,
  );
  return Response.json(result);
}
