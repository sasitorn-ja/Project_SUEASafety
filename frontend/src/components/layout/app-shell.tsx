"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MobileTopbar } from "./mobile-topbar";
import { DesktopTopbar } from "./desktop-topbar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { useAppState, useAppActions } from "@/providers/app-providers";
import { isAdminRoute, SAFETY_EFFORT_ROUTES } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { SafetyAwarenessGate } from "@/components/safety-awareness/safety-awareness-gate";
import { FloatingSafetyAssistant } from "./floating-safety-assistant";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DEMO_ADMIN_USER,
  DEMO_LOGIN_PERSISTED_KEY,
  DEMO_LOGIN_SESSION_KEY,
  getSessionSnapshot,
  hasAdminAccess,
  isDemoLoginActive,
  type SessionUser,
} from "@/lib/session-user";

function getSafeReturnTo(pathname: string) {
  if (typeof window === "undefined" || pathname === "/login") return "/";

  const currentPath = `${pathname}${window.location.search || ""}${window.location.hash || ""}`;
  return currentPath.startsWith("/") && !currentPath.startsWith("//") ? currentPath : "/";
}

export function AppShell({ children }: { children: ReactNode }) {
  const { notification, isAppBootstrapping } = useAppState();
  const { dismissNotification } = useAppActions();
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const isSafetyEffort = SAFETY_EFFORT_ROUTES.has(pathname) || pathname.startsWith("/safety-admin");
  const usesStandardPageUi = pathname !== "/" && pathname !== "/dashboard" && pathname !== "/login";
  const [loginChecked, setLoginChecked] = useState(false);
  const isSafetyCulturePost = pathname === "/safety-culture/post";
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionCheckPending, setSessionCheckPending] = useState(false);

  const [topHidden, setTopHidden] = useState(false);
  const [btmHidden, setBtmHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (pathname === "/login") {
      setLoginChecked(true);
      setSessionChecked(true);
      setSessionCheckPending(false);
      return;
    }

    let cancelled = false;
    let loggedIn = false;
    try {
      loggedIn =
        window.sessionStorage.getItem(DEMO_LOGIN_SESSION_KEY) === "true" ||
        window.localStorage.getItem(DEMO_LOGIN_PERSISTED_KEY) === "true";
    } catch {
      loggedIn = false;
    }

    const demoLoginAllowed = isDemoLoginActive();

    if (loggedIn || demoLoginAllowed) {
      setLoginChecked(true);
      setSessionChecked(true);
    } else {
      setLoginChecked(false);
      setSessionChecked(false);
    }
    setSessionCheckPending(true);
    getSessionSnapshot()
      .then((session) => {
        if (cancelled) return;
        if (session.authenticated) {
          setSessionUser(session.user || null);
          try {
            window.sessionStorage.setItem(DEMO_LOGIN_SESSION_KEY, "true");
            window.localStorage.setItem(DEMO_LOGIN_PERSISTED_KEY, "true");
          } catch {
            // The cookie-backed session remains authoritative.
          }
          setLoginChecked(true);
          setSessionChecked(true);
          setSessionCheckPending(false);
          return;
        }
        setSessionUser(null);
        setSessionChecked(true);
        setSessionCheckPending(false);
        if (demoLoginAllowed) {
          setSessionUser(DEMO_ADMIN_USER);
          setLoginChecked(true);
          return;
        }
        try {
          window.sessionStorage.removeItem(DEMO_LOGIN_SESSION_KEY);
          window.localStorage.removeItem(DEMO_LOGIN_PERSISTED_KEY);
        } catch {
          // Storage is only an optimistic hint; the server session remains authoritative.
        }
        router.replace(`/login?returnTo=${encodeURIComponent(getSafeReturnTo(window.location.pathname || "/"))}`);
      })
      .catch(() => {
        if (!cancelled) {
          setSessionChecked(true);
          setSessionCheckPending(false);
          if (demoLoginAllowed) {
            setSessionUser(DEMO_ADMIN_USER);
            setLoginChecked(true);
            return;
          }
          router.replace(`/login?returnTo=${encodeURIComponent(getSafeReturnTo(window.location.pathname || "/"))}`);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  useEffect(() => {
    if (!loginChecked || !sessionChecked || sessionCheckPending || pathname === "/login") return;
    if (isAdminRoute(pathname) && !hasAdminAccess(sessionUser)) {
      router.replace("/");
    }
  }, [loginChecked, pathname, router, sessionChecked, sessionCheckPending, sessionUser]);

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
    lastScrollY.current = 0;
    setTopHidden(false);
    setBtmHidden(false);

    const animId = requestAnimationFrame(resetScroll);
    const timeoutId = setTimeout(resetScroll, 50);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  if (pathname === "/login") {
    return <main className="app-login-main">{children}</main>;
  }

  if (!loginChecked || !sessionChecked) {
    return (
      <div className="app-shell-loading flex items-center justify-center px-6">
        <div className="rounded-[24px] border border-[var(--border)] bg-white/90 px-6 py-5 text-center shadow-[0_18px_44px_rgba(11,130,240,0.12)] backdrop-blur">
          <div className="text-[16px] font-black text-[var(--brand-text)]">กำลังโหลด...</div>
          <div className="mt-1 text-[12px] font-bold text-[var(--muted-foreground)]">กรุณารอสักครู่ ระบบกำลังเตรียมหน้าจอให้พร้อม</div>
        </div>
      </div>
    );
  }

  if (isAppBootstrapping) {
    return (
      <div className="app-shell-loading flex items-center justify-center px-6">
        <div className="rounded-[24px] border border-[var(--border)] bg-white/90 px-6 py-5 text-center shadow-[0_18px_44px_rgba(11,130,240,0.12)] backdrop-blur">
          <div className="text-[16px] font-black text-[var(--brand-text)]">กำลังโหลดข้อมูลล่าสุด...</div>
          <div className="mt-1 text-[12px] font-bold text-[var(--muted-foreground)]">กรุณารอสักครู่ ระบบกำลังเตรียมข้อมูลของหน้านี้</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell-root">
      {notification && (
        <Dialog open onOpenChange={(open) => { if (!open) dismissNotification(); }}>
          <DialogContent
            className="w-[calc(100vw-24px)] max-w-[560px] gap-0 overflow-hidden rounded-[28px] border-[3px] border-[#D9383A] bg-[rgba(250,248,242,0.98)] p-0 shadow-[0_24px_64px_rgba(217,56,58,0.20),0_10px_24px_rgba(0,0,0,0.10)]"
            showCloseButton={false}
          >
            <div className="flex items-start gap-3 px-5 py-5 sm:px-6">
              <div
                className="flex h-13 w-13 flex-shrink-0 items-center justify-center rounded-[18px] bg-[#FFF1F1] text-[30px] leading-none"
                style={{ animation: "pulsePulse 1.5s infinite" }}
              >
                🚨
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-[18px] font-black leading-tight text-[#D9383A] sm:text-[20px]">
                  แจ้งเตือนจากระบบ (SOS SIGNAL)
                </DialogTitle>
                <DialogDescription className="mt-2 text-[16px] font-black leading-relaxed text-[#1A1A1A]">
                  {notification.message}
                </DialogDescription>
              </div>
              <button
                onClick={dismissNotification}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center bg-transparent text-[28px] leading-none text-[#8E8A81] transition-colors hover:text-foreground"
                aria-label="ปิด"
              >
                ×
              </button>
            </div>
            <div className="flex justify-end border-t border-[#F1D3D4] bg-[#FFF8F8] px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={dismissNotification}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#D9383A] px-5 text-[14px] font-black text-white shadow-[0_10px_24px_rgba(217,56,58,0.22)] transition-colors hover:bg-[#c92c2e]"
              >
                รับทราบ
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <MobileTopbar hidden={topHidden} />
      <DesktopTopbar />

      <main className={cn(
        "page-content",
        usesStandardPageUi && "app-standard-page"
      )}>{children}</main>

      {!isSafetyCulturePost && <MobileBottomNav hidden={btmHidden} />}

      {!isSafetyEffort && <FloatingSafetyAssistant />}

      <SafetyAwarenessGate />
    </div>
  );
}
