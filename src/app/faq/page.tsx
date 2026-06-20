import type { Metadata } from "next";
import Link from "next/link";
import { DocShell } from "@/components/legal/DocShell";

export const metadata: Metadata = {
  title: "FAQ — Priority Debater",
  description:
    "Answers about Priority Debater: how the AI validation panel works, the audited score, the post-validation studio, the AI Commerce audit, credits, billing, and privacy.",
  alternates: { canonical: "/faq" },
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is Priority Debater?",
    a: "It's a decision tool for founders. You drop in a startup idea and a panel of five adversarial AI advisors — investor, customer, operator, adversary, and mentor — stress-test it and return an investor-grade verdict with a score, objections, risks, and the next moves that matter. There's also a second path: an AI Commerce audit that scores how visible your store is to AI shopping agents.",
  },
  {
    q: "How does the validation work?",
    a: "You describe what you're building, who pays, and why now. Five expert personas argue the idea from opposing angles, then a synthesis engine writes a structured dossier — score, market sizing, risk register, and recommended next steps. It takes about two minutes.",
  },
  {
    q: "Is the score real or just made up by the model?",
    a: "Real. The score is produced by a deterministic, web-enriched rubric (not invented by a narrative model), so the same idea scores consistently and the number is anchored to evidence rather than vibes.",
  },
  {
    q: "What is the Studio?",
    a: "After your idea is validated, the Studio builds the launch assets around it: a Brand Kit (name, palette, fonts, voice, logo), a Launch Kit, an AI video-ad Campaign, a conversion Landing page, and a launch-day checklist — all generated from your specific idea.",
  },
  {
    q: "What is the AI Commerce audit?",
    a: "A separate path for existing stores. It scores how ChatGPT, Claude, and Gemini see your store, simulates how buyer-agents shop it, and generates the fixes (llms.txt, schema, product feed, outreach kit) that make AI recommend you instead of your competitors.",
  },
  {
    q: "How do credits work? Do they expire?",
    a: "Every account starts with 50 free credits. Actions like a validation or a debate cost credits; one-time top-up packs never expire. Premium plans include a monthly credit allowance plus access to gated features like the Fix Toolkit, HD voice, and AI video ads.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. You can sign up and validate an idea on free credits with no card. You only pay if you want more credits or a premium plan.",
  },
  {
    q: "Is my idea and data private?",
    a: "Your work is private to your account. We use trusted processors (Supabase for accounts, Stripe for billing, AI providers for generation) and never sell your data. See our Privacy Policy for details.",
  },
  {
    q: "Which AI models do you use?",
    a: "We use leading models from OpenAI, Anthropic, and Google for text and analysis, and Higgsfield for AI image and video generation. We pick the best model for each task and may change them as better ones ship.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes, anytime, from your account via the billing portal. You keep access until the end of the period, then drop back to the free plan.",
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <DocShell
      kicker="Help / FAQ"
      title={<>Questions, answered.</>}
      intro="The honest version. If something's missing, the team is one message away."
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <dl className="divide-y divide-ink/10 border-y border-ink/10">
        {FAQS.map((f) => (
          <div key={f.q} className="py-6">
            <dt className="font-display text-lg uppercase tracking-tight text-ink">{f.q}</dt>
            <dd className="mt-2 text-[15px] leading-relaxed text-ink/75">{f.a}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-10 text-sm text-ink/70">
        Still stuck?{" "}
        <Link href="/contact" className="text-ink underline underline-offset-4 hover:text-signal-red">
          Contact us
        </Link>{" "}
        or{" "}
        <Link href="/#validate" className="text-ink underline underline-offset-4 hover:text-signal-red">
          validate an idea
        </Link>
        .
      </p>
    </DocShell>
  );
}
