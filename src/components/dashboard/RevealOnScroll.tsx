"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Wraps a section so its contents fade + rise into view as the user scrolls
 * to it. Uses Framer Motion's `whileInView` so the animation only runs once.
 */
export default function RevealOnScroll({
    children,
    delay = 0,
    y = 24,
}: {
    children: ReactNode;
    delay?: number;
    y?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
        >
            {children}
        </motion.div>
    );
}
