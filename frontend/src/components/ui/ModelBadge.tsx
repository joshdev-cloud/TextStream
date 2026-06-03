/**
 * ModelBadge — AI engine status indicator pill.
 *
 * Displays the currently active AI model (Velocity Core or Deep Thinker)
 * as a compact badge. Clicking opens the AI engine selector popup.
 */

import { Zap, Compass, ChevronRight } from "lucide-react";

export type ModelKey = "velocity" | "deep";

interface ModelBadgeProps {
  model: ModelKey;
  onClick: () => void;
}

export function ModelBadge({ model, onClick }: ModelBadgeProps) {
  const isVel = model === "velocity";

  return (
    <button
      onClick={onClick}
      className={`glass rounded-full pl-2 pr-4 py-1.5 flex items-center gap-2 text-sm font-semibold hover:scale-[1.02] transition ${
        isVel ? "glow-lavender" : "glow-amber"
      }`}
    >
      <span
        className={`size-6 rounded-full grid place-items-center ${
          isVel ? "bg-lavender" : "bg-amber-glow"
        }`}
      >
        {isVel ? (
          <Zap className="size-3.5 text-white" />
        ) : (
          <Compass className="size-3.5 text-primary-foreground" />
        )}
      </span>
      <span>{isVel ? "Velocity Core" : "Deep Thinker"}</span>
      <ChevronRight className="size-3.5 text-muted-foreground" />
    </button>
  );
}
