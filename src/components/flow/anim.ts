// Shared motion variants for staggered editorial reveals on the flow pages.
import type { Variants } from "framer-motion";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const reveal: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: EASE },
  }),
};

export const viewport = { once: true, margin: "-80px" } as const;
