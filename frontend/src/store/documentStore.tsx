/**
 * documentStore.tsx — Single source of truth for documents, study sessions, and global UI state.
 *
 * This store uses React Context + useReducer for lightweight, dependency-free
 * state management. It is the centralized place to swap mock data for real
 * API responses once the FastAPI backend is ready.
 *
 * USAGE:
 *   Wrap your app (or a route subtree) with <DocumentProvider>.
 *   Access state via useDocumentStore() in any child component.
 */

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  type Dispatch,
} from "react";
import type { ModelKey } from "@/components/ui/ModelBadge";

/* ──────────────────────────── Types ──────────────────────────── */

export interface Document {
  id: string;
  name: string;
  pages: number;
  active: boolean;
  uploadedAt: string; // ISO date string
  paragraphs?: string[]; // Extracted text paragraphs from the file
}

export interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
  evidence?: {
    file: string;
    page: number;
    snippet: string;
  }[];
}

export type StudyMode = "RESEARCH MODE" | "FOCUS MODE" | "MAJORS EXAM" | "OTHER";

export interface StudySession {
  id: string;
  title: string;
  mode: StudyMode;
  createdAt: string; // ISO date string
  documentCount: number;
  messageCount: number;
  /** "active" | "completed" | "archived" | "trash" */
  status: "active" | "completed" | "archived" | "trash";
  /** Accent color key for the session card */
  accent: "amber" | "lavender" | "mint" | "coral";
  deletedAt?: string; // ISO date string when moved to trash
  messages?: Message[];
  documentIds: string[]; // List of global document IDs associated with this session
  lastWorkedAt: string; // ISO date string indicating the last time it was opened/worked on
}

export interface DocumentState {
  documents: Document[];
  sessions: StudySession[];
  theme: "dark" | "light";
  currentModel: ModelKey;
  activeSessionId: string | null; // Starts as null, selected session is active
  studyGoalHours: number;
  streakCount: number; // Consecutive calendar days visited
  showGlobalVaultModal: boolean; // Flag to show/hide the global vault manager modal
  quizzesTaken: number; // Number of quizzes completed
}

/* ──────────────────────────── Actions ──────────────────────────── */

export type DocumentAction =
  | { type: "TOGGLE_DOCUMENT"; payload: { id: string } }
  | { type: "ADD_DOCUMENT"; payload: Document }
  | { type: "SET_DOCUMENTS"; payload: Document[] }
  | { type: "DELETE_DOCUMENT"; payload: { id: string } }
  | { type: "ADD_SESSION"; payload: StudySession }
  | { type: "SET_SESSIONS"; payload: StudySession[] }
  | { type: "RENAME_SESSION"; payload: { id: string; title: string } }
  | { type: "TRASH_SESSION"; payload: { id: string } }
  | { type: "RESTORE_SESSION"; payload: { id: string } }
  | { type: "DELETE_SESSION_PERMANENT"; payload: { id: string } }
  | { type: "TOGGLE_THEME" }
  | { type: "SET_THEME"; payload: "dark" | "light" }
  | { type: "SET_MODEL"; payload: ModelKey }
  | { type: "SET_ACTIVE_SESSION"; payload: string | null }
  | { type: "ADD_MESSAGE"; payload: { sessionId: string; message: Message } }
  | { type: "ADD_DOCUMENT_TO_SESSION"; payload: { sessionId: string; documentId: string } }
  | { type: "REMOVE_DOCUMENT_FROM_SESSION"; payload: { sessionId: string; documentId: string } }
  | { type: "SET_STUDY_GOAL"; payload: number }
  | { type: "TOUCH_SESSION"; payload: { id: string } }
  | { type: "REHYDRATE_STATE"; payload: { documents: Document[]; sessions: StudySession[]; studyGoalHours: number } }
  | { type: "SET_STREAK"; payload: number }
  | { type: "TOGGLE_GLOBAL_VAULT"; payload?: boolean }
  | { type: "SYNC_DOCUMENTS"; payload: Document[] }
  | { type: "END_SESSION_MOVE_TO_CONTINUE"; payload: { id: string } }
  | { type: "EMPTY_TRASH" }
  | { type: "INCREMENT_QUIZZES_TAKEN" };

/* ──────────────────────────── Mock Data ──────────────────────────── */

/* Mock documents removed — documents are now synced from the real backend/documents folder */

/* Mock sessions removed — all sessions are now created by the user */

/* ──────────────────────────── Reducer ──────────────────────────── */

