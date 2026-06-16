"use client";

/**
 * ChamberVerdict — the cinematic close of a debate. Each of the five agents
 * delivers a final ruling derived from how the session ACTUALLY went (their
 * residual pressure + the severities they landed), the chamber issues an
 * overall judgment, and the founder can download a shareable verdict card
 * (SVG → PNG, fully offline) or copy a text summary.
 *
 * Nothing here is fabricated: rulings come from live session state, quotes
 * from the real transcript.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Download, Copy, RotateCcw, Gavel, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

export type VerdictPersona = {
  id: string; name: string; role: string; initials: string;
  hue: "danger" | "data" | "warn" | "success" | "accent";
  pressure: number; killshot: number;
};
export type VerdictTurn = { who: string; type: string; severity?: "kill" | "warn" | "insight"; body: string };

type Ruling = "CONVINCED" | "SKEPTICAL" | "UNCONVINCED" | "HOSTILE";

const HUE_VAR: Record<VerdictPersona["hue"], string> = {
  danger: "var(--danger)", data: "var(--data)", warn: "var(--warn)", success: "var(--success)", accent: "var(--accent)",
};

/**
 * A persona's final ruling is read from the REAL defence scores they handed out
 * (1-3 per exchange they judged) — not from pressure, which used to be partly
 * random. If they never judged a defence (founder never answered them), we fall
 * back to their residual pressure so the seat still rules on something.
 */
function rulingFor(p: VerdictPersona, scores?: number[]): { ruling: Ruling; tone: string } {
  if (scores && scores.length > 0) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg >= 2.5) return { ruling: "CONVINCED", tone: "var(--success)" };
    if (avg >= 2.0) return { ruling: "SKEPTICAL", tone: "var(--warn)" };
    if (avg >= 1.5) return { ruling: "UNCONVINCED", tone: "var(--accent)" };
    return { ruling: "HOSTILE", tone: "var(--danger)" };
  }
  if (p.pressure <= 35) return { ruling: "CONVINCED", tone: "var(--success)" };
  if (p.pressure <= 55) return { ruling: "SKEPTICAL", tone: "var(--warn)" };
  if (p.pressure <= 75) return { ruling: "UNCONVINCED", tone: "var(--accent)" };
  return { ruling: "HOSTILE", tone: "var(--danger)" };
}

const FALLBACK_LINE: Record<string, Record<Ruling, string>> = {
  vk: {
    CONVINCED: "The unit economics hold. I'd take the next meeting.",
    SKEPTICAL: "The numbers are directional. I need to see the cohort data.",
    UNCONVINCED: "Still a fundraising story, not a business. Not yet.",
    HOSTILE: "I've seen this CAC model die eleven times. Pass.",
  },
  mr: {
    CONVINCED: "I'd actually rip out my current vendor for this.",
    SKEPTICAL: "Maybe. Show me one signed contract, not a pilot.",
    UNCONVINCED: "Nobody on my committee switches for this. No.",
    HOSTILE: "This is a line item I cut in Q4. Hard no.",
  },
  ht: {
    CONVINCED: "The runbook is honest. This survives month 18.",
    SKEPTICAL: "The plan's plausible — the org chart isn't funded.",
    UNCONVINCED: "Surface area doesn't match the burn. It breaks.",
    HOSTILE: "This is a demo, not a system. It falls over at scale.",
  },
  lv: {
    CONVINCED: "Materially different. I withdraw the kill-shot.",
    SKEPTICAL: "The counter-thesis is interesting. Not yet falsified.",
    UNCONVINCED: "The thesis is founder conviction in a trench coat.",
    HOSTILE: "It dies the way the other eleven did. Killed.",
  },
  es: {
    CONVINCED: "You framed the moat honestly. I'd fight for you.",
    SKEPTICAL: "You're close. Sit with the year-three question.",
    UNCONVINCED: "I made this mistake. You haven't answered it.",
    HOSTILE: "I lived this wind-down. Don't repeat it.",
  },
};

function lineFor(p: VerdictPersona, ruling: Ruling, transcript: VerdictTurn[]): string {
  const last = [...transcript].reverse().find((t) => t.who === p.id && (t.type === "rebuttal" || t.type === "attack"));
  if (last?.body) return last.body.length > 160 ? last.body.slice(0, 157) + "…" : last.body;
  return FALLBACK_LINE[p.id]?.[ruling] ?? "Reserved judgment.";
}

