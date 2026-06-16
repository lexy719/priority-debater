import type { CSSProperties, ReactNode } from "react";

export const Label = ({ children }: { children: ReactNode }) => (
  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-black/55">{children}</span>
);

export const Card = ({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) => (
  <div className={`bg-white border-[1.5px] border-black shadow-hard-sm p-6 ${className}`} style={style}>
    {children}
  </div>
);