function documentReducer(
  state: DocumentState,
  action: DocumentAction
): DocumentState {
  switch (action.type) {
    case "TOGGLE_DOCUMENT":
      return {
        ...state,
        documents: state.documents.map((doc) =>
          doc.id === action.payload.id ? { ...doc, active: !doc.active } : doc
        ),
      };
    case "ADD_DOCUMENT":
      return {
        ...state,
        documents: [...state.documents, action.payload],
      };
    case "SET_DOCUMENTS":
      return { ...state, documents: action.payload };
    case "ADD_SESSION":
      return {
        ...state,
        sessions: [action.payload, ...state.sessions],
      };
    case "SET_SESSIONS":
      return { ...state, sessions: action.payload };
    case "RENAME_SESSION":
      return {
        ...state,
        sessions: state.sessions.map((sess) =>
          sess.id === action.payload.id
            ? { ...sess, title: action.payload.title }
            : sess
        ),
      };
    case "TRASH_SESSION":
      return {
        ...state,
        sessions: state.sessions.map((sess) =>
          sess.id === action.payload.id
            ? {
                ...sess,
                status: "trash",
                deletedAt: new Date().toISOString(),
              }
            : sess
        ),
        // If the active session is deleted, clear active session
        activeSessionId:
          state.activeSessionId === action.payload.id
            ? null
            : state.activeSessionId,
      };
    case "RESTORE_SESSION":
      return {
        ...state,
        sessions: state.sessions.map((sess) =>
          sess.id === action.payload.id
            ? {
                ...sess,
                status: "active",
                deletedAt: undefined,
              }
            : sess
        ),
      };
    case "DELETE_SESSION_PERMANENT":
      return {
        ...state,
        sessions: state.sessions.filter((sess) => sess.id !== action.payload.id),
        activeSessionId:
          state.activeSessionId === action.payload.id
            ? null
            : state.activeSessionId,
      };
    case "TOGGLE_THEME":
      return {
        ...state,
        theme: state.theme === "dark" ? "light" : "dark",
      };
    case "SET_THEME":
      return {
        ...state,
        theme: action.payload,
      };
    case "SET_MODEL":
      return {
        ...state,
        currentModel: action.payload,
      };
    case "SET_ACTIVE_SESSION":
      return {
        ...state,
        activeSessionId: action.payload,
      };
    case "ADD_MESSAGE":
      return {
        ...state,
        sessions: state.sessions.map((sess) =>
          sess.id === action.payload.sessionId
            ? {
                ...sess,
                messages: [...(sess.messages || []), action.payload.message],
                messageCount: (sess.messages || []).length + 1,
              }
            : sess
        ),
      };
    case "ADD_DOCUMENT_TO_SESSION":
      return {
        ...state,
        sessions: state.sessions.map((sess) =>
          sess.id === action.payload.sessionId
            ? {
                ...sess,
                documentIds: [...(sess.documentIds || []).filter(id => id !== action.payload.documentId), action.payload.documentId],
                documentCount: [...(sess.documentIds || []).filter(id => id !== action.payload.documentId), action.payload.documentId].length,
              }
            : sess
        ),
      };
    case "REMOVE_DOCUMENT_FROM_SESSION":
      return {
        ...state,
        sessions: state.sessions.map((sess) =>
          sess.id === action.payload.sessionId
            ? {
                ...sess,
                documentIds: (sess.documentIds || []).filter((id) => id !== action.payload.documentId),
                documentCount: Math.max(0, (sess.documentIds || []).length - 1),
              }
            : sess
        ),
      };
    case "SET_STUDY_GOAL":
      return {
        ...state,
        studyGoalHours: action.payload,
      };
    case "TOUCH_SESSION":
      return {
        ...state,
        sessions: state.sessions.map((sess) =>
          sess.id === action.payload.id
            ? { ...sess, lastWorkedAt: new Date().toISOString() }
            : sess
        ),
      };
    case "DELETE_DOCUMENT":
      return {
        ...state,
        documents: state.documents.filter((doc) => doc.id !== action.payload.id),
        sessions: state.sessions.map((sess) => ({
          ...sess,
          documentIds: (sess.documentIds || []).filter((id) => id !== action.payload.id),
          documentCount: (sess.documentIds || []).filter((id) => id !== action.payload.id).length,
        })),
      };
    case "TOGGLE_GLOBAL_VAULT":
      return {
        ...state,
        showGlobalVaultModal: action.payload !== undefined ? action.payload : !state.showGlobalVaultModal,
      };
    case "SYNC_DOCUMENTS":
      // Merge documents based on filename, avoiding duplicates
      const existingNames = new Set(state.documents.map((d) => d.name));
      const newDocs = action.payload.filter((d) => !existingNames.has(d.name));
      return {
        ...state,
        documents: [...state.documents, ...newDocs],
      };
    case "END_SESSION_MOVE_TO_CONTINUE":
      return {
        ...state,
        sessions: state.sessions.map((sess) =>
          sess.id === action.payload.id
            ? { ...sess, lastWorkedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() }
            : sess
        ),
      };
    case "EMPTY_TRASH":
      return {
        ...state,
        sessions: state.sessions.filter((sess) => sess.status !== "trash"),
      };
    case "REHYDRATE_STATE":
      return {
        ...state,
        documents: action.payload.documents,
        sessions: action.payload.sessions,
        studyGoalHours: action.payload.studyGoalHours,
        quizzesTaken: (action.payload as any).quizzesTaken || 0,
      };
    case "SET_STREAK":
      return {
        ...state,
        streakCount: action.payload,
      };
    case "INCREMENT_QUIZZES_TAKEN":
      return {
        ...state,
        quizzesTaken: state.quizzesTaken + 1,
      };
    default:
      return state;
  }
}

