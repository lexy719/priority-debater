"use client";

/**
 * Fix Toolkit — the hands-on workspace.
 *
 * Generates installable, agent-ready assets from the merchant's REAL store
 * (llms.txt, schema, AI-crawler robots rules, a product feed built from their
 * actual catalogue) and lets them copy or download each one with install steps.
 * Keyless — works regardless of AI provider quota.
 */

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Copy, Check, Download, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { GeneratedArtifact } from "@/lib/commerce/generators";
import { PremiumLock } from "@/components/PremiumLock";

interface GenerateResponse {
  storeName: string;
  category: string;
  host: string;
  reachable: boolean;
  platform: string;
  productsFound: number;
  artifacts: GeneratedArtifact[];
}

export function Toolkit({ initialUrl = "" }: { initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GenerateResponse | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [rechecking, setRechecking] = useState(false);
  const [verify, setVerify] = useState<{ tone: "success" | "info"; text: string } | null>(null);
  const [locked, setLocked] = useState<{ needsLogin: boolean; message: string } | null>(null);

  const run = useCallback(async (target: string) => {
    if (!target.trim()) return;
    setLoading(true);
    setError(null);
    setLocked(null);
    try {
      const res = await fetch("/api/commerce/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const json = await res.json();
      if (res.status === 402 || res.status === 401) {
        setLocked({
          needsLogin: res.status === 401,
          message: json?.message ?? "Upgrade to Pro to unlock the Fix Toolkit.",
        });
        return;
      }
      if (!res.ok) throw new Error(json?.error ?? "Generation failed.");
      setData(json as GenerateResponse);
      setActiveId((json as GenerateResponse).artifacts[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialUrl) void run(initialUrl);
  }, [initialUrl, run]);

  // Re-fetch the live store and confirm which fixes are now published.
  async function recheck() {
    if (!data || rechecking) return;
    setRechecking(true);
    setVerify(null);
    try {
      const res = await fetch("/api/commerce/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = (await res.json()) as GenerateResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Re-check failed.");
      const prev = new Map(data.artifacts.map((a) => [a.id, a.present]));
      const newlyLive = json.artifacts.filter((a) => a.present && !prev.get(a.id));
      setData(json);
      setVerify(
        newlyLive.length
          ? { tone: "success", text: `Verified live: ${newlyLive.map((a) => a.title).join(", ")}` }
          : { tone: "info", text: "No new fixes detected yet — publish your changes, then re-check." },
      );
    } catch (err) {
      setVerify({ tone: "info", text: err instanceof Error ? err.message : "Re-check failed." });
    } finally {
      setRechecking(false);
    }
  }

  const active = data?.artifacts.find((a) => a.id === activeId) ?? null;
  const fileArtifacts = data?.artifacts.filter((a) => a.kind !== "outreach") ?? [];
  const liveCount = fileArtifacts.filter((a) => a.present).length;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void run(url);
  }

  async function copy(a: GeneratedArtifact) {
    try {
      await navigator.clipboard.writeText(a.content);
      setCopiedId(a.id);
      setTimeout(() => setCopiedId((c) => (c === a.id ? null : c)), 1500);
    } catch {
      /* clipboard blocked — user can still download */
    }
  }

  function download(a: GeneratedArtifact) {
    const blob = new Blob([a.content], { type: "text/plain;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = href;
    el.download = a.filename;
    document.body.appendChild(el);
    el.click();
    el.remove();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="bg-[#0c0c0f] text-[#f5f4f0]">
      {/* header */}
      <section className="relative overflow-hidden border-b border-white/12">
        <div className="absolute inset-0 bg-grid-dark opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
          <Link
            href="/commerce"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/55 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to audit
          </Link>
          <h1 className="mt-5 font-display text-4xl leading-[0.9] sm:text-6xl md:text-7xl">
            THE FIX <span className="highlight-red">TOOLKIT.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/55">
            Don&apos;t just read what&apos;s broken — ship the fix. We generate the exact files and
            snippets that make AI agents find, trust, and recommend your store, built from your real
            catalogue. Copy, paste, done.
          </p>

          <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-3 sm:flex-row sm:max-w-2xl">
            <div className="flex flex-1 items-center border border-white/15 bg-[#141417]">
              <span className="px-3 text-[11px] uppercase tracking-[0.2em] text-white/55">URL</span>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-store.com"
                className="flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/35"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-[color:var(--signal-red)] px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-white transition-opacity disabled:opacity-60"
            >
              {loading ? "Building…" : "Generate fixes →"}
            </button>
          </form>
          {error && (
            <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[color:var(--signal-red)]">{error}</p>
          )}
          {data && (
            <>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-white/55">
                <span>
                  Store: <span className="text-white">{data.storeName}</span>
                </span>
                <span>
                  Platform: <span className="text-white">{data.platform}</span>
                </span>
                <span>
                  Real products used:{" "}
                  <span className="text-white">{data.productsFound || "0 (templates)"}</span>
                </span>
                <span>
                  Live on store:{" "}
                  <span className="text-white">
                    {liveCount} / {fileArtifacts.length}
                  </span>
                </span>
                <button
                  onClick={recheck}
                  disabled={rechecking}
                  className="inline-flex items-center gap-2 border border-white/20 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/80 hover:border-white/50 hover:text-white disabled:opacity-60"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${rechecking ? "animate-spin" : ""}`} />
                  {rechecking ? "Checking…" : "Re-check my store"}
                </button>
              </div>
              {verify && (
                <div
                  className={`mt-4 flex items-center gap-2 border px-4 py-3 text-[11px] uppercase tracking-[0.16em] ${
                    verify.tone === "success"
                      ? "border-[color:var(--signal-green)]/40 bg-[color:var(--signal-green)]/10 text-[color:var(--signal-green)]"
                      : "border-white/15 bg-white/[0.04] text-white/70"
                  }`}
                >
                  {verify.tone === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                  <span>{verify.text}</span>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* paywall (free user, billing live) */}
      {locked && (
        <PremiumLock
          title="The Fix Toolkit is Pro"
          message={locked.message}
          needsLogin={locked.needsLogin}
          perks={[
            "Generate llms.txt, schema & feeds from your real catalogue",
            "AI-crawler rules + review/outreach kit",
            "Copy, download & re-check until it's live",
          ]}
        />
      )}

      {/* workspace */}
      {data && active && !locked && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
            {/* list */}
            <div className="space-y-2">
              {data.artifacts.map((a) => {
                const isActive = a.id === activeId;
                return (
                  <button
                    key={a.id}
                    onClick={() => setActiveId(a.id)}
                    className={`flex w-full items-start gap-3 border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-[color:var(--signal-red)] bg-[color:var(--signal-red)]/10"
                        : "border-white/12 bg-[#141417] hover:border-white/30"
                    }`}
                  >
                    <span className="flex-1">
                      <span className="block text-sm text-white">{a.title}</span>
                      <span className="mt-0.5 block font-mono text-[10px] text-white/45">{a.filename}</span>
                    </span>
                    {a.kind === "outreach" ? (
                      <span className="border border-[color:var(--signal-blue)]/40 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[color:var(--signal-blue)]">
                        Action
                      </span>
                    ) : a.present ? (
                      <span className="border border-[color:var(--signal-green)]/40 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[color:var(--signal-green)]">
                        Live
                      </span>
                    ) : (
                      <span className="border border-[color:var(--signal-amber)]/40 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[color:var(--signal-amber)]">
                        Missing
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* detail */}
            <div className="border border-white/12 bg-[#141417]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/12 px-5 py-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-2xl text-white">{active.title}</h2>
                    {active.real ? (
                      <span className="border border-[color:var(--signal-blue)]/40 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[color:var(--signal-blue)]">
                        From your store
                      </span>
                    ) : (
                      <span className="border border-white/20 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-white/55">
                        Editable template
                      </span>
                    )}
                  </div>
                  <p className="mt-1 max-w-2xl text-xs text-white/55">{active.why}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copy(active)}
                    className="inline-flex items-center gap-2 border border-white/20 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white/80 hover:border-white/50 hover:text-white"
                  >
                    {copiedId === active.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedId === active.id ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={() => download(active)}
                    className="inline-flex items-center gap-2 bg-[color:var(--signal-red)] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                </div>
              </div>

              <pre className="max-h-[460px] overflow-auto bg-black/40 p-5 text-[12px] leading-relaxed text-[color:var(--signal-blue)]">
                <code>{active.content}</code>
              </pre>

              <div className="grid grid-cols-1 gap-px bg-white/12 sm:grid-cols-2">
                <div className="bg-[#141417] p-5">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/55">Install · Shopify</div>
                  <p className="mt-2 text-xs leading-relaxed text-white/70">{active.installShopify}</p>
                </div>
                <div className="bg-[#141417] p-5">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/55">Install · Other platforms</div>
                  <p className="mt-2 text-xs leading-relaxed text-white/70">{active.installGeneric}</p>
                </div>
              </div>

              {active.kind === "outreach" ? (
                <div className="border-t border-white/12 px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-white/55">
                  Off-site action — build authority where AI actually sources its recommendations.
                </div>
              ) : active.present ? (
                <div className="flex items-center gap-2 border-t border-white/12 px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-[color:var(--signal-green)]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Already live on your store
                </div>
              ) : (
                <div className="border-t border-white/12 px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-white/55">
                  Published it? Hit{" "}
                  <button onClick={recheck} className="text-white underline underline-offset-2">
                    Re-check my store
                  </button>{" "}
                  to confirm it&apos;s live.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {!data && !loading && !locked && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
          <div className="border border-dashed border-white/15 px-6 py-12 text-center text-sm text-white/45">
            Enter your store URL above to generate your agent-ready fix kit.
          </div>
        </section>
      )}
    </div>
  );
}
