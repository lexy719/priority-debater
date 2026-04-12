/** Read non-OK API bodies without assuming JSON (HTML error pages break `response.json()`). */
export async function messageFromFailedResponse(response: Response): Promise<string> {
  const status = response.status;
  const raw = await response.text();
  const trimmed = raw.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const j = JSON.parse(raw) as { error?: string; message?: string };
      if (typeof j.error === "string" && j.error) return j.error;
      if (typeof j.message === "string" && j.message) return j.message;
    } catch {
      /* fall through */
    }
  }
  if (/^<!DOCTYPE\s|^<html[\s>]/i.test(trimmed)) {
    return `The server returned a web page instead of data (${status}). If you are offline or the app failed to compile, restart the dev server. In production, ensure API routes are deployed and OPENAI_API_KEY is set.`;
  }
  const snippet = raw.replace(/\s+/g, " ").slice(0, 160).trim();
  return snippet ? `Request failed (${status}): ${snippet}` : `Request failed (${status})`;
}