/* ──────────────────────────── Context ──────────────────────────── */

interface DocumentContextValue {
  state: DocumentState;
  dispatch: Dispatch<DocumentAction>;
}

const DocumentContext = createContext<DocumentContextValue | null>(null);

/* ──────────────────────────── Provider ──────────────────────────── */

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(documentReducer, {
    documents: [], // Starts clean (no pseudo PDFs)
    sessions: [], // Starts clean (no mock sessions)
    theme: "dark",
    currentModel: "velocity",
    activeSessionId: null, // Clear initial active session so it is only active on explicit click
    studyGoalHours: 2, // Default daily study goal is 2 hours
    streakCount: 1, // Default streak count is 1
    showGlobalVaultModal: false, // Hidden by default
    quizzesTaken: 0, // Starts at 0
  });

  // Apply theme class to HTML node on change
  useEffect(() => {
    const root = window.document.documentElement;
    if (state.theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  }, [state.theme]);

  // Load state from localStorage on mount (client-only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedDocs = localStorage.getItem("textstream_documents");
      const storedSessions = localStorage.getItem("textstream_sessions");
      const storedGoal = localStorage.getItem("textstream_study_goal");
      const storedQuizzes = localStorage.getItem("textstream_quizzes_taken");

      if (storedDocs || storedSessions || storedGoal || storedQuizzes) {
        dispatch({
          type: "REHYDRATE_STATE",
          payload: {
            documents: storedDocs ? JSON.parse(storedDocs) : [],
            sessions: storedSessions ? JSON.parse(storedSessions) : [],
            studyGoalHours: storedGoal ? parseInt(storedGoal, 10) : 2,
            quizzesTaken: storedQuizzes ? parseInt(storedQuizzes, 10) : 0,
          } as any,
        });
      }
    }
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("textstream_documents", JSON.stringify(state.documents));
      localStorage.setItem("textstream_sessions", JSON.stringify(state.sessions));
      localStorage.setItem("textstream_study_goal", state.studyGoalHours.toString());
      localStorage.setItem("textstream_quizzes_taken", state.quizzesTaken.toString());
    }
  }, [state.documents, state.sessions, state.studyGoalHours, state.quizzesTaken]);

  // Day Streak logic on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
      const lastVisit = localStorage.getItem("textstream_last_visit");
      const storedStreak = localStorage.getItem("textstream_streak_count");
      
      let newStreak = 1;
      if (lastVisit && storedStreak) {
        const lastDate = new Date(lastVisit);
        const todayDate = new Date(todayStr);
        // Reset times to midnight to calculate day difference accurately
        lastDate.setHours(0, 0, 0, 0);
        todayDate.setHours(0, 0, 0, 0);
        
        const diffTime = todayDate.getTime() - lastDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        const currentStreak = parseInt(storedStreak, 10);
        
        if (diffDays === 0) {
          // Same day visit
          newStreak = currentStreak;
        } else if (diffDays === 1) {
          // Consecutive day visit
          newStreak = currentStreak + 1;
          localStorage.setItem("textstream_last_visit", todayStr);
        } else {
          // Streak broken
          newStreak = 1;
          localStorage.setItem("textstream_last_visit", todayStr);
        }
      } else {
        localStorage.setItem("textstream_last_visit", todayStr);
        localStorage.setItem("textstream_streak_count", "1");
      }
      
      localStorage.setItem("textstream_streak_count", newStreak.toString());
      dispatch({ type: "SET_STREAK", payload: newStreak });
    }
  }, []);

  // Auto-scan folder on mount to discover any dropped PDFs
  useEffect(() => {
    const autoSync = async () => {
      try {
        const { syncLocalDocuments } = await import("@/lib/api/document.functions");
        const result = await syncLocalDocuments();
        if (result && result.length > 0) {
          const mappedDocs = result.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            pages: doc.pages,
            active: doc.active,
            uploadedAt: doc.uploadedAt,
            paragraphs: doc.paragraphs,
          }));
          dispatch({ type: "SYNC_DOCUMENTS", payload: mappedDocs });
        }
      } catch (err) {
        console.error("Auto-sync folder failed:", err);
      }
    };
    
    const timer = setTimeout(autoSync, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <DocumentContext.Provider value={{ state, dispatch }}>
      {children}
    </DocumentContext.Provider>
  );
}

/* ──────────────────────────── Hook ──────────────────────────── */

/**
 * Access the document store from any component inside <DocumentProvider>.
 * Throws if used outside the provider boundary.
 */
export function useDocumentStore(): DocumentContextValue {
  const ctx = useContext(DocumentContext);
  if (!ctx) {
    throw new Error(
      "useDocumentStore must be used within a <DocumentProvider>. " +
        "Wrap your route or app with <DocumentProvider>."
    );
  }
  return ctx;
}
