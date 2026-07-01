import { useEffect, useState } from "react";

// Elapsed-time based count-up: converges to target even if rAF is throttled.
export function useCountUp(target, duration = 1200, start = 0) {
  const [val, setVal] = useState(start);
  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      setVal(Math.round(start + (target - start) * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return val;
}
