"use client";
import {
  useScroll,
  useTransform,
  motion,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref, data]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 12%", "end 55%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className="w-full font-sans" ref={containerRef}>
      <div ref={ref} className="relative mx-auto max-w-3xl pb-6">
        {data.map((item, index) => (
          <div
            key={index}
            className="relative flex gap-3 pb-10 last:pb-2 md:gap-5 md:pb-12"
          >
            <div className="flex w-7 shrink-0 flex-col items-center md:w-8">
              <div className="z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface md:h-8 md:w-8">
                <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              </div>
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="mb-2 text-base font-bold leading-tight text-foreground md:mb-2.5 md:text-lg">
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}

        <div
          style={{ height: height ? `${height}px` : "100%" }}
          className="absolute left-[13px] top-0 overflow-hidden md:left-[15px] w-[2px] bg-linear-to-b from-transparent from-[0%] via-border to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_8%,black_92%,transparent_100%)]"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] rounded-full bg-linear-to-t from-purple-500 via-blue-500 to-transparent from-[0%] via-[12%]"
          />
        </div>
      </div>
    </div>
  );
};
