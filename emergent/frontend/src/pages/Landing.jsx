import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, MinimalNav } from "../components/Nav";

const Counter = () => {
  const [n, setN] = useState(2412889);
  useEffect(() => {
    const id = setInterval(() => {
      setN((v) => v + Math.floor(Math.random() * 900) + 300);
    }, 100);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="text-center my-8 sm:my-10" data-testid="live-counter">
      <div className="font-mono text-4xl sm:text-6xl text-[#2d6bff] tabular-nums tracking-tight">
        {n.toLocaleString("en-US")}
      </div>
      <div className="pd-label mt-3">
        Shopping questions answered by AI in the last 60 seconds · it didn't
        mention most stores
      </div>
    </div>
  );
};

export default function Landing() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  const scan = () => navigate("/commerce/scanning");

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <MinimalNav />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-[1100px] w-full text-center">
          <div className="pd-label mb-8" data-testid="hero-label">
            → AI COMMERCE / 2026
          </div>

          <h1
            className="font-display uppercase text-white leading-[0.92] text-[clamp(2.2rem,9vw,7.5rem)]"
            data-testid="hero-headline"
          >
            <span className="block">While you were working on your store,</span>
            <span className="block">AI started recommending</span>
            <span className="block">
              your <Box>competitors</Box>
            </span>
          </h1>

          <p
            className="text-[#888888] text-sm sm:text-base mt-8 max-w-2xl mx-auto"
            data-testid="hero-subtext"
          >
            In the last 60 seconds, ChatGPT answered 2.4 million shopping
            questions. It didn't mention most stores.
          </p>

          <Counter />

          <div
            className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto w-full"
            data-testid="hero-scan-form"
          >
            <input
              className="pd-input flex-1 w-full"
              placeholder="https://yourstore.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && scan()}
              data-testid="hero-url-input"
            />
            <button
              className="pd-btn-primary whitespace-nowrap"
              onClick={scan}
              data-testid="hero-scan-button"
            >
              SEE IF YOURS WAS ONE OF THEM →
            </button>
          </div>
          <div className="pd-label mt-4" data-testid="hero-freeline">
            Free · No signup · 45 seconds
          </div>
        </div>
      </main>
    </div>
  );
}
