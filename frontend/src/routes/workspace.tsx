/**
 * Route: /workspace
 *
 * Renders the active study interface with dual-pane layout
 * (Chat/Summarizer + Screen Reader Viewport).
 *
 * The page component lives in @/pages/Workspace.tsx.
 * This file is a thin TanStack Router wrapper.
 */

import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/pages/Workspace";

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
  component: Workspace,
});
