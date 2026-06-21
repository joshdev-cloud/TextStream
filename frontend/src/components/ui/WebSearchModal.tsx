import { useState, useRef, useEffect } from "react";
import { X, Search, Loader2, BookOpen } from "lucide-react";

interface WebSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => Promise<void>;
}

export function WebSearchModal({ isOpen, onClose, onSearch }: WebSearchModalProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;
    
    setIsSearching(true);
    try {
      await onSearch(query);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Search failed or no PDF found.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-canvas/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="glass-strong border border-border/50 rounded-3xl w-full max-w-lg overflow-hidden relative z-10 animate-pop-in shadow-2xl">
        <div className="p-6 border-b border-border/30 flex items-center justify-between">
          <div>
            <h3 className="font-display font-extrabold text-lg text-foreground flex items-center gap-2">
              <BookOpen className="size-5 text-amber-glow" />
              Search Web for PDFs
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Powered by ArXiv. Enter a topic to find and ingest an academic paper.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="size-8 rounded-full glass hover:bg-secondary/70 grid place-items-center transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Quantum computing, Neural networks..."
              className="w-full bg-secondary/35 border border-border/50 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-foreground focus:outline-none focus:border-amber-glow focus:ring-1 focus:ring-amber-glow transition-all"
              disabled={isSearching}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSearching}
              className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="px-5 py-2 bg-gradient-to-r from-amber-glow to-coral text-white text-sm font-bold rounded-xl flex items-center gap-2 hover:brightness-110 transition glow-amber disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search & Ingest"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
