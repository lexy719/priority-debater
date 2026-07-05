/**
 * POST /api/commerce/scan — the free-scan engine, streamed (Phase 7).
 *
 * Request: { url: string }
 * Response: newline-delimited JSON events (SSE-shaped, `data: {...}` lines):
 *   { type: "log", step, label, status, ts }   — one per real engine step
 *   { type: "result", report: CommerceReport } — the full report
 *   { type: "done" }                           — terminal marker
 *   { type: "error", message }                 — hard failure only (bad URL)
 *
 * STATELESS by design (CLAUDE.md): this route never persists. The client
 * writes the scan + products into the localStorage repository when `result`
 * arrives. Partial provider failure degrades to `warn` log lines + an
 * honestly-labelled report — never a hard error (§6.2).
 */

import { runScan, type ScanLogEvent } from "@/lib/commerce/scan/engine";

export const runtime = "nodejs";
export const maxDuration = 120;

function sse(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function POST(req: Request): Promise<Response> {
  let url = "";
  try {
    const body = (await req.json()) as { url?: string };
    url = (body.url ?? "").trim();
  } catch {
    /* fall through to validation below */
  }
  if (!url) {
    return Response.json({ error: "Enter your store URL to start the scan." }, { status: 400 });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) => {
        try { controller.enqueue(sse(payload)); } catch { /* client gone */ }
      };
      const onProgress = (e: ScanLogEvent) =>
        send({ type: "log", ...e, ts: new Date().toISOString() });

      try {
        const report = await runScan(url, onProgress);
        send({ type: "result", report });
        send({ type: "done" });
      } catch (e) {
        send({ type: "error", message: e instanceof Error ? e.message : "Scan failed — try again." });
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
