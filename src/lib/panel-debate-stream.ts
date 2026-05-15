import type { DebateSetup, Message } from "@/lib/types";
import { readSseLines } from "@/lib/sse-lines";
import { messageFromFailedResponse } from "@/lib/read-api-error";
import type { PanelPersonaSlug } from "@/lib/personas/personality-profiles";

async function accumulateSseContent(response: Response, onChunk: (text: string) => void): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream");

  let content = "";

  const handleLine = (line: string) => {
    if (!line.startsWith("data: ")) return;
    const data = line.slice(6);
    if (data === "[DONE]") return;
    try {
      const parsed = JSON.parse(data) as { content?: string; error?: string };
      if (parsed.error) throw new Error(parsed.error);
      if (parsed.content) {
        content += parsed.content;
        onChunk(content);
      }
    } catch (e) {
      if (e instanceof SyntaxError) return;
      throw e;
    }
  };

  await readSseLines(reader, handleLine);
  return content.trim();
}

export async function streamDebateOpening(
  setup: DebateSetup,
  persona: PanelPersonaSlug,
  validationContent: string | undefined,
  onChunk: (text: string) => void,
): Promise<string> {
  const response = await fetch("/api/debate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "debate-open",
      setup,
      persona,
      validationContent: validationContent?.slice(0, 24000),
    }),
  });

  if (!response.ok) throw new Error(await messageFromFailedResponse(response));

  const text = await accumulateSseContent(response, onChunk);
  if (!text) throw new Error("No opening received");
  return text;
}

export async function streamDebatePersonaTurn(
  setup: DebateSetup,
  persona: PanelPersonaSlug,
  messages: Message[],
  validationContent: string | undefined,
  onChunk: (text: string) => void,
): Promise<string> {
  const response = await fetch("/api/debate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "debate-persona-continue",
      setup,
      persona,
      messages,
      validationContent: validationContent?.slice(0, 24000),
    }),
  });

  if (!response.ok) throw new Error(await messageFromFailedResponse(response));

  const text = await accumulateSseContent(response, onChunk);
  if (!text) throw new Error("No reply received");
  return text;
}
