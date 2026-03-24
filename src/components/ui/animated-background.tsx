"use client";

import { useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   Aurora Background (Aceternity-style)
   Flowing Northern Lights gradient animation
   ───────────────────────────────────────────── */

export function AuroraBackground({
  className,
  showRadialGradient = true,
}: {
  className?: string;
  showRadialGradient?: boolean;
}) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
      aria-hidden="true"
    >
      <div
        className={cn(
          `absolute -inset-[10px] opacity-[0.65] will-change-transform`,
          `[--aurora:repeating-linear-gradient(100deg,#6366f1_10%,#818cf8_15%,#6366f1_20%,#a78bfa_25%,#7c3aed_30%)]`,
          `[background-image:repeating-linear-gradient(100deg,#08080e_0%,#08080e_7%,transparent_10%,transparent_12%,#08080e_16%),var(--aurora)]`,
          `[background-size:300%,_200%]`,
          `[background-position:50%_50%,50%_50%]`,
          `blur-[10px]`,
          `after:content-[''] after:absolute after:inset-0`,
          `after:[background-image:repeating-linear-gradient(100deg,#08080e_0%,#08080e_7%,transparent_10%,transparent_12%,#08080e_16%),var(--aurora)]`,
          `after:[background-size:200%,_100%]`,
          `after:animate-aurora after:mix-blend-difference`,
          showRadialGradient &&
            `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]`
        )}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Gradient Mesh — animated floating orbs
   ───────────────────────────────────────────── */

export function GradientMesh({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
      aria-hidden="true"
    >
      <div className="animate-mesh-float-1 absolute -top-[40%] left-[10%] h-[80vh] w-[80vh] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)] blur-3xl" />
      <div className="animate-mesh-float-2 absolute -bottom-[30%] right-[5%] h-[70vh] w-[70vh] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.12)_0%,transparent_70%)] blur-3xl" />
      <div className="animate-mesh-float-3 absolute top-[20%] right-[30%] h-[50vh] w-[50vh] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.08)_0%,transparent_70%)] blur-3xl" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Full-Page Starfield — fixed position background
   Interactive particles spanning entire viewport
   with depth layers and nebula glow
   ───────────────────────────────────────────── */

export function StarfieldBackground({
  className,
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const w = () => window.innerWidth;
    const h = () => window.innerHeight;

    // Three depth layers of particles
    interface Star {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      r: number;
      vx: number;
      vy: number;
      opacity: number;
      magnetism: number;
      color: string;
      layer: number; // 0=far, 1=mid, 2=near
      twinkleSpeed: number;
      twinklePhase: number;
    }

    const colors = [
      "99,102,241",   // indigo
      "139,92,246",   // violet
      "167,139,250",  // light violet
      "165,180,252",  // light indigo
      "236,72,153",   // pink
      "59,130,246",   // blue
      "147,197,253",  // light blue
    ];

    const totalParticles = 120;
    const stars: Star[] = Array.from({ length: totalParticles }, (_, i) => {
      const layer = i < 40 ? 0 : i < 85 ? 1 : 2;
      const speedMult = [0.15, 0.3, 0.5][layer];
      const sizeMult = [0.8, 1.4, 2.2][layer];
      const x = Math.random() * w();
      const y = Math.random() * h();
      return {
        x,
        y,
        baseX: x,
        baseY: y,
        r: (Math.random() * 1.5 + 0.5) * sizeMult,
        vx: (Math.random() - 0.5) * speedMult,
        vy: (Math.random() - 0.5) * speedMult,
        opacity: Math.random() * 0.5 + 0.15,
        magnetism: [0.15, 0.4, 0.9][layer],
        color: colors[Math.floor(Math.random() * colors.length)],
        layer,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
      };
    });

    let t = 0;
    const magneticRadius = 280;
    const magneticStrength = 0.1;

    const draw = () => {
      const W = w();
      const H = h();
      ctx.clearRect(0, 0, W, H);
      t += 1;

      const mouse = mouseRef.current;

      for (const p of stars) {
        // Natural drift
        p.baseX += p.vx;
        p.baseY += p.vy;
        if (p.baseX < -20) p.baseX = W + 20;
        if (p.baseX > W + 20) p.baseX = -20;
        if (p.baseY < -20) p.baseY = H + 20;
        if (p.baseY > H + 20) p.baseY = -20;

        // Magnetic attraction
        if (mouse.active) {
          const dx = mouse.x - p.baseX;
          const dy = mouse.y - p.baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < magneticRadius) {
            const force = (1 - dist / magneticRadius) * magneticStrength * p.magnetism;
            p.x = p.baseX + dx * force * 3;
            p.y = p.baseY + dy * force * 3;
          } else {
            p.x += (p.baseX - p.x) * 0.04;
            p.y += (p.baseY - p.y) * 0.04;
          }
        } else {
          p.x += (p.baseX - p.x) * 0.04;
          p.y += (p.baseY - p.y) * 0.04;
        }

        // Twinkle
        const twinkle = 0.5 + 0.5 * Math.sin(t * p.twinkleSpeed + p.twinklePhase);
        let drawOpacity = p.opacity * (0.6 + 0.4 * twinkle);
        let drawRadius = p.r;

        // Glow near cursor
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < magneticRadius) {
            const proximity = 1 - dist / magneticRadius;
            drawOpacity = Math.min(1, drawOpacity + proximity * 0.5);
            drawRadius += proximity * 2;
          }
        }

        // Draw with glow for near-layer particles
        if (p.layer === 2 && drawRadius > 2) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, drawRadius * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color},${drawOpacity * 0.08})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, drawRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${drawOpacity})`;
        ctx.fill();
      }

      // Draw connections only for near-layer particles
      const nearStars = stars.filter((s) => s.layer >= 1);
      for (let i = 0; i < nearStars.length; i++) {
        for (let j = i + 1; j < nearStars.length; j++) {
          const dx = nearStars[i].x - nearStars[j].x;
          const dy = nearStars[i].y - nearStars[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            let lineOpacity = 0.07 * (1 - dist / 160);
            if (mouse.active) {
              const midX = (nearStars[i].x + nearStars[j].x) / 2;
              const midY = (nearStars[i].y + nearStars[j].y) / 2;
              const toCursor = Math.sqrt((mouse.x - midX) ** 2 + (mouse.y - midY) ** 2);
              if (toCursor < magneticRadius) {
                lineOpacity += 0.2 * (1 - toCursor / magneticRadius);
              }
            }
            ctx.beginPath();
            ctx.moveTo(nearStars[i].x, nearStars[i].y);
            ctx.lineTo(nearStars[j].x, nearStars[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${lineOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Cursor aurora glow
      if (mouse.active) {
        const gradient = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, 200
        );
        gradient.addColorStop(0, "rgba(99,102,241,0.06)");
        gradient.addColorStop(0.5, "rgba(139,92,246,0.03)");
        gradient.addColorStop(1, "rgba(99,102,241,0)");
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 200, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    const handleMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const handleLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn("fixed inset-0 z-0 h-screen w-screen", className)}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
}

/* ─────────────────────────────────────────────
   Interactive Particle Field
   Particles are MAGNETIC to cursor — they get
   attracted/repelled based on mouse position.
   Connections glow brighter near the cursor.
   ───────────────────────────────────────────── */

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  r: number;
  vx: number;
  vy: number;
  opacity: number;
  magnetism: number; // how strongly it reacts to cursor
  color: string;
}

export function InteractiveParticles({
  className,
  count = 60,
  color = "99,102,241",
  connectionDistance = 150,
  magneticRadius = 200,
  magneticStrength = 0.08,
}: {
  className?: string;
  count?: number;
  color?: string;
  connectionDistance?: number;
  magneticRadius?: number;
  magneticStrength?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.active = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const w = () => canvas.width / dpr;
    const h = () => canvas.height / dpr;

    // Create particles with varying magnetism
    const particles: Particle[] = Array.from({ length: count }, () => {
      const x = Math.random() * w();
      const y = Math.random() * h();
      return {
        x,
        y,
        baseX: x,
        baseY: y,
        r: Math.random() * 2.5 + 1.2,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.35,
        magnetism: Math.random() * 0.8 + 0.2,
        color: Math.random() > 0.7
          ? "167,139,250"  // brighter violet
          : Math.random() > 0.5
            ? "165,180,252" // brighter indigo
            : color,
      };
    });

    const draw = () => {
      const W = w();
      const H = h();
      ctx.clearRect(0, 0, W, H);

      const mouse = mouseRef.current;

      for (const p of particles) {
        // Natural drift
        p.baseX += p.vx;
        p.baseY += p.vy;

        // Wrap around edges
        if (p.baseX < -10) p.baseX = W + 10;
        if (p.baseX > W + 10) p.baseX = -10;
        if (p.baseY < -10) p.baseY = H + 10;
        if (p.baseY > H + 10) p.baseY = -10;

        // Magnetic attraction to cursor
        if (mouse.active) {
          const dx = mouse.x - p.baseX;
          const dy = mouse.y - p.baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < magneticRadius) {
            const force = (1 - dist / magneticRadius) * magneticStrength * p.magnetism;
            p.x = p.baseX + dx * force * 3;
            p.y = p.baseY + dy * force * 3;
          } else {
            // Ease back to base position
            p.x += (p.baseX - p.x) * 0.05;
            p.y += (p.baseY - p.y) * 0.05;
          }
        } else {
          p.x += (p.baseX - p.x) * 0.05;
          p.y += (p.baseY - p.y) * 0.05;
        }

        // Draw particle with glow near cursor
        let drawOpacity = p.opacity;
        let drawRadius = p.r;

        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < magneticRadius) {
            const proximity = 1 - dist / magneticRadius;
            drawOpacity = Math.min(1, p.opacity + proximity * 0.6);
            drawRadius = p.r + proximity * 1.5;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, drawRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${drawOpacity})`;
        ctx.fill();
      }

      // Draw connections — brighter near cursor
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            let lineOpacity = 0.12 * (1 - dist / connectionDistance);

            // Boost opacity if connection is near cursor
            if (mouse.active) {
              const midX = (particles[i].x + particles[j].x) / 2;
              const midY = (particles[i].y + particles[j].y) / 2;
              const toCursor = Math.sqrt(
                (mouse.x - midX) ** 2 + (mouse.y - midY) ** 2
              );
              if (toCursor < magneticRadius) {
                lineOpacity += 0.25 * (1 - toCursor / magneticRadius);
              }
            }

            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${color},${lineOpacity})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Cursor glow ring
      if (mouse.active) {
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, magneticRadius * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color},0.04)`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    // Listen on the parent so it catches cursor over the whole section
    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener("mousemove", handleMouseMove);
      parent.addEventListener("mouseleave", handleMouseLeave);
    }
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      if (parent) {
        parent.removeEventListener("mousemove", handleMouseMove);
        parent.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [count, color, connectionDistance, magneticRadius, magneticStrength, handleMouseMove, handleMouseLeave]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 -z-10 h-full w-full", className)}
      aria-hidden="true"
    />
  );
}

/* ─────────────────────────────────────────────
   Old ParticleField (non-interactive, lighter)
   Kept for pages that don't need interactivity
   ───────────────────────────────────────────── */

export function ParticleField({
  className,
  count = 40,
}: {
  className?: string;
  count?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width / dpr,
      y: Math.random() * canvas.height / dpr,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.4 + 0.1,
    }));

    const draw = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148,163,184,${p.opacity})`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none absolute inset-0 -z-10 h-full w-full", className)}
      aria-hidden="true"
    />
  );
}

/* ─────────────────────────────────────────────
   Spotlight — follows cursor on hover
   ───────────────────────────────────────────── */

export function Spotlight({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    const handleMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      el.style.setProperty("--x", `${e.clientX - rect.left}px`);
      el.style.setProperty("--y", `${e.clientY - rect.top}px`);
      el.style.opacity = "1";
    };

    const handleLeave = () => {
      el.style.opacity = "0";
    };

    parent.addEventListener("mousemove", handleMove);
    parent.addEventListener("mouseleave", handleLeave);
    return () => {
      parent.removeEventListener("mousemove", handleMove);
      parent.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "pointer-events-none absolute -z-10 h-[300px] w-[300px] rounded-full opacity-0 transition-opacity duration-500",
        "bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)]",
        className
      )}
      style={{
        left: "var(--x, 50%)",
        top: "var(--y, 50%)",
        transform: "translate(-50%, -50%)",
      }}
      aria-hidden="true"
    />
  );
}

/* ─────────────────────────────────────────────
   Grid pattern background
   ───────────────────────────────────────────── */

export function GridPattern({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 -z-10", className)}
      aria-hidden="true"
      style={{
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
      }}
    />
  );
}
