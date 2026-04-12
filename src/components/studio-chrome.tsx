import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import { GradientMesh } from "@/components/ui/animated-background";

export function StudioChrome({
  title,
  eyebrow,
  subtitle,
  maxWidthClass = "max-w-5xl",
  children,
}: {
  title: string;
  eyebrow: string;
  /** Optional line under the title (e.g. value prop). */
  subtitle?: string;
  /** Wider layouts for dense workspaces (e.g. `max-w-6xl`). */
  maxWidthClass?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#08080e] relative">
      <GradientMesh />
      <div className="sticky top-0 z-30 bg-[#08080e]/80 backdrop-blur-xl border-b border-white/6">
        <div className={`${maxWidthClass} mx-auto px-4 sm:px-6 flex items-center justify-between h-14`}>
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="hidden sm:inline text-sm font-semibold text-white/70 group-hover:text-white transition-colors">
                Priority Debater
              </span>
            </Link>
          </div>
          <Link
            href="/results"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white/30 hover:text-white/60 rounded-lg hover:bg-white/4 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Results</span>
          </Link>
        </div>
      </div>
      <main className={`relative z-10 ${maxWidthClass} mx-auto px-4 sm:px-6 py-8 sm:py-10`}>
        <div className="mb-8 text-center sm:mb-10">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-300/55">
            {eyebrow}
          </p>
          <h1 className="mx-auto max-w-4xl text-balance text-2xl font-bold leading-[1.15] tracking-tight text-white sm:text-3xl lg:text-[2rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mx-auto mt-3 max-w-lg text-pretty text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {children}
      </main>
    </div>
  );
}
