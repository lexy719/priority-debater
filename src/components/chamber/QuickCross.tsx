"use client";

/**
 * QuickCross (§7) — the low-commitment entry point.
 *
 * Pick ONE seat, get that panelist's single hardest challenge + an honest quick
 * read, for a fraction of a full Chamber's credits. Doubles as a teaser: the
 * result card ends with a direct escalation into the full five-seat session.
 */

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { X, ArrowRight, Loader2, Zap } from "lucide-react";
import { CHAMBER_AGENTS, CHAMBER_IDS, type ChamberPersonaId } from "@/lib/chamber-personas";
import type { ChamberGrounding } from "@/lib/chamber-grounding";
import { useCreditsState } from "@/components/credits/CreditsProvider";
import { CREDIT_COSTS } from "@/lib/credits/costs";
import { buildCalibration } from "@/lib/chamber-stats";

type Lean = "intrigued" | "skeptical" | "hostile";
type Result = { challenge: string; read: string; lean: Lean };

const HUE: Record<ChamberPersonaId, string> = {
  vk: "var(--data)", mr: "var(--warn)", ht: "var(--success)", lv: "var(--danger)", es: "var(--accent)",
};
const LEAN_TONE: Record<Lean, string> = {
  intrigued: "var(--success)", skeptical: "var(--warn)", hostile: "var(--danger)",
};
const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export default function QuickCross({
  idea, grounding, onClose, onEnterFull,
}: {
  idea: string;
  grounding: ChamberGrounding | null;
  onClose: () => void;
  onEnterFull: () => void;
}) {
  const router = useRouter();
  const { state: credits, refresh } = useCreditsState();
  const [seat, setSeat] = useState<ChamberPersonaId | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cost = CREDIT_COSTS.quick_cross;

  const run = useCallback(async (id: ChamberPersonaId) => {
    setError(null);
    // Credit gate — mirror the full Chamber's entry rules at the cheaper rate.
    if (credits.configured) {
      if (!credits.authed) { router.push("/login?next=/debate"); return; }
      if ((credits.balance ?? 0) < cost) { setError(`Quick Cross costs ${cost} credits — you have ${credits.balance ?? 0}.`); return; }
    }
    setSeat(id);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/chamber/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, personaId: id, grounding: grounding ?? undefined, calibration: buildCalibration() ?? undefined }),
      });
      if (!res.ok) {
        setError(res.status === 402 ? "Not enough credits for Quick Cross." : "The engine is unreachable — try again.");
      } else {
        setResult((await res.json()) as Result);
        void refresh();
      }
    } catch {
      setError("The engine is unreachable — try again.");
    } finally {
      setLoading(false);
    }
  }, [idea, grounding, credits, cost, router, refresh]);

  const agent = seat ? CHAMBER_AGENTS[seat] : null;

  return (
    <div className="fixed inset-0 z-[60] bg-ink/85 backdrop-blur-md overflow-auto p-4 md:p-8" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="mx-auto max-w-2xl bg-ink text-ink-foreground border border-ink-foreground/25 grid-bg-ink">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-foreground/15">
          <div className="flex items-center gap-2 text-[10px] tracking-widest text-ink-foreground/55">
            <Zap className="size-3.5" /> QUICK CROSS · ONE SEAT · {cost} CR
          </div>
          <button onClick={onClose} className="text-ink-foreground/55 hover:text-ink-foreground"><X className="size-4" /></button>
        </div>

        <div className="p-6 md:p-8">
          <p className="text-sm text-ink-foreground/70 leading-relaxed mb-5">
            Not ready for the full room? Pick one adversary for a single hard pass — a fast gut-check before you commit to the seven-round Chamber.
          </p>

          {/* Seat picker */}
          <div className="grid sm:grid-cols-2 gap-2">
            {CHAMBER_IDS.map((id) => {
              const a = CHAMBER_AGENTS[id];
              const active = seat === id;
              return (
                <button key={id} onClick={() => run(id)} disabled={loading}
                  className={`flex items-center gap-3 border px-3 py-2.5 text-left transition-colors disabled:opacity-50 ${active ? "bg-ink-foreground/[0.06]" : "border-ink-foreground/15 hover:border-ink-foreground/35"}`}
                  style={active ? { borderColor: HUE[id] } : undefined}>
                  <span className="size-9 shrink-0 grid place-items-center border font-display text-sm" style={{ borderColor: HUE[id], color: HUE[id] }}>{initials(a.name)}</span>
                  <span className="min-w-0">
                    <span className="block font-display text-sm leading-none">{a.name}</span>
                    <span className="block text-[9px] tracking-widest mt-1 text-ink-foreground/45">{a.role.toUpperCase()}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {error && <div className="mt-4 border border-danger/50 bg-danger/[0.07] px-3 py-2.5 text-[12px] text-danger">{error}</div>}

          {loading && (
            <div className="mt-5 flex items-center gap-2 text-ink-foreground/60 text-[11px] tracking-widest">
              <Loader2 className="size-4 animate-spin" /> {agent?.name.toUpperCase()} IS SIZING UP THE IDEA…
            </div>
          )}

          {/* Result */}
          {result && agent && !loading && (
            <div className="mt-5 border border-ink-foreground/15 bg-ink-foreground/[0.03] p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="size-8 shrink-0 grid place-items-center border font-display text-[11px]" style={{ borderColor: HUE[seat!], color: HUE[seat!] }}>{initials(agent.name)}</span>
                  <div className="font-display text-sm truncate">{agent.name} <span className="text-[10px] tracking-widest" style={{ color: HUE[seat!] }}>· {agent.role.toUpperCase()}</span></div>
                </div>
                <span className="text-[10px] tracking-widest font-bold px-2 py-1 border shrink-0" style={{ color: LEAN_TONE[result.lean], borderColor: LEAN_TONE[result.lean] }}>{result.lean.toUpperCase()}</span>
              </div>
              <p className="text-[15px] leading-relaxed text-ink-foreground/90 italic">“{result.challenge}”</p>
              {result.read && <p className="mt-3 text-[13px] leading-relaxed text-ink-foreground/60 border-l-2 pl-3" style={{ borderColor: HUE[seat!] }}>{result.read}</p>}
            </div>
          )}

          {/* Escalate */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <button onClick={onEnterFull} className="flex-1 px-5 py-3.5 bg-danger text-ink-foreground font-display text-sm tracking-widest hover:opacity-90 flex items-center justify-center gap-2">
              ENTER THE FULL CHAMBER · {CREDIT_COSTS.debate} CR <ArrowRight className="size-4" />
            </button>
            {result && (
              <button onClick={() => { setResult(null); setSeat(null); }} className="px-5 py-3.5 border border-ink-foreground/30 text-ink-foreground/80 font-display text-sm tracking-widest hover:bg-ink-foreground/5">
                CROSS ANOTHER SEAT
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
