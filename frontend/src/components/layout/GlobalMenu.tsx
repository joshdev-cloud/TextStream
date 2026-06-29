import { useState, useRef, useEffect } from "react";
import { Menu, LogIn, Settings, HelpCircle, Info, Mail, LogOut, User as UserIcon, FileText } from "lucide-react";
import { AuthModal } from "@/components/ui/AuthModal";
import { InfoModal, type InfoModalType } from "@/components/ui/InfoModal";
import { EditProfileModal } from "@/components/ui/EditProfileModal";
import { TermsModal } from "@/components/ui/TermsModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "@tanstack/react-router";

export function GlobalMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [infoModalType, setInfoModalType] = useState<InfoModalType>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();

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
              {!user ? (
                <button
                  onClick={() => handleAction(() => setShowAuthModal(true))}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition hover:bg-secondary/60 text-foreground cursor-pointer"
                >
                  <LogIn className="size-4 text-amber-glow" />
                  Sign In
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleAction(() => setShowEditProfileModal(true))}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition hover:bg-secondary/60 text-foreground cursor-pointer"
                  >
                    <UserIcon className="size-4 text-amber-glow" />
                    Edit Profile
                  </button>
                  <button
                    onClick={() => handleAction(async () => {
                      await supabase.auth.signOut();
                      navigate({ to: '/login' });
                    })}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition hover:bg-coral/10 text-coral hover:text-coral cursor-pointer"
                  >
                    <LogOut className="size-4" />
                    Log Out
                  </button>
                </>
              )}
              
              <div className="h-px bg-border/40 my-1 mx-2" />

              <button
                onClick={() => handleAction(() => setInfoModalType("preferences"))}
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
                onClick={() => handleAction(() => setShowTermsModal(true))}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition hover:bg-secondary/60 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <FileText className="size-4" />
                Terms & Conditions
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
      <EditProfileModal isOpen={showEditProfileModal} onClose={() => setShowEditProfileModal(false)} />
      <TermsModal open={showTermsModal} onClose={() => setShowTermsModal(false)} />
      <InfoModal type={infoModalType} onClose={() => setInfoModalType(null)} />
    </>
  );
}
