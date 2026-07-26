import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured } from "@/lib/supabase/config";

/**
 * Keeps the Supabase auth session fresh on every request by re-issuing the
 * session cookies (the @supabase/ssr pattern). No-ops until keys are set, so
 * the site runs identically before Supabase is configured. This is also the
 * seam where per-IP rate-limiting will live (Phase F).
 */
/** Circuit breaker: after a failed Supabase call, stop trying for 5 minutes.
    A paused/unreachable Supabase project must cost at most ONE failed fetch
    per isolate per window — never a storm. */
let supabaseDownUntil = 0;

export async function middleware(request: NextRequest) {
  if (!supabaseConfigured()) return NextResponse.next();
  if (Date.now() < supabaseDownUntil) return NextResponse.next();

  // Anonymous request — no Supabase auth cookie, nothing to refresh, no
  // network call. Keeps every page instant when Supabase is slow/unreachable.
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (!hasAuthCookie) return NextResponse.next();

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
  // A failed refresh (Supabase paused/offline) must NEVER break the page —
  // serve the request and let auth refresh on a later attempt.
  try {
    await supabase.auth.getUser();
  } catch {
    // Supabase unreachable — serve anyway and back off for 5 minutes.
    supabaseDownUntil = Date.now() + 5 * 60_000;
  }

  return response;
}

export const config = {
  // Run on everything except static assets, image files, and the auth-free
  // surfaces: the studio machine, published stores, and their APIs — those
  // are high-frequency (5s polling, agent crawls) and never use sessions.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|studio|store/|api/studio|api/store|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
