/**
 * POST /api/commerce/catalog — read a store's catalog via its connector (Phase 8).
 *
 * Body: { ref: ConnectorStoreRef, csvText?: string }
 *   - csvText (generic mode only): raw CSV pasted/uploaded by the merchant,
 *     parsed directly without fetching anything.
 *
 * Stateless: returns ConnectorResult JSON; the CLIENT persists products into
 * the localStorage repo. Connectivity is free/bundled — never paywalled (§1.3).
 */

import { connectorFor } from "@/lib/commerce/connectors";
import { csvTextToProducts } from "@/lib/commerce/connectors/generic";
import { isPlatform, type ConnectorStoreRef } from "@/lib/commerce/connectors/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  let body: { ref?: Partial<ConnectorStoreRef>; csvText?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, reason: "invalid_input", detail: "Malformed JSON body." }, { status: 400 });
  }

  if (typeof body.csvText === "string" && body.csvText.trim()) {
    return Response.json(csvTextToProducts(body.csvText));
  }

  const ref = body.ref;
  if (!ref || !isPlatform(ref.platform) || typeof ref.domain !== "string") {
    return Response.json(
      { ok: false, reason: "invalid_input", detail: "Body must include ref: { platform, domain, accessToken }." },
      { status: 400 },
    );
  }

  const result = await connectorFor(ref.platform).readCatalog({
    platform: ref.platform,
    domain: ref.domain,
    accessToken: typeof ref.accessToken === "string" ? ref.accessToken : null,
  });
  return Response.json(result);
}
