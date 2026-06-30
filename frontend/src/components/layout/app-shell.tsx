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
import { DEMO_ADMIN_USER, hasAdminAccess, isLocalDemoLoginHost, type SessionUser } from "@/lib/session-user";

const LOGIN_SESSION_KEY = "cpac-safety-login-session";
const LOGIN_PERSISTED_KEY = "cpac-safety-login-persisted";

function getSafeReturnTo(pathname: string) {
  if (typeof window === "undefined" || pathname === "/login") return "/";

  const currentPath = `${pathname}${window.location.search || ""}${window.location.hash || ""}`;
  return currentPath.startsWith("/") && !currentPath.startsWith("//") ? currentPath : "/";
}

export function AppShell({ children }: { children: ReactNode }) {
  const { notification } = useAppState();
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
        window.sessionStorage.getItem(LOGIN_SESSION_KEY) === "true" ||
        window.localStorage.getItem(LOGIN_PERSISTED_KEY) === "true";
    } catch {
      loggedIn = false;
    }

    const demoLoginAllowed =
      process.env.NODE_ENV !== "production" && loggedIn && isLocalDemoLoginHost(window.location.hostname);

    setLoginChecked(loggedIn);
    setSessionChecked(loggedIn);
    setSessionCheckPending(true);
    fetch("/api/auth/session", {
      credentials: "include",
      cache: "no-store",
    })
      .then((response) => (response.ok ? response.json() : { authenticated: false }))
      .then((session) => {
        if (cancelled) return;
        if (session.authenticated) {
          setSessionUser(session.user || null);
          try {
            window.sessionStorage.setItem(LOGIN_SESSION_KEY, "true");
            window.localStorage.setItem(LOGIN_PERSISTED_KEY, "true");
          } catch {
            // The cookie-backed session remains authoritative.
          }
          setLoginChecked(true);
          setSessionChecked(true);
          setSessionCheckPending(false);
          return;
        }
        setSessionUser(null);
        try {
          window.sessionStorage.removeItem(LOGIN_SESSION_KEY);
          window.localStorage.removeItem(LOGIN_PERSISTED_KEY);
        } catch {
          // Storage is only an optimistic hint; the server session remains authoritative.
        }
        setSessionChecked(true);
        setSessionCheckPending(false);
        if (demoLoginAllowed) {
          setSessionUser(DEMO_ADMIN_USER);
          return;
        }
        router.replace(`/login?returnTo=${encodeURIComponent(getSafeReturnTo(window.location.pathname || "/"))}`);
      })
      .catch(() => {
        if (!cancelled) {
          setSessionChecked(true);
          setSessionCheckPending(false);
          if (demoLoginAllowed) {
            setSessionUser(DEMO_ADMIN_USER);
            return;
          }
          router.replace(`/login?returnTo=${encodeURIComponent(getSafeReturnTo(window.location.pathname || "/"))}`);
        }
      });

    return () => {
      cancelled = true;
    };
  // Intentionally run only once on app bootstrap. Re-checking auth on every pathname
  // change causes the whole shell to fall back to its loading state and feels like a full reload.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

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

  return (
    <div className="app-shell-root">
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
