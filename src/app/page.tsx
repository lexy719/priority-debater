"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Send, RotateCcw, ArrowRight, ArrowLeft, Rocket, Scale, Lightbulb, Target, GraduationCap, MessageCircle } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "opponent";
  content: string;
}

interface DebateSetup {
  template: string;
  topic: string;
  position: string;
  context: string;
}

type Template = {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  placeholder: {
    topic: string;
    position: string;
    context: string;
  };
  labels: {
    topic: string;
    position: string;
    context: string;
  };
};

const templates: Template[] = [
  {
    id: "feature",
    icon: <Rocket className="w-6 h-6" />,
    title: "Feature Priority",
    subtitle: "Should we build X before Y?",
    placeholder: {
      topic: "We should build notifications before analytics",
      position: "40% of users requested notifications in our last survey. It's only 2 weeks of eng work and will increase daily engagement. Analytics can wait because we're still small.",
      context: "B2B SaaS, 500 users, 3 engineers, Series A",
    },
    labels: {
      topic: "What feature decision are you debating?",
      position: "Why do you think this is the right priority?",
      context: "Team size, timeline, metrics (optional)",
    },
  },
  {
    id: "strategy",
    icon: <Scale className="w-6 h-6" />,
    title: "Strategic Decision",
    subtitle: "Pivot, expand, or partner?",
    placeholder: {
      topic: "We should expand to enterprise before fixing our SMB churn",
      position: "Enterprise deals are 10x larger and our product already works for them. SMB churn is a pricing problem we can't solve. One enterprise customer = 50 SMBs.",
      context: "Current ARR $500k, 80% SMB, 35% annual churn",
    },
    labels: {
      topic: "What strategic decision are you facing?",
      position: "What's your reasoning?",
      context: "Current situation, constraints (optional)",
    },
  },
  {
    id: "idea",
    icon: <Lightbulb className="w-6 h-6" />,
    title: "Product Idea",
    subtitle: "Is this worth building?",
    placeholder: {
      topic: "AI-powered meeting summarizer for remote teams",
      position: "Remote work is here to stay, people hate taking notes, and AI is finally good enough. We can charge $10/user/month and grow through product-led growth.",
      context: "Solo founder, technical background, 6 months runway",
    },
    labels: {
      topic: "What's the idea?",
      position: "Why do you think it will work?",
      context: "Your situation, target users (optional)",
    },
  },
  {
    id: "gtm",
    icon: <Target className="w-6 h-6" />,
    title: "Go-to-Market",
    subtitle: "How should we launch?",
    placeholder: {
      topic: "Launch on Product Hunt then do cold outreach to design agencies",
      position: "PH will give us initial users and social proof. Design agencies are our ICP and they're active on Twitter. We'll offer a 50% launch discount.",
      context: "Design tool for agencies, freemium model, launching in 2 weeks",
    },
    labels: {
      topic: "What's your GTM plan?",
      position: "Why this approach?",
      context: "Product, target market, timeline (optional)",
    },
  },
  {
    id: "open",
    icon: <MessageCircle className="w-6 h-6" />,
    title: "Open Debate",
    subtitle: "Defend any position",
    placeholder: {
      topic: "Remote work is better than office work for most knowledge workers",
      position: "Studies show higher productivity at home, commuting wastes 2+ hours daily, and companies save millions on real estate. The office is a relic of industrial-age management.",
      context: "Tech worker, 5 years remote experience",
    },
    labels: {
      topic: "What's your position?",
      position: "Make your argument",
      context: "Relevant background (optional)",
    },
  },
];

