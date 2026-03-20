"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Loader2,
  Send,
  RotateCcw,
  Zap,
  Download,
  Check,
  Copy,
  Shield,
  Swords,
  Eye,
  BarChart3,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  TrendingUp,
  Users,
  Wrench,
  Brain,
  ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { loadSession, loadSessionWithStatus, clearSession, updateSessionMessages } from "@/lib/session";
import { shouldBlock, hasSensitiveTopic } from "@/lib/contentModeration";
import { InteractiveParticles } from "@/components/ui/animated-background";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Message, ValidationSession } from "@/lib/types";

const MAX_MESSAGE_LENGTH = 2000;

// ── Personas ──
const PERSONAS = [
  {
    id: "adversary",
    name: "The Adversary",
    short: "Finds every flaw",
    icon: <Swords className="w-4 h-4" />,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    activeBg: "bg-red-500/20 border-red-500/40 ring-1 ring-red-500/20",
    avatarGradient: "from-red-500/20 to-orange-500/20 border-red-500/15",
    avatarIcon: <Swords className="w-3 h-3 text-red-400" />,
    typingPhrases: [
      "Finding the flaw...",
      "Stress-testing your logic...",
      "Checking your assumptions...",
      "Applying the inversion test...",
      "Running the pre-mortem...",
    ],
  },
  {
    id: "investor",
    name: "The Investor",
    short: "VC lens on returns",
    icon: <TrendingUp className="w-4 h-4" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    activeBg: "bg-emerald-500/20 border-emerald-500/40 ring-1 ring-emerald-500/20",
    avatarGradient: "from-emerald-500/20 to-teal-500/20 border-emerald-500/15",
    avatarIcon: <TrendingUp className="w-3 h-3 text-emerald-400" />,
    typingPhrases: [
      "Running the numbers...",
      "Checking unit economics...",
      "Evaluating the return...",
      "Sizing the market...",
      "Modeling the exit...",
    ],
  },
  {
    id: "mentor",
    name: "The Mentor",
    short: "Founder who's been there",
    icon: <Brain className="w-4 h-4" />,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    activeBg: "bg-amber-500/20 border-amber-500/40 ring-1 ring-amber-500/20",
    avatarGradient: "from-amber-500/20 to-yellow-500/20 border-amber-500/15",
    avatarIcon: <Brain className="w-3 h-3 text-amber-400" />,
    typingPhrases: [
      "Drawing from experience...",
      "Thinking about what I'd do...",
      "Recalling a similar pattern...",
      "Considering the trade-offs...",
      "Crafting advice...",
    ],
  },
  {
    id: "customer",
    name: "The Customer",
    short: "Convince me to buy",
    icon: <Users className="w-4 h-4" />,
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
    activeBg: "bg-sky-500/20 border-sky-500/40 ring-1 ring-sky-500/20",
    avatarGradient: "from-sky-500/20 to-blue-500/20 border-sky-500/15",
    avatarIcon: <Users className="w-3 h-3 text-sky-400" />,
    typingPhrases: [
      "Evaluating the pitch...",
      "Checking if I'd actually pay...",
      "Comparing to what I use now...",
      "Thinking about switching costs...",
      "Considering the risk...",
    ],
  },
  {
    id: "operator",
    name: "The Operator",
    short: "How do you actually build it",
    icon: <Wrench className="w-4 h-4" />,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    activeBg: "bg-violet-500/20 border-violet-500/40 ring-1 ring-violet-500/20",
    avatarGradient: "from-violet-500/20 to-purple-500/20 border-violet-500/15",
    avatarIcon: <Wrench className="w-3 h-3 text-violet-400" />,
    typingPhrases: [
      "Planning the build...",
      "Mapping the execution...",
      "Thinking about hiring...",
      "Scoping the MVP...",
      "Checking the timeline...",
    ],
  },
];

const QUICK_ACTIONS = [
  { id: "steelman", label: "Steelman", icon: <Shield className="w-3.5 h-3.5" />, color: "text-emerald-400 hover:bg-emerald-500/15 border-emerald-500/20" },
  { id: "devils-advocate", label: "Devil's Advocate", icon: <Swords className="w-3.5 h-3.5" />, color: "text-red-400 hover:bg-red-500/15 border-red-500/20" },
  { id: "blind-spots", label: "Blind Spots", icon: <Eye className="w-3.5 h-3.5" />, color: "text-amber-400 hover:bg-amber-500/15 border-amber-500/20" },
  { id: "rate", label: "Rate", icon: <BarChart3 className="w-3.5 h-3.5" />, color: "text-indigo-400 hover:bg-indigo-500/15 border-indigo-500/20" },
  { id: "framework", label: "Framework", icon: <Sparkles className="w-3.5 h-3.5" />, color: "text-violet-400 hover:bg-violet-500/15 border-violet-500/20" },
  { id: "summary", label: "Summary", icon: <MessageSquare className="w-3.5 h-3.5" />, color: "text-sky-400 hover:bg-sky-500/15 border-sky-500/20" },
];

