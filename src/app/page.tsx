"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Loader2, Send, RotateCcw, ArrowRight, ArrowLeft,
  Sparkles, FileText, Swords, Shield, Eye, Clipboard, Check, Zap, FlaskConical,
  Copy, Wand2, LayoutGrid, Download, BarChart3, AlertTriangle, Target, X
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


// Parse validation response into tab sections (IdeaProof style)
function parseValidationSections(content: string): { id: string; title: string; content: string; icon: string }[] {
  const sections: { id: string; title: string; content: string; icon: string }[] = [];
  const [mainPart, ...rest] = content.split(/\n---\n/);
  const parts = mainPart.split(/\n(?=### )/);

  const iconMap: Record<string, string> = {
    summary: "file",
    viability: "sparkles",
    strengths: "check",
    risks: "alert",
    market: "chart",
    recommendation: "target",
    steps: "clipboard",
    verdict: "zap",
    challenge: "swords",
  };

  for (const part of parts) {
    const firstNewline = part.indexOf("\n");
    const titleLine = part.slice(0, firstNewline).replace(/^### /, "").trim();
    const content = part.slice(firstNewline + 1).trim();
    if (!titleLine || !content) continue;

    let id = "section";
    const t = titleLine.toLowerCase();
    if (t.includes("idea summary")) id = "summary";
    else if (t.includes("viability")) id = "viability";
    else if (t.includes("strengths")) id = "strengths";
    else if (t.includes("risk")) id = "risks";
    else if (t.includes("market")) id = "market";
    else if (t.includes("go/no-go") || t.includes("recommendation")) id = "recommendation";
    else if (t.includes("validation steps")) id = "steps";
    else if (t.includes("verdict")) id = "verdict";

    sections.push({ id, title: titleLine, content, icon: iconMap[id] || "file" });
  }

  if (rest.length > 0) {
    const challengeContent = rest.join("\n---\n").trim();
    if (challengeContent) {
      sections.push({ id: "challenge", title: "Key Challenge", content: challengeContent, icon: "swords" });
    }
  }

  return sections;
}

// Extract score, strengths, risks, and more for dashboard display
function extractDashboardData(content: string) {
  const scoreMatch = content.match(/(?:viability score|score)[:\s]*\[?(\d+)\]?\/10/i) || content.match(/(\d+)\/10/);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : null;

  const strengthsSection = content.match(/### Strengths\s*\n([\s\S]*?)(?=### |---|$)/i);
  const risksSection = content.match(/### Risk Flags?\s*\n([\s\S]*?)(?=### |---|$)/i);

  const parseListItems = (text: string) =>
    text.split(/\n/).filter((l) => /^\d+\.|^[-*]/.test(l.trim())).map((l) => l.replace(/^\d+\.\s*|^[-*]\s*/, "").trim()).filter(Boolean);

  const strengths = strengthsSection ? parseListItems(strengthsSection[1]) : [];
  const risks = risksSection ? parseListItems(risksSection[1]) : [];

  const summarySection = content.match(/### Idea Summary\s*\n([\s\S]*?)(?=### |---|$)/i);
  const summary = summarySection ? summarySection[1].trim() : null;

  const verdictSection = content.match(/### One-Line Verdict\s*\n([\s\S]*?)(?=### |---|$)/i);
  const verdict = verdictSection ? verdictSection[1].trim() : null;

  const recommendationSection = content.match(/### Go\/No-Go[\s\S]*?\n([\s\S]*?)(?=### |---|$)/i);
  const goNoGo = recommendationSection ? recommendationSection[1].trim() : null;

  const stepsSection = content.match(/### Top 3[^\n]*\n([\s\S]*?)(?=### |---|$)/i);
  const recommendations = stepsSection ? parseListItems(stepsSection[1]) : [];

  const marketSection = content.match(/### Market Opportunity\s*\n([\s\S]*?)(?=### |---|$)/i);
  const marketSummary = marketSection ? marketSection[1].trim().slice(0, 300) : null;

  return { score, strengths, risks, summary, verdict, goNoGo, recommendations, marketSummary };
}

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
  const [stage, setStage] = useState<"home" | "form" | "results" | "debate">("home");
  const [activeTab, setActiveTab] = useState(0);
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

  const startValidation = async () => {
    const isGenerate = setup.template === "generate";
    if (isGenerate ? !setup.position.trim() : (!setup.topic.trim() || !setup.position.trim())) {
      setError(isGenerate ? "Tell us your interests and preferences" : "Fill in your idea and reasoning");
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

      const content = await handleStreamResponse(response);
      const validationMessage = { id: Date.now().toString(), role: "opponent" as const, content };

      setMessages([validationMessage]);

      if (setup.template === "validate") {
        setStage("results");
        setActiveTab(0);
      } else {
        setStage("debate");
      }
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
    setActiveTab(0);
  };

  const openDebate = () => {
    setStage("debate");
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
              onClick={startValidation}
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

  // Results Stage - IdeaProof style analytics tabs
  const validationContent = messages[0]?.role === "opponent" ? messages[0].content : "";
  let sections = parseValidationSections(validationContent);
  if (sections.length === 0 && validationContent) {
    sections = [{ id: "full", title: "Full Report", content: validationContent, icon: "file" }];
  }
  const getSectionIcon = (icon: string) => {
    switch (icon) {
      case "sparkles": return <Sparkles className="w-4 h-4" />;
      case "chart": return <BarChart3 className="w-4 h-4" />;
      case "alert": return <AlertTriangle className="w-4 h-4" />;
      case "target": return <Target className="w-4 h-4" />;
      case "swords": return <Swords className="w-4 h-4" />;
      case "check": return <Check className="w-4 h-4" />;
      case "clipboard": return <Clipboard className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (stage === "results" && sections.length > 0) {
    const currentSection = sections[activeTab] || sections[0];
    const dashboard = extractDashboardData(validationContent);
    const scoreColor = dashboard.score != null
      ? dashboard.score >= 7 ? "text-emerald-500" : dashboard.score >= 5 ? "text-amber-500" : "text-red-500"
      : "text-slate-600";
    const scoreBg = dashboard.score != null
      ? dashboard.score >= 7 ? "bg-emerald-50 border-emerald-200" : dashboard.score >= 5 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"
      : "bg-slate-50 border-slate-200";

    return (
      <div className="min-h-screen min-h-[100dvh] bg-slate-100 flex flex-col">
        <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-slate-500 truncate max-w-[240px] sm:max-w-md">{setup.topic}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadReport}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white/80 transition-colors"
              >
                <Download className="w-4 h-4" /> PDF
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white/80 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> New
              </button>
            </div>
          </div>

          {/* Hero banner - richer IdeaProof style */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 p-6 sm:p-8 mb-6 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15)_0%,_transparent_50%)]" />
            <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Validation Report</span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">Ready</span>
                  <span className="text-slate-400 text-xs">Step 1 of 3</span>
                  <span className="text-slate-500 text-xs">·</span>
                  <span className="text-slate-400 text-xs">Est. 3–6 months to market</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-3">Step 1: Idea Validation</h1>
                {(dashboard.summary || dashboard.verdict) && (
                  <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                    {dashboard.verdict || dashboard.summary}
                  </p>
                )}
              </div>
              {/* Score + metrics block */}
              <div className="flex flex-row lg:flex-col gap-6 items-center lg:items-end shrink-0">
                {dashboard.score != null && (
                  <div className={`flex items-center gap-4 ${scoreColor}`}>
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                      <svg className="score-gauge w-full h-full" viewBox="0 0 100 100">
                        <circle className="score-gauge-bg" cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                        <circle
                          className="score-gauge-fill"
                          cx="50" cy="50" r="40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeLinecap="round"
                          style={{ strokeDashoffset: 251.2 - (dashboard.score / 10) * 251.2 }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-inherit">
                        <span className="text-2xl sm:text-3xl font-bold">{dashboard.score}</span>
                        <span className="text-xs font-medium opacity-80">/10</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Potential</span>
                          <span className="text-emerald-400 font-medium">{Math.round((dashboard.score / 10) * 100)}%</span>
                        </div>
                        <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(dashboard.score / 10) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Risk</span>
                          <span className="text-amber-400 font-medium">{Math.round((1 - dashboard.score / 10) * 100)}%</span>
                        </div>
                        <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${(1 - dashboard.score / 10) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Key metrics row - KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200/50 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Viability</p>
              <p className={`text-2xl font-bold ${dashboard.score != null ? (dashboard.score >= 7 ? "text-emerald-600" : dashboard.score >= 5 ? "text-amber-600" : "text-red-600") : "text-slate-600"}`}>
                {dashboard.score != null ? (dashboard.score >= 7 ? "Strong" : dashboard.score >= 5 ? "Moderate" : "Weak") : "—"}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-slate-200/50 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Strengths</p>
              <p className="text-2xl font-bold text-slate-900">{dashboard.strengths.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-slate-200/50 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Risk Flags</p>
              <p className="text-2xl font-bold text-slate-900">{dashboard.risks.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-slate-200/50 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Next Steps</p>
              <p className="text-2xl font-bold text-slate-900">{dashboard.recommendations.length}</p>
            </div>
          </div>

          {/* SWOT grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-md border-l-4 border-emerald-500 p-5">
              <h3 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Check className="w-4 h-4" /> Strengths
              </h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {dashboard.strengths.slice(0, 4).map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-emerald-500">•</span>
                    <span>{s}</span>
                  </li>
                ))}
                {dashboard.strengths.length === 0 && <li className="text-slate-500 italic">See validation report</li>}
              </ul>
            </div>
            <div className="bg-white rounded-xl shadow-md border-l-4 border-amber-500 p-5">
              <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Weaknesses
              </h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {dashboard.risks.slice(0, 4).map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-amber-500">•</span>
                    <span>{r}</span>
                  </li>
                ))}
                {dashboard.risks.length === 0 && <li className="text-slate-500 italic">See validation report</li>}
              </ul>
            </div>
            <div className="bg-white rounded-xl shadow-md border-l-4 border-blue-500 p-5">
              <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" /> Opportunities
              </h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {dashboard.marketSummary ? (
                  <li className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>{dashboard.marketSummary.slice(0, 120)}{dashboard.marketSummary.length > 120 ? "…" : ""}</span>
                  </li>
                ) : (
                  <>
                    <li className="flex gap-2"><span className="text-blue-500">•</span><span>Market expansion potential</span></li>
                    <li className="flex gap-2"><span className="text-blue-500">•</span><span>Technology adoption trends</span></li>
                  </>
                )}
              </ul>
            </div>
            <div className="bg-white rounded-xl shadow-md border-l-4 border-red-500 p-5">
              <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                <X className="w-4 h-4" /> Threats
              </h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {dashboard.risks.slice(4, 8).map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-red-500">•</span>
                    <span>{r}</span>
                  </li>
                ))}
                {dashboard.risks.length <= 4 && (
                  <li className="flex gap-2"><span className="text-red-500">•</span><span>Regulatory & competitive pressure</span></li>
                )}
                {dashboard.risks.length === 0 && <li className="text-slate-500 italic">See validation report</li>}
              </ul>
            </div>
          </div>

          {/* Score breakdown - visual bars */}
          {dashboard.score != null && (
            <div className="bg-white rounded-xl shadow-md border border-slate-200/50 p-6 mb-6">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Validation Score Breakdown
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-600">Market fit</span>
                    <span className="font-medium text-slate-900">{Math.round((dashboard.score / 10) * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all" style={{ width: `${(dashboard.score / 10) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-600">Execution feasibility</span>
                    <span className="font-medium text-slate-900">{Math.round(((dashboard.score / 10) * 0.85 + 0.15) * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all" style={{ width: `${((dashboard.score / 10) * 0.85 + 0.15) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-600">Risk profile</span>
                    <span className="font-medium text-slate-900">{Math.round((1 - dashboard.score / 10) * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all" style={{ width: `${(1 - dashboard.score / 10) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Executive Summary - IdeaProof style */}
          {dashboard.summary && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6 sm:p-8 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-600" />
                Executive Summary
              </h2>
              <p className="text-slate-700 leading-relaxed">{dashboard.summary}</p>
            </div>
          )}

          {/* Key Recommendations + Go/No-Go row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {dashboard.recommendations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-violet-600" />
                  Key Recommendations
                </h2>
                <ol className="space-y-3">
                  {dashboard.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-3 text-slate-700">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-sm font-semibold flex items-center justify-center">{i + 1}</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {dashboard.goNoGo && (
              <div className="bg-white rounded-2xl shadow-lg border-2 border-indigo-200/60 p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Go/No-Go Recommendation
                </h2>
                <div className="markdown-content text-slate-700 prose prose-slate max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{dashboard.goNoGo}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* Market Opportunity card */}
          {dashboard.marketSummary && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6 sm:p-8 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Market Opportunity
              </h2>
              <div className="markdown-content text-slate-700 prose prose-slate max-w-none prose-p:my-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{dashboard.marketSummary}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Insights table - at a glance */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200/50 overflow-hidden mb-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" /> At a Glance
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="text-left px-6 py-3 font-semibold text-slate-600">Metric</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-600">Value</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-6 py-3 text-slate-600">Viability score</td>
                    <td className="px-6 py-3 font-medium text-slate-900">{dashboard.score != null ? `${dashboard.score}/10` : "—"}</td>
                    <td className="px-6 py-3">
                      {dashboard.score != null && (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          dashboard.score >= 7 ? "bg-emerald-100 text-emerald-700" :
                          dashboard.score >= 5 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        }`}>
                          {dashboard.score >= 7 ? "Go" : dashboard.score >= 5 ? "Caution" : "No-go"}
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 text-slate-600">Green lights</td>
                    <td className="px-6 py-3 font-medium text-slate-900">{dashboard.strengths.length}</td>
                    <td className="px-6 py-3 text-slate-500">—</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 text-slate-600">Red flags</td>
                    <td className="px-6 py-3 font-medium text-slate-900">{dashboard.risks.length}</td>
                    <td className="px-6 py-3 text-slate-500">—</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 text-slate-600">Validation stage</td>
                    <td className="px-6 py-3 font-medium text-slate-900">Step 1 of 3</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">In progress</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Main grid: Tabs + content + sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left: Tabs + content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tabs */}
              <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                {sections.map((section, i) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveTab(i)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === i
                        ? "bg-white text-slate-900 shadow-md"
                        : "bg-white/60 text-slate-600 hover:bg-white hover:text-slate-800"
                    }`}
                  >
                    {getSectionIcon(section.icon)}
                    <span className="max-w-[100px] truncate">{section.title.split(":")[0]}</span>
                  </button>
                ))}
              </div>

              {/* Tab content card */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">{currentSection.title}</h2>
                <div className="markdown-content text-slate-700 prose prose-slate max-w-none prose-headings:text-slate-900">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentSection.content}</ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Right: Green Lights + Red Flags + Recommendations + Journey */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border-2 border-emerald-200/60 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100">
                      <Check className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Green Lights</h3>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{dashboard.strengths.length}</span>
                </div>
                <ul className="space-y-2.5 max-h-48 overflow-y-auto">
                  {dashboard.strengths.length > 0 ? dashboard.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  )) : (
                    <li className="text-sm text-slate-500 italic">See Strengths tab</li>
                  )}
                </ul>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border-2 border-red-200/60 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-100">
                      <X className="w-4 h-4 text-red-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Red Flags</h3>
                  </div>
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{dashboard.risks.length}</span>
                </div>
                <ul className="space-y-2.5 max-h-48 overflow-y-auto">
                  {dashboard.risks.length > 0 ? dashboard.risks.map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <X className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                      <span>{r}</span>
                    </li>
                  )) : (
                    <li className="text-sm text-slate-500 italic">See Risk Flags tab</li>
                  )}
                </ul>
              </div>

              {dashboard.recommendations.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-violet-100">
                      <Target className="w-4 h-4 text-violet-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Top 3 Next Steps</h3>
                  </div>
                  <ol className="space-y-2.5">
                    {dashboard.recommendations.slice(0, 3).map((rec, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-700">
                        <span className="shrink-0 w-5 h-5 rounded bg-violet-100 text-violet-700 text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Journey - IdeaProof style */}
              <div className="bg-slate-800 rounded-2xl p-5 text-white">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Your Journey</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm font-medium">Idea Validation</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-500 flex-shrink-0" />
                    <span className="text-sm">Market Analysis</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-500 flex-shrink-0" />
                    <span className="text-sm">Business Plan</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-500 flex-shrink-0" />
                    <span className="text-sm">Debate & Refine</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA card - prominent */}
          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/20">
                  <Swords className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Ready to stress-test your logic?</h3>
                  <p className="text-violet-200 text-sm mt-1">Defend your position. Find blind spots. Refine before you build.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={openDebate}
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-violet-700 font-semibold hover:bg-violet-50 transition-colors shadow-lg"
                >
                  <Swords className="w-5 h-5" />
                  Debate this idea
                </button>
                <button
                  onClick={reset}
                  className="px-6 py-4 rounded-xl border-2 border-white/30 text-white font-medium hover:bg-white/10 transition-colors"
                >
                  Validate another
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat Stage (Debate)
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
