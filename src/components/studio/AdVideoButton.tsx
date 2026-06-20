"use client";

/**
 * AdVideoButton — generates a real video for a campaign ad cut via Higgsfield.
 *
 * Self-contained: builds a video prompt from the AI storyboard, submits the job,
 * polls until it renders, then plays the result inline. Degrades honestly —
 * premium lock (Pro), "not configured yet" (no HIGGSFIELD_API_KEY), or errors.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, RotateCcw, Lock } from "lucide-react";
import type { CampaignAd } from "@/lib/flow/types";

type Status = "idle" | "working" | "done" | "error" | "locked" | "unconfigured";

function buildPrompt(ad: CampaignAd): string {
  const beats = ad.scenes.map((s) => s.visual).filter(Boolean).join("; ");
  return [
    `${ad.concept}. ${ad.hook}`,
    beats && `Scene beats: ${beats}.`,
    `Cinematic ${ad.platform} ad, ${ad.aspect}, high production value, dynamic motion.`,
  ]
    .filter(Boolean)
    .join(" ");
}

function durationFrom(ad: CampaignAd): number {
  const m = /(\d+):(\d+)/.exec(ad.duration);
  const secs = m ? Number(m[1]) * 60 + Number(m[2]) : 5;
  return Math.min(8, Math.max(3, secs)); // keep short cuts for cost/speed
}

export function AdVideoButton({ ad }: { ad: CampaignAd }) {
  const [status, setStatus] = useState<Status>("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function generate() {
    setStatus("working");
    setError(null);
    setUrl(null);
    try {
      const res = await fetch("/api/studio/higgsfield/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: buildPrompt(ad), aspect: ad.aspect, durationSec: durationFrom(ad) }),
      });
      const j = await res.json();
      if (res.status === 401 || res.status === 402) {
        setStatus("locked");
        return;
      }
      if (res.status === 503) {
        setStatus("unconfigured");
        return;
      }
      if (!res.ok || !j.id) throw new Error(j?.message || j?.error || "Generation failed.");
      await poll(j.id as string);
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : "Generation failed.");
      setStatus("error");
    }
  }

  async function poll(id: string) {
    // Video renders take ~1–3 min; poll every 5s for up to ~5 min.
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      if (!mounted.current) return;
      const res = await fetch(`/api/studio/higgsfield/status?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const j = await res.json();
      if (j.status === "completed" && j.url) {
        if (!mounted.current) return;
        setUrl(j.url as string);
        setStatus("done");
        return;
      }
      if (j.status === "failed") throw new Error(j?.error || "Render failed.");
    }
    throw new Error("Still rendering — check back shortly.");
  }

  if (status === "done" && url) {
    return (
      <div className="col-span-2">
        <video src={url} controls className="w-full border border-black bg-black" />
        <button
          onClick={generate}
          className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-black/60 hover:text-black"
        >
          <RotateCcw size={12} /> Regenerate
        </button>
      </div>
    );
  }

  if (status === "locked") {
    return (
      <Link
        href="/pricing"
        className="col-span-2 inline-flex items-center justify-center gap-1.5 border-[1.5px] border-[#ff3b30] font-mono text-[10px] uppercase tracking-[0.12em] text-[#ff3b30] px-2.5 py-2 hover:bg-[#ff3b30] hover:text-white transition-colors"
      >
        <Lock size={12} /> Pro feature — upgrade to generate video
      </Link>
    );
  }

  if (status === "unconfigured") {
    return (
      <span className="col-span-2 inline-flex items-center justify-center gap-1.5 border border-black/20 font-mono text-[10px] uppercase tracking-[0.1em] text-black/50 px-2.5 py-2">
        Add HIGGSFIELD_API_KEY to render video
      </span>
    );
  }

  return (
    <button
      onClick={generate}
      disabled={status === "working"}
      data-testid="generate-video"
      className="inline-flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] bg-[#ff3b30] text-white px-2.5 py-2 hover:bg-black transition-colors disabled:opacity-60"
      title={error ?? undefined}
    >
      {status === "working" ? (
        <>
          <Loader2 size={12} className="animate-spin" /> Rendering…
        </>
      ) : status === "error" ? (
        <>
          <Sparkles size={12} /> Retry
        </>
      ) : (
        <>
          <Sparkles size={12} /> Generate video
        </>
      )}
    </button>
  );
}
