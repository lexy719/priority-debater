"use client";

/**
 * NewsletterModal — a once-only email capture that appears after the visitor has
 * engaged (18s dwell or 40% scroll), never on auth/account pages, and remembers
 * its own dismissal/subscription in localStorage so it never nags. Posts to
 * /api/newsletter (which degrades gracefully if the table isn't provisioned).
 */

import { useEffect, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { X, Loader2, Check, Mail } from "lucide-react";

const STORAGE_KEY = "pd_newsletter";
const HIDE_ON = ["/login", "/signup", "/account"];

export function NewsletterModal() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (HIDE_ON.some((p) => pathname.startsWith(p))) return;

    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      setOpen(true);
      cleanup();
    };
    const timer = setTimeout(show, 18000);
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight || 1;
      if (window.scrollY / max > 0.4) show();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    }
    return cleanup;
  }, [pathname]);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {
      /* private mode */
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "modal" }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "Something went wrong.");
      setDone(true);
      try {
        localStorage.setItem(STORAGE_KEY, "subscribed");
      } catch {
        /* private mode */
      }
      setTimeout(() => setOpen(false), 2400);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative w-full max-w-md border border-white/15 bg-[#0c0c0f] text-white shadow-[0_24px_80px_-20px_rgba(0,0,0,0.8)]">
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center text-white/50 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-7">
          {done ? (
            <div className="py-6 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center bg-[#32d74b]/15 text-[#32d74b]">
                <Check className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-display text-2xl uppercase">You&apos;re in.</h2>
              <p className="mt-2 text-sm text-white/60">We&apos;ll send the good stuff — no spam.</p>
            </div>
          ) : (
            <>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">§ Newsletter</p>
              <h2 className="mt-2 font-display text-3xl uppercase leading-[0.95]">
                Get an edge <span className="bg-[#ff3b30] px-1.5">before AI eats retail.</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                Tactics on validating ideas and getting your store recommended by AI agents. One
                email, occasionally. Unsubscribe anytime.
              </p>
              <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
                <label className="flex items-center gap-2 border border-white/20 bg-white/[0.04] px-3 focus-within:border-[#ff3b30]">
                  <Mail className="h-4 w-4 text-white/40" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    className="w-full bg-transparent py-3 text-sm text-white placeholder:text-white/30 focus:outline-none"
                  />
                </label>
                {err && <p className="text-[12px] text-[#ff3b30]">{err}</p>}
                <button
                  type="submit"
                  disabled={busy}
                  className="flex items-center justify-center gap-2 bg-[#ff3b30] px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
                </button>
              </form>
              <button
                onClick={dismiss}
                className="mt-3 w-full text-center text-[11px] uppercase tracking-[0.18em] text-white/35 hover:text-white/60"
              >
                No thanks
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
