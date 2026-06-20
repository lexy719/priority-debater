import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * POST /api/newsletter — capture a newsletter signup.
 *
 * Stores into `newsletter_subscribers` (see migration 0002) via the anon client,
 * which has an insert-only RLS policy. Degrades gracefully: if Supabase or the
 * table isn't ready, we still return ok so the UX never breaks — the signup just
 * isn't persisted yet.
 */
export async function POST(request: Request) {
  let body: { email?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const source = String(body.source ?? "modal").slice(0, 40);
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Enter a valid email." }, { status: 400 });
  }

  if (!supabaseConfigured()) {
    return Response.json({ ok: true, stored: false });
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert({ email, source }, { onConflict: "email", ignoreDuplicates: true });
    if (error) {
      console.warn("[newsletter] insert skipped:", error.message);
      return Response.json({ ok: true, stored: false });
    }
    return Response.json({ ok: true, stored: true });
  } catch {
    return Response.json({ ok: true, stored: false });
  }
}
