import "server-only";

/**
 * Higgsfield client — image + video generation for the studio and the Commerce
 * marketing worker.
 *
 * The wire contract, taken from the official SDKs (higgsfield-js /
 * higgsfield-client) rather than from third-party blog posts:
 *
 *   base    https://platform.higgsfield.ai
 *   auth    Authorization: Key <KEY_ID>:<KEY_SECRET>      ← a PAIR, not a Bearer
 *   image   POST /v1/text2image/soul
 *   video   POST /v1/image2video/dop
 *   poll    GET  /requests/{id}/status
 *   states  queued | in_progress | nsfw | failed | completed
 *   output  { images: [{ url }] } or { video: { url } }
 *
 * An earlier version of this file sent `Authorization: Bearer <one key>` to
 * `api.higgsfield.ai/v1/generations` with a model literally named
 * "default-video-model". All five of those were wrong, and because errors were
 * collapsed into a generic message nothing said so. Every failure path here
 * carries the API's own words back to the caller.
 */

const DEFAULT_BASE = "https://platform.higgsfield.ai";
const DEFAULT_IMAGE_PATH = "/v1/text2image/soul";
const DEFAULT_VIDEO_PATH = "/v1/image2video/dop";

/**
 * The credential pair. Accepts either the two halves as separate vars (what the
 * Higgsfield dashboard hands you) or a single combined "id:secret" string,
 * which is how both official SDKs let you pass it.
 */
function credentials(): { id: string; secret: string } | null {
  const id = process.env.HIGGSFIELD_KEY_ID?.trim();
  const secret = process.env.HIGGSFIELD_KEY_SECRET?.trim();
  if (id && secret) return { id, secret };

  const combined = (process.env.HF_CREDENTIALS ?? process.env.HIGGSFIELD_API_KEY ?? "").trim();
  const cut = combined.indexOf(":");
  if (cut > 0 && cut < combined.length - 1) {
    return { id: combined.slice(0, cut), secret: combined.slice(cut + 1) };
  }
  return null;
}

export function higgsfieldConfigured(): boolean {
  return credentials() !== null;
}

/**
 * Why generation is unavailable, in words an operator can act on. A key that is
 * half-filled is a different problem from no key at all, and saying so saves an
 * hour of staring at a silent panel.
 */
export function higgsfieldStatusNote(): string | null {
  if (higgsfieldConfigured()) return null;
  const anyHalf = process.env.HIGGSFIELD_KEY_ID?.trim() || process.env.HIGGSFIELD_KEY_SECRET?.trim();
  return anyHalf
    ? "Half the Higgsfield credential is set. It needs both HIGGSFIELD_KEY_ID and HIGGSFIELD_KEY_SECRET."
    : "No Higgsfield credential. Set HIGGSFIELD_KEY_ID and HIGGSFIELD_KEY_SECRET in .env.local.";
}

function baseUrl(): string {
  return (process.env.HIGGSFIELD_BASE_URL?.trim() || DEFAULT_BASE).replace(/\/$/, "");
}

function authHeaders(): Record<string, string> {
  const c = credentials();
  return {
    "content-type": "application/json",
    accept: "application/json",
    Authorization: c ? `Key ${c.id}:${c.secret}` : "",
  };
}

export type GenerationStatus = "queued" | "processing" | "completed" | "failed";

export interface GenerationResult {
  id: string;
  status: GenerationStatus;
  /** Output asset URL once completed (video or image). */
  url: string | null;
  error?: string;
}

function withTimeout(ms: number) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(timer) };
}

/** Pull the asset URL out of whatever shape the API returns. */
function extractUrl(data: Record<string, unknown>): string | null {
  const first = (v: unknown): unknown =>
    Array.isArray(v) ? (v[0] as Record<string, unknown> | undefined) : v;
  const candidates: unknown[] = [
    (first(data.images) as Record<string, unknown> | undefined)?.url,
    (first(data.videos) as Record<string, unknown> | undefined)?.url,
    (data.video as Record<string, unknown> | undefined)?.url,
    (data.image as Record<string, unknown> | undefined)?.url,
    (data.result as Record<string, unknown> | undefined)?.url,
    (first(data.output) as Record<string, unknown> | undefined)?.url,
    data.output_url,
    data.video_url,
    data.image_url,
    data.url,
  ];
  for (const c of candidates) if (typeof c === "string" && c.startsWith("http")) return c;
  return null;
}

function normStatus(raw: unknown): GenerationStatus {
  const s = String(raw ?? "").toLowerCase();
  if (["completed", "succeeded", "success", "done"].includes(s)) return "completed";
  // `nsfw` means the safety filter rejected it. That is a terminal refusal, not
  // a transient error — reporting it as "queued" would poll forever.
  if (["failed", "error", "canceled", "cancelled", "nsfw"].includes(s)) return "failed";
  if (["processing", "running", "in_progress", "in-progress"].includes(s)) return "processing";
  return "queued";
}

