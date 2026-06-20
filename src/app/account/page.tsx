import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { getBalanceForUser } from "@/lib/credits/server";
import { AccountView } from "@/components/account/AccountView";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Account — Priority Debater" };

export default async function AccountPage() {
  if (!supabaseConfigured()) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <SiteNav />
        <main className="mx-auto max-w-[860px] px-5 py-24">
          <h1 className="font-display text-3xl uppercase">Account</h1>
          <p className="mt-3 text-sm text-white/60">
            Accounts aren&apos;t configured yet. Add the Supabase keys (see SETUP.md) to enable login.
          </p>
        </main>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const [balance, profileRes] = await Promise.all([
    getBalanceForUser(user.id),
    supabase.from("profiles").select("plan, created_at").eq("id", user.id).maybeSingle(),
  ]);

  const meta = user.user_metadata ?? {};
  const name =
    (meta.display_name as string) || (meta.full_name as string) || (meta.name as string) || "";

  // Which sign-in methods this user has — drives whether "change password" makes sense.
  const providers: string[] =
    (user.app_metadata?.providers as string[]) ??
    (user.app_metadata?.provider ? [user.app_metadata.provider as string] : []);
  const hasPassword = providers.includes("email");
  const provider = providers.find((p) => p !== "email") ?? (hasPassword ? "email" : "");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteNav />
      <AccountView
        user={{
          email: user.email ?? "",
          name,
          plan: (profileRes.data?.plan as string) ?? "free",
          createdAt: (profileRes.data?.created_at as string) ?? user.created_at ?? "",
          provider,
        }}
        balance={balance}
        hasPassword={hasPassword}
        signOutAction={signOut}
      />
    </div>
  );
}
