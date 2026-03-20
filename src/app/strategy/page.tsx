"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect legacy /strategy route to unified toolkit
export default function StrategyRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/toolkit?tab=business-strategy");
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#08080e]">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
    </div>
  );
}
