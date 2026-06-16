import "server-only";

/**
 * Service-role Supabase client — bypasses Row Level Security. ONLY for trusted
 * server contexts that must write on a user's behalf without their session:
 * the Stripe webhook crediting an account. NEVER import this into client code.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/supabase/config";

export function createServiceClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
