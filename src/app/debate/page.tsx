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
  Clipboard,
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
} from "lucide-react";
import { loadSession, clearSession, updateSessionMessages } from "@/lib/session";
import { shouldBlock, hasSensitiveTopic } from "@/lib/contentModeration";
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
  { id: "steelman", label: "Steelman", icon: <Shield className="w-3.5 h-3.5" />, desc: "Best version of your argument" },
  { id: "devils-advocate", label: "Devil's Advocate", icon: <Swords className="w-3.5 h-3.5" />, desc: "Strongest counter-argument" },
  { id: "blind-spots", label: "Blind Spots", icon: <Eye className="w-3.5 h-3.5" />, desc: "What you can't see" },
  { id: "rate", label: "Rate", icon: <BarChart3 className="w-3.5 h-3.5" />, desc: "Score your argument" },
  { id: "framework", label: "Framework", icon: <Sparkles className="w-3.5 h-3.5" />, desc: "Decision framework" },
  { id: "summary", label: "Summary", icon: <MessageSquare className="w-3.5 h-3.5" />, desc: "Debate scorecard" },
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
  const [exportCopied, setExportCopied] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
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
    if (s <= 3) return "text-red-500";
    if (s <= 5) return "text-amber-500";
    if (s <= 7) return "text-yellow-500";
    return "text-emerald-500";
  };

  const getScoreBg = (s: number) => {
    if (s <= 3) return "bg-red-50 border-red-200";
    if (s <= 5) return "bg-amber-50 border-amber-200";
    if (s <= 7) return "bg-yellow-50 border-yellow-200";
    return "bg-emerald-50 border-emerald-200";
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

    // Add a system-like user message showing which action was triggered
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

  const exportDebate = () => {
    const header = `# Debate: ${setup.topic}\n\n**Your case:** ${setup.position}\n${setup.context ? `**Context:** ${setup.context}\n` : ""}\n---\n\n`;
    const body = messages
      .map((m) => {
        const role = m.role === "user" ? "**You:**" : "**The Adversary:**";
        return `${role}\n${m.content}\n`;
      })
      .join("\n---\n\n");
    navigator.clipboard.writeText(header + body);
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2000);
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
    <div className="h-screen h-[100dvh] flex flex-col bg-white">
      {/* Header — compact on mobile */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900 truncate">The Adversary</p>
                {score !== null && (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-full border ${getScoreBg(score)} ${getScoreColor(score)}`}
                  >
                    {score}/10
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate hidden sm:block">{setup.topic}</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            {setup.template === "validate" && (
              <Link
                href="/results"
                className="flex-shrink-0 p-2 text-xs font-medium text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
                title="Back to results"
              >
                <span className="hidden sm:inline">← Results</span>
                <span className="sm:hidden text-sm">←</span>
              </Link>
            )}
            <button
              onClick={downloadReport}
              className="flex-shrink-0 p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={exportDebate}
              className="flex-shrink-0 p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
              title="Copy to clipboard"
            >
              {exportCopied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Clipboard className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleNew}
              className="flex-shrink-0 p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
              title="New idea"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`group flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""} msg-fade-in`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center ${
                  message.role === "user"
                    ? "bg-slate-200"
                    : "bg-gradient-to-br from-slate-800 to-slate-900"
                }`}
              >
                {message.role === "user" ? (
                  <span className="text-xs font-bold text-slate-600">You</span>
                ) : (
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </div>
              <div
                className={`flex-1 max-w-[85%] sm:max-w-[80%] ${message.role === "user" ? "flex flex-col items-end" : ""}`}
              >
                {message.role === "opponent" && (
                  <div className="flex items-center gap-2 mb-1 ml-1">
                    <span className="text-xs font-medium text-slate-500">The Adversary</span>
                    <button
                      onClick={() => copyMessage(message.id, message.content)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-100"
                      title="Copy message"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>
                )}
                <div
                  className={`inline-block px-4 py-3 rounded-2xl text-sm sm:text-base leading-relaxed ${
                    message.role === "user"
                      ? message.isQuickAction
                        ? "bg-indigo-600 text-white rounded-tr-md text-xs font-medium px-3 py-2"
                        : "bg-slate-900 text-white rounded-tr-md"
                      : "bg-slate-100 text-slate-800 rounded-tl-md"
                  }`}
                >
                  {message.role === "opponent" ? (
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && streamingContent && (
            <div className="flex gap-3 msg-fade-in">
              <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 max-w-[85%] sm:max-w-[80%]">
                <span className="text-xs font-medium text-slate-500 mb-1 ml-1 block">
                  The Adversary
                </span>
                <div className="inline-block px-4 py-3 rounded-2xl rounded-tl-md bg-slate-100 text-slate-800 text-sm sm:text-base leading-relaxed">
                  <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isLoading && !streamingContent && (
            <div className="flex gap-3 msg-fade-in">
              <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 mb-1 ml-1 block">
                  The Adversary
                </span>
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl rounded-tl-md bg-slate-100">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs text-slate-500 italic">{typingPhrase}</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex-shrink-0 px-4 sm:px-6 pb-2">
          <div className="max-w-3xl mx-auto p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Sensitive topic warning */}
      {input.trim() && hasSensitiveTopic(input) && !shouldBlock(input) && (
        <div className="flex-shrink-0 px-4 sm:px-6 pb-2">
          <div className="max-w-3xl mx-auto p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            Sensitive topic detected. Debate allowed for academic discussion. Operational advice will be blocked.
          </div>
        </div>
      )}

      {/* Quick actions bar */}
      {showQuickActions && (
        <div className="flex-shrink-0 border-t border-slate-100 bg-slate-50 px-3 sm:px-6 py-2">
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.id)}
                  disabled={isLoading}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-slate-600">{action.icon}</span>
                  <span className="text-xs font-medium text-slate-700">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4 safe-area-bottom">
        <div className="max-w-3xl mx-auto">
          {/* Quick actions toggle */}
          <div className="flex items-center justify-center mb-2">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              disabled={isLoading}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-50"
            >
              {showQuickActions ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              Quick actions
            </button>
          </div>

          <div className="flex gap-2 sm:gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Defend your position..."
                rows={1}
                maxLength={MAX_MESSAGE_LENGTH}
                className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all resize-none text-sm sm:text-base"
                style={{ minHeight: "48px", maxHeight: "120px" }}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 bottom-2 p-2.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-2">
            {input.length > 0 && (
              <span className={input.length > MAX_MESSAGE_LENGTH - 100 ? "text-amber-600" : ""}>
                {input.length}/{MAX_MESSAGE_LENGTH}
              </span>
            )}
            {input.length === 0 && "Enter to send · Shift+Enter for new line"}
          </p>
        </div>
      </div>
    </div>
  );
}
