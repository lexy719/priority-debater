"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Swords, Loader2, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

interface Feature {
  id: string;
  name: string;
  description: string;
  userImpact: string;
  effort: "low" | "medium" | "high" | "";
  confidence: "low" | "medium" | "high" | "";
  reasoning: string;
}

interface ProductContext {
  productName: string;
  productDescription: string;
  targetUsers: string;
  currentGoal: string;
  constraints: string;
  timeline: string;
}

interface DebateResponse {
  challenges: {
    feature: string;
    challenge: string;
    alternativePerspective: string;
  }[];
  blindSpots: string[];
  questionsToAsk: string[];
  revisedRanking?: {
    feature: string;
    reason: string;
  }[];
  overallAssessment: string;
}

const emptyFeature = (): Feature => ({
  id: Date.now().toString(),
  name: "",
  description: "",
  userImpact: "",
  effort: "",
  confidence: "",
  reasoning: "",
});

export default function Home() {
  const [context, setContext] = useState<ProductContext>({
    productName: "",
    productDescription: "",
    targetUsers: "",
    currentGoal: "",
    constraints: "",
    timeline: "",
  });
  const [features, setFeatures] = useState<Feature[]>([emptyFeature()]);
  const [isLoading, setIsLoading] = useState(false);
  const [debate, setDebate] = useState<DebateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set([features[0].id]));

  const toggleFeatureExpanded = (id: string) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFeatures(newExpanded);
  };

  const addFeature = () => {
    const newFeature = emptyFeature();
    setFeatures([...features, newFeature]);
    setExpandedFeatures(new Set([...expandedFeatures, newFeature.id]));
  };

  const removeFeature = (id: string) => {
    if (features.length > 1) {
      setFeatures(features.filter((f) => f.id !== id));
      const newExpanded = new Set(expandedFeatures);
      newExpanded.delete(id);
      setExpandedFeatures(newExpanded);
    }
  };

  const updateFeature = (id: string, field: keyof Feature, value: string) => {
    setFeatures(
      features.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const moveFeature = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === features.length - 1)
    ) {
      return;
    }
    const newFeatures = [...features];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newFeatures[index], newFeatures[targetIndex]] = [
      newFeatures[targetIndex],
      newFeatures[index],
    ];
    setFeatures(newFeatures);
  };

  const handleSubmit = async () => {
    const validFeatures = features.filter((f) => f.name.trim());
    if (validFeatures.length < 2) {
      setError("Add at least 2 features to debate");
      return;
    }

    if (!context.productName.trim() || !context.currentGoal.trim()) {
      setError("Please fill in at least the product name and current goal");
      return;
    }

    setIsLoading(true);
    setError(null);
    setDebate(null);

    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: validFeatures, context }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate debate");
      }

      const data = await response.json();
      setDebate(data);
    } catch {
      setError("Something went wrong. Check your API key or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setFeatures([emptyFeature()]);
    setDebate(null);
    setError(null);
    setExpandedFeatures(new Set([features[0].id]));
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case "low": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "high": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-foreground/5 text-muted border-border";
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "low": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-foreground/5 text-muted border-border";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-foreground/5">
              <Swords className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-semibold">Priority Debater</h1>
          </div>
          <p className="text-muted text-base">
            Give context about your product and features. AI will rigorously challenge your prioritization decisions.
          </p>
        </div>

        {/* Product Context Section */}
        <div className="mb-8 p-6 rounded-xl border border-border bg-foreground/[0.01]">
          <h2 className="text-lg font-medium mb-4">Product Context</h2>
          <p className="text-sm text-muted mb-4">
            The more context you provide, the more relevant the debate will be.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Slack, Notion, your product"
                value={context.productName}
                onChange={(e) => setContext({ ...context, productName: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Timeline
              </label>
              <input
                type="text"
                placeholder="e.g., Q1 2025, next 3 months"
                value={context.timeline}
                onChange={(e) => setContext({ ...context, timeline: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">
                Product Description
              </label>
              <textarea
                placeholder="What does your product do? Who is it for?"
                value={context.productDescription}
                onChange={(e) => setContext({ ...context, productDescription: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-foreground/20 text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Target Users
              </label>
              <input
                type="text"
                placeholder="e.g., SMB teams, enterprise, developers"
                value={context.targetUsers}
                onChange={(e) => setContext({ ...context, targetUsers: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Current Goal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., increase retention, grow revenue, reduce churn"
                value={context.currentGoal}
                onChange={(e) => setContext({ ...context, currentGoal: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">
                Constraints
              </label>
              <textarea
                placeholder="e.g., 2 engineers, no backend changes, must ship before conference"
                value={context.constraints}
                onChange={(e) => setContext({ ...context, constraints: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-foreground/20 text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Features to Prioritize</h2>
          <p className="text-sm text-muted mb-4">
            Order these from highest to lowest priority. Drag to reorder.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className="rounded-xl border border-border bg-background overflow-hidden"
            >
              {/* Feature Header - Always visible */}
              <div className="flex gap-3 p-4">
                <div className="flex flex-col gap-1 justify-center">
                  <button
                    onClick={() => moveFeature(index, "up")}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-foreground/5 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-muted text-center font-medium">
                    #{index + 1}
                  </span>
                  <button
                    onClick={() => moveFeature(index, "down")}
                    disabled={index === features.length - 1}
                    className="p-1 rounded hover:bg-foreground/5 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Feature name"
                    value={feature.name}
                    onChange={(e) => updateFeature(feature.id, "name", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-foreground/20 font-medium"
                  />

                  {/* Quick tags when collapsed */}
                  {!expandedFeatures.has(feature.id) && (feature.effort || feature.confidence) && (
                    <div className="flex gap-2 mt-2">
                      {feature.effort && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getEffortColor(feature.effort)}`}>
                          {feature.effort} effort
                        </span>
                      )}
                      {feature.confidence && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getConfidenceColor(feature.confidence)}`}>
                          {feature.confidence} confidence
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleFeatureExpanded(feature.id)}
                    className="p-2 h-fit rounded hover:bg-foreground/5 text-muted hover:text-foreground"
                  >
                    {expandedFeatures.has(feature.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => removeFeature(feature.id)}
                    disabled={features.length === 1}
                    className="p-2 h-fit rounded hover:bg-foreground/5 disabled:opacity-30 disabled:cursor-not-allowed text-muted hover:text-foreground"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Feature Details - Expandable */}
              {expandedFeatures.has(feature.id) && (
                <div className="px-4 pb-4 pt-0 border-t border-border bg-foreground/[0.01]">
                  <div className="pt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Description
                      </label>
                      <textarea
                        placeholder="What does this feature do? Be specific."
                        value={feature.description}
                        onChange={(e) => updateFeature(feature.id, "description", e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-foreground/20 text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        User Impact
                      </label>
                      <textarea
                        placeholder="How does this benefit users? What problem does it solve? Any data supporting this?"
                        value={feature.userImpact}
                        onChange={(e) => updateFeature(feature.id, "userImpact", e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-foreground/20 text-sm resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">
                          Engineering Effort
                        </label>
                        <select
                          value={feature.effort}
                          onChange={(e) => updateFeature(feature.id, "effort", e.target.value)}
                          className={`w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 text-sm ${feature.effort ? getEffortColor(feature.effort) : 'border-border'}`}
                        >
                          <option value="">Select effort...</option>
                          <option value="low">Low (days)</option>
                          <option value="medium">Medium (1-2 weeks)</option>
                          <option value="high">High (weeks+)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1.5">
                          Confidence Level
                        </label>
                        <select
                          value={feature.confidence}
                          onChange={(e) => updateFeature(feature.id, "confidence", e.target.value)}
                          className={`w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 text-sm ${feature.confidence ? getConfidenceColor(feature.confidence) : 'border-border'}`}
                        >
                          <option value="">Select confidence...</option>
                          <option value="high">High (validated)</option>
                          <option value="medium">Medium (some signals)</option>
                          <option value="low">Low (gut feeling)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Why This Priority?
                      </label>
                      <textarea
                        placeholder="Why is this ranked here and not higher or lower? What tradeoffs did you consider?"
                        value={feature.reasoning}
                        onChange={(e) => updateFeature(feature.id, "reasoning", e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-foreground/20 text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Feature Button */}
        <button
          onClick={addFeature}
          className="w-full py-3 rounded-lg border border-dashed border-border hover:border-foreground/30 hover:bg-foreground/5 transition-colors flex items-center justify-center gap-2 text-muted hover:text-foreground"
        >
          <Plus className="w-4 h-4" />
          Add Feature
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full mt-6 py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing your priorities...
            </>
          ) : (
            <>
              <Swords className="w-4 h-4" />
              Challenge My Priorities
            </>
          )}
        </button>

        {/* Debate Results */}
        {debate && (
          <div className="mt-10 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">The Debate</h2>
              <button
                onClick={reset}
                className="flex items-center gap-2 text-sm text-muted hover:text-foreground"
              >
                <RotateCcw className="w-4 h-4" />
                Start Over
              </button>
            </div>

            {/* Overall Assessment */}
            {debate.overallAssessment && (
              <div className="p-4 rounded-xl border border-border bg-foreground/[0.02]">
                <h3 className="text-sm font-medium uppercase tracking-wider text-muted mb-2">
                  Overall Assessment
                </h3>
                <p className="text-sm">{debate.overallAssessment}</p>
              </div>
            )}

            {/* Challenges */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted">
                Challenges to Your Ranking
              </h3>
              {debate.challenges.map((challenge, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border bg-foreground/[0.02]"
                >
                  <div className="font-medium mb-2">{challenge.feature}</div>
                  <p className="text-muted text-sm mb-3">{challenge.challenge}</p>
                  <div className="text-sm">
                    <span className="font-medium">Alternative view: </span>
                    <span className="text-muted">{challenge.alternativePerspective}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Blind Spots */}
            {debate.blindSpots.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium uppercase tracking-wider text-muted">
                  Blind Spots Identified
                </h3>
                <ul className="space-y-2">
                  {debate.blindSpots.map((spot, index) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <span className="text-muted">•</span>
                      <span>{spot}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Questions to Ask */}
            {debate.questionsToAsk.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium uppercase tracking-wider text-muted">
                  Questions to Ask Stakeholders
                </h3>
                <ul className="space-y-2">
                  {debate.questionsToAsk.map((question, index) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <span className="text-muted">{index + 1}.</span>
                      <span>{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Revised Ranking */}
            {debate.revisedRanking && debate.revisedRanking.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium uppercase tracking-wider text-muted">
                  Alternative Ranking to Consider
                </h3>
                <div className="space-y-2">
                  {debate.revisedRanking.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-3 p-3 rounded-lg border border-border"
                    >
                      <span className="text-muted font-medium">#{index + 1}</span>
                      <div>
                        <div className="font-medium">{item.feature}</div>
                        <div className="text-sm text-muted">{item.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border text-center text-sm text-muted">
          Built by{" "}
          <a
            href="https://manuelfernandes.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Manuel Fernandes
          </a>
        </div>
      </div>
    </div>
  );
}
