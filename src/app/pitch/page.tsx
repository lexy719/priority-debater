"use client";

import { useEffect, useMemo, useState } from "react";
import PitchDeckPage from "@/components/pitch/PitchDeckPage";
import { deck as staticDeck, project as staticProject } from "@/data/studioData";
import { loadSessionWithStatus } from "@/lib/session";
import { buildDashboardViewModel } from "@/lib/dashboard-view-model";
import {
  buildDeckFromViewModel,
  buildPitchDeckTalkTrack,
  buildPitchProjectFromViewModel,
} from "@/lib/deck-from-view-model";
import type { ValidationSession } from "@/lib/types";

export default function PitchPage() {
  const [session, setSession] = useState<ValidationSession | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      const r = loadSessionWithStatus();
      setSession(r.status === "loaded" ? r.session : null);
    });
  }, []);

  const vm = useMemo(() => buildDashboardViewModel(session), [session]);
  const deck = useMemo(() => (vm.live ? buildDeckFromViewModel(vm) : staticDeck), [vm]);
  const projectInfo = useMemo(() => (vm.live ? buildPitchProjectFromViewModel(vm) : staticProject), [vm]);
  const talk = useMemo(() => buildPitchDeckTalkTrack(vm), [vm]);
  const footerByline = vm.live
    ? `FOUNDER · ${vm.idea.title.slice(0, 52)}`
    : "HELENA VOSS · FOUNDER · helena@cargobyte.eu";

  return (
    <PitchDeckPage
      deck={deck}
      project={projectInfo}
      footerByline={footerByline}
      talkTrackObjection={talk.objection}
      talkTrackAnswer={talk.answer}
    />
  );
}
