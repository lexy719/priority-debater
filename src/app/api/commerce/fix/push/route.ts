/**
 * POST /api/commerce/fix/push — push (or revert) a fix via the connector (Phase 10).
 *
 * Body: { ref: ConnectorStoreRef, productExternalId: string, fields: FixFields,
 *         reverted?: boolean }
 * Returns the connector's ConnectorResult<WriteFixData> verbatim — including
 * `previous`, the pre-push snapshot the CLIENT persists on the Fix so every
 * push stays reversible (§6.7 / §9). Stateless; export-mode platforms get the
 * connector's typed "not_supported" failure and the client offers a download.
 */

import { connectorFor } from "@/lib/commerce/connectors";
import { isPlatform, type ConnectorStoreRef, type FixFields } from "@/lib/commerce/connectors/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  let body: {
    ref?: Partial<ConnectorStoreRef>;
    productExternalId?: string;
    fields?: FixFields;
    reverted?: boolean;
  };
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
  if (typeof body.productExternalId !== "string" || !body.fields || typeof body.fields !== "object") {
    return Response.json(
      { ok: false, reason: "invalid_input", detail: "Body must include productExternalId and fields." },
      { status: 400 },
    );
  }

  const result = await connectorFor(ref.platform).writeFix(
    {
      platform: ref.platform,
      domain: ref.domain,
      accessToken: typeof ref.accessToken === "string" ? ref.accessToken : null,
    },
    body.productExternalId,
    body.fields,
  );

  if (result.ok && body.reverted) {
    return Response.json({ ...result, reverted: true });
  }
  return Response.json(result);
}
