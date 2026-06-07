/**
 * Workspace — The active study interface with dual-pane layout.
 *
 * Left pane:  Chat (Active Learning Stream) / Summarizer Workspace
 * Right pane: Screen Reader Viewport + Document File Vault
 *
 * This is a refactored version of the original StudySpace component
 * from routes/index.tsx. All inline sub-components have been extracted
 * into @/components/ui/ and @/components/layout/.
 *
 * TODO: EDIT HERE — Connect chat input to POST /api/chat
 * TODO: EDIT HERE — Connect summarizer to POST /api/summarize
 * TODO: EDIT HERE — Connect file upload to POST /api/documents/upload
 */

import { useState, useEffect, useRef } from "react";
import {
  Zap,
  Compass,
  Sparkles,
  Plus,
  Lock,
  Send,
  Wand2,
  Timer,
  BookOpen,
  Flame,
  Target,
  X,
  Check,
  MessageCircle,
  ScrollText,
  GraduationCap,
  ArrowRight,
  Pin,
  Upload,
  Clock,
  ShieldAlert,
  Play,
  Pause,
  FileText,
  ZoomIn,
  ZoomOut,
  Highlighter,
  Loader2,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";

import { Navbar } from "@/components/layout/Navbar";
import { MainContainer } from "@/components/layout/MainContainer";
import { PanelHeader } from "@/components/ui/PanelHeader";
import { ChatBubble } from "@/components/ui/ChatBubble";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { SourceCard } from "@/components/ui/SourceCard";
import { PopupShell } from "@/components/ui/PopupShell";
import { EngineCard } from "@/components/ui/EngineCard";
import { ModuleLabel } from "@/components/ui/ModuleLabel";
import { type ModelKey } from "@/components/ui/ModelBadge";
import { useDocumentManager } from "@/hooks/useDocumentManager";

/* ──────────────────────────── Types ──────────────────────────── */

type QuizMode = "sprint" | "marathon" | "blitz" | "sudden";
type Popup = null | "ai" | "tools" | "quiz" | "active-quiz";
type WorkMode = "chat" | "summarize";

interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

/* ──────────────────────────── Constants ──────────────────────────── */

const QUIZ_MODES: {
  key: QuizMode;
  title: string;
  sub: string;
  icon: React.ReactNode;
  accent: "mint" | "lavender" | "amber" | "coral";
}[] = [
  {
    key: "sprint",
    title: "Sprint Mode",
    sub: "20 seconds per item. Sharpens rapid recall under exam pressure.",
    icon: <Timer className="size-5" />,
    accent: "mint",
  },
  {
    key: "marathon",
    title: "Marathon Mode",
    sub: "Exhaustive full-length diagnostic across every section of your active docs.",
    icon: <BookOpen className="size-5" />,
    accent: "lavender",
  },
  {
    key: "blitz",
    title: "Blitz Mode",
    sub: "Next question loads the instant you tap an option. Perfect for drills.",
    icon: <Flame className="size-5" />,
    accent: "amber",
  },
  {
    key: "sudden",
    title: "Sudden Death",
    sub: "Quiz terminates the moment you answer a single question incorrectly.",
    icon: <Target className="size-5" />,
    accent: "coral",
  },
];

const ACCENT_CLASSES: Record<
  string,
  { bg: string; text: string; glow: string; ring: string }
> = {
  mint: {
    bg: "bg-mint/15",
    text: "text-mint",
    glow: "glow-mint",
    ring: "ring-mint/60",
  },
  lavender: {
    bg: "bg-lavender/15",
    text: "text-lavender",
    glow: "glow-lavender",
    ring: "ring-lavender/60",
  },
  amber: {
    bg: "bg-amber-glow/15",
    text: "text-amber-glow",
    glow: "glow-amber",
    ring: "ring-amber-glow/60",
  },
  coral: {
    bg: "bg-coral/15",
    text: "text-coral",
    glow: "glow-coral",
    ring: "ring-coral/60",
  },
};

/* ──────────────────────────── Main Component ──────────────────────────── */

const getPdfParagraphs = (doc: { id: string; name: string; paragraphs?: string[] }) => {
  if (doc.paragraphs && doc.paragraphs.length > 0) {
    return doc.paragraphs;
  }
  return [
    `This is the active viewport reader for "${doc.name}". The document has been successfully indexed into the local study space.`,
    "You can scroll through the entire text, zoom in or out using the header controls, and highlight paragraphs by activating the Highlighter Pen tool.",
    "Integrating this viewport with an AI engine allows you to ask specific questions about pages, terms, and tables contained within this document.",
    "Select a study mode like FOCUS MODE to run a deep analysis, or launch an evaluation quiz to test your memory of this text."
  ];
};

export function Workspace() {
  const navigate = useNavigate();
  const {
    documents,
    activeDocuments,
    toggleDocument,
    logActiveFiles,
    currentModel,
    setCurrentModel,
    activeSession,
    addMessageToSession,
    addDocument,
    addDocumentToSession,
    studyGoalHours,
    setStudyGoalHours,
    streakCount,
    endSession,
    setActiveSessionId,
  } = useDocumentManager();

  const [popup, setPopup] = useState<Popup>(null);
  const [workMode, setWorkMode] = useState<WorkMode>("chat");
  const [summaryShown, setSummaryShown] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    takeaways: string[];
    terminology: string[];
    insights: string;
  } | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizMode, setQuizMode] = useState<QuizMode>("sprint");
  const [qCount, setQCount] = useState(10);
  const [difficulty, setDifficulty] = useState(50);
  const [chatInput, setChatInput] = useState("");
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  const [viewportDocId, setViewportDocId] = useState<string | null>(null);

  // Viewport zoom, scrolling, and highlight states
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [highlightedSegments, setHighlightedSegments] = useState<Record<string, string[]>>({});
  const [isUploading, setIsUploading] = useState(false);
  const dragModeRef = useRef<"highlight" | "erase" | null>(null);

  const zoomIn = () => setZoomLevel((prev) => Math.min(200, prev + 10));
  const zoomOut = () => setZoomLevel((prev) => Math.max(70, prev - 10));
  const toggleHighlightMode = () => setIsHighlightMode((prev) => !prev);
  
  const handleWordClick = (docId: string, wordKey: string, action: "add" | "remove") => {
    setHighlightedSegments((prev) => {
      const currentList = prev[docId] || [];
      const updatedList = action === "add"
        ? (currentList.includes(wordKey) ? currentList : [...currentList, wordKey])
        : currentList.filter((k) => k !== wordKey);
      return {
        ...prev,
        [docId]: updatedList,
      };
    });
  };



  // Timer states (Compact Workspace Tracker)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const isMouseDownRef = useRef(false);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isMouseDownRef.current = false;
      dragModeRef.current = null;
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, []);

  // Sync elapsed focus time from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedElapsed = sessionStorage.getItem("textstream_study_elapsed");
      if (storedElapsed) {
        setElapsedSeconds(parseInt(storedElapsed, 10));
      }
    }
  }, []);

  // Run the focus timer
  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (typeof window !== "undefined") {
            sessionStorage.setItem("textstream_study_elapsed", next.toString());
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  // Page Visibility API auto-pause/resume handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setIsPaused(true);
      } else if (document.visibilityState === "visible") {
        if (!isManuallyPaused) {
          setIsPaused(false);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isManuallyPaused]);

  // Load default viewport doc from sessionStorage if set (e.g. from Global Vault redirect)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const defaultDoc = sessionStorage.getItem("textstream_default_viewport_doc");
      if (defaultDoc) {
        setViewportDocId(defaultDoc);
        sessionStorage.removeItem("textstream_default_viewport_doc");
      }
      
      const handleStorageTrigger = () => {
        const triggerDoc = sessionStorage.getItem("textstream_default_viewport_doc");
        if (triggerDoc) {
          setViewportDocId(triggerDoc);
          sessionStorage.removeItem("textstream_default_viewport_doc");
        }
      };
      
      window.addEventListener("storage_default_doc", handleStorageTrigger);
      return () => {
        window.removeEventListener("storage_default_doc", handleStorageTrigger);
      };
    }
  }, []);

  // Format focus time
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, "0"),
      mins.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":");
  };

  const dailyGoalSeconds = studyGoalHours * 60 * 60; // Customizable goal in seconds
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / dailyGoalSeconds) * 100));

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeSession?.messages]);

  // Log active files
  useEffect(() => {
    logActiveFiles();
  }, [logActiveFiles]);

  // Redirect block if there is no active session open
  if (!activeSession) {
    return (
      <div className="min-h-screen text-foreground bg-canvas">
        <Navbar model={currentModel} onModelClick={() => setPopup("ai")} />
        <MainContainer>
          <div className="glass rounded-3xl p-8 max-w-md mx-auto mt-20 text-center border border-border/45 animate-pop-in glow-amber">
            <ShieldAlert className="size-12 text-amber-glow mx-auto mb-4 animate-pulse" />
            <h2 className="font-display font-extrabold text-xl text-foreground">No Active Study Session</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              You haven't opened a study workspace. Go back to the dashboard to select a session or launch a new one.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-glow to-coral text-white font-bold text-xs px-6 py-3.5 glow-amber hover:brightness-110 transition"
            >
              Go to Dashboard <ArrowRight className="size-4" />
            </Link>
          </div>
        </MainContainer>
      </div>
    );
  }

  // Filter vault documents
  const sessionDocuments = documents.filter((doc) =>
    activeSession.documentIds.includes(doc.id)
  );

  const globalDocumentsNotInSession = documents.filter(
    (doc) => !activeSession.documentIds.includes(doc.id)
  );

  const readerDoc = documents.find((d) => d.id === viewportDocId);

  // Chat message submit
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userQuery = chatInput;
    addMessageToSession(activeSession.id, "user", userQuery);
    setChatInput("");

    const activeDocNames = sessionDocuments.filter(d => d.active).map(d => d.name);

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userQuery,
          model: currentModel,
          document_names: activeDocNames
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const evidence = (data.sources || []).map((src: any) => ({
          file: src.source,
          page: src.page || 1,
          snippet: "Referenced text section from local vector database query.",
        }));
        
        addMessageToSession(
          activeSession.id,
          "ai",
          data.answer,
          evidence
        );
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        addMessageToSession(
          activeSession.id,
          "ai",
          `⚠️ **Backend Error (${response.status}):** ${errorData.detail || "The AI could not process your request. Please check if documents are uploaded and indexed."}`
        );
      }
    } catch (err) {
      console.error("[TextStream Client] FastAPI backend query failed:", err);
      addMessageToSession(
        activeSession.id,
        "ai",
        "⚠️ **Cannot reach the AI backend.** Make sure the Python FastAPI server is running at http://localhost:8000.\n\nStart it with:\n```\ncd backend\npython main.py\n```"
      );
    }
  };

  const handleRunSummary = async () => {
    setIsSummarizing(true);
    setSummaryShown(true);
    setSummaryData(null);
    
    const activeDocNames = sessionDocuments.filter(d => d.active).map(d => d.name);
    try {
      const response = await fetch("http://localhost:8000/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_names: activeDocNames,
          model: currentModel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSummaryData(data);
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        setSummaryData({
          takeaways: [`⚠️ Backend Error (${response.status}): ${errorData.detail || "Could not generate summary."}`],
          terminology: [],
          insights: "Please check that the backend server is running and documents are uploaded.",
        });
      }
    } catch (err) {
      console.error("Summary fetch error:", err);
      setSummaryData({
        takeaways: ["⚠️ Cannot reach the AI backend at http://localhost:8000."],
        terminology: [],
        insights: "Make sure the Python FastAPI server is running. Start it with: cd backend && python main.py",
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleLaunchQuiz = async () => {
    setIsGeneratingQuiz(true);
    setPopup("active-quiz");
    setQuizQuestions([]);
    
    const activeDocNames = sessionDocuments.filter(d => d.active).map(d => d.name);
    try {
      const response = await fetch("http://localhost:8000/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_names: activeDocNames,
          model: currentModel,
          question_count: qCount,
          difficulty: difficulty
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQuizQuestions(data.questions || []);
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        setQuizQuestions([{
          question: `⚠️ Backend Error (${response.status}): ${errorData.detail || "Could not generate quiz."}`,
          options: ["Try again", "Check backend", "Upload documents", "Switch AI model"],
          correct_index: 0,
          explanation: "The AI backend returned an error. Make sure documents are uploaded and the server is running."
        }]);
      }
    } catch (err) {
      console.error("Quiz fetch error:", err);
      setQuizQuestions([{
        question: "⚠️ Cannot reach the AI backend at http://localhost:8000",
        options: ["Start backend server", "Check your connection", "Retry later", "Upload documents first"],
        correct_index: 0,
        explanation: "Make sure the Python FastAPI server is running. Start it with: cd backend && python main.py"
      }]);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleEndSession = () => {
    if (activeSession) {
      endSession(activeSession.id);
      setActiveSessionId(null);
      navigate({ to: "/" });
    }
  };

  // Upload PDF in Workspace vault
  const handleWorkspaceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64String = (reader.result as string).split(",")[1];
          
          // Import our server function
          const { uploadLocalDocument } = await import("@/lib/api/document.functions");
          
          const result = await uploadLocalDocument({
            data: {
              fileName: file.name,
              fileBase64: base64String
            }
          });
          
          if (result && result.success) {
            const newDoc = {
              id: `doc-${Date.now()}`,
              name: file.name,
              pages: result.pages,
              active: true,
              uploadedAt: new Date().toISOString(),
              paragraphs: result.paragraphs
            };
            addDocument(newDoc);
            addDocumentToSession(activeSession.id, newDoc.id);
            // Set viewport to view the newly uploaded document immediately!
            setViewportDocId(newDoc.id);
          }
        } catch (err) {
          console.error("Local file upload failed in onload:", err);
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Local file upload failed:", error);
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen text-foreground">
      {/* Top bar */}
      <Navbar
        model={currentModel}
        onModelClick={() => setPopup("ai")}
      />

      {/* Main Container */}
      <MainContainer>
        {popup === "active-quiz" ? (
          <div className="max-w-3xl mx-auto animate-pop-in">
            <ActiveQuizView
              mode={quizMode}
              questions={quizQuestions}
              isGenerating={isGeneratingQuiz}
              onClose={() => {
                setPopup(null);
                setQuizQuestions([]);
              }}
            />
          </div>
        ) : (
          <>
            {/* Sleek Compact Focus Status Bar */}
            <div className="glass rounded-2xl p-3 border border-border/40 flex flex-wrap items-center justify-between gap-3 text-xs mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Clock className="size-4 text-mint animate-pulse" />
              <span>Workspace Focus Timer:</span>
              <span className="font-mono text-sm tracking-tight text-mint">{formatTime(elapsedSeconds)}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextPaused = !isPaused;
                setIsPaused(nextPaused);
                setIsManuallyPaused(nextPaused);
              }}
              className={`size-6 rounded-lg flex items-center justify-center transition ${
                isPaused ? "bg-mint text-white glow-mint" : "bg-secondary text-foreground hover:bg-secondary/70"
              }`}
            >
              {isPaused ? <Play className="size-2.5 fill-current" /> : <Pause className="size-2.5" />}
            </button>
            <button
              type="button"
              onClick={handleEndSession}
              className="px-2.5 py-1 rounded-lg bg-coral/20 hover:bg-coral text-coral hover:text-white transition text-[10px] font-bold shadow-sm"
            >
              End Session
            </button>
          </div>

          <div className="flex items-center gap-3 flex-1 max-w-sm">
            <span className="text-muted-foreground shrink-0 flex items-center gap-1 text-[10px]">
              Goal:{" "}
              {showGoalPicker ? (
                <select
                  value={studyGoalHours}
                  onChange={(e) => {
                    setStudyGoalHours(parseInt(e.target.value, 10));
                    setShowGoalPicker(false);
                  }}
                  onBlur={() => setShowGoalPicker(false)}
                  className="bg-canvas border border-border/80 outline-none rounded px-1 py-0.5 text-[10px] text-foreground font-bold focus:ring-1 focus:ring-amber-glow"
                  autoFocus
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12].map((h) => (
                    <option key={h} value={h}>
                      {h}h
                    </option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={() => setShowGoalPicker(true)}
                  className="text-foreground font-bold hover:underline cursor-pointer bg-secondary/40 hover:bg-secondary/70 px-1.5 py-0.5 rounded transition text-[10px]"
                  title="Click to edit study goal"
                >
                  {studyGoalHours}h ✏️
                </button>
              )}
            </span>
            <div className="h-1.5 flex-1 rounded-full bg-muted/65 overflow-hidden border border-border/10">
              <div className="h-full bg-gradient-to-r from-mint to-lavender rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="font-bold text-foreground shrink-0">{progressPercent}%</span>
          </div>

          <div className="flex items-center gap-1.5 bg-coral/10 text-coral border border-coral/20 px-2.5 py-1 rounded-xl font-bold text-[10px]">
            <Flame className="size-3 fill-current" />
            <span>Streak: {streakCount} {streakCount === 1 ? "Day" : "Days"}</span>
          </div>
        </div>

        {/* Dual pane layout */}
        <div className={`grid grid-cols-1 gap-4 transition-all duration-300 ${
          readerDoc ? "lg:grid-cols-[46%_54%]" : "lg:grid-cols-[55%_45%]"
        }`}>
          {/* LEFT: Chat / Summarizer */}
          <section className="relative glass rounded-3xl p-5 min-h-[78vh] lg:h-[78vh] lg:max-h-[78vh] flex flex-col">
            {workMode === "chat" ? (
              <>
                <PanelHeader
                  label="Active Learning Stream"
                  dot="lavender"
                  right={
                    <span className="text-xs text-muted-foreground">
                      {activeSession.messages?.length || 0} messages · synced
                    </span>
                  }
                />

                {/* Message list */}
                <div
                  ref={chatContainerRef}
                  className="flex-1 mt-4 space-y-4 overflow-y-auto pr-1 max-h-[60vh]"
                >
                  {activeSession.messages && activeSession.messages.length > 0 ? (
                    activeSession.messages.map((msg) => (
                      <ChatBubble key={msg.id} role={msg.role} timestamp={msg.timestamp}>
                        <div className="leading-relaxed whitespace-pre-wrap text-sm">{msg.content}</div>
                        {msg.evidence && msg.evidence.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {msg.evidence.map((ev, idx) => (
                              <EvidenceBadge
                                key={idx}
                                file={ev.file}
                                page={ev.page}
                                snippet={ev.snippet}
                              />
                            ))}
                          </div>
                        )}
                      </ChatBubble>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-border/40 rounded-2xl py-12">
                      <MessageCircle className="size-8 text-muted-foreground mb-2 animate-pulse" />
                      <p className="text-sm font-semibold text-foreground">Workspace Chat Empty</p>
                      <p className="text-xs text-muted-foreground max-w-xs mt-1">
                        Send a message below to start your study session. Ask {currentModel === "velocity" ? "Velocity Core" : "Deep Thinker"} anything!
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <SummarizerPanel
                shown={summaryShown}
                summaryData={summaryData}
                isSummarizing={isSummarizing}
                onRun={handleRunSummary}
                onExit={() => {
                  setWorkMode("chat");
                  setSummaryShown(false);
                  setSummaryData(null);
                }}
              />
            )}

            {/* Floating input dock */}
            <form onSubmit={handleSendMessage} className="mt-4 relative">
              {popup === "tools" && (
                <ToolsMenuPopup
                  onClose={() => setPopup(null)}
                  onPick={(p) => {
                    if (p === "chat") {
                      setWorkMode("chat");
                      setPopup(null);
                    } else if (p === "summarize") {
                      setWorkMode("summarize");
                      setSummaryShown(false);
                      setPopup(null);
                    } else {
                      setPopup("quiz");
                    }
                  }}
                />
              )}
              <div className="glass-strong rounded-full px-2 py-2 flex items-center gap-2 shadow-glass">
                <button
                  type="button"
                  onClick={() =>
                    setPopup(popup === "tools" ? null : "tools")
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-full bg-amber-glow text-primary-foreground font-semibold text-sm glow-amber hover:brightness-110 transition shrink-0 ${
                    popup === "tools" ? "ring-2 ring-amber-glow/60" : ""
                  }`}
                >
                  <Wand2 className="size-4" />
                  Study Tools
                </button>

                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-transparent outline-none px-3 text-sm placeholder:text-muted-foreground text-foreground"
                  placeholder={
                    workMode === "summarize"
                      ? "Summarizer active — pick docs on the right, then hit Run…"
                      : `Chat with ${currentModel === "velocity" ? "Velocity Core" : "Deep Thinker"} about your selected PDFs…`
                  }
                  disabled={workMode === "summarize"}
                />

                <button
                  type="submit"
                  disabled={workMode === "summarize" || !chatInput.trim()}
                  className="size-10 grid place-items-center rounded-full bg-lavender text-white glow-lavender hover:brightness-110 transition disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </form>

            {/* Quiz pop-ups */}
            {popup === "quiz" && (
              <QuizSetupPopup
                mode={quizMode}
                setMode={setQuizMode}
                qCount={qCount}
                setQCount={setQCount}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                onClose={() => setPopup(null)}
                onLaunch={handleLaunchQuiz}
              />
            )}
          </section>

          {/* RIGHT: Viewport & Session Vault */}
          <section className="flex flex-col gap-4 lg:h-[78vh] lg:max-h-[78vh]">
            {/* Screen Reader Viewport (runs only when clicked on vault doc) */}
            <div className="glass rounded-3xl p-4 flex-1 flex flex-col">
              <PanelHeader
                label="Screen Reader Viewport"
                dot="amber"
                right={
                  readerDoc ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {readerDoc.name} · pg 4 / {readerDoc.pages}
                      </span>
                      <button
                        onClick={() => setViewportDocId(null)}
                        title="Close Reader"
                        className="text-[10px] text-muted-foreground hover:text-coral flex items-center gap-1 bg-secondary/40 px-1.5 py-0.5 rounded transition"
                      >
                        <X className="size-2.5" /> Close
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Standby</span>
                  )
                }
              />

              <div className={`mt-3 rounded-2xl bg-gradient-to-b from-[#f8fafc] to-[#e8edf5] text-slate-800 p-4 relative flex flex-col overflow-hidden shadow-inner transition-all duration-300 ${
                readerDoc ? "h-[540px] max-h-[540px]" : "h-[300px] max-h-[300px]"
              }`}>
                {readerDoc ? (
                  <div className="flex flex-col h-full animate-fade-in w-full">
                    {/* Viewport Toolbar */}
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-3 shrink-0">
                      <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg border border-slate-300/30">
                        <button
                          type="button"
                          onClick={zoomOut}
                          disabled={zoomLevel <= 70}
                          title="Zoom Out"
                          className="size-7 rounded flex items-center justify-center hover:bg-slate-300/80 text-slate-700 transition disabled:opacity-40"
                        >
                          <ZoomOut className="size-3.5" />
                        </button>
                        <span className="text-xs font-mono font-bold text-slate-700 px-1.5 select-none min-w-[36px] text-center">
                          {zoomLevel}%
                        </span>
                        <button
                          type="button"
                          onClick={zoomIn}
                          disabled={zoomLevel >= 200}
                          title="Zoom In"
                          className="size-7 rounded flex items-center justify-center hover:bg-slate-300/80 text-slate-700 transition disabled:opacity-40"
                        >
                          <ZoomIn className="size-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={toggleHighlightMode}
                        title={isHighlightMode ? "Disable Highlighter Pen" : "Enable Highlighter Pen"}
                        className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[10px] font-bold transition shadow-sm ${
                          isHighlightMode
                            ? "bg-amber-glow text-primary-foreground glow-amber hover:brightness-110"
                            : "bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300/40"
                        }`}
                      >
                        <Highlighter className="size-3.5" />
                        <span>{isHighlightMode ? "Pen Active" : "Highlight Pen"}</span>
                      </button>
                    </div>

                    {/* Scrollable Document Text Area */}
                    <div 
                      className={`flex-1 overflow-y-auto pr-1 transition-all duration-200 ${
                        readerDoc ? "max-h-[460px]" : "max-h-[220px]"
                      } ${
                        isHighlightMode ? "select-none cursor-cell" : "select-text"
                      }`}
                    >
                      <h3 className="font-display font-bold text-sm text-slate-900 leading-snug">
                        {readerDoc.name.endsWith(".pdf") ? readerDoc.name.slice(0, -4) : readerDoc.name}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase mt-0.5 mb-2 border-b border-slate-200/60 pb-1 shrink-0">
                        Index Viewport Reader · {readerDoc.pages} pages
                      </p>

                      <div 
                        className="space-y-3 text-slate-800 leading-relaxed font-sans"
                        style={{ fontSize: `${(zoomLevel / 100) * 0.75}rem` }}
                      >
                        {getPdfParagraphs(readerDoc).map((para, idx) => {
                          // Split paragraph into words and whitespace, keeping spaces
                          const parts = para.split(/(\s+)/);
                          return (
                            <p key={idx} className="transition-all duration-200 px-1.5 py-1 rounded relative">
                              {parts.map((part, partIdx) => {
                                const isWhitespace = /^\s+$/.test(part);
                                if (isWhitespace) {
                                  // Check if word before and word after are highlighted to draw continuous background
                                  const prevWordKey = `${idx}-${partIdx - 1}`;
                                  const nextWordKey = `${idx}-${partIdx + 1}`;
                                  const isPrevHighlighted = highlightedSegments[readerDoc.id]?.includes(prevWordKey);
                                  const isNextHighlighted = highlightedSegments[readerDoc.id]?.includes(nextWordKey);
                                  const isSpaceHighlighted = isPrevHighlighted && isNextHighlighted;

                                  return (
                                    <span 
                                      key={partIdx}
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        isMouseDownRef.current = true;
                                        if (isSpaceHighlighted) {
                                          e.preventDefault();
                                          dragModeRef.current = "erase";
                                          handleWordClick(readerDoc.id, prevWordKey, "remove");
                                          handleWordClick(readerDoc.id, nextWordKey, "remove");
                                        } else if (isHighlightMode) {
                                          e.preventDefault();
                                          dragModeRef.current = "highlight";
                                          handleWordClick(readerDoc.id, prevWordKey, "add");
                                          handleWordClick(readerDoc.id, nextWordKey, "add");
                                        }
                                      }}
                                      className={isSpaceHighlighted ? "bg-yellow-300/90 text-slate-900 border-b border-yellow-500 font-medium py-1 select-none" : isHighlightMode ? "cursor-cell select-none" : ""}
                                    >
                                      {part}
                                    </span>
                                  );
                                }
                                
                                const wordKey = `${idx}-${partIdx}`;
                                const isWordHighlighted = highlightedSegments[readerDoc.id]?.includes(wordKey);

                                let highlightClass = "";
                                if (isWordHighlighted) {
                                  const isPrevWordHighlighted = partIdx >= 2 && highlightedSegments[readerDoc.id]?.includes(`${idx}-${partIdx - 2}`);
                                  const isNextWordHighlighted = partIdx <= parts.length - 3 && highlightedSegments[readerDoc.id]?.includes(`${idx}-${partIdx + 2}`);
                                  
                                  if (isPrevWordHighlighted && isNextWordHighlighted) {
                                    highlightClass = "bg-yellow-300/90 text-slate-900 border-b border-yellow-500 font-medium rounded-none px-0";
                                  } else if (isPrevWordHighlighted) {
                                    highlightClass = "bg-yellow-300/90 text-slate-900 border-b border-yellow-500 font-medium rounded-r rounded-l-none pl-0 pr-1 shadow-sm";
                                  } else if (isNextWordHighlighted) {
                                    highlightClass = "bg-yellow-300/90 text-slate-900 border-b border-yellow-500 font-medium rounded-l rounded-r-none pl-1 pr-0 shadow-sm";
                                  } else {
                                    highlightClass = "bg-yellow-300/90 text-slate-900 border-b border-yellow-500 font-medium rounded px-1 shadow-sm";
                                  }
                                } else if (isHighlightMode) {
                                  highlightClass = "hover:bg-yellow-500/20 cursor-cell";
                                }
                                
                                return (
                                  <span
                                    key={partIdx}
                                    data-word-key={wordKey}
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      isMouseDownRef.current = true;
                                      if (isWordHighlighted) {
                                        e.preventDefault(); // prevent browser default drag text selection
                                        dragModeRef.current = "erase";
                                        handleWordClick(readerDoc.id, wordKey, "remove");
                                      } else if (isHighlightMode) {
                                        e.preventDefault(); // prevent browser default drag text selection
                                        dragModeRef.current = "highlight";
                                        handleWordClick(readerDoc.id, wordKey, "add");
                                      }
                                    }}
                                    onMouseEnter={() => {
                                      if (isMouseDownRef.current) {
                                        if (dragModeRef.current === "erase") {
                                          handleWordClick(readerDoc.id, wordKey, "remove");
                                        } else if (dragModeRef.current === "highlight" && isHighlightMode) {
                                          handleWordClick(readerDoc.id, wordKey, "add");
                                        }
                                      }
                                    }}
                                    className={`transition-all duration-150 select-text ${
                                      isHighlightMode ? "select-none" : "select-text"
                                    } ${highlightClass}`}
                                  >
                                    {part}
                                  </span>
                                );
                              })}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <FileText className="size-10 text-slate-400/80 mb-2 animate-pulse" />
                    <p className="font-semibold text-sm text-slate-700">Viewport Standby</p>
                    <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
                      Screen Reader is offline. Click **Read PDF** on any document card in the Session Vault below to activate.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Session Vault */}
            <div className="glass rounded-3xl p-4 shrink-0">
              <PanelHeader label="Session Vault" dot="mint" />
              <p className="text-[10px] text-muted-foreground mt-1 mb-2">
                PDF indexes loaded into this study space. Click **Read PDF** to view.
              </p>

              {sessionDocuments.length > 0 ? (
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {sessionDocuments.map((doc) => {
                    const isCurrentlyReading = viewportDocId === doc.id;
                    return (
                      <div key={doc.id} className="relative group/source">
                        <SourceCard
                          name={doc.name}
                          pages={doc.pages}
                          active={doc.active}
                          onToggle={() => toggleDocument(doc.id)}
                        />
                        <button
                          type="button"
                          onClick={() => setViewportDocId(doc.id)}
                          className={`absolute right-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[10px] font-bold transition shadow ${
                            isCurrentlyReading
                              ? "bg-mint text-white glow-mint"
                              : "bg-secondary/70 text-foreground hover:bg-amber-glow hover:text-primary-foreground"
                          }`}
                        >
                          {isCurrentlyReading ? "Reading" : "Read PDF"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass border border-dashed border-border/45 rounded-2xl p-3 text-center text-xs text-muted-foreground">
                  No PDFs attached to this session yet. Upload a file or add global files below.
                </div>
              )}

              {/* Upload to Session */}
              <input
                type="file"
                id="workspace-pdf-upload"
                accept=".pdf,.txt"
                className="hidden"
                onChange={handleWorkspaceUpload}
              />
              <label
                htmlFor="workspace-pdf-upload"
                className={`mt-3 w-full rounded-2xl border-2 border-dashed border-amber-glow/40 bg-amber-glow/5 hover:bg-amber-glow/10 transition py-3 flex items-center justify-center gap-2 text-amber-glow font-semibold cursor-pointer text-xs ${
                  isUploading ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-amber-glow" />
                    Ingesting & indexing PDF...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Upload PDF to Session
                  </>
                )}
              </label>

              {/* Add from Global Vault */}
              {globalDocumentsNotInSession.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">
                    📦 Add from Global Vault to Session
                  </p>
                  <div className="space-y-1 max-h-[110px] overflow-y-auto pr-1">
                    {globalDocumentsNotInSession.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between bg-muted/20 border border-border/40 rounded-xl px-3 py-1.5 text-xs">
                        <span className="font-semibold text-foreground truncate max-w-[160px]">{doc.name}</span>
                        <button
                          onClick={() => addDocumentToSession(activeSession.id, doc.id)}
                          className="px-2 py-0.5 rounded-lg bg-amber-glow/20 text-amber-glow hover:bg-amber-glow hover:text-primary-foreground font-bold transition text-[10px]"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
        </>
        )}
      </MainContainer>

      {/* AI Engine Popup (global overlay) */}
      {popup === "ai" && (
        <AiEnginePopup
          current={currentModel}
          onPick={(m) => {
            setCurrentModel(m);
            setPopup(null);
          }}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}

/* ──────────────────────────── Workspace Popup Components ──────────────────────────── */

function AiEnginePopup({
  current,
  onPick,
  onClose,
}: {
  current: ModelKey;
  onPick: (m: ModelKey) => void;
  onClose: () => void;
}) {
  return (
    <PopupShell onClose={onClose} global>
      <div className="glass-strong rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-xl font-bold">
              Choose your AI Engine
            </h3>
            <p className="text-sm text-muted-foreground">
              Pick the brain that fits the task.
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-9 rounded-full glass grid place-items-center hover:bg-secondary/60"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <EngineCard
            active={current === "velocity"}
            onClick={() => onPick("velocity")}
            icon={<Zap className="size-6 text-white" />}
            iconBg="bg-lavender glow-lavender"
            title="The Velocity Core"
            sub="Groq / Llama"
            body="Optimized for rapid fire flashcard reviews and instant summary generation."
            accent="lavender"
          />
          <EngineCard
            active={current === "deep"}
            onClick={() => onPick("deep")}
            icon={<Compass className="size-6 text-primary-foreground" />}
            iconBg="bg-amber-glow glow-amber"
            title="The Deep Thinker"
            sub="Gemini Flash"
            body="Optimized for cross-referencing massive textbooks and complex engineering problem-solving."
            accent="amber"
          />
        </div>
      </div>
    </PopupShell>
  );
}

function ToolsMenuPopup({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (p: "chat" | "summarize" | "quiz") => void;
}) {
  const items: {
    key: "chat" | "summarize" | "quiz";
    n: string;
    title: string;
    sub: string;
    icon: React.ReactNode;
    accent: "lavender" | "amber" | "mint";
  }[] = [
    {
      key: "chat",
      n: "1",
      title: "Guided Chat",
      sub: "Conversational tutor parsing only the PDFs locked ON.",
      icon: <MessageCircle className="size-5" />,
      accent: "lavender",
    },
    {
      key: "summarize",
      n: "2",
      title: "Direct Summarizer",
      sub: "One-click markdown breakdown of selected documents.",
      icon: <ScrollText className="size-5" />,
      accent: "amber",
    },
    {
      key: "quiz",
      n: "3",
      title: "Evaluation Quiz Core",
      sub: "Sprint, Marathon, Blitz or Sudden Death testing dashboard.",
      icon: <GraduationCap className="size-5" />,
      accent: "mint",
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div
        className="absolute bottom-full left-0 right-0 mb-3 z-40 animate-pop-in"
        style={{ backdropFilter: "blur(12px)" }}
      >
        <div className="glass-strong rounded-3xl p-4 shadow-glass border border-border/60">
          <div className="flex items-center justify-between px-2 pb-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-glow glow-amber" />
              <h4 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Study Tools — Pick a Pillar
              </h4>
            </div>
            <button
              onClick={onClose}
              className="size-7 rounded-full glass grid place-items-center hover:bg-secondary/60"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {items.map((it) => {
              const a = ACCENT_CLASSES[it.accent];
              return (
                <button
                  type="button"
                  key={it.key}
                  onClick={() => onPick(it.key)}
                  className={`text-left rounded-2xl p-4 glass hover:scale-[1.02] transition group ring-1 ring-transparent hover:${a.ring}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`size-7 rounded-lg grid place-items-center text-xs font-bold ${a.bg} ${a.text}`}
                    >
                      {it.n}
                    </span>
                    <div
                      className={`size-9 rounded-xl grid place-items-center ${a.bg} ${a.text}`}
                    >
                      {it.icon}
                    </div>
                  </div>
                  <h5 className="font-display font-bold text-sm">
                    {it.title}
                  </h5>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {it.sub}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function QuizSetupPopup({
  mode,
  setMode,
  qCount,
  setQCount,
  difficulty,
  setDifficulty,
  onClose,
  onLaunch,
}: {
  mode: QuizMode;
  setMode: (m: QuizMode) => void;
  qCount: number;
  setQCount: (n: number) => void;
  difficulty: number;
  setDifficulty: (n: number) => void;
  onClose: () => void;
  onLaunch: () => void;
}) {
  return (
    <PopupShell onClose={onClose}>
      <div className="glass-strong rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-2xl font-bold">
              Quiz Engine Dashboard
            </h3>
            <p className="text-sm text-muted-foreground">
              Configure your test in three steps.
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-9 rounded-full glass grid place-items-center hover:bg-secondary/60"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Module 1 */}
        <ModuleLabel n={1} title="Select Your Quiz Dynamic" />
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {QUIZ_MODES.map((m) => {
            const a = ACCENT_CLASSES[m.accent];
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`text-left rounded-2xl p-4 glass transition hover:scale-[1.02] ${
                  active ? `ring-2 ${a.ring} ${a.glow}` : ""
                }`}
              >
                <div
                  className={`size-10 rounded-xl grid place-items-center ${a.bg} ${a.text}`}
                >
                  {m.icon}
                </div>
                <h4 className="mt-3 font-display font-bold">{m.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {m.sub}
                </p>
              </button>
            );
          })}
        </div>

        {/* Module 2 */}
        <ModuleLabel n={2} title="Visual Parameters" className="mt-6" />
        <div className="mt-3 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              Question Length
            </p>
            <div className="flex gap-2">
              {[5, 10, 20].map((n) => (
                <button
                  key={n}
                  onClick={() => setQCount(n)}
                  className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition ${
                    qCount === n
                      ? "bg-amber-glow text-primary-foreground glow-amber"
                      : "glass hover:bg-secondary/60"
                  }`}
                >
                  {n} Questions
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Difficulty Gauge
              </p>
              <span
                className="text-xs font-semibold"
                style={{ color: gaugeColor(difficulty) }}
              >
                {difficulty < 33
                  ? "Easy"
                  : difficulty < 66
                  ? "Challenging"
                  : "Hard Core Exam"}
              </span>
            </div>
            <div className="relative h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${difficulty}%`,
                  background: `linear-gradient(90deg, oklch(0.72 0.16 165), oklch(0.78 0.16 75))`,
                }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={difficulty}
              onChange={(e) => setDifficulty(parseInt(e.target.value))}
              className="w-full mt-2 accent-amber-glow"
            />
          </div>
        </div>

        <button
          onClick={onLaunch}
          className="mt-6 w-full rounded-2xl py-4 font-display font-bold text-base bg-gradient-to-r from-amber-glow via-coral to-lavender text-white glow-amber hover:brightness-110 transition"
        >
          Launch Quiz Engine →
        </button>
      </div>
    </PopupShell>
  );
}

function gaugeColor(v: number) {
  if (v < 33) return "oklch(0.72 0.16 165)";
  if (v < 66) return "oklch(0.78 0.16 75)";
  return "oklch(0.68 0.22 15)";
}

function ActiveQuizView({
  mode,
  questions,
  isGenerating,
  onClose,
}: {
  mode: QuizMode;
  questions: QuizQuestion[];
  isGenerating: boolean;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(20);

  const answered = selectedOption !== null;

  // Timer logic for Sprint Mode
  useEffect(() => {
    if (mode !== "sprint" || showResult || isGenerating || questions.length === 0) return;
    if (answered) return; // Stop counting once answered

    setTimerSeconds(20); // Reset timer when current question changes

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto select an incorrect option (-1) to reveal explanation
          setSelectedOption(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex, answered, mode, showResult, isGenerating, questions.length]);

  if (isGenerating) {
    return (
      <div className="glass-strong rounded-3xl p-8 border border-border/40 shadow-glass text-center py-16">
        <Loader2 className="size-12 animate-spin text-amber-glow mx-auto mb-4" />
        <h3 className="font-display text-xl font-bold">Synthesizing Your Evaluation Quiz</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          Our AI is reading your active PDFs, extracting key concepts, and formatting questions. This will take a few seconds...
        </p>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="glass-strong rounded-3xl p-8 border border-border/40 shadow-glass text-center py-16">
        <ShieldAlert className="size-12 text-coral mx-auto mb-4 animate-pulse" />
        <h3 className="font-display text-xl font-bold">No Questions Generated</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          Please make sure you have uploaded and selected active PDFs on the right panel before launching the quiz.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 px-6 py-2.5 rounded-full bg-secondary text-foreground hover:bg-secondary/80 font-semibold text-sm transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  if (showResult) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <div className="glass-strong rounded-3xl p-8 border border-border/40 shadow-glass text-center animate-pop-in">
        <GraduationCap className="size-16 text-mint mx-auto mb-4 animate-bounce" />
        <h3 className="font-display text-2xl font-bold font-sans">Quiz Session Completed!</h3>
        <p className="text-sm text-muted-foreground mt-1 uppercase tracking-wider font-semibold font-sans">
          Mode: {mode.toUpperCase()}
        </p>

        <div className="my-8">
          <div className="inline-block relative">
            <span className="text-6xl font-extrabold text-foreground font-mono">{score}</span>
            <span className="text-2xl text-muted-foreground font-mono"> / {questions.length}</span>
          </div>
          <p className="text-sm font-semibold mt-2 font-sans" style={{ color: percent >= 70 ? "oklch(0.72 0.16 165)" : "oklch(0.68 0.22 15)" }}>
            {percent >= 90 ? "Mastery achieved! Excellent job!" : percent >= 70 ? "Solid understanding! Keep it up!" : "Keep studying and try again!"}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-mint to-lavender text-white font-bold text-sm glow-mint hover:brightness-110 transition"
        >
          Return to Workspace
        </button>
      </div>
    );
  }

  const handleSelectOption = (index: number) => {
    if (answered) return;
    setSelectedOption(index);
    if (index === currentQuestion.correct_index) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    if (mode === "sudden" && selectedOption !== currentQuestion.correct_index) {
      setShowResult(true);
    } else if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  const isSuddenDeathFailed = mode === "sudden" && answered && selectedOption !== currentQuestion.correct_index;

  return (
    <div className="glass-strong rounded-3xl p-8 border border-border/40 shadow-glass">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Question
          </span>
          <span className="font-display font-bold text-lg">
            {(currentIndex + 1).toString().padStart(2, "0")} / {questions.length.toString().padStart(2, "0")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {mode === "sprint" ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-mint/15 text-mint text-xs font-bold glow-mint">
              <Timer className="size-3.5" />
              00:{timerSeconds.toString().padStart(2, "0")}
            </div>
          ) : (
            <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-lavender glow-lavender transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-full glass grid place-items-center hover:bg-secondary/60"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="text-center my-6">
        <h3 className="font-display text-2xl font-bold leading-snug max-w-lg mx-auto">
          {currentQuestion.question}
        </h3>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {currentQuestion.options.map((opt, i) => {
          const isCorrect = i === currentQuestion.correct_index;
          const isPicked = selectedOption === i;
          let cls = "glass hover:scale-[1.01] hover:bg-secondary/40 text-left";
          if (answered) {
            if (isCorrect) cls = "bg-mint/20 ring-2 ring-mint glow-mint text-left";
            else if (isPicked) cls = "bg-coral/20 ring-2 ring-coral glow-coral text-left";
            else cls = "glass opacity-60 text-left";
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectOption(i)}
              disabled={answered}
              className={`rounded-2xl p-4 transition flex gap-3 items-start ${cls}`}
            >
              <span
                className={`size-8 rounded-xl grid place-items-center font-display font-bold text-sm shrink-0 ${
                  answered && isCorrect
                    ? "bg-mint text-white"
                    : answered && isPicked
                    ? "bg-coral text-white"
                    : "bg-secondary text-foreground"
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm leading-relaxed pt-1">{opt}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-5 glass rounded-2xl p-4 animate-slide-down">
          <div className="flex items-center gap-2 text-mint font-display font-bold text-sm">
            <Sparkles className="size-4" /> Why this answer?
          </div>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed font-sans">
            {currentQuestion.explanation}
          </p>
          {isSuddenDeathFailed && (
            <p className="text-sm text-coral font-bold mt-2 font-sans">
              ⚠️ Answer is incorrect! Sudden Death Mode triggered. The quiz terminates now.
            </p>
          )}
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleNextQuestion}
              className="rounded-full px-5 py-2 bg-lavender text-white text-sm font-semibold glow-lavender hover:brightness-110"
            >
              {isSuddenDeathFailed
                ? "Show Results (Sudden Death) →"
                : currentIndex < questions.length - 1
                ? "Next Question →"
                : "Finish →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── Summarizer Workspace Panel ──────────────────────────── */

function SummarizerPanel({
  shown,
  summaryData,
  isSummarizing,
  onRun,
  onExit,
}: {
  shown: boolean;
  summaryData: { takeaways: string[]; terminology: string[]; insights: string } | null;
  isSummarizing: boolean;
  onRun: () => void;
  onExit: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <PanelHeader
        label="Summarizer Workspace"
        dot="amber"
        right={
          <button
            onClick={onExit}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X className="size-3.5" /> Exit
          </button>
        }
      />

      {/* Instruction header with arrow trace pointing right to the vault */}
      <div className="mt-4 relative">
        <div className="glass-strong rounded-2xl p-5 ring-1 ring-amber-glow/40 glow-amber">
          <div className="flex items-start gap-3">
            <span className="size-9 rounded-xl bg-amber-glow/20 text-amber-glow grid place-items-center shrink-0 animate-pulse">
              <Pin className="size-5" />
            </span>
            <div className="flex-1">
              <h3 className="font-display font-bold text-base">
                📌 SELECT Documents to summarize
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Toggle the files you want included on the right panel — only
                ACTIVE files feed the summary.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-1 text-amber-glow font-semibold text-xs animate-pulse">
              <span>Right panel</span>
              <ArrowRight className="size-5" />
            </div>
          </div>
          {/* Glow trace line */}
          <div className="hidden md:block absolute -right-4 top-1/2 w-16 h-0.5 bg-gradient-to-r from-amber-glow to-transparent" />
        </div>
      </div>

      {/* Run button */}
      <button
        onClick={onRun}
        disabled={isSummarizing}
        className="mt-4 w-full rounded-2xl py-5 font-display font-bold text-base bg-gradient-to-r from-amber-glow via-[oklch(0.8_0.18_60)] to-coral text-white glow-amber hover:brightness-110 transition flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isSummarizing ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Generating Summary...
          </>
        ) : (
          <>
            <Sparkles className="size-5" />
            ✨ Run One-Click Document Summary
          </>
        )}
      </button>

      {/* Summary output */}
      <div className="flex-1 mt-4 overflow-y-auto pr-1">
        {isSummarizing ? (
          <div className="h-full grid place-items-center text-center text-xs text-muted-foreground py-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="size-8 animate-spin text-amber-glow" />
              <span>Analyzing documents and synthesizing key takeaways...</span>
            </div>
          </div>
        ) : shown && summaryData ? (
          <div className="glass rounded-2xl p-5 animate-slide-down space-y-5 text-sm leading-relaxed">
            <div>
              <h4 className="font-display font-bold text-base flex items-center gap-2 text-mint">
                <Check className="size-4" /> Bulleted Takeaways
              </h4>
              <ul className="mt-2 space-y-1.5 list-disc list-inside text-muted-foreground">
                {summaryData.takeaways.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold text-base flex items-center gap-2 text-lavender">
                <BookOpen className="size-4" /> Technical Terminology
              </h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {summaryData.terminology.map((t) => (
                  <span
                    key={t}
                    className="text-xs glass rounded-full px-3 py-1 font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-display font-bold text-base flex items-center gap-2 text-amber-glow">
                <Sparkles className="size-4" /> Core Insights
              </h4>
              <p className="mt-2 text-muted-foreground whitespace-pre-wrap">
                {summaryData.insights}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full grid place-items-center text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl py-10 px-4">
            Summary output will materialize here — pick docs and hit Run.
          </div>
        )}
      </div>
    </div>
  );
}
