import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { PricingView } from "@/components/pricing/PricingView";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { getBalanceForUser } from "@/lib/credits/server";

export const metadata: Metadata = {
  title: "Pricing — Priority Debater",
  description: "Free to start. Upgrade for the real AI Commerce audit, the Fix Toolkit, HD voice and a monthly credit allowance.",
};

export default async function PricingPage() {
  let authed = false;
  let currentPlan = "free";
  let balance: number | null = null;

  if (supabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      authed = true;
      const { data } = await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle();
      currentPlan = (data?.plan as string) ?? "free";
      balance = await getBalanceForUser(user.id);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteNav />
      <PricingView authed={authed} currentPlan={currentPlan} balance={balance} />
    </div>
  );
}
