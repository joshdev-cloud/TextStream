import { useState, useRef, useEffect } from "react";
import { X, Search, Loader2, BookOpen, Download } from "lucide-react";

interface SearchResult {
  title: string;
  summary: string;
  authors: string[];
  pdf_url: string;
}

interface WebSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngest: (title: string, pdfUrl: string) => Promise<void>;
}

export function WebSearchModal({ isOpen, onClose, onIngest }: WebSearchModalProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [ingestingUrl, setIngestingUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setIngestingUrl(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;
    
    setIsSearching(true);
    setResults([]);
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/search_arxiv?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
      alert("Search failed. Check your connection to the backend.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleIngestClick = async (result: SearchResult) => {
    setIngestingUrl(result.pdf_url);
    try {
      await onIngest(result.title, result.pdf_url);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to ingest the PDF.");
    } finally {
      setIngestingUrl(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-canvas/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="glass-strong border border-border/50 rounded-3xl w-full max-w-2xl overflow-hidden relative z-10 animate-pop-in shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-border/30 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-display font-extrabold text-lg text-foreground flex items-center gap-2">
              <BookOpen className="size-5 text-amber-glow" />
              Academic Web Search
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Powered by ArXiv. Search for papers and select which to use as sources.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="size-8 rounded-full glass hover:bg-secondary/70 grid place-items-center transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 shrink-0 border-b border-border/30 bg-secondary/10">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Attention is all you need, Quantum entanglement..."
                className="w-full bg-secondary/35 border border-border/50 rounded-2xl pl-12 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-amber-glow focus:ring-1 focus:ring-amber-glow transition-all"
                disabled={isSearching}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="px-5 py-3 bg-gradient-to-r from-amber-glow to-coral text-white text-sm font-bold rounded-2xl flex items-center gap-2 hover:brightness-110 transition glow-amber disabled:opacity-50 shrink-0"
            >
              {isSearching ? <Loader2 className="size-4 animate-spin" /> : "Search"}
            </button>
          </form>
        </div>

        <div className="overflow-y-auto p-4 space-y-3 bg-canvas/30">
          {isSearching && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-8 animate-spin mb-4 text-amber-glow" />
              <p className="text-sm font-semibold">Searching academic databases...</p>
            </div>
          )}
          
          {!isSearching && results.length === 0 && query && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No results found. Try a different query.
            </div>
          )}

          {!isSearching && results.map((result, idx) => (
            <div key={idx} className="glass rounded-2xl p-4 border border-border/40 hover:border-amber-glow/50 transition-colors group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-foreground text-sm leading-tight mb-1">{result.title}</h4>
                  <p className="text-[10px] text-amber-glow font-medium mb-2 uppercase tracking-wide">
                    {result.authors.join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {result.summary}
                  </p>
                </div>
                <button
                  onClick={() => handleIngestClick(result)}
                  disabled={ingestingUrl !== null}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-secondary hover:bg-amber-glow/10 hover:text-amber-glow transition text-xs font-bold border border-border/50 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {ingestingUrl === result.pdf_url ? (
                    <><Loader2 className="size-3.5 animate-spin" /> Ingesting</>
                  ) : (
                    <><Download className="size-3.5" /> Add as Source</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
