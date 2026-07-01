/**
 * Chamber handoff — turns a finished (or in-progress) debate into the SEED for
 * whatever comes next in the Validate→Debate→Results→Studio flow.
 *
 * The whole point of the Chamber is that it exposes an idea's real weak point.
 * That weak point should not evaporate when the founder moves on: it becomes the
 * literal input to Brand / Launch / Campaign, so the next stage addresses the
 * gap the panel found instead of re-pitching the same undefended claim.
 *
 * This module is pure client TS (no server-only imports). It derives an honest
 * handoff from live session state — the persona scores the founder actually
 * earned, the severities that landed, and what was conceded — never invented.
 */

export type HandoffTurn = {
  who: string; // seat id or "you"
  type: string; // "attack" | "rebuttal" | "defense" | "concession" | ...
  severity?: "kill" | "warn" | "insight";
  body: string;
};

export type HandoffPersona = { id: string; name: string; role: string };

/** One unresolved gap the panel left on the table, ranked by how badly it hurt. */
export type HandoffGap = {
  /** Seat id that pressed it (vk/mr/ht/lv/es). */
  personaId: string;
  /** Human name of the challenger. */
  persona: string;
  /** Brand/business axis this seat owns — the label downstream stages key off. */
  axis: string;
  /** How the gap ended: conceded outright, or defended but not convincingly. */
  status: "conceded" | "undefended" | "weak";
  /** Whether a kill-shot landed on this axis. */
  killed: boolean;
  /** The sharpest thing the seat said on this axis (verbatim from transcript). */
  quote: string;
};

export interface DebateHandoff {
  idea: string;
  /** Final/running survival score, 0–10. */
  survival: number;
  /** Plain-language overall read, mirrors the verdict buckets. */
  ruling: string;
  /** Ranked unresolved gaps (worst first), capped for signal. */
  gaps: HandoffGap[];
  /**
   * A single ready-to-inject paragraph summarising the gaps for a downstream
   * generation prompt. Empty when the panel left nothing meaningfully open.
   */
  brief: string;
  savedAt: number;
}

/** Each seat owns a distinct business axis the next stages care about. */
const AXIS: Record<string, string> = {
  vk: "Distribution & moat",
  ht: "Operational credibility",
  mr: "Willingness to pay",
  lv: "Competitive positioning",
  es: "Long-term defensibility",
};

/** The business axis a seat owns, e.g. for labelling held/open axes in the verdict. */
export function axisFor(personaId: string, role = ""): string {
  return AXIS[personaId] ?? role.replace(/^The\s+/i, "");
}

function rulingFor(survival: number): string {
  if (survival >= 8) return "Held the line — strong.";
  if (survival >= 6) return "Survives, with unresolved axes.";
  if (survival >= 4) return "Bleeding — rhetoric over evidence.";
  return "Broke in chamber — needs a different angle.";
}

/**
 * Which seat held the floor immediately before a given transcript index — used
 * to attribute a founder concession to the persona who forced it.
 */
function lastAttackerBefore(transcript: HandoffTurn[], index: number): string | null {
  for (let i = index - 1; i >= 0; i--) {
    const t = transcript[i];
    if (t.who !== "you" && (t.type === "attack" || t.type === "rebuttal")) return t.who;
  }
  return null;
}

/** The most cutting line a seat delivered — a landed kill first, else its last attack. */
function sharpestQuote(transcript: HandoffTurn[], personaId: string): string {
  const mine = transcript.filter((t) => t.who === personaId && (t.type === "attack" || t.type === "rebuttal"));
  const kill = [...mine].reverse().find((t) => t.severity === "kill");
  const pick = kill ?? mine[mine.length - 1];
  const body = pick?.body?.trim() ?? "";
  return body.length > 180 ? body.slice(0, 177) + "…" : body;
}

/**
 * Derive the handoff from live debate state. `scores` holds the real 1–3 defence
 * grades each seat handed out (keyed by seat id). A gap is "unresolved" when the
 * seat was conceded to, landed a kill the founder never answered convincingly,
 * or was answered but averaged below a passing grade.
 */
export function deriveHandoff(
  idea: string,
  transcript: HandoffTurn[],
  personas: HandoffPersona[],
  scores: Record<string, number[]>,
  survival: number,
): DebateHandoff {
  // Which seats did the founder concede to?
  const conceded = new Set<string>();
  transcript.forEach((t, i) => {
    if (t.who === "you" && t.type === "concession") {
      const seat = lastAttackerBefore(transcript, i);
      if (seat) conceded.add(seat);
    }
  });

  const gaps: HandoffGap[] = [];
  for (const p of personas) {
    const grades = scores[p.id] ?? [];
    const avg = grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : null;
    const killed = transcript.some((t) => t.who === p.id && t.severity === "kill");
    const wasConceded = conceded.has(p.id);

    // Decide whether this axis is genuinely unresolved, and how badly.
    let status: HandoffGap["status"] | null = null;
    if (wasConceded) status = "conceded";
    else if (avg === null && killed) status = "undefended"; // kill landed, never answered
    else if (avg !== null && avg < 2) status = "weak"; // answered, didn't convince
    if (!status) continue;

    gaps.push({
      personaId: p.id,
      persona: p.name,
      axis: axisFor(p.id, p.role),
      status,
      killed,
      quote: sharpestQuote(transcript, p.id),
    });
  }

  // Worst first: conceded > undefended kills > weak; kills outrank non-kills.
  const rank = (g: HandoffGap) =>
    (g.status === "conceded" ? 3 : g.status === "undefended" ? 2 : 1) + (g.killed ? 0.5 : 0);
  gaps.sort((a, b) => rank(b) - rank(a));
  const top = gaps.slice(0, 3);

  return {
    idea: idea.trim(),
    survival,
    ruling: rulingFor(survival),
    gaps: top,
    brief: buildBrief(top, survival),
    savedAt: Date.now(),
  };
}

