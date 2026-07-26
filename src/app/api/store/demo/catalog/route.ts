/**
 * GET /api/store/demo/catalog
 * The machine-readable agent catalog — what an AI shopping agent reads to
 * understand the whole store (business, capabilities, endpoints, products).
 * CORS-open so any agent can fetch it. No human UI involved.
 */

import { buildAgentCatalog } from "@/lib/studio/aiStorefront";
import { DEMO_STORE } from "@/lib/studio/demoStore";

export function GET() {
  return Response.json(buildAgentCatalog(DEMO_STORE), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60",
    },
  });
}
