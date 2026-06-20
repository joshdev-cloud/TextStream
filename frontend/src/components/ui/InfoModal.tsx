import { X, HelpCircle, Info, Mail, FileText, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export type InfoModalType = "help" | "info" | "contact" | "terms" | "preferences" | null;

interface InfoModalProps {
  type: InfoModalType;
  onClose: () => void;
}

export function InfoModal({ type, onClose }: InfoModalProps) {
  const [mounted, setMounted] = useState(false);

  // Load preferences from localStorage
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem("pref_high_contrast") === "true");
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem("pref_reduced_motion") === "true");
  const [emailSummaries, setEmailSummaries] = useState(() => localStorage.getItem("pref_email_summaries") !== "false");
  const [productUpdates, setProductUpdates] = useState(() => localStorage.getItem("pref_product_updates") === "true");

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
      body: (
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">Email Address</label>
            <input 
              type="email"
              placeholder="you@university.edu"
              className="w-full p-3 text-sm transition border outline-none bg-secondary/35 border-border/50 rounded-2xl placeholder:text-muted-foreground focus:ring-1 focus:ring-amber-glow/60 focus:border-amber-glow"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">Your Message</label>
            <textarea 
              rows={4}
              placeholder="How can we help you improve your study sessions?"
              className="w-full p-3 text-sm transition border outline-none resize-none bg-secondary/35 border-border/50 rounded-2xl placeholder:text-muted-foreground focus:ring-1 focus:ring-amber-glow/60 focus:border-amber-glow"
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <label className="flex items-center gap-2 cursor-pointer group text-xs">
              <input type="checkbox" className="rounded bg-secondary/50 border-border/50 text-amber-glow focus:ring-amber-glow/50 cursor-pointer" />
              <span className="font-medium transition text-muted-foreground group-hover:text-foreground">Notify me of updates or responses</span>
            </label>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 mt-2 text-sm font-bold text-white transition rounded-2xl bg-gradient-to-r from-amber-glow to-coral glow-amber hover:brightness-110 hover:scale-[1.02] cursor-pointer"
          >
            Send Message
          </button>
        </form>
      )
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
          <button
            onClick={onClose}
            className="w-full py-2 mt-4 text-sm font-bold transition rounded-xl bg-secondary/50 hover:bg-secondary text-foreground"
          >
            Save Preferences
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
      <div className="relative z-10 w-full max-w-md p-8 overflow-hidden border shadow-2xl glass-strong rounded-3xl animate-slide-up">
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

