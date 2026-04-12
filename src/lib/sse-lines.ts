/**
 * Buffer streaming UTF-8 chunks into complete newline-delimited lines.
 * Network chunks often split in the middle of a `data: {...}` line — splitting
 * each chunk on `\n` alone breaks JSON.parse and drops content.
 */
export function appendSseLines(buffer: string, chunk: string): { buffer: string; lines: string[] } {
  const combined = buffer + chunk;
  const parts = combined.split("\n");
  const incomplete = parts.pop() ?? "";
  const lines = parts.map((l) => l.replace(/\r$/, ""));
  return { buffer: incomplete, lines };
}

/**
 * Deliver complete lines from an SSE body (handles UTF-8 chunks split mid-line).
 */
export async function readSseLines(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onLine: (line: string) => void,
): Promise<void> {
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const { buffer, lines } = appendSseLines(buf, decoder.decode(value, { stream: true }));
    buf = buffer;
    for (const line of lines) onLine(line);
  }
  const tail = buf.replace(/\r$/, "");
  if (tail.trim()) onLine(tail);
}
