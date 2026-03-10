"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Sparkles,
  FileText,
  Swords,
  Eye,
  Clipboard,
  Wand2,
  Briefcase,
  Target,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-slate-50 to-white flex flex-col">
      <Header />
      <div className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <p className="text-center text-sm font-medium text-slate-500 mb-6">
          10,000+ ideas validated
        </p>

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
            Skip the guesswork.
          </h1>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Know before you build.
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto mb-6">
            92% of startups fail from poor validation. Don&apos;t be a statistic.
            Get a complete viability report in 2 minutes — not 2 months.
          </p>
          <Link
            href="/validate"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors text-base"
          >
            Get My Answer
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" /> No card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" /> Free
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" /> Your idea is safe
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" /> Private
            </span>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2 text-center">
            See what you&apos;ll get
          </h2>
          <p className="text-center text-slate-600 text-sm mb-6">
            Real validation results. Click any to learn more.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <Sparkles className="w-5 h-5 text-emerald-600 mb-2" />
              <span className="font-semibold text-slate-900 text-sm block">AI Validation Score</span>
              <p className="text-xs text-slate-500 mt-0.5">Viability · Risk · Go/No-Go</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <FileText className="w-5 h-5 text-blue-600 mb-2" />
              <span className="font-semibold text-slate-900 text-sm block">Market Opportunity</span>
              <p className="text-xs text-slate-500 mt-0.5">TAM · SAM · SOM</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <Eye className="w-5 h-5 text-amber-600 mb-2" />
              <span className="font-semibold text-slate-900 text-sm block">Competitive Landscape</span>
              <p className="text-xs text-slate-500 mt-0.5">Positioning · 5 competitors</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <Clipboard className="w-5 h-5 text-violet-600 mb-2" />
              <span className="font-semibold text-slate-900 text-sm block">Risk Assessment</span>
              <p className="text-xs text-slate-500 mt-0.5">Blind spots · Failure modes</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <Target className="w-5 h-5 text-slate-600 mb-2" />
              <span className="font-semibold text-slate-900 text-sm block">Validation Steps</span>
              <p className="text-xs text-slate-500 mt-0.5">Top 3 before building</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <Swords className="w-5 h-5 text-violet-600 mb-2" />
              <span className="font-semibold text-slate-900 text-sm block">Debate it</span>
              <p className="text-xs text-slate-500 mt-0.5">Defend & refine · Our edge</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white sm:col-span-2 sm:col-start-2">
              <Briefcase className="w-5 h-5 text-indigo-600 mb-2" />
              <span className="font-semibold text-slate-900 text-sm block">Business Plan</span>
              <p className="text-xs text-slate-500 mt-0.5">Investor-ready · Financials · GTM</p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mb-8">
          <span className="font-medium">Need an idea?</span>{" "}
          <Link
            href="/validate?mode=generate"
            className="text-slate-900 font-medium hover:underline inline-flex items-center gap-1"
          >
            <Wand2 className="w-4 h-4" /> Generate one
          </Link>
        </p>

        <div className="border-t border-slate-200 pt-8 mb-8">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 text-center">Popular questions</h3>
          <div className="space-y-3 text-sm text-slate-600">
            <details className="group p-3 rounded-lg border border-slate-200 bg-white">
              <summary className="font-medium text-slate-900 cursor-pointer">
                How long does validation take?
              </summary>
              <p className="mt-2 text-slate-600">
                About 2 minutes. You get a complete viability report with score, risks, and market
                analysis.
              </p>
            </details>
            <details className="group p-3 rounded-lg border border-slate-200 bg-white">
              <summary className="font-medium text-slate-900 cursor-pointer">
                Is my idea kept private?
              </summary>
              <p className="mt-2 text-slate-600">
                Yes. We don&apos;t store or share your ideas. Everything stays between you and the
                AI.
              </p>
            </details>
            <details className="group p-3 rounded-lg border border-slate-200 bg-white">
              <summary className="font-medium text-slate-900 cursor-pointer">
                What makes this different?
              </summary>
              <p className="mt-2 text-slate-600">
                You get the same validation report — plus you can debate it. Defend your position,
                stress-test your logic, and refine before you build.
              </p>
            </details>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
