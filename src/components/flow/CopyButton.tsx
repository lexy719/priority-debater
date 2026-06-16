"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

type CopyButtonProps = {
  text: string;
  label?: string;
  testid?: string;
};

export function CopyButton({ text, label = "Copy", testid }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard may be blocked in some contexts; still flash the state
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      data-testid={testid}
      className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] border border-black/30 hover:border-black px-2.5 py-1.5 transition-colors shrink-0 bg-white/60 hover:bg-white"
    >
      {copied ? <Check size={12} className="text-[#32d74b]" /> : <Copy size={12} />}
      {copied ? "Copied" : label}
    </button>
  );
}
