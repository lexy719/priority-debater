import type { Metadata } from "next";
import { auditVisibility, normalize } from "@/lib/commerce/visibility";
import VisibilityScan from "./scan-client";

/**
 * /commerce/visibility — THE WEDGE.
 *
 * "Can AI shoppers find and buy from your store?" Free, no login, any URL.
 * Every finding is a real HTTP observation (no API key, nothing simulated),
 * graded across DISCOVERY · LEGIBILITY · TRANSACTABILITY with a fix list —
 * then the honest offer: Commerce can operate the fixes and measure the funnel.
 *
 * This is the only surface in the product that works on a stranger: no account,
 * no keys, no integration, no trust required. So it accepts ?url= from anywhere
 * — the Commerce hero hands a typed domain straight through — and when it does,
 * THE AUDIT RUNS HERE, ON THE SERVER. The finished report ships inside the HTML.
 *
 * That last part is not a performance flourish. A page that argues stores must
 * be legible without JavaScript, and then requires JavaScript to say so, is not
 * making its own case. This one can be read by the agents it is about.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Can AI shoppers buy from your store? · Free audit · PDR Commerce",
  description: "We fetch your store the way an AI shopping agent does — plain HTTP, no JavaScript — and grade what it can actually read and buy. Every finding is a real response from your server.",
};

export default async function VisibilityPage({ searchParams }: { searchParams: Promise<{ url?: string }> }) {
  const { url } = await searchParams;
  const asked = typeof url === "string" ? url.slice(0, 300).trim() : "";
  if (!asked) return <VisibilityScan />;

  // Validate before fetching: ?url= is attacker-controlled, and `normalize`
  // is what decides whether this is a public store address at all.
  if (!normalize(asked)) {
    return <VisibilityScan initialUrl={asked} initialError="Enter a valid public store URL (e.g. example.com)" />;
  }
  const report = await auditVisibility(asked).catch(() => null);
  return (
    <VisibilityScan
      initialUrl={asked}
      initialReport={report}
      initialError={report ? null : "Could not reach that store. Check the address and try again."}
    />
  );
}
