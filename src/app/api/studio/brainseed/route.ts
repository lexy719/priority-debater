import { NextResponse } from "next/server";
import { seedBrain, type SeedKit } from "@/lib/studio/brainSeeder";

/**
 * POST /api/studio/brainseed — Claude writes THIS company's ad guidelines.
 *
 * Five rules that could only belong to this business (its materials, rituals,
 * proof points, taboos) — never generic ad craft, which the core rules already
 * cover — plus the visual world every video ad for it is shot in. Idempotent
 * per company: the first successful seed wins; teaching and forgetting remain
 * the human's controls.
 *
 * The work itself lives in `@/lib/studio/brainSeeder` because the publish path
 * calls it too. A business should be born knowing its own voice rather than
 * waiting for someone to notice a proposal on a dashboard; this route is the
 * manual re-run for businesses that predate that, or whose seed timed out.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let kit: SeedKit; let slug = "";
  try {
    const body = await req.json();
    kit = body?.kit;
    slug = typeof body?.slug === "string" ? body.slug : "";
    if (!kit?.projectCode) throw new Error("bad kit");
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const out = await seedBrain(kit, slug);
  if (!out.ok) {
    return NextResponse.json(out, { status: out.error === "ANTHROPIC_API_KEY missing" ? 500 : 502 });
  }
  return NextResponse.json(out);
}
