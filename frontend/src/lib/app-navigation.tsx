"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Lightweight client navigation context for the Safety Effort flow.
 *
 * App Router has no built-in way to pass transient object state between routes
 * (the old React-Router `location.state`). This provider bridges Next's router
 * and persists per-navigation state via `history.state` + sessionStorage, so a
 * screen can do `navigate("/checkin", { state })` and the next screen reads it
 * back through `useLocation().state` — without bringing back a second router.
 */

type AppLocation = {
  pathname: string;
  state: unknown;
};

type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

type NavigateTarget = string | number;
type NavigateFn = (to: NavigateTarget, options?: NavigateOptions) => void;

type NavigationContextValue = {
  location: AppLocation;
  navigate: NavigateFn;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);
const PENDING_NAVIGATION_KEY = "suea-safety-pending-navigation";

function readPendingNavigation(): AppLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_NAVIGATION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppLocation;
  } catch {
    return null;
  }
}

function storePendingNavigation(location: AppLocation | null) {
  if (typeof window === "undefined") return;
  try {
    if (location) {
      window.sessionStorage.setItem(PENDING_NAVIGATION_KEY, JSON.stringify(location));
    } else {
      window.sessionStorage.removeItem(PENDING_NAVIGATION_KEY);
    }
  } catch {
    // Navigation still works without session storage; only transient state may be unavailable.
  }
}

function readLocation(): AppLocation {
  if (typeof window === "undefined") {
    return { pathname: "/", state: null };
  }

  const pathname = window.location.pathname || "/";
  const pending = readPendingNavigation();

  return {
    pathname,
    state: window.history.state?.__appState
      ?? (pending?.pathname === pathname ? pending.state : null),
  };
}

function normalizePath(path?: string) {
  if (!path || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const nextPathname = usePathname();
  const [location, setLocation] = useState<AppLocation>(readLocation);
  const pendingNavigation = useRef<AppLocation | null>(null);

  useEffect(() => {
    const syncLocation = () => setLocation(readLocation());
    window.addEventListener("popstate", syncLocation);
    return () => window.removeEventListener("popstate", syncLocation);
  }, []);

  useEffect(() => {
    setLocation((current) => {
      const pathname = nextPathname || window.location.pathname || "/";
      const pending = pendingNavigation.current ?? readPendingNavigation();

      if (pending?.pathname === pathname) {
        pendingNavigation.current = null;
        storePendingNavigation(null);
        window.history.replaceState(
          { ...(window.history.state ?? {}), __appState: pending.state },
          "",
          window.location.href
        );
        return pending;
      }

      return {
        pathname,
        state: current.pathname === pathname
          ? current.state
          : window.history.state?.__appState ?? null,
      };
    });
  }, [nextPathname]);

  const navigate = useMemo<NavigateFn>(
    () => (to, options = {}) => {
      if (typeof window === "undefined") return;

      if (typeof to === "number") {
        if (to < 0) router.back();
        return;
      }

      const nextPath = normalizePath(to);
      const nextState = options.state ?? null;
      const nextLocation = { pathname: nextPath, state: nextState };

      if (nextPath === location.pathname) {
        const method = options.replace ? "replaceState" : "pushState";
        window.history[method](
          { ...(window.history.state ?? {}), __appState: nextState },
          "",
          nextPath
        );
        setLocation(nextLocation);
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        return;
      }

      pendingNavigation.current = nextLocation;
      storePendingNavigation(nextLocation);

      if (options.replace) {
        router.replace(nextPath, { scroll: false });
      } else {
        router.push(nextPath, { scroll: false });
      }
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    },
    [location.pathname, router]
  );

  const value = useMemo(() => ({ location, navigate }), [location, navigate]);

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigate() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigate must be used within NavigationProvider");
  return ctx.navigate;
}

export function useLocation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useLocation must be used within NavigationProvider");
  return ctx.location;
}
