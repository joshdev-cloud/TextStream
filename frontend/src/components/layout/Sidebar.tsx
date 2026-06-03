/**
 * Sidebar — Collapsible left navigation panel.
 *
 * Provides quick access to sessions and documents.
 * Currently a minimal stub — expand as features are added.
 *
 * TODO: EDIT HERE — Populate with real session/document lists from the API.
 * TODO: EDIT HERE — Add collapse/expand toggle with localStorage persistence.
 */

import { useState } from "react";
import {
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

interface SidebarProps {
  /** Whether the sidebar is visible */
  open: boolean;
  /** Toggle sidebar visibility */
  onToggle: () => void;
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  return (
    <>
      {/* Toggle button — always visible */}
      <button
        onClick={onToggle}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-20 size-8 rounded-r-xl bg-secondary/80 backdrop-blur-sm grid place-items-center hover:bg-secondary transition"
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
      >
        {open ? (
          <ChevronLeft className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
      </button>

      {/* Sidebar panel */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-10 w-64 glass-strong border-r border-border/40 pt-20 px-4 pb-6 flex flex-col gap-6 transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Quick Actions */}
        <div>
          <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-3">
            Quick Actions
          </h3>
          <button className="w-full rounded-2xl border-2 border-dashed border-amber-glow/40 bg-amber-glow/5 hover:bg-amber-glow/10 transition py-3 flex items-center justify-center gap-2 text-amber-glow font-semibold text-sm">
            <Plus className="size-4" />
            New Session
          </button>
        </div>

        {/* Recent Sessions */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-3">
            Recent Sessions
          </h3>
          {/* TODO: EDIT HERE — Map over sessions from useDocumentManager() */}
          <div className="space-y-2">
            <SidebarItem icon={<BookOpen className="size-4" />} label="Organic Chemistry" active />
            <SidebarItem icon={<BookOpen className="size-4" />} label="Thermodynamics" />
            <SidebarItem icon={<BookOpen className="size-4" />} label="Cell Biology" />
          </div>
        </div>

        {/* Document shortcuts */}
        <div>
          <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-3">
            Pinned Documents
          </h3>
          {/* TODO: EDIT HERE — Map over pinned/active documents from the store */}
          <div className="space-y-2">
            <SidebarItem icon={<FileText className="size-4 text-amber-glow" />} label="orgo-notes.pdf" />
            <SidebarItem icon={<FileText className="size-4 text-amber-glow" />} label="clayden-ch17.pdf" />
          </div>
        </div>
      </aside>
    </>
  );
}

/* ── Internal sub-component ── */

function SidebarItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`w-full text-left rounded-xl px-3 py-2 flex items-center gap-2.5 text-sm transition ${
        active
          ? "bg-amber-glow/10 text-foreground font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
