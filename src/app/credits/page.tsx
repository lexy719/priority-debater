import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { getBalanceForUser } from "@/lib/credits/server";
import { CreditsPageView } from "@/components/credits/CreditsPageView";
import type { LedgerEntry } from "@/components/account/AccountView";

export const metadata: Metadata = {
  title: "Credits — Priority Debater",
  description: "Your credit balance, what each AI action costs, and top-up packs.",
};

export default async function CreditsPage() {
  let authed = false;
  let balance: number | null = null;
  let ledger: LedgerEntry[] = [];

  const configured = supabaseConfigured();
  if (configured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      authed = true;
      balance = await getBalanceForUser(user.id);
      const { data } = await supabase
        .from("credit_ledger")
        .select("delta, reason, balance_after, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(25);
      ledger = (data as LedgerEntry[]) ?? [];
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteNav />
      <CreditsPageView configured={configured} authed={authed} balance={balance} ledger={ledger} />
    </div>
  );
}
