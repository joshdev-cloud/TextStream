/**
 * EvidenceBadge — Inline citation pill with hover tooltip.
 *
 * Displays a compact file + page reference. On hover, reveals a
 * glassmorphic tooltip with the full quoted snippet.
 *
 * TODO: EDIT HERE — The file/page/snippet props will eventually
 * come from the API response's citation metadata.
 */

import { FileText, Quote } from "lucide-react";

interface EvidenceBadgeProps {
  file: string;
  page: number;
  snippet: string;
}

export function EvidenceBadge({ file, page, snippet }: EvidenceBadgeProps) {
  return (
    <div className="relative group">
      <button className="inline-flex items-center gap-1.5 text-xs font-medium glass rounded-full px-3 py-1.5 hover:bg-secondary/70 transition">
        <FileText className="size-3.5 text-amber-glow" />
        {file} · Page {page}
      </button>
      <div className="absolute left-0 top-full mt-2 w-72 glass-strong rounded-2xl p-4 text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 animate-slide-down">
        <Quote className="size-3.5 text-amber-glow mb-1.5" />
        <p className="italic text-muted-foreground leading-relaxed">
          &quot;{snippet}&quot;
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-wider text-amber-glow font-semibold">
          {file} · pg {page}
        </p>
      </div>
    </div>
  );
}
