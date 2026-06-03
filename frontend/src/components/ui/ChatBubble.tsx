/**
 * ChatBubble — Styled message bubble for user and AI conversations.
 *
 * Renders differently based on role:
 *   - "user" → right-aligned lavender bubble
 *   - "ai"   → left-aligned with sparkle icon and glass background
 */

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

interface ChatBubbleProps {
  role: "user" | "ai";
  children: ReactNode;
}

export function ChatBubble({ role, children }: ChatBubbleProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-3xl rounded-tr-md px-5 py-3 bg-lavender text-white text-sm shadow-lavender">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="size-9 rounded-2xl bg-amber-glow/20 border border-amber-glow/30 grid place-items-center shrink-0">
        <Sparkles className="size-4 text-amber-glow" />
      </div>
      <div className="max-w-[85%] glass rounded-3xl rounded-tl-md px-5 py-4 text-sm">
        {children}
      </div>
    </div>
  );
}
