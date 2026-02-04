"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Send, RotateCcw, ArrowRight, Sparkles, User, Zap } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "opponent";
  content: string;
}

interface DebateSetup {
  topic: string;
  yourPosition: string;
  context: string;
}

export default function Home() {
  const [stage, setStage] = useState<"setup" | "debate">("setup");
  const [setup, setSetup] = useState<DebateSetup>({
    topic: "",
    yourPosition: "",
    context: "",
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
  };

  const startDebate = async () => {
    if (!setup.topic.trim() || !setup.yourPosition.trim()) {
      setError("Fill in your idea and reasoning");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          setup,
        }),
      });

      if (!response.ok) throw new Error("Failed to start");

      const data = await response.json();

      setMessages([
        {
          id: Date.now().toString(),
          role: "opponent",
          content: data.response,
        },
      ]);
      setStage("debate");
    } catch {
      setError("Failed to start. Check your API key.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "continue",
          setup,
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) throw new Error("Failed");

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "opponent",
          content: data.response,
        },
      ]);
    } catch {
      setError("Failed to get response.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStage("setup");
    setSetup({ topic: "", yourPosition: "", context: "" });
    setMessages([]);
    setInput("");
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Setup Stage
  if (stage === "setup") {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-neutral-50 to-white flex flex-col">
        <div className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 flex flex-col">
          {/* Header */}
          <div className="mb-8 sm:mb-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25 mb-6">
              <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-neutral-900 mb-3">
              Priority Debater
            </h1>
            <p className="text-neutral-500 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              Share your thinking. AI will find the gaps and help you make it stronger.
            </p>
          </div>

          {/* Setup Form */}
          <div className="flex-1 flex flex-col space-y-5 sm:space-y-6">
            <div className="group">
              <label className="block text-xs sm:text-sm font-medium text-neutral-600 mb-2 uppercase tracking-wide">
                Your idea or decision
              </label>
              <input
                type="text"
                placeholder="e.g., We should focus on mobile before web"
                value={setup.topic}
                onChange={(e) => setSetup({ ...setup, topic: e.target.value })}
                className="w-full px-4 py-3 sm:py-3.5 rounded-xl border-2 border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all text-sm sm:text-base"
              />
            </div>

            <div className="flex-1 flex flex-col group">
              <label className="block text-xs sm:text-sm font-medium text-neutral-600 mb-2 uppercase tracking-wide">
                Your reasoning
              </label>
              <textarea
                placeholder="Why do you think this is the right call? What's your evidence?"
                value={setup.yourPosition}
                onChange={(e) => setSetup({ ...setup, yourPosition: e.target.value })}
                className="flex-1 min-h-[120px] sm:min-h-[140px] w-full px-4 py-3 sm:py-3.5 rounded-xl border-2 border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all resize-none text-sm sm:text-base"
              />
            </div>

            <div className="group">
              <label className="block text-xs sm:text-sm font-medium text-neutral-600 mb-2 uppercase tracking-wide">
                Context <span className="text-neutral-400 font-normal normal-case">(optional)</span>
              </label>
              <textarea
                placeholder="Product stage, team size, market, constraints..."
                value={setup.context}
                onChange={(e) => setSetup({ ...setup, context: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 sm:py-3.5 rounded-xl border-2 border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all resize-none text-sm sm:text-base"
              />
            </div>

            {error && (
              <div className="p-3 sm:p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                <span className="flex-shrink-0">⚠️</span>
                {error}
              </div>
            )}

            <button
              onClick={startDebate}
              disabled={isLoading}
              className="w-full py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <span>Start Discussion</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-neutral-200/50 text-center text-xs sm:text-sm text-neutral-400">
            Built by{" "}
            <a
              href="https://manuelfernandes.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 hover:text-violet-600 transition-colors font-medium"
            >
              Manuel Gonçalves
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Chat Stage
  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-neutral-100 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/20">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-semibold text-neutral-900 truncate">
                {setup.topic}
              </p>
            </div>
          </div>
          <button
            onClick={reset}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-neutral-500 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2.5 sm:gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center ${
                  message.role === "user"
                    ? "bg-neutral-900"
                    : "bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/20"
                }`}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
                ) : (
                  <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
                )}
              </div>
              <div
                className={`flex-1 max-w-[85%] sm:max-w-[80%] ${
                  message.role === "user" ? "flex flex-col items-end" : ""
                }`}
              >
                <div
                  className={`inline-block px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-sm sm:text-base leading-relaxed ${
                    message.role === "user"
                      ? "bg-neutral-900 text-white rounded-tr-md"
                      : "bg-neutral-100 text-neutral-800 rounded-tl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 sm:gap-3">
              <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/20">
                <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
              </div>
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-md bg-neutral-100">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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

      {/* Input */}
      <div className="flex-shrink-0 border-t border-neutral-100 bg-white/80 backdrop-blur-xl p-3 sm:p-4 safe-area-bottom">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 sm:gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Respond to the critique..."
                rows={1}
                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 pr-11 sm:pr-12 rounded-xl border-2 border-neutral-200 bg-neutral-50 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 transition-all resize-none text-sm sm:text-base"
                style={{ minHeight: "44px", maxHeight: "120px" }}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="absolute right-1.5 sm:right-2 bottom-1.5 sm:bottom-2 p-2 sm:p-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-500/20 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="hidden sm:block text-center text-xs text-neutral-400 mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
