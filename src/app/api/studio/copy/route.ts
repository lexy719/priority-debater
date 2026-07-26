import { NextResponse } from "next/server";
import { writeGroundedCopy, type CopyKit } from "@/lib/studio/copyWriter";

/**
 * POST /api/studio/copy — brain-steered generation of one ad/post.
 *
 * Thin HTTP wrapper over the shared grounded writer (`copyWriter.ts`), which
 * every marketing surface uses: the company's full brain as hard constraints
 * plus a real product at its exact price. Clients fall back to their local
 * template composer if this fails.
 */

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  let body: { kit?: CopyKit; platform?: string; angle?: string; slug?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  if (!body.kit?.projectCode) return NextResponse.json({ ok: false, error: "bad input" }, { status: 400 });

  const res = await writeGroundedCopy({
    kit: body.kit,
    platform: String(body.platform ?? ""),
    angle: String(body.angle ?? "OFFER"),
    slug: body.slug ?? null,
  });
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: res.status });
  return NextResponse.json({ ok: true, body: res.body, model: res.model, rulesApplied: res.rulesApplied, grounded: res.grounded });
}
