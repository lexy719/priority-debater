/**
 * Supabase env, in one place. The app must run BEFORE keys are configured
 * (demo / pre-launch), so every entry point checks `supabaseConfigured()` and
 * degrades to a logged-out/demo state instead of crashing.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

/** True once the public Supabase keys exist (auth can run). */
export function supabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/** True once the service-role key exists (webhook / privileged writes can run). */
export function supabaseServiceConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}
