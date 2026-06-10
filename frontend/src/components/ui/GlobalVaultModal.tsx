import { useState } from "react";
import { X, RefreshCw, FileText, Trash2, BookOpen, PlusCircle, Loader2 } from "lucide-react";
import { useDocumentManager } from "@/hooks/useDocumentManager";
import { syncLocalDocuments, uploadLocalDocument } from "@/lib/api/document.functions";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { UploadMenu } from "./UploadMenu";

export function GlobalVaultModal() {
  const {
    documents,
    showGlobalVaultModal,
    toggleGlobalVault,
    syncDocuments,
    addDocument,
    deleteDocument,
    setActiveSessionId,
    sessions,
  } = useDocumentManager();

  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const routerState = useRouterState();
  const isWorkspace = routerState.location.pathname === "/workspace";

  if (!showGlobalVaultModal) return null;

  // Trigger server-side scan of backend/documents/
  const handleScanDirectory = async () => {
    setIsScanning(true);
    try {
      const result = await syncLocalDocuments();
      if (result && result.length > 0) {
        // Convert dates and shape to match client Document structure
        const mappedDocs = result.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          pages: doc.pages,
          active: doc.active,
          uploadedAt: doc.uploadedAt,
          paragraphs: doc.paragraphs,
        }));
        syncDocuments(mappedDocs);
      }
    } catch (err) {
      console.error("Scan folder sync failed:", err);
    } finally {
      setIsScanning(false);
    }
  };

  // Upload file directly into the global vault
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = (reader.result as string).split(",")[1];
        
        const result = await uploadLocalDocument({
          data: {
            fileName: file.name,
            fileBase64: base64String,
          },
        });
        
        if (result && result.success) {
          const newDoc = {
            id: `doc-${Date.now()}`,
            name: file.name,
            pages: result.pages,
            active: true,
            uploadedAt: new Date().toISOString(),
            paragraphs: result.paragraphs,
          };
          addDocument(newDoc);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  // Open PDF directly in Screen Reader Viewport
  const handleReadPdf = (docId: string) => {
    // If not in workspace, set the first session active and navigate to workspace
    if (!isWorkspace) {
      const activeSess = sessions.find((s) => s.status === "active") || sessions[0];
      if (activeSess) {
        setActiveSessionId(activeSess.id);
      }
      navigate({ to: "/workspace" });
    }
    
    // Close modal
    toggleGlobalVault(false);
    
    // Set sessionStorage variable so Workspace knows which doc to open immediately on mount
    if (typeof window !== "undefined") {
      sessionStorage.setItem("textstream_default_viewport_doc", docId);
      // Dispatch a storage trigger or window event to let Workspace load it immediately
      window.dispatchEvent(new Event("storage_default_doc"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark backdrop */}
      <div 
        className="absolute inset-0 bg-canvas/80 backdrop-blur-sm"
        onClick={() => toggleGlobalVault(false)}
      />

      {/* Modal Box */}
      <div className="glass-strong border border-border/50 rounded-3xl w-full max-w-2xl overflow-hidden relative z-10 flex flex-col max-h-[85vh] animate-pop-in shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-border/30 flex items-center justify-between">
          <div>
            <h3 className="font-display font-extrabold text-lg text-foreground flex items-center gap-2">
              📦 TextStream Global Vault
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scan host directory or upload files to synchronize your textbook database.
            </p>
          </div>
          <button 
            onClick={() => toggleGlobalVault(false)}
            className="size-8 rounded-full glass hover:bg-secondary/70 grid place-items-center transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scan & Upload Toolbar */}
        <div className="px-6 py-4 bg-secondary/20 border-b border-border/20 flex flex-wrap gap-3 items-center justify-between">
          <button
            onClick={handleScanDirectory}
            disabled={isScanning}
            className="px-4 py-2 bg-amber-glow hover:brightness-110 text-primary-foreground font-bold text-xs rounded-xl flex items-center gap-2 transition glow-amber disabled:opacity-50"
          >
            {isScanning ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            {isScanning ? "Scanning Folder..." : "Scan & Sync Folder"}
          </button>

          <div>
            <UploadMenu 
              variant="vault"
              onLocalUpload={handleFileUpload}
              isUploading={isUploading}
            />
          </div>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {documents.length > 0 ? (
            documents.map((doc) => (
              <div 
                key={doc.id} 
                className="flex items-center justify-between p-3 border border-border/40 bg-secondary/10 hover:bg-secondary/25 rounded-2xl transition"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                  <div className="size-9 rounded-xl bg-amber-glow/10 text-amber-glow grid place-items-center shrink-0">
                    <FileText className="size-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate max-w-[280px]">
                      {doc.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <span>{doc.pages} pages</span>
                      <span>·</span>
                      <span>Discovered: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReadPdf(doc.id)}
                    className="px-2.5 py-1.5 bg-mint/15 text-mint hover:bg-mint hover:text-white font-bold text-[10px] rounded-lg transition"
                  >
                    Read PDF
                  </button>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    title="Remove from system"
                    className="size-7 rounded-lg bg-coral/10 text-coral hover:bg-coral hover:text-white grid place-items-center transition"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 border border-dashed border-border/30 rounded-2xl">
              <BookOpen className="size-10 text-muted-foreground/60 mx-auto mb-2 animate-pulse" />
              <h4 className="font-semibold text-sm text-foreground">Global Vault Empty</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 leading-relaxed">
                Click <strong>Scan & Sync Folder</strong> to automatically read files placed in backend/documents, or upload files directly.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-muted/20 border-t border-border/30 text-[10px] text-muted-foreground text-center">
          Files are mirrored in your local <code>backend/documents</code> folder on disk.
        </div>
      </div>
    </div>
  );
}
