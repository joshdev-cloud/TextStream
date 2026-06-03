/**
 * EngineCard — AI engine selection card for the engine picker popup.
 *
 * Displays an AI engine option with icon, description, and active state.
 * Used inside AiEnginePopup.
 */

import type { ReactNode } from "react";
import { Check } from "lucide-react";

interface EngineCardProps {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  iconBg: string;
  title: string;
  sub: string;
  body: string;
  accent: "lavender" | "amber";
}

export function EngineCard({
  active,
  onClick,
  icon,
  iconBg,
  title,
  sub,
  body,
  accent,
}: EngineCardProps) {
  const ring =
    accent === "lavender"
      ? "ring-lavender/60 glow-lavender"
      : "ring-amber-glow/60 glow-amber";

  return (
    <button
      onClick={onClick}
      className={`text-left rounded-3xl p-5 glass hover:scale-[1.02] transition ${
        active ? `ring-2 ${ring}` : ""
      }`}
    >
      <div className={`size-12 rounded-2xl grid place-items-center ${iconBg}`}>
        {icon}
      </div>
      <h4 className="mt-4 font-display font-bold text-lg">{title}</h4>
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
        {sub}
      </p>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
      {active && (
        <div className="mt-3 inline-flex items-center gap-1 text-xs text-mint font-semibold">
          <Check className="size-3.5" /> Active
        </div>
      )}
    </button>
  );
}
