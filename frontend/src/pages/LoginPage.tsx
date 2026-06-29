import { useState, useCallback, FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "@tanstack/react-router";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { TextStreamLogo } from "@/components/ui/TextStreamLogo";
import { TextStreamHero } from "@/components/ui/TextStreamHero";
import { TermsModal } from "@/components/ui/TermsModal";
import { Sun, Moon, Eye, EyeOff } from "lucide-react";
import { useDocumentStore } from "@/store/documentStore";

type View = "signin" | "signup";

export function LoginPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [loginVisible, setLoginVisible] = useState(false);
  const [view, setView] = useState<View>("signin");

  const router = useRouter();
  const { state, dispatch } = useDocumentStore();
  const isLight = state.theme === "light";

  const handleSplashDone = useCallback(() => {
    setShowSplash(false);
    setTimeout(() => setLoginVisible(true), 50);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashDone} />}

      {/* ── Full-screen split layout ──────────────────────────── */}
      <div
        className="fixed inset-0 z-0"
        style={{
          opacity: loginVisible ? 1 : 0,
          transition: "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="flex flex-col lg:flex-row w-full h-full">

          {/* ─── LEFT: Hero Panel ──────────────────────────────── */}
          <div className="relative hidden lg:flex lg:w-[55%] xl:w-[58%] flex-col items-center justify-center overflow-hidden bg-canvas">
            {/* Gradient background */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "var(--gradient-canvas)", backgroundAttachment: "fixed" }}
            />
            {/* Ambient glows */}
            <div className="absolute top-[-15%] left-[-5%] w-[55%] h-[55%] bg-lavender/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-5%] w-[55%] h-[55%] bg-amber-glow/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Interactive text stream canvas */}
            <TextStreamHero className="absolute inset-0 z-[1]" />

            {/* Centered brand overlay */}
            <div className="relative z-[2] flex flex-col items-center pointer-events-none select-none">
              <TextStreamLogo size="lg" />
              <h1
                className="mt-5 text-4xl xl:text-5xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
              >
                Text<span className="text-amber-glow">Stream</span>
              </h1>
              <p
                className="mt-3 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                AI-powered study workspace
              </p>

              {/* Subtle animated underline */}
              <div className="mt-6 w-32 h-[2px] rounded-full overflow-hidden bg-border/20">
                <div
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, var(--lavender), var(--amber-glow), var(--mint))",
                    animation: "heroShimmer 3s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Login Form Panel ───────────────────────── */}
          <div
            className="relative flex-1 flex flex-col items-center justify-center overflow-y-auto"
            style={{
              background: "var(--gradient-canvas)",
              backgroundAttachment: "fixed",
            }}
          >
            {/* Mobile-only hero banner */}
            <div className="flex lg:hidden flex-col items-center pt-10 pb-4 px-4">
              <div className="relative">
                {/* Mini ambient glow */}
                <div className="absolute -inset-8 bg-amber-glow/8 blur-[40px] rounded-full pointer-events-none" />
                <TextStreamLogo size="lg" />
              </div>
              <h1
                className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Text<span className="text-amber-glow">Stream</span>
              </h1>
              <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                AI-powered study workspace
              </p>
            </div>

            {/* Theme toggle */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
              <button
                onClick={() => dispatch({ type: "TOGGLE_THEME" })}
                className="p-2.5 sm:p-3 rounded-full glass-strong hover:bg-secondary/80 transition-all text-foreground border border-border/50 shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                aria-label="Toggle theme"
              >
                {isLight ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-lavender" />}
              </button>
            </div>

            {/* Form card */}
            <div
              className="w-full max-w-[420px] px-4 sm:px-0 py-6 lg:py-0"
              style={{
                opacity: loginVisible ? 1 : 0,
                transform: loginVisible ? "translateY(0)" : "translateY(12px)",
                transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s",
              }}
            >
              <div className="glass-strong p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-border/50 shadow-2xl">
                {/* Logo heading (desktop only — mobile has it in the banner) */}
                <div className="hidden lg:flex items-center gap-2 mb-6">
                  <TextStreamLogo size="sm" />
                  <h2 className="text-lg font-bold text-foreground tracking-wide">
                    Text<span className="text-amber-glow">Stream</span>
                  </h2>
                </div>

                {view === "signin" ? (
                  <SignInView onSwitchView={() => setView("signup")} router={router} />
                ) : (
                  <SignUpView onSwitchView={() => setView("signin")} router={router} />
                )}
              </div>

              {/* Copyright */}
              <p className="text-center text-[11px] text-muted-foreground/60 mt-4 lg:mt-5">
                © {new Date().getFullYear()} TextStream. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero shimmer animation */}
      <style>{`
        @keyframes heroShimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
      `}</style>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Sign In View
   ═══════════════════════════════════════════════════════════════ */

function SignInView({ onSwitchView, router }: { onSwitchView: () => void; router: any }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      sessionStorage.setItem("textstream_just_logged_in", "1");
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          throw new Error("Invalid credentials or account not found. Please try again or sign up.");
        }
        throw error;
      }
      sessionStorage.setItem("textstream_just_logged_in", "1");
      router.navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message || "Failed to sign in.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="w-full text-center lg:text-left mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-1.5">Welcome back</h2>
        <p className="text-muted-foreground text-sm">Sign in to your TextStream account.</p>
      </div>

      {error && (
        <div className="w-full bg-destructive/10 text-destructive text-sm p-3 rounded-xl mb-5 border border-destructive/20 text-center font-medium">
          {error}
        </div>
      )}

      <div className="w-full space-y-4">
        {/* Google OAuth */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-card hover:bg-secondary/50 border border-border text-foreground text-sm font-bold transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 py-1">
          <span className="h-[1px] bg-border/50 flex-1" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">or with email</span>
          <span className="h-[1px] bg-border/50 flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            placeholder="name@example.com"
            required
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input pr-11"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="login-submit-btn mt-1"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>

      <div className="mt-6 text-sm font-medium text-muted-foreground text-center">
        Don't have an account yet?{" "}
        <button
          onClick={onSwitchView}
          className="text-foreground hover:text-amber-glow underline underline-offset-4 decoration-border/50 hover:decoration-amber-glow transition-colors cursor-pointer"
        >
          Sign up
        </button>
      </div>

      <style>{loginStyles}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Sign Up View
   ═══════════════════════════════════════════════════════════════ */

function SignUpView({ onSwitchView, router }: { onSwitchView: () => void; router: any }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    if (!agreed) {
      setError("You must agree to the Terms and Conditions to create an account.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      sessionStorage.setItem("textstream_just_logged_in", "1");
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google.");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("You must agree to the Terms and Conditions to create an account.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("already registered")) {
          throw new Error("Looks like you already have an account! Please sign in.");
        }
        throw signUpError;
      }

      if (signUpData?.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
        throw new Error("Looks like you already have an account! Please sign in.");
      }

      // Save profile data
      if (signUpData?.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: signUpData.user.id,
          name,
          age: parseInt(age, 10),
          gender,
        });

        if (profileError) {
          console.error("Failed to insert profile:", profileError);
        }
      }

      setSuccessMsg("Account created! Check your email to confirm your account before signing in.");
      setName("");
      setAge("");
      setGender("");
      setEmail("");
      setPassword("");
      setAgreed(false);
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="w-full text-center lg:text-left mb-5">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-1.5">Create Account</h2>
        <p className="text-muted-foreground text-sm">Join TextStream for personalized study tools.</p>
      </div>

      {error && (
        <div className="w-full bg-destructive/10 text-destructive text-sm p-3 rounded-xl mb-4 border border-destructive/20 text-center font-medium">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="w-full bg-green-500/10 text-green-500 dark:text-green-400 text-sm p-3 rounded-xl mb-4 border border-green-500/20 text-center font-medium">
          {successMsg}
        </div>
      )}

      <div className="w-full space-y-3">
        {/* Google OAuth */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-card hover:bg-secondary/50 border border-border text-foreground text-sm font-bold transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign up with Google
        </button>

        <div className="flex items-center gap-3 py-0.5">
          <span className="h-[1px] bg-border/50 flex-1" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">or with email</span>
          <span className="h-[1px] bg-border/50 flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="login-input"
              placeholder="Preferred Name"
              required
            />
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="login-input"
              placeholder="Age"
              min="13"
              max="120"
              required
            />
          </div>

          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="login-input"
            required
          >
            <option value="" disabled className="text-muted-foreground">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            placeholder="name@example.com"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input pr-11"
              placeholder="Password (min 6 chars)"
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-2.5 mt-3 cursor-pointer group p-1">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded border-border/50 text-amber-glow focus:ring-amber-glow/50 bg-secondary/35 cursor-pointer"
            />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition leading-relaxed">
              I agree to the{" "}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setTermsOpen(true); }}
                className="underline decoration-border/50 hover:text-amber-glow hover:decoration-amber-glow transition-colors cursor-pointer font-medium"
              >
                Terms and Conditions
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setTermsOpen(true); }}
                className="underline decoration-border/50 hover:text-amber-glow hover:decoration-amber-glow transition-colors cursor-pointer font-medium"
              >
                Privacy Policy
              </button>.
            </span>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="login-submit-btn mt-2"
          >
            {isLoading ? "Creating..." : "Create Account"}
          </button>
        </form>
      </div>

      <div className="mt-5 text-sm font-medium text-muted-foreground text-center">
        Already have an account?{" "}
        <button
          onClick={onSwitchView}
          className="text-foreground hover:text-amber-glow underline underline-offset-4 decoration-border/50 hover:decoration-amber-glow transition-colors cursor-pointer"
        >
          Sign in
        </button>
      </div>

      {/* Terms & Conditions Modal */}
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />

      <style>{loginStyles}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Shared styles
   ═══════════════════════════════════════════════════════════════ */

