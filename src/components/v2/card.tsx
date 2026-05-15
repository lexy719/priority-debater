import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "compact" | "default" | "generous" | "none";
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ padding = "default", interactive = false, className = "", children, ...props }, ref) => {
    const paddings = {
      none: "",
      compact: "p-4",
      default: "p-6",
      generous: "p-8",
    };
    return (
      <div
        ref={ref}
        className={cn(
          "bg-[--surface-1] border border-[--line] rounded-[--radius]",
          paddings[padding],
          interactive &&
            "transition-[background-color,border-color] duration-[120ms] hover:bg-[--surface-2] hover:border-[--line-strong] cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";