/** The API's own explanation, not ours. Truncated so it can go in a UI panel. */
function apiMessage(status: number, data: Record<string, unknown>, raw: string): string {
  const detail = data.detail ?? data.error ?? data.message;
  if (typeof detail === "string" && detail.trim()) return `${status}: ${detail.trim().slice(0, 300)}`;
  if (Array.isArray(detail) && detail.length) {
    // FastAPI-style validation errors: [{loc, msg, type}]
    const parts = detail
      .map((d) => {
        const o = d as Record<string, unknown>;
        const loc = Array.isArray(o.loc) ? o.loc.join(".") : "";
        return [loc, o.msg].filter(Boolean).join(" ");
      })
      .filter(Boolean);
    if (parts.length) return `${status}: ${parts.join("; ").slice(0, 300)}`;
  }
  const body = raw.trim().slice(0, 200);
  if (status === 401 || status === 403) {
    return `${status}: Higgsfield rejected the credential. Check the ID and secret are the matching pair and neither has been rotated.${body ? ` — ${body}` : ""}`;
  }
  return body ? `${status}: ${body}` : `Higgsfield error ${status}`;
}

async function post(path: string, body: Record<string, unknown>) {
  const t = withTimeout(30_000);
  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
      signal: t.signal,
      cache: "no-store",
    });
    const raw = await res.text();
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(raw) as Record<string, unknown>; } catch { /* keep raw */ }
    return { res, data, raw };
  } finally {
    t.done();
  }
}

/**
 * Submit a generation job against a model path. Returns the job id — poll
 * `getGeneration` for the result.
 *
 * The envelope is `{ params: … }`, verified against the live API: sending
 * `{ input: … }` returns 422 `body.params Field required`. A tolerant retry is
 * kept in case an account is routed to an `input`-shaped model, but the FIRST
 * error is the one reported — a retry that fails differently would otherwise
 * bury the real validation message under "params Field required".
 */
export async function submitGeneration(path: string, params: Record<string, unknown>): Promise<GenerationResult> {
  if (!higgsfieldConfigured()) throw new Error(higgsfieldStatusNote() ?? "Higgsfield is not configured.");

  const first = await post(path, { params });
  let { res, data, raw } = first;
  if (!res.ok && (res.status === 400 || res.status === 422)) {
    const second = await post(path, { input: params });
    // Only adopt the retry if it actually worked. Otherwise keep the original
    // complaint, which is the one describing the caller's real mistake.
    if (second.res.ok) ({ res, data, raw } = second);
  }
  if (!res.ok) throw new Error(apiMessage(res.status, data, raw));

  const id = String(data.id ?? data.request_id ?? data.generation_id ?? "");
  if (!id) throw new Error(`Higgsfield accepted the job but returned no id. Body: ${raw.slice(0, 200)}`);
  return { id, status: normStatus(data.status ?? "queued"), url: extractUrl(data) };
}

/** Poll a generation's status + output URL. */
export async function getGeneration(id: string): Promise<GenerationResult> {
  if (!higgsfieldConfigured()) return { id, status: "failed", url: null, error: higgsfieldStatusNote() ?? "" };
  const t = withTimeout(15_000);
  try {
    const res = await fetch(`${baseUrl()}/requests/${encodeURIComponent(id)}/status`, {
      headers: authHeaders(),
      signal: t.signal,
      cache: "no-store",
    });
    const raw = await res.text();
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(raw) as Record<string, unknown>; } catch { /* keep raw */ }
    if (!res.ok) return { id, status: "failed", url: null, error: apiMessage(res.status, data, raw) };

    const status = normStatus(data.status);
    const nsfw = String(data.status ?? "").toLowerCase() === "nsfw";
    return {
      id,
      status,
      url: extractUrl(data),
      error: nsfw
        ? "Higgsfield's safety filter rejected this prompt. Rewrite the shot description and resubmit."
        : typeof data.error === "string" ? data.error
        : typeof data.detail === "string" ? data.detail
        : undefined,
    };
  } finally {
    t.done();
  }
}

/* ---------------- model paths + prompt builders ---------------- */

export function imagePath(): string {
  return process.env.HIGGSFIELD_IMAGE_PATH?.trim() || DEFAULT_IMAGE_PATH;
}

export function videoPath(): string {
  return process.env.HIGGSFIELD_VIDEO_PATH?.trim() || DEFAULT_VIDEO_PATH;
}

/** Soul text-to-image params. Sizes are the enum Soul accepts, not free pixels. */
export function imageParams(opts: {
  prompt: string;
  size?: "1536x1536" | "2048x1152" | "1152x2048";
  quality?: "720p" | "1080p";
  batch?: number;
  seed?: number;
}): Record<string, unknown> {
  return {
    prompt: opts.prompt.slice(0, 2000),
    width_and_height: opts.size ?? "1536x1536",
    quality: opts.quality ?? "1080p",
    batch_size: opts.batch ?? 1,
    ...(opts.seed != null ? { seed: opts.seed } : {}),
    enhance_prompt: false,
  };
}

/**
 * DoP image-to-video params. `motions` is Higgsfield's camera-move vocabulary —
 * it is the reason to use them over a generic video model, and it maps directly
 * onto the `camera` field of a brand's visual world.
 */
export function videoParams(opts: {
  prompt: string;
  inputImage?: string;
  motionId?: string;
  durationSec?: 3 | 5;
  seed?: number;
}): Record<string, unknown> {
  return {
    model: process.env.HIGGSFIELD_VIDEO_MODEL?.trim() || "dop-turbo",
    prompt: opts.prompt.slice(0, 2000),
    ...(opts.inputImage ? { input_images: [{ type: "image_url", image_url: opts.inputImage }] } : {}),
    ...(opts.motionId ? { motions: [{ id: opts.motionId }] } : {}),
    duration: opts.durationSec ?? 5,
    ...(opts.seed != null ? { seed: opts.seed } : {}),
    enhance_prompt: true,
  };
}
