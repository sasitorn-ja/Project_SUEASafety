"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type AppTheme = "tiger" | "wangjai";
export type MascotAction =
  | "logo"
  | "logoMobile"
  | "logoApp"
  | "big"
  | "thumbs-up"
  | "createThumb"
  | "salute"
  | "saluteAlt"
  | "radio"
  | "stop"
  | "danger"
  | "shield"
  | "clipboard"
  | "clipboardPost"
  | "clipboardHover"
  | "linewalkClip"
  | "flashlight"
  | "announce"
  | "announce2"
  | "whistle"
  | "running"
  | "smile"
  | "happy"
  | "happyReward"
  | "happyClaim"
  | "gateHappy"
  | "assessHappy"
  | "idea"
  | "idea2"
  | "cheer"
  | "cheer2"
  | "welcome"
  | "firstaid";

const TIGER_MASCOTS: Record<MascotAction, string> = {
  logo: "/images/mascots/suea-mascot-logo.png",
  logoMobile: "/images/mascots/suea-mascot-logo.png",
  logoApp: "/images/mascots/suea-mascot-logo.png",
  big: "/images/mascots/suea-mascot-logo.png",
  "thumbs-up": "/images/mascots/suea-thumbs-up.png",
  createThumb: "/images/mascots/suea-thumbs-up.png",
  salute: "/images/mascots/suea-mascot-logo.png",
  saluteAlt: "/images/mascots/suea-mascot-logo.png",
  radio: "/images/mascots/suea-mascot-logo.png",
  stop: "/images/mascots/suea-shield.png",
  danger: "/images/mascots/suea-shield.png",
  shield: "/images/mascots/suea-shield.png",
  clipboard: "/images/mascots/suea-mascot-logo.png",
  clipboardPost: "/images/mascots/suea-mascot-logo.png",
  clipboardHover: "/images/mascots/suea-mascot-logo.png",
  linewalkClip: "/images/mascots/suea-mascot-logo.png",
  flashlight: "/images/mascots/suea-shield.png",
  announce: "/images/mascots/suea-mascot-logo.png",
  announce2: "/images/mascots/suea-mascot-logo.png",
  whistle: "/images/mascots/suea-mascot-logo.png",
  running: "/images/mascots/suea-mascot-logo.png",
  smile: "/images/mascots/suea-mascot-logo.png",
  happy: "/images/mascots/suea-thumbs-up.png",
  happyReward: "/images/mascots/suea-thumbs-up.png",
  happyClaim: "/images/mascots/suea-thumbs-up.png",
  gateHappy: "/images/mascots/suea-thumbs-up.png",
  assessHappy: "/images/mascots/suea-thumbs-up.png",
  idea: "/images/mascots/suea-mascot-logo.png",
  idea2: "/images/mascots/suea-mascot-logo.png",
  cheer: "/images/mascots/suea-thumbs-up.png",
  cheer2: "/images/mascots/suea-thumbs-up.png",
  welcome: "/images/mascots/suea-mascot-logo.png",
  firstaid: "/images/mascots/suea-shield.png",
};

const WANGJAI_TRANSPARENT_BASE = "/images/mascots/Transparent น้องวางใจ";

// น้องวางใจ (CPAC) set — every display spot uses a UNIQUE image (no duplicates).
const WANGJAI_MASCOTS: Record<MascotAction, string> = {
  logo: `${WANGJAI_TRANSPARENT_BASE}/16.png`,
  logoMobile: `${WANGJAI_TRANSPARENT_BASE}/21.png`,
  logoApp: `${WANGJAI_TRANSPARENT_BASE}/43.png`,
  big: `${WANGJAI_TRANSPARENT_BASE}/9.png`,
  "thumbs-up": `${WANGJAI_TRANSPARENT_BASE}/28.png`,
  createThumb: `${WANGJAI_TRANSPARENT_BASE}/30.png`,
  salute: `${WANGJAI_TRANSPARENT_BASE}/23.png`,
  saluteAlt: `${WANGJAI_TRANSPARENT_BASE}/14.png`,
  radio: `${WANGJAI_TRANSPARENT_BASE}/15.png`,
  stop: `${WANGJAI_TRANSPARENT_BASE}/8.png`,
  danger: `${WANGJAI_TRANSPARENT_BASE}/18.png`,
  shield: `${WANGJAI_TRANSPARENT_BASE}/31.png`,
  clipboard: `${WANGJAI_TRANSPARENT_BASE}/22.png`,
  clipboardPost: `${WANGJAI_TRANSPARENT_BASE}/34.png`,
  clipboardHover: `${WANGJAI_TRANSPARENT_BASE}/35.png`,
  linewalkClip: `${WANGJAI_TRANSPARENT_BASE}/36.png`,
  flashlight: `${WANGJAI_TRANSPARENT_BASE}/7.png`,
  announce: `${WANGJAI_TRANSPARENT_BASE}/5.png`,
  announce2: `${WANGJAI_TRANSPARENT_BASE}/24.png`,
  whistle: `${WANGJAI_TRANSPARENT_BASE}/10.png`,
  running: `${WANGJAI_TRANSPARENT_BASE}/32.png`,
  smile: `${WANGJAI_TRANSPARENT_BASE}/41.png`,
  happy: `${WANGJAI_TRANSPARENT_BASE}/38.png`,
  happyReward: `${WANGJAI_TRANSPARENT_BASE}/39.png`,
  happyClaim: `${WANGJAI_TRANSPARENT_BASE}/37.png`,
  gateHappy: `${WANGJAI_TRANSPARENT_BASE}/40.png`,
  assessHappy: `${WANGJAI_TRANSPARENT_BASE}/33.png`,
  idea: `${WANGJAI_TRANSPARENT_BASE}/17.png`,
  idea2: `${WANGJAI_TRANSPARENT_BASE}/6.png`,
  cheer: `${WANGJAI_TRANSPARENT_BASE}/1.png`,
  cheer2: `${WANGJAI_TRANSPARENT_BASE}/44.png`,
  welcome: `${WANGJAI_TRANSPARENT_BASE}/4.png`,
  firstaid: `${WANGJAI_TRANSPARENT_BASE}/11.png`,
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
  if (src.includes("line-walk")) return getMascot(theme, "clipboard");
  if (src.includes("five-s")) return getMascot(theme, "flashlight");
  if (src.includes("shield")) return getMascot(theme, "stop");
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
