"use client";

import { ArrowRight, ClipboardCheck, Download, FileText, FlaskConical, MessageSquareQuote } from "lucide-react";
import { Sidebar } from "@/components/v2/sidebar";
import { PageHeader } from "@/components/v2/page-header";
import { Button } from "@/components/v2/button";

const TOOLS = [
  {
    title: "Interview script",
    description: "Persona-led customer interview guide with follow-up prompts and evidence tags.",
    eta: "12 min",
    icon: MessageSquareQuote,
  },
  {
    title: "Experiment board",
    description: "Turn top risks into measurable tests with pass/fail thresholds and owners.",
    eta: "18 min",
    icon: FlaskConical,
  },
  {
    title: "Decision memo",
    description: "Board-ready memo template with assumptions, objections, and go/no-go criteria.",
    eta: "9 min",
    icon: FileText,
  },
];

const CHECKLIST = [
  "Run 5 customer calls with the current script",
  "Capture 1 falsifiable metric per major risk",
  "Document what would make you kill the idea",
  "Review memo with one hostile reviewer",
];

export default function ToolkitPage() {
  return (
    <div className="app-page-shell min-h-screen flex text-[--ink-0]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <PageHeader
          kicker="Founder toolkit"
          title="Operational tools after the verdict"
          actions={
            <>
              <Button variant="ghost" size="sm">
                <Download className="w-3.5 h-3.5" /> Export bundle
              </Button>
              <Button size="sm">
                Open all tools
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </>
          }
        />

        <main className="px-6 md:px-8 py-10 md:py-12 max-w-[1480px] w-full space-y-10">
          <section className="surface-raised p-8 md:p-10">
            <div className="max-w-[860px] space-y-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">
                execution workspace · solo plan
              </div>
              <h2 className="font-serif text-[clamp(34px,4vw,56px)] leading-[0.95] tracking-[-0.025em]">
                Ship faster with fewer blind spots.
              </h2>
              <p className="text-[15px] leading-[1.7] text-[--ink-1]">
                Your verdict is only useful if it turns into action. This toolkit converts objections into
                test plans, scripts, and memos you can execute this week.
              </p>
            </div>
          </section>

          <section className="space-y-5">
            <SectionTitle title="Core tools" meta="3 modules" />
            <div className="grid grid-cols-1 md:grid-cols-3 panel-cluster">
              {TOOLS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <article key={tool.title} className="surface-raised p-7 md:p-8 flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                      <span className="grid h-8 w-8 place-items-center rounded-[--radius] bg-[--surface-2] border border-[--line]">
                        <Icon className="w-4 h-4 text-[--accent]" />
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[--ink-2]">
                        {tool.eta}
                      </span>
                    </div>
                    <h3 className="font-serif text-[30px] leading-[1.02] tracking-[-0.02em]">{tool.title}</h3>
                    <p className="text-[13px] leading-[1.65] text-[--ink-1]">{tool.description}</p>
                    <div className="mt-auto pt-5 border-t border-[--line]">
                      <Button variant="secondary" size="sm" className="w-full">
                        Open module
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-8">
            <article className="surface-raised p-7 md:p-8">
              <SectionTitle title="Weekly execution checklist" meta="operator mode" />
              <div className="mt-5 space-y-3">
                {CHECKLIST.map((item) => (
                  <div key={item} className="flex items-start gap-3 py-2 border-b border-[--line] last:border-0">
                    <ClipboardCheck className="w-4 h-4 text-[--accent] mt-0.5" />
                    <span className="text-[14px] leading-[1.55] text-[--ink-0]">{item}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="surface-raised p-7 md:p-8 space-y-5">
              <SectionTitle title="Export package" meta="for team + investors" />
              <p className="text-[14px] leading-[1.7] text-[--ink-1]">
                Bundle the current brief, panel excerpts, risk register, and execution checklist into a
                single document so feedback is about decisions, not missing context.
              </p>
              <div className="pt-4 border-t border-[--line] flex flex-wrap gap-3">
                <Button size="sm">
                  <Download className="w-3.5 h-3.5" />
                  Export markdown pack
                </Button>
                <Button variant="secondary" size="sm">
                  Share read-only link
                </Button>
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}

function SectionTitle({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h3 className="font-serif text-[30px] leading-[1.05] tracking-[-0.02em]">{title}</h3>
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[--ink-2]">{meta}</span>
    </div>
  );
}
