import { X, HelpCircle, Info, Mail } from "lucide-react";

export type InfoModalType = "help" | "info" | "contact" | null;

interface InfoModalProps {
  type: InfoModalType;
  onClose: () => void;
}

export function InfoModal({ type, onClose }: InfoModalProps) {
  if (!type) return null;

  const content = {
    help: {
      icon: <HelpCircle className="size-6 text-primary-foreground" />,
      title: "Help & Support",
      description: "Need assistance with TextStream?",
      body: (
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            TextStream is designed to help you study efficiently. Upload your PDF documents
            to the Global Vault, create a study session, and use the <strong>Focus Mode</strong> or <strong>Exam Mode</strong> to generate context-aware quizzes.
          </p>
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
            <h4 className="font-bold text-foreground mb-1">Quick Tips</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the dashboard to quickly resume recent sessions.</li>
              <li>Hover over citations to peek at the source document.</li>
              <li>Toggle between Deep Thinker and Velocity Core depending on your needs.</li>
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
            <label className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">Your Message</label>
            <textarea 
              rows={4}
              placeholder="How can we help you improve your study sessions?"
              className="w-full p-3 text-sm transition border outline-none resize-none bg-secondary/35 border-border/50 rounded-2xl placeholder:text-muted-foreground focus:ring-1 focus:ring-amber-glow/60 focus:border-amber-glow"
            />
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
    }
  };

  const activeContent = content[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-label="Close Modal Overlay"
      />
      <div className="relative z-10 w-full max-w-md p-8 overflow-hidden border shadow-2xl glass-strong rounded-3xl animate-slide-up border-white/20">
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
    </div>
  );
}
