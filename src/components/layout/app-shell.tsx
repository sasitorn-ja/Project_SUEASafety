"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MobileTopbar } from "./mobile-topbar";
import { DesktopTopbar } from "./desktop-topbar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { useAppState, useAppActions } from "@/providers/app-providers";
import { SAFETY_EFFORT_ROUTES } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { SafetyAwarenessGate } from "@/components/safety-awareness/safety-awareness-gate";
import { FloatingSafetyAssistant } from "./floating-safety-assistant";

export function AppShell({ children }: { children: ReactNode }) {
  const { notification } = useAppState();
  const { dismissNotification } = useAppActions();
  const pathname = usePathname() ?? "";
  const isSafetyEffort = SAFETY_EFFORT_ROUTES.has(pathname) || pathname === "/safety-admin";

  const [topHidden, setTopHidden] = useState(false);
  const [btmHidden, setBtmHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const THRESHOLD = 10;
    let ticking = false;
    let frameId: number | null = null;

    const onScroll = () => {
      if (!ticking) {
        frameId = window.requestAnimationFrame(() => {
          const current = window.scrollY;
          const diff = current - lastScrollY.current;

          if (diff > THRESHOLD) {
            setTopHidden(true);
            setBtmHidden(true);
          } else if (diff < -THRESHOLD) {
            setTopHidden(false);
            setBtmHidden(false);
          }

          lastScrollY.current = current;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();

    const animId = requestAnimationFrame(resetScroll);
    const timeoutId = setTimeout(resetScroll, 50);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  if (pathname === "/login") {
    return <main className="min-h-screen w-full bg-background">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-background">
      {notification && (
        <div
          className="fixed top-5 left-1/2 z-[99999] flex w-[calc(100%-40px)] max-w-[480px] items-start gap-3"
          style={{
            transform: "translateX(-50%)",
            background: "rgba(250, 248, 242, 0.95)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "2.5px solid #D9383A",
            borderRadius: "22px",
            padding: "16px 20px",
            boxShadow: "0 12px 32px rgba(217, 56, 58, 0.18), 0 4px 12px rgba(0,0,0,0.05)",
            fontFamily: "var(--font-sans)",
            animation: "slideDownToast 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          <div className="text-2xl leading-none" style={{ animation: "pulsePulse 1.5s infinite" }}>
            🚨
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-[3px] text-sm font-extrabold" style={{ color: "#D9383A" }}>
              แจ้งเตือนจากระบบ (SOS SIGNAL)
            </div>
            <p className="text-xs font-bold leading-relaxed" style={{ color: "#1A1A1A" }}>
              {notification.message}
            </p>
          </div>
          <button
            onClick={dismissNotification}
            className="text-xl font-bold leading-none text-[#8E8A81] hover:text-foreground"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "0 2px",
            }}
            aria-label="ปิด"
          >
            ×
          </button>
        </div>
      )}

      <MobileTopbar hidden={topHidden} />
      <DesktopTopbar />

      <main className={cn(isSafetyEffort ? "legacy-page-content" : "page-content")}>{children}</main>

      <MobileBottomNav hidden={btmHidden} />

      {!isSafetyEffort && <FloatingSafetyAssistant />}

      <SafetyAwarenessGate />
    </div>
  );
}
