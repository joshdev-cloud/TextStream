/**
 * PopupShell — Reusable modal overlay wrapper.
 *
 * Provides a backdrop blur overlay with centered content.
 * Can be positioned absolutely (within a parent) or fixed (full viewport).
 */

import type { ReactNode } from "react";

interface PopupShellProps {
  children: ReactNode;
  onClose: () => void;
  /** When true, uses fixed positioning for full-viewport overlay */
  global?: boolean;
}

export function PopupShell({ children, onClose, global = false }: PopupShellProps) {
  return (
    <div
      className={`${
        global ? "fixed" : "absolute"
      } inset-0 z-40 flex items-center justify-center p-4 animate-fade-in`}
    >
      <div
        className="absolute inset-0 bg-canvas/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl animate-pop-in">{children}</div>
    </div>
  );
}
