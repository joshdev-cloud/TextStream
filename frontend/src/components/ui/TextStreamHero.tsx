/**
 * TextStreamHero — Interactive floating-text canvas for the login page hero panel.
 *
 * Renders study-themed words that drift across the canvas and react to mouse
 * movement with a magnetic glow / scale effect. Auto-animates when idle.
 *
 * Uses a 2D canvas for lightweight, high-performance rendering (no Three.js).
 */

import { useEffect, useRef, useCallback } from "react";

/* ── Configuration ────────────────────────────────────────────── */

const WORDS = [
  "Summarize", "Research", "AI Tutor", "Quiz", "Focus",
  "Study", "Learn", "PDF", "Notes", "Flashcards",
  "Analyze", "Review", "Outline", "Highlight", "Explore",
  "Discover", "Engage", "Master", "Practice", "Retain",
  "Annotate", "Cite", "Draft", "Brainstorm", "Comprehend",
];

const COLORS = [
  { r: 255, g: 191, b: 36 },   // amber-glow
  { r: 160, g: 120, b: 255 },  // lavender
  { r: 100, g: 220, b: 180 },  // mint
  { r: 255, g: 120, b: 100 },  // coral
  { r: 200, g: 180, b: 255 },  // soft purple
  { r: 255, g: 210, b: 120 },  // warm gold
];

interface Particle {
  word: string;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  color: { r: number; g: number; b: number };
  alpha: number;
  baseAlpha: number;
  phaseOffset: number;
  driftAngle: number;
  driftSpeed: number;
  driftRadius: number;
}

interface TextStreamHeroProps {
  className?: string;
}

export function TextStreamHero({ className = "" }: TextStreamHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);

  const MAGNET_RADIUS = 180;
  const GLOW_RADIUS = 250;

  /* ── Create particles ─────────────────────────────────────── */
  const initParticles = useCallback((width: number, height: number) => {
    const count = Math.max(12, Math.min(28, Math.floor((width * height) / 25000)));
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const x = Math.random() * width;
      const y = Math.random() * height;
      const baseSize = 13 + Math.random() * 11;

      particles.push({
        word: WORDS[i % WORDS.length],
        x, y,
        baseX: x,
        baseY: y,
        vx: 0,
        vy: 0,
        size: baseSize,
        baseSize,
        color,
        alpha: 0.12 + Math.random() * 0.22,
        baseAlpha: 0.12 + Math.random() * 0.22,
        phaseOffset: Math.random() * Math.PI * 2,
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: 0.0003 + Math.random() * 0.0006,
        driftRadius: 30 + Math.random() * 60,
      });
    }

    particlesRef.current = particles;
  }, []);

  /* ── Animation loop ────────────────────────────────────────── */
  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dt = lastTimeRef.current ? (timestamp - lastTimeRef.current) : 16;
    lastTimeRef.current = timestamp;
    timeRef.current += dt;
    const t = timeRef.current * 0.001;

    const w = canvas.width;
    const h = canvas.height;
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(dpr, dpr);

    const displayW = w / dpr;
    const displayH = h / dpr;

    const mouse = mouseRef.current;
    const particles = particlesRef.current;

    for (const p of particles) {
      // Orbital drift
      p.driftAngle += p.driftSpeed * dt;
      const driftX = p.baseX + Math.cos(p.driftAngle) * p.driftRadius;
      const driftY = p.baseY + Math.sin(p.driftAngle * 0.7 + p.phaseOffset) * p.driftRadius * 0.6;

      // Target position (drift orbit)
      let targetX = driftX;
      let targetY = driftY;

      // Mouse interaction
      let proximity = 0;
      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < GLOW_RADIUS) {
          proximity = 1 - dist / GLOW_RADIUS;
        }

        // Magnetic attraction — pull words gently toward cursor
        if (dist < MAGNET_RADIUS && dist > 20) {
          const force = (1 - dist / MAGNET_RADIUS) * 0.35;
          targetX = p.x + (mouse.x - p.x) * force;
          targetY = p.y + (mouse.y - p.y) * force;
        }
      }

      // Spring physics toward target
      const springK = 0.015;
      const damping = 0.92;
      p.vx += (targetX - p.x) * springK;
      p.vy += (targetY - p.y) * springK;
      p.vx *= damping;
      p.vy *= damping;
      p.x += p.vx;
      p.y += p.vy;

      // Keep in bounds (with soft wrapping)
      if (p.x < -100) { p.x = displayW + 80; p.baseX = p.x; }
      if (p.x > displayW + 100) { p.x = -80; p.baseX = p.x; }
      if (p.y < -80) { p.y = displayH + 60; p.baseY = p.y; }
      if (p.y > displayH + 80) { p.y = -60; p.baseY = p.y; }

      // Visual properties based on proximity
      const glowIntensity = proximity;
      const targetAlpha = p.baseAlpha + glowIntensity * 0.65;
      const targetSize = p.baseSize + glowIntensity * 6;
      p.alpha += (targetAlpha - p.alpha) * 0.08;
      p.size += (targetSize - p.size) * 0.08;

      // Idle pulse
      const pulse = Math.sin(t * 1.2 + p.phaseOffset) * 0.04;
      const finalAlpha = Math.min(1, p.alpha + pulse);

      // Draw the word
      ctx.save();

      // Glow effect for nearby words
      if (glowIntensity > 0.05) {
        ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${glowIntensity * 0.6})`;
        ctx.shadowBlur = 20 + glowIntensity * 25;
      }

      ctx.font = `${glowIntensity > 0.3 ? 600 : 400} ${Math.round(p.size)}px "Inter", sans-serif`;
      ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${finalAlpha})`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.word, p.x, p.y);

      ctx.restore();
    }

    ctx.restore();
    animationRef.current = requestAnimationFrame(animate);
  }, []);

  /* ── Setup / teardown ─────────────────────────────────────── */
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      initParticles(rect.width, rect.height);
    };

    resize();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { ...mouseRef.current, active: false };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = container.getBoundingClientRect();
        mouseRef.current = {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
          active: true,
        };
      }
    };

    const handleTouchEnd = () => {
      mouseRef.current = { ...mouseRef.current, active: false };
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [animate, initParticles]);

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: "none" }}
      />
    </div>
  );
}
