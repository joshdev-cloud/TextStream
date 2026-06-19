import { X, Trash2, Folder, AlertCircle } from "lucide-react";

export function StorageLimitModal({
  isOpen,
  onClose,
  onDeleteSession,
  onDeletePdf,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDeleteSession: () => void;
  onDeletePdf: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-canvas/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="glass-strong border border-border/50 rounded-3xl w-full max-w-md overflow-hidden relative z-10 animate-pop-in shadow-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="size-12 rounded-2xl bg-coral/10 text-coral flex items-center justify-center shrink-0">
            <AlertCircle className="size-6" />
          </div>
          <button 
            onClick={onClose}
            className="size-8 rounded-full glass hover:bg-secondary/70 grid place-items-center transition"
          >
            <X className="size-4" />
          </button>
        </div>
        
        <h3 className="font-display font-extrabold text-xl text-foreground mb-2">
          Storage Limit Reached
        </h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          You've reached the global cap of 50 PDFs. To save local disk space and keep your study space lightning fast, you need to free up space before uploading more documents.
        </p>

        <div className="space-y-3">
          <button
            onClick={onDeletePdf}
            className="w-full p-4 rounded-xl border border-border/40 bg-secondary/20 hover:bg-secondary/40 flex items-center gap-4 transition group text-left"
          >
            <div className="size-10 rounded-lg bg-amber-glow/10 text-amber-glow grid place-items-center shrink-0 group-hover:scale-110 transition-transform">
              <Folder className="size-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">Manage Global Vault</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Delete old or unused PDFs permanently.</p>
            </div>
          </button>

          <button
            onClick={onDeleteSession}
            className="w-full p-4 rounded-xl border border-border/40 bg-secondary/20 hover:bg-secondary/40 flex items-center gap-4 transition group text-left"
          >
            <div className="size-10 rounded-lg bg-coral/10 text-coral grid place-items-center shrink-0 group-hover:scale-110 transition-transform">
              <Trash2 className="size-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">Delete a Session</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Remove an old study session and its indexes.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
