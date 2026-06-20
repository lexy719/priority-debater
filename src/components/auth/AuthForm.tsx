"use client";

/**
 * AuthForm — shared email/password + Google form for /login and /signup.
 * On-brand with the dark/brutalist system. Uses the browser Supabase client
 * (@supabase/ssr), which persists the session in cookies that middleware keeps
 * fresh. Falls back to a clear "not configured yet" notice before keys are set.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Mail, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/config";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") ? "Sign-in didn't complete — please try again." : null,
  );
  const [info, setInfo] = useState<string | null>(null);

  const configured = supabaseConfigured();

  const isLogin = mode === "login";

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!configured || busy) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        });
        if (error) throw error;
        // If email confirmation is on, there's no session yet.
        if (!data.session) {
          setInfo("Check your email to confirm your account, then sign in.");
        } else {
          router.push(next);
          router.refresh();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    if (!configured || busy) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
    // On success the browser redirects to Google.
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
          {isLogin ? "§ Sign in" : "§ Create account"}
        </p>
        <h1 className="mt-2 font-display text-4xl uppercase leading-[0.95] text-white">
          {isLogin ? <>Welcome <span className="bg-[#ff3b30] px-2">back.</span></> : <>Start with <span className="bg-[#ff3b30] px-2">50 free credits.</span></>}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          {isLogin
            ? "Sign in to pick up your validations, debates and credits."
            : "No card required. Validate an idea and pressure-test it in the Chamber on the house."}
        </p>
      </div>

      {!configured && (
        <div className="mb-5 border border-[#ffd60a]/50 bg-[#ffd60a]/10 px-4 py-3 text-[12px] leading-relaxed text-[#ffd60a]">
          Authentication isn&apos;t configured yet. Add the Supabase keys (see SETUP.md) and this form goes live.
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogle}
        disabled={!configured || busy}
        className="mb-4 flex w-full items-center justify-center gap-3 border border-white/25 bg-white px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-white/90 disabled:opacity-40"
      >
        <GoogleMark /> Continue with Google
      </button>

      <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-white/30">
        <span className="h-px flex-1 bg-white/15" /> or email <span className="h-px flex-1 bg-white/15" />
      </div>

      <form onSubmit={handleEmail} className="space-y-3">
        <label className="flex items-center gap-2 border border-white/20 bg-white/[0.04] px-3 focus-within:border-[#ff3b30]">
          <Mail className="h-4 w-4 text-white/40" />
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com" autoComplete="email"
            className="w-full bg-transparent py-3 text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2 border border-white/20 bg-white/[0.04] px-3 focus-within:border-[#ff3b30]">
          <Lock className="h-4 w-4 text-white/40" />
          <input
            type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder={isLogin ? "Your password" : "Choose a password (6+ chars)"}
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="w-full bg-transparent py-3 text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
        </label>

        {error && <div className="border border-[#ff3b30]/50 bg-[#ff3b30]/10 px-3 py-2 text-[12px] text-[#ff3b30]">{error}</div>}
        {info && <div className="border border-[#32d74b]/50 bg-[#32d74b]/10 px-3 py-2 text-[12px] text-[#32d74b]">{info}</div>}

        <button
          type="submit" disabled={!configured || busy}
          className="group flex w-full items-center justify-center gap-2 bg-[#ff3b30] px-5 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-black disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{isLogin ? "Sign in" : "Create account"} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></>}
        </button>
      </form>

      <p className="mt-6 text-[12px] text-white/50">
        {isLogin ? (
          <>New here? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-white underline underline-offset-4 hover:text-[#ff3b30]">Create an account</Link></>
        ) : (
          <>Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-white underline underline-offset-4 hover:text-[#ff3b30]">Sign in</Link></>
        )}
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
