import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-semibold " +
      "transition-all duration-150 " +
      "disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none " +
      "active:translate-y-[2px] active:shadow-none";

    const variants = {
      primary:
        "bg-[--accent] text-[--on-accent] border-2 border-[--ink-0] shadow-[4px_4px_0_0_var(--ink-0)] hover:shadow-[2px_2px_0_0_var(--ink-0)] hover:translate-x-[2px] hover:translate-y-[2px]",
      secondary:
        "bg-white text-[--ink-0] border-2 border-[--ink-0] shadow-[4px_4px_0_0_var(--ink-0)] hover:shadow-[2px_2px_0_0_var(--ink-0)] hover:translate-x-[2px] hover:translate-y-[2px]",
      ghost:
        "bg-transparent text-[--ink-1] hover:text-[--ink-0]",
    };

    const sizes = {
      sm: "h-9 px-4 text-[12px] uppercase tracking-wider",
      md: "h-11 px-5 text-[13px] uppercase tracking-wider",
      lg: "h-14 px-8 text-[14px] uppercase tracking-wider",
    };

    return (
      <button
        ref={ref}
        data-cursor="snap"
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
