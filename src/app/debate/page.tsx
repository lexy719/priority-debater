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
  Wallet,
  Compass,
} from "lucide-react";
import { motion } from "framer-motion";
import { loadSessionWithStatus, loadSession, saveSession, clearSession } from "@/lib/session";
import { hasSensitiveTopic, validateDebateUserMessage } from "@/lib/contentModeration";
import { normalizeScoreFromDenominator, tierColorClasses } from "@/lib/scoring-scale";
import { InteractiveParticles } from "@/components/ui/animated-background";
import { cn } from "@/lib/utils";
import { appendSseLines } from "@/lib/sse-lines";
import type { Message, ValidationSession } from "@/lib/types";

const INTERVIEW_ACTIVE_KEY = "priority-debater-active-interview";

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

/** Five separate validation interviews — same order as before (buyer → capital → execution → experience → attack). */
const INTERVIEW_DEFS = [
  { round: 1, personaId: "customer" as const, name: "Buyer reality", tagline: "Pain, urgency, willingness to pay" },
  { round: 2, personaId: "investor" as const, name: "Investor lens", tagline: "Market size, returns, defensibility" },
  { round: 3, personaId: "operator" as const, name: "Execution", tagline: "Build, ship, distribution" },
  { round: 4, personaId: "mentor" as const, name: "Operator wisdom", tagline: "What breaks first — pattern match" },
  { round: 5, personaId: "adversary" as const, name: "Stress test", tagline: "Invert the thesis — kill shots" },
];

