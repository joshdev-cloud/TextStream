import { useState, useRef, useEffect } from "react";
import { Upload, HardDrive, Paperclip, Loader2 } from "lucide-react";
import { DrivePickerModal } from "./DrivePickerModal";

export type UploadVariant = "dashboard" | "workspace";

interface UploadMenuProps {
  variant: UploadVariant;
  onLocalUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading?: boolean;
}

export function UploadMenu({ variant, onLocalUpload, isUploading }: UploadMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLocalClick = () => {
    setIsOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDriveClick = () => {
    setIsOpen(false);
    setShowDriveModal(true);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        {variant === "dashboard" ? (
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={isUploading}
            className={`glass rounded-2xl px-4 py-2 border border-border/50 text-xs font-semibold cursor-pointer hover:bg-secondary/45 transition flex items-center gap-2 ${
              isUploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="size-3.5 text-amber-glow animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="size-3.5 text-amber-glow" />
                Upload PDF
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={isUploading}
            title="Attach file"
            className={`size-10 grid place-items-center rounded-full glass hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0 ${
              isUploading ? "opacity-50 pointer-events-none" : ""
            } ${isOpen ? "bg-secondary/60 ring-1 ring-border/50" : ""}`}
          >
            {isUploading ? <Loader2 className="size-4 animate-spin text-amber-glow" /> : <Paperclip className="size-4" />}
          </button>
        )}

        {isOpen && (
          <div className={`absolute z-50 w-56 p-2 border shadow-xl glass-strong rounded-2xl border-border/40 animate-fade-in ${
            variant === "workspace" ? "bottom-full left-0 mb-2" : "top-full left-0 mt-2"
          }`}>
            <div className="space-y-1">
              <button
                onClick={handleLocalClick}
                className="flex items-center w-full gap-3 px-3 py-2 text-sm font-medium transition cursor-pointer rounded-xl hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
              >
                <HardDrive className="size-4 text-mint" />
                Local Folder
              </button>
              <button
                onClick={handleDriveClick}
                className="flex items-center w-full gap-3 px-3 py-2 text-sm font-medium transition cursor-pointer rounded-xl hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Google Drive" className="size-4 opacity-80" />
                Google Drive
              </button>
            </div>
          </div>
        )}

        <input
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          ref={fileInputRef}
          onChange={onLocalUpload}
          disabled={isUploading}
        />
      </div>

      <DrivePickerModal 
        isOpen={showDriveModal} 
        onClose={() => setShowDriveModal(false)} 
      />
    </>
  );
}
