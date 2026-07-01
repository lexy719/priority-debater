"use client";

/**
 * PD Agent — the fix engine, as a conversation.
 *
 * Left rail: the store, its score, a one-click "quick fixes" launcher pulled
 * straight from the report, and past conversations. Right: the chat — the agent
 * answers questions and generates real, store-specific artifacts you can copy,
 * download, or (soon) publish to Shopify. chamber-scope theme.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Download, FileText, Plus, Send, Sparkles, Zap } from "lucide-react";
import { useCreditsState } from "@/components/credits/CreditsProvider";
import { getCurrentReport, loadLocalReport } from "@/lib/commerce/client-store";
import type { CommerceReport } from "@/lib/commerce/types";
import type { AgentArtifact, AgentMessage, AgentThread } from "@/lib/commerce/agent/types";

type FixLite = { id: string; outcome: string; severity: string; impact: string };
type ReportLite = { shareId: string; storeName: string; category: string; topCompetitor: string | null; score: number; fixes: FixLite[] };
type Phase = "loading" | "no-report" | "ready";
type ThreadLite = { id: string; title: string };

const EXT: Record<AgentArtifact["format"], string> = { markdown: "md", txt: "txt", json: "json", html: "html", text: "txt" };

function scoreColor(n: number): string {
  if (n >= 70) return "var(--success)";
  if (n >= 55) return "var(--data)";
  if (n >= 40) return "var(--warn)";
  return "var(--danger)";
}
function sevColor(s: string): string {
  return s === "CRITICAL" ? "var(--danger)" : s === "HIGH" ? "var(--warn)" : "var(--data)";
}

export function AgentChat({ embeddedReport }: { embeddedReport?: CommerceReport } = {}) {
  const { setBalance } = useCreditsState();
  const [phase, setPhase] = useState<Phase>("loading");
  const [report, setReport] = useState<ReportLite | null>(null);
  const [threads, setThreads] = useState<ThreadLite[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const didAutoFix = useRef(false);
  const fullReport = useRef<CommerceReport | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportId = embeddedReport?.shareId || params.get("reportId")?.trim() || getCurrentReport()?.shareId;
    const fixId = params.get("fix")?.trim();
    const ask = params.get("ask")?.trim(); // deep-link a marketing/other prompt
    if (!reportId) {
      setPhase("no-report");
      return;
    }
    function adopt(r: CommerceReport) {
      fullReport.current = r;
      setReport({
        shareId: r.shareId,
        storeName: r.storeName,
        category: r.category,
        topCompetitor: r.topCompetitor,
        score: r.scores.overall,
        fixes: r.fixes.map((f) => ({ id: f.id, outcome: f.outcome, severity: f.severity, impact: f.impact })),
      });
      setPhase("ready");
      if (!didAutoFix.current && (fixId || ask)) {
        didAutoFix.current = true;
        void send(fixId ? { fixId } : { text: ask });
      }
    }
    // Embedded in the workspace → use the report we were handed (no fetch).
    if (embeddedReport) {
      adopt(embeddedReport);
      return;
    }
    const local = loadLocalReport(reportId);
    if (local) {
      adopt(local);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/commerce/report?shareId=${encodeURIComponent(reportId)}`);
        if (!res.ok) throw new Error();
        const { report } = (await res.json()) as { report: CommerceReport };
        adopt(report);
      } catch {
        setPhase("no-report");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = useCallback(
    async (opts: { text?: string; fixId?: string }) => {
      if (sending) return;
      const reportId = fullReport.current?.shareId ?? report?.shareId ?? new URLSearchParams(window.location.search).get("reportId")?.trim();
      if (!reportId) return;
      const text = opts.text?.trim();
      if (!opts.fixId && !text) return;

      const fixLabel = opts.fixId ? fullReport.current?.fixes.find((f) => f.id === opts.fixId)?.outcome : undefined;
      setSending(true);
      setMessages((m) => [
        ...m,
        { id: `tmp_${Date.now()}`, role: "user", content: opts.fixId ? `Execute: ${fixLabel ?? "my top blocker"}` : text!, ts: new Date().toISOString() },
      ]);
      setInput("");

      try {
        const res = await fetch("/api/commerce/agent/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId: activeId ?? undefined, reportId, message: text, fixId: opts.fixId, report: fullReport.current ?? undefined }),
        });
        if (res.status === 401) {
          window.location.href = `/login?next=${encodeURIComponent(`/commerce/agent?reportId=${reportId}`)}`;
          return;
        }
        if (res.status === 402) {
          window.location.href = "/credits";
          return;
        }
        const data = (await res.json()) as { thread?: AgentThread; balance?: number | null; error?: string };
        if (!res.ok || !data.thread) throw new Error(data.error || "Agent error");
        setActiveId(data.thread.id);
        setMessages(data.thread.messages);
        setThreads((t) => (t.some((x) => x.id === data.thread!.id) ? t : [{ id: data.thread!.id, title: data.thread!.title }, ...t]));
        if (typeof data.balance === "number") setBalance(data.balance);
      } catch {
        setMessages((m) => [...m, { id: `err_${Date.now()}`, role: "assistant", content: "Something went wrong — no credits charged. Try again.", ts: new Date().toISOString() }]);
      } finally {
        setSending(false);
      }
    },
    [sending, report, activeId, setBalance],
  );

  function newChat() {
    setActiveId(null);
    setMessages([]);
    didAutoFix.current = true;
  }

  if (phase === "loading") {
    return <div className="flex min-h-[70vh] items-center justify-center font-mono text-[11px] tracking-[0.2em] text-muted-foreground">LOADING AGENT…</div>;
  }

  if (phase === "no-report") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="text-display text-3xl">RUN A SCAN FIRST</div>
        <p className="max-w-md text-sm text-muted-foreground">
          The PD Agent works from your store's report — its real products, scores, and the competitors AI named. Run a free
          scan, then open the agent from your results.
        </p>
        <Link href="/commerce" className="bg-signal-blue px-6 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-paper">
          Run a free scan →
        </Link>
      </div>
    );
  }

  const suggestions = report
    ? [
        { label: "What should I fix first — and why?", run: () => send({ text: "What's my single highest-leverage move right now to win back AI visibility, and why that one?" }) },
        { label: `How do I beat ${report.topCompetitor ?? "my rival"}?`, run: () => send({ text: `Give me a specific, prioritised plan to beat ${report.topCompetitor ?? "my top competitor"} in AI recommendations.` }) },
        { label: "Build me a 30-day plan", run: () => send({ text: "Build me a focused 30-day plan to raise my AI visibility score — week by week." }) },
        { label: "Turn my best query into a campaign", run: () => send({ text: "Take my best-performing buyer query and turn it into a short-form video + social campaign." }) },
      ]
    : [];

  return (
    <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-[1240px] grid-cols-1 border-x border-border md:grid-cols-[290px_1fr]">
      {/* ───────── left rail ───────── */}
      <aside className="hidden flex-col border-r border-border bg-surface md:flex">
        {report && (
          <div className="border-b border-border bg-ink p-5 text-ink-foreground">
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink-foreground/50">STORE</div>
            <div className="mt-1 truncate font-display text-xl">{report.storeName}</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="font-display text-3xl tabular-nums" style={{ color: scoreColor(report.score) }}>{report.score}</div>
              <div className="text-[10px] uppercase leading-tight tracking-[0.12em] text-ink-foreground/50">
                AI visibility
                <br />
                {report.fixes.length} fixes ready
              </div>
            </div>
          </div>
        )}

        <button
          onClick={newChat}
          className="flex items-center gap-2 border-b border-border px-5 py-3.5 text-left font-mono text-[11px] uppercase tracking-[0.14em] text-foreground hover:bg-ink hover:text-ink-foreground"
        >
          <Plus className="size-3.5" /> New conversation
        </button>

        {/* quick fixes pulled from the report */}
        {report && report.fixes.length > 0 && (
          <div className="border-b border-border p-3">
            <div className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Quick fixes</div>
            <div className="space-y-1">
              {report.fixes.slice(0, 4).map((f) => (
                <button
                  key={f.id}
                  onClick={() => send({ fixId: f.id })}
                  disabled={sending}
                  className="group flex w-full items-start gap-2 px-2 py-2 text-left transition-colors hover:bg-background disabled:opacity-50"
                >
                  <span className="mt-1 size-2 shrink-0" style={{ background: sevColor(f.severity) }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] text-foreground">{f.outcome}</span>
                    <span className="font-mono text-[10px] tabular-nums text-data">{f.impact}</span>
                  </span>
                  <Zap className="mt-0.5 size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3">
          <div className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Conversations</div>
          {threads.length === 0 ? (
            <p className="px-2 py-2 text-[11px] text-muted-foreground">None yet.</p>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                onClick={() => { setActiveId(t.id); setMessages([]); }}
                className={`block w-full truncate px-2 py-2 text-left text-[12px] ${t.id === activeId ? "bg-ink text-ink-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t.title}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ───────── conversation ───────── */}
      <section className="flex min-h-[calc(100vh-64px)] flex-col bg-background">
        <div className="flex items-center gap-2 border-b border-border bg-surface px-5 py-3">
          <span className="grid size-6 place-items-center bg-data text-data-foreground">
            <Sparkles className="size-3.5" />
          </span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]">PD · Co-founder</span>
          {report && (
            <span className="ml-auto flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
              {report.storeName}
              <span className="tabular-nums" style={{ color: scoreColor(report.score) }}>· {report.score}</span>
            </span>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto px-5 py-7 md:px-8">
          {messages.length === 0 && (
            <div className="mx-auto max-w-2xl pt-6 text-center">
              <span className="mx-auto grid size-10 place-items-center bg-ink text-ink-foreground">
                <Sparkles className="size-5" />
              </span>
              <div className="mt-5 text-display text-2xl md:text-3xl">WHAT'S OUR NEXT MOVE?</div>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                I'm your AI co-founder — I know exactly where {report?.storeName ?? "your store"} is winning and losing in AI
                search. Ask me anything, or tell me to build it. I work from your real data, not generic prompts.
              </p>
              <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    onClick={s.run}
                    disabled={sending}
                    className="ip-card flex items-center gap-3 px-4 py-3.5 text-left text-[13px] transition-colors hover:border-data disabled:opacity-50"
                  >
                    <ArrowRight className="size-3.5 shrink-0 text-data" />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <Message key={m.id} message={m} />
          ))}

          {sending && (
            <div className="flex items-center gap-2.5">
              <span className="grid size-6 shrink-0 place-items-center bg-data text-data-foreground">
                <Sparkles className="size-3.5" />
              </span>
              <span className="inline-flex gap-1">
                <span className="size-1.5 animate-blink bg-data" />
                <span className="size-1.5 animate-blink bg-data [animation-delay:150ms]" />
                <span className="size-1.5 animate-blink bg-data [animation-delay:300ms]" />
              </span>
            </div>
          )}
        </div>

        {/* composer */}
        <form
          onSubmit={(e) => { e.preventDefault(); void send({ text: input }); }}
          className="border-t border-border bg-surface p-3"
        >
          <div className="flex items-center gap-2 border border-border bg-background px-3 focus-within:border-data">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask, or tell the agent what to fix…"
              disabled={sending}
              className="h-11 flex-1 bg-transparent font-mono text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="grid size-8 place-items-center bg-ink text-ink-foreground transition-transform duration-150 hover:translate-y-[-1px] active:translate-y-[1px] disabled:opacity-30"
              aria-label="Send"
            >
              <Send className="size-4" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Message({ message }: { message: AgentMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-ink px-4 py-2.5 text-[13px] leading-relaxed text-ink-foreground">{message.content}</div>
      </div>
    );
  }
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center bg-data text-data-foreground">
        <Sparkles className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1 space-y-3">
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">{message.content}</p>
        {message.artifact && <ArtifactCard artifact={message.artifact} />}
      </div>
    </div>
  );
}

function ArtifactCard({ artifact }: { artifact: AgentArtifact }) {
  const [copied, setCopied] = useState(false);
  const [published, setPublished] = useState(false);

  function copy() {
    navigator.clipboard.writeText(artifact.body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  function download() {
    const blob = new Blob([artifact.body], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${artifact.skill}.${EXT[artifact.format]}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="max-w-full overflow-hidden border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background px-4 py-2.5">
        <FileText className="size-3.5 text-data" />
        <span className="font-mono text-[12px] font-bold uppercase tracking-[0.06em]">{artifact.title}</span>
        <span className="ip-pill ip-pill-muted">{artifact.format.toUpperCase()}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={copy} className="flex items-center gap-1 border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] hover:bg-ink hover:text-ink-foreground">
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />} {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={download} className="flex items-center gap-1 border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] hover:bg-ink hover:text-ink-foreground">
            <Download className="size-3" /> Save
          </button>
        </div>
      </div>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap border-l-2 border-data bg-background px-4 py-3 text-[12px] leading-relaxed text-foreground">{artifact.body}</pre>
      <div className="border-t border-border px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">HOW TO PUT IT LIVE</div>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-[12px] text-muted-foreground">
          {artifact.installSteps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        <button
          onClick={() => setPublished(true)}
          disabled={published}
          className="mt-3 inline-flex items-center gap-2 bg-signal-blue px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-paper disabled:opacity-70"
        >
          {published ? "Connect Shopify to publish (coming soon)" : "Approve & publish →"}
        </button>
      </div>
    </div>
  );
}
