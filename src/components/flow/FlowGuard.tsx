"use client";

/**
 * FlowGuard — gates the post-validation studio (Brand → Launch → Campaign →
 * Landing → Ship) behind a validated idea.
 *
 * On a released site you should not be able to reach /launch-kit etc. without
 * first running a validation. This checks the session: if there's a loaded
 * validation it renders the page; otherwise it shows a locked screen that sends
 * the user to validate first. Boot is a sessionStorage read (instant), so a
 * validated user never sees the lock flash.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, ArrowRight, Clock } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { loadSessionWithStatus } from "@/lib/session";

type GuardState = "boot" | "ok" | "none" | "expired";

const STAGE_LABELS: Record<string, string> = {
  brand: "Brand Kit",
  launch: "Launch Kit",
  campaign: "Campaign",
  landing: "Landing Page",
  ship: "Launch Day",
  pitch: "Pitch Deck",
};

export function FlowGuard({
  stage,
  children,
}: {
  stage: keyof typeof STAGE_LABELS;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<GuardState>("boot");

  useEffect(() => {
    // Studio requires a validated idea (it builds around it). Credits are
    // charged per generation by the API routes — there is no separate paywall.
    const result = loadSessionWithStatus();
    setState(result.status === "loaded" ? "ok" : result.status);
  }, []);

  if (state === "ok") return <>{children}</>;

  // boot → render nothing visible to avoid a lock flash for validated users
  if (state === "boot") return <div className="min-h-screen bg-[#f4f4f0]" />;

  const expired = state === "expired";

  return (
    <div data-testid="flow-locked" className="min-h-screen bg-[#f4f4f0]">
      <SiteNav subtitle={`${STAGE_LABELS[stage]} — locked`} />

      <main className="mx-auto flex max-w-[760px] flex-col items-start gap-6 px-5 py-28 lg:px-8">
        <span className="grid h-14 w-14 place-items-center border-[1.5px] border-black bg-white shadow-hard-sm">
          {expired ? <Clock className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
        </span>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-black/40">
            §00 / {expired ? "Session expired" : "Studio locked"}
          </p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl uppercase leading-[0.95]">
            {expired ? (
              <>Your verdict timed out.</>
            ) : (
              <>
                Validate your idea to{" "}
                <span className="bg-[#ff3b30] text-white px-2">unlock the studio.</span>
              </>
            )}
          </h1>
        </div>

        <p className="max-w-xl font-body text-sm leading-relaxed text-black/65">
          The {STAGE_LABELS[stage]} is generated from your validated idea — its score, market and
          positioning. {expired
            ? "Your last validation expired, so run a fresh one to regenerate your kit."
            : "Run a validation first; the moment you have a verdict, the whole studio (brand, launch kit, campaign, landing page and launch-day checklist) unlocks and builds around it."}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/#validate"
            data-testid="flow-locked-cta"
            className="group inline-flex items-center gap-2 bg-black px-7 py-4 font-mono text-xs uppercase tracking-[0.2em] text-white border-[1.5px] border-black shadow-hard-sm hover:bg-[#ff3b30] transition-colors"
          >
            {expired ? "Re-run a validation" : "Validate an idea"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/results"
            className="inline-flex items-center gap-2 bg-white px-7 py-4 font-mono text-xs uppercase tracking-[0.2em] text-black border-[1.5px] border-black hover:bg-black hover:text-white transition-colors"
          >
            View a report
          </Link>
        </div>

        {/* The studio stages — locked preview */}
        <div className="mt-6 w-full border-t-[1.5px] border-black pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-black/40">
            Unlocks after validation
          </p>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
            {["Brand", "Launch", "Campaign", "Landing", "Ship"].map((s, i) => (
              <div key={s} className="flex items-center gap-2 border border-black/15 bg-white/60 px-3 py-2.5">
                <Lock className="h-3 w-3 text-black/30 shrink-0" />
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-black/50">
                  {String(i + 4).padStart(2, "0")} {s}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
