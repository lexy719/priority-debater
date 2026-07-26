/**
 * GET /api/store/demo/llms  → serves the llms.txt for the demo store
 * (plain text an agent/crawler can read to understand the business + products).
 */

import { buildLlmsTxt } from "@/lib/studio/aiStorefront";
import { DEMO_STORE } from "@/lib/studio/demoStore";

export function GET() {
  return new Response(buildLlmsTxt(DEMO_STORE), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60",
    },
  });
}
