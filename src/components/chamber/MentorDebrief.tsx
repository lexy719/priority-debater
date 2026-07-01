"use client";

/**
 * MentorDebrief — the warm beat after the ruling.
 *
 * A deliberately DIFFERENT register from the Chamber: light, calm, no stamps,
 * no countdown, no severity tags. Eduardo Salgado steps out of the adversarial
 * frame and talks to the founder one-on-one — what to fix first, what to ignore,
 * and whether to revise-and-re-enter or move straight to Brand.
 *
 * Never blanks: it renders the honest deterministic fallback immediately, then
 * upgrades in place if the live AI debrief comes back. No credit charge.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw, Loader2, X } from "lucide-react";
import type { ChamberGrounding } from "@/lib/chamber-grounding";
import { debriefFallback, type DebateHandoff, type DebriefContent } from "@/lib/chamber-handoff";

export default function MentorDebrief({
  handoff, grounding, onClose, onRevise,
}: {
  handoff: DebateHandoff;
  grounding: ChamberGrounding | null;
  onClose: () => void;
  onRevise: () => void;
}) {
  const fallback = useMemo(() => debriefFallback(handoff), [handoff]);
  const [content, setContent] = useState<DebriefContent>(fallback);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const asked = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Fetch the live debrief once; keep the fallback if the engine is unreachable.
  useEffect(() => {
    if (asked.current) return;
    asked.current = true;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/chamber/debrief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idea: handoff.idea,
            survival: handoff.survival,
            gaps: handoff.gaps.map((g) => ({ axis: g.axis, persona: g.persona, status: g.status, quote: g.quote })),
            grounding: grounding ?? undefined,
          }),
        });
        if (res.ok) {
          const j = (await res.json()) as DebriefContent;
          if (!cancelled && j?.opening && j?.fixFirst) { setContent(j); setLive(true); }
        }
      } catch { /* keep fallback */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [handoff, grounding]);

  const proceed = content.path === "proceed";

  return (
    <div className="fixed inset-0 z-[60] bg-[#20201c]/70 backdrop-blur-md overflow-auto p-4 md:p-8" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-auto max-w-2xl bg-[#f4f2ec] text-[#1a1a17] border border-black/10 shadow-2xl rounded-sm"
      >
        {/* Header — warm, no chamber chrome */}
        <div className="flex items-center justify-between px-6 md:px-8 pt-7 pb-5 border-b border-black/10">
          <div className="flex items-center gap-4">
            <span className="size-12 grid place-items-center rounded-full border-2 border-[#b8863b] text-[#8a6222] font-display text-lg">ES</span>
            <div>
              <div className="font-display text-xl leading-none">Eduardo Salgado</div>
              <div className="text-[11px] tracking-wide text-black/45 mt-1">A private word — the room has cleared</div>
            </div>
          </div>
          <button onClick={onClose} className="text-black/40 hover:text-black" aria-label="Back to verdict"><X className="size-5" /></button>
        </div>

        <div className="px-6 md:px-8 py-7 space-y-7">
          {/* Opening */}
          <p className="text-[17px] leading-relaxed text-black/85">
            {content.opening}
            {loading && <Loader2 className="inline size-3.5 ml-2 animate-spin text-black/30 align-middle" />}
          </p>

          {/* Fix first */}
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#8a6222] mb-2">Fix this first</div>
            <p className="text-[15px] leading-relaxed text-black/80 border-l-2 border-[#b8863b] pl-4">{content.fixFirst}</p>
          </div>

          {/* Ignore */}
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-black/40 mb-2">And let this go</div>
            <p className="text-[15px] leading-relaxed text-black/60 border-l-2 border-black/15 pl-4">{content.ignore}</p>
          </div>

          {/* Recommendation */}
          <div className={`p-4 rounded-sm border ${proceed ? "border-[#2f7d4f]/30 bg-[#2f7d4f]/[0.06]" : "border-[#b8863b]/40 bg-[#b8863b]/[0.08]"}`}>
            <div className="text-[10px] tracking-[0.2em] uppercase mb-1.5" style={{ color: proceed ? "#2f7d4f" : "#8a6222" }}>
              {proceed ? "My call — keep moving" : "My call — sharpen it first"}
            </div>
            <p className="text-[15px] leading-relaxed text-black/75">{content.pathReason}</p>
          </div>

          {/* Actions — primary reflects the recommended path */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            {proceed ? (
              <>
                <Link href="/brand-kit" className="flex-1 px-5 py-3.5 bg-[#1a1a17] text-[#f4f2ec] font-display text-sm tracking-widest text-center hover:opacity-90 flex items-center justify-center gap-2">
                  CONTINUE TO BRAND KIT <ArrowRight className="size-4" />
                </Link>
                <button onClick={onRevise} className="px-5 py-3.5 border border-black/25 text-black/70 font-display text-sm tracking-widest hover:bg-black/[0.04] flex items-center justify-center gap-2">
                  <RotateCcw className="size-4" /> REVISE FIRST
                </button>
              </>
            ) : (
              <>
                <button onClick={onRevise} className="flex-1 px-5 py-3.5 bg-[#1a1a17] text-[#f4f2ec] font-display text-sm tracking-widest hover:opacity-90 flex items-center justify-center gap-2">
                  <RotateCcw className="size-4" /> TAKE ME BACK TO SHARPEN IT
                </button>
                <Link href="/brand-kit" className="px-5 py-3.5 border border-black/25 text-black/70 font-display text-sm tracking-widest text-center hover:bg-black/[0.04] flex items-center justify-center gap-2">
                  BRAND ANYWAY <ArrowRight className="size-4" />
                </Link>
              </>
            )}
          </div>
          {!live && !loading && (
            <p className="text-[11px] text-black/35 text-center">Offline read — Eduardo&apos;s live debrief needs the engine and a signed-in account.</p>
          )}
        </div>
      </div>
    </div>
  );
}
