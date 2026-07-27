import { NextResponse } from "next/server";
import { blobConfigured } from "@/lib/studio/blobStore";
import { listStores } from "@/lib/studio/storeRepo";

/**
 * GET /api/health — is this deployment actually wired up?
 *
 * A deployment can build perfectly and still be useless: the pages render, the
 * routes answer, and every store 404s because one environment variable is
 * missing. This says which capabilities are live, in one request.
 *
 * It reports BOOLEANS ONLY — never a key, never a fragment of one. Anyone can
 * call it; nobody learns anything they could use.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const blob = blobConfigured();
  let storeCount: number | null = null;
  let storageError: string | null = null;
  if (blob) {
    try { storeCount = (await listStores()).length; } catch (e) { storageError = (e as Error).message.slice(0, 120); }
  }

  const capabilities = {
    // Persistence. Without this every published store is invisible: the app
    // falls back to a local .data/ folder that does not exist in production.
    persistence: {
      configured: blob,
      supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      serviceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      storesVisible: storeCount,
      error: storageError,
    },
    // Sign-in. Missing or mismatched, Commerce still runs on the demo estate.
    auth: { publishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) },
    // Generation.
    generation: {
      claude: Boolean(process.env.ANTHROPIC_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
      higgsfield: Boolean(process.env.HIGGSFIELD_KEY_ID && process.env.HIGGSFIELD_KEY_SECRET),
    },
    automation: { cronSecret: Boolean(process.env.CRON_SECRET) },
  };

  const blocking: string[] = [];
  if (!capabilities.persistence.serviceKey) {
    // The usual cause is a near-miss name or the wrong Vercel environment, not
    // a forgotten paste. List the Supabase-ish variable NAMES this deployment
    // can actually see (never their values) so a typo is obvious at a glance.
    const seen = Object.keys(process.env).filter((k) => /SUPABASE|SUPA_|SERVICE_ROLE/i.test(k)).sort();
    blocking.push(
      "SUPABASE_SERVICE_ROLE_KEY is missing — every store will 404 and the register will be empty. " +
      `Supabase-related names this deployment can see: ${seen.length ? seen.join(", ") : "none at all"}. ` +
      "If the name looks right, it was probably set for the wrong environment (it must include Production) " +
      "or added after the build — env changes need a fresh deploy.",
    );
  }
  if (!capabilities.persistence.supabaseUrl) blocking.push("NEXT_PUBLIC_SUPABASE_URL is missing — nothing can be read or written");
  if (blob && storeCount === 0) blocking.push("storage reachable but no stores found — check the bucket is `studio` on the expected project");
  if (!capabilities.generation.claude) blocking.push("ANTHROPIC_API_KEY is missing — Studio cannot fabricate and Commerce cannot write");

  return NextResponse.json(
    { ok: blocking.length === 0, ts: new Date().toISOString(), capabilities, blocking },
    { headers: { "cache-control": "no-store" } },
  );
}
