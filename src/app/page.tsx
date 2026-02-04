"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Loader2, Send, RotateCcw, ArrowRight } from "lucide-react";

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
      <div className="min-h-screen bg-white">
        <div className="max-w-xl mx-auto px-6 py-16">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-2 text-neutral-400 text-sm mb-6">
              <MessageCircle className="w-4 h-4" />
              <span>Priority Debater</span>
            </div>
            <h1 className="text-3xl font-medium text-neutral-900 mb-3">
              What&apos;s your idea?
            </h1>
            <p className="text-neutral-500">
              Share your thinking. I&apos;ll find the gaps and help you make it stronger.
            </p>
          </div>

          {/* Setup Form */}
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                The idea or decision
              </label>
              <input
                type="text"
                placeholder="e.g., We should focus on mobile before web"
                value={setup.topic}
                onChange={(e) => setSetup({ ...setup, topic: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Your reasoning
              </label>
              <textarea
                placeholder="Why do you think this is the right call? What's your evidence?"
                value={setup.yourPosition}
                onChange={(e) => setSetup({ ...setup, yourPosition: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Context <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <textarea
                placeholder="Product stage, team size, market, constraints..."
                value={setup.context}
                onChange={(e) => setSetup({ ...setup, context: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors resize-none"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={startDebate}
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  Start Discussion
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-neutral-100 text-center text-sm text-neutral-400">
            Built by{" "}
            <a
              href="https://manuelfernandes.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 hover:text-neutral-700 transition-colors"
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
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-neutral-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-neutral-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900 truncate max-w-[280px]">
              {setup.topic}
            </p>
          </div>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          New
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                  {message.role === "user" ? "You" : "Critic"}
                </span>
              </div>
              <div className={`text-neutral-800 leading-relaxed ${message.role === "opponent" ? "pl-0" : "pl-0"}`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                  Critic
                </span>
              </div>
              <div className="flex items-center gap-2 text-neutral-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-6">
          <div className="max-w-2xl mx-auto p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-4">
            {error}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-neutral-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Respond to the critique..."
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-300 focus:bg-white transition-colors resize-none"
                style={{ minHeight: "48px", maxHeight: "150px" }}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 bottom-2 p-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-neutral-400 mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
