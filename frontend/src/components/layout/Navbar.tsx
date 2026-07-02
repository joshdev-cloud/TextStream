/**
 * Navbar — Top navigation bar for TextStream.
 *
 * Displays the TextStream branding, active session indicator badge (upper right, visible inside sessions only),
 * AI engine selector badge, theme toggle, and navigation links.
 */

import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookOpen, Folder } from "lucide-react";
import { ModelBadge, type ModelKey } from "@/components/ui/ModelBadge";
import { useDocumentManager } from "@/hooks/useDocumentManager";
import { GlobalMenu } from "@/components/layout/GlobalMenu";
import { TextStreamLogo } from "@/components/ui/TextStreamLogo";

interface NavbarProps {
  /** Optional subtitle override */
  subtitle?: string;
}

export function Navbar({ subtitle: propSubtitle }: NavbarProps) {
  const { currentModel, activeSession, toggleGlobalVault, endSession, setActiveSessionId } = useDocumentManager();
  const routerState = useRouterState();

  // Check if we are inside the active study workspace (/workspace)
  const isWorkspace = routerState.location.pathname === "/workspace";
  
  const subtitle = propSubtitle !== undefined ? propSubtitle : (isWorkspace && activeSession ? activeSession.title : undefined);

  return (
    <header className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-border/40 backdrop-blur-md sticky top-0 z-30 bg-canvas/40">
      {/* Left: Branding */}
      <div className="flex items-center gap-2.5">
        <GlobalMenu />
        <TextStreamLogo size="sm" />
        <div>
          <h1 className="text-base font-bold tracking-tight">
            Text<span style={{ color: "oklch(0.78 0.16 75)" }}>Stream</span>{" "}
            <span className="text-muted-foreground font-medium hidden sm:inline-block">
              // Study Space
            </span>
          </h1>
        </div>
      </div>

      {/* Right: Navigation + Controls */}
      <div className="flex items-center gap-3">
        {/* Active Session Indicator (Upper Right, visible only inside workspace sessions) */}
        {subtitle && isWorkspace && activeSession && (
          <div className="hidden md:flex items-center gap-2 animate-slide-down">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-glow/15 border border-amber-glow/30 text-amber-glow text-xs font-semibold glow-amber select-none">
              <span className="size-1.5 rounded-full bg-amber-glow animate-pulse" />
              <span>Active Session: <strong>{subtitle}</strong></span>
            </div>
            <button
              onClick={() => {
                endSession(activeSession.id);
                setActiveSessionId(null);
                window.location.href = "/";
              }}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-coral/10 hover:bg-coral/25 border border-coral/30 text-coral transition cursor-pointer"
            >
              End Session
            </button>
          </div>
        )}

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-1 mr-2">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition"
            activeProps={{
              className:
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-foreground bg-secondary/60",
            }}
          >
            <Home className="size-3.5" />
            Dashboard
          </Link>
          <Link
            to="/workspace"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition"
            activeProps={{
              className:
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-foreground bg-secondary/60",
            }}
          >
            <BookOpen className="size-3.5" />
            Workspace
          </Link>
          {!isWorkspace && (
            <button
              onClick={() => toggleGlobalVault(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition cursor-pointer"
            >
              <Folder className="size-3.5" />
              Global Vault
            </button>
          )}
        </nav>

        <ModelBadge />


      </div>
    </header>
  );
}
