"use client";

/**
 * useTribunalVoice — gives each Chamber agent a distinct synthesized voice via
 * the browser SpeechSynthesis API. No network, no API key, works offline. This
 * is what makes the tribunal feel ALIVE: the adversary's kill-shot is spoken in
 * a low, deliberate cadence; the investor is clipped and cold; the mentor warm.
 *
 * Voice availability varies by OS/browser, so we score the available voices and
 * assign the best distinct match per persona, then shape pitch/rate per persona
 * to differentiate even when only one system voice exists.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChamberPersonaId } from "@/lib/chamber-personas";

type Profile = {
  pitch: number;     // 0–2
  rate: number;      // 0.1–10 (we stay ~0.8–1.15)
  prefer: "female" | "male" | "any";
  /** rank bonus for voices whose name hints at this timbre */
  hints: string[];
};

const PROFILES: Record<ChamberPersonaId, Profile> = {
  // Investor — cold, clipped, slightly fast.
  vk: { pitch: 1.08, rate: 1.08, prefer: "female", hints: ["samantha", "victoria", "zira", "google us english", "fiona"] },
  // Customer — blunt, grounded, mid-low.
  mr: { pitch: 0.82, rate: 0.98, prefer: "male", hints: ["daniel", "david", "alex", "fred", "google uk english male"] },
  // Operator — measured, even.
  ht: { pitch: 0.95, rate: 0.95, prefer: "male", hints: ["google uk english male", "rishi", "tom", "oliver"] },
  // Adversary — low, slow, lethal.
  lv: { pitch: 0.72, rate: 0.9, prefer: "female", hints: ["karen", "tessa", "moira", "serena", "google uk english female"] },
  // Mentor — warm, unhurried.
  es: { pitch: 1.0, rate: 0.92, prefer: "male", hints: ["diego", "jorge", "google español", "carlos", "juan"] },
};

function scoreVoice(v: SpeechSynthesisVoice, p: Profile): number {
  const name = v.name.toLowerCase();
  let s = 0;
  if (v.lang.toLowerCase().startsWith("en")) s += 3;
  for (const h of p.hints) if (name.includes(h)) s += 6;
  if (p.prefer === "female" && /(female|woman|samantha|victoria|karen|tessa|moira|serena|zira|fiona|google us english)/.test(name)) s += 2;
  if (p.prefer === "male" && /(male|man|daniel|david|alex|fred|diego|jorge|rishi|tom|oliver)/.test(name)) s += 2;
  if (v.localService) s += 1; // local voices are lower-latency
  return s;
}

export function useTribunalVoice(enabled: boolean) {
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState<ChamberPersonaId | null>(null);
  const assignment = useRef<Record<string, SpeechSynthesisVoice | undefined>>({});

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);
    const load = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length) setVoices(list);
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  // Assign the best distinct voice to each persona once voices are known.
  useEffect(() => {
    if (!voices.length) return;
    const used = new Set<string>();
    const next: Record<string, SpeechSynthesisVoice | undefined> = {};
    // Greedy by descending best-fit so the strongest match wins its voice first.
    const order = (Object.keys(PROFILES) as ChamberPersonaId[]).sort(
      (a, b) =>
        Math.max(...voices.map((v) => scoreVoice(v, PROFILES[b]))) -
        Math.max(...voices.map((v) => scoreVoice(v, PROFILES[a]))),
    );
    for (const id of order) {
      const ranked = [...voices].sort((a, b) => scoreVoice(b, PROFILES[id]) - scoreVoice(a, PROFILES[id]));
      const pick = ranked.find((v) => !used.has(v.name)) ?? ranked[0];
      if (pick) { used.add(pick.name); next[id] = pick; }
    }
    assignment.current = next;
  }, [voices]);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setSpeakingId(null);
  }, []);

  const speak = useCallback((personaId: ChamberPersonaId, text: string) => {
    if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const profile = PROFILES[personaId];
    if (!profile) return;
    // Trim stage-direction noise; speak at most ~320 chars so turns stay snappy.
    const clean = text.replace(/\s+/g, " ").trim().slice(0, 320);
    const u = new SpeechSynthesisUtterance(clean);
    const v = assignment.current[personaId];
    if (v) u.voice = v;
    u.pitch = profile.pitch;
    u.rate = profile.rate;
    u.volume = 1;
    u.onstart = () => { setSpeaking(true); setSpeakingId(personaId); };
    u.onend = () => { setSpeaking(false); setSpeakingId(null); };
    u.onerror = () => { setSpeaking(false); setSpeakingId(null); };
    synth.speak(u);
  }, [enabled]);

  // Stop any speech when voice is turned off or the component unmounts.
  useEffect(() => { if (!enabled) stop(); }, [enabled, stop]);
  useEffect(() => () => stop(), [stop]);

  return { supported, speaking, speakingId, speak, stop };
}
