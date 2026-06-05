/**
 * MainPage — The TextStream classroom "front page" / dashboard.
 *
 * Displays:
 *   - Productivity timer and daily goals tracking bar (strictly listening to timer, pausing on visibility state hidden)
 *   - Active session quick-access banner
 *   - Hero section with branding and "New Study Session" CTA
 *   - Create session configuration screen (supporting Research, Focus, and Exams modes)
 *   - Gallery of RECENT sessions (worked in < 5h) and CONTINUE WORKING sessions (worked in > 5h)
 *   - Trash vault with soft-deleted sessions and restore/permanent delete actions
 */

import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  Plus,
  BookOpen,
  Clock,
  FileText,
  MessageCircle,
  ArrowRight,
  Zap,
  GraduationCap,
  Trash2,
  Edit3,
  RotateCcw,
  Check,
  X,
  Upload,
  Calendar,
  Compass,
  Loader2,
} from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { MainContainer } from "@/components/layout/MainContainer";
import { ProductivityBar } from "@/components/ui/ProductivityBar";
import { useDocumentManager } from "@/hooks/useDocumentManager";
import type { StudySession, StudyMode } from "@/store/documentStore";
import { uploadLocalDocument } from "@/lib/api/document.functions";

/* ──────────────────────────── Constants ──────────────────────────── */

const ACCENT_STYLES: Record<
  string,
  { bg: string; text: string; glow: string; border: string; iconBg: string }
> = {
  amber: {
    bg: "bg-amber-glow/10",
    text: "text-amber-glow",
    glow: "glow-amber",
    border: "border-amber-glow/30",
    iconBg: "bg-amber-glow/20",
  },
  lavender: {
    bg: "bg-lavender/10",
    text: "text-lavender",
    glow: "glow-lavender",
    border: "border-lavender/30",
    iconBg: "bg-lavender/20",
  },
  mint: {
    bg: "bg-mint/10",
    text: "text-mint",
    glow: "glow-mint",
    border: "border-mint/30",
    iconBg: "bg-mint/20",
  },
  coral: {
    bg: "bg-coral/10",
    text: "text-coral",
    glow: "glow-coral",
    border: "border-coral/30",
    iconBg: "bg-coral/20",
  },
};

const MODE_ICONS: Record<StudyMode, React.ReactNode> = {
  "RESEARCH MODE": <Compass className="size-5" />,
  "FOCUS MODE": <Zap className="size-5" />,
  "MAJORS EXAM": <GraduationCap className="size-5" />,
  "OTHER": <BookOpen className="size-5" />,
};

/* ──────────────────────────── Main Component ──────────────────────────── */

