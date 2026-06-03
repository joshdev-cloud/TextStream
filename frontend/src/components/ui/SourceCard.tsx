/**
 * SourceCard — Document file card with active/inactive toggle.
 *
 * Displays a document name, page count, and a toggle switch.
 * Used in the file vault section of the Workspace.
 *
 * TODO: EDIT HERE — The onToggle callback is where you'll
 * dispatch state changes that persist to the backend.
 */

import { FileText } from "lucide-react";

interface SourceCardProps {
  name: string;
  pages: number;
  active: boolean;
  onToggle: () => void;
}

export function SourceCard({ name, pages, active, onToggle }: SourceCardProps) {
  return (
    <div
      className={`rounded-2xl p-4 flex items-center gap-3 border transition ${
        active
          ? "bg-amber-glow/10 border-amber-glow/40 glow-amber"
          : "bg-muted/30 border-border"
      }`}
    >
      <div
        className={`size-10 rounded-xl grid place-items-center ${
          active
            ? "bg-amber-glow text-primary-foreground"
            : "bg-secondary text-muted-foreground"
        }`}
      >
        <FileText className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{name}</p>
        <p className="text-xs text-muted-foreground">{pages} pages indexed</p>
      </div>
      <button
        onClick={onToggle}
        aria-label={`Toggle ${name}`}
        className={`w-12 h-7 rounded-full relative transition ${
          active ? "bg-amber-glow" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 size-6 rounded-full bg-white transition-all ${
            active ? "left-[26px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
