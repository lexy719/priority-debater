import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[--bg] text-[--ink-0] grid place-items-center px-6">
      <section className="surface-raised w-full max-w-[720px] p-10 md:p-12 text-center">
        <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">
          <Search className="w-3 h-3" />
          404 · page not found
        </div>
        <h1 className="font-serif text-[clamp(42px,6vw,84px)] leading-[0.95] tracking-[-0.03em] mt-5">
          This page does not exist.
        </h1>
        <p className="text-[15px] leading-[1.7] text-[--ink-1] mt-5 max-w-[560px] mx-auto">
          The link may be outdated, or the route changed during the redesign. Use the home page to
          continue from the latest workspace.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-[--radius] border border-[--line-strong] bg-[--surface-1] text-[13px] text-[--ink-0] hover:bg-[--surface-2] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
