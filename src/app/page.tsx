"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Loader2, Send, RotateCcw, ArrowRight, ArrowLeft,
  Sparkles, FileText, Swords, Shield, Eye, Clipboard, Check, Zap, FlaskConical,
  Copy, Wand2, LayoutGrid, Download
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "opponent";
  content: string;
  isQuickAction?: boolean;
}

interface DebateSetup {
  template: string;
  topic: string;
  position: string;
  context: string;
  lens: "investor" | "customer" | "competitor" | "postmortem" | "market" | "future";
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

// Idea Validator template - IdeaProof style
const ideaValidatorTemplate: Template = {
  id: "validate",
  icon: <FlaskConical className="w-6 h-6" />,
  title: "Startup Idea Validator",
  subtitle: "Complete viability report in ~2 minutes",
  placeholder: {
    topic: "e.g. AI-powered meeting summarizer for remote teams",
    position: "Why it will work: market timing, your edge, business model...",
    context: "Your situation: team size, runway, target market (optional)",
  },
  labels: {
    topic: "Describe your startup idea",
    position: "Why do you think it will work?",
    context: "Your resources & context (optional)",
  },
};

const generateTemplate: Template = {
  id: "generate",
  icon: <Wand2 className="w-6 h-6" />,
  title: "Idea Generator",
  subtitle: "No idea yet? Generate one",
  placeholder: {
    topic: "AI, B2B SaaS, healthcare, or leave blank",
    position: "Problems I've experienced. Technical background. Prefer B2B.",
    context: "Solo founder, 12 months runway",
  },
  labels: {
    topic: "Industries or themes? (optional)",
    position: "What problems have you experienced? Skills, preferences?",
    context: "Your situation (optional)",
  },
};


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

export default function Home() {
  const [stage, setStage] = useState<"home" | "form" | "debate">("home");
  const [setup, setSetup] = useState<DebateSetup>({
    template: "",
    topic: "",
    position: "",
    context: "",
    lens: "investor",
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [typingPhrase, setTypingPhrase] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportCopied, setExportCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
  };

  const goToForm = () => {
    setSetup((s) => ({ ...s, template: "validate" }));
    setStage("form");
  };

  const handleStreamResponse = async (response: Response, isQuickAction: boolean = false) => {
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
            // Skip malformed JSON
          }
        }
      }
    }

    setStreamingContent("");
    return accumulated;
  };

  const startDebate = async () => {
    const isGenerate = setup.template === "generate";
    if (isGenerate ? !setup.position.trim() : (!setup.topic.trim() || !setup.position.trim())) {
      setError(isGenerate ? "Tell us your interests and preferences" : "Fill in your idea and reasoning");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStage("debate");

    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", setup }),
      });

      if (!response.ok) throw new Error("Failed to start");

      const content = await handleStreamResponse(response);
      setMessages([{ id: Date.now().toString(), role: "opponent", content }]);
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
      const content = await handleStreamResponse(response);
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "opponent", content }]);
    } catch {
      setError("Failed to get response.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (actionType: "steelman" | "framework" | "summary" | "devils-advocate" | "rate" | "blind-spots" | "validation-report") => {
    if (isLoading) return;

    const actionLabels: Record<string, string> = {
      steelman: "Steelman my position",
      framework: "Give me a framework",
      summary: "Summarize this debate",
      "devils-advocate": "Play Devil's Advocate",
      rate: "Rate my argument",
      "blind-spots": "What am I missing?",
      "validation-report": "Full validation report",
    };

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: actionLabels[actionType],
      isQuickAction: true
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "quick",
          quickAction: actionType,
          setup,
          messages: [...messages, userMessage]
        }),
      });

      if (!response.ok) throw new Error("Failed");
      const content = await handleStreamResponse(response, true);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "opponent",
        content,
        isQuickAction: true
      }]);
    } catch {
      setError("Failed to get response.");
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
    const header = `# Validation Report: ${setup.topic}\n\n**Your case:** ${setup.position}\n${setup.context ? `**Context:** ${setup.context}\n` : ""}\n---\n\n`;
    const body = messages.map(m => {
      const role = m.role === "user" ? "**You:**" : "**The Adversary:**";
      return `${role}\n${m.content}\n`;
    }).join("\n---\n\n");
    navigator.clipboard.writeText(header + body);
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2000);
  };

  const downloadReport = () => {
    const header = `# Validation Report: ${setup.topic}\n\n**Your case:** ${setup.position}\n${setup.context ? `**Context:** ${setup.context}\n` : ""}\n---\n\n`;
    const body = messages.map(m => {
      const role = m.role === "user" ? "**You:**" : "**The Adversary:**";
      return `${role}\n${m.content}\n`;
    }).join("\n---\n\n");
    const blob = new Blob([header + body], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `validation-report-${(setup.topic || "idea").slice(0, 30).replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setStage("home");
    setSetup({ template: "validate", topic: "", position: "", context: "", lens: "investor" });
    setMessages([]);
    setInput("");
    setError(null);
    setStreamingContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Extract score from messages
  const getArgumentScore = (): number | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === "opponent") {
        const match = msg.content.match(/(?:Argument Strength|Score)[:\s]*\[?(\d+)\]?\/10/i)
          || msg.content.match(/(\d+)\/10/);
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

  // Homepage - IdeaProof style
  if (stage === "home") {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-slate-50 to-white flex flex-col">
        <div className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          {/* Social proof badge - IdeaProof style */}
          <p className="text-center text-sm font-medium text-slate-500 mb-6">
            10,000+ ideas validated
          </p>

          {/* Hero - IdeaProof style */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
              Skip the guesswork.
            </h1>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Know before you build.
            </h1>
            <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto mb-6">
              92% of startups fail from poor validation. Don&apos;t be a statistic. Get a complete viability report in 2 minutes — not 2 months.
            </p>
            <button
              onClick={goToForm}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors text-base"
            >
              Get My Answer
              <ArrowRight className="w-5 h-5" />
            </button>
            {/* Trust badges - IdeaProof style */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" /> No card required
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" /> Free
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" /> Your idea is safe
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" /> Private
              </span>
            </div>
          </div>

          {/* See what you'll get - IdeaProof style expanded */}
          <div className="mb-12">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2 text-center">
              See what you&apos;ll get
            </h2>
            <p className="text-center text-slate-600 text-sm mb-6">
              Real validation results. Click any to learn more.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <Sparkles className="w-5 h-5 text-emerald-600 mb-2" />
                <span className="font-semibold text-slate-900 text-sm block">AI Validation Score</span>
                <p className="text-xs text-slate-500 mt-0.5">Viability · Risk · Go/No-Go</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <FileText className="w-5 h-5 text-blue-600 mb-2" />
                <span className="font-semibold text-slate-900 text-sm block">Market Opportunity</span>
                <p className="text-xs text-slate-500 mt-0.5">TAM · SAM · SOM</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <Eye className="w-5 h-5 text-amber-600 mb-2" />
                <span className="font-semibold text-slate-900 text-sm block">Competitive Landscape</span>
                <p className="text-xs text-slate-500 mt-0.5">Positioning · 5 competitors</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <Clipboard className="w-5 h-5 text-violet-600 mb-2" />
                <span className="font-semibold text-slate-900 text-sm block">Risk Assessment</span>
                <p className="text-xs text-slate-500 mt-0.5">Blind spots · Failure modes</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <FileText className="w-5 h-5 text-slate-600 mb-2" />
                <span className="font-semibold text-slate-900 text-sm block">Validation Steps</span>
                <p className="text-xs text-slate-500 mt-0.5">Top 3 before building</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <Swords className="w-5 h-5 text-violet-600 mb-2" />
                <span className="font-semibold text-slate-900 text-sm block">Debate it</span>
                <p className="text-xs text-slate-500 mt-0.5">Defend & refine · Our edge</p>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mb-8">
            <span className="font-medium">Need an idea?</span>{" "}
            <button onClick={() => { setSetup({ ...setup, template: "generate" }); setStage("form"); }} className="text-slate-900 font-medium hover:underline inline-flex items-center gap-1">
              <Wand2 className="w-4 h-4" /> Generate one
            </button>
          </p>

          {/* FAQ - IdeaProof style */}
          <div className="border-t border-slate-200 pt-8 mb-8">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 text-center">Popular questions</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <details className="group p-3 rounded-lg border border-slate-200 bg-white">
                <summary className="font-medium text-slate-900 cursor-pointer">How long does validation take?</summary>
                <p className="mt-2 text-slate-600">About 2 minutes. You get a complete viability report with score, risks, and market analysis.</p>
              </details>
              <details className="group p-3 rounded-lg border border-slate-200 bg-white">
                <summary className="font-medium text-slate-900 cursor-pointer">Is my idea kept private?</summary>
                <p className="mt-2 text-slate-600">Yes. We don&apos;t store or share your ideas. Everything stays between you and the AI.</p>
              </details>
              <details className="group p-3 rounded-lg border border-slate-200 bg-white">
                <summary className="font-medium text-slate-900 cursor-pointer">What makes this different from IdeaProof?</summary>
                <p className="mt-2 text-slate-600">You get the same validation report — plus you can debate it. Defend your position, stress-test your logic, and refine before you build.</p>
              </details>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
            Built by{" "}
            <a href="https://manuelfernandes.vercel.app" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-900 font-medium">
              Manuel Gonçalves
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Form Stage
  const formTemplate = setup.template === "generate" ? generateTemplate : ideaValidatorTemplate;
  if (stage === "form") {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-slate-50 to-white flex flex-col">
        <div className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {/* Back Button */}
          <button
            onClick={() => { setStage("home"); setSetup({ ...setup, template: "validate" }); }}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-slate-900 text-white">
                {formTemplate.icon}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{formTemplate.title}</h1>
                <p className="text-sm text-slate-500">{formTemplate.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {formTemplate.labels.topic}
              </label>
              <input
                type="text"
                placeholder={formTemplate.placeholder.topic}
                value={setup.topic}
                onChange={(e) => setSetup({ ...setup, topic: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {formTemplate.labels.position}
              </label>
              <textarea
                placeholder={formTemplate.placeholder.position}
                value={setup.position}
                onChange={(e) => setSetup({ ...setup, position: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors resize-none text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {formTemplate.labels.context}
              </label>
              <textarea
                placeholder={formTemplate.placeholder.context}
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
                  Validating... (~2 min)
                </>
              ) : (
                <>
                  Get My Answer
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
            <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm sm:text-base font-semibold text-slate-900">The Adversary</p>
                {score !== null && (
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${getScoreBg(score)} ${getScoreColor(score)}`}>
                    {score}/10
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Idea Validator · Debate to refine</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={downloadReport}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
              title="Download report"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={exportDebate}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
              title="Copy to clipboard"
            >
              {exportCopied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              <span className="hidden sm:inline">{exportCopied ? "Copied!" : "Copy"}</span>
            </button>
            <button
              onClick={reset}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
          {messages.map((message) => (
            <div key={message.id} className={`group flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""} msg-fade-in`}>
              <div
                className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center ${
                  message.role === "user" ? "bg-slate-200" : "bg-gradient-to-br from-slate-800 to-slate-900"
                }`}
              >
                {message.role === "user" ? (
                  <span className="text-xs font-bold text-slate-600">You</span>
                ) : (
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </div>
              <div className={`flex-1 max-w-[85%] sm:max-w-[80%] ${message.role === "user" ? "flex flex-col items-end" : ""}`}>
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
                        ? "bg-violet-600 text-white rounded-tr-md"
                        : "bg-slate-900 text-white rounded-tr-md"
                      : message.isQuickAction
                        ? "bg-gradient-to-br from-violet-50 to-indigo-50 text-slate-800 rounded-tl-md border border-violet-100"
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

          {/* Streaming content */}
          {isLoading && streamingContent && (
            <div className="flex gap-3 msg-fade-in">
              <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 max-w-[85%] sm:max-w-[80%]">
                <span className="text-xs font-medium text-slate-500 mb-1 ml-1 block">The Adversary</span>
                <div className="inline-block px-4 py-3 rounded-2xl rounded-tl-md bg-slate-100 text-slate-800 text-sm sm:text-base leading-relaxed">
                  <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading indicator (before streaming starts) */}
          {isLoading && !streamingContent && (
            <div className="flex gap-3 msg-fade-in">
              <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 mb-1 ml-1 block">The Adversary</span>
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

      {/* Quick Actions */}
      <div className="flex-shrink-0 border-t border-slate-100 bg-slate-50/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => handleQuickAction("steelman")}
              disabled={isLoading}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <Shield className="w-3.5 h-3.5" />
              Steelman
            </button>
            <button
              onClick={() => handleQuickAction("devils-advocate")}
              disabled={isLoading}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <Swords className="w-3.5 h-3.5" />
              Devil&apos;s Advocate
            </button>
            <button
              onClick={() => handleQuickAction("rate")}
              disabled={isLoading}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Rate argument
            </button>
            <button
              onClick={() => handleQuickAction("blind-spots")}
              disabled={isLoading}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <Eye className="w-3.5 h-3.5" />
              Blind spots
            </button>
            <button
              onClick={() => handleQuickAction("framework")}
              disabled={isLoading}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Framework
            </button>
            <button
              onClick={() => handleQuickAction("summary")}
              disabled={isLoading}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              Summary
            </button>
            <button
              onClick={() => handleQuickAction("validation-report")}
              disabled={isLoading}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <Clipboard className="w-3.5 h-3.5" />
              Validation report
            </button>
          </div>
        </div>
      </div>

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
