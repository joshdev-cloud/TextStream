/**
 * Route: /workspace
 *
 * Renders the active study interface with dual-pane layout
 * (Chat/Summarizer + Screen Reader Viewport).
 *
 * The page component lives in @/pages/Workspace.tsx.
 * This file is a thin TanStack Router wrapper.
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { Workspace } from "@/pages/Workspace";
import { supabase } from "@/lib/supabase";

function WorkspaceWrapper() {
  return <Workspace />;
}

export const Route = createFileRoute("/workspace")({
  beforeLoad: async () => {
    // Check if there's an OAuth callback in the URL (hash or query)
    const isAuthCallback = window.location.hash.includes("access_token") || window.location.search.includes("code=");
    
    if (isAuthCallback) {
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
  },
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
