import { NextResponse } from "next/server";
import { forgetRule, loadBrain, teachRule } from "@/lib/studio/brainRepo";

/**
 * GET  /api/studio/brain?code=MARK  → the company's brain (seeded from core).
 * PUT  /api/studio/brain            → teach { code, add: { kind, txt } }
 *                                     or forget { code, remove: k } (taught only).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code") ?? "";
  const brain = await loadBrain(code);
  if (!brain) return NextResponse.json({ ok: false, error: "bad code" }, { status: 400 });
  return NextResponse.json({ ok: true, brain });
}

export async function PUT(req: Request) {
  let body: { code?: string; add?: { kind?: string; txt?: string; domain?: string }; remove?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const code = String(body.code ?? "");
  if (body.add?.txt && (body.add.kind === "do" || body.add.kind === "dont")) {
    const brain = await teachRule(code, body.add.kind, String(body.add.txt), body.add.domain === "video" ? "video" : "copy");
    if (!brain) return NextResponse.json({ ok: false, error: "bad code" }, { status: 400 });
    return NextResponse.json({ ok: true, brain });
  }
  if (body.remove) {
    const brain = await forgetRule(code, String(body.remove));
    if (!brain) return NextResponse.json({ ok: false, error: "bad code" }, { status: 400 });
    return NextResponse.json({ ok: true, brain });
  }
  return NextResponse.json({ ok: false, error: "nothing to do" }, { status: 400 });
}
