import "server-only";

/**
 * Server-side credit enforcement. The ONLY place credits are spent. Paid routes
 * call `guardAndSpend(action)` before doing any paid work:
 *   - not configured (pre-launch) → allow through, unmetered (demo mode)
 *   - no session                  → { ok:false, status:401 }
 *   - insufficient credits        → { ok:false, status:402, balance }
 *   - ok                          → charge atomically via the spend_credits RPC
 *
 * On a downstream failure the route should call `refund(action)` so a failed
 * generation doesn't cost the user.
 */

import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { CREDIT_COSTS, isOpenPreviewAction, type CreditAction } from "./costs";

/** Read a user's current balance. null when not configured / no row. */
export async function getBalanceForUser(userId: string): Promise<number | null> {
  if (!supabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();
    if (error || !data) return null;
    return typeof data.credits === "number" ? data.credits : null;
  } catch {
    return null;
  }
}

export type GuardResult =
  | { ok: true; userId: string | null; balance: number | null }
  | { ok: false; status: 401 | 402 | 503; error: string; balance?: number };

/** Authenticate + atomically charge for `action`. */
export async function guardAndSpend(action: CreditAction): Promise<GuardResult> {
  // Pre-launch: no Supabase yet → run unmetered so the demo works. Once keys
  // exist this branch never executes and every action is enforced.
  if (!supabaseConfigured()) return { ok: true, userId: null, balance: null };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Studio preview routes stay free + unmetered for logged-out visitors so
    // they show real AI output instead of a sample. Everything else requires auth.
    if (isOpenPreviewAction(action)) return { ok: true, userId: null, balance: null };
    return { ok: false, status: 401, error: "not_authenticated" };
  }

  const cost = CREDIT_COSTS[action];
  const { data, error } = await supabase.rpc("spend_credits", {
    p_amount: cost,
    p_reason: action,
  });
  if (error) return { ok: false, status: 503, error: "credit_error" };

  const res = data as { ok: boolean; balance: number } | null;
  if (!res?.ok) {
    return { ok: false, status: 402, error: "insufficient_credits", balance: res?.balance ?? 0 };
  }
  return { ok: true, userId: user.id, balance: res.balance };
}

export type AuthResult =
  | { ok: true; userId: string | null }
  | { ok: false; status: 401 | 503; error: string };

/**
 * Require a signed-in user WITHOUT charging — for sub-calls of an already-paid
 * action (e.g. chamber respond/ask within a paid session) and read/support
 * routes. Unmetered (pass-through) until Supabase is configured.
 */
export async function requireAuth(): Promise<AuthResult> {
  if (!supabaseConfigured()) return { ok: true, userId: null };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, error: "not_authenticated" };
  return { ok: true, userId: user.id };
}

/** Turn a failed guard into the JSON error Response routes should return. */
export function guardFailResponse(
  g: { status: number; error: string; balance?: number },
): Response {
  return Response.json(
    { error: g.error, ...(typeof g.balance === "number" ? { balance: g.balance } : {}) },
    { status: g.status },
  );
}

/** Give the credits back (compensating ledger entry) when a charged run fails. */
export async function refund(action: CreditAction): Promise<void> {
  if (!supabaseConfigured()) return;
  try {
    const supabase = await createClient();
    await supabase.rpc("refund_credits", {
      p_amount: CREDIT_COSTS[action],
      p_reason: `refund_${action}`,
    });
  } catch {
    // best-effort — a failed refund shouldn't surface to the user
  }
}
