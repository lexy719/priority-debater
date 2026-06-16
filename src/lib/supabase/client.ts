"use client";

/**
 * Browser Supabase client for Client Components. Reads the session from the
 * cookies that `middleware.ts` keeps fresh. Call `createClient()` per use.
 */

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
