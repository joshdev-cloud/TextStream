import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "@tanstack/react-router";
import { SplashScreen } from "@/components/ui/SplashScreen";

type View = "main" | "textstream-signin" | "textstream-signup";

export function LoginPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [loginVisible, setLoginVisible] = useState(false);
  const [view, setView] = useState<View>("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleSplashDone = useCallback(() => {
    setShowSplash(false);
    // Tiny delay so the splash unmounts before login fades in
    setTimeout(() => setLoginVisible(true), 50);
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/workspace` },
      });
      if (error) throw error;
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
      router.navigate({ to: "/workspace" });
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
      {/* Splash screen — renders on top and calls handleSplashDone when finished */}
      {showSplash && <SplashScreen onComplete={handleSplashDone} />}

      {/* Login form — fades in after splash exits */}
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          opacity: loginVisible ? 1 : 0,
          transform: loginVisible ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        }}
      >
        <div className="w-full max-w-md">

        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary-foreground fill-current">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">TextStream</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered study workspace</p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-8">

          {/* ─── MAIN VIEW ─── */}
          {view === "main" && (
            <>
              <h2 className="text-lg font-semibold text-foreground text-center mb-6">
                Sign in to your account
              </h2>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4 border border-destructive/20">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {/* Google */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-input rounded-md bg-background hover:bg-accent text-sm font-medium text-foreground transition-colors disabled:opacity-50"
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
                <div className="flex items-center gap-3 py-1">
                  <span className="h-px bg-border flex-1"></span>
                  <span className="text-xs text-muted-foreground">or use TextStream account</span>
                  <span className="h-px bg-border flex-1"></span>
                </div>

                {/* TextStream Sign In */}
                <button
                  onClick={() => { resetForm(); setView("textstream-signin"); }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-primary/40 rounded-md bg-primary/5 hover:bg-primary/10 text-sm font-medium text-primary transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current flex-shrink-0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  Sign in with TextStream account
                </button>

                {/* TextStream Sign Up */}
                <button
                  onClick={() => { resetForm(); setView("textstream-signup"); }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-border rounded-md bg-background hover:bg-accent text-sm font-medium text-muted-foreground transition-colors"
                >
                  Create a TextStream account
                </button>
              </div>
            </>
          )}

          {/* ─── TEXTSTREAM SIGN IN VIEW ─── */}
          {view === "textstream-signin" && (
            <>
              <button
                onClick={() => { resetForm(); setView("main"); }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back
              </button>

              <h2 className="text-lg font-semibold text-foreground mb-1">Sign in</h2>
              <p className="text-sm text-muted-foreground mb-6">Use your TextStream email and password.</p>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4 border border-destructive/20">
                  {error}
                </div>
              )}

              <form onSubmit={handleTextStreamSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                No account?{" "}
                <button onClick={() => { resetForm(); setView("textstream-signup"); }} className="text-primary hover:underline">
                  Create one
                </button>
              </p>
            </>
          )}

          {/* ─── TEXTSTREAM SIGN UP VIEW ─── */}
          {view === "textstream-signup" && (
            <>
              <button
                onClick={() => { resetForm(); setView("main"); }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back
              </button>

              <h2 className="text-lg font-semibold text-foreground mb-1">Create your account</h2>
              <p className="text-sm text-muted-foreground mb-6">Sign up with your email and a password.</p>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4 border border-destructive/20">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="bg-green-500/10 text-green-600 dark:text-green-400 text-sm p-3 rounded-md mb-4 border border-green-500/20">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleTextStreamSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="At least 6 characters"
                    minLength={6}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button onClick={() => { resetForm(); setView("textstream-signin"); }} className="text-primary hover:underline">
                  Sign in
                </button>
              </p>
            </>
          )}

        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to TextStream's Terms of Service.
        </p>
      </div>
    </div>
    </>
  );
}
