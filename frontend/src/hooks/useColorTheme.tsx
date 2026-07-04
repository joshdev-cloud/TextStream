/**
 * useColorTheme.tsx — React context & hook for per-user color theme management.
 *
 * Provides the `ColorThemeProvider` that:
 *   1. Loads the user's saved theme on mount (from localStorage, keyed by userId)
 *   2. Applies CSS custom properties to document.documentElement.style
 *   3. Persists theme choice to localStorage and Supabase user_metadata
 *   4. Exposes setColorTheme(), setCustomTheme(), and theme state via useColorTheme()
 *
 * When no theme has been explicitly set, falls back to defaults (Nightfall / Daybreak).
 * Once set, the user's choice persists until they explicitly change it.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  ALL_THEMES,
  DARK_THEMES,
  LIGHT_THEMES,
  DEFAULT_DARK_THEME_ID,
  DEFAULT_LIGHT_THEME_ID,
  getThemeById,
  buildCustomThemeVariables,
  type ColorTheme,
  type CustomThemeColors,
} from "@/lib/colorThemes";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

/* ──────────────────────────── Types ──────────────────────────── */

interface ColorThemeContextValue {
  /** The currently active preset theme (null if using custom) */
  activeThemeId: string;
  /** Whether the user is using a custom DIY theme */
  isCustom: boolean;
  /** Current custom colors (only meaningful when isCustom is true) */
  customColors: CustomThemeColors | null;
  /** Current custom mode (only meaningful when isCustom is true) */
  customMode: "dark" | "light";
  /** The resolved ColorTheme object for the active preset */
  activeTheme: ColorTheme;
  /** All available dark presets */
  darkThemes: ColorTheme[];
  /** All available light presets */
  lightThemes: ColorTheme[];
  /** Set the active preset theme by ID. Applies instantly. */
  setColorTheme: (themeId: string) => void;
  /** Set a DIY custom theme. Applies instantly. */
  setCustomTheme: (colors: CustomThemeColors, mode: "dark" | "light") => void;
  /** Clear custom theme and revert to preset */
  clearCustomTheme: () => void;
  /** Save preferences to Supabase (call this when user clicks Save) */
  saveToSupabase: () => Promise<void>;
}

const ColorThemeContext = createContext<ColorThemeContextValue | null>(null);

/* ──────────────────────────── Helpers ──────────────────────────── */

function getStorageKey(userId: string, suffix: string): string {
  return `textstream_${userId}_${suffix}`;
}

/** Apply CSS custom properties to the document root element */
function applyThemeVariables(variables: Record<string, string>) {
  const root = document.documentElement;
  for (const [prop, value] of Object.entries(variables)) {
    root.style.setProperty(prop, value);
  }
}

/** Clear all theme-related inline styles from document root */
function clearThemeVariables() {
  const root = document.documentElement;
  // Remove all custom properties that themes set
  const propsToRemove = [
    "--canvas", "--background", "--foreground",
    "--panel", "--panel-border",
    "--card", "--card-foreground",
    "--popover", "--popover-foreground",
    "--primary", "--primary-foreground",
    "--secondary", "--secondary-foreground",
    "--muted", "--muted-foreground",
    "--accent", "--accent-foreground",
    "--destructive", "--destructive-foreground",
    "--border", "--input", "--ring",
    "--glass-strong-bg", "--glass-strong-border",
    "--amber-glow", "--lavender", "--mint", "--coral",
    "--gradient-canvas",
    "--shadow-glass", "--shadow-amber", "--shadow-lavender",
    "--shadow-mint", "--shadow-coral",
  ];
  for (const prop of propsToRemove) {
    root.style.removeProperty(prop);
  }
}

