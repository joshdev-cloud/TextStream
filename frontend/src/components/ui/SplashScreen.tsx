import { useEffect, useState } from "react";

type Phase = "enter" | "tagline" | "bar" | "hold" | "fade-out" | "done";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<Phase>("enter");

  useEffect(() => {
    const steps: [Phase, number][] = [
      ["tagline",  600],
      ["bar",      1100],
      ["hold",     1700],
      ["fade-out", 2600],
      ["done",     3200],
    ];
    const timers = steps.map(([p, ms]) => setTimeout(() => setPhase(p), ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase === "done") onComplete();
  }, [phase, onComplete]);

  if (phase === "done") return null;

  const visible = phase !== "enter";
  const barVisible = ["bar", "hold", "fade-out"].includes(phase);
  const barFull    = ["hold", "fade-out"].includes(phase);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "var(--gradient-canvas)",
        backgroundAttachment: "fixed",
        opacity: phase === "fade-out" ? 0 : 1,
        transition: phase === "fade-out" ? "opacity 0.6s ease-in-out" : "none",
      }}
    >
      {/* Ambient glows */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(600px 400px at 30% 40%, oklch(0.65 0.18 285 / 0.18), transparent 70%), " +
            "radial-gradient(500px 350px at 75% 65%, oklch(0.78 0.16 75 / 0.15), transparent 70%)",
        }}
      />

      {/* Logo mark */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1) translateY(0)" : "scale(0.72) translateY(14px)",
          transition: "opacity 0.5s cubic-bezier(0.2,0.9,0.3,1.1), transform 0.5s cubic-bezier(0.2,0.9,0.3,1.1)",
          marginBottom: "20px",
        }}
      >
        <div
          className="relative flex items-center justify-center w-20 h-20 rounded-2xl"
          style={{
            background: "oklch(0.3 0.045 260 / 0.7)",
            backdropFilter: "blur(20px) saturate(140%)",
            border: "1px solid oklch(0.85 0.05 260 / 0.18)",
            boxShadow:
              "0 0 48px -8px oklch(0.78 0.16 75 / 0.55), 0 10px 40px -10px oklch(0 0 0 / 0.5), inset 0 1px 0 0 oklch(1 0 0 / 0.06)",
          }}
        >
          <svg viewBox="0 0 32 32" className="w-10 h-10" fill="none">
            <path d="M4 10l12-6 12 6-12 6L4 10z" fill="oklch(0.78 0.16 75)" opacity="0.95" />
            <path d="M4 16l12 6 12-6" stroke="oklch(0.65 0.18 285)" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M4 22l12 6 12-6" stroke="oklch(0.72 0.16 165)" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Brand name */}
      <h1
        className="text-5xl font-bold tracking-tight"
        style={{
          fontFamily: "var(--font-display)",
          color: "oklch(0.97 0.01 250)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.45s ease-out 0.05s, transform 0.45s ease-out 0.05s",
        }}
      >
        Text<span style={{ color: "oklch(0.78 0.16 75)" }}>Stream</span>
      </h1>

      {/* Tagline */}
      <p
        className="mt-3 text-sm font-medium uppercase tracking-widest"
        style={{
          color: "oklch(0.78 0.025 260)",
          letterSpacing: "0.18em",
          opacity: ["tagline", "bar", "hold", "fade-out"].includes(phase) ? 1 : 0,
          transform: ["tagline", "bar", "hold", "fade-out"].includes(phase) ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
        }}
      >
        AI-powered study workspace
      </p>

      {/* Progress bar */}
      <div
        className="mt-12 overflow-hidden rounded-full"
        style={{
          width: "160px",
          height: "3px",
          background: "oklch(0.85 0.05 260 / 0.15)",
          opacity: barVisible ? 1 : 0,
          transition: "opacity 0.3s ease-out",
        }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.65 0.18 285), oklch(0.78 0.16 75), oklch(0.72 0.16 165))",
            width: barFull ? "100%" : "0%",
            transition: barFull ? "width 0.9s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
          }}
        />
      </div>
    </div>
  );
}
