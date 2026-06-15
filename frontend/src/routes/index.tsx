/**
 * Route: / (index)
 *
 * Renders the TextStream dashboard / classroom entrance.
 * Shows all active conversation threads and a "New Study Session" entry point.
 *
 * The page component lives in @/pages/MainPage.tsx.
 * This file is a thin TanStack Router wrapper.
 */

import { createFileRoute, useRouter } from "@tanstack/react-router";
import { MainPage } from "@/pages/MainPage";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

function MainPageWrapper() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.navigate({ to: "/login" });
    }
  }, [session, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <MainPage />;
}

export const Route = createFileRoute("/")({
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
