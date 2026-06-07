/**
 * ChatBubble — Styled message bubble for user and AI conversations.
 *
 * Renders differently based on role:
 *   - "user" → right-aligned lavender bubble
 *   - "ai"   → left-aligned with sparkle icon and glass background
 *
 * Includes a formatted timestamp beneath each message.
 */

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

interface ChatBubbleProps {
  role: "user" | "ai";
  children: ReactNode;
  timestamp?: string; // ISO date string
}

/**
 * Format an ISO timestamp into a human-friendly relative or absolute label.
 * - "Just now" for < 1 minute ago
 * - "2m ago", "15m ago" for < 1 hour
 * - "Today at 3:45 PM" for same day
 * - "Yesterday at 3:45 PM"
 * - "Jun 7 at 3:45 PM" for older
 */
function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const timeStr = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.floor(
    (today.getTime() - msgDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (dayDiff === 0) return `Today at ${timeStr}`;
  if (dayDiff === 1) return `Yesterday at ${timeStr}`;

  const monthStr = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
  return `${monthStr} at ${timeStr}`;
}

export function ChatBubble({ role, children, timestamp }: ChatBubbleProps) {
  const timeLabel = timestamp ? formatTimestamp(timestamp) : null;

  if (role === "user") {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="max-w-[80%] rounded-3xl rounded-tr-md px-5 py-3 bg-lavender text-white text-sm shadow-lavender">
          {children}
        </div>
        {timeLabel && (
          <span className="text-[10px] text-muted-foreground/60 px-2 select-none">
            {timeLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex gap-3">
        <div className="size-9 rounded-2xl bg-amber-glow/20 border border-amber-glow/30 grid place-items-center shrink-0">
          <Sparkles className="size-4 text-amber-glow" />
        </div>
        <div className="max-w-[85%] glass rounded-3xl rounded-tl-md px-5 py-4 text-sm">
          {children}
        </div>
      </div>
      {timeLabel && (
        <span className="text-[10px] text-muted-foreground/60 ml-12 select-none">
          {timeLabel}
        </span>
      )}
    </div>
  );
}
