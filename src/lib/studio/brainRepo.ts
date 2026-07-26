/**
 * Brain repository — per-company persisted marketing know-how.
 * File-based (.data/brains/*.json, gitignored), same swap-to-Supabase seam as
 * the store repo. Missing brains are seeded from the core ruleset.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { CORE_RULES, type Brain, type BrainRule, type VisualWorld } from "./brain";
import { blobConfigured, getJson, putJson } from "./blobStore";

const DIR = path.join(process.cwd(), ".data", "brains");
const CODE_RE = /^[A-Z0-9]{2,12}$/;

function file(code: string): string {
  return path.join(DIR, `${code}.json`);
}

export async function loadBrain(codeRaw: string): Promise<Brain | null> {
  const code = codeRaw.toUpperCase();
  if (!CODE_RE.test(code)) return null;
  let b: Brain | null = null;
  if (blobConfigured()) b = await getJson<Brain>(`brains/${code}.json`);
  if (!b) {
    // blob miss or unconfigured → local file (brains taught pre-Supabase)
    try { b = JSON.parse(await fs.readFile(file(code), "utf8")) as Brain; } catch { /* seed below */ }
  }
  if (b && Array.isArray(b.rules)) {
    // Migration: core rules added after this brain was saved (e.g. the
    // video domain) get seeded in; taught rules are untouched.
    const have = new Set(b.rules.map((r) => r.k));
    const missing = CORE_RULES.filter((r) => !have.has(r.k));
    if (missing.length) b.rules = [...b.rules, ...missing.map((r) => ({ ...r }))];
    return b;
  }
  return { code, rules: CORE_RULES.map((r) => ({ ...r })), updatedAt: new Date().toISOString() };
}

export async function saveBrain(b: Brain): Promise<void> {
  if (!CODE_RE.test(b.code)) throw new Error("bad code");
  if (blobConfigured()) {
    await putJson(`brains/${b.code}.json`, b);
    return;
  }
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(file(b.code), JSON.stringify(b, null, 2), "utf8");
}

export async function teachRule(code: string, kind: BrainRule["kind"], txt: string, domain: BrainRule["domain"] = "copy"): Promise<Brain | null> {
  const b = await loadBrain(code);
  if (!b) return null;
  const clean = txt.trim().slice(0, 140);
  if (!clean) return b;
  const n = b.rules.filter((r) => r.src === "taught").length + 1;
  b.rules.push({ k: `T-${String(n).padStart(2, "0")}`, txt: clean, kind, src: "taught", domain: domain === "video" ? "video" : "copy" });
  b.updatedAt = new Date().toISOString();
  await saveBrain(b);
  return b;
}

export async function forgetRule(code: string, k: string): Promise<Brain | null> {
  const b = await loadBrain(code);
  if (!b) return null;
  b.rules = b.rules.filter((r) => !(r.k === k && r.src !== "core")); // core rules are not removable
  b.updatedAt = new Date().toISOString();
  await saveBrain(b);
  return b;
}

/** Replace the learned ruleset — derived from measured data, so each learning
    pass supersedes the last instead of accumulating stale conclusions. */
export async function setLearnedRules(code: string, rules: { kind: BrainRule["kind"]; txt: string }[]): Promise<Brain | null> {
  const b = await loadBrain(code);
  if (!b) return null;
  b.rules = b.rules.filter((r) => r.src !== "learned");
  const clean = rules
    .filter((r) => (r.kind === "do" || r.kind === "dont") && r.txt?.trim())
    .slice(0, 3)
    .map((r, i) => ({ k: `L-${String(i + 1).padStart(2, "0")}`, txt: r.txt.trim().slice(0, 140), kind: r.kind, src: "learned" as const, domain: "copy" as const }));
  b.rules = [...b.rules, ...clean];
  b.updatedAt = new Date().toISOString();
  await saveBrain(b);
  return b;
}

/** Persist the company's visual world (first write wins — re-runs no-op so a
    business keeps one consistent look; forgetting it is a future control). */
export async function setVisualWorld(code: string, visual: VisualWorld): Promise<Brain | null> {
  const b = await loadBrain(code);
  if (!b) return null;
  if (b.visual) return b;
  if (!visual?.setting || !visual?.lighting) return b;
  b.visual = {
    setting: String(visual.setting).slice(0, 160),
    lighting: String(visual.lighting).slice(0, 160),
    materials: String(visual.materials ?? "").slice(0, 160),
    camera: String(visual.camera ?? "").slice(0, 160),
    avoid: String(visual.avoid ?? "").slice(0, 160),
  };
  b.updatedAt = new Date().toISOString();
  await saveBrain(b);
  return b;
}

/** Merge Claude-generated company guidelines. Idempotent: no-ops when the
    brain already carries company rules, so one business = one generation. */
export async function seedCompanyRules(code: string, rules: { kind: BrainRule["kind"]; txt: string; domain?: BrainRule["domain"] }[]): Promise<Brain | null> {
  const b = await loadBrain(code);
  if (!b) return null;
  if (b.rules.some((r) => r.src === "company")) return b;
  const clean = rules
    .filter((r) => (r.kind === "do" || r.kind === "dont") && r.txt?.trim())
    .slice(0, 6)
    .map((r, i) => ({
      k: `C-${String(i + 1).padStart(2, "0")}`,
      txt: r.txt.trim().slice(0, 120),
      kind: r.kind,
      src: "company" as const,
      domain: r.domain === "video" ? ("video" as const) : ("copy" as const),
    }));
  if (!clean.length) return b;
  b.rules = [...b.rules, ...clean];
  b.updatedAt = new Date().toISOString();
  await saveBrain(b);
  return b;
}