const loginStyles = `
  .login-input {
    width: 100%;
    padding: 0.7rem 1rem;
    background: var(--secondary);
    opacity: 0.35;
    border: 1px solid var(--border);
    opacity: 1;
    background: oklch(from var(--secondary) l c h / 0.35);
    border-color: oklch(from var(--border) l c h / 0.5);
    border-radius: 0.85rem;
    font-size: 0.875rem;
    color: var(--foreground);
    transition: all 0.2s ease;
    outline: none;
  }

  .login-input::placeholder {
    color: var(--muted-foreground);
  }

  .login-input:focus {
    border-color: var(--amber-glow);
    box-shadow: 0 0 0 1px var(--amber-glow);
  }

  @media (min-width: 640px) {
    .login-input {
      padding: 0.8rem 1rem;
      border-radius: 1rem;
    }
  }

  .login-submit-btn {
    width: 100%;
    background: linear-gradient(to right, var(--amber-glow), var(--coral));
    color: white;
    font-weight: 700;
    padding: 0.7rem 1rem;
    border-radius: 0.85rem;
    transition: all 0.2s ease;
    cursor: pointer;
    box-shadow: var(--shadow-amber);
  }

  .login-submit-btn:hover:not(:disabled) {
    transform: scale(1.02);
  }

  .login-submit-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .login-submit-btn:disabled {
    opacity: 0.5;
  }

  @media (min-width: 640px) {
    .login-submit-btn {
      padding: 0.85rem 1rem;
      border-radius: 1rem;
    }
  }
`;
