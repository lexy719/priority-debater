"use client";

/**
 * LogoImageButton — generates a real logo image for the Brand Kit via Higgsfield
 * (text-to-image), built from the generated name, palette and visual direction.
 * Submit → poll → render <img>. Degrades: Pro lock / not-configured / error.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, RotateCcw, Coins } from "lucide-react";

type Status = "idle" | "working" | "done" | "error" | "login" | "credits" | "unconfigured";

export function LogoImageButton({ prompt }: { prompt: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [url, setUrl] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function generate() {
    setStatus("working");
    setUrl(null);
    try {
      const res = await fetch("/api/studio/higgsfield/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const j = await res.json();
      if (res.status === 401) return setStatus("login");
      if (res.status === 402) return setStatus("credits");
      if (res.status === 503) return setStatus("unconfigured");
      if (!res.ok || !j.id) throw new Error(j?.message || j?.error || "Failed.");
      await poll(j.id as string);
    } catch {
      if (mounted.current) setStatus("error");
    }
  }

  async function poll(id: string) {
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      if (!mounted.current) return;
      const res = await fetch(`/api/studio/higgsfield/status?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const j = await res.json();
      if (j.status === "completed" && j.url) {
        if (mounted.current) {
          setUrl(j.url as string);
          setStatus("done");
        }
        return;
      }
      if (j.status === "failed") throw new Error("failed");
    }
    throw new Error("timeout");
  }

  if (status === "done" && url) {
    return (
      <div className="w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Generated logo" className="mx-auto max-h-44 w-auto object-contain" />
        <button
          onClick={generate}
          className="mt-2 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.15em] opacity-70 hover:opacity-100"
        >
          <RotateCcw size={11} /> Regenerate
        </button>
      </div>
    );
  }

  if (status === "login" || status === "credits") {
    const credits = status === "credits";
    return (
      <Link
        href={credits ? "/credits" : "/login?next=/brand-kit"}
        className="inline-flex items-center gap-1.5 border border-current px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.15em] opacity-90 hover:opacity-100"
      >
        <Coins size={11} /> {credits ? "Top up to generate" : "Sign in to generate"}
      </Link>
    );
  }

  if (status === "unconfigured") {
    return (
      <span className="font-mono text-[9px] uppercase tracking-[0.12em] opacity-60">
        Add HIGGSFIELD_API_KEY for logos
      </span>
    );
  }

  return (
    <button
      onClick={generate}
      disabled={status === "working"}
      className="inline-flex items-center gap-1.5 border border-current px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.15em] opacity-90 hover:opacity-100 disabled:opacity-50"
    >
      {status === "working" ? (
        <>
          <Loader2 size={11} className="animate-spin" /> Generating…
        </>
      ) : (
        <>
          <Sparkles size={11} /> {status === "error" ? "Retry logo" : "Generate logo"}
        </>
      )}
    </button>
  );
}
