import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "@tanstack/react-router";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { TextStreamLogo } from "@/components/ui/TextStreamLogo";

type View = "textstream-signin" | "textstream-signup";

export function LoginPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [loginVisible, setLoginVisible] = useState(false);
  // Default to sign up per user request
  const [view, setView] = useState<View>("textstream-signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleSplashDone = useCallback(() => {
    setShowSplash(false);
    setTimeout(() => setLoginVisible(true), 50);
  }, []);

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

  const handleTextStreamSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      sessionStorage.setItem("textstream_just_logged_in", "1");
      router.navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextStreamSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      setSuccessMsg("Account created! Check your email to confirm your account before signing in.");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashDone} />}

      {/* Background Effects - Using Theme colors instead of hardcoded black, 
          so the body's original gradient shines through */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle radial beam of light - top left */}
        <div className="absolute top-[-30%] left-[-10%] w-[80%] h-[80%] bg-primary/10 blur-[120px] rounded-full mix-blend-screen" />
        {/* Subtle radial beam of light - bottom right */}
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div
        className="relative z-10 min-h-screen flex items-center justify-center p-4"
        style={{
          opacity: loginVisible ? 1 : 0,
          transform: loginVisible ? "scale(1)" : "scale(0.98)",
          transition: "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="w-full max-w-[420px] flex flex-col items-center">
          
          {/* Logo Heading */}
          <div className="flex items-center gap-2 mb-8">
            <TextStreamLogo size="sm" />
            <h1 className="text-xl font-bold text-foreground tracking-wide">
              Text<span className="text-primary">Stream</span>
            </h1>
          </div>

          <div className="w-full text-center mb-8">
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
              {view === "textstream-signup" ? "Welcome" : "Welcome Back"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {view === "textstream-signup" 
                ? "create your textstream account." 
                : "sign in to your textstream account."}
            </p>
          </div>

          {error && (
            <div className="w-full bg-destructive/10 text-destructive text-sm p-3 rounded-xl mb-6 border border-destructive/20 text-center font-medium">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="w-full bg-green-500/10 text-green-500 dark:text-green-400 text-sm p-3 rounded-xl mb-6 border border-green-500/20 text-center font-medium">
              {successMsg}
            </div>
          )}

          <div className="w-full space-y-4">
            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-white hover:bg-white/90 text-black text-sm font-bold transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-2">
              <span className="h-[1px] bg-border flex-1"></span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">or with email</span>
              <span className="h-[1px] bg-border flex-1"></span>
            </div>

            {/* Email Form */}
            <form onSubmit={view === "textstream-signup" ? handleTextStreamSignUp : handleTextStreamSignIn} className="space-y-3">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-background border border-input rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-background border border-input rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="••••••••"
                  minLength={view === "textstream-signup" ? 6 : undefined}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full glass-strong hover:bg-primary/20 text-foreground font-bold py-3.5 px-4 rounded-2xl transition-all duration-200 disabled:opacity-50 mt-2 hover:border-primary/50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                {isLoading 
                  ? (view === "textstream-signup" ? "Creating..." : "Signing in...") 
                  : (view === "textstream-signup" ? "Create Account" : "Sign In")}
              </button>
            </form>
          </div>

          {/* Toggle View Link */}
          <div className="mt-8 text-sm font-medium text-muted-foreground">
            {view === "textstream-signup" ? (
              <>
                Already have an account?{" "}
                <button 
                  onClick={() => { resetForm(); setView("textstream-signin"); }} 
                  className="text-foreground hover:text-primary underline underline-offset-4 decoration-border hover:decoration-primary transition-colors cursor-pointer"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <button 
                  onClick={() => { resetForm(); setView("textstream-signup"); }} 
                  className="text-foreground hover:text-primary underline underline-offset-4 decoration-border hover:decoration-primary transition-colors cursor-pointer"
                >
                  Join now
                </button>
              </>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8 max-w-[280px]">
            By clicking continue, you agree to our{" "}
            <a href="#" className="underline decoration-muted-foreground/50 hover:text-foreground transition-colors">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="underline decoration-muted-foreground/50 hover:text-foreground transition-colors">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </>
  );
}
