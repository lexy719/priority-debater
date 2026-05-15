import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type PersonaName = "Investor" | "Customer" | "Operator" | "Adversary" | "Mentor";

interface PersonaMarkProps extends HTMLAttributes<HTMLDivElement> {
  persona: PersonaName;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const monogram: Record<PersonaName, string> = {
  Investor: "I",
  Customer: "C",
  Operator: "O",
  Adversary: "A",
  Mentor: "M",
};

export function PersonaMark({ persona, size = "md", className = "", ...props }: PersonaMarkProps) {
  const sizes = {
    sm: "w-8 h-8 text-[20px]",
    md: "w-12 h-12 text-[28px]",
    lg: "w-16 h-16 text-[40px]",
    xl: "w-24 h-24 text-[64px]",
    "2xl": "w-40 h-40 text-[120px]",
  };
  return (
    <div
      className={cn(
        "shrink-0 grid place-items-center bg-[--surface-1] border border-[--line] rounded-[--radius]",
        "font-serif text-[--ink-0] leading-none",
        sizes[size],
        className
      )}
      aria-label={persona}
      {...props}
    >
      <span style={{ transform: "translateY(-2px)" }}>{monogram[persona]}</span>
    </div>
  );
}
