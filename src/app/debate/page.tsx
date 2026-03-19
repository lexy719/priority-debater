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
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react";
import { loadSession, clearSession, updateSessionMessages } from "@/lib/session";
import { shouldBlock, hasSensitiveTopic } from "@/lib/contentModeration";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Message, ValidationSession } from "@/lib/types";

const MAX_MESSAGE_LENGTH = 2000;

const TYPING_PHRASES = [
  "Finding the flaw...",
  "Stress-testing your logic...",
  "Checking your assumptions...",
  "Building the counter-argument...",
  "Analyzing weak points...",
  "Applying the inversion test...",
  "Running the pre-mortem...",
  "Examining your blind spots...",
];

const QUICK_ACTIONS = [
  { id: "steelman", label: "Steelman", icon: <Shield className="w-3.5 h-3.5" />, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20" },
  { id: "devils-advocate", label: "Devil's Advocate", icon: <Swords className="w-3.5 h-3.5" />, color: "text-red-400 bg-red-500/10 border-red-500/20 hover:bg-red-500/20" },
  { id: "blind-spots", label: "Blind Spots", icon: <Eye className="w-3.5 h-3.5" />, color: "text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20" },
  { id: "rate", label: "Rate", icon: <BarChart3 className="w-3.5 h-3.5" />, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20" },
  { id: "framework", label: "Framework", icon: <Sparkles className="w-3.5 h-3.5" />, color: "text-violet-400 bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/20" },
  { id: "summary", label: "Summary", icon: <MessageSquare className="w-3.5 h-3.5" />, color: "text-sky-400 bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20" },
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/validate");
      return;
    }
    setSession(s);
    setMessages(s.messages);
  }, [router]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    if (isLoading) {
      setTypingPhrase(TYPING_PHRASES[Math.floor(Math.random() * TYPING_PHRASES.length)]);
    }
  }, [isLoading]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08080e]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500/50" />
      </div>
    );
  }

  const { setup } = session;

  const getArgumentScore = (): number | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === "opponent") {
        const match =
          msg.content.match(/(?:Argument Strength|Score)[:\s]*\[?(\d+)\]?\/10/i) ||
          msg.content.match(/(\d+)\/10/);
        if (match) return parseInt(match[1]);
      }
    }
    return null;
  };

  const score = getArgumentScore();

  const getScoreColor = (s: number) => {
    if (s >= 7) return "text-emerald-400";
    if (s >= 5) return "text-amber-400";
    return "text-red-400";
  };

  const getScoreBg = (s: number) => {
    if (s >= 7) return "bg-emerald-500/15 border-emerald-500/30";
    if (s >= 5) return "bg-amber-500/15 border-amber-500/30";
    return "bg-red-500/15 border-red-500/30";
  };

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
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              accumulated += parsed.content;
              setStreamingContent(accumulated);
            }
          } catch {
            // skip
          }
        }
      }
    }

    setStreamingContent("");
    const opponentMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "opponent",
      content: accumulated,
    };
    const updated = [...newMessages, opponentMessage];
    setMessages(updated);
    updateSessionMessages(updated);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const trimmed = input.trim();
    if (shouldBlock(trimmed)) {
      setError("I can help you debate ideas, but I can't provide instructions for harmful or illegal activities.");
      return;
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      setError("Message too long. Keep it under 2000 characters.");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
    };
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
        body: JSON.stringify({
          action: "continue",
          setup,
          messages: newMessages,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to get response.");
      }

      await streamResponse(response, newMessages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get response.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (actionId: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    setShowQuickActions(false);

    const actionLabel = QUICK_ACTIONS.find(a => a.id === actionId)?.label || actionId;
    const actionMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `[${actionLabel}]`,
      isQuickAction: true,
    };
    const newMessages = [...messages, actionMessage];
    setMessages(newMessages);

    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "quick",
          setup,
          messages,
          quickAction: actionId,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to get response.");
      }

      await streamResponse(response, newMessages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get response.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadReport = () => {
    const header = `# Debate: ${setup.topic}\n\n**Your case:** ${setup.position}\n${setup.context ? `**Context:** ${setup.context}\n` : ""}\n---\n\n`;
    const body = messages
      .map((m) => {
        const role = m.role === "user" ? "**You:**" : "**The Adversary:**";
        return `${role}\n${m.content}\n`;
      })
      .join("\n---\n\n");
    const blob = new Blob([header + body], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debate-${(setup.topic || "idea").slice(0, 30).replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNew = () => {
    clearSession();
    router.push("/validate");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-[#08080e]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/[0.06] bg-[#08080e]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white">The Adversary</p>
                {score !== null && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${getScoreBg(score)} ${getScoreColor(score)}`}
                  >
                    {score}/10
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/30 truncate max-w-[200px] sm:max-w-none">{setup.topic}</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            {setup.template === "validate" && (
              <Link
                href="/results"
                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs text-white/30 hover:text-white/60 rounded-lg hover:bg-white/[0.04] transition-all"
              >
                <ArrowLeft className="w-3 h-3" />
                <span className="hidden sm:inline">Results</span>
              </Link>
            )}
            <ThemeToggle />
            <button
              onClick={downloadReport}
              className="shrink-0 p-2 text-white/25 hover:text-white/60 rounded-lg hover:bg-white/[0.04] transition-all"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleNew}
              className="shrink-0 p-2 text-white/25 hover:text-white/60 rounded-lg hover:bg-white/[0.04] transition-all"
              title="New idea"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`group flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""} msg-fade-in`}
            >
              {/* Avatar */}
              <div
                className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                  message.role === "user"
                    ? "bg-white/[0.08]"
                    : "bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/15"
                }`}
              >
                {message.role === "user" ? (
                  <span className="text-[10px] font-bold text-white/50">You</span>
                ) : (
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                )}
              </div>

              {/* Message bubble */}
              <div
                className={`flex-1 max-w-[85%] sm:max-w-[80%] ${message.role === "user" ? "flex flex-col items-end" : ""}`}
              >
                {message.role === "opponent" && (
                  <div className="flex items-center gap-2 mb-1.5 ml-1">
                    <span className="text-[11px] font-medium text-white/25">The Adversary</span>
                    <button
                      onClick={() => copyMessage(message.id, message.content)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/[0.06]"
                      title="Copy"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-white/20" />
                      )}
                    </button>
                  </div>
                )}
                <div
                  className={`inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    message.role === "user"
                      ? message.isQuickAction
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-tr-md text-xs font-medium px-3 py-2"
                        : "bg-white/[0.08] text-white/90 rounded-tr-md"
                      : "bg-white/[0.03] text-white/70 border border-white/[0.06] rounded-tl-md"
                  }`}
                >
                  {message.role === "opponent" ? (
                    <div className="markdown-content-dark">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {isLoading && streamingContent && (
            <div className="flex gap-3 msg-fade-in">
              <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/15 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="flex-1 max-w-[85%] sm:max-w-[80%]">
                <span className="text-[11px] font-medium text-white/25 mb-1.5 ml-1 block">The Adversary</span>
                <div className="inline-block px-4 py-3 rounded-2xl rounded-tl-md bg-white/[0.03] border border-white/[0.06] text-white/70 text-sm leading-relaxed">
                  <div className="markdown-content-dark">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {isLoading && !streamingContent && (
            <div className="flex gap-3 msg-fade-in">
              <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/15 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-white/25 mb-1.5 ml-1 block">The Adversary</span>
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl rounded-tl-md bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs text-white/25 italic">{typingPhrase}</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="shrink-0 px-4 sm:px-6 pb-2">
          <div className="max-w-3xl mx-auto p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Sensitive topic warning */}
      {input.trim() && hasSensitiveTopic(input) && !shouldBlock(input) && (
        <div className="shrink-0 px-4 sm:px-6 pb-2">
          <div className="max-w-3xl mx-auto p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            Sensitive topic detected. Debate allowed for academic discussion. Operational advice will be blocked.
          </div>
        </div>
      )}

      {/* Quick actions */}
      {showQuickActions && (
        <div className="shrink-0 border-t border-white/[0.04] bg-[#08080e]/50 px-3 sm:px-6 py-2.5">
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.id)}
                  disabled={isLoading}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${action.color}`}
                >
                  {action.icon}
                  <span className="text-[10px] font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[#0a0a12] p-3 sm:p-4 safe-area-bottom">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center mb-2">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              disabled={isLoading}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-medium text-white/20 hover:text-white/40 hover:bg-white/[0.04] transition-all disabled:opacity-30"
            >
              {showQuickActions ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              Quick actions
            </button>
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Defend your position..."
                rows={1}
                maxLength={MAX_MESSAGE_LENGTH}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.06] transition-all resize-none text-sm"
                style={{ minHeight: "48px", maxHeight: "120px" }}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 bottom-2 p-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-white/15 mt-2">
            {input.length > 0 ? (
              <span className={input.length > MAX_MESSAGE_LENGTH - 100 ? "text-amber-400/60" : ""}>
                {input.length}/{MAX_MESSAGE_LENGTH}
              </span>
            ) : (
              "Enter to send · Shift+Enter for new line"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
