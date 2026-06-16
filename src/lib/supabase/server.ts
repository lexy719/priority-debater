import "server-only";

/**
 * Server Supabase client for Server Components, Route Handlers and Server
 * Actions. Bound to the request cookies (Next 16 `cookies()` is async). Writing
 * cookies from a Server Component throws — that's expected and swallowed;
 * `middleware.ts` is what actually refreshes the session cookie.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — safe to ignore (middleware refreshes).
        }
      },
    },
  });
}
