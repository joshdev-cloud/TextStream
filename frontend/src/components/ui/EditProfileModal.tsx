import { X, User as UserIcon, Calendar, VenusAndMars } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && profile) {
      setName(profile.name || "");
      setAge(profile.age ? profile.age.toString() : "");
      setGender(profile.gender || "");
      setError(null);
    }
  }, [isOpen, profile]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: name.trim() || null,
          age: age ? parseInt(age, 10) : null,
          gender: gender || null,
        })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      await refreshProfile();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-md animate-fade-in">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-label="Close Modal Overlay"
      />
      <div className="relative z-10 w-full max-w-md p-8 overflow-hidden border shadow-2xl glass-strong rounded-3xl animate-slide-up">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none bg-amber-glow/20 blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none bg-lavender/20 blur-3xl translate-y-1/2 -translate-x-1/4" />

        <button
          onClick={onClose}
          className="absolute flex items-center justify-center transition rounded-full top-4 right-4 size-8 glass hover:bg-secondary/60 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X className="size-4" />
        </button>

        <div className="relative z-10 flex flex-col items-center mb-6">
          <div className="grid mb-4 rounded-2xl size-14 bg-gradient-to-br from-amber-glow to-coral place-items-center glow-amber">
            <UserIcon className="size-6 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight font-display text-foreground">
            Edit Profile
          </h2>
          <p className="mt-2 text-sm font-medium text-center text-muted-foreground">
            Customize how TextStream's AI interacts with you.
          </p>
        </div>

        <form className="relative z-10 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-xs font-semibold rounded-xl bg-coral/10 text-coral">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground">
              Preferred Name
            </label>
            <div className="relative flex items-center">
              <UserIcon className="absolute left-3 size-4 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should we call you?"
                className="w-full py-3 pl-10 pr-4 text-sm transition border outline-none bg-secondary/35 border-border/50 rounded-2xl placeholder:text-muted-foreground focus:ring-1 focus:ring-amber-glow/60 focus:border-amber-glow"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground">
              Age
            </label>
            <div className="relative flex items-center">
              <Calendar className="absolute left-3 size-4 text-muted-foreground" />
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Your age"
                className="w-full py-3 pl-10 pr-4 text-sm transition border outline-none bg-secondary/35 border-border/50 rounded-2xl placeholder:text-muted-foreground focus:ring-1 focus:ring-amber-glow/60 focus:border-amber-glow"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground">
              Gender
            </label>
            <div className="relative flex items-center">
              <VenusAndMars className="absolute left-3 size-4 text-muted-foreground" />
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full py-3 pl-10 pr-4 text-sm transition border outline-none appearance-none bg-secondary/35 border-border/50 rounded-2xl text-foreground focus:ring-1 focus:ring-amber-glow/60 focus:border-amber-glow"
              >
                <option value="">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3.5 mt-4 text-sm font-bold text-white transition rounded-2xl bg-gradient-to-r from-amber-glow to-coral glow-amber hover:brightness-110 hover:scale-[1.02] cursor-pointer disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
