"use client";

/**
 * ValidateNow — the homepage's REAL validation entry point, styled to the
 * Emergent print: dark band, left headline + bullets + tags, right terminal
 * card with mac dots and a red RUN VALIDATION button. Runs the actual panel
 * validation, saves the session, routes to /results. Honest copy only.
 */

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, AlertTriangle } from "lucide-react";
import { ideaCategoryFromSetup } from "@/lib/dossier-from-session";
import { clearPanelFlowPersist } from "@/lib/panel-debate-session";
import { saveSession } from "@/lib/session";
import { streamDebateMarkdown } from "@/lib/stream-debate-markdown";
import type { ValidationSession } from "@/lib/types";
import { buildValidateDebateSetupFromSingleIdea } from "@/lib/validate-brief-setup";
import { useCreditsState } from "@/components/credits/CreditsProvider";
import { CREDIT_COSTS } from "@/lib/credits/costs";
import { OutOfCreditsModal } from "@/components/credits/OutOfCreditsModal";

const MIN_CHARS = 120;

const bullets = [
  "Five adversarial agents argue it — investor, customer, operator, adversary, mentor",
  "Audited score: deterministic rubric, web-enriched, evidence-capped",
  "No “great idea!” — ever",
];

const tags = ["~2 min", "No card required", "Audited scoring", "Shareable report"];

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ValidateNow() {
  const router = useRouter();
  const { state, refresh } = useCreditsState();
  const [pitch, setPitch] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditGate, setCreditGate] = useState<{ balance: number } | null>(null);

  const len = pitch.trim().length;
  const canRun = len >= MIN_CHARS && !pending;

  const run = useCallback(async () => {
    if (!canRun) return;
    // Credits are enforced server-side inside /api/debate. Pre-check the cached
    // balance for instant UX: sign in if logged out, modal if short.
    if (state.configured && !state.authed) {
      router.push("/login?next=" + encodeURIComponent("/#validate"));
      return;
    }
    if (state.configured && (state.balance ?? 0) < CREDIT_COSTS.validation) {
      setCreditGate({ balance: state.balance ?? 0 });
      return;
    }
    setError(null);
    setPending(true);
    try {
      const setup = buildValidateDebateSetupFromSingleIdea(pitch);
      let scoreReconciliation: ValidationSession["scoreReconciliation"];
      const markdown = await streamDebateMarkdown(
        "start",
        { setup, validationContent: "" },
        () => {},
        { onScoreReconciliation: (next) => { scoreReconciliation = next; } },
      );
      const session: ValidationSession = {
        setup,
        validationContent: markdown,
        messages: [{ id: newId(), role: "opponent", content: markdown }],
        createdAt: Date.now(),
        interviewChats: {},
        ...(scoreReconciliation ? { scoreReconciliation } : {}),
      };
      session.ideaCategory = ideaCategoryFromSetup(session);
      saveSession(session);
      clearPanelFlowPersist();
      void refresh(); // pull the new server balance into the navbar badge
      router.push("/results");
    } catch (err) {
      setPending(false);
      const status = (err as { status?: number })?.status;
      if (status === 401) { router.push("/login?next=" + encodeURIComponent("/#validate")); return; }
      if (status === 402) { setCreditGate({ balance: state.balance ?? 0 }); return; }
      setError(err instanceof Error ? err.message : "The panel couldn't convene. Try again.");
    }
  }, [canRun, pitch, router, state, refresh]);

  return (
    <section id="validate" className="scroll-mt-20 border-b border-paper/10 bg-ink text-paper grid-paper-dark">
      <div className="mx-auto max-w-[1120px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
          {/* Left */}
          <div className="lg:col-span-5">
            <div className="mb-6 font-mono text-[10px] uppercase tracking-[0.28em] text-paper/45">
              — 02 / Input
            </div>
            <h2 className="font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.94] tracking-[-0.01em] text-paper">
              Drop the pitch. <br />
              The panel handles{" "}
              <span className="hl-yellow">the</span> <br />
              <span className="hl-yellow">rest.</span>
            </h2>
            <p className="mt-7 max-w-md text-[15px] leading-relaxed text-paper/65">
              Tell us what you are building, who pays, and why now. The panel turns it into a
              structured stress test, then the synthesis engine writes your dossier.
            </p>
            <ul className="mt-7 space-y-2.5 font-mono text-[12px] text-paper/80">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal-red" /> {b}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="border border-paper/25 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-paper/70">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right — terminal card */}
          <div className="lg:col-span-7">
            <div className="border border-signal-red/70 bg-[#15110f] shadow-[8px_8px_0_0_var(--color-signal-red)]">
              {/* window bar */}
              <div className="flex items-center justify-between border-b border-paper/10 px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-signal-red" />
                  <span className="h-3 w-3 rounded-full bg-signal-yellow" />
                  <span className="h-3 w-3 rounded-full bg-signal-green" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper/45">
                  idea-validation · panel.exe
                </span>
                <span className={`font-mono text-[10px] ${len >= MIN_CHARS ? "text-signal-green" : "text-paper/45"}`}>
                  {Math.min(len, MIN_CHARS)}/{MIN_CHARS}+
                </span>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 font-mono text-[11px] text-signal-red">
                  <span className="text-paper/40">$</span> ./debate --idea
                </div>
                <textarea
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  disabled={pending}
                  placeholder="Pitch your idea in one shot: what you are building, who pays, the pain, why now, and what is hard. We need enough signal to argue — aim for a few dense sentences."
                  className="mt-3 h-60 w-full resize-none border border-paper/10 bg-[#0e0b0a] p-4 font-mono text-xs leading-relaxed text-paper/85 placeholder:text-paper/35 focus:border-signal-red/60 focus:outline-none disabled:opacity-60"
                />

                {error && (
                  <div className="mt-4 flex items-center gap-2 border border-signal-red/60 bg-signal-red/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-signal-red">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className={`font-mono text-[10px] uppercase tracking-[0.16em] ${pending ? "text-signal-yellow" : len >= MIN_CHARS ? "text-signal-green" : "text-paper/45"}`}>
                    {pending
                      ? "> convening the panel…"
                      : len >= MIN_CHARS
                        ? "> enough signal. ready to argue."
                        : `> add ${MIN_CHARS - len} more characters`}
                  </p>
                  <div className="flex items-center gap-3">
                    {state.configured && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/55">
                        {state.authed
                          ? `${CREDIT_COSTS.validation} credits · ${state.balance ?? 0} left`
                          : `${CREDIT_COSTS.validation} credits`}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={run}
                      disabled={!canRun}
                      className="group inline-flex items-center gap-2 bg-signal-red px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-paper transition-colors hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {pending ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Panel in session…</>
                      ) : (
                        <>Run validation <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {creditGate && (
        <OutOfCreditsModal action="validation" balance={creditGate.balance} onClose={() => setCreditGate(null)} />
      )}
    </section>
  );
}
