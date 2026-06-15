"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type AppTheme = "tiger" | "wangjai";
export type MascotAction =
  | "logo"
  | "big"
  | "thumbs-up"
  | "salute"
  | "radio"
  | "stop"
  | "danger"
  | "shield"
  | "clipboard"
  | "flashlight"
  | "announce"
  | "whistle"
  | "running"
  | "smile"
  | "happy";

const TIGER_MASCOTS: Record<MascotAction, string> = {
  logo: "/images/mascots/suea-mascot-logo.png",
  big: "/images/mascots/suea-mascot-logo.png",
  "thumbs-up": "/images/mascots/suea-thumbs-up.png",
  salute: "/images/mascots/suea-mascot-logo.png",
  radio: "/images/mascots/suea-mascot-logo.png",
  stop: "/images/mascots/suea-shield.png",
  danger: "/images/mascots/suea-shield.png",
  shield: "/images/mascots/suea-shield.png",
  clipboard: "/images/mascots/suea-mascot-logo.png",
  flashlight: "/images/mascots/suea-shield.png",
  announce: "/images/mascots/suea-mascot-logo.png",
  whistle: "/images/mascots/suea-mascot-logo.png",
  running: "/images/mascots/suea-mascot-logo.png",
  smile: "/images/mascots/suea-mascot-logo.png",
  happy: "/images/mascots/suea-thumbs-up.png",
};

const WANGJAI_MASCOTS: Record<MascotAction, string> = {
  logo: "/images/mascots/nong-wangjai/transparent/logo-head-v5.png",
  big: "/images/mascots/nong-wangjai/transparent/salute.png",
  "thumbs-up": "/images/mascots/nong-wangjai/transparent/happy.png",
  salute: "/images/mascots/nong-wangjai/transparent/salute.png",
  radio: "/images/mascots/nong-wangjai/transparent/radio.png",
  stop: "/images/mascots/nong-wangjai/transparent/stop.png",
  danger: "/images/mascots/nong-wangjai/transparent/stop.png",
  shield: "/images/mascots/nong-wangjai/transparent/stop.png",
  clipboard: "/images/mascots/nong-wangjai/transparent/clipboard.png",
  flashlight: "/images/mascots/nong-wangjai/transparent/flashlight.png",
  announce: "/images/mascots/nong-wangjai/transparent/announce.png",
  whistle: "/images/mascots/nong-wangjai/transparent/announce.png",
  running: "/images/mascots/nong-wangjai/transparent/running.png",
  smile: "/images/mascots/nong-wangjai/transparent/happy.png",
  happy: "/images/mascots/nong-wangjai/transparent/happy.png",
};

type ThemeContextValue = {
  theme: AppTheme;
  toggleTheme: () => void;
  mascot: (action?: MascotAction) => string;
  mascotForTheme: (theme: AppTheme, action?: MascotAction) => string;
  themedImage: (src: string) => string;
  themedColor: (color?: string) => string;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getMascot(theme: AppTheme, action: MascotAction = "big") {
  return (theme === "wangjai" ? WANGJAI_MASCOTS : TIGER_MASCOTS)[action];
}

function getThemedImage(theme: AppTheme, src: string) {
  if (theme !== "wangjai" || !src.startsWith("/images/mascots/")) return src;
  if (src.includes("reward") || src.includes("thumb")) return getMascot(theme, "happy");
  if (src.includes("ppe")) return getMascot(theme, "salute");
  if (src.includes("line-walk") || src.includes("five-s")) return getMascot(theme, "clipboard");
  return getMascot(theme, "big");
}

function getThemedColor(theme: AppTheme, color?: string) {
  if (!color) return "var(--brand-accent)";
  if (theme === "wangjai" && ["var(--c-f8e46a)", "var(--c-f5bb00)", "var(--c-ffb000)"].includes(color.toLowerCase())) {
    return "var(--brand-accent)";
  }
  return color;
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>("wangjai");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme: () => setTheme((current) => (current === "tiger" ? "wangjai" : "tiger")),
      mascot: (action = "big") => getMascot(theme, action),
      mascotForTheme: getMascot,
      themedImage: (src) => getThemedImage(theme, src),
      themedColor: (color) => getThemedColor(theme, color),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useAppTheme must be used within AppThemeProvider");
  return context;
}
