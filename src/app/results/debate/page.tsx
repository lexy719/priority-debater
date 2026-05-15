"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DebateNavbar from "@/components/debate/DebateNavbar";
import PanelRoster from "@/components/debate/PanelRoster";
import DebateStage from "@/components/debate/DebateStage";
import DebateVerdict from "@/components/debate/DebateVerdict";
import TickerTape from "@/components/dashboard/TickerTape";
import {
  debateIdea,
  debatePersonas,
  debateRounds,
} from "@/data/debateData";

const initialPicks = () =>
  debatePersonas.reduce((acc, p) => ({ ...acc, [p.id]: null }), {} as Record<string, number | null>);

const initialShields = () =>
  debatePersonas.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {} as Record<string, number>);

export default function DebatePage() {
  const router = useRouter();
  const [turn, setTurn] = useState(0);
  const [picks, setPicks] = useState(initialPicks);
  const [shields, setShields] = useState(initialShields);
  const [finished, setFinished] = useState(false);

  const total = debateRounds.length;
  const currentRound = debateRounds[turn];
  const currentPersona = useMemo(
    () => debatePersonas.find((p) => p.id === currentRound?.personaId),
    [currentRound]
  );

  const statuses = debatePersonas.reduce((acc, p, i) => {
    if (finished) acc[p.id] = "done";
    else if (i < turn) acc[p.id] = "done";
    else if (i === turn) acc[p.id] = "active";
    else acc[p.id] = "waiting";
    return acc;
  }, {} as Record<string, "waiting" | "active" | "done">);

  const totalShields = Object.values(shields).reduce((a, b) => a + b, 0);
  const maxShields = total * 3;

  const handlePick = (optionIdx: number) => {
    const strength = currentRound.options[optionIdx].strength;
    if (!currentPersona) return;
    setPicks((prev) => ({ ...prev, [currentPersona.id]: optionIdx }));
    setShields((prev) => ({ ...prev, [currentPersona.id]: strength }));
  };

  const handleContinue = () => {
    if (turn + 1 >= total) {
      setFinished(true);
    } else {
      setTurn(turn + 1);
    }
  };

  const handleRestart = () => {
    setTurn(0);
    setPicks(initialPicks());
    setShields(initialShields());
    setFinished(false);
  };

  return (
    <div data-testid="debate-page" className="min-h-screen bg-[var(--paper)] text-black">
      <DebateNavbar
        round={finished ? total : turn + 1}
        total={total}
        shieldsTotal={totalShields}
        maxShields={maxShields}
      />
      <TickerTape />

      <section className="border-b border-black bg-black text-white">
        <div className="mx-auto grid max-w-[1480px] gap-6 px-6 py-8 lg:grid-cols-12 lg:px-10 lg:py-10">
          <div className="lg:col-span-8">
            <div className="font-mono text-[10px] tracking-wider text-white/50">§DEBATE / DEFENDING</div>
            <h1 className="mt-2 font-display text-[32px] leading-[0.95] sm:text-[44px] lg:text-[54px]">
              "{debateIdea.title}"
            </h1>
            <p className="mt-3 max-w-2xl font-mono text-[12.5px] leading-relaxed text-white/55">
              {debateIdea.one_liner}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-px border border-white/20 bg-white/10 lg:col-span-4">
            <div className="bg-black p-4">
              <div className="font-mono text-[10px] text-white/45">STAGE</div>
              <div className="mt-2 font-display text-xl">{debateIdea.stage}</div>
            </div>
            <div className="bg-black p-4">
              <div className="font-mono text-[10px] text-white/45">TURN</div>
              <div className="mt-2 font-display text-xl">
                {String(finished ? total : turn + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
              </div>
            </div>
            <div className="bg-black p-4">
              <div className="font-mono text-[10px] text-white/45">SHIELDS</div>
              <div className="mt-2 font-display text-xl text-[var(--hi)]">
                {totalShields}/{maxShields}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/15">
          <div className="mx-auto flex max-w-[1480px] items-center gap-1 px-6 py-3 lg:px-10">
            {debateRounds.map((_, i) => {
              const isPast = i < turn || finished;
              const isCurrent = !finished && i === turn;
              return (
                <div
                  key={i}
                  data-testid={`progress-${i}`}
                  className={`h-1.5 flex-1 transition-colors ${
                    isPast
                      ? "bg-[var(--hi)]"
                      : isCurrent
                      ? "bg-white"
                      : "bg-white/15"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1480px] px-6 py-10 lg:px-10 lg:py-14">
        {!finished ? (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              {currentPersona ? (
                <DebateStage
                  key={currentPersona.id}
                  persona={currentPersona}
                  round={currentRound}
                  picked={picks[currentPersona.id]}
                  onPick={handlePick}
                  onContinue={handleContinue}
                />
              ) : null}
            </div>
            <div className="lg:col-span-4">
              <PanelRoster
                personas={debatePersonas}
                statuses={statuses}
                current={currentPersona?.id ?? ""}
                shields={shields}
                onJump={() => {}}
              />
            </div>
          </div>
        ) : (
          <DebateVerdict
            shields={shields}
            picks={picks}
            onRestart={handleRestart}
            onExit={() => router.push("/")}
          />
        )}
      </main>

      <TickerTape dark />
    </div>
  );
}