/* ──────────────────────────── Provider ──────────────────────────── */

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || "guest";

  // State
  const [darkThemeId, setDarkThemeId] = useState<string>(DEFAULT_DARK_THEME_ID);
  const [lightThemeId, setLightThemeId] = useState<string>(DEFAULT_LIGHT_THEME_ID);
  const [isCustom, setIsCustom] = useState(false);
  const [customColors, setCustomColors] = useState<CustomThemeColors | null>(null);
  const [customMode, setCustomMode] = useState<"dark" | "light">("dark");
  const [currentMode, setCurrentMode] = useState<"dark" | "light">("dark");
  const [initialized, setInitialized] = useState(false);

  // Determine active theme ID based on current mode
  const activeThemeId = isCustom
    ? "custom"
    : currentMode === "dark"
      ? darkThemeId
      : lightThemeId;

  // Resolve the active theme object
  const activeTheme = useMemo(() => {
    if (isCustom) {
      // Return a synthetic theme for custom
      return {
        id: "custom",
        name: "Custom",
        mode: currentMode,
        preview: {
          bg: customColors?.background || "#1a1b2e",
          primary: customColors?.primary || "#d4a843",
          accent: customColors?.accent || "#9b7be8",
          text: customColors?.foreground || "#f0eef5",
        },
        variables: customColors
          ? buildCustomThemeVariables(customColors, customMode)
          : {},
      } as ColorTheme;
    }
    return getThemeById(activeThemeId) || getThemeById(DEFAULT_DARK_THEME_ID)!;
  }, [activeThemeId, isCustom, customColors, customMode, currentMode]);

  // ─── Load from localStorage on mount / userId change ───
  useEffect(() => {
    const storedDarkId = localStorage.getItem(getStorageKey(userId, "dark_theme"));
    const storedLightId = localStorage.getItem(getStorageKey(userId, "light_theme"));
    const storedIsCustom = localStorage.getItem(getStorageKey(userId, "is_custom_theme"));
    const storedCustomColors = localStorage.getItem(getStorageKey(userId, "custom_colors"));
    const storedCustomMode = localStorage.getItem(getStorageKey(userId, "custom_mode"));

    if (storedDarkId && getThemeById(storedDarkId)) {
      setDarkThemeId(storedDarkId);
    } else {
      setDarkThemeId(DEFAULT_DARK_THEME_ID);
    }

    if (storedLightId && getThemeById(storedLightId)) {
      setLightThemeId(storedLightId);
    } else {
      setLightThemeId(DEFAULT_LIGHT_THEME_ID);
    }

    if (storedIsCustom === "true" && storedCustomColors) {
      try {
        setCustomColors(JSON.parse(storedCustomColors));
        setIsCustom(true);
        setCustomMode((storedCustomMode as "dark" | "light") || "dark");
      } catch {
        setIsCustom(false);
      }
    } else {
      setIsCustom(false);
    }

    setInitialized(true);
  }, [userId]);

  // ─── Observe mode from DOM (syncs with documentStore's theme toggle) ───
  useEffect(() => {
    const checkMode = () => {
      const root = document.documentElement;
      const isLight = root.classList.contains("light");
      setCurrentMode(isLight ? "light" : "dark");
    };

    // Initial check
    checkMode();

    // Watch for class changes on <html> to sync with TOGGLE_THEME
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "class") {
          checkMode();
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // ─── Apply theme variables whenever active theme changes ───
  useEffect(() => {
    if (!initialized) return;

    if (isCustom && customColors) {
      const vars = buildCustomThemeVariables(customColors, currentMode);
      applyThemeVariables(vars);
    } else {
      const themeId = currentMode === "dark" ? darkThemeId : lightThemeId;
      const theme = getThemeById(themeId);
      if (theme) {
        applyThemeVariables(theme.variables);
      } else {
        // Fallback: clear overrides so CSS defaults apply
        clearThemeVariables();
      }
    }
  }, [initialized, isCustom, customColors, currentMode, darkThemeId, lightThemeId, customMode]);

  // ─── Actions ───

  const setColorTheme = useCallback(
    (themeId: string) => {
      const theme = getThemeById(themeId);
      if (!theme) return;

      setIsCustom(false);
      setCustomColors(null);

      if (theme.mode === "dark") {
        setDarkThemeId(themeId);
        localStorage.setItem(getStorageKey(userId, "dark_theme"), themeId);
      } else {
        setLightThemeId(themeId);
        localStorage.setItem(getStorageKey(userId, "light_theme"), themeId);
      }

      localStorage.removeItem(getStorageKey(userId, "is_custom_theme"));
      localStorage.removeItem(getStorageKey(userId, "custom_colors"));
      localStorage.removeItem(getStorageKey(userId, "custom_mode"));

      // If the theme mode doesn't match current mode, switch modes
      if (theme.mode !== currentMode) {
        // Dispatch a synthetic class change — the documentStore observer will pick it up
        const root = document.documentElement;
        if (theme.mode === "light") {
          root.classList.add("light");
          root.classList.remove("dark");
        } else {
          root.classList.add("dark");
          root.classList.remove("light");
        }
      }

      // Apply immediately
      applyThemeVariables(theme.variables);
    },
    [userId, currentMode]
  );

  const setCustomTheme = useCallback(
    (colors: CustomThemeColors, mode: "dark" | "light") => {
      setIsCustom(true);
      setCustomColors(colors);
      setCustomMode(mode);

      localStorage.setItem(getStorageKey(userId, "is_custom_theme"), "true");
      localStorage.setItem(getStorageKey(userId, "custom_colors"), JSON.stringify(colors));
      localStorage.setItem(getStorageKey(userId, "custom_mode"), mode);

      const vars = buildCustomThemeVariables(colors, mode);
      applyThemeVariables(vars);
    },
    [userId]
  );

  const clearCustomTheme = useCallback(() => {
    setIsCustom(false);
    setCustomColors(null);

    localStorage.removeItem(getStorageKey(userId, "is_custom_theme"));
    localStorage.removeItem(getStorageKey(userId, "custom_colors"));
    localStorage.removeItem(getStorageKey(userId, "custom_mode"));

    // Re-apply current preset
    const themeId = currentMode === "dark" ? darkThemeId : lightThemeId;
    const theme = getThemeById(themeId);
    if (theme) {
      applyThemeVariables(theme.variables);
    } else {
      clearThemeVariables();
    }
  }, [userId, currentMode, darkThemeId, lightThemeId]);

  const saveToSupabase = useCallback(async () => {
    if (!user) return;

    try {
      await supabase.auth.updateUser({
        data: {
          color_theme_dark: darkThemeId,
          color_theme_light: lightThemeId,
          color_theme_is_custom: isCustom,
          color_theme_custom_colors: isCustom && customColors ? JSON.stringify(customColors) : null,
          color_theme_custom_mode: isCustom ? customMode : null,
        },
      });
    } catch (err) {
      console.error("[ColorTheme] Failed to save to Supabase:", err);
    }
  }, [user, darkThemeId, lightThemeId, isCustom, customColors, customMode]);

  // ─── Hydrate from Supabase user_metadata on login ───
  useEffect(() => {
    if (!user || !initialized) return;

    const meta = user.user_metadata;
    if (!meta) return;

    // Only hydrate from Supabase if local doesn't have a preference
    const hasLocal = localStorage.getItem(getStorageKey(userId, "dark_theme"));
    if (hasLocal) return; // Local takes priority — user already has preferences

    if (meta.color_theme_dark && getThemeById(meta.color_theme_dark)) {
      setDarkThemeId(meta.color_theme_dark);
      localStorage.setItem(getStorageKey(userId, "dark_theme"), meta.color_theme_dark);
    }

    if (meta.color_theme_light && getThemeById(meta.color_theme_light)) {
      setLightThemeId(meta.color_theme_light);
      localStorage.setItem(getStorageKey(userId, "light_theme"), meta.color_theme_light);
    }

    if (meta.color_theme_is_custom && meta.color_theme_custom_colors) {
      try {
        const colors = JSON.parse(meta.color_theme_custom_colors);
        setCustomColors(colors);
        setIsCustom(true);
        setCustomMode(meta.color_theme_custom_mode || "dark");
        localStorage.setItem(getStorageKey(userId, "is_custom_theme"), "true");
        localStorage.setItem(getStorageKey(userId, "custom_colors"), meta.color_theme_custom_colors);
        localStorage.setItem(getStorageKey(userId, "custom_mode"), meta.color_theme_custom_mode || "dark");
      } catch {
        // Ignore parse errors
      }
    }
  }, [user, userId, initialized]);

  const value: ColorThemeContextValue = {
    activeThemeId,
    isCustom,
    customColors,
    customMode,
    activeTheme,
    darkThemes: DARK_THEMES,
    lightThemes: LIGHT_THEMES,
    setColorTheme,
    setCustomTheme,
    clearCustomTheme,
    saveToSupabase,
  };

  return (
    <ColorThemeContext.Provider value={value}>
      {children}
    </ColorThemeContext.Provider>
  );
}

/* ──────────────────────────── Hook ──────────────────────────── */

export function useColorTheme(): ColorThemeContextValue {
  const ctx = useContext(ColorThemeContext);
  if (!ctx) {
    throw new Error(
      "useColorTheme must be used within a <ColorThemeProvider>. " +
        "Wrap your route or app with <ColorThemeProvider>."
    );
  }
  return ctx;
}