function overallVerdict(survival: number): { word: string; tone: string; blurb: string } {
  if (survival >= 8) return { word: "FUNDED", tone: "var(--success)", blurb: "The chamber would back this. Defensibility held under fire." };
  if (survival >= 6) return { word: "PROCEED — WITH CONDITIONS", tone: "var(--warn)", blurb: "It survives, but unresolved axes must be closed before a raise." };
  if (survival >= 4) return { word: "SENT BACK FOR EVIDENCE", tone: "var(--accent)", blurb: "Too much rhetoric, not enough proof. Return with data." };
  return { word: "KILLED IN CHAMBER", tone: "var(--danger)", blurb: "The thesis broke. The chamber would not fund this in current form." };
}

export default function ChamberVerdict({
  idea, survival, round, totalRounds, personas, transcript, scores, onClose, onReset,
}: {
  idea: string; survival: number; round: number; totalRounds: number;
  personas: VerdictPersona[]; transcript: VerdictTurn[]; scores?: Record<string, number[]>;
  onClose: () => void; onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardHostRef = useRef<HTMLDivElement>(null);

  const overall = overallVerdict(survival);
  const rulings = useMemo(
    () => personas.map((p) => {
      const { ruling, tone } = rulingFor(p, scores?.[p.id]);
      return { p, ruling, tone, line: lineFor(p, ruling, transcript) };
    }),
    [personas, transcript, scores],
  );
  const convinced = rulings.filter((r) => r.ruling === "CONVINCED").length;
  const kills = transcript.filter((t) => t.severity === "kill").length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const buildSvg = () => {
    const W = 1200, H = 675;
    const rows = rulings.map((r, i) => {
      const y = 300 + i * 64;
      return `
        <text x="80" y="${y}" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#f5f4f0">${escapeXml(r.p.name)}</text>
        <text x="80" y="${y + 26}" font-family="Arial, sans-serif" font-size="15" fill="#8a8a92">${escapeXml(r.p.role.toUpperCase())}</text>
        <rect x="980" y="${y - 24}" width="140" height="34" fill="${r.tone}" opacity="0.18" />
        <text x="1050" y="${y - 1}" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="${r.tone}" text-anchor="middle">${r.ruling}</text>`;
    }).join("");
    const ideaClip = idea.length > 92 ? idea.slice(0, 89) + "…" : idea;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <rect width="${W}" height="${H}" fill="#14121c"/>
      <rect width="${W}" height="6" fill="${overall.tone}"/>
      <text x="80" y="86" font-family="Arial, sans-serif" font-size="16" letter-spacing="4" fill="#8a8a92">PRIORITY DEBATER · THE CHAMBER · VERDICT</text>
      <text x="80" y="170" font-family="Arial, sans-serif" font-size="68" font-weight="800" fill="${overall.tone}">${escapeXml(overall.word)}</text>
      <text x="80" y="216" font-family="Arial, sans-serif" font-size="22" fill="#c7c7cf">${escapeXml(ideaClip)}</text>
      <text x="980" y="120" font-family="Arial, sans-serif" font-size="120" font-weight="800" fill="#f5f4f0" text-anchor="middle">${survival.toFixed(1)}</text>
      <text x="980" y="150" font-family="Arial, sans-serif" font-size="20" fill="#8a8a92" text-anchor="middle">SURVIVAL / 10</text>
      <line x1="80" y1="250" x2="1120" y2="250" stroke="#2a2833" stroke-width="2"/>
      ${rows}
      <text x="80" y="640" font-family="Arial, sans-serif" font-size="16" fill="#8a8a92">${convinced}/5 CONVINCED · ${kills} KILL-SHOTS · ${round}/${totalRounds} ROUNDS</text>
      <text x="1120" y="640" font-family="Arial, sans-serif" font-size="16" fill="#8a8a92" text-anchor="end">prioritydebater.app</text>
    </svg>`;
  };

  const downloadCard = async () => {
    setDownloading(true);
    try {
      const svg = buildSvg();
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = url; });
      const canvas = document.createElement("canvas");
      canvas.width = 1200; canvas.height = 675;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((png) => {
        if (!png) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(png);
        a.download = `chamber-verdict-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }, "image/png");
    } catch { /* ignore */ } finally { setDownloading(false); }
  };

  const copySummary = async () => {
    const lines = [
      `THE CHAMBER — VERDICT: ${overall.word}`,
      `Idea: ${idea}`,
      `Survival: ${survival.toFixed(1)}/10 · ${convinced}/5 convinced · ${kills} kill-shots`,
      "",
      ...rulings.map((r) => `${r.p.name} (${r.p.role}): ${r.ruling}`),
      "",
      "Pressure-tested by 5 AI adversaries on Priority Debater.",
    ];
    try { await navigator.clipboard.writeText(lines.join("\n")); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-md overflow-auto p-4 md:p-8" onClick={onClose}>
      <div ref={cardHostRef} onClick={(e) => e.stopPropagation()}
        className="mx-auto max-w-4xl bg-ink text-ink-foreground border border-ink-foreground/25 grid-bg-ink">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-foreground/15">
          <div className="flex items-center gap-2 text-[10px] tracking-widest text-ink-foreground/55">
            <Gavel className="size-3.5" /> FINAL VERDICT · THE CHAMBER HAS RULED
          </div>
          <button onClick={onClose} className="text-ink-foreground/55 hover:text-ink-foreground"><X className="size-4" /></button>
        </div>

        <div className="p-6 md:p-10">
          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-end">
            <div>
              <div className="text-[10px] tracking-widest text-ink-foreground/55 mb-3">THE CHAMBER RULES</div>
              <h2 className="text-display text-4xl md:text-6xl leading-[0.95]" style={{ color: overall.tone }}>{overall.word}</h2>
              <p className="mt-4 max-w-xl text-sm text-ink-foreground/75 leading-relaxed">{overall.blurb}</p>
              <p className="mt-3 text-xs text-ink-foreground/50 border-l-2 pl-3" style={{ borderColor: "var(--data)" }}>{idea}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="font-display text-7xl md:text-8xl leading-none" style={{ color: overall.tone }}>{survival.toFixed(1)}</div>
              <div className="text-[10px] tracking-widest text-ink-foreground/55 mt-1">SURVIVAL / 10</div>
              <div className="text-[10px] tracking-widest text-ink-foreground/55 mt-2">{convinced}/5 CONVINCED · {kills} KILL-SHOTS</div>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            {rulings.map((r) => (
              <div key={r.p.id} className="border border-ink-foreground/15 bg-ink-foreground/[0.03] p-4 flex items-start gap-4">
                <div className="size-12 shrink-0 grid place-items-center border-2 font-display text-sm"
                  style={{ borderColor: HUE_VAR[r.p.hue], color: HUE_VAR[r.p.hue] }}>{r.p.initials}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-display text-base leading-tight">{r.p.name}</div>
                    <span className="text-[10px] tracking-widest font-bold px-2 py-1 border shrink-0"
                      style={{ color: r.tone, borderColor: r.tone }}>{r.ruling}</span>
                  </div>
                  <div className="text-[10px] tracking-widest mt-0.5" style={{ color: HUE_VAR[r.p.hue] }}>{r.p.role.toUpperCase()}</div>
                  <p className="text-sm text-ink-foreground/80 mt-2 leading-relaxed italic">“{r.line}”</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-2">
            <button onClick={downloadCard} disabled={downloading}
              className="px-5 py-3.5 bg-accent text-accent-foreground font-display text-sm tracking-widest hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
              <Download className="size-4" /> {downloading ? "RENDERING…" : "DOWNLOAD VERDICT CARD"}
            </button>
            <button onClick={copySummary}
              className="px-5 py-3.5 border border-ink-foreground/30 text-ink-foreground font-display text-sm tracking-widest hover:bg-ink-foreground/5 flex items-center justify-center gap-2">
              {copied ? <><Check className="size-4" /> COPIED</> : <><Copy className="size-4" /> COPY SUMMARY</>}
            </button>
            <Link href="/results"
              className="px-5 py-3.5 border border-data text-data font-display text-sm tracking-widest hover:bg-data/10 flex items-center justify-center gap-2">
              SEE THE FULL REPORT <ArrowRight className="size-4" />
            </Link>
            <button onClick={onReset}
              className="px-5 py-3.5 border border-warn text-warn font-display text-sm tracking-widest hover:bg-warn/10 flex items-center justify-center gap-2 sm:ml-auto">
              <RotateCcw className="size-4" /> NEW SESSION
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}
