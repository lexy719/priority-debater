"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Check, Loader2, ShoppingBag } from "lucide-react";
import { OutOfCreditsModal } from "@/components/credits/OutOfCreditsModal";
import { useCreditsState } from "@/components/credits/CreditsProvider";
import { useFork } from "@/components/home/ForkContext";
import { clearPanelFlowPersist } from "@/lib/panel-debate-session";
import { saveSession } from "@/lib/session";
import { streamDebateMarkdown } from "@/lib/stream-debate-markdown";
import { CREDIT_COSTS } from "@/lib/credits/costs";
import { ideaCategoryFromSetup } from "@/lib/dossier-from-session";
import type { ValidationSession } from "@/lib/types";
import { buildValidateDebateSetupFromSingleIdea } from "@/lib/validate-brief-setup";

const MIN_CHARS = 120;

const validationBullets = [
  "Five adversarial agents argue it - investor, customer, operator, adversary, mentor",
  "Audited score: deterministic rubric, web-enriched, evidence-capped",
  "No soft applause - ever",
];

const commerceBullets = [
  "Scores how AI shopping agents see your store",
  "Opens your live dashboard with the URL already loaded",
  "Per-product AI scores, the fix queue, and one-click optimisation",
];

const tags = ["~2 min", "No card required", "Audited scoring", "Shareable report"];

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ValidateNow() {
  const router = useRouter();
  const { fork } = useFork();
  const commerce = fork === "commerce";
  const { state, refresh } = useCreditsState();
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditGate, setCreditGate] = useState<{ balance: number } | null>(null);

  const len = value.trim().length;
  const canRun = commerce ? !pending : len >= MIN_CHARS && !pending;
  const accentText = commerce ? "text-signal-blue" : "text-signal-red";
  const accentBg = commerce ? "bg-signal-blue" : "bg-signal-red";
  const accentBorder = commerce ? "border-signal-blue/70" : "border-signal-red/70";
  const accentShadow = commerce
    ? "shadow-[8px_8px_0_0_var(--color-signal-blue)]"
    : "shadow-[8px_8px_0_0_var(--color-signal-red)]";

  const run = useCallback(async () => {
    if (!canRun) return;

    if (commerce) {
      const url = value.trim();
      // PD Commerce: a URL runs a scan straight into the report; empty → the landing.
      router.push(url ? `/commerce/results?url=${encodeURIComponent(url)}` : "/commerce");
      return;
    }

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
      const setup = buildValidateDebateSetupFromSingleIdea(value);
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
      void refresh();
      router.push("/results");
    } catch (err) {
      setPending(false);
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        router.push("/login?next=" + encodeURIComponent("/#validate"));
        return;
      }
      if (status === 402) {
        setCreditGate({ balance: state.balance ?? 0 });
        return;
      }
      setError(err instanceof Error ? err.message : "The panel couldn't convene. Try again.");
    }
  }, [canRun, commerce, refresh, router, state, value]);

  return (
    <section id="validate" className="scroll-mt-20 border-b border-paper/10 bg-ink text-paper grid-paper-dark">
      <div className="mx-auto max-w-[1120px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <div className="mb-6 font-mono text-[10px] uppercase tracking-[0.28em] text-paper/45">
              {commerce ? "02 / Store audit" : "02 / Input"}
            </div>
            <h2 className="font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.94] tracking-[-0.01em] text-paper">
              {commerce ? (
                <>
                  Drop the URL. <br />
                  The audit handles <span className="hl-blue">the</span> <br />
                  <span className="hl-blue">rest.</span>
                </>
              ) : (
                <>
                  Drop the pitch. <br />
                  The panel handles <span className="hl-yellow">the</span> <br />
                  <span className="hl-yellow">rest.</span>
                </>
              )}
            </h2>
            <p className="mt-7 max-w-md text-[15px] leading-relaxed text-paper/65">
              {commerce
                ? "Enter a live store URL. Your AI-visibility dashboard opens with that URL, runs the audit, and lays out every fix plus per-product scores."
                : "Tell us what you are building, who pays, and why now. The panel turns it into a structured stress test, then the synthesis engine writes your dossier."}
            </p>
            <ul className="mt-7 space-y-2.5 font-mono text-[12px] text-paper/80">
              {(commerce ? commerceBullets : validationBullets).map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${accentText}`} /> {b}
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

          <div className="lg:col-span-7">
            <div className={`border bg-[#15110f] ${accentBorder} ${accentShadow}`}>
              <div className="flex items-center justify-between border-b border-paper/10 px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${accentBg}`} />
                  <span className="h-3 w-3 rounded-full bg-signal-yellow" />
                  <span className="h-3 w-3 rounded-full bg-signal-green" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper/45">
                  {commerce ? "commerce-audit / store.exe" : "idea-validation / panel.exe"}
                </span>
                {commerce ? (
                  <span className="font-mono text-[10px] text-paper/45">URL</span>
                ) : (
                  <span className={`font-mono text-[10px] ${len >= MIN_CHARS ? "text-signal-green" : "text-paper/45"}`}>
                    {Math.min(len, MIN_CHARS)}/{MIN_CHARS}+
                  </span>
                )}
              </div>

              <div className="p-5">
                <div className={`flex items-center gap-2 font-mono text-[11px] ${accentText}`}>
                  <span className="text-paper/40">$</span> {commerce ? "./audit --store-url" : "./debate --idea"}
                </div>
                {commerce ? (
                  <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={pending}
                    placeholder="https://your-store.com"
                    className="mt-3 w-full border border-paper/10 bg-[#0e0b0a] p-4 font-mono text-sm leading-relaxed text-paper/85 placeholder:text-paper/35 focus:border-signal-blue/60 focus:outline-none disabled:opacity-60"
                  />
                ) : (
                  <textarea
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={pending}
                    placeholder="Pitch your idea in one shot: what you are building, who pays, the pain, why now, and what is hard. We need enough signal to argue - aim for a few dense sentences."
                    className="mt-3 h-60 w-full resize-none border border-paper/10 bg-[#0e0b0a] p-4 font-mono text-xs leading-relaxed text-paper/85 placeholder:text-paper/35 focus:border-signal-red/60 focus:outline-none disabled:opacity-60"
                  />
                )}

                {error && !commerce && (
                  <div className="mt-4 flex items-center gap-2 border border-signal-red/60 bg-signal-red/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-signal-red">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className={`font-mono text-[10px] uppercase tracking-[0.16em] ${pending ? "text-signal-yellow" : commerce || len >= MIN_CHARS ? "text-signal-green" : "text-paper/45"}`}>
                    {commerce
                      ? "> ready to open your dashboard"
                      : pending
                        ? "> convening the panel..."
                        : len >= MIN_CHARS
                          ? "> enough signal. ready to argue."
                          : `> add ${MIN_CHARS - len} more characters`}
                  </p>
                  <div className="flex items-center gap-3">
                    {state.configured && !commerce && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/55">
                        {state.authed
                          ? `${CREDIT_COSTS.validation} credits - ${state.balance ?? 0} left`
                          : `${CREDIT_COSTS.validation} credits`}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={run}
                      disabled={!canRun}
                      className={`group inline-flex items-center gap-2 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-paper transition-colors hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 ${
                        commerce ? "bg-signal-blue" : "bg-signal-red"
                      }`}
                    >
                      {pending ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Panel in session...
                        </>
                      ) : commerce ? (
                        <>
                          Audit your store
                          <ShoppingBag className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </>
                      ) : (
                        <>
                          Run validation
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </>
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
