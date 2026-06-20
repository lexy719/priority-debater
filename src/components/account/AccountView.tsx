"use client";

/**
 * AccountView — the full profile workspace. Server page hands it the user, live
 * credit balance, and recent ledger; the interactive bits (edit display name,
 * change password) talk to Supabase from the browser. Display name is stored in
 * auth user_metadata, so no schema change or service-role key is needed.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins, LogOut, ArrowRight, Check, Loader2, Pencil, KeyRound, Shield, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCreditsState } from "@/components/credits/CreditsProvider";

export type LedgerEntry = {
  delta: number;
  reason: string;
  balance_after: number;
  created_at: string;
};

type Props = {
  user: { email: string; name: string; plan: string; createdAt: string; provider?: string };
  balance: number | null;
  /** True only for email/password accounts — Google sign-ins have no password. */
  hasPassword: boolean;
  signOutAction: () => Promise<void>;
};

function initials(name: string, email: string): string {
  const base = name.trim() || email;
  const parts = base.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function AccountView({ user, balance, hasPassword, signOutAction }: Props) {
  const { refresh } = useCreditsState();
  const [name, setName] = useState(user.name);
  const [draftName, setDraftName] = useState(user.name);
  const [editingName, setEditingName] = useState(false);
  const [nameBusy, setNameBusy] = useState(false);

  const [pw, setPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const [welcomePro, setWelcomePro] = useState(false);

  // Celebrate + refresh right after a subscription completes (?sub=success).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("sub") === "success") {
      setWelcomePro(true);
      void refresh();
      window.history.replaceState({}, "", "/account");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveName() {
    setNameBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ data: { display_name: draftName.trim() } });
      if (error) throw error;
      setName(draftName.trim());
      setEditingName(false);
      void refresh();
    } catch {
      /* keep editing open on failure */
    } finally {
      setNameBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6 || pwBusy) return;
    setPwBusy(true);
    setPwMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setPw("");
      setPwMsg({ tone: "ok", text: "Password updated." });
    } catch (err) {
      setPwMsg({ tone: "err", text: err instanceof Error ? err.message : "Couldn't update password." });
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-[860px] px-5 py-16 sm:py-20">
      {welcomePro && (
        <div className="mb-8 flex items-center gap-3 border border-[#32d74b]/40 bg-[#32d74b]/10 px-5 py-4 text-[#32d74b]">
          <Sparkles className="h-5 w-5 shrink-0 credit-pulse" />
          <div>
            <div className="font-display text-lg uppercase">Welcome to Pro — unlocked.</div>
            <div className="text-[12px] text-[#32d74b]/80">
              Your monthly credits are in and every premium feature is now live.
            </div>
          </div>
        </div>
      )}

      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">§ Account</p>

      {/* identity header */}
      <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="grid h-20 w-20 shrink-0 place-items-center bg-[#ff3b30] font-display text-3xl text-white">
          {initials(name, user.email)}
        </div>
        <div className="min-w-0 flex-1">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                autoFocus
                placeholder="Your name"
                className="w-full max-w-xs border border-white/20 bg-white/[0.04] px-3 py-2 text-lg text-white outline-none focus:border-[#ff3b30]"
              />
              <button
                onClick={saveName}
                disabled={nameBusy}
                className="grid h-9 w-9 place-items-center bg-[#ff3b30] text-white disabled:opacity-50"
                aria-label="Save name"
              >
                {nameBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </button>
              <button
                onClick={() => {
                  setDraftName(name);
                  setEditingName(false);
                }}
                className="px-2 text-[11px] uppercase tracking-[0.18em] text-white/50 hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="group flex items-center gap-2 text-left"
            >
              <span className="font-display text-3xl uppercase leading-none">
                {name || "Add your name"}
              </span>
              <Pencil className="h-4 w-4 text-white/30 transition-colors group-hover:text-white/70" />
            </button>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/55">
            <span className="break-all">{user.email}</span>
            <span className="text-white/20">·</span>
            <span className="inline-flex items-center gap-1.5 border border-white/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
              {user.plan} plan
            </span>
            <span className="text-white/20">·</span>
            <span className="font-mono text-[11px] text-white/45">Member since {fmtDate(user.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* credits + buy */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="border border-white/15 bg-white/[0.03] p-5">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
            <Coins className="h-3 w-3" /> Credit balance
          </div>
          <div className="mt-1 font-display text-5xl text-[#ff3b30]">{balance ?? "—"}</div>
          <Link
            href="/credits"
            className="mt-3 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-white/70 underline underline-offset-4 hover:text-white"
          >
            Manage credits <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* change password — only for email/password accounts */}
        {hasPassword ? (
        <form onSubmit={changePassword} className="border border-white/15 bg-white/[0.03] p-5">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
            <KeyRound className="h-3 w-3" /> Change password
          </div>
          <label className="mt-3 flex items-center gap-2 border border-white/20 bg-white/[0.04] px-3 focus-within:border-[#ff3b30]">
            <input
              type="password"
              value={pw}
              minLength={6}
              onChange={(e) => setPw(e.target.value)}
              placeholder="New password (6+ chars)"
              autoComplete="new-password"
              className="w-full bg-transparent py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
          </label>
          {pwMsg && (
            <p className={`mt-2 text-[12px] ${pwMsg.tone === "ok" ? "text-[#32d74b]" : "text-[#ff3b30]"}`}>
              {pwMsg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={pw.length < 6 || pwBusy}
            className="mt-3 inline-flex items-center gap-2 border border-white/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/85 transition-colors hover:bg-white hover:text-black disabled:opacity-40"
          >
            {pwBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Update
          </button>
        </form>
        ) : (
          <div className="border border-white/15 bg-white/[0.03] p-5">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              <KeyRound className="h-3 w-3" /> Sign-in method
            </div>
            <div className="mt-3 text-sm capitalize text-white/85">{user.provider || "Google"}</div>
            <p className="mt-1 text-[12px] leading-relaxed text-white/45">
              You signed in with {user.provider || "Google"} — there&apos;s no password to manage here.
            </p>
          </div>
        )}
      </div>

      {/* footer actions */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/40">
          <Shield className="h-3.5 w-3.5" /> Your data stays private to your account.
        </p>
        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 border border-white/25 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/80 transition-colors hover:bg-white hover:text-black"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
