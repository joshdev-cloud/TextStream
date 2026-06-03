/**
 * ProductivityBar — Shared interactive dashboard component.
 *
 * Tracks elapsed session duration, daily study goal progress, and study streak.
 * Includes play/pause controls for the timer to let users track focused study blocks.
 * Supports inline editing of the daily study goal from 1 to 12 hours.
 * Automatically pauses focus tracking when tab is hidden or user switches screens.
 */

import { useState, useEffect, useRef } from "react";
import { Clock, Play, Pause, Flame, Trophy, Sparkles } from "lucide-react";
import { useDocumentManager } from "@/hooks/useDocumentManager";

export function ProductivityBar() {
  const { studyGoalHours, setStudyGoalHours, streakCount } = useDocumentManager();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize focus start time
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedStart = sessionStorage.getItem("textstream_study_start");
      const storedElapsed = sessionStorage.getItem("textstream_study_elapsed");

      if (storedElapsed) {
        setElapsedSeconds(parseInt(storedElapsed, 10));
      }

      if (!storedStart) {
        sessionStorage.setItem("textstream_study_start", Date.now().toString());
      }
    }
  }, []);

  // Timer interval logic
  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (typeof window !== "undefined") {
            sessionStorage.setItem("textstream_study_elapsed", next.toString());
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  // Page Visibility API auto-pause/resume handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setIsPaused(true);
      } else if (document.visibilityState === "visible") {
        if (!isManuallyPaused) {
          setIsPaused(false);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isManuallyPaused]);

  // Format time (HH:MM:SS)
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, "0"),
      mins.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":");
  };

  // Progress percentage linked strictly to customizable study goal, no offset
  const dailyGoalSeconds = studyGoalHours * 60 * 60;
  const progressPercent = Math.min(
    100,
    Math.round((elapsedSeconds / dailyGoalSeconds) * 100)
  );

  const toggleTimer = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    setIsManuallyPaused(nextPaused);
  };

  return (
    <div className="glass rounded-3xl p-4 md:p-5 border border-border/40 relative overflow-hidden animate-fade-in mb-6">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-mint/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        {/* Left: Timer */}
        <div className="flex items-center gap-4">
          <div className="size-11 rounded-2xl bg-mint/10 text-mint grid place-items-center glow-mint">
            <Clock className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Focus Session Timer
              </p>
              {isPaused && (
                <span className="text-[10px] bg-amber-glow/20 text-amber-glow font-bold px-1.5 py-0.5 rounded-full uppercase">
                  Paused
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-display font-bold text-2xl text-foreground tracking-tight select-none font-mono">
                {formatTime(elapsedSeconds)}
              </span>
              <button
                onClick={toggleTimer}
                title={isPaused ? "Resume study block" : "Pause study block"}
                className={`size-8 rounded-xl flex items-center justify-center transition ${
                  isPaused
                    ? "bg-mint text-white glow-mint hover:scale-[1.05]"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {isPaused ? <Play className="size-3.5 fill-current" /> : <Pause className="size-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Center: Daily Target Progress */}
        <div className="flex-1 max-w-md lg:mx-8">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
              <Trophy className="size-3.5 text-amber-glow" /> Daily Study Target
            </span>
            <span className="text-xs font-bold text-foreground">
              {progressPercent}% completed
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted/60 overflow-hidden border border-border/25">
            <div
              className="h-full bg-gradient-to-r from-mint to-lavender rounded-full transition-all duration-500 ease-out glow-mint"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
            <span>
              Focus goal:{" "}
              {showGoalPicker ? (
                <select
                  value={studyGoalHours}
                  onChange={(e) => {
                    setStudyGoalHours(parseInt(e.target.value, 10));
                    setShowGoalPicker(false);
                  }}
                  onBlur={() => setShowGoalPicker(false)}
                  className="bg-canvas border border-border/80 outline-none rounded px-1.5 py-0.5 text-[10px] text-foreground font-bold focus:ring-1 focus:ring-amber-glow"
                  autoFocus
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12].map((h) => (
                    <option key={h} value={h}>
                      {h}.0 {h === 1 ? "hour" : "hours"}
                    </option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={() => setShowGoalPicker(true)}
                  className="text-foreground font-bold hover:underline cursor-pointer bg-secondary/40 hover:bg-secondary/70 px-1.5 py-0.5 rounded transition"
                  title="Click to edit study goal"
                >
                  {studyGoalHours}.0 {studyGoalHours === 1 ? "hour" : "hours"} ✏️
                </button>
              )}
            </span>
            <span>You've earned {Math.round(elapsedSeconds / 60)} minutes today!</span>
          </div>
        </div>

        {/* Right: Study Streak & Tip */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 bg-coral/10 text-coral border border-coral/20 px-3.5 py-2 rounded-2xl glow-coral">
            <Flame className="size-4 fill-current animate-bounce" />
            <div>
              <p className="text-[10px] text-coral/80 font-bold uppercase tracking-widest leading-none">
                Streak
              </p>
              <p className="font-display font-extrabold text-sm leading-none mt-1">
                {streakCount} {streakCount === 1 ? "Day" : "Days"}
              </p>
            </div>
          </div>

          <div className="hidden xl:block max-w-[200px]">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 leading-snug">
              <Sparkles className="size-3.5 text-lavender shrink-0" />
              <span>
                "Take a 5-min walk every 50 mins of study."
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
