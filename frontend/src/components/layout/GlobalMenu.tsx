import { useState, useRef, useEffect } from "react";
import { Menu, LogIn, Settings, HelpCircle, Info, Mail } from "lucide-react";
import { AuthModal } from "@/components/ui/AuthModal";
import { InfoModal, type InfoModalType } from "@/components/ui/InfoModal";

export function GlobalMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [infoModalType, setInfoModalType] = useState<InfoModalType>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
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

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`size-9 grid place-items-center glass rounded-2xl hover:bg-secondary/60 transition text-foreground cursor-pointer ${
            isOpen ? "bg-secondary/60 ring-1 ring-border/50" : ""
          }`}
          aria-label="Open Settings Menu"
        >
          <Menu className="size-4" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-56 rounded-2xl p-2 glass-strong border border-border/40 shadow-xl animate-fade-in z-50">
            <div className="space-y-1">
              <button
                onClick={() => handleAction(() => setShowAuthModal(true))}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition hover:bg-secondary/60 text-foreground cursor-pointer"
              >
                <LogIn className="size-4 text-amber-glow" />
                Sign In
              </button>
              
              <div className="h-px bg-border/40 my-1 mx-2" />

              <button
                onClick={() => handleAction(() => {})} // Settings mock - no action right now
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition hover:bg-secondary/60 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Settings className="size-4" />
                Preferences
              </button>
              
              <button
                onClick={() => handleAction(() => setInfoModalType("help"))}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition hover:bg-secondary/60 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <HelpCircle className="size-4" />
                Help & Support
              </button>
              
              <button
                onClick={() => handleAction(() => setInfoModalType("contact"))}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition hover:bg-secondary/60 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Mail className="size-4" />
                Contact Us
              </button>
              
              <button
                onClick={() => handleAction(() => setInfoModalType("info"))}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition hover:bg-secondary/60 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Info className="size-4" />
                About
              </button>
            </div>
          </div>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <InfoModal type={infoModalType} onClose={() => setInfoModalType(null)} />
    </>
  );
}
