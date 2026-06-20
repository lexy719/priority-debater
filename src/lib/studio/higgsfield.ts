import "server-only";

/**
 * Higgsfield client — AI image + video generation for the studio.
 *
 * Used for the Campaign stage (image-to-video / text-to-video ad cuts) and logo
 * images in the Brand Kit. Generation is asynchronous: submit returns a job id,
 * then poll `getGeneration(id)` until it completes and exposes an output URL.
 *
 * Endpoint/auth follow the documented Higgsfield API
 * (POST https://api.higgsfield.ai/v1/generations, Bearer auth). Base URL and
 * model names are env-overridable so they can be tuned to your account without a
 * code change. Every caller checks `higgsfieldConfigured()` first and degrades
 * to the storyboard/monogram fallback when no key is set.
 */

export function higgsfieldConfigured(): boolean {
  return Boolean(process.env.HIGGSFIELD_API_KEY?.trim());
}

function baseUrl(): string {
  return (process.env.HIGGSFIELD_BASE_URL?.trim() || "https://api.higgsfield.ai").replace(/\/$/, "");
}

function authHeaders(): Record<string, string> {
  return {
    "content-type": "application/json",
    Authorization: `Bearer ${process.env.HIGGSFIELD_API_KEY?.trim() ?? ""}`,
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
  const candidates = [
    data.output_url,
    data.video_url,
    data.image_url,
    data.url,
    (data.output as Record<string, unknown> | undefined)?.url,
    (data.result as Record<string, unknown> | undefined)?.url,
    Array.isArray(data.output) ? (data.output[0] as Record<string, unknown>)?.url : undefined,
  ];
  for (const c of candidates) if (typeof c === "string" && c.startsWith("http")) return c;
  return null;
}

function normStatus(raw: unknown): GenerationStatus {
  const s = String(raw ?? "").toLowerCase();
  if (["completed", "succeeded", "success", "done"].includes(s)) return "completed";
  if (["failed", "error", "canceled", "cancelled"].includes(s)) return "failed";
  if (["processing", "running", "in_progress"].includes(s)) return "processing";
  return "queued";
}

/** Submit a generation job. Returns the job id (poll getGeneration for the result). */
export async function submitGeneration(body: Record<string, unknown>): Promise<GenerationResult> {
  const t = withTimeout(20_000);
  try {
    const res = await fetch(`${baseUrl()}/v1/generations`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
      signal: t.signal,
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const message = (data.error as string) || (data.message as string) || `Higgsfield error ${res.status}`;
      throw new Error(message);
    }
    const id = String(data.id ?? data.generation_id ?? "");
    if (!id) throw new Error("Higgsfield did not return a job id.");
    return { id, status: normStatus(data.status ?? "queued"), url: extractUrl(data) };
  } finally {
    t.done();
  }
}

/** Poll a generation's status + output URL. */
export async function getGeneration(id: string): Promise<GenerationResult> {
  const t = withTimeout(15_000);
  try {
    const res = await fetch(`${baseUrl()}/v1/generations/${encodeURIComponent(id)}`, {
      headers: authHeaders(),
      signal: t.signal,
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return { id, status: "failed", url: null, error: `Higgsfield error ${res.status}` };
    }
    return {
      id,
      status: normStatus(data.status),
      url: extractUrl(data),
      error: typeof data.error === "string" ? data.error : undefined,
    };
  } finally {
    t.done();
  }
}

/* ---------------- prompt builders ---------------- */

/** Build a video-generation body from a campaign ad cut. */
export function videoBody(opts: {
  prompt: string;
  aspect?: string;
  durationSec?: number;
  inputImage?: string;
}): Record<string, unknown> {
  return {
    task: opts.inputImage ? "image-to-video" : "text-to-video",
    model: process.env.HIGGSFIELD_VIDEO_MODEL?.trim() || "default-video-model",
    prompt: opts.prompt.slice(0, 2000),
    ...(opts.inputImage ? { input_image: opts.inputImage } : {}),
    aspect_ratio: opts.aspect || "9:16",
    duration: opts.durationSec ?? 5,
    fps: 24,
    motion_intensity: "medium",
  };
}

/** Build a text-to-image body for a logo. */
export function imageBody(opts: { prompt: string; width?: number; height?: number }): Record<string, unknown> {
  return {
    task: "text-to-image",
    model: process.env.HIGGSFIELD_IMAGE_MODEL?.trim() || "flux",
    prompt: opts.prompt.slice(0, 2000),
    width: opts.width ?? 1024,
    height: opts.height ?? 1024,
    steps: 40,
  };
}
