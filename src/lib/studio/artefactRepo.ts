/**
 * The product itself.
 *
 * Everything else in Commerce was about selling a thing. This is the thing. A
 * digital business PDR runs end to end cannot deliver a link to a file nobody
 * made — so for anything it can honestly produce as a document (a playbook, a
 * template set, a checklist, a prompt library), the artefact is generated,
 * stored, versioned by sku, and served at the delivery URL.
 *
 * The boundary is deliberate and narrow: PDR writes documents. It does not
 * pretend to produce Lightroom presets, fonts, audio or code it cannot ship. A
 * product it cannot make is a product it should not have listed, which is a
 * constraint pushed back into fabrication rather than papered over here.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { blobConfigured, getJson, putJson } from "./blobStore";

export type Artefact = {
  sku: string;
  title: string;
  /** The deliverable, as Markdown — readable by a person and by an agent. */
  body: string;
  words: number;
  generatedAt: string;
  model: string;
};

const DIR = path.join(process.cwd(), ".data", "artefacts");
const SLUG_RE = /^[a-z0-9-]{3,64}$/;

export async function loadArtefact(slug: string, sku: string): Promise<Artefact | null> {
  if (!SLUG_RE.test(slug) || !sku) return null;
  if (blobConfigured()) {
    const a = await getJson<Artefact>(`artefacts/${slug}/${sku}.json`);
    if (a?.body) return a;
  }
  try { return JSON.parse(await fs.readFile(path.join(DIR, slug, `${sku}.json`), "utf8")) as Artefact; } catch { return null; }
}

export async function saveArtefact(slug: string, a: Artefact): Promise<void> {
  if (blobConfigured()) { await putJson(`artefacts/${slug}/${a.sku}.json`, a); return; }
  await fs.mkdir(path.join(DIR, slug), { recursive: true });
  await fs.writeFile(path.join(DIR, slug, `${a.sku}.json`), JSON.stringify(a, null, 2), "utf8");
}

const MODEL = "claude-sonnet-5";

/**
 * Make the deliverable. Grounded in the actual listing — an agent that bought
 * "a 40-page colour playbook for €39" must receive something that answers to
 * that description, not a generic essay.
 */
export async function generateArtefact(slug: string, input: {
  sku: string; name: string; description: string; price: string;
  brand: string; audience?: string; positioning?: string;
}): Promise<Artefact | { error: string }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { error: "ANTHROPIC_API_KEY missing — the product cannot be produced" };

  const prompt = [
    "You are producing the ACTUAL DELIVERABLE a customer just paid for. Not a description of it, not a sales page — the thing itself.",
    "",
    `Product: ${input.name}`,
    `Sold as: ${input.description}`,
    `Price paid: ${input.price}`,
    `By: ${input.brand}${input.audience ? ` · for ${input.audience}` : ""}`,
    input.positioning ? `Positioning: ${input.positioning}` : "",
    "",
    "Write it in Markdown. Rules:",
    "- It must be worth the price. Someone paid for this; thin filler is theft.",
    "- 1200–2000 words, structured with ## sections a reader can navigate.",
    "- SPECIFIC and usable: real numbers, named settings, worked examples, checklists, copy-paste blocks where they help.",
    "- No preamble about what the document is, no 'in this guide we will', no marketing, no calls to action.",
    "- Never invent research, statistics, studies or quotes. Draw on craft knowledge, not fabricated evidence.",
    "- If part of the promise cannot honestly be delivered as a document, say so in one line under a '## What this does not cover' section rather than faking it.",
    "",
    "Output ONLY the Markdown document, starting with a single # title line.",
  ].filter(Boolean).join("\n");

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 4000, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) return { error: `anthropic ${r.status}` };
    const data = (await r.json()) as { content?: { type: string; text?: string }[] };
    const body = (data.content ?? []).map((c) => (c.type === "text" ? c.text ?? "" : "")).join("").trim();
    if (body.length < 500) return { error: "the produced document was too thin to deliver" };
    const title = (body.match(/^#\s+(.+)$/m)?.[1] ?? input.name).slice(0, 120);
    const a: Artefact = {
      sku: input.sku, title, body,
      words: body.split(/\s+/).length,
      generatedAt: new Date().toISOString(),
      model: MODEL,
    };
    await saveArtefact(slug, a);
    return a;
  } catch (e) {
    return { error: (e as Error).message.slice(0, 140) };
  }
}
