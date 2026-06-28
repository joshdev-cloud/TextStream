/**
 * ModelBadge — AI engine status indicator pill and dropdown selector.
 */

import { Zap, Compass, ChevronDown, Check } from "lucide-react";
import { useDocumentManager } from "@/hooks/useDocumentManager";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ModelKey = "velocity" | "deep";

export function ModelBadge() {
  const { currentModel, setCurrentModel } = useDocumentManager();
  const isVel = currentModel === "velocity";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`glass rounded-full pl-2 pr-4 py-1.5 flex items-center gap-2 text-sm font-semibold hover:scale-[1.02] transition outline-none ${
            isVel ? "glow-lavender border-lavender/30" : "glow-amber border-amber-glow/30"
          } border cursor-pointer`}
        >
          <span
            className={`size-6 rounded-full grid place-items-center ${
              isVel ? "bg-lavender" : "bg-amber-glow"
            }`}
          >
            {isVel ? (
              <Zap className="size-3.5 text-white" />
            ) : (
              <Compass className="size-3.5 text-primary-foreground" />
            )}
          </span>
          <span>{isVel ? "Velocity Core" : "Deep Thinker"}</span>
          <ChevronDown className="size-3.5 text-muted-foreground ml-1" />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-[300px] glass-strong border-border/40 p-2 rounded-2xl shadow-2xl">
        <DropdownMenuItem 
          className="flex flex-col items-start gap-1 p-3 rounded-xl cursor-pointer hover:bg-secondary/60 focus:bg-secondary/60 data-[highlighted]:bg-secondary/60"
          onClick={() => setCurrentModel("velocity")}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-full bg-lavender grid place-items-center">
                <Zap className="size-3.5 text-white" />
              </span>
              <span className="font-bold text-sm text-foreground">The Velocity Core</span>
            </div>
            {isVel && <Check className="size-4 text-lavender" />}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            Optimized for rapid fire flashcard reviews and instant summary generation.
          </p>
        </DropdownMenuItem>

        <DropdownMenuItem 
          className="flex flex-col items-start gap-1 p-3 rounded-xl cursor-pointer hover:bg-secondary/60 focus:bg-secondary/60 data-[highlighted]:bg-secondary/60 mt-1"
          onClick={() => setCurrentModel("deep")}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-full bg-amber-glow grid place-items-center">
                <Compass className="size-3.5 text-primary-foreground" />
              </span>
              <span className="font-bold text-sm text-foreground">The Deep Thinker</span>
            </div>
            {!isVel && <Check className="size-4 text-amber-glow" />}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            Optimized for cross-referencing massive textbooks and complex problem-solving.
          </p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
