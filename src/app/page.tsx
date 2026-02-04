"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Swords, Loader2, RotateCcw } from "lucide-react";

interface Feature {
  id: string;
  name: string;
  reasoning: string;
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
}

export default function Home() {
  const [features, setFeatures] = useState<Feature[]>([
    { id: "1", name: "", reasoning: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [debate, setDebate] = useState<DebateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addFeature = () => {
    setFeatures([
      ...features,
      { id: Date.now().toString(), name: "", reasoning: "" },
    ]);
  };

  const removeFeature = (id: string) => {
    if (features.length > 1) {
      setFeatures(features.filter((f) => f.id !== id));
    }
  };

  const updateFeature = (id: string, field: "name" | "reasoning", value: string) => {
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

    setIsLoading(true);
    setError(null);
    setDebate(null);

    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: validFeatures }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate debate");
      }

      const data = await response.json();
      setDebate(data);
    } catch (err) {
      setError("Something went wrong. Check your API key or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setFeatures([{ id: "1", name: "", reasoning: "" }]);
    setDebate(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-foreground/5">
              <Swords className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-semibold">Priority Debater</h1>
          </div>
          <p className="text-muted text-base">
            Add your features in priority order. AI will challenge your ranking
            and force you to defend your decisions.
          </p>
        </div>

        {/* Features Input */}
        <div className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className="flex gap-3 p-4 rounded-lg border border-border bg-background"
            >
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

              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  placeholder="Feature name"
                  value={feature.name}
                  onChange={(e) => updateFeature(feature.id, "name", e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
                <textarea
                  placeholder="Why is this the right priority? (optional but helps)"
                  value={feature.reasoning}
                  onChange={(e) => updateFeature(feature.id, "reasoning", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-foreground/20 text-sm resize-none"
                />
              </div>

              <button
                onClick={() => removeFeature(feature.id)}
                disabled={features.length === 1}
                className="p-2 h-fit rounded hover:bg-foreground/5 disabled:opacity-30 disabled:cursor-not-allowed text-muted hover:text-foreground"
              >
                <Trash2 className="w-4 h-4" />
              </button>
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
