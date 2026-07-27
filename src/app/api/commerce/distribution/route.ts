import { NextResponse } from "next/server";
import { AGENT_UAS, assessDistribution } from "@/lib/commerce/channels";
import { loadBusinessStore } from "@/lib/studio/businessSource";

/**
 * GET /api/commerce/distribution?slug= — is this store IN the places agents shop?
 *
 * Separate from the visibility audit, which asks whether an agent CAN read you.
 * This asks whether anything has been submitted anywhere, and what is stopping
 * each submission.
 *
 * robots.txt is FETCHED, not assumed. The store's own configuration is the one
 * thing here that could silently change under us, and a distribution report
 * that trusts a file it never read is exactly the kind of claim this product
 * refuses to make everywhere else.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Which of the agents that shop are actually permitted by the live file. */
async function readRobots(origin: string): Promise<{ allowed: string[]; blocked: string[] } | null> {
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { "user-agent": "PDR-Commerce-DistributionCheck/1.0" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const text = (await res.text()).slice(0, 20_000);

    // Parse into groups: a run of User-agent lines followed by its directives.
    const groups: { agents: string[]; disallowAll: boolean; allowAll: boolean }[] = [];
    let current: { agents: string[]; disallowAll: boolean; allowAll: boolean } | null = null;
    let lastWasAgent = false;
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.split("#")[0].trim();
      if (!line) { lastWasAgent = false; continue; }
      const [k, ...rest] = line.split(":");
      const key = k.trim().toLowerCase();
      const value = rest.join(":").trim();
      if (key === "user-agent") {
        if (!current || !lastWasAgent) { current = { agents: [], disallowAll: false, allowAll: false }; groups.push(current); }
        current.agents.push(value.toLowerCase());
        lastWasAgent = true;
        continue;
      }
      lastWasAgent = false;
      if (!current) continue;
      if (key === "disallow" && (value === "/" )) current.disallowAll = true;
      if (key === "allow" && value === "/") current.allowAll = true;
    }

    const verdict = (ua: string): boolean => {
      const lower = ua.toLowerCase();
      // A named group wins over the wildcard, which is how robots.txt resolves.
      const named = groups.find((g) => g.agents.includes(lower));
      const group = named ?? groups.find((g) => g.agents.includes("*"));
      if (!group) return true; // nothing said = nothing forbidden
      if (group.allowAll) return true;
      return !group.disallowAll;
    };

    const allowed: string[] = [], blocked: string[] = [];
    for (const ua of AGENT_UAS) (verdict(ua) ? allowed : blocked).push(ua);
    return { allowed, blocked };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") ?? "";
  if (!slug) return NextResponse.json({ ok: false, error: "slug required" }, { status: 400 });

  const s = await loadBusinessStore(slug);
  if (!s) return NextResponse.json({ ok: false, error: "store not found" }, { status: 404 });

  const origin = url.origin;
  const robots = await readRobots(origin);
  const distribution = assessDistribution(s, origin, robots);

  return NextResponse.json({
    ok: true,
    // Null means the file could not be read at all — reported as unknown rather
    // than quietly treated as permission.
    robots: robots ?? null,
    robotsNote: robots ? null : "robots.txt could not be read, so agent permission is unknown — not assumed.",
    ...distribution,
  }, { headers: { "cache-control": "no-store" } });
}
