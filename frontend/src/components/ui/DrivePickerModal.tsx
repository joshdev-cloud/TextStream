import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Search, FileText, ChevronRight } from "lucide-react";

interface DrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DrivePickerModal({ isOpen, onClose }: DrivePickerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
    }, 1500);
  };

  const MOCK_FILES = [
    { name: "Biology 101 - Cell Structure.pdf", date: "Oct 12" },
    { name: "History Midterm Review.pdf", date: "Sep 28" },
    { name: "Calculus III Notes.pdf", date: "Nov 02" },
    { name: "Physics Lab Report Final.pdf", date: "Nov 15" },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-label="Close Modal Overlay"
      />
      <div className="relative z-10 w-full max-w-2xl p-6 overflow-hidden border shadow-2xl glass-strong rounded-3xl animate-slide-up border-white/20 min-h-[400px] flex flex-col">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none bg-blue-500/10 blur-3xl -translate-y-1/2 translate-x-1/4" />
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Google Drive" className="size-6" />
            <h2 className="text-xl font-bold tracking-tight font-display text-foreground">
              Google Drive
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center transition rounded-full size-8 glass hover:bg-secondary/60 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {!isConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
            <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Google Drive" className="size-20 mb-6 opacity-90 drop-shadow-lg" />
            <h3 className="text-lg font-bold text-foreground mb-2">Connect to Google Drive</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-8">
              Link your Google Drive account to seamlessly import PDFs and documents directly into your TextStream workspaces.
            </p>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex items-center gap-3 px-6 py-3 font-bold text-sm bg-white text-black rounded-2xl hover:bg-gray-100 transition cursor-pointer shadow-md"
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G" className="size-5" />
              {isConnecting ? "Connecting..." : "Sign in with Google"}
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col relative z-10">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Search in Drive"
                className="w-full py-2.5 pl-10 pr-4 text-sm transition border outline-none bg-secondary/35 border-border/50 rounded-xl placeholder:text-muted-foreground focus:ring-1 focus:ring-amber-glow/60 focus:border-amber-glow"
              />
            </div>
            
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-3 px-1">
              <span>My Drive</span>
              <ChevronRight className="size-3" />
              <span className="text-foreground">TextStream Docs</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {MOCK_FILES.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/40 transition cursor-pointer border border-transparent hover:border-border/50 group">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-coral/10 grid place-items-center text-coral">
                      <FileText className="size-4" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{file.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition">{file.date}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border/40 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-secondary/60 transition text-muted-foreground hover:text-foreground cursor-pointer">
                Cancel
              </button>
              <button 
                onClick={onClose} 
                className="px-6 py-2 text-sm font-bold text-white transition rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:brightness-110 cursor-pointer shadow-md"
              >
                Import Selected
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
