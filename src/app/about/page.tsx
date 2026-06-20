import type { Metadata } from "next";
import Link from "next/link";
import { DocShell, DocSection } from "@/components/legal/DocShell";

export const metadata: Metadata = {
  title: "About — Priority Debater",
  description:
    "Why Priority Debater exists: a ruthless AI decision panel that tells founders the truth before they commit a year to the wrong idea — plus a studio that builds the launch, and an AI commerce audit for stores.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <DocShell
      kicker="Company / About"
      title={<>Built to disagree.</>}
      intro="Most tools confirm your bias. We built the opposite — a panel that argues with you, scores you honestly, and then helps you ship the idea that survives."
    >
      <DocSection title="The problem">
        <p>
          Founders lose years to ideas that sounded great in their own head. Friends are polite,
          advisors are busy, and most &quot;validation&quot; just rewords your pitch back at you. The
          expensive feedback — the kind that saves a year — usually arrives far too late.
        </p>
      </DocSection>

      <DocSection title="What we do">
        <p>
          Priority Debater puts your idea in front of five adversarial AI advisors — an investor, a
          customer, an operator, an adversary, and a mentor — who argue it from opposing angles. A
          synthesis engine then writes an investor-grade dossier: an audited score, market sizing, a
          risk register, and the three moves that matter most.
        </p>
        <p>
          If the idea survives, the Studio builds the launch around it — brand, launch kit, video-ad
          campaign, landing page, and a launch-day checklist — all generated from your specific idea.
          And for businesses that already sell, our AI Commerce audit scores how visible your store is
          to AI shopping agents and ships the fixes.
        </p>
      </DocSection>

      <DocSection title="What we believe">
        <p>
          Honest beats flattering. A real number beats a vibe. And the best time to hear that your
          idea has a fatal flaw is before you&apos;ve spent a year on it — not after.
        </p>
      </DocSection>

      <p className="mt-10 text-sm text-ink/70">
        <Link href="/#validate" className="text-ink underline underline-offset-4 hover:text-signal-red">
          Validate an idea
        </Link>{" "}
        or{" "}
        <Link href="/pricing" className="text-ink underline underline-offset-4 hover:text-signal-red">
          see pricing
        </Link>
        .
      </p>
    </DocShell>
  );
}