export default function DebatePage() {
  const router = useRouter();
  const [session, setSession] = useState<ValidationSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [typingPhrase, setTypingPhrase] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [activePersona, setActivePersona] = useState("adversary");
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const personaRef = useRef<HTMLDivElement>(null);

  const persona = PERSONAS.find(p => p.id === activePersona) || PERSONAS[0];

  // Close persona picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (personaRef.current && !personaRef.current.contains(e.target as Node)) {
        setShowPersonaPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [debateStarted, setDebateStarted] = useState(false);

  useEffect(() => {
    const result = loadSessionWithStatus();
    if (result.status === "expired") {
      alert("Your session has expired (24h limit). Please start a new validation.");
      router.replace("/validate");
      return;
    }
    if (result.status === "none") { router.replace("/validate"); return; }
    const s = result.session;
    setSession(s);
    const isValidationReport = s.messages.length > 0 && s.messages[0].role === "opponent" && s.messages[0].content.length > 500;
    const chatMessages = isValidationReport ? s.messages.slice(1) : s.messages;
    setMessages(chatMessages);
    if (isValidationReport && chatMessages.length === 0) {
      setDebateStarted(true);
      generateDebateOpener(s, "adversary");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const generateDebateOpener = async (s: ValidationSession, personaId: string) => {
    setIsLoading(true);
    const p = PERSONAS.find(pp => pp.id === personaId) || PERSONAS[0];
    setTypingPhrase(p.typingPhrases[Math.floor(Math.random() * p.typingPhrases.length)]);
    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "debate-open",
          setup: s.setup,
          validationContent: s.validationContent,
          persona: personaId,
        }),
      });
      if (!response.ok) throw new Error("Failed to start debate");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let accumulated = "";
      setStreamingContent("");
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) { accumulated += parsed.content; setStreamingContent(accumulated); }
            } catch { /* skip */ }
          }
        }
      }
      setStreamingContent("");
      const openerMsg: Message = { id: (Date.now() + 1).toString(), role: "opponent", content: accumulated };
      setMessages([openerMsg]);
      updateSessionMessages([openerMsg]);
    } catch {
      setError("Failed to start debate. Try sending a message.");
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    if (isLoading) {
      setTypingPhrase(persona.typingPhrases[Math.floor(Math.random() * persona.typingPhrases.length)]);
    }
  }, [isLoading, persona]);

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center bg-[#08080e]"><Loader2 className="w-8 h-8 animate-spin text-indigo-500/50" /></div>;
  }

  const { setup } = session;

  const getArgumentScore = (): number | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === "opponent") {
        const match = msg.content.match(/(?:Argument Strength|Score)[:\s]*\[?(\d+)\]?\/10/i) || msg.content.match(/(\d+)\/10/);
        if (match) return parseInt(match[1]);
      }
    }
    return null;
  };
  const score = getArgumentScore();
  const getScoreColor = (s: number) => s >= 7 ? "text-emerald-400" : s >= 5 ? "text-amber-400" : "text-red-400";
  const getScoreBg = (s: number) => s >= 7 ? "bg-emerald-500/10 border-emerald-500/25" : s >= 5 ? "bg-amber-500/10 border-amber-500/25" : "bg-red-500/10 border-red-500/25";

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
  };

  const streamResponse = async (response: Response, newMessages: Message[]) => {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader");
    const decoder = new TextDecoder();
    let accumulated = "";
    setStreamingContent("");
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) { accumulated += parsed.content; setStreamingContent(accumulated); }
          } catch { /* skip */ }
        }
      }
    }
    setStreamingContent("");
    const opponentMessage: Message = { id: (Date.now() + 1).toString(), role: "opponent", content: accumulated };
    const updated = [...newMessages, opponentMessage];
    setMessages(updated);
    updateSessionMessages(updated);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const trimmed = input.trim();
    if (shouldBlock(trimmed)) { setError("I can help you debate ideas, but I can't provide instructions for harmful or illegal activities."); return; }
    if (trimmed.length > MAX_MESSAGE_LENGTH) { setError("Message too long. Keep it under 2000 characters."); return; }

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "continue", setup, messages: newMessages, validationContent: session.validationContent, persona: activePersona }),
      });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error((err as { error?: string }).error || "Failed to get response."); }
      await streamResponse(response, newMessages);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to get response."); }
    finally { setIsLoading(false); }
  };

  const handleQuickAction = async (actionId: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    setShowQuickActions(false);
    const actionLabel = QUICK_ACTIONS.find(a => a.id === actionId)?.label || actionId;
    const actionMessage: Message = { id: Date.now().toString(), role: "user", content: `[${actionLabel}]`, isQuickAction: true };
    const newMessages = [...messages, actionMessage];
    setMessages(newMessages);
    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "quick", setup, messages, quickAction: actionId, validationContent: session.validationContent, persona: activePersona }),
      });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error((err as { error?: string }).error || "Failed to get response."); }
      await streamResponse(response, newMessages);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to get response."); }
    finally { setIsLoading(false); }
  };

  const handlePersonaSwitch = (personaId: string) => {
    setActivePersona(personaId);
    setShowPersonaPicker(false);
    // Add a system message so user sees the switch
    const switchMsg: Message = { id: Date.now().toString(), role: "user", content: `[Switched to ${PERSONAS.find(p => p.id === personaId)?.name}]`, isQuickAction: true };
    const newMessages = [...messages, switchMsg];
    setMessages(newMessages);
    updateSessionMessages(newMessages);
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadReport = () => {
    const header = `# Debate: ${setup.topic}\n\n**Your case:** ${setup.position}\n${setup.context ? `**Context:** ${setup.context}\n` : ""}\n---\n\n`;
    const body = messages.map((m) => `${m.role === "user" ? "**You:**" : `**${persona.name}:**`}\n${m.content}\n`).join("\n---\n\n");
    const blob = new Blob([header + body], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debate-${(setup.topic || "idea").slice(0, 30).replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNew = () => { clearSession(); router.push("/validate"); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const renderAiMessage = (content: string, id?: string) => (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="flex gap-3 max-w-2xl msg-fade-in group">
      <div className={`shrink-0 w-7 h-7 rounded-full bg-gradient-to-br ${persona.avatarGradient} flex items-center justify-center mt-0.5`}>
        {persona.avatarIcon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] leading-[1.7] text-white/75 markdown-content-dark">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
        {id && (
          <div className="mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => copyMessage(id, content)} className="inline-flex items-center gap-1 text-[11px] text-white/20 hover:text-white/50 transition-colors px-1.5 py-0.5 rounded hover:bg-white/[0.04]">
              {copiedId === id ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></> : <><Copy className="w-3 h-3" /><span>Copy</span></>}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="relative h-screen h-[100dvh] flex flex-col bg-[#08080e]">
      <InteractiveParticles count={30} magneticRadius={150} magneticStrength={0.06} />
      {/* Subtle animated gradient orb */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-indigo-500/[0.04] blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
      </div>
      {/* Header */}
      <header className="shrink-0 border-b border-white/[0.06] bg-[#08080e]/90 backdrop-blur-xl z-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Persona selector */}
            <div className="relative" ref={personaRef}>
              <button
                onClick={() => setShowPersonaPicker(!showPersonaPicker)}
                className={`shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all ${showPersonaPicker ? persona.activeBg : `${persona.bg} hover:border-white/15`}`}
              >
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${persona.avatarGradient} flex items-center justify-center`}>
                  {persona.avatarIcon}
                </div>
                <span className={`text-xs font-semibold ${persona.color} hidden sm:inline`}>{persona.name}</span>
                <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${showPersonaPicker ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {showPersonaPicker && (
                <motion.div initial={{ opacity: 0, y: -5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.15 }} className="absolute top-full left-0 mt-1.5 w-64 rounded-xl bg-[#12121a] border border-white/[0.08] shadow-xl shadow-black/40 overflow-hidden z-30">
                  <div className="p-1.5">
                    {PERSONAS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handlePersonaSwitch(p.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                          activePersona === p.id ? `${p.bg}` : "hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${p.avatarGradient} flex items-center justify-center shrink-0`}>
                          {p.avatarIcon}
                        </div>
                        <div className="min-w-0">
                          <div className={`text-xs font-semibold ${activePersona === p.id ? p.color : "text-white/70"}`}>{p.name}</div>
                          <div className="text-[10px] text-white/30">{p.short}</div>
                        </div>
                        {activePersona === p.id && <Check className={`w-3.5 h-3.5 ${p.color} ml-auto shrink-0`} />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="min-w-0 hidden sm:block">
              <div className="flex items-center gap-2">
                <h1 className="text-[13px] font-medium text-white/50 truncate">{setup.topic}</h1>
                {score !== null && (
                  <span className={`shrink-0 inline-flex items-center text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md border ${getScoreBg(score)} ${getScoreColor(score)}`}>{score}/10</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0 ml-3">
            {setup.template === "validate" && (
              <Link href="/results" className="flex items-center gap-1 px-2 py-1.5 text-[11px] text-white/30 hover:text-white/60 rounded-lg hover:bg-white/[0.04] transition-colors">
                <ArrowLeft className="w-3 h-3" /><span className="hidden sm:inline">Results</span>
              </Link>
            )}
            <ThemeToggle />
            <button onClick={downloadReport} className="p-2 text-white/25 hover:text-white/50 rounded-lg hover:bg-white/[0.04] transition-colors" title="Download transcript"><Download className="w-4 h-4" /></button>
            <button onClick={handleNew} className="p-2 text-white/25 hover:text-white/50 rounded-lg hover:bg-white/[0.04] transition-colors" title="New debate"><RotateCcw className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {messages.map((message) =>
            message.role === "opponent" ? (
              <div key={message.id}>{renderAiMessage(message.content, message.id)}</div>
            ) : (
              <motion.div key={message.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="flex justify-end msg-fade-in">
                <div className={`max-w-[80%] sm:max-w-[70%] ${message.isQuickAction ? "px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium" : "px-4 py-2.5 rounded-2xl rounded-br-md bg-white/[0.07] text-white/85 text-[13px] leading-relaxed"}`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </motion.div>
            )
          )}

          {isLoading && streamingContent && renderAiMessage(streamingContent)}

          {isLoading && !streamingContent && (
            <div className="flex gap-3 msg-fade-in">
              <div className={`shrink-0 w-7 h-7 rounded-full bg-gradient-to-br ${persona.avatarGradient} flex items-center justify-center mt-0.5`}>
                <div className="animate-pulse">{persona.avatarIcon}</div>
              </div>
              <div className="flex items-center gap-2.5 py-1">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-indigo-400/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-indigo-400/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-[11px] text-white/20">{typingPhrase}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="shrink-0 px-4 sm:px-6 pb-2">
          <div className="max-w-2xl mx-auto px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>
        </div>
      )}

      {input.trim() && hasSensitiveTopic(input) && !shouldBlock(input) && (
        <div className="shrink-0 px-4 sm:px-6 pb-2">
          <div className="max-w-2xl mx-auto px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            Sensitive topic detected. Debate allowed for academic discussion.
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[#08080e] safe-area-bottom">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-3 pb-4">
          {showQuickActions && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {QUICK_ACTIONS.map((action) => (
                <motion.button key={action.id} whileHover={{ scale: 1.02 }} onClick={() => handleQuickAction(action.id)} disabled={isLoading}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-colors disabled:opacity-25 disabled:cursor-not-allowed ${action.color}`}>
                  {action.icon}{action.label}
                </motion.button>
              ))}
            </div>
          )}

          <div className="relative">
            <textarea ref={inputRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
              placeholder="Defend your position..." rows={1} maxLength={MAX_MESSAGE_LENGTH}
              className="w-full pl-4 pr-12 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/90 placeholder:text-white/20 focus:outline-none focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none text-[13px] leading-relaxed"
              style={{ minHeight: "46px", maxHeight: "120px" }}
            />
            <button onClick={sendMessage} disabled={isLoading || !input.trim()}
              className="absolute right-2 bottom-2 p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-15 disabled:cursor-not-allowed transition-all">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          <div className="mt-1.5 text-center">
            {input.length > 0 ? (
              <span className={`text-[10px] tabular-nums ${input.length > MAX_MESSAGE_LENGTH - 100 ? "text-amber-400/50" : "text-white/15"}`}>{input.length}/{MAX_MESSAGE_LENGTH}</span>
            ) : (
              <span className="text-[10px] text-white/12">Enter to send &middot; Shift+Enter for new line</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
