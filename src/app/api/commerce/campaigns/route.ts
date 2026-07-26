import { NextResponse } from "next/server";
import { ownedStore } from "@/lib/commerce/owner";
import { recordActivity } from "@/lib/studio/activityRepo";
import {
  CAMPAIGN_FLOW, addVariant, createCampaign, deleteCampaign, fatigued, listCampaigns,
  markWinner, retireVariant, setCampaignStatus, type CampaignStatus,
} from "@/lib/studio/campaignRepo";
import { writeGroundedCopy } from "@/lib/studio/copyWriter";
import { loadStore } from "@/lib/studio/storeRepo";

/**
 * The Marketing worker's campaign console.
 *
 * GET    ?slug=                         → campaigns (+ fatigue flags)
 * POST   {slug, name, objective, …}     → create a campaign (draft)
 * POST   {slug, id, action:"variant"}   → write a new creative variant through
 *                                         the brain, differentiated from siblings
 * PUT    {slug, id, status}             → advance the campaign state machine
 * PUT    {slug, id, variantId, winner}  → declare a winner
 * PUT    {slug, id, variantId, retire}  → retire a tired variant
 * DELETE {slug, id}                     → remove a campaign
 *
 * Campaigns are real objects with real creative; their PERFORMANCE stays null
 * until a channel is connected — Commerce never invents a metric.
 */

export const runtime = "nodejs";
export const maxDuration = 45;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  const own = await ownedStore(slug);
  if (!own.ok) return NextResponse.json({ ok: false, error: own.error }, { status: own.status });
  const campaigns = await listCampaigns(slug);
  return NextResponse.json(
    { ok: true, campaigns: campaigns.map((c) => ({ ...c, fatigued: fatigued(c).map((v) => v.id) })) },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(req: Request) {
  let body: { slug?: string; id?: string; action?: string; name?: string; objective?: string; channels?: string[]; budgetCap?: number; platform?: string; angle?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const slug = String(body.slug ?? "");
  const own = await ownedStore(slug);
  if (!own.ok) return NextResponse.json({ ok: false, error: own.error }, { status: own.status });
  if (!slug) return NextResponse.json({ ok: false, error: "slug required" }, { status: 400 });

  // ── write a creative variant into an existing campaign ──
  if (body.action === "variant") {
    const id = String(body.id ?? "");
    const campaigns = await listCampaigns(slug);
    const c = campaigns.find((x) => x.id === id);
    if (!c) return NextResponse.json({ ok: false, error: "campaign not found" }, { status: 404 });
    const store = await loadStore(slug);
    if (!store) return NextResponse.json({ ok: false, error: "store not found" }, { status: 404 });

    const platform = String(body.platform ?? c.channels[0] ?? "LINKEDIN").toUpperCase();
    const angle = String(body.angle ?? `variant ${c.variants.length + 1}`);
    const b = store.store.brand;
    const res = await writeGroundedCopy({
      kit: {
        projectCode: store.store.brand.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12),
        fullName: b.fullName, descriptor: b.oneLiner, domain: b.domain, oneLiner: b.oneLiner,
        brandKit: { audience: b.audience, positioning: b.positioning },
      },
      platform, angle, slug,
      objective: c.objective,
      avoid: c.variants.map((v) => v.body),
    });
    if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: res.status });

    const updated = await addVariant(slug, id, { platform, angle, body: res.body });
    await recordActivity(slug, "MARKETING", `Variant written for ${c.name} (${platform}) — ${res.rulesApplied} brain rules applied${res.grounded ? ", grounded in the live catalogue" : ""}`);
    return NextResponse.json({ ok: true, campaign: updated, rulesApplied: res.rulesApplied });
  }

  // ── create a campaign ──
  const name = String(body.name ?? "").trim();
  const objective = String(body.objective ?? "").trim();
  const channels = (body.channels ?? []).map((c) => String(c).toUpperCase()).filter(Boolean);
  if (!name || !objective || channels.length === 0) {
    return NextResponse.json({ ok: false, error: "name, objective and at least one channel are required" }, { status: 400 });
  }
  const budgetCap = Number.isFinite(Number(body.budgetCap)) && Number(body.budgetCap) > 0 ? Math.round(Number(body.budgetCap)) : null;
  const campaign = await createCampaign(slug, { name, objective, channels, budgetCap });
  await recordActivity(slug, "MARKETING", `Campaign ${campaign.id} "${name}" drafted — ${channels.join(", ")}${budgetCap ? ` · cap €${budgetCap}/mo` : ""}`);
  return NextResponse.json({ ok: true, campaign });
}

export async function PUT(req: Request) {
  let body: { slug?: string; id?: string; status?: string; variantId?: string; winner?: boolean; retire?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const slug = String(body.slug ?? "");
  const own = await ownedStore(slug);
  if (!own.ok) return NextResponse.json({ ok: false, error: own.error }, { status: own.status });
  const id = String(body.id ?? "");
  if (!slug || !id) return NextResponse.json({ ok: false, error: "slug and id required" }, { status: 400 });

  if (body.variantId && body.winner) {
    const c = await markWinner(slug, id, String(body.variantId));
    if (!c) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    // A winner with no channel data is a taste call, not a result. The ledger
    // says which it was, so nobody later mistakes a hunch for evidence.
    const v = c.variants.find((x) => x.id === body.variantId);
    const measured = v?.impressions != null || v?.clicks != null || v?.orders != null;
    await recordActivity(slug, "MARKETING",
      measured
        ? `${body.variantId} declared the winning variant of ${c.name} — ${v?.impressions ?? 0} impr · ${v?.clicks ?? 0} clicks · ${v?.orders ?? 0} orders`
        : `${body.variantId} picked as the lead variant of ${c.name} — owner's judgement, no channel data to decide on`);
    return NextResponse.json({ ok: true, campaign: c, measured });
  }
  if (body.variantId && body.retire) {
    const c = await retireVariant(slug, id, String(body.variantId));
    if (!c) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    await recordActivity(slug, "MARKETING", `${body.variantId} retired from ${c.name} (creative fatigue)`);
    return NextResponse.json({ ok: true, campaign: c });
  }

  const status = String(body.status ?? "") as CampaignStatus;
  if (!(status in CAMPAIGN_FLOW)) return NextResponse.json({ ok: false, error: "bad status" }, { status: 400 });
  const c = await setCampaignStatus(slug, id, status);
  if (!c) return NextResponse.json({ ok: false, error: "campaign not found or illegal transition" }, { status: 409 });
  await recordActivity(slug, "MARKETING", `Campaign ${c.id} "${c.name}" → ${status.toUpperCase()}`);
  return NextResponse.json({ ok: true, campaign: c });
}

export async function DELETE(req: Request) {
  let body: { slug?: string; id?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const slug = String(body.slug ?? "");
  const own = await ownedStore(slug);
  if (!own.ok) return NextResponse.json({ ok: false, error: own.error }, { status: own.status });
  const campaigns = await deleteCampaign(slug, String(body.id ?? ""));
  return NextResponse.json({ ok: true, campaigns });
}
