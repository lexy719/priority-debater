/**
 * Blob store — Supabase Storage as the studio's persistence backend.
 *
 * JSON objects in a private `studio` bucket (stores/, brains/, orders/, hits/)
 * — the exact shape the file repos used, so every repo swaps backend without
 * changing callers. Falls back to the local filesystem when Supabase isn't
 * configured, so dev-without-keys and CI keep working. No SQL required:
 * Storage works with just the project URL + secret key.
 */

const BUCKET = "studio";

const base = () => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function blobConfigured(): boolean {
  return !!base() && !!key();
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return { authorization: `Bearer ${key()}`, apikey: key(), ...extra };
}

/* Ensure the bucket exists once per process; 409 = already there. */
let bucketReady: Promise<void> | null = null;
function ensureBucket(): Promise<void> {
  bucketReady ??= (async () => {
    try {
      const r = await fetch(`${base()}/storage/v1/bucket`, {
        method: "POST",
        headers: headers({ "content-type": "application/json" }),
        body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
      });
      if (!r.ok && r.status !== 409) {
        const detail = await r.text().catch(() => "");
        // Surface once; callers degrade gracefully on later failures.
        console.error(`[blobStore] bucket create failed: ${r.status} ${detail.slice(0, 200)}`);
      }
    } catch (e) {
      console.error(`[blobStore] bucket create error: ${(e as Error).message}`);
      bucketReady = null; // allow retry on next call
      throw e;
    }
  })();
  return bucketReady;
}

export async function putJson(path: string, data: unknown): Promise<void> {
  await ensureBucket();
  const r = await fetch(`${base()}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: headers({ "content-type": "application/json", "x-upsert": "true" }),
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`blob put ${path}: ${r.status}`);
}

export async function getJson<T>(path: string): Promise<T | null> {
  try {
    await ensureBucket();
    const r = await fetch(`${base()}/storage/v1/object/${BUCKET}/${path}`, { headers: headers(), cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

/** List object names under a prefix (e.g. "stores"), without the prefix path. */
export async function listJson(prefix: string, limit = 100): Promise<string[]> {
  try {
    await ensureBucket();
    const r = await fetch(`${base()}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: headers({ "content-type": "application/json" }),
      body: JSON.stringify({ prefix, limit, sortBy: { column: "updated_at", order: "desc" } }),
    });
    if (!r.ok) return [];
    const items = (await r.json()) as { name: string }[];
    return items.map((i) => i.name).filter((n) => n.endsWith(".json"));
  } catch {
    return [];
  }
}
