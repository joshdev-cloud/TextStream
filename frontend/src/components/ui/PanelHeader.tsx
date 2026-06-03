/**
 * PanelHeader — Reusable section header with a colored status dot.
 *
 * Used in both the Chat/Summarizer panel and the Screen Reader Viewport
 * to provide consistent section labeling.
 */

import type { ReactNode } from "react";

export type DotColor = "amber" | "lavender" | "mint" | "coral";

interface PanelHeaderProps {
  label: string;
  dot: DotColor;
  right?: ReactNode;
}

const DOT_COLOR_MAP: Record<DotColor, string> = {
  amber: "bg-amber-glow glow-amber",
  lavender: "bg-lavender glow-lavender",
  mint: "bg-mint glow-mint",
  coral: "bg-coral glow-coral",
};

export function PanelHeader({ label, dot, right }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`size-2.5 rounded-full ${DOT_COLOR_MAP[dot]}`} />
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          {label}
        </h2>
      </div>
      {right}
    </div>
  );
}
