import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquare, Twitter } from "lucide-react";
import { DocShell } from "@/components/legal/DocShell";

export const metadata: Metadata = {
  title: "Contact — Priority Debater",
  description: "Get in touch with the Priority Debater team — support, feedback, partnerships, and press.",
  alternates: { canonical: "/contact" },
};

const SUPPORT_EMAIL = "support@prioritydebater.com";

export default function ContactPage() {
  return (
    <DocShell
      kicker="Company / Contact"
      title={<>Talk to us.</>}
      intro="Questions, feedback, a bug, or a partnership — we read everything. The fastest way to reach a human is email."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="surface-paper flex items-start gap-4 p-5 hover-lift"
        >
          <Mail className="mt-0.5 h-5 w-5 text-signal-red" />
          <span>
            <span className="block font-display text-lg uppercase tracking-tight text-ink">Email</span>
            <span className="mt-1 block text-sm text-ink/70">{SUPPORT_EMAIL}</span>
            <span className="mt-1 block text-xs text-ink/50">Support, feedback, partnerships, press.</span>
          </span>
        </a>

        <Link href="/faq" className="surface-paper flex items-start gap-4 p-5 hover-lift">
          <MessageSquare className="mt-0.5 h-5 w-5 text-signal-red" />
          <span>
            <span className="block font-display text-lg uppercase tracking-tight text-ink">Read the FAQ</span>
            <span className="mt-1 block text-sm text-ink/70">Most answers live here.</span>
            <span className="mt-1 block text-xs text-ink/50">Validation, credits, billing, privacy.</span>
          </span>
        </Link>
      </div>

      <p className="mt-8 text-sm text-ink/70">
        Want product updates? Join the newsletter from the footer below, or{" "}
        <Link href="/#validate" className="text-ink underline underline-offset-4 hover:text-signal-red">
          validate an idea
        </Link>{" "}
        to see it in action.
      </p>

      <p className="mt-6 flex items-center gap-2 text-xs text-ink/45">
        <Twitter className="h-3.5 w-3.5" /> Social handles coming soon.
      </p>
    </DocShell>
  );
}
