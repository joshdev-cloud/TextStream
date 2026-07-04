import { X, HelpCircle, Info, Mail, FileText, Settings, Palette, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

export type InfoModalType = "help" | "info" | "contact" | "terms" | "preferences" | null;

interface InfoModalProps {
  type: InfoModalType;
  onClose: () => void;
}
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { getThemeById, buildCustomThemeVariables, CustomThemeColors, ColorTheme } from "@/lib/colorThemes";
import { useColorTheme } from "@/hooks/useColorTheme";

function ContactForm({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [notify, setNotify] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    setStatus("loading");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message, notify })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to send message");
      }

      setStatus("success");
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      console.error("Contact error:", err);
      setStatus("error");
      setErrorMsg(err.message || "Failed to send message");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
        <div className="size-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-4">
          <Check className="size-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Message Sent!</h3>
        <p className="text-sm text-muted-foreground mt-1">We'll get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">Email Address</label>
        <input 
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@university.edu"
          className="w-full p-3 text-sm transition border outline-none bg-secondary/35 border-border/50 rounded-2xl placeholder:text-muted-foreground focus:ring-1 focus:ring-amber-glow/60 focus:border-amber-glow"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">Your Message</label>
        <textarea 
          rows={4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help you improve your study sessions?"
          className="w-full p-3 text-sm transition border outline-none resize-none bg-secondary/35 border-border/50 rounded-2xl placeholder:text-muted-foreground focus:ring-1 focus:ring-amber-glow/60 focus:border-amber-glow"
        />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <label className="flex items-center gap-2 cursor-pointer group text-xs">
          <input 
            type="checkbox" 
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            className="rounded bg-secondary/50 border-border/50 text-amber-glow focus:ring-amber-glow/50 cursor-pointer" 
          />
          <span className="font-medium transition text-muted-foreground group-hover:text-foreground">Notify me of updates or responses</span>
        </label>
      </div>
      
      {status === "error" && (
        <p className="text-xs text-coral font-medium text-center">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3 mt-2 text-sm font-bold text-white transition rounded-2xl bg-gradient-to-r from-amber-glow to-coral glow-amber hover:brightness-110 hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:scale-100"
      >
        {status === "loading" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}

export function InfoModal({ type, onClose }: InfoModalProps) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Color theme hook
  const colorTheme = useColorTheme();

  // DIY custom color local state
  const [showDiy, setShowDiy] = useState(false);
  const [diyColors, setDiyColors] = useState<CustomThemeColors>({
    background: "#1a1b2e",
    foreground: "#f0eef5",
    primary: "#d4a843",
    accent: "#9b7be8",
    card: "#2a2b3e",
    border: "#4a4b5e",
    muted: "#8a8b9e",
  });
  const [diyMode, setDiyMode] = useState<"dark" | "light">("dark");

  // Preview theme state
  const [previewThemeId, setPreviewThemeId] = useState(colorTheme.isCustom ? "my-custom" : colorTheme.activeThemeId);
  
  // Calculate the currently previewed theme object
  const previewThemeObj = useMemo(() => {
    if (previewThemeId === "custom") {
      return {
        id: "custom",
        name: "Unsaved Custom DIY",
        mode: diyMode,
        preview: { bg: diyColors.background, primary: diyColors.primary, accent: diyColors.accent, text: diyColors.foreground },
        variables: buildCustomThemeVariables(diyColors, diyMode)
      };
    }
    if (previewThemeId === "my-custom" && colorTheme.customColors) {
      return {
        id: "my-custom",
        name: "My Custom Theme",
        mode: colorTheme.customMode,
        preview: { bg: colorTheme.customColors.background, primary: colorTheme.customColors.primary, accent: colorTheme.customColors.accent, text: colorTheme.customColors.foreground },
        variables: buildCustomThemeVariables(colorTheme.customColors, colorTheme.customMode)
      };
    }
    return getThemeById(previewThemeId) || colorTheme.activeTheme;
  }, [previewThemeId, colorTheme.activeTheme, diyColors, diyMode, colorTheme.customColors, colorTheme.customMode]);

  const handleSetTheme = async () => {
    if (previewThemeId === "custom") {
      colorTheme.setCustomTheme(diyColors, diyMode);
      setPreviewThemeId("my-custom");
    } else if (previewThemeId === "my-custom" && colorTheme.customColors) {
      colorTheme.setCustomTheme(colorTheme.customColors, colorTheme.customMode);
    } else {
      colorTheme.setColorTheme(previewThemeId);
    }
    await colorTheme.saveToSupabase();
  };

  // Load preferences from localStorage or user metadata
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem("pref_high_contrast") === "true");
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem("pref_reduced_motion") === "true");
  
  const [emailSummaries, setEmailSummaries] = useState(() => {
    const local = localStorage.getItem("pref_email_summaries");
    if (local !== null) return local === "true";
    return user?.user_metadata?.email_summaries ?? true;
  });
  
  const [productUpdates, setProductUpdates] = useState(() => {
    const local = localStorage.getItem("pref_product_updates");
    if (local !== null) return local === "true";
    return user?.user_metadata?.product_updates ?? false;
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync preferences to DOM and localStorage
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
    localStorage.setItem("pref_high_contrast", highContrast.toString());
  }, [highContrast]);

  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.classList.add("reduced-motion");
    } else {
      document.documentElement.classList.remove("reduced-motion");
    }
    localStorage.setItem("pref_reduced_motion", reducedMotion.toString());
  }, [reducedMotion]);

  useEffect(() => {
    localStorage.setItem("pref_email_summaries", emailSummaries.toString());
  }, [emailSummaries]);

  useEffect(() => {
    localStorage.setItem("pref_product_updates", productUpdates.toString());
  }, [productUpdates]);

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      // Save color theme to Supabase
      await colorTheme.saveToSupabase();
      
      if (user) {
        await supabase.auth.updateUser({
          data: {
            email_summaries: emailSummaries,
            product_updates: productUpdates,
          }
        });
      }
    } catch (err) {
      console.error("Failed to save preferences to auth:", err);
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  if (!type || !mounted) return null;

  const content = {
    help: {
      icon: <HelpCircle className="size-6 text-primary-foreground" />,
      title: "Help & Support",
      description: "Need assistance with TextStream?",
      body: (
        <div className="space-y-4 text-sm text-muted-foreground overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
          <p>
            Welcome to TextStream, your intelligent study companion. Here is a comprehensive guide to getting the most out of our platform:
          </p>
          <div className="space-y-3">
            <div>
              <h4 className="font-bold text-foreground">1. The Global Vault</h4>
              <p>Upload your academic PDFs here. Files in the Global Vault are processed and indexed, making them instantly searchable for all users. You can also view open-source research papers added by the community.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground">2. Study Sessions</h4>
              <p>Create dedicated sessions for different subjects. A session keeps your context isolated, meaning the AI will only answer questions based on the documents you explicitly add to that session's vault.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground">3. Focus Mode & Exam Mode</h4>
              <p><strong>Focus Mode</strong> provides deep, analytical answers to your specific queries, utilizing our Deep Thinker model. <strong>Exam Mode</strong> automatically generates rigorous multiple-choice quizzes based on your documents to test your retention.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground">4. Customization</h4>
              <p>Use the settings menu to adjust your preferred LLM engine, switch between Light and Dark mode, and manage your account preferences.</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 mt-4">
            <h4 className="font-bold text-foreground mb-1">Quick Tips</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Hover over citations in the chat to instantly see the source document and page number.</li>
              <li>Use the workspace layout for side-by-side reading and chatting.</li>
            </ul>
          </div>
        </div>
      )
    },
    info: {
      icon: <Info className="size-6 text-primary-foreground" />,
      title: "About TextStream",
      description: "The Ultimate Interactive Study Companion",
      body: (
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            Version: <strong className="text-foreground">2.0.0 (Beta)</strong>
          </p>
          <p>
            TextStream utilizes deep semantic vector search with real-time context-scoping, automated high-density summaries, and multi-mode custom evaluation engines to maximize knowledge retention. 
            It is designed specifically for students, researchers, and lifelong learners who need to process large amounts of textual data efficiently.
          </p>
          <p className="pt-2 border-t border-border/30">
            Powered by <strong>Gemini Flash</strong> and <strong>Groq + Llama 3</strong>.
          </p>
        </div>
      )
    },
    contact: {
      icon: <Mail className="size-6 text-primary-foreground" />,
      title: "Contact Us",
      description: "We'd love to hear from you.",
      body: <ContactForm onClose={onClose} />
    },
    terms: {
      icon: <FileText className="size-6 text-primary-foreground" />,
      title: "Terms and Conditions",
      description: "Legal agreements and policies.",
      body: (
        <div className="space-y-4 text-sm text-muted-foreground overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
          <p><strong>Last Updated: June 2026</strong></p>
          <p>Please read these Terms and Conditions carefully before using TextStream.</p>
          <div className="space-y-3">
            <div>
              <h4 className="font-bold text-foreground">1. Acceptance of Terms</h4>
              <p>By accessing or using TextStream, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground">2. User Accounts</h4>
              <p>You must provide accurate and complete information when creating an account. You are responsible for safeguarding the password that you use to access the service and for any activities under your password.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground">3. Content and Data</h4>
              <p>Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You retain ownership of any intellectual property rights that you hold in that content.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground">4. Acceptable Use</h4>
              <p>You agree not to use the platform to upload malicious code, violate any laws in your jurisdiction, or infringe on the intellectual property rights of others. The Global Vault is a shared resource; do not upload sensitive personal information to public areas.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground">5. Limitation of Liability</h4>
              <p>In no event shall TextStream, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 mt-4 text-sm font-bold transition rounded-xl bg-secondary/50 hover:bg-secondary text-foreground"
          >
            Accept and Close
          </button>
        </div>
      )
    },
    preferences: {
      icon: <Settings className="size-6 text-primary-foreground" />,
      title: "Preferences",
      description: "Customize your TextStream experience.",
      body: (
        <div className="space-y-6 text-sm text-muted-foreground overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
          {/* ── Color Theme Section ─────────────────────── */}
          <div className="space-y-4">
            <h4 className="font-bold text-foreground border-b border-border/50 pb-2 flex items-center gap-2">
              <Palette className="size-4" />
              Color Theme
            </h4>

            {/* Dashboard Mockup Preview */}
            <div 
              className="relative rounded-2xl overflow-hidden border border-border/20 transition-all duration-500 shadow-2xl flex flex-col" 
              style={{ 
                ...previewThemeObj.variables as React.CSSProperties, 
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                height: '240px',
                boxShadow: `0 10px 40px -10px ${previewThemeObj.preview.primary}50`
              }}
            >
               {/* Header */}
               <div className="h-10 border-b border-border/50 flex items-center px-4 justify-between transition-colors duration-500" style={{ backgroundColor: 'var(--panel)' }}>
                 <div className="flex items-center gap-2">
                   <div className="size-4 rounded-full transition-colors duration-500" style={{ backgroundColor: 'var(--primary)' }} />
                   <div className="h-2 w-16 rounded-full opacity-60 transition-colors duration-500" style={{ backgroundColor: 'var(--foreground)' }} />
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="size-5 rounded-full opacity-50 transition-colors duration-500" style={{ backgroundColor: 'var(--muted)' }} />
                   <div className="size-5 rounded-full transition-colors duration-500" style={{ backgroundColor: 'var(--accent)' }} />
                 </div>
               </div>
               {/* Body */}
               <div className="flex flex-1 overflow-hidden">
                 {/* Sidebar */}
                 <div className="w-16 border-r border-border/50 p-2 space-y-3 flex flex-col items-center pt-4 transition-colors duration-500" style={{ backgroundColor: 'var(--panel)' }}>
                   <div className="size-6 rounded-md opacity-70 transition-colors duration-500" style={{ backgroundColor: 'var(--muted)' }} />
                   <div className="size-6 rounded-md opacity-70 transition-colors duration-500" style={{ backgroundColor: 'var(--muted)' }} />
                   <div className="size-6 rounded-md transition-colors duration-500" style={{ backgroundColor: 'var(--primary)' }} />
                 </div>
                 {/* Main content */}
                 <div className="flex-1 p-4 space-y-4">
                   <div className="h-4 w-1/3 rounded-full opacity-80 transition-colors duration-500" style={{ backgroundColor: 'var(--foreground)' }} />
                   <div className="grid grid-cols-2 gap-3">
                     <div className="h-20 rounded-xl border border-border/50 p-3 flex flex-col justify-between transition-colors duration-500" style={{ backgroundColor: 'var(--card)' }}>
                       <div className="h-2 w-1/2 rounded-full opacity-50 transition-colors duration-500" style={{ backgroundColor: 'var(--card-foreground)' }} />
                       <div className="h-6 w-3/4 rounded-md transition-colors duration-500" style={{ backgroundColor: 'var(--primary)' }} />
                     </div>
                     <div className="h-20 rounded-xl border border-border/50 p-3 flex flex-col justify-between transition-colors duration-500" style={{ backgroundColor: 'var(--card)' }}>
                       <div className="h-2 w-1/2 rounded-full opacity-50 transition-colors duration-500" style={{ backgroundColor: 'var(--card-foreground)' }} />
                       <div className="h-6 w-3/4 rounded-md transition-colors duration-500" style={{ backgroundColor: 'var(--accent)' }} />
                     </div>
                   </div>
                 </div>
               </div>
               
               {/* Apply overlay */}
               <div className="absolute bottom-4 right-4 flex items-center gap-3">
                 <div className="text-[11px] font-bold px-2 py-1 rounded-full backdrop-blur-md" style={{ color: 'var(--foreground)', backgroundColor: 'var(--panel)' }}>
                   {previewThemeObj.name} Preview
                 </div>
                 <button 
                   onClick={handleSetTheme}
                   disabled={previewThemeId === (colorTheme.isCustom ? "my-custom" : colorTheme.activeThemeId)}
                   className="px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 cursor-pointer"
                   style={{ backgroundColor: 'var(--primary)' }}
                 >
                   {previewThemeId === (colorTheme.isCustom ? "my-custom" : colorTheme.activeThemeId) ? "Active Theme" : "Set Theme"}
                 </button>
               </div>
            </div>

            {/* My Custom Theme */}
            {colorTheme.customColors && (
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">My Custom Theme</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {(() => {
                    const isActive = previewThemeId === "my-custom";
                    return (
                      <button
                        onClick={() => setPreviewThemeId("my-custom")}
                        className={`group relative rounded-2xl p-2.5 transition-all duration-300 cursor-pointer border ${
                          isActive
                            ? "ring-2 scale-[1.03] shadow-lg"
                            : "border-border/20 hover:border-border/50 hover:scale-[1.03] hover:shadow-md hover:shadow-black/20"
                        }`}
                        style={{ 
                          background: colorTheme.customColors.background,
                          borderColor: isActive ? colorTheme.customColors.primary : undefined,
                          boxShadow: isActive ? `0 4px 20px -5px ${colorTheme.customColors.primary}50` : undefined
                        }}
                      >
                        {isActive && (
                          <div 
                            className="absolute -top-2 -right-2 size-6 rounded-full grid place-items-center shadow-lg z-10 transition-transform duration-300 scale-110"
                            style={{ background: colorTheme.customColors.primary }}
                          >
                            <Check className="size-3.5" style={{ color: colorTheme.customColors.background }} strokeWidth={4} />
                          </div>
                        )}
                        <div className="flex gap-1.5 mb-2">
                          <div className="h-4 flex-1 rounded-sm" style={{ background: colorTheme.customColors.primary }} />
                          <div className="h-4 w-3 rounded-sm" style={{ background: colorTheme.customColors.accent }} />
                        </div>
                        <div className="flex gap-0.5 mb-1">
                          <div className="h-1 flex-1 rounded-full opacity-50" style={{ background: colorTheme.customColors.foreground }} />
                          <div className="h-1 w-2 rounded-full opacity-25" style={{ background: colorTheme.customColors.foreground }} />
                        </div>
                        <p
                          className="text-[10px] font-semibold truncate mt-1"
                          style={{ color: colorTheme.customColors.foreground }}
                        >
                          Custom
                        </p>
                      </button>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Dark Themes */}
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">Dark Themes</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {colorTheme.darkThemes.map((theme) => {
                  const isActive = previewThemeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => setPreviewThemeId(theme.id)}
                      className={`group relative rounded-2xl p-2.5 transition-all duration-300 cursor-pointer border ${
                        isActive
                          ? "ring-2 scale-[1.03] shadow-lg"
                          : "border-border/20 hover:border-border/50 hover:scale-[1.03] hover:shadow-md hover:shadow-black/20"
                      }`}
                      style={{ 
                        background: theme.preview.bg,
                        borderColor: isActive ? theme.preview.primary : undefined,
                        boxShadow: isActive ? `0 4px 20px -5px ${theme.preview.primary}50` : undefined
                      }}
                    >
                      {isActive && (
                        <div 
                          className="absolute -top-2 -right-2 size-6 rounded-full grid place-items-center shadow-lg z-10 transition-transform duration-300 scale-110"
                          style={{ background: theme.preview.primary }}
                        >
                          <Check className="size-3.5" style={{ color: theme.preview.bg }} strokeWidth={4} />
                        </div>
                      )}
                      <div className="flex gap-1.5 mb-2">
                        <div className="h-4 flex-1 rounded-sm" style={{ background: theme.preview.primary }} />
                        <div className="h-4 w-3 rounded-sm" style={{ background: theme.preview.accent }} />
                      </div>
                      <div className="flex gap-0.5 mb-1">
                        <div className="h-1 flex-1 rounded-full opacity-50" style={{ background: theme.preview.text }} />
                        <div className="h-1 w-2 rounded-full opacity-25" style={{ background: theme.preview.text }} />
                      </div>
                      <p
                        className="text-[10px] font-semibold truncate mt-1"
                        style={{ color: theme.preview.text }}
                      >
                        {theme.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Light Themes */}
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">Light Themes</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {colorTheme.lightThemes.map((theme) => {
                  const isActive = previewThemeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => setPreviewThemeId(theme.id)}
                      className={`group relative rounded-2xl p-2.5 transition-all duration-300 cursor-pointer border ${
                        isActive
                          ? "ring-2 scale-[1.03] shadow-lg"
                          : "border-border/20 hover:border-border/50 hover:scale-[1.03] hover:shadow-md hover:shadow-black/10"
                      }`}
                      style={{ 
                        background: theme.preview.bg,
                        borderColor: isActive ? theme.preview.primary : undefined,
                        boxShadow: isActive ? `0 4px 20px -5px ${theme.preview.primary}50` : undefined
                      }}
                    >
                      {isActive && (
                        <div 
                          className="absolute -top-2 -right-2 size-6 rounded-full grid place-items-center shadow-lg z-10 transition-transform duration-300 scale-110"
                          style={{ background: theme.preview.primary }}
                        >
                          <Check className="size-3.5" style={{ color: theme.preview.bg }} strokeWidth={4} />
                        </div>
                      )}
                      <div className="flex gap-1.5 mb-2">
                        <div className="h-4 flex-1 rounded-sm" style={{ background: theme.preview.primary }} />
                        <div className="h-4 w-3 rounded-sm" style={{ background: theme.preview.accent }} />
                      </div>
                      <div className="flex gap-0.5 mb-1">
                        <div className="h-1 flex-1 rounded-full opacity-50" style={{ background: theme.preview.text }} />
                        <div className="h-1 w-2 rounded-full opacity-25" style={{ background: theme.preview.text }} />
                      </div>
                      <p
                        className="text-[10px] font-semibold truncate mt-1"
                        style={{ color: theme.preview.text }}
                      >
                        {theme.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DIY Custom Theme */}
            <div className="rounded-xl border border-border/40 overflow-hidden">
              <button
                onClick={() => {
                  setShowDiy(!showDiy);
                  if (!showDiy) setPreviewThemeId("custom");
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary/30 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Palette className="size-3.5" />
                  DIY Custom Theme
                  {colorTheme.isCustom && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-glow/20 text-amber-glow text-[10px] font-bold">Active</span>
                  )}
                </span>
                {showDiy ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </button>

              {showDiy && (
                <div className="px-3 pb-3 space-y-3 border-t border-border/30 pt-3">
                  {/* Mode selector */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setDiyMode("dark"); setPreviewThemeId("custom"); }}
                      className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                        diyMode === "dark"
                          ? "bg-foreground/10 text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Dark Base
                    </button>
                    <button
                      onClick={() => { setDiyMode("light"); setPreviewThemeId("custom"); }}
                      className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                        diyMode === "light"
                          ? "bg-foreground/10 text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Light Base
                    </button>
                  </div>

                  {/* Color pickers with wheel + hex input */}
                  <div className="space-y-2">
                    {(
                      [
                        { key: "background" as const, label: "Background" },
                        { key: "foreground" as const, label: "Text" },
                        { key: "primary" as const, label: "Primary" },
                        { key: "accent" as const, label: "Accent" },
                        { key: "card" as const, label: "Card" },
                        { key: "border" as const, label: "Border" },
                        { key: "muted" as const, label: "Muted" },
                      ]
                    ).map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2.5 group">
                        {/* Color wheel swatch — opens native color picker */}
                        <div className="relative shrink-0">
                          <div
                            className="size-8 rounded-full border-2 border-border/50 shadow-md transition-all duration-200 group-hover:scale-110 group-hover:border-foreground/30 group-hover:shadow-lg"
                            style={{ background: diyColors[key] }}
                          >
                            {/* Inner ring for depth */}
                            <div className="absolute inset-[3px] rounded-full border border-white/20 pointer-events-none" />
                          </div>
                          <input
                            type="color"
                            value={diyColors[key]}
                            onChange={(e) => {
                              setDiyColors((prev) => ({ ...prev, [key]: e.target.value }));
                              setPreviewThemeId("custom");
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            title={`Pick ${label} color`}
                          />
                        </div>

                        {/* Label */}
                        <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition w-[68px] shrink-0">
                          {label}
                        </span>

                        {/* Hex code input */}
                        <div className="flex-1 relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground/60 pointer-events-none">#</span>
                          <input
                            type="text"
                            value={diyColors[key].replace("#", "").toUpperCase()}
                            onChange={(e) => {
                              let val = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
                              if (val.length <= 6) {
                                setDiyColors((prev) => ({ ...prev, [key]: `#${val}` }));
                                setPreviewThemeId("custom");
                              }
                            }}
                            onBlur={(e) => {
                              // Pad to 6 chars on blur
                              let val = e.target.value.replace(/[^0-9a-fA-F]/g, "");
                              while (val.length < 6) val += "0";
                              setDiyColors((prev) => ({ ...prev, [key]: `#${val.slice(0, 6)}` }));
                              setPreviewThemeId("custom");
                            }}
                            maxLength={6}
                            className="w-full pl-5 pr-2 py-1.5 text-[11px] font-mono font-medium bg-secondary/30 border border-border/40 rounded-lg text-foreground outline-none transition-all focus:border-amber-glow/50 focus:ring-1 focus:ring-amber-glow/30 placeholder:text-muted-foreground/40"
                            placeholder="000000"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Apply / Reset buttons */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => { setPreviewThemeId("custom"); handleSetTheme(); }}
                      className="flex-1 py-2 text-xs font-bold rounded-lg text-white transition hover:brightness-110 cursor-pointer shadow-md"
                      style={{ backgroundColor: diyColors.primary }}
                    >
                      Set Custom Theme
                    </button>
                    {colorTheme.isCustom && (
                      <button
                        onClick={() => {
                          colorTheme.clearCustomTheme();
                          setPreviewThemeId(colorTheme.activeThemeId);
                        }}
                        className="px-3 py-2 text-xs font-semibold rounded-lg bg-secondary/50 text-foreground hover:bg-secondary transition cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Notifications Section ─────────────────────── */}
          <div className="space-y-4">
            <h4 className="font-bold text-foreground border-b border-border/50 pb-2">Notifications</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Email Summaries</p>
                <p className="text-xs">Receive weekly study session summaries.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={emailSummaries}
                  onChange={(e) => setEmailSummaries(e.target.checked)}
                />
                <div className="w-9 h-5 bg-secondary/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-glow"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Product Updates</p>
                <p className="text-xs">Get notified about new features.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={productUpdates}
                  onChange={(e) => setProductUpdates(e.target.checked)}
                />
                <div className="w-9 h-5 bg-secondary/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-glow"></div>
              </label>
            </div>
          </div>

          {/* ── Accessibility Section ─────────────────────── */}
          <div className="space-y-4">
            <h4 className="font-bold text-foreground border-b border-border/50 pb-2">Accessibility</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">High Contrast Mode</p>
                <p className="text-xs">Increase contrast for better readability.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                />
                <div className="w-9 h-5 bg-secondary/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-glow"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Reduced Motion</p>
                <p className="text-xs">Minimize animations across the app.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                />
                <div className="w-9 h-5 bg-secondary/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-glow"></div>
              </label>
            </div>
          </div>

          {/* ── Save Button ─────────────────────── */}
          <button
            onClick={handleSavePreferences}
            disabled={isSaving}
            className="w-full py-2.5 mt-2 text-sm font-bold transition rounded-xl bg-gradient-to-r from-amber-glow to-coral text-white hover:brightness-110 hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      )
    }
  };

  const activeContent = content[type];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-md animate-fade-in">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-label="Close Modal Overlay"
      />
      <div className={`relative z-10 w-full ${type === "preferences" ? "max-w-lg" : "max-w-md"} p-8 overflow-hidden border shadow-2xl glass-strong rounded-3xl animate-slide-up`}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none bg-amber-glow/20 blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none bg-lavender/20 blur-3xl translate-y-1/2 -translate-x-1/4" />

        <button
          onClick={onClose}
          className="absolute flex items-center justify-center transition rounded-full top-4 right-4 size-8 glass hover:bg-secondary/60 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X className="size-4" />
        </button>

        <div className="relative z-10 flex flex-col items-center mb-6 text-center">
          <div className="grid mb-4 rounded-2xl size-14 bg-gradient-to-br from-amber-glow to-coral place-items-center glow-amber">
            {activeContent.icon}
          </div>
          <h2 className="text-xl font-extrabold tracking-tight font-display text-foreground">
            {activeContent.title}
          </h2>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {activeContent.description}
          </p>
        </div>

        <div className="relative z-10">
          {activeContent.body}
        </div>
      </div>
    </div>,
    document.body
  );
}

