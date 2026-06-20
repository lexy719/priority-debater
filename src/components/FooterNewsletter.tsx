"use client";

/** Compact footer newsletter signup — same endpoint as the modal. */

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

export function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Try again.");
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="mt-5 inline-flex items-center gap-2 text-xs text-signal-green">
        <Check className="h-3.5 w-3.5" /> Subscribed — talk soon.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 max-w-xs">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper/40">Newsletter</div>
      <div className="mt-2 flex items-center border border-paper/25 bg-paper/[0.04]">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
          className="w-full bg-transparent px-3 py-2 text-sm text-paper placeholder:text-paper/30 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          aria-label="Subscribe"
          className="grid h-9 w-10 shrink-0 place-items-center bg-signal-red text-ink transition-opacity disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
      {err && <p className="mt-1 text-[11px] text-signal-red">{err}</p>}
    </form>
  );
}
