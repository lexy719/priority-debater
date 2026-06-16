import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { getBalanceForUser } from "@/lib/credits/server";

export const dynamic = "force-dynamic";

/** Current auth + credit state for the client (CreditsProvider polls this). */
export async function GET() {
  if (!supabaseConfigured()) {
    return Response.json({ configured: false, authed: false, balance: null, email: null });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ configured: true, authed: false, balance: null, email: null });
  }
  const balance = await getBalanceForUser(user.id);
  return Response.json({ configured: true, authed: true, balance, email: user.email ?? null });
}
