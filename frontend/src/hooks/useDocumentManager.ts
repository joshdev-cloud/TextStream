/**
 * useDocumentManager — High-level hook for document and session lifecycle management.
 *
 * Wraps the low-level documentStore dispatch with named methods,
 * filtered selectors, and console logging for debugging during
 * development. This is the primary hook consumed by MainPage and Workspace.
 *
 * TODO: EDIT HERE — Each method is a future integration point
 * for FastAPI endpoints. Replace console.log + dispatch calls
 * with async fetch + dispatch patterns.
 */

import { useMemo, useCallback } from "react";
import { useDocumentStore, type Document, type StudySession, type Message, type StudyMode } from "@/store/documentStore";
import type { ModelKey } from "@/components/ui/ModelBadge";

const LOG_PREFIX = "[DocumentManager]";

export function useDocumentManager() {
  const { state, dispatch } = useDocumentStore();

  /** All documents in the store */
  const documents = state.documents;

  /** Only documents currently toggled ON */
  const activeDocuments = useMemo(
    () => state.documents.filter((doc) => doc.active),
    [state.documents]
  );

  /** All study sessions (both active, completed, archived) */
  const sessions = state.sessions;

  /** Active model choice (velocity or deep) */
  const currentModel = state.currentModel;

  /** Current UI theme (dark or light) */
  const theme = state.theme;

  /** Active session ID */
  const activeSessionId = state.activeSessionId;

  /** Active study goal (hours) */
  const studyGoalHours = state.studyGoalHours;

  /** Selected active session object */
  const activeSession = useMemo(() => {
    return state.sessions.find((s) => s.id === state.activeSessionId) || null;
  }, [state.sessions, state.activeSessionId]);

  /**
   * Mark a study session as worked on now.
   */
  const touchSession = useCallback((id: string) => {
    console.log(`${LOG_PREFIX} touchSession("${id}")`);
    dispatch({ type: "TOUCH_SESSION", payload: { id } });
  }, [dispatch]);

  /**
   * Set the active session.
   */
  const setActiveSessionId = useCallback((id: string | null) => {
    console.log(`${LOG_PREFIX} setActiveSessionId("${id}")`);
    dispatch({ type: "SET_ACTIVE_SESSION", payload: id });
    if (id) {
      dispatch({ type: "TOUCH_SESSION", payload: { id } });
    }
  }, [dispatch]);

  /**
   * Toggle a document's active state.
   *
   * TODO: EDIT HERE — Send PATCH /api/documents/:id/toggle to persist
   * the active state on the backend, then dispatch on success.
   */
  const toggleDocument = useCallback(
    (id: string) => {
      const doc = state.documents.find((d) => d.id === id);
      console.log(
        `${LOG_PREFIX} toggleDocument("${id}") — "${doc?.name}" → ${!doc?.active}`
      );
      dispatch({ type: "TOGGLE_DOCUMENT", payload: { id } });
    },
    [state.documents, dispatch]
  );

  /**
   * Add a new document to the store.
   *
   * TODO: EDIT HERE — POST /api/documents with the file payload,
   * receive the created Document object, then dispatch ADD_DOCUMENT.
   */
  const addDocument = useCallback(
    (doc: Document) => {
      console.log(`${LOG_PREFIX} addDocument("${doc.name}") — ${doc.pages} pages`);
      dispatch({ type: "ADD_DOCUMENT", payload: doc });
    },
    [dispatch]
  );

  /**
   * Associate an existing global document with a study session.
   *
   * TODO: EDIT HERE — POST /api/sessions/:sessionId/documents with { documentId }
   */
  const addDocumentToSession = useCallback((sessionId: string, documentId: string) => {
    console.log(`${LOG_PREFIX} addDocumentToSession("${sessionId}", "${documentId}")`);
    dispatch({ type: "ADD_DOCUMENT_TO_SESSION", payload: { sessionId, documentId } });
  }, [dispatch]);

  /**
   * Remove a document from a study session.
   *
   * TODO: EDIT HERE — DELETE /api/sessions/:sessionId/documents/:documentId
   */
  const removeDocumentFromSession = useCallback((sessionId: string, documentId: string) => {
    console.log(`${LOG_PREFIX} removeDocumentFromSession("${sessionId}", "${documentId}")`);
    dispatch({ type: "REMOVE_DOCUMENT_FROM_SESSION", payload: { sessionId, documentId } });
  }, [dispatch]);

  /**
   * Toggle the global UI theme (light/dark).
   */
  const toggleTheme = useCallback(() => {
    console.log(`${LOG_PREFIX} toggleTheme() — "${state.theme}" → ${state.theme === "dark" ? "light" : "dark"}`);
    dispatch({ type: "TOGGLE_THEME" });
  }, [state.theme, dispatch]);

  /**
   * Set active AI model.
   *
   * TODO: EDIT HERE — If desired, save model preference on the backend.
   */
  const setCurrentModel = useCallback((model: ModelKey) => {
    console.log(`${LOG_PREFIX} setCurrentModel("${model}")`);
    dispatch({ type: "SET_MODEL", payload: model });
  }, [dispatch]);

  /**
   * Create a new study session.
   *
   * TODO: EDIT HERE — POST /api/sessions with { title, mode, accent },
   * get the created session from the API, then dispatch ADD_SESSION.
   */
  const createSession = useCallback((title: string, mode: StudyMode, accent: "amber" | "lavender" | "mint" | "coral") => {
    const newSession: StudySession = {
      id: `sess-${Date.now()}`,
      title,
      mode,
      createdAt: new Date().toISOString(),
      lastWorkedAt: new Date().toISOString(),
      documentCount: 0,
      messageCount: 0,
      status: "active",
      accent,
      documentIds: [], // Start with an empty document vault for new sessions
      messages: [],
    };
    console.log(`${LOG_PREFIX} createSession("${title}") — Mode: ${mode}`);
    dispatch({ type: "ADD_SESSION", payload: newSession });
    dispatch({ type: "SET_ACTIVE_SESSION", payload: newSession.id });
    return newSession.id;
  }, [dispatch]);

  /**
   * Rename a study session.
   *
   * TODO: EDIT HERE — PATCH /api/sessions/:id with { title }, then dispatch.
   */
  const renameSession = useCallback((id: string, title: string) => {
    console.log(`${LOG_PREFIX} renameSession("${id}", "${title}")`);
    dispatch({ type: "RENAME_SESSION", payload: { id, title } });
  }, [dispatch]);

  /**
   * Move a session to the Trash (soft delete).
   *
   * TODO: EDIT HERE — DELETE /api/sessions/:id (soft delete/status=trash), then dispatch.
   */
  const trashSession = useCallback((id: string) => {
    console.log(`${LOG_PREFIX} trashSession("${id}")`);
    dispatch({ type: "TRASH_SESSION", payload: { id } });
  }, [dispatch]);

  /**
   * Restore a session from the Trash.
   *
   * TODO: EDIT HERE — PATCH /api/sessions/:id/restore, then dispatch.
   */
  const restoreSession = useCallback((id: string) => {
    console.log(`${LOG_PREFIX} restoreSession("${id}")`);
    dispatch({ type: "RESTORE_SESSION", payload: { id } });
  }, [dispatch]);

  /**
   * Permanently delete a session.
   *
   * TODO: EDIT HERE — DELETE /api/sessions/:id/permanent, then dispatch.
   */
  const permanentlyDeleteSession = useCallback((id: string) => {
    console.log(`${LOG_PREFIX} permanentlyDeleteSession("${id}")`);
    dispatch({ type: "DELETE_SESSION_PERMANENT", payload: { id } });
  }, [dispatch]);

  /**
   * Add a new chat message to a session.
   *
   * TODO: EDIT HERE — POST /api/sessions/:sessionId/messages with { role, content },
   * get the persisted message & AI response, then dispatch both.
   */
  const addMessageToSession = useCallback((sessionId: string, role: "user" | "ai", content: string, evidence?: Message["evidence"]) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      role,
      content,
      timestamp: new Date().toISOString(),
      evidence,
    };
    console.log(`${LOG_PREFIX} addMessageToSession("${sessionId}", "${role}") — "${content.substring(0, 30)}..."`);
    dispatch({
      type: "ADD_MESSAGE",
      payload: { sessionId, message: newMessage },
    });
  }, [dispatch]);

  const refreshDocuments = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:8000/api/documents");
      if (res.ok) {
        const data = await res.json();
        console.log(`${LOG_PREFIX} refreshDocuments() — fetched ${data.documents?.length} documents`);
      }
    } catch (err) {
      console.error(`${LOG_PREFIX} Failed to refresh documents`, err);
    }
  }, []);

  const refreshSessions = useCallback(() => {
    console.log(`${LOG_PREFIX} refreshSessions() — Sessions are currently managed locally.`);
  }, []);

  /**
   * Set daily focus hour target.
   *
   * TODO: EDIT HERE — PATCH /api/user/goal or similar persistence call
   */
  const setStudyGoalHours = useCallback((hours: number) => {
    console.log(`${LOG_PREFIX} setStudyGoalHours(${hours})`);
    dispatch({ type: "SET_STUDY_GOAL", payload: hours });
  }, [dispatch]);

  /** Streak count */
  const streakCount = state.streakCount;

  /** Quizzes taken count */
  const quizzesTaken = state.quizzesTaken;

  /** Global Vault Modal state */
  const showGlobalVaultModal = state.showGlobalVaultModal;

  /** Increment quizzes taken */
  const incrementQuizzesTaken = useCallback(() => {
    console.log(`${LOG_PREFIX} incrementQuizzesTaken()`);
    dispatch({ type: "INCREMENT_QUIZZES_TAKEN" });
  }, [dispatch]);

  /** Toggle the global vault manager modal */
  const toggleGlobalVault = useCallback((show?: boolean) => {
    console.log(`${LOG_PREFIX} toggleGlobalVault(${show})`);
    dispatch({ type: "TOGGLE_GLOBAL_VAULT", payload: show });
  }, [dispatch]);

  /** Sync documents from folder */
  const syncDocuments = useCallback((docs: Document[]) => {
    console.log(`${LOG_PREFIX} syncDocuments() — merging ${docs.length} files`);
    dispatch({ type: "SYNC_DOCUMENTS", payload: docs });
  }, [dispatch]);

  /** Delete a document globally */
  const deleteDocument = useCallback((id: string) => {
    console.log(`${LOG_PREFIX} deleteDocument("${id}")`);
    dispatch({ type: "DELETE_DOCUMENT", payload: { id } });
  }, [dispatch]);

  /** End an active session (and move to CONTINUE WORKING immediately) */
  const endSession = useCallback((id: string) => {
    console.log(`${LOG_PREFIX} endSession("${id}")`);
    dispatch({ type: "END_SESSION_MOVE_TO_CONTINUE", payload: { id } });
  }, [dispatch]);

  /** Empty the trash vault (permanently delete all trashed sessions) */
  const emptyTrash = useCallback(() => {
    console.log(`${LOG_PREFIX} emptyTrash()`);
    dispatch({ type: "EMPTY_TRASH" });
  }, [dispatch]);

  /**
   * Log the current active document set (useful for debugging).
   */
  const logActiveFiles = useCallback(() => {
    console.log(`${LOG_PREFIX} Active files:`, activeDocuments);
  }, [activeDocuments]);

  return {
    documents,
    activeDocuments,
    sessions,
    currentModel,
    theme,
    activeSessionId,
    activeSession,
    studyGoalHours,
    streakCount,
    quizzesTaken,
    showGlobalVaultModal,
    setActiveSessionId,
    toggleDocument,
    addDocument,
    addDocumentToSession,
    removeDocumentFromSession,
    toggleTheme,
    setCurrentModel,
    createSession,
    renameSession,
    trashSession,
    restoreSession,
    permanentlyDeleteSession,
    addMessageToSession,
    setStudyGoalHours,
    touchSession,
    refreshDocuments,
    refreshSessions,
    logActiveFiles,
    toggleGlobalVault,
    syncDocuments,
    deleteDocument,
    endSession,
    emptyTrash,
    incrementQuizzesTaken,
  };
}
