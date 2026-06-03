/**
 * MainContainer — Page wrapper providing consistent layout and glassmorphic styling.
 *
 * Wraps page content with consistent padding, max-width, and responsive behavior.
 * Used by both MainPage and Workspace to ensure visual consistency.
 */

import type { ReactNode } from "react";

interface MainContainerProps {
  children: ReactNode;
  /** Optional extra className for the container */
  className?: string;
  /** Whether to constrain max-width (default: true) */
  constrained?: boolean;
}

export function MainContainer({
  children,
  className = "",
  constrained = true,
}: MainContainerProps) {
  return (
    <main
      className={`p-4 ${
        constrained ? "max-w-[1600px] mx-auto" : ""
      } ${className}`}
    >
      {children}
    </main>
  );
}
