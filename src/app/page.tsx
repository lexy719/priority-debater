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
  Zap,
  MessageSquare,
  Shield,
  Clock,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-slate-50 to-white flex flex-col">
      <Header />

      {/* Hero */}
      <section className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 leading-tight">
            Validate your startup idea<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">before you waste 6 months.</span>
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Get a viability score, market analysis, competitive landscape, risk assessment, and a business plan — then debate an AI adversary to stress-test your logic. All in 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/validate"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors text-base shadow-lg shadow-slate-900/10"
            >
              Validate My Idea
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/validate?mode=generate"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors text-base border border-slate-200"
            >
              <Wand2 className="w-5 h-5" />
              Generate an Idea
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" /> Free to use
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" /> No signup required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" /> Ideas stay private
            </span>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-6 text-center">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative p-5 rounded-xl border border-slate-200 bg-white text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-bold mx-auto mb-3">1</div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Describe your idea</h3>
              <p className="text-xs text-slate-500">Tell us what you want to build and why you think it will work.</p>
            </div>
            <div className="relative p-5 rounded-xl border border-slate-200 bg-white text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-bold mx-auto mb-3">2</div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Get your report</h3>
              <p className="text-xs text-slate-500">AI analyzes viability, market, competition, risks, and gives you a score.</p>
            </div>
            <div className="relative p-5 rounded-xl border border-slate-200 bg-white text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-bold mx-auto mb-3">3</div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Debate & refine</h3>
              <p className="text-xs text-slate-500">Defend your position against an AI adversary. Find blind spots. Get sharper.</p>
            </div>
          </div>
        </div>

        {/* What you get */}
        <div className="mb-16">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2 text-center">
            What you get
          </h2>
          <p className="text-center text-slate-600 text-sm mb-6">
            A comprehensive analysis covering every angle investors and customers will ask about.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { icon: <Sparkles className="w-5 h-5 text-emerald-600" />, title: "Viability Score", desc: "0-10 with Go/No-Go" },
              { icon: <FileText className="w-5 h-5 text-blue-600" />, title: "Market Sizing", desc: "TAM / SAM / SOM" },
              { icon: <Eye className="w-5 h-5 text-amber-600" />, title: "Competition", desc: "5 competitors mapped" },
              { icon: <Clipboard className="w-5 h-5 text-red-500" />, title: "Risk Flags", desc: "Blind spots & pitfalls" },
              { icon: <Target className="w-5 h-5 text-violet-600" />, title: "Validation Steps", desc: "What to do first" },
              { icon: <Briefcase className="w-5 h-5 text-indigo-600" />, title: "Business Plan", desc: "Investor-ready" },
              { icon: <Swords className="w-5 h-5 text-slate-700" />, title: "AI Debate", desc: "Stress-test your logic" },
              { icon: <MessageSquare className="w-5 h-5 text-sky-600" />, title: "Value Prop", desc: "Positioning & ICP" },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all">
                <div className="mb-2">{item.icon}</div>
                <span className="font-semibold text-slate-900 text-sm block">{item.title}</span>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Example output preview */}
        <div className="mb-16">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-6 text-center">
            Example report preview
          </h2>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 sm:p-8 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">EXAMPLE IDEA</p>
                <h3 className="text-white font-bold text-lg">AI-powered meeting summarizer for remote teams</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-emerald-400 bg-white/5 border-2 border-emerald-400/50">
                  7
                </div>
                <span className="text-xs text-slate-400 font-medium">/ 10</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Check className="w-3 h-3" /> GO
              </span>
              <span className="text-xs text-slate-400">with conditions</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-emerald-400 font-bold text-lg">4</p>
                <p className="text-xs text-slate-400">Strengths</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-amber-400 font-bold text-lg">3</p>
                <p className="text-xs text-slate-400">Risks</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-blue-400 font-bold text-lg">5</p>
                <p className="text-xs text-slate-400">Actions</p>
              </div>
            </div>
            <p className="text-slate-400 text-xs mt-4 text-center italic">
              + Market analysis, competitive landscape, financial snapshot, timeline, business plan...
            </p>
          </div>
        </div>

        {/* Debate feature highlight */}
        <div className="mb-16">
          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="p-4 rounded-2xl bg-white/20 shrink-0">
                <Swords className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-bold text-white mb-2">
                  The feature nobody else has: AI Debate Mode
                </h3>
                <p className="text-violet-100 text-sm mb-1">
                  After validation, debate an AI adversary trained on Charlie Munger, Paul Graham, and Daniel Kahneman&apos;s frameworks. It finds the flaws before reality does.
                </p>
                <ul className="text-violet-200 text-xs space-y-1 mt-3">
                  <li className="flex items-center gap-2"><Check className="w-3 h-3 text-violet-300" /> Steelman & Devil&apos;s Advocate modes</li>
                  <li className="flex items-center gap-2"><Check className="w-3 h-3 text-violet-300" /> Blind spot analysis</li>
                  <li className="flex items-center gap-2"><Check className="w-3 h-3 text-violet-300" /> Framework-based reasoning (First Principles, Inversion, Base Rate)</li>
                  <li className="flex items-center gap-2"><Check className="w-3 h-3 text-violet-300" /> Argument strength scoring after every round</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Trust signals */}
        <div className="mb-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: <Clock className="w-5 h-5 text-slate-600" />, label: "2 min", desc: "Full report" },
              { icon: <Shield className="w-5 h-5 text-slate-600" />, label: "Private", desc: "Nothing stored" },
              { icon: <Zap className="w-5 h-5 text-slate-600" />, label: "GPT-4o", desc: "Latest AI model" },
              { icon: <Sparkles className="w-5 h-5 text-slate-600" />, label: "Free", desc: "No card needed" },
            ].map((item, i) => (
              <div key={i} className="text-center p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex justify-center mb-2">{item.icon}</div>
                <p className="font-bold text-slate-900 text-sm">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="border-t border-slate-200 pt-8 mb-8">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 text-center">Frequently asked questions</h3>
          <div className="space-y-3 text-sm text-slate-600 max-w-2xl mx-auto">
            {[
              {
                q: "How long does validation take?",
                a: "About 2 minutes. You get a complete viability report with score, market analysis, risk assessment, competitive landscape, and actionable validation steps.",
              },
              {
                q: "Is my idea kept private?",
                a: "Yes. We don't store or share your ideas. Everything is processed in real-time and kept in your browser session only. No database, no logs.",
              },
              {
                q: "What makes this different from other validators?",
                a: "Two things: depth and debate. The validation report covers everything from TAM/SAM/SOM to unit economics. Then you can debate your idea against an AI adversary that uses frameworks like inversion, base rate analysis, and pre-mortem thinking to find every weakness.",
              },
              {
                q: "How accurate is the AI analysis?",
                a: "The AI uses GPT-4o to analyze your idea across 15+ criteria. It's not a crystal ball — it's a thinking partner. The real value is the structured analysis and the questions it forces you to answer before you build.",
              },
              {
                q: "Can I generate a business plan?",
                a: "Yes. After validation, you can generate an investor-ready business plan with executive summary, financials, go-to-market strategy, and 3-year projections.",
              },
              {
                q: "What if I don't have an idea yet?",
                a: "Use the Idea Generator. Tell us your interests, skills, and constraints, and the AI will generate 3 tailored startup ideas for you to explore.",
              },
            ].map((item, i) => (
              <details key={i} className="group p-4 rounded-xl border border-slate-200 bg-white">
                <summary className="font-medium text-slate-900 cursor-pointer list-none flex items-center justify-between">
                  {item.q}
                  <span className="text-slate-400 group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <p className="mt-3 text-slate-600 leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center py-8 border-t border-slate-200">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
            Ready to validate?
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Find out if your idea has legs — before you spend a dime.
          </p>
          <Link
            href="/validate"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors text-base shadow-lg shadow-slate-900/10"
          >
            Get My Answer
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <Footer />
      </section>
    </div>
  );
}
