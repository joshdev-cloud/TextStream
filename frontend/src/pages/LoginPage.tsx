import { useState, useCallback, FormEvent, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "@tanstack/react-router";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { TextStreamLogo } from "@/components/ui/TextStreamLogo";
import Antigravity from "@/components/ui/Antigravity";

type View = "signin" | "signup";

export function LoginPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [loginVisible, setLoginVisible] = useState(false);
  const [view, setView] = useState<View>("signin");

  const router = useRouter();

  const handleSplashDone = useCallback(() => {
    setShowSplash(false);
    setTimeout(() => setLoginVisible(true), 50);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashDone} />}

      {/* Background - Antigravity + Original Canvas Theme */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-canvas">
        <div className="absolute inset-0 opacity-40 mix-blend-screen">
          <Suspense fallback={null}>
            <Antigravity
              count={300}
              magnetRadius={6}
              ringRadius={7}
              waveSpeed={0.4}
              waveAmplitude={1}
              particleSize={1.5}
              lerpSpeed={0.05}
              color={'#FF9FFC'}
              autoAnimate={true}
              particleVariance={1}
            />
          </Suspense>
        </div>
        {/* Subtle radial beams */}
        <div className="absolute top-[-30%] left-[-10%] w-[80%] h-[80%] bg-amber-glow/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-lavender/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      </div>

      <div
        className="relative z-10 min-h-screen flex items-center justify-center p-4"
        style={{
          opacity: loginVisible ? 1 : 0,
          transform: loginVisible ? "scale(1)" : "scale(0.98)",
          transition: "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="w-full max-w-[420px] flex flex-col items-center glass-strong p-8 rounded-3xl border border-border/50 shadow-2xl">
          {/* Logo Heading */}
          <div className="flex items-center gap-2 mb-8">
            <TextStreamLogo size="sm" />
            <h1 className="text-xl font-bold text-foreground tracking-wide">
              Text<span className="text-amber-glow">Stream</span>
            </h1>
          </div>

          {view === "signin" ? (
            <SignInView onSwitchView={() => setView("signup")} router={router} />
          ) : (
            <SignUpView onSwitchView={() => setView("signin")} router={router} />
          )}
        </div>
      </div>
    </>
  );
}

function SignInView({ onSwitchView, router }: { onSwitchView: () => void; router: any }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      <div className="w-full text-center mb-8">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Welcome</h2>
        <p className="text-muted-foreground text-sm">sign in to your textstream account.</p>
      </div>

      {error && (
        <div className="w-full bg-destructive/10 text-destructive text-sm p-3 rounded-xl mb-6 border border-destructive/20 text-center font-medium">
          {error}
        </div>
      )}

      <div className="w-full space-y-4">
        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-white hover:bg-gray-100 text-black text-sm font-bold transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 py-2">
          <span className="h-[1px] bg-border/50 flex-1"></span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">or with email</span>
          <span className="h-[1px] bg-border/50 flex-1"></span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3.5 bg-secondary/35 border border-border/50 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-glow focus:ring-1 focus:ring-amber-glow transition-all"
            placeholder="name@example.com"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3.5 bg-secondary/35 border border-border/50 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-glow focus:ring-1 focus:ring-amber-glow transition-all"
            placeholder="••••••••"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-glow to-coral text-white font-bold py-3.5 px-4 rounded-2xl transition-all duration-200 disabled:opacity-50 mt-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer glow-amber"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>

      <div className="mt-8 text-sm font-medium text-muted-foreground text-center">
        Don't have an account yet?{" "}
        <button 
          onClick={onSwitchView} 
          className="text-foreground hover:text-amber-glow underline underline-offset-4 decoration-border/50 hover:decoration-amber-glow transition-colors cursor-pointer"
        >
          Sign up
        </button>
      </div>
    </div>
  );
}

function SignUpView({ onSwitchView, router }: { onSwitchView: () => void; router: any }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
      <div className="w-full text-center mb-8">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Create Account</h2>
        <p className="text-muted-foreground text-sm">join textstream for personalized study tools.</p>
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
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-white hover:bg-gray-100 text-black text-sm font-bold transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign up with Google
        </button>

        <div className="flex items-center gap-3 py-2">
          <span className="h-[1px] bg-border/50 flex-1"></span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">or with email</span>
          <span className="h-[1px] bg-border/50 flex-1"></span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-secondary/35 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-glow focus:ring-1 focus:ring-amber-glow transition-all"
              placeholder="Preferred Name"
              required
            />
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-4 py-3 bg-secondary/35 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-glow focus:ring-1 focus:ring-amber-glow transition-all"
              placeholder="Age"
              min="13"
              max="120"
              required
            />
          </div>
          
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-4 py-3 bg-secondary/35 border border-border/50 rounded-xl text-sm text-foreground focus:outline-none focus:border-amber-glow focus:ring-1 focus:ring-amber-glow transition-all"
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
            className="w-full px-4 py-3 bg-secondary/35 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-glow focus:ring-1 focus:ring-amber-glow transition-all mt-2"
            placeholder="name@example.com"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-secondary/35 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-glow focus:ring-1 focus:ring-amber-glow transition-all"
            placeholder="Password (min 6 chars)"
            minLength={6}
            required
          />

          <label className="flex items-start gap-2 mt-4 cursor-pointer group p-1">
            <input 
              type="checkbox" 
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 rounded border-border/50 text-amber-glow focus:ring-amber-glow/50 bg-secondary/35 cursor-pointer" 
            />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition leading-tight">
              I agree to the <a href="#" className="underline decoration-border/50 hover:text-amber-glow transition-colors">Terms and Conditions</a> and <a href="#" className="underline decoration-border/50 hover:text-amber-glow transition-colors">Privacy Policy</a>.
            </span>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-glow to-coral text-white font-bold py-3.5 px-4 rounded-2xl transition-all duration-200 disabled:opacity-50 mt-4 hover:scale-[1.02] active:scale-[0.98] cursor-pointer glow-amber"
          >
            {isLoading ? "Creating..." : "Create Account"}
          </button>
        </form>
      </div>

      <div className="mt-8 text-sm font-medium text-muted-foreground text-center">
        Already have an account?{" "}
        <button 
          onClick={onSwitchView} 
          className="text-foreground hover:text-amber-glow underline underline-offset-4 decoration-border/50 hover:decoration-amber-glow transition-colors cursor-pointer"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
