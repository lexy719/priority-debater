import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth + email-confirmation callback. Supabase redirects here with a `code`;
 * we exchange it for a session (cookies set via the server client) and send the
 * user on to `next` (defaults to /account).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/account";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/account"}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
