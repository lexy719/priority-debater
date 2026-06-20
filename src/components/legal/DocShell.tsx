import type { ReactNode } from "react";
import { SiteNav } from "@/components/SiteNav";
import { Footer } from "@/components/Cta";

/**
 * DocShell — shared layout for the marketing / SEO / legal pages (FAQ, About,
 * Privacy, Terms, Contact). One identity (SiteNav + marketing Footer) on the
 * paper canvas, readable measure, consistent typography.
 */
export function DocShell({
  kicker,
  title,
  intro,
  children,
}: {
  kicker: string;
  title: ReactNode;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <main className="app-page-shell min-h-screen text-ink">
      <SiteNav />
      <article className="mx-auto max-w-[820px] px-6 py-16 lg:px-10 lg:py-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink/45">— {kicker}</p>
        <h1 className="mt-4 font-display text-[clamp(2.25rem,6vw,4rem)] uppercase leading-[0.95] text-ink">
          {title}
        </h1>
        {intro && <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/70">{intro}</p>}
        <div className="prose-app mt-12">{children}</div>
      </article>
      <Footer />
    </main>
  );
}

/** Section heading used inside doc pages. */
export function DocSection({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-10 first:mt-0">
      <h2 className="font-display text-xl uppercase tracking-tight text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink/75">{children}</div>
    </section>
  );
}
