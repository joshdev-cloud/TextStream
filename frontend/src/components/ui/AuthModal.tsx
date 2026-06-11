import { X, Sparkles, Mail, Lock, Github, Chrome } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-md animate-fade-in">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-label="Close Modal Overlay"
      />
      <div className="relative z-10 w-full max-w-md p-8 overflow-hidden border shadow-2xl glass-strong rounded-3xl animate-slide-up">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none bg-amber-glow/20 blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none bg-lavender/20 blur-3xl translate-y-1/2 -translate-x-1/4" />

        <button
          onClick={onClose}
          className="absolute flex items-center justify-center transition rounded-full top-4 right-4 size-8 glass hover:bg-secondary/60 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X className="size-4" />
        </button>

        <div className="relative z-10 flex flex-col items-center mb-8">
          <div className="grid mb-4 rounded-2xl size-14 bg-gradient-to-br from-amber-glow to-coral place-items-center glow-amber">
            <Sparkles className="size-6 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight font-display text-foreground">
            Welcome to TextStream
          </h2>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Sign in to access your synchronized workspaces.
          </p>
        </div>

        <form className="relative z-10 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1">
            <label className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 size-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full py-3 pl-10 pr-4 text-sm transition border outline-none bg-secondary/35 border-border/50 rounded-2xl placeholder:text-muted-foreground focus:ring-1 focus:ring-amber-glow/60 focus:border-amber-glow"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 size-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-3 pl-10 pr-4 text-sm transition border outline-none bg-secondary/35 border-border/50 rounded-2xl placeholder:text-muted-foreground focus:ring-1 focus:ring-amber-glow/60 focus:border-amber-glow"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="rounded bg-secondary/50 border-border/50 text-amber-glow focus:ring-amber-glow/50 cursor-pointer" />
              <span className="font-medium transition text-muted-foreground group-hover:text-foreground">Remember me</span>
            </label>
            <button type="button" className="font-semibold transition text-amber-glow hover:text-amber-glow/80 cursor-pointer">
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 mt-2 text-sm font-bold text-white transition rounded-2xl bg-gradient-to-r from-amber-glow to-coral glow-amber hover:brightness-110 hover:scale-[1.02] cursor-pointer"
          >
            Sign In
          </button>
        </form>

        <div className="relative z-10 flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border/40" />
          <span className="text-xs font-semibold uppercase text-muted-foreground">Or continue with</span>
          <div className="flex-1 h-px bg-border/40" />
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-3">
          <button type="button" className="flex items-center justify-center gap-2 py-3 text-sm font-semibold transition border glass rounded-2xl border-border/40 hover:bg-secondary/60 cursor-pointer text-foreground">
            <Github className="size-4" /> GitHub
          </button>
          <button type="button" className="flex items-center justify-center gap-2 py-3 text-sm font-semibold transition border glass rounded-2xl border-border/40 hover:bg-secondary/60 cursor-pointer text-foreground">
            <Chrome className="size-4" /> Google
          </button>
        </div>
        
        <p className="relative z-10 mt-8 text-xs text-center text-muted-foreground">
          Don't have an account?{" "}
          <button type="button" className="font-bold transition text-foreground hover:text-amber-glow cursor-pointer">
            Create an account
          </button>
        </p>
      </div>
    </div>,
    document.body
  );
}
