import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Coins, LogOut, ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { getBalanceForUser } from "@/lib/credits/server";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Account — Priority Debater" };

export default async function AccountPage() {
  if (!supabaseConfigured()) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <SiteNav />
        <main className="mx-auto max-w-[760px] px-5 py-24">
          <h1 className="font-display text-3xl uppercase">Account</h1>
          <p className="mt-3 text-sm text-white/60">
            Accounts aren&apos;t configured yet. Add the Supabase keys (see SETUP.md) to enable login.
          </p>
        </main>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const balance = await getBalanceForUser(user.id);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteNav />
      <main className="mx-auto max-w-[760px] px-5 py-20">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">§ Account</p>
        <h1 className="mt-2 font-display text-4xl uppercase leading-[0.95]">Your workspace.</h1>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="border border-white/15 bg-white/[0.03] p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Signed in as</div>
            <div className="mt-2 text-sm break-all">{user.email}</div>
          </div>
          <div className="border border-white/15 bg-white/[0.03] p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 flex items-center gap-1.5">
              <Coins className="h-3 w-3" /> Credit balance
            </div>
            <div className="mt-1 font-display text-4xl text-[#ff3b30]">{balance ?? "—"}</div>
            <Link href="/pricing" className="mt-2 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-white/70 underline underline-offset-4 hover:text-white">
              Buy more credits <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <form action={signOut} className="mt-10">
          <button type="submit" className="inline-flex items-center gap-2 border border-white/25 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/80 transition-colors hover:bg-white hover:text-black">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </form>
      </main>
    </div>
  );
}
