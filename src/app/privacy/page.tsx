import type { Metadata } from "next";
import { DocShell, DocSection } from "@/components/legal/DocShell";

export const metadata: Metadata = {
  title: "Privacy Policy — Priority Debater",
  description: "How Priority Debater collects, uses, and protects your data.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "June 2026";

export default function PrivacyPage() {
  return (
    <DocShell kicker="Legal / Privacy" title={<>Privacy Policy.</>} intro={`Last updated: ${UPDATED}`}>
      <p className="border-l-2 border-signal-red/60 pl-4 text-sm text-ink/60">
        This is a plain-English starting policy. Before public launch, have it reviewed by a lawyer
        and tailored to your jurisdiction (GDPR/CCPA, etc.).
      </p>

      <DocSection title="Who we are">
        <p>
          Priority Debater (&quot;we&quot;, &quot;us&quot;) provides AI idea-validation and commerce
          tools. This policy explains what we collect and why.
        </p>
      </DocSection>

      <DocSection title="What we collect">
        <p>
          <strong>Account data:</strong> your email and display name when you sign up (via Supabase, or
          Google if you use Google sign-in).
        </p>
        <p>
          <strong>Content you submit:</strong> the ideas, pitches, store URLs, and prompts you enter,
          plus the reports and assets we generate for you.
        </p>
        <p>
          <strong>Billing data:</strong> handled by Stripe. We never see or store your full card
          number — only a customer reference and plan status.
        </p>
        <p>
          <strong>Usage data:</strong> basic logs and analytics to keep the service reliable.
        </p>
      </DocSection>

      <DocSection title="How we use it">
        <p>
          To run the product (generate your validations, dossiers, brand kits, audits), to enforce
          credits and plans, to provide support, and to improve the service. We do not sell your data.
        </p>
      </DocSection>

      <DocSection title="Processors we rely on">
        <p>
          We share the minimum necessary with trusted providers: Supabase (auth + database), Stripe
          (payments), and AI providers — OpenAI, Anthropic, Google, and Higgsfield — to generate
          content from your inputs. Each processes data under its own terms.
        </p>
      </DocSection>

      <DocSection title="Cookies">
        <p>
          We use essential cookies for sign-in and session management. We aim to keep non-essential
          tracking minimal.
        </p>
      </DocSection>

      <DocSection title="Your rights">
        <p>
          You can access, export, or delete your account data — email us to request it. Depending on
          where you live, you may have additional rights under GDPR or CCPA.
        </p>
      </DocSection>

      <DocSection title="Contact">
        <p>
          Questions about privacy? Email <strong>support@prioritydebater.com</strong>.
        </p>
      </DocSection>
    </DocShell>
  );
}