/* ============================= MENTOR DEBRIEF ============================= */

/**
 * The warm beat after the ruling — Eduardo Salgado, one-on-one. NOT another
 * verdict: what to fix first, what to ignore, and whether to revise-and-re-enter
 * or move straight to Brand. The AI route enriches this; this is the honest,
 * offline-safe fallback built purely from the debate's real gaps.
 */
export interface DebriefContent {
  /** Human opening in Eduardo's voice. */
  opening: string;
  /** The single most important thing to fix, tied to the worst gap. */
  fixFirst: string;
  /** What NOT to over-index on. */
  ignore: string;
  /** The recommended next move. */
  path: "revise" | "proceed";
  /** One line on why that path. */
  pathReason: string;
}

/** Concrete "do this Monday" advice per business axis. */
const FIX_BY_AXIS: Record<string, string> = {
  "Distribution & moat":
    "Before you write another line of code, name your first 10 customers and exactly how each one hears about you. If you can't, that gap is the actual work.",
  "Operational credibility":
    "Sketch the month-18 version on one page — who's on call, what breaks, what it costs to run. Not the demo. The machine behind it.",
  "Willingness to pay":
    "Go get one real person to say \"I'd pay for that\" with a number attached. One genuine yes beats ten polite maybes.",
  "Competitive positioning":
    "Write the single sentence for why you win where the incumbent structurally can't follow. If it sounds like their marketing, keep rewriting.",
  "Long-term defensibility":
    "Answer the year-three question honestly: what do you own that nobody copies in a weekend? Write it down even if it's uncomfortable.",
};

/** Build the offline-safe debrief from a derived handoff. */
export function debriefFallback(handoff: DebateHandoff): DebriefContent {
  const { gaps, survival } = handoff;
  const worst = gaps[0];
  const proceed = survival >= 6 || gaps.length === 0;

  const opening =
    survival >= 8
      ? "I'll be honest — that's a stronger showing than most ideas get in that room. You didn't just survive, you moved people. So let me not waste your time with reassurance you don't need."
      : survival >= 6
      ? "You held your ground in a room built to break you. That counts for more than the score does. Sit down for a second — here's what I'd actually do next, founder to founder."
      : survival >= 4
      ? "That was a hard room, and I've been on the wrong side of one exactly like it. It stings. But the panel handed you a map — and a map is worth more than a pat on the back."
      : "I built something close to this once, and I watched it come apart for reasons that room just named out loud. This isn't the end of the idea. It's the cheapest lesson you'll ever get on it.";

  const fixFirst = worst
    ? FIX_BY_AXIS[worst.axis] ??
      `Start with ${worst.axis.toLowerCase()} — that's where ${worst.persona.split(" ")[0]} got through and you didn't close it.`
    : "You left no obvious hole open — so the work now is proof, not patching. Turn one of your claims into something a stranger can verify.";

  const ignore =
    gaps.length > 1
      ? "Don't try to fix all of it at once. A room whose whole job is to break you will always find something — the signal is the gap that repeated, not every scratch they landed."
      : "Don't spiral on the theatrics. Some of those kill-shots were performance. Fix the one that was real and let the rest go.";

  const pathReason = proceed
    ? "The core held. You'll sharpen more by building the identity and putting it in front of people than by re-litigating the panel."
    : `The same axis — ${worst ? worst.axis.toLowerCase() : "your core thesis"} — is going to follow you into every next stage. Close it here, cheaply, before it costs you a launch.`;

  return { opening, fixFirst, ignore, path: proceed ? "proceed" : "revise", pathReason };
}

/** A compact, prompt-ready summary of the unresolved gaps for downstream stages. */
function buildBrief(gaps: HandoffGap[], survival: number): string {
  if (gaps.length === 0) return "";
  const verb: Record<HandoffGap["status"], string> = {
    conceded: "was conceded",
    undefended: "landed a kill-shot that went unanswered",
    weak: "was defended but not convincingly",
  };
  const lines = gaps.map((g) => `• ${g.axis} (${g.persona}) ${verb[g.status]}: "${g.quote}"`);
  return [
    `This idea was pressure-tested by a five-seat adversarial panel (survival ${survival.toFixed(1)}/10).`,
    `Unresolved after the debate — the next stage must directly address these, not restate the original pitch:`,
    ...lines,
  ].join("\n");
}
