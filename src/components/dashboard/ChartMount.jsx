"use client";

import { useEffect, useState } from "react";

export default function ChartMount({ children, className = "h-full w-full" }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={className} aria-hidden="true" />;
  }

  return <>{children}</>;
}