function migrateLegacyFlatChat(flat: Message[]): Partial<Record<string, Message[]>> {
  const buckets: Partial<Record<string, Message[]>> = {};
  let pid: string = INTERVIEW_DEFS[0].personaId;
  for (const m of flat) {
    if (m.role === "user" && m.content.match(/^\[Round (\d+)/)) {
      const n = parseInt(m.content.match(/^\[Round (\d+)/)![1], 10);
      pid = INTERVIEW_DEFS[Math.min(Math.max(n, 1), 5) - 1].personaId;
      continue;
    }
    if (m.role === "user" && m.content.startsWith("[Switched to ")) {
      const raw = m.content.replace(/^\[Switched to |\]$/g, "").trim();
      const p = PERSONAS.find((x) => x.name === raw);
      if (p) pid = p.id;
      continue;
    }
    if (!buckets[pid]) buckets[pid] = [];
    buckets[pid]!.push(m);
  }
  return buckets;
}

function saveSessionWithInterviews(s: ValidationSession, chats: Partial<Record<string, Message[]>>): void {
  const first = s.messages[0];
  if (first && first.role === "opponent" && first.content.length > 400) {
    saveSession({ ...s, messages: [first], interviewChats: chats });
  } else {
    saveSession({ ...s, interviewChats: chats });
  }
}

const ROUND_MARKER = /^\[Round (\d+)/;

function inferPersonaIdForOpponent(messages: Message[], idx: number, fallbackPersona: string): string {
  const m = messages[idx];
  if (m.role !== "opponent") return fallbackPersona;
  if (m.personaId) return m.personaId;
  let persona: string = fallbackPersona;
  for (let i = 0; i < idx; i++) {
    const msg = messages[i];
    if (msg.role !== "user" || !msg.content) continue;
    if (msg.content.startsWith("[Switched to ")) {
      const raw = msg.content.replace(/^\[Switched to |\]$/g, "").trim();
      const p = PERSONAS.find((x) => x.name === raw);
      if (p) persona = p.id;
      continue;
    }
    const rm = msg.content.match(ROUND_MARKER);
    if (rm) {
      const n = parseInt(rm[1], 10);
      const cfg = INTERVIEW_DEFS[Math.min(Math.max(n, 1), INTERVIEW_DEFS.length) - 1];
      if (cfg) persona = cfg.personaId;
    }
  }
  return persona;
}

/** Quick prompts differ per validation interview — each row matches API allowlist in debate/route.ts */
const QUICK_ACTIONS_BY_PERSONA: Record<string, { id: string; label: string; icon: React.ReactNode; color: string }[]> = {
  customer: [
    { id: "discuss", label: "Explore with me", icon: <MessageSquare className="w-3.5 h-3.5" />, color: "text-sky-400 hover:bg-sky-500/15 border-sky-500/20" },
    { id: "buyer-wtp", label: "Willingness to pay", icon: <Wallet className="w-3.5 h-3.5" />, color: "text-cyan-400 hover:bg-cyan-500/15 border-cyan-500/20" },
    { id: "blind-spots", label: "What am I missing?", icon: <Eye className="w-3.5 h-3.5" />, color: "text-amber-400 hover:bg-amber-500/15 border-amber-500/20" },
  ],
  investor: [
    { id: "rate", label: "Score the thesis", icon: <BarChart3 className="w-3.5 h-3.5" />, color: "text-emerald-400 hover:bg-emerald-500/15 border-emerald-500/20" },
    { id: "framework", label: "Decision framework", icon: <Sparkles className="w-3.5 h-3.5" />, color: "text-teal-400 hover:bg-teal-500/15 border-teal-500/20" },
    { id: "blind-spots", label: "Diligence gaps", icon: <Eye className="w-3.5 h-3.5" />, color: "text-amber-400 hover:bg-amber-500/15 border-amber-500/20" },
  ],
  operator: [
    { id: "futureproof", label: "Futureproof", icon: <Compass className="w-3.5 h-3.5" />, color: "text-orange-400 hover:bg-orange-500/15 border-orange-500/20" },
    { id: "operator-ship", label: "Ship it / break it", icon: <Wrench className="w-3.5 h-3.5" />, color: "text-violet-400 hover:bg-violet-500/15 border-violet-500/20" },
    { id: "blind-spots", label: "Execution blind spots", icon: <Eye className="w-3.5 h-3.5" />, color: "text-amber-400 hover:bg-amber-500/15 border-amber-500/20" },
  ],
  mentor: [
    { id: "steelman", label: "Steelman my plan", icon: <Shield className="w-3.5 h-3.5" />, color: "text-emerald-400 hover:bg-emerald-500/15 border-emerald-500/20" },
    { id: "framework", label: "Framework for me", icon: <Sparkles className="w-3.5 h-3.5" />, color: "text-violet-400 hover:bg-violet-500/15 border-violet-500/20" },
    { id: "summary", label: "Coach's summary", icon: <MessageSquare className="w-3.5 h-3.5" />, color: "text-sky-400 hover:bg-sky-500/15 border-sky-500/20" },
  ],
  adversary: [
    { id: "devils-advocate", label: "Invert it", icon: <Swords className="w-3.5 h-3.5" />, color: "text-red-400 hover:bg-red-500/15 border-red-500/20" },
    { id: "blind-spots", label: "Kill shots", icon: <Eye className="w-3.5 h-3.5" />, color: "text-amber-400 hover:bg-amber-500/15 border-amber-500/20" },
    { id: "rate", label: "How weak is it?", icon: <BarChart3 className="w-3.5 h-3.5" />, color: "text-rose-400 hover:bg-rose-500/15 border-rose-500/20" },
  ],
};

export default function DebatePage() {
  const router = useRouter();
  const [session, setSession] = useState<ValidationSession | null>(null);
  /** Isolated thread per persona — major feature: five validation interviews, not one chat. */
  const [interviewChats, setInterviewChats] = useState<Partial<Record<string, Message[]>>>({});
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [typingPhrase, setTypingPhrase] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activePersona, setActivePersona] = useState<string>(INTERVIEW_DEFS[0].personaId);
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const personaRef = useRef<HTMLDivElement>(null);

  const persona = PERSONAS.find((p) => p.id === activePersona) || PERSONAS[0];
  const messages = interviewChats[activePersona] ?? [];
  const personaQuickActions = QUICK_ACTIONS_BY_PERSONA[activePersona] ?? QUICK_ACTIONS_BY_PERSONA[INTERVIEW_DEFS[0].personaId];

  const persistThread = useCallback((personaId: string, chat: Message[]) => {
    setInterviewChats((prev) => {
      const next = { ...prev, [personaId]: chat };
      const s = loadSession();
      if (s) saveSessionWithInterviews(s, next);
      return next;
    });
  }, []);

  const streamRoundOpener = async (s: ValidationSession, personaId: string, chatPrefix: Message[]) => {
    setIsLoading(true);
    const p = PERSONAS.find((pp) => pp.id === personaId) || PERSONAS[0];
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
      let sseBuf = "";
      let streamDone = false;
      setStreamingContent("");
      const handleLine = (line: string) => {
        if (!line.startsWith("data: ")) return;
        const data = line.slice(6);
        if (data === "[DONE]") {
          streamDone = true;
          return;
        }
        try {
          const parsed = JSON.parse(data) as { content?: string };
          if (parsed.content) {
            accumulated += parsed.content;
            setStreamingContent(accumulated);
          }
        } catch {
          /* skip */
        }
      };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const { buffer, lines } = appendSseLines(sseBuf, chunk);
        sseBuf = buffer;
        for (const line of lines) {
          handleLine(line);
          if (streamDone) break;
        }
        if (streamDone) break;
      }
      if (sseBuf.replace(/\r$/, "").trim()) handleLine(sseBuf.replace(/\r$/, ""));
      setStreamingContent("");
      const openerMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "opponent",
        content: accumulated,
        personaId,
      };
      persistThread(personaId, [...chatPrefix, openerMsg]);
    } catch {
      setError("Failed to start debate. Try sending a message.");
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    const result = loadSessionWithStatus();
    if (result.status === "expired") {
      alert("Your session has expired (24h limit). Please start a new validation.");
      router.replace("/journey");
      return;
    }
    if (result.status === "none") {
      router.replace("/journey");
      return;
    }
    const s = result.session;
    setSession(s);
    const isValidationReport =
      s.messages.length > 0 && s.messages[0].role === "opponent" && s.messages[0].content.length > 500;
    const legacyFlat = isValidationReport ? s.messages.slice(1) : [];

    let chats: Partial<Record<string, Message[]>> = { ...(s.interviewChats || {}) };
    const hasInterviewData = Object.keys(chats).some((k) => (chats[k]?.length ?? 0) > 0);
    if (!hasInterviewData && legacyFlat.length > 0) {
      chats = { ...chats, ...migrateLegacyFlatChat(legacyFlat) };
      saveSessionWithInterviews(s, chats);
    }
    setInterviewChats(chats);

    const stored = sessionStorage.getItem(INTERVIEW_ACTIVE_KEY);
    const initial =
      stored && PERSONAS.some((p) => p.id === stored) ? stored : INTERVIEW_DEFS[0].personaId;
    setActivePersona(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, [router]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    if (isLoading) {
      setTypingPhrase(persona.typingPhrases[Math.floor(Math.random() * persona.typingPhrases.length)]);
    }
  }, [isLoading, persona]);

  const selectInterview = (personaId: string) => {
    setActivePersona(personaId);
    setShowPersonaPicker(false);
    sessionStorage.setItem(INTERVIEW_ACTIVE_KEY, personaId);
  };

  const startInterview = async () => {
    if (!session || isLoading) return;
    const thread = interviewChats[activePersona] ?? [];
    if (thread.length > 0) return;
    await streamRoundOpener(session, activePersona, []);
  };

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center bg-[#08080e]"><Loader2 className="w-8 h-8 animate-spin text-indigo-500/50" /></div>;
  }

  const { setup } = session;

  const getArgumentScore = (): number | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === "opponent") {
        const m100 =
          msg.content.match(/(?:Argument Strength|Score)[:\s]*\[?(\d+)\]?\/100/i) ||
          msg.content.match(/(\d+)\/100(?!\d)/);
        if (m100) {
          const n = parseInt(m100[1], 10);
          if (Number.isFinite(n)) return Math.max(0, Math.min(100, n));
        }
        const m10 =
          msg.content.match(/(?:Argument Strength|Score)[:\s]*\[?(\d+)\]?\/10\b/i) ||
          msg.content.match(/(\d+)\/10\b/);
        if (m10) {
          const n = parseInt(m10[1], 10);
          if (Number.isFinite(n)) return normalizeScoreFromDenominator(n, 10);
        }
      }
    }
    return null;
  };
  const score = getArgumentScore();
  const getScoreColor = (s: number) => tierColorClasses(s).text;
  const getScoreBg = (s: number) =>
    s >= 70
      ? "bg-emerald-500/10 border-emerald-500/25"
      : s >= 50
        ? "bg-amber-500/10 border-amber-500/25"
        : "bg-red-500/10 border-red-500/25";

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
  };

  const streamResponse = async (response: Response, newMessages: Message[], personaId: string) => {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader");
    const decoder = new TextDecoder();
    let accumulated = "";
    let sseBuf = "";
    let streamDone = false;
    setStreamingContent("");
    const handleLine = (line: string) => {
      if (!line.startsWith("data: ")) return;
      const data = line.slice(6);
      if (data === "[DONE]") {
        streamDone = true;
        return;
      }
      try {
        const parsed = JSON.parse(data) as { content?: string };
        if (parsed.content) {
          accumulated += parsed.content;
          setStreamingContent(accumulated);
        }
      } catch {
        /* skip */
      }
    };
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const { buffer, lines } = appendSseLines(sseBuf, chunk);
      sseBuf = buffer;
      for (const line of lines) {
        handleLine(line);
        if (streamDone) break;
      }
      if (streamDone) break;
    }
    if (sseBuf.replace(/\r$/, "").trim()) handleLine(sseBuf.replace(/\r$/, ""));
    setStreamingContent("");
    const opponentMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "opponent",
      content: accumulated,
      personaId,
    };
    const updated = [...newMessages, opponentMessage];
    persistThread(personaId, updated);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const trimmed = input.trim();
    const msgErr = validateDebateUserMessage(trimmed);
    if (msgErr) {
      setError(msgErr);
      return;
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) { setError("Message too long. Keep it under 2000 characters."); return; }

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: trimmed };
    const newMessages = [...messages, userMessage];
    persistThread(activePersona, newMessages);
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
      await streamResponse(response, newMessages, activePersona);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to get response."); }
    finally { setIsLoading(false); }
  };

  const handleQuickAction = async (actionId: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    const actionLabel = personaQuickActions.find((a) => a.id === actionId)?.label || actionId;
    const actionMessage: Message = { id: Date.now().toString(), role: "user", content: `[${actionLabel}]`, isQuickAction: true };
    const newMessages = [...messages, actionMessage];
    persistThread(activePersona, newMessages);
    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "quick",
          setup,
          messages: newMessages,
          quickAction: actionId,
          validationContent: session.validationContent,
          persona: activePersona,
        }),
      });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error((err as { error?: string }).error || "Failed to get response."); }
      await streamResponse(response, newMessages, activePersona);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to get response."); }
    finally { setIsLoading(false); }
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadReport = () => {
    const header = `# Validation interviews: ${setup.topic}\n\n**Your case:** ${setup.position}\n${setup.context ? `**Context:** ${setup.context}\n` : ""}\n---\n\n`;
    const parts: string[] = [];
    for (const def of INTERVIEW_DEFS) {
      const thread = interviewChats[def.personaId] ?? [];
      if (thread.length === 0) continue;
      const p = PERSONAS.find((x) => x.id === def.personaId);
      const label = p ? `${p.name} — ${def.name}` : def.name;
      const body = thread
        .map((m) => `${m.role === "user" ? "**You:**" : `**${p?.name ?? "Assistant"}:**`}\n${m.content}`)
        .join("\n\n---\n\n");
      parts.push(`## ${label}\n\n${body}`);
    }
    const blob = new Blob([header + (parts.length ? parts.join("\n\n---\n\n") : "_No interviews exported yet._")], {
      type: "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `validation-interviews-${(setup.topic || "idea").slice(0, 30).replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNew = () => {
    clearSession();
    router.push("/journey");
  };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const renderAiMessage = (content: string, id?: string, opponentPersonaId?: string) => {
    const p = PERSONAS.find((x) => x.id === (opponentPersonaId || activePersona)) || PERSONAS[0];
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="flex gap-3 max-w-2xl msg-fade-in group"
      >
        <div
          className={`shrink-0 w-7 h-7 rounded-full bg-linear-to-br ${p.avatarGradient} flex items-center justify-center mt-0.5 ring-1 ring-white/5`}
        >
          {p.avatarIcon}
        </div>
        <div className="min-w-0 flex-1">
          {!id && <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/35">{p.name}</p>}
          <div className="text-[13px] leading-[1.7] text-white/75 markdown-content-dark">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
          {id && (
            <div className="mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => copyMessage(id, content)}
                className="inline-flex items-center gap-1 text-[11px] text-white/20 hover:text-white/50 transition-colors px-1.5 py-0.5 rounded hover:bg-white/4"
              >
                {copiedId === id ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="relative flex h-[100dvh] flex-col bg-[#08080e]">
      <InteractiveParticles count={30} magneticRadius={150} magneticStrength={0.06} />
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-indigo-500/4 blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
      </div>
      <header className="z-20 shrink-0 border-b border-white/6 bg-[#08080e]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-13 max-w-[min(56rem,100%)] items-center justify-between px-4 sm:px-6 lg:max-w-none">
          <div className="flex items-center gap-3 min-w-0">
            {/* Persona selector */}
            <div className="relative" ref={personaRef}>
              <button
                onClick={() => setShowPersonaPicker(!showPersonaPicker)}
                className={`shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all ${showPersonaPicker ? persona.activeBg : `${persona.bg} hover:border-white/15`}`}
              >
                <div className={`w-6 h-6 rounded-full bg-linear-to-br ${persona.avatarGradient} flex items-center justify-center`}>
                  {persona.avatarIcon}
                </div>
                <span className={`text-xs font-semibold ${persona.color} hidden sm:inline`}>{persona.name}</span>
                <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${showPersonaPicker ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {showPersonaPicker && (
                <motion.div initial={{ opacity: 0, y: -5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.15 }} className="absolute top-full left-0 mt-1.5 w-64 rounded-xl bg-[#12121a] border border-white/8 shadow-xl shadow-black/40 overflow-hidden z-30">
                  <div className="p-1.5">
                    {PERSONAS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selectInterview(p.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                          activePersona === p.id ? `${p.bg}` : "hover:bg-white/4"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full bg-linear-to-br ${p.avatarGradient} flex items-center justify-center shrink-0`}>
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-400/80">Validation interviews</p>
              <div className="flex items-center gap-2">
                <h1 className="text-[13px] font-medium text-white/50 truncate">{setup.topic}</h1>
                {score !== null && (
                  <span className={`shrink-0 inline-flex items-center text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md border ${getScoreBg(score)} ${getScoreColor(score)}`}>{score}/100</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0 ml-3">
            {setup.template === "validate" && (
              <Link href="/results" className="flex items-center gap-1 px-2 py-1.5 text-[11px] text-white/30 hover:text-white/60 rounded-lg hover:bg-white/4 transition-colors">
                <ArrowLeft className="w-3 h-3" /><span className="hidden sm:inline">Results</span>
              </Link>
            )}
            <button onClick={downloadReport} className="p-2 text-white/25 hover:text-white/50 rounded-lg hover:bg-white/4 transition-colors" title="Download transcript"><Download className="w-4 h-4" /></button>
            <button onClick={handleNew} className="p-2 text-white/25 hover:text-white/50 rounded-lg hover:bg-white/4 transition-colors" title="New validation"><RotateCcw className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden w-[min(19rem,92vw)] shrink-0 overflow-y-auto border-b border-white/6 bg-[#06060a]/95 lg:flex lg:flex-col lg:border-b-0 lg:border-r lg:border-white/6">
          <div className="space-y-5 p-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">Five interviews</p>
                <span className="text-[11px] tabular-nums text-white/45">
                  {INTERVIEW_DEFS.filter((d) => (interviewChats[d.personaId]?.length ?? 0) > 0).length} / {INTERVIEW_DEFS.length}{" "}
                  started
                </span>
              </div>
              <ol className="space-y-1.5">
                {INTERVIEW_DEFS.map((r) => {
                  const p = PERSONAS.find((x) => x.id === r.personaId);
                  const active = r.personaId === activePersona;
                  const started = (interviewChats[r.personaId]?.length ?? 0) > 0;
                  return (
                    <li key={r.round}>
                      <button
                        type="button"
                        onClick={() => selectInterview(r.personaId)}
                        className={cn(
                          "w-full rounded-xl border px-2.5 py-2 text-left transition-colors",
                          active && "border-indigo-500/40 bg-indigo-500/10 ring-1 ring-indigo-500/15",
                          !active && started && "border-emerald-500/20 bg-white/[0.02]",
                          !active && !started && "border-white/[0.06] bg-white/[0.02] hover:border-white/10",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-white/35">
                            Interview {r.round}
                          </span>
                          {started ? (
                            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
                          ) : null}
                        </div>
                        <p className="text-[11px] font-medium text-white/85">{p?.name ?? r.name}</p>
                        <p className="mt-0.5 text-[10px] leading-snug text-white/38">{r.tagline}</p>
                      </button>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-3 text-[11px] leading-relaxed text-white/38">
                Each persona is a separate thread. Finish one, then switch — no single transcript mixing voices.
              </p>
              <Link
                href="/results?step=decision"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-medium text-white/55 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white/75"
              >
                Back to report &amp; Go/No-Go
              </Link>
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="z-10 shrink-0 border-b border-white/6 bg-[#08080e]/95 lg:hidden">
            <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">Validation interviews</p>
                <span className="text-[11px] tabular-nums text-white/45">
                  {INTERVIEW_DEFS.filter((d) => (interviewChats[d.personaId]?.length ?? 0) > 0).length}/{INTERVIEW_DEFS.length}
                </span>
              </div>
              <div className="flex gap-1">
                {INTERVIEW_DEFS.map((r) => {
                  const started = (interviewChats[r.personaId]?.length ?? 0) > 0;
                  const active = r.personaId === activePersona;
                  return (
                    <button
                      key={r.round}
                      type="button"
                      onClick={() => selectInterview(r.personaId)}
                      className={cn(
                        "h-2 flex-1 rounded-full transition-colors",
                        active ? "bg-indigo-500/90" : started ? "bg-emerald-500/50" : "bg-white/10",
                      )}
                      title={`${r.name}: ${r.tagline}`}
                    />
                  );
                })}
              </div>
              <p className="mt-2.5 text-[12px] text-white/60">
                <span className="font-semibold text-indigo-300/95">
                  {PERSONAS.find((x) => x.id === activePersona)?.name}
                </span>
                <span className="text-white/30"> · </span>
                {INTERVIEW_DEFS.find((d) => d.personaId === activePersona)?.tagline}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6">
          {messages.length === 0 && !isLoading && !streamingContent && (
            <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-12 text-center">
              <p className="text-sm font-medium text-white/80">{persona.name}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-white/45">
                {INTERVIEW_DEFS.find((d) => d.personaId === activePersona)?.tagline}. This is its own thread — your other
                interviews stay separate.
              </p>
              <button
                type="button"
                onClick={() => void startInterview()}
                disabled={isLoading}
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-40"
              >
                Start this interview
              </button>
            </div>
          )}
          {messages.map((message, msgIdx) => {
            if (message.role === "user" && message.content.match(/^\[Round \d+/)) {
              const label = message.content.replace(/^\[|\]$/g, "").trim();
              const [head, ...rest] = label.split(":");
              const tail = rest.join(":").trim();
              return (
                <div key={message.id} className="flex justify-center py-1">
                  <div className="max-w-md rounded-2xl border border-indigo-500/20 bg-indigo-500/8 px-4 py-2.5 text-center shadow-sm shadow-black/20">
                    <p className="text-[11px] font-semibold text-indigo-200/95">{head}</p>
                    {tail ? <p className="mt-0.5 text-[10px] leading-snug text-white/40">{tail}</p> : null}
                  </div>
                </div>
              );
            }
            if (message.role === "opponent") {
              const pid = inferPersonaIdForOpponent(messages, msgIdx, activePersona);
              return <div key={message.id}>{renderAiMessage(message.content, message.id, pid)}</div>;
            }
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex justify-end msg-fade-in"
              >
                <div
                  className={`max-w-[80%] sm:max-w-[70%] ${
                    message.isQuickAction
                      ? "px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium"
                      : "px-4 py-2.5 rounded-2xl rounded-br-md bg-white/7 text-white/85 text-[13px] leading-relaxed"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </motion.div>
            );
          })}

          {isLoading && streamingContent && renderAiMessage(streamingContent, undefined, activePersona)}

          {isLoading && !streamingContent && (
            <div className="flex gap-3 msg-fade-in">
              <div className={`shrink-0 w-7 h-7 rounded-full bg-linear-to-br ${persona.avatarGradient} flex items-center justify-center mt-0.5`}>
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

      {input.trim() && hasSensitiveTopic(input) && validateDebateUserMessage(input.trim()) === null && (
        <div className="shrink-0 px-4 sm:px-6 pb-2">
          <div className="max-w-2xl mx-auto px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            Sensitive topic detected. Interview allowed for academic discussion.
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="shrink-0 border-t border-white/6 bg-[#08080e] safe-area-bottom">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-3 pb-4">
          {messages.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {personaQuickActions.map((action) => (
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
              className="w-full pl-4 pr-12 py-3 rounded-xl bg-white/4 border border-white/8 text-white/90 placeholder:text-white/20 focus:outline-none focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none text-[13px] leading-relaxed"
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
      </div>
    </div>
  );
}
