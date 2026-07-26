import "server-only";

/**
 * Tenancy for PDR Commerce.
 *
 * Commerce operates somebody's company. Which means two things have to be true
 * before a single real customer touches it:
 *  1. A register shows only the companies that operator fabricated.
 *  2. No route will read or write a business the caller does not own — not the
 *     business snapshot, not the expenses, not the catalogue, not a rule.
 *
 * Signed out, the platform shows the DEMO ESTATE: the built-in example
 * businesses. They are explorable on purpose, and they are never presented as
 * the visitor's own. The moment somebody signs in, they see their estate and
 * nothing else — an empty one reads as empty.
 *
 * Public store surfaces (/store/*, feeds, MCP, order intake) are deliberately
 * NOT gated here: a shop has to be readable by strangers and their agents.
 */

import { createClient } from "@/lib/supabase/server";
import { loadStore, ownsStore, type PublishedStore } from "@/lib/studio/storeRepo";

/** The operator making this request, or null for the demo estate. */
export async function currentOwnerId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    // Auth misconfigured or unreachable — fall back to the demo estate rather
    // than failing open onto somebody's real business.
    return null;
  }
}

export type OwnedStore =
  | { ok: true; store: PublishedStore; ownerId: string | null }
  | { ok: false; status: 403 | 404; error: string };

/**
 * Resolve a slug the caller claims to operate. Returns the store only when the
 * register they are entitled to actually contains it.
 */
export async function ownedStore(slug: string): Promise<OwnedStore> {
  const ownerId = await currentOwnerId();
  if (!slug) return { ok: false, status: 404, error: "no business specified" };
  if (!(await ownsStore(ownerId, slug))) {
    // Same answer whether it does not exist or belongs to somebody else — a
    // register must not become a way to enumerate other operators' companies.
    return { ok: false, status: 404, error: "no such business under your management" };
  }
  const store = await loadStore(slug);
  if (!store) return { ok: false, status: 404, error: "no such business under your management" };
  return { ok: true, store, ownerId };
}
