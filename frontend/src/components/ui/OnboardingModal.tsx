import { User as UserIcon, Calendar, VenusAndMars } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export function OnboardingModal() {
  const { user, profile, isLoading, refreshProfile } = useAuth();
  
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // The modal should show if the user exists but hasn't set their name, age, or gender.
  // It also catches users whose profile row was entirely deleted.
  const isProfileIncomplete = !isLoading && user && (
    !profile ||
    !profile.name || 
    profile.age === null || 
    profile.age === undefined || 
    !profile.gender
  );
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-fill name if Google provided it
  useEffect(() => {
    if (!name) {
      setName(profile?.name || user?.user_metadata?.full_name || "");
    }
  }, [profile, user, name]);

  if (!mounted || !isProfileIncomplete) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Use UPSERT so that if the user completely deleted their row in the table editor, we recreate it!
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          name: name.trim() || null,
          age: age ? parseInt(age, 10) : null,
          gender: gender || null,
        });
        
      if (updateError) throw updateError;
      
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-canvas/90 backdrop-blur-md animate-fade-in">
      <div className="relative z-10 w-full max-w-md p-8 overflow-hidden border shadow-2xl glass-strong rounded-3xl animate-slide-up">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none bg-amber-glow/20 blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none bg-lavender/20 blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 flex flex-col items-center mb-6">
          <div className="grid mb-4 rounded-2xl size-14 bg-gradient-to-br from-amber-glow to-coral place-items-center glow-amber">
            <UserIcon className="size-6 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight font-display text-foreground text-center">
            Welcome to TextStream!
          </h2>
          <p className="mt-2 text-sm font-medium text-center text-muted-foreground">
            Let's finish setting up your profile so the AI can perfectly tailor its responses to you.
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
                required
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
                required
                min="1"
                max="120"
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
                required
                className="w-full py-3 pl-10 pr-4 text-sm transition border outline-none appearance-none bg-secondary/35 border-border/50 rounded-2xl text-foreground focus:ring-1 focus:ring-amber-glow/60 focus:border-amber-glow"
              >
                <option value="" disabled className="bg-canvas text-muted-foreground">Select your gender</option>
                <option value="Prefer not to say" className="bg-canvas text-foreground">Prefer not to say</option>
                <option value="Male" className="bg-canvas text-foreground">Male</option>
                <option value="Female" className="bg-canvas text-foreground">Female</option>
                <option value="Other" className="bg-canvas text-foreground">Other</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving || !name || !age || !gender}
            className="w-full py-3.5 mt-4 text-sm font-bold text-white transition rounded-2xl bg-gradient-to-r from-amber-glow to-coral glow-amber hover:brightness-110 hover:scale-[1.02] cursor-pointer disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
