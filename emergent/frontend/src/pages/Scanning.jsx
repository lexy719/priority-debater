import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MinimalNav } from "../components/Nav";

const LINES = [
  "Found your store... colchaoemma.pt",
  "Scanning what ChatGPT knows about mattresses in Portugal...",
  "Asking AI where buyers should shop...",
  "Checking if AI agents can read your catalog...",
  "Comparing you against 4 competitors found in search...",
];

const STEP = 800; // ms between lines

export default function Scanning() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(0);
  const [showScore, setShowScore] = useState(false);

  useEffect(() => {
    const timers = [];
    LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisible(i + 1), STEP * (i + 1)));
    });
    const scoreAt = STEP * (LINES.length + 1);
    timers.push(setTimeout(() => setShowScore(true), scoreAt));
    timers.push(setTimeout(() => navigate("/commerce/verdict"), scoreAt + 2200));
    return () => timers.forEach(clearTimeout);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <MinimalNav />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-[760px]">
          {!showScore && (
            <div className="pd-label mb-8" data-testid="scanning-label">
              → SCANNING / READING YOUR STORE
            </div>
          )}

          {!showScore && (
            <div className="space-y-4 font-mono text-sm" data-testid="scan-lines">
              {LINES.slice(0, visible).map((line, i) => {
                const isLast = i === visible - 1;
                return (
                  <div
                    key={line}
                    className="flex items-start gap-3 pd-fade"
                    data-testid={`scan-line-${i}`}
                  >
                    <span className="text-[#2d6bff] w-3 shrink-0">→</span>
                    <span className="text-white">
                      {line}
                      {isLast && (
                        <span className="text-[#2d6bff] pd-pulse ml-1">▋</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {showScore && (
            <div className="text-center pd-fade" data-testid="scan-score-block">
              <div
                className="font-display text-[#e8272a] leading-none text-[clamp(8rem,32vw,18rem)]"
                data-testid="scan-score"
              >
                22
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
