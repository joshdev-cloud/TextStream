/**
 * Route: /workspace
 *
 * Renders the active study interface with dual-pane layout
 * (Chat/Summarizer + Screen Reader Viewport).
 *
 * The page component lives in @/pages/Workspace.tsx.
 * This file is a thin TanStack Router wrapper.
 */

import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Workspace } from "@/pages/Workspace";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

function WorkspaceWrapper() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.navigate({ to: "/login" });
    }
  }, [session, isLoading, router]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="text-foreground">Loading...</div></div>;
  }

  if (!session) {
    return null; // Will redirect via useEffect
  }

  return <Workspace />;
}

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "TextStream — Study Workspace" },
      {
        name: "description",
        content:
          "Active study workspace with AI-powered chat, document summarizer, and quiz engine.",
      },
      { property: "og:title", content: "TextStream — Study Workspace" },
      {
        property: "og:description",
        content:
          "Dual-pane study interface with conversational tutoring and document analysis.",
      },
    ],
  }),
  component: WorkspaceWrapper,
});
