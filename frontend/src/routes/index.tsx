/**
 * Route: / (index)
 *
 * Renders the TextStream dashboard / classroom entrance.
 * Shows all active conversation threads and a "New Study Session" entry point.
 *
 * The page component lives in @/pages/MainPage.tsx.
 * This file is a thin TanStack Router wrapper.
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { MainPage } from "@/pages/MainPage";
import { supabase } from "@/lib/supabase";

function MainPageWrapper() {
  return <MainPage />;
}

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "TextStream — Interactive Study Space" },
      {
        name: "description",
        content:
          "An AI-powered study workspace with PDF ingestion, conversational tutoring, and pop-up quiz dynamics.",
      },
      {
        property: "og:title",
        content: "TextStream — Interactive Study Space",
      },
      {
        property: "og:description",
        content:
          "Pop-up quiz matrix, dual AI engines, and a verification vault for your textbooks.",
      },
    ],
  }),
  component: MainPageWrapper,
});
