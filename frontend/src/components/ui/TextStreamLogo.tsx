/**
 * TextStreamLogo — The canonical colored bookstack logo for TextStream.
 *
 * Three stacked layers:
 *   Top    → amber  (filled diamond)
 *   Middle → lavender (stroke arc)
 *   Bottom → mint    (stroke arc)
 *
 * Usage:
 *   <TextStreamLogo size="sm" />   // 36x36 container, w-5 h-5 icon
 *   <TextStreamLogo size="md" />   // 44x44 container, w-7 h-7 icon  (navbar default)
 *   <TextStreamLogo size="lg" />   // 80x80 container, w-10 h-10 icon (splash / hero)
 */

interface TextStreamLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { container: "w-9 h-9 rounded-xl",  icon: "w-5 h-5" },
  md: { container: "w-11 h-11 rounded-2xl", icon: "w-7 h-7" },
  lg: { container: "w-20 h-20 rounded-2xl", icon: "w-10 h-10" },
};

export function TextStreamLogo({ size = "md", className = "" }: TextStreamLogoProps) {
  const s = SIZES[size];

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${s.container} ${className}`}
      style={{
        background: "oklch(0.3 0.045 260 / 0.7)",
        backdropFilter: "blur(20px) saturate(140%)",
        border: "1px solid oklch(0.85 0.05 260 / 0.18)",
        boxShadow:
          "0 0 32px -8px oklch(0.78 0.16 75 / 0.45), 0 8px 24px -6px oklch(0 0 0 / 0.4), inset 0 1px 0 0 oklch(1 0 0 / 0.06)",
      }}
    >
      {/* Three-layer bookstack */}
      <svg viewBox="0 0 32 32" className={s.icon} fill="none">
        {/* Top book — amber */}
        <path
          d="M4 10l12-6 12 6-12 6L4 10z"
          fill="oklch(0.78 0.16 75)"
          opacity="0.95"
        />
        {/* Middle book — lavender */}
        <path
          d="M4 16l12 6 12-6"
          stroke="oklch(0.65 0.18 285)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Bottom book — mint */}
        <path
          d="M4 22l12 6 12-6"
          stroke="oklch(0.72 0.16 165)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