export function MainPage() {
  const navigate = useNavigate();
  const {
    sessions,
    activeDocuments,
    currentModel,
    setCurrentModel,
    createSession,
    trashSession,
    restoreSession,
    permanentlyDeleteSession,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    addDocument,
    endSession,
    emptyTrash,
    renameSession,
  } = useDocumentManager();

  const [showAiPopup, setShowAiPopup] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [newSessionMode, setNewSessionMode] = useState<StudyMode>("RESEARCH MODE");
  const [newSessionAccent, setNewSessionAccent] = useState<"amber" | "lavender" | "mint" | "coral">("amber");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Reorganize Sessions: RECENT (worked on in last 5 hours) vs CONTINUE WORKING (older than 5 hours)
  const activeNonTrash = sessions.filter((s) => s.status !== "trash");
  const now = Date.now();
  const fiveHoursMs = 5 * 60 * 60 * 1000;

  const recentSessions = activeNonTrash.filter((s) => {
    const elapsed = now - new Date(s.lastWorkedAt).getTime();
    return elapsed < fiveHoursMs;
  });

  const continueWorkingSessions = activeNonTrash.filter((s) => {
    const elapsed = now - new Date(s.lastWorkedAt).getTime();
    return elapsed >= fiveHoursMs;
  });

  const trashSessions = sessions.filter((s) => s.status === "trash");

  // Handle PDF upload from MainPage to Global Vault
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64String = (reader.result as string).split(",")[1];
          const result = await uploadLocalDocument({
            data: {
              fileName: file.name,
              fileBase64: base64String,
            },
          });

          if (result && result.success) {
            const newDoc = {
              id: `doc-${Date.now()}`,
              name: file.name,
              pages: result.pages,
              active: true,
              uploadedAt: new Date().toISOString(),
              paragraphs: result.paragraphs,
            };
            addDocument(newDoc);
            setUploadStatus(`Uploaded ${file.name} to Global Vault (${result.pages} pages)`);
          } else {
            setUploadStatus(`Failed to upload ${file.name}`);
          }
        } catch (err) {
          console.error("Upload failed in server function:", err);
          setUploadStatus(`Failed to upload ${file.name}`);
        } finally {
          setIsUploading(false);
          setTimeout(() => setUploadStatus(null), 4000);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload reader failed:", err);
      setUploadStatus(`Failed to upload ${file.name}`);
      setIsUploading(false);
      setTimeout(() => setUploadStatus(null), 4000);
    }
  };

  // Create session submit handler
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle.trim()) return;

    createSession(newSessionTitle, newSessionMode, newSessionAccent);
    setIsCreatingSession(false);
    setNewSessionTitle("");
    // Redirect to Workspace
    navigate({ to: "/workspace" });
  };

  return (
    <div className="min-h-screen text-foreground bg-canvas">
      <Navbar
        model={currentModel}
        onModelClick={() => setShowAiPopup(!showAiPopup)}
      />

      <MainContainer>
        {/* Productivity Bar (Dashboard Only) */}
        <ProductivityBar />

        {/* ── Active Session Banner ── */}
        {activeSession && (
          <div className="glass rounded-3xl p-5 border border-mint/40 bg-mint/5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-down glow-mint">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-mint"></span>
              </span>
              <div>
                <p className="text-[10px] font-bold text-mint uppercase tracking-widest">Active Study Space</p>
                <h3 className="font-display font-extrabold text-sm text-foreground mt-0.5">
                  {activeSession.title} <span className="text-xs text-muted-foreground font-normal">({activeSession.mode})</span>
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
              <button
                onClick={() => {
                  endSession(activeSession.id);
                  setActiveSessionId(null);
                }}
                className="rounded-2xl px-5 py-2.5 text-xs font-bold bg-coral/10 hover:bg-coral/25 border border-coral/30 text-coral transition flex items-center gap-1.5 shrink-0"
              >
                <X className="size-3.5" /> End Session
              </button>
              <Link
                to="/workspace"
                className="rounded-2xl px-5 py-2.5 text-xs font-bold bg-mint text-white glow-mint hover:brightness-110 hover:scale-[1.02] transition flex items-center gap-1.5 shrink-0"
              >
                Enter Active Workspace <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* ── File Upload Alert ── */}
        {uploadStatus && (
          <div className="glass border border-mint/40 bg-mint/5 px-4 py-3 rounded-2xl mb-6 text-xs text-mint font-semibold animate-slide-down flex items-center gap-2">
            <Check className="size-4" />
            {uploadStatus}
          </div>
        )}

        {/* ── Create Session Screen ── */}
        {isCreatingSession ? (
          <section className="glass rounded-3xl p-8 max-w-2xl mx-auto border border-border/40 animate-pop-in relative">
            <button
              onClick={() => setIsCreatingSession(false)}
              className="absolute top-5 right-5 size-9 rounded-full glass grid place-items-center hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition"
            >
              <X className="size-4" />
            </button>
            <h2 className="font-display font-extrabold text-2xl mb-2 flex items-center gap-2">
              <Plus className="size-6 text-amber-glow" /> Launch New Study Space
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
              Create a personalized learning room. Give it a name, a study mode, and selecting accent theme.
            </p>

            <form onSubmit={handleCreateSession} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Session Title
                </label>
                <input
                  type="text"
                  required
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  placeholder="e.g. Organic Chemistry — Semester Cram"
                  className="w-full bg-secondary/35 border border-border/50 outline-none rounded-2xl px-4 py-3.5 text-sm placeholder:text-muted-foreground focus:ring-1 focus:ring-amber-glow/60 focus:border-amber-glow transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Study Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(["RESEARCH MODE", "FOCUS MODE", "MAJORS EXAM"] as StudyMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setNewSessionMode(m)}
                      className={`py-4 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-2 ${newSessionMode === m
                        ? "bg-amber-glow/15 border-amber-glow text-amber-glow glow-amber scale-[1.02]"
                        : "glass border-border/50 hover:bg-secondary/40 text-muted-foreground"
                        }`}
                    >
                      {MODE_ICONS[m]}
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Accent Palette
                </label>
                <div className="flex gap-3">
                  {(["amber", "lavender", "mint", "coral"] as const).map((color) => {
                    const c = ACCENT_STYLES[color];
                    const active = newSessionAccent === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewSessionAccent(color)}
                        className={`size-10 rounded-full border transition flex items-center justify-center ${c.bg} ${c.border} ${active ? "ring-2 ring-foreground scale-110" : "hover:scale-105"
                          }`}
                        aria-label={`Select ${color} accent`}
                      >
                        <span className={`size-4 rounded-full ${c.bg.replace("/10", "")} ${c.text}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3 justify-end border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setIsCreatingSession(false)}
                  className="rounded-2xl px-5 py-3 text-sm font-semibold glass hover:bg-secondary/60 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl px-6 py-3 text-sm font-bold bg-gradient-to-r from-amber-glow to-coral text-white glow-amber hover:brightness-110 transition"
                >
                  Launch Workspace →
                </button>
              </div>
            </form>
          </section>
        ) : (
          <>
            {/* ── Hero / Overview ── */}
            <section className="mb-8">
              <div className="glass rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-glow/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-lavender/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="size-12 rounded-2xl bg-gradient-to-br from-amber-glow to-coral grid place-items-center glow-amber">
                        <Sparkles className="size-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                          Welcome back to TextStream
                        </h1>
                        <p className="text-sm text-muted-foreground">
                          Your AI-powered study companion
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-lg leading-relaxed mt-2">
                      Continue where you left off, or start a brand new study session.
                      Upload documents to your Global Vault here.
                    </p>

                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                      <input
                        type="file"
                        id="main-pdf-upload"
                        accept=".pdf,.txt"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                      <label
                        htmlFor="main-pdf-upload"
                        className={`glass rounded-2xl px-4 py-2 border border-border/50 text-xs font-semibold cursor-pointer hover:bg-secondary/45 transition flex items-center gap-2 ${isUploading ? "opacity-50 pointer-events-none" : ""
                          }`}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="size-3.5 text-amber-glow animate-spin" />
                            Uploading PDF...
                          </>
                        ) : (
                          <>
                            <Upload className="size-3.5 text-amber-glow" />
                            Upload PDF to Global Vault
                          </>
                        )}
                      </label>
                      <span className="text-[10px] text-muted-foreground">
                        Supports PDF, TXT up to 50MB
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsCreatingSession(true)}
                    className="shrink-0 rounded-2xl px-6 py-4 font-display font-bold text-base bg-gradient-to-r from-amber-glow via-coral to-lavender text-white glow-amber hover:brightness-110 hover:scale-[1.02] transition flex items-center gap-3"
                  >
                    <Plus className="size-5" />
                    New Study Session
                  </button>
                </div>

                {/* Quick stats */}
                <div className="relative z-10 mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard
                    icon={<BookOpen className="size-4" />}
                    label="Active Sessions"
                    value={activeNonTrash.length.toString()}
                    accent="amber"
                  />
                  <StatCard
                    icon={<FileText className="size-4" />}
                    label="Global Vault Docs"
                    value={activeDocuments.length.toString()}
                    accent="lavender"
                  />
                  <StatCard
                    icon={<MessageCircle className="size-4" />}
                    label="Total Messages"
                    value={sessions
                      .reduce((sum, s) => sum + (s.messages?.length || 0), 0)
                      .toString()}
                    accent="mint"
                  />
                  <StatCard
                    icon={<GraduationCap className="size-4" />}
                    label="Quizzes Taken"
                    value="7"
                    accent="coral"
                  />
                </div>
              </div>
            </section>

            {/* ── RECENT Study Sessions ── */}
            {recentSessions.length > 0 && (
              <section className="mb-8 animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <span className="size-2.5 rounded-full bg-mint glow-mint" />
                  <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    Recent Sessions
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentSessions.map((session) => (
                    <InteractiveSessionCard
                      key={session.id}
                      session={session}
                      isActive={session.id === activeSessionId}
                      onRename={(newTitle) => renameSession(session.id, newTitle)}
                      onDelete={() => trashSession(session.id)}
                      onSelect={() => setActiveSessionId(session.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── CONTINUE WORKING Study Sessions ── */}
            <section className="mb-8 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-lavender glow-lavender" />
                  <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    Continue Working
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  {continueWorkingSessions.length} sessions
                </span>
              </div>

              {continueWorkingSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {continueWorkingSessions.map((session) => (
                    <InteractiveSessionCard
                      key={session.id}
                      session={session}
                      isActive={session.id === activeSessionId}
                      onRename={(newTitle) => renameSession(session.id, newTitle)}
                      onDelete={() => trashSession(session.id)}
                      onSelect={() => setActiveSessionId(session.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass rounded-3xl p-6 text-center text-xs text-muted-foreground border border-dashed border-border/50">
                  No older sessions. All active sessions have been worked on recently!
                </div>
              )}
            </section>

            {/* ── Trash Vault Section ── */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-coral glow-coral animate-pulse" />
                  <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                    <Trash2 className="size-4" /> Recycle Bin
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  {trashSessions.length > 0 && (
                    <button
                      onClick={emptyTrash}
                      className="px-3 py-1.5 bg-coral/10 hover:bg-coral/25 border border-coral/30 hover:border-coral/50 text-[10px] font-bold text-coral rounded-xl transition flex items-center gap-1.5 glow-coral"
                    >
                      <Trash2 className="size-3" /> Empty Trash
                    </button>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {trashSessions.length} trashed (auto-purged in 7 days)
                  </span>
                </div>
              </div>

              {trashSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trashSessions.map((session) => (
                    <TrashSessionCard
                      key={session.id}
                      session={session}
                      onRestore={() => restoreSession(session.id)}
                      onDelete={() => permanentlyDeleteSession(session.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass rounded-3xl p-6 text-center text-xs text-muted-foreground border border-dashed border-border/50">
                  Trash is empty. Deleted sessions reside here for 7 days before permanent deletion.
                </div>
              )}
            </section>
          </>
        )}
      </MainContainer>

      {/* AI popup helper */}
      {showAiPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full relative">
            <button
              onClick={() => setShowAiPopup(false)}
              className="absolute top-4 right-4 size-8 rounded-full glass grid place-items-center hover:bg-secondary"
            >
              <X className="size-4" />
            </button>
            <h3 className="font-display font-extrabold text-lg mb-2">AI Model Preferences</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Select the active model to power your tutoring, quizzes, and summaries.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setCurrentModel("velocity");
                  setShowAiPopup(false);
                }}
                className={`w-full text-left rounded-2xl p-4 transition border ${currentModel === "velocity"
                  ? "bg-lavender/10 border-lavender glow-lavender text-foreground"
                  : "glass border-transparent hover:bg-secondary/40 text-muted-foreground"
                  }`}
              >
                <p className="text-sm font-bold flex items-center gap-1.5">
                  <Zap className="size-4 text-lavender" /> Velocity Core
                </p>
                <p className="text-[10px] mt-1 leading-relaxed">
                  Llama 3 + Groq. Instant feedback, rapid flashcard reviews.
                </p>
              </button>

              <button
                onClick={() => {
                  setCurrentModel("deep");
                  setShowAiPopup(false);
                }}
                className={`w-full text-left rounded-2xl p-4 transition border ${currentModel === "deep"
                  ? "bg-amber-glow/10 border-amber-glow glow-amber text-foreground"
                  : "glass border-transparent hover:bg-secondary/40 text-muted-foreground"
                  }`}
              >
                <p className="text-sm font-bold flex items-center gap-1.5">
                  <Calendar className="size-4 text-amber-glow" /> Deep Thinker
                </p>
                <p className="text-[10px] mt-1 leading-relaxed">
                  Gemini Flash. Textbooks scanning, advanced derivations.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── Sub-Components ──────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "amber" | "lavender" | "mint" | "coral";
}) {
  const a = ACCENT_STYLES[accent];
  return (
    <div className={`glass rounded-2xl p-4 border ${a.border}`}>
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`size-7 rounded-lg grid place-items-center ${a.iconBg} ${a.text}`}
        >
          {icon}
        </div>
        <span className="text-xs text-muted-foreground font-medium truncate">
          {label}
        </span>
      </div>
      <p className={`text-2xl font-display font-bold ${a.text}`}>{value}</p>
    </div>
  );
}

interface InteractiveSessionCardProps {
  session: StudySession;
  isActive: boolean;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
  onSelect: () => void;
}

function InteractiveSessionCard({
  session,
  isActive,
  onRename,
  onDelete,
  onSelect,
}: InteractiveSessionCardProps) {
  const a = ACCENT_STYLES[session.accent];
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(session.title);

  const formattedDate = new Date(session.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const handleSaveRename = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (tempTitle.trim() && tempTitle !== session.title) {
      onRename(tempTitle);
    }
    setIsEditing(false);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTempTitle(session.title);
    setIsEditing(false);
  };

  return (
    <div className="relative group/card">
      <Link
        to="/workspace"
        onClick={onSelect}
        className={`glass rounded-3xl p-5 border transition-all duration-300 flex flex-col h-full hover:scale-[1.01] hover:brightness-105 group relative ${isActive
          ? "border-mint/60 bg-mint/5 glow-mint shadow-mint ring-1 ring-mint/35"
          : a.border
          }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className={`size-10 rounded-xl grid place-items-center ${isActive ? "bg-mint/20 text-mint" : a.iconBg + " " + a.text}`}>
            {MODE_ICONS[session.mode] || <BookOpen className="size-5" />}
          </div>

          <div className="flex items-center gap-1.5">
            {isActive && (
              <span className="bg-mint text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full select-none animate-pulse">
                Active Now
              </span>
            )}
            <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover/card:opacity-100 transition duration-200">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                title="Rename Session"
                className="size-7 rounded-lg glass-strong flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <Edit3 className="size-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                }}
                title="Delete to Trash"
                className="size-7 rounded-lg glass-strong flex items-center justify-center text-coral hover:bg-coral/20"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Title (or editing form) */}
        {isEditing ? (
          <div className="flex items-center gap-1.5 my-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              autoFocus
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              className="flex-1 bg-secondary border border-amber-glow outline-none rounded-xl px-2.5 py-1 text-xs text-foreground font-semibold"
            />
            <button
              onClick={handleSaveRename}
              className="size-6 rounded-lg bg-mint text-white flex items-center justify-center"
            >
              <Check className="size-3.5" />
            </button>
            <button
              onClick={handleCancelRename}
              className="size-6 rounded-lg bg-secondary text-foreground flex items-center justify-center"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <h3 className="font-display font-bold text-base leading-tight mb-1 truncate text-foreground">
            {session.title}
          </h3>
        )}

        <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isActive ? "text-mint" : a.text}`}>
          {session.mode}
        </p>

        {/* Stats */}
        <div className="mt-auto pt-3 border-t border-border/30 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="size-3" />
            {session.documentIds?.length || 0} docs
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="size-3" />
            {session.messages?.length || 0} chats
          </span>
        </div>

        {/* Continue Link */}
        <div className="mt-3 flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition">
          <span className={isActive ? "text-mint" : a.text}>Enter Space</span>
          <ArrowRight className={`size-3.5 ${isActive ? "text-mint" : a.text}`} />
        </div>
      </Link>
    </div>
  );
}

function TrashSessionCard({
  session,
  onRestore,
  onDelete,
}: {
  session: StudySession;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const getDaysLeft = (deletedAt?: string) => {
    if (!deletedAt) return "7 days";
    const elapsedMs = Date.now() - new Date(deletedAt).getTime();
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    const left = 7 - elapsedDays;
    if (left < 0.04) return "less than an hour";
    if (left < 1) return `${Math.round(left * 24)} hours`;
    return `${Math.ceil(left)} days`;
  };

  return (
    <div className="glass rounded-3xl p-5 border border-coral/20 bg-coral/5 flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <div className="size-10 rounded-xl bg-coral/10 text-coral grid place-items-center">
          <Trash2 className="size-5" />
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={onRestore}
            title="Restore Session"
            className="size-8 rounded-xl glass hover:bg-secondary/70 flex items-center justify-center text-mint"
          >
            <RotateCcw className="size-4" />
          </button>
          <button
            onClick={onDelete}
            title="Permanently Delete"
            className="size-8 rounded-xl glass hover:bg-coral/30 flex items-center justify-center text-coral"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <h3 className="font-display font-bold text-base leading-tight mb-1 text-muted-foreground line-through">
        {session.title}
      </h3>
      <p className="text-xs text-muted-foreground/80 font-semibold mb-4">
        {session.mode}
      </p>

      <div className="mt-auto pt-3 border-t border-border/30 flex items-center justify-between text-[10px] text-coral font-semibold">
        <span>Soft deleted</span>
        <span>Purges in {getDaysLeft(session.deletedAt)}</span>
      </div>
    </div>
  );
}
