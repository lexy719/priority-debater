import type { Metadata } from "next";
import { DocShell, DocSection } from "@/components/legal/DocShell";

export const metadata: Metadata = {
  title: "Terms of Service — Priority Debater",
  description: "The terms that govern your use of Priority Debater.",
  alternates: { canonical: "/terms" },
};

const UPDATED = "June 2026";

export default function TermsPage() {
  return (
    <DocShell kicker="Legal / Terms" title={<>Terms of Service.</>} intro={`Last updated: ${UPDATED}`}>
      <p className="border-l-2 border-signal-red/60 pl-4 text-sm text-ink/60">
        Plain-English starting terms. Have a lawyer review and adapt them to your jurisdiction before
        public launch.
      </p>

      <DocSection title="Acceptance">
        <p>
          By creating an account or using Priority Debater, you agree to these terms. If you don&apos;t
          agree, don&apos;t use the service.
        </p>
      </DocSection>

      <DocSection title="The service">
        <p>
          Priority Debater provides AI-generated analysis, assets, and recommendations. Output is for
          guidance only — it is <strong>not</strong> legal, financial, or investment advice. You are
          responsible for decisions you make based on it.
        </p>
      </DocSection>

      <DocSection title="Accounts & credits">
        <p>
          You&apos;re responsible for activity under your account. Free credits, one-time packs, and
          subscription allowances are governed by the pricing shown at purchase. Credits have no cash
          value and one-time packs don&apos;t expire. Subscriptions renew until cancelled and can be
          cancelled anytime from your account.
        </p>
      </DocSection>

      <DocSection title="Acceptable use">
        <p>
          Don&apos;t use the service to break the law, infringe others&apos; rights, generate harmful
          or deceptive content, or abuse the system (scraping, reselling, or circumventing limits).
        </p>
      </DocSection>

      <DocSection title="Your content">
        <p>
          You keep ownership of the ideas you submit and the assets we generate for you. You grant us
          the limited rights needed to process your inputs and operate the service.
        </p>
      </DocSection>

      <DocSection title="Beta & availability">
        <p>
          The service is offered &quot;as is&quot; during beta and may change or have downtime. We
          don&apos;t guarantee specific results or uninterrupted availability.
        </p>
      </DocSection>

      <DocSection title="Liability">
        <p>
          To the maximum extent permitted by law, our liability is limited to the amount you paid us in
          the prior 12 months. We aren&apos;t liable for indirect or consequential losses.
        </p>
      </DocSection>

      <DocSection title="Contact">
        <p>
          Questions about these terms? Email <strong>support@prioritydebater.com</strong>.
        </p>
      </DocSection>
    </DocShell>
  );
}
