import type { LogoBrief } from "@/lib/logo-brief";
import type { ValidationSession } from "@/lib/types";
import { readSseLines } from "@/lib/sse-lines";
import { messageFromFailedResponse } from "@/lib/read-api-error";

export type StreamDebateOptions = {
  /** Passed to \`logo-brand-kit\` — structured founder choices for concepts & prompts. */
  logoBrief?: LogoBrief;
  onScoreReconciliation?: (scoreReconciliation: ValidationSession["scoreReconciliation"]) => void;
};

/**
 * Streams a markdown document from POST /api/debate with the given action.
 */
export async function streamDebateMarkdown(
  action: string,
  session: Pick<ValidationSession, "setup" | "validationContent">,
  onDelta: (accumulated: string) => void,
  options?: StreamDebateOptions,
): Promise<string> {
  const response = await fetch("/api/debate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      setup: session.setup,
      validationContent: session.validationContent,
      ...(options?.logoBrief ? { logoBrief: options.logoBrief } : {}),
    }),
  });

  if (!response.ok) {
    // Surface the HTTP status so callers can route 401 → login and 402 → the
    // out-of-credits modal (server-enforced credits live in /api/debate).
    const err = new Error(await messageFromFailedResponse(response)) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream");

  let content = "";

  const handleLine = (line: string) => {
    if (!line.startsWith("data: ")) return;
    const data = line.slice(6);
    if (data === "[DONE]") return;
    try {
      const parsed = JSON.parse(data) as {
        content?: string;
        error?: string;
        scoreReconciliation?: ValidationSession["scoreReconciliation"];
        /** Full report after finance second-pass merge (replaces accumulated stream). */
        validationContentFinal?: string;
      };
      if (parsed.error) throw new Error(parsed.error);
      if (parsed.scoreReconciliation) {
        options?.onScoreReconciliation?.(parsed.scoreReconciliation);
      }
      if (parsed.validationContentFinal) {
        content = parsed.validationContentFinal;
        onDelta(content);
      } else if (parsed.content) {
        content += parsed.content;
        onDelta(content);
      }
    } catch (e) {
      if (e instanceof SyntaxError) return;
      throw e;
    }
  };

  await readSseLines(reader, handleLine);

  if (!content.trim()) throw new Error("No content received");
  return content;
}