export default function Home() {
  const [stage, setStage] = useState<"template" | "form" | "debate">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [setup, setSetup] = useState<DebateSetup>({
    template: "",
    topic: "",
    position: "",
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
  };

  const selectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setSetup({ ...setup, template: template.id });
    setStage("form");
  };

  const startDebate = async () => {
    if (!setup.topic.trim() || !setup.position.trim()) {
      setError("Fill in your position and reasoning");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", setup }),
      });

      if (!response.ok) throw new Error("Failed to start");

      const data = await response.json();
      setMessages([{ id: Date.now().toString(), role: "opponent", content: data.response }]);
      setStage("debate");
    } catch {
      setError("Failed to start. Check your API key.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "continue", setup, messages: [...messages, userMessage] }),
      });

      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "opponent", content: data.response }]);
    } catch {
      setError("Failed to get response.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStage("template");
    setSelectedTemplate(null);
    setSetup({ template: "", topic: "", position: "", context: "" });
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

  // Template Selection Stage
  if (stage === "template") {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-slate-50 to-white flex flex-col">
        <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 shadow-xl mb-6">
              <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
              Priority Debater
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-4">
              <span className="font-medium text-slate-700">Dr. Alex Chen</span>
              <span>•</span>
              <span>Stanford GSB</span>
              <span>•</span>
              <span>Ex-Google, Stripe, Airbnb</span>
            </div>
            <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto">
              I&apos;ll find the holes in your thinking before the market does.
            </p>
          </div>

          {/* Template Grid */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 text-center">
              What are we debating?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => selectTemplate(template)}
                  className="group p-5 sm:p-6 rounded-2xl border-2 border-slate-200 bg-white hover:border-slate-900 hover:shadow-lg transition-all text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      {template.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{template.title}</h3>
                      <p className="text-sm text-slate-500">{template.subtitle}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8 border-t border-slate-200 text-center text-xs sm:text-sm text-slate-400">
            Built by{" "}
            <a
              href="https://manuelfernandes.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              Manuel Gonçalves
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Form Stage
  if (stage === "form" && selectedTemplate) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-slate-50 to-white flex flex-col">
        <div className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Back Button */}
          <button
            onClick={() => setStage("template")}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Change topic
          </button>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-slate-900 text-white">
                {selectedTemplate.icon}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{selectedTemplate.title}</h1>
                <p className="text-sm text-slate-500">{selectedTemplate.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {selectedTemplate.labels.topic}
              </label>
              <input
                type="text"
                placeholder={selectedTemplate.placeholder.topic}
                value={setup.topic}
                onChange={(e) => setSetup({ ...setup, topic: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {selectedTemplate.labels.position}
              </label>
              <textarea
                placeholder={selectedTemplate.placeholder.position}
                value={setup.position}
                onChange={(e) => setSetup({ ...setup, position: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors resize-none text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {selectedTemplate.labels.context}
              </label>
              <textarea
                placeholder={selectedTemplate.placeholder.context}
                value={setup.context}
                onChange={(e) => setSetup({ ...setup, context: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors resize-none text-sm sm:text-base"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={startDebate}
              disabled={isLoading}
              className="w-full py-3.5 sm:py-4 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  Dr. Chen is reviewing...
                </>
              ) : (
                <>
                  Start the Debate
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chat Stage
  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-900 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-semibold text-slate-900">Dr. Alex Chen</p>
              <p className="text-xs text-slate-500 truncate">Stanford GSB • Ex-Google, Stripe</p>
            </div>
          </div>
          <button
            onClick={reset}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">New Debate</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center ${
                  message.role === "user" ? "bg-slate-200" : "bg-slate-900"
                }`}
              >
                {message.role === "user" ? (
                  <span className="text-xs font-bold text-slate-600">You</span>
                ) : (
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </div>
              <div className={`flex-1 max-w-[85%] sm:max-w-[80%] ${message.role === "user" ? "flex flex-col items-end" : ""}`}>
                {message.role === "opponent" && (
                  <span className="text-xs font-medium text-slate-500 mb-1 ml-1">Dr. Chen</span>
                )}
                <div
                  className={`inline-block px-4 py-3 rounded-2xl text-sm sm:text-base leading-relaxed ${
                    message.role === "user"
                      ? "bg-slate-900 text-white rounded-tr-md"
                      : "bg-slate-100 text-slate-800 rounded-tl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 mb-1 ml-1 block">Dr. Chen</span>
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-md bg-slate-100">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
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
      <div className="flex-shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4 safe-area-bottom">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 sm:gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Defend your position..."
                rows={1}
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
          <p className="hidden sm:block text-center text-xs text-slate-400 mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
