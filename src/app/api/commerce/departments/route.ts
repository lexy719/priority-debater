import { NextResponse } from "next/server";
import { recordActivity } from "@/lib/studio/activityRepo";
import {
  CAPABILITY_LABEL, CAPABILITY_OF, DEPARTMENTS, DEPARTMENT_NAME, DEPARTMENT_REMIT,
  describeAuthority, isIrreversible, suggestedGrant,
  type Capability, type Department,
} from "@/lib/studio/departments";
import {
  authoritySummary, loadPermissions, setArmed, setCapability, setSpendCap,
} from "@/lib/studio/permissionRepo";

/**
 * GET  /api/commerce/departments?slug=   the org chart and what each may do
 * POST                                   arm · grant · revoke · set a spend cap
 *
 * Architecture §5 and §6. This is the control layer: the single place an owner
 * hands authority to something that will act while they are asleep. Every
 * change is written to the permission history AND to the business ledger, so it
 * appears in the same timeline as the actions it later authorises.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isDepartment(v: unknown): v is Department {
  return typeof v === "string" && (DEPARTMENTS as readonly string[]).includes(v);
}

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!slug) return NextResponse.json({ ok: false, error: "slug required" }, { status: 400 });

  const rec = await loadPermissions(slug);
  const departments = rec.permissions.map((p) => ({
    id: p.department,
    name: DEPARTMENT_NAME[p.department],
    remit: DEPARTMENT_REMIT[p.department],
    armed: p.armed,
    authority: describeAuthority(p),
    dailySpendCap: p.dailySpendCap,
    currency: p.currency,
    // Every capability, granted or not, with whether it can be undone — an
    // owner deciding what to hand over needs to see the whole menu and which
    // items have no undo, not just what they already ticked.
    capabilities: CAPABILITY_OF[p.department].map((c) => ({
      id: c,
      label: CAPABILITY_LABEL[c],
      granted: p.allowed.includes(c),
      irreversible: isIrreversible(c),
    })),
    suggested: suggestedGrant(p.department),
  }));

  return NextResponse.json({
    ok: true,
    departments,
    summary: authoritySummary(rec),
    history: rec.history.slice(0, 40),
    updatedAt: rec.updatedAt,
  }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }

  const slug = String(body.slug ?? "");
  const action = String(body.action ?? "");
  const department = body.department;
  if (!slug) return NextResponse.json({ ok: false, error: "slug required" }, { status: 400 });
  if (!isDepartment(department)) return NextResponse.json({ ok: false, error: "unknown department" }, { status: 400 });

  const name = DEPARTMENT_NAME[department];

  if (action === "arm" || action === "stand_down") {
    const armed = action === "arm";
    const rec = await setArmed(slug, department, armed);
    await recordActivity(slug, "SYSTEM",
      armed
        ? `${name} armed — it may now act inside the grants you gave it`
        : `${name} stood down — every grant revoked, it acts on nothing`,
      "owner");
    return NextResponse.json({ ok: true, permissions: rec.permissions });
  }

  if (action === "grant" || action === "revoke") {
    const capability = String(body.capability ?? "") as Capability;
    if (!CAPABILITY_OF[department].includes(capability)) {
      return NextResponse.json({ ok: false, error: `${capability} is not ${name}'s job` }, { status: 400 });
    }
    const granted = action === "grant";
    const rec = await setCapability(slug, department, capability, granted);
    await recordActivity(slug, "SYSTEM",
      `${granted ? "Gave" : "Took back from"} ${name}: ${CAPABILITY_LABEL[capability].toLowerCase()}${granted && isIrreversible(capability) ? " — this one cannot be undone once done" : ""}`,
      "owner");
    return NextResponse.json({ ok: true, permissions: rec.permissions });
  }

  if (action === "spend_cap") {
    const cap = Number(body.cap ?? 0);
    if (!Number.isFinite(cap) || cap < 0) return NextResponse.json({ ok: false, error: "cap must be zero or more" }, { status: 400 });
    const rec = await setSpendCap(slug, department, cap);
    await recordActivity(slug, "SYSTEM",
      cap === 0
        ? `${name} may no longer spend anything without you`
        : `${name} may spend up to €${cap.toFixed(2)} a day without asking`,
      "owner");
    return NextResponse.json({ ok: true, permissions: rec.permissions });
  }

  return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
}
