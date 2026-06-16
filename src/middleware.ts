import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured } from "@/lib/supabase/config";

/**
 * Keeps the Supabase auth session fresh on every request by re-issuing the
 * session cookies (the @supabase/ssr pattern). No-ops until keys are set, so
 * the site runs identically before Supabase is configured. This is also the
 * seam where per-IP rate-limiting will live (Phase F).
 */
export async function middleware(request: NextRequest) {
  if (!supabaseConfigured()) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Touch the session so an expiring token is refreshed into the response.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on everything except static assets and image files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
