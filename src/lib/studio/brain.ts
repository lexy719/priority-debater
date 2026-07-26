/**
 * The marketing brain — taught know-how shared by client UI and server routes.
 * Core rules ship with the machine; taught rules are added per company and
 * persisted via the brain repo. Like Loam's critiques for websites: the brain
 * holds what converts and what never ships, and generation is steered by it.
 */

export type BrainRule = {
  k: string; txt: string; kind: "do" | "dont";
  /** core = ships with the machine · taught = added by the human ·
      company = Claude-generated guidelines unique to THIS business ·
      learned = distilled from MEASURED performance (traffic + orders). */
  src: "core" | "taught" | "company" | "learned";
  /** Which creative the rule governs. Absent = copy (legacy files). */
  domain?: "copy" | "video";
};

export const CORE_RULES: BrainRule[] = [
  // ── copy ──────────────────────────────────────────────────────────────
  { k: "HOOK-3S", txt: "Hook lands in the first line / first 3 seconds", kind: "do", src: "core", domain: "copy" },
  { k: "ONE-IDEA", txt: "One idea per ad — no feature dumps", kind: "do", src: "core", domain: "copy" },
  { k: "NAME-AUDIENCE", txt: "Names the audience it targets", kind: "do", src: "core", domain: "copy" },
  { k: "SPECIFICS", txt: "Specifics over adjectives — facts build trust", kind: "do", src: "core", domain: "copy" },
  { k: "CTA-NEXT", txt: "CTA states the exact next step", kind: "do", src: "core", domain: "copy" },
  { k: "NO-HYPE", txt: "No hype words — revolutionary, game-changing", kind: "dont", src: "core", domain: "copy" },
  { k: "NO-WALLS", txt: "No walls of text — agents and humans skim", kind: "dont", src: "core", domain: "copy" },
  { k: "NO-STOCK", txt: "No generic stock-footage energy in creative", kind: "dont", src: "core", domain: "copy" },
  { k: "NO-TAG-SPAM", txt: "Max 3 hashtags · zero on paid placements", kind: "dont", src: "core", domain: "copy" },
  // ── video — enforced at the STORYBOARD, before any render spend ───────
  { k: "V-HOOK-1ST", txt: "First shot IS the hook — no logo intros", kind: "do", src: "core", domain: "video" },
  { k: "V-CTA-CARD", txt: "Ends on a CTA card — product + exact next step", kind: "do", src: "core", domain: "video" },
  { k: "V-PACE-4S", txt: "No shot holds longer than ~4 seconds", kind: "do", src: "core", domain: "video" },
  { k: "V-DUR-FIT", txt: "Duration fits placement — 9:16 ≤15s · 16:9 ≤30s · 1:1 ≤6s", kind: "do", src: "core", domain: "video" },
  { k: "V-OVERLAY", txt: "Hooks, captions, prices as OVERLAYS — video models garble burned-in text", kind: "do", src: "core", domain: "video" },
  { k: "V-MUTED", txt: "Works with sound off — captions carry the message", kind: "do", src: "core", domain: "video" },
  { k: "V-NO-SLOP", txt: "No generic AI-slop frames — every shot is THIS business", kind: "dont", src: "core", domain: "video" },
];

/** Video rules the pipeline enforces by construction (overlay text rendering,
    brand-locked art, captioned hooks) — always green, labeled as such. */
export const PIPELINE_ENFORCED = new Set(["V-OVERLAY", "V-MUTED", "V-NO-SLOP"]);

const DUR_LIMIT: Record<string, number> = { "9:16": 15, "16:9": 30, "1:1": 6 };
const durSeconds = (dur: string): number => {
  const [m, s] = dur.split(":").map(Number);
  return (m || 0) * 60 + (s || 0);
};

/** Deterministic storyboard checks for the video-domain core rules. */
export function videoBrainCheck(v: { dur: string; fmt: string; shots: string[] }): Record<string, boolean> {
  const secs = durSeconds(v.dur);
  return {
    "V-HOOK-1ST": /HOOK/i.test(v.shots[0] ?? ""),
    "V-CTA-CARD": /CTA/i.test(v.shots[v.shots.length - 1] ?? ""),
    "V-PACE-4S": v.shots.length > 0 && secs / v.shots.length <= 4.2,
    "V-DUR-FIT": secs <= (DUR_LIMIT[v.fmt] ?? 30),
    "V-OVERLAY": true, "V-MUTED": true, "V-NO-SLOP": true,
  };
}

const FILL_BEATS = ["SHOW", "DETAIL", "PROOF", "USE", "RESULT"];

/** Auto-fix a storyboard into brain compliance BEFORE it costs a render:
    hook first, CTA card last, enough beats to hold the pacing rule. */
export function enforceBoard(shots: string[], dur: string): string[] {
  const secs = durSeconds(dur);
  let board = shots.filter(Boolean).map((s) => s.toUpperCase().slice(0, 7));
  if (!/HOOK/i.test(board[0] ?? "")) board = ["HOOK", ...board];
  if (!/CTA/i.test(board[board.length - 1] ?? "")) board = [...board, "CTA"];
  const minShots = Math.min(8, Math.ceil(secs / 4));
  let fill = 0;
  while (board.length < minShots) board.splice(board.length - 1, 0, FILL_BEATS[fill++ % FILL_BEATS.length]);
  return board.slice(0, 8);
}

/** The company's persisted look — every render brief inherits it, so footage
    for one business can never drift into another's (or into generic slop). */
export type VisualWorld = {
  setting: string;   // where the footage lives (the studio, the desk at 5am…)
  lighting: string;  // e.g. "warm kiln-glow, low contrast, late afternoon"
  materials: string; // textures the camera should love
  camera: string;    // default movement language, e.g. "slow push-ins, handheld"
  avoid: string;     // visuals that must never appear
};

export type Brain = { code: string; rules: BrainRule[]; visual?: VisualWorld; updatedAt: string };

/* ── render specs: the shot-level contract a video ad renders from ──────── */
export type BriefShot = {
  beat: string;      // HOOK / GLAZE / CTA …
  prompt: string;    // full visual prompt (subject · setting · lighting · mood)
  camera: string;    // DoP move: push-in, orbit, crash-zoom, static…
  seconds: number;
  overlay: string;   // text rendered as overlay ("" = none); never burned-in
};
export type VideoBrief = {
  platform: string; fmt: string; dur: string;
  hook: string;
  product: { name: string; price: string } | null;
  shots: BriefShot[];
};

/** Deterministic lint for a render spec — the pre-spend quality gate. */
export function briefCheck(b: VideoBrief): Record<string, boolean> {
  const secs = b.shots.reduce((a, s) => a + (s.seconds || 0), 0);
  const target = (() => { const [m, s] = b.dur.split(":").map(Number); return (m || 0) * 60 + (s || 0); })();
  return {
    "B-HOOK-1ST": /HOOK/i.test(b.shots[0]?.beat ?? ""),
    "B-CTA-LAST": /CTA/i.test(b.shots[b.shots.length - 1]?.beat ?? ""),
    "B-TIMING": Math.abs(secs - target) <= 2,
    "B-CAMERA": b.shots.every((s) => s.camera.trim().length > 2),
    "B-OVERLAY-7W": b.shots.every((s) => s.overlay.trim().split(/\s+/).filter(Boolean).length <= 7),
    "B-PRODUCT": !!b.product && b.shots.some((s) => s.prompt.toLowerCase().includes((b.product?.name ?? "").toLowerCase().slice(0, 12))),
    "B-PROMPT-RICH": b.shots.every((s) => s.prompt.trim().length >= 40),
  };
}
