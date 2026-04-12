"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Megaphone, Sparkles, Download, Copy, CheckCircle2, AlertTriangle, Clapperboard } from "lucide-react";
import { StudioChrome } from "@/components/studio-chrome";
import { GlowCard } from "@/components/ui/glow-card";
import { loadSessionWithStatus } from "@/lib/session";
import { streamDebateMarkdown } from "@/lib/stream-debate-markdown";
import type { ValidationSession } from "@/lib/types";

export default function MarketingStudioPage() {
  const router = useRouter();
  const [session, setSession] = useState<ValidationSession | null>(null);
  const [content, setContent] = useState("");
  const [streaming, setStreaming] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyOk, setCopyOk] = useState(false);

  useEffect(() => {
    const result = loadSessionWithStatus();
    if (result.status === "expired") {
      alert("Your session has expired (24h limit). Please start a new validation.");
      router.replace("/validate");
      return;
    }
    if (result.status === "none") {
      router.replace("/validate");
      return;
    }
    const s = result.session;
    if (s.setup.template === "generate") {
      router.replace("/validate");
      return;
    }
    setSession(s);
  }, [router]);

  const run = useCallback(async () => {
    if (!session) return;
    setGenerating(true);
    setError(null);
    setStreaming("");
    setContent("");
    try {
      const full = await streamDebateMarkdown("marketing-campaigns", session, setStreaming);
      setContent(full);
      setStreaming("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate campaigns.");
    } finally {
      setGenerating(false);
    }
  }, [session]);

  const display = content || streaming;
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08080e]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500/50" />
      </div>
    );
  }

  return (
    <StudioChrome title={session.setup.topic} eyebrow="Marketing studio">
      <div className="space-y-8">
        <div className="flex items-center justify-center gap-2">
          <Megaphone className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Campaigns &amp; growth plan</h2>
        </div>
        <p className="text-white/40 text-sm max-w-2xl mx-auto text-center">
          Channel mix, creative angles, timelines, and experiment backlog based on your validation — not generic marketing filler.
        </p>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {!display && !generating && (
          <GlowCard glowColor="rgba(34,211,238,0.35)" className="rounded-2xl border border-white/8 bg-linear-to-br from-cyan-500/12 to-sky-500/8 p-8 text-center">
            <button
              type="button"
              onClick={run}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold shadow-lg shadow-cyan-500/20"
            >
              <Sparkles className="w-4 h-4" />
              Generate marketing plan
            </button>
          </GlowCard>
        )}

        {generating && !display && (
          <div className="rounded-2xl border border-white/6 bg-white/3 py-16 text-center text-white/40 text-sm">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400/50" />
            Building campaigns…
          </div>
        )}

        {display && (
          <div className="rounded-2xl bg-white/2 border border-white/6 overflow-hidden">
            <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3 border-b border-white/6">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(display).then(() => {
                    setCopyOk(true);
                    setTimeout(() => setCopyOk(false), 2000);
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/4 border border-white/6 text-xs text-white/50"
              >
                {copyOk ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copyOk ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const slug = session.setup.topic
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "")
                    .slice(0, 50);
                  const blob = new Blob([display], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${slug}-marketing.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" /> Markdown
              </button>
              <button type="button" onClick={run} disabled={generating} className="text-xs text-white/35 hover:text-white/55 disabled:opacity-40">
                Regenerate
              </button>
            </div>
            <div className="px-5 sm:px-8 py-6 prose prose-invert prose-sm max-w-none prose-p:text-white/50 prose-headings:text-white/90">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{display}</ReactMarkdown>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-6">
          <div className="flex items-center gap-2 text-white/70 text-sm font-semibold mb-2">
            <Clapperboard className="w-4 h-4 text-violet-400" />
            Video &amp; motion ads
          </div>
          <p className="text-white/40 text-sm leading-relaxed">
            OpenAI&apos;s Sora consumer product and API have been winding down, so you can&apos;t rely on a stable Sora API inside this app today. For launch ads and motion, export scripts from the plan above and produce video in{" "}
            <strong className="text-white/55">your</strong> tool of choice (e.g. runway, internal editors, or whatever you standardize on). If you later pick a video API with a clear ToS, we can wire a &quot;storyboard → clip&quot; step here.
          </p>
        </div>
      </div>
    </StudioChrome>
  );
}
