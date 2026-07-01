/**
 * Chamber calibration — the memory that makes the panel get SHARPER over time.
 *
 * The Chamber records the real outcome of every ruled session (chamber-stats.ts,
 * per device today; §8's shared library server-side later). This module turns
 * that history into a compact brief the agents arm with, so a seat knows its own
 * track record and the founder's recurring blind spots and can lean on them:
 * "You've left distribution unanswered twice — don't waste my time again."
 *
 * Pure TS (no storage, no server-only imports): the CLIENT builds the raw
 * payload from localStorage and posts it; the ROUTES sanitize + format it into
 * each agent's prompt. Never fabricates — an empty history yields no brief.
 */

export interface Calibration {
  /** The founder's most frequently-unresolved axes across prior cases. */
  axes: { axis: string; count: number }[];
  /** Per-seat track record, keyed by seat id. */
  seats: Record<string, { killRate: number | null; heard: number }>;
}

/** Clamp + coerce an untrusted calibration payload arriving at an API route. */
export function sanitizeCalibration(input: unknown): Calibration | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  const axesRaw = Array.isArray(o.axes) ? o.axes : [];
  const axes = axesRaw
    .slice(0, 3)
    .map((a) => {
      const r = a as Record<string, unknown>;
      return { axis: String(r?.axis ?? "").slice(0, 60).trim(), count: Math.max(0, Math.min(9999, Number(r?.count) || 0)) };
    })
    .filter((a) => a.axis && a.count > 0);

  const seats: Calibration["seats"] = {};
  const seatsRaw = o.seats && typeof o.seats === "object" ? (o.seats as Record<string, unknown>) : {};
  for (const id of ["vk", "mr", "ht", "lv", "es"]) {
    const s = seatsRaw[id] as Record<string, unknown> | undefined;
    if (!s) continue;
    const heard = Math.max(0, Math.min(99999, Number(s.heard) || 0));
    if (heard <= 0) continue;
    const kr = s.killRate;
    const killRate = typeof kr === "number" && kr >= 0 && kr <= 100 ? Math.round(kr) : null;
    seats[id] = { killRate, heard };
  }

  const hasContent = axes.length > 0 || Object.keys(seats).length > 0;
  return hasContent ? { axes, seats } : null;
}

/**
 * Render calibration into a prompt block. When `seatId` is given, the seat's own
 * track record is included as a first-person nudge; the founder's recurring axes
 * are always included. Returns "" when there's nothing worth saying.
 */
export function formatCalibration(c: Calibration | null, seatId?: string): string {
  if (!c) return "";
  const lines: string[] = [];
  const seat = seatId ? c.seats[seatId] : undefined;
  if (seat && seat.killRate != null) {
    lines.push(`Your record in this chamber: you've killed ${seat.killRate}% of the ${seat.heard} ideas you've heard. You know this pattern — don't be generous.`);
  }
  if (c.axes.length) {
    const worst = c.axes[0];
    lines.push(`This founder's ideas keep breaking on the same axis — ${worst.axis.toLowerCase()} (unresolved ${worst.count}× before). If it's yours to press, press it early and hard.`);
  }
  if (lines.length === 0) return "";
  return ["", "PANEL MEMORY — calibration from real prior sessions (use it, don't quote the stats verbatim to the founder):", ...lines.map((l) => `- ${l}`)].join("\n");
}
