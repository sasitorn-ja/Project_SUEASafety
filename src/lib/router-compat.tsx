"use client";

import {
  Children,
  createContext,
  type ReactElement,
  type ReactNode,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

type LegacyLocation = {
  pathname: string;
  state: unknown;
};

type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

type NavigateTarget = string | number;
type NavigateFn = (to: NavigateTarget, options?: NavigateOptions) => void;

type RouterContextValue = {
  location: LegacyLocation;
  navigate: NavigateFn;
};

type BrowserRouterProps = {
  children: ReactNode;
};

type NavigateProps = {
  to: string;
  replace?: boolean;
};

type RouteProps = {
  index?: boolean;
  path?: string;
  element?: ReactNode;
};

type RoutesProps = {
  children: ReactNode;
};

const RouterContext = createContext<RouterContextValue | null>(null);
const PENDING_NAVIGATION_KEY = "suea-safety-pending-navigation";

function readPendingNavigation(): LegacyLocation | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(PENDING_NAVIGATION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LegacyLocation;
  } catch {
    return null;
  }
}

function storePendingNavigation(location: LegacyLocation | null) {
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

function readLocation(): LegacyLocation {
  if (typeof window === "undefined") {
    return { pathname: "/", state: null };
  }

  const pathname = window.location.pathname || "/";
  const pending = readPendingNavigation();

  return {
    pathname,
    state: window.history.state?.__legacyState
      ?? (pending?.pathname === pathname ? pending.state : null),
  };
}

function normalizePath(path?: string) {
  if (!path || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function BrowserRouter({ children }: BrowserRouterProps) {
  const router = useRouter();
  const nextPathname = usePathname();
  const [location, setLocation] = useState<LegacyLocation>(readLocation);
  const pendingNavigation = useRef<LegacyLocation | null>(null);

  useEffect(() => {
    const syncLocation = () => setLocation(readLocation());
    window.addEventListener("popstate", syncLocation);
    window.addEventListener("legacy-router:navigate", syncLocation);

    return () => {
      window.removeEventListener("popstate", syncLocation);
      window.removeEventListener("legacy-router:navigate", syncLocation);
    };
  }, []);

  useEffect(() => {
    setLocation((current) => {
      const pathname = nextPathname || window.location.pathname || "/";
      const pending = pendingNavigation.current ?? readPendingNavigation();

      if (pending?.pathname === pathname) {
        pendingNavigation.current = null;
        storePendingNavigation(null);
        window.history.replaceState(
          { ...(window.history.state ?? {}), __legacyState: pending.state },
          "",
          window.location.href
        );
        return pending;
      }

      return {
        pathname,
        state: current.pathname === pathname
          ? current.state
          : window.history.state?.__legacyState ?? null,
      };
    });
  }, [nextPathname]);

  const navigate = useMemo<NavigateFn>(
    () => (to, options = {}) => {
      if (typeof window === "undefined") return;

      if (typeof to === "number") {
        if (to < 0) {
          router.back();
        }
        return;
      }

      const nextPath = normalizePath(to);
      const nextState = options.state ?? null;
      const nextLocation = { pathname: nextPath, state: nextState };

      if (nextPath === location.pathname) {
        const method = options.replace ? "replaceState" : "pushState";
        window.history[method](
          { ...(window.history.state ?? {}), __legacyState: nextState },
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

  const value = useMemo(
    () => ({
      location,
      navigate,
    }),
    [location, navigate]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useNavigate() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useNavigate must be used within BrowserRouter");
  return ctx.navigate;
}

export function useLocation() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useLocation must be used within BrowserRouter");
  return ctx.location;
}

export function Navigate({ to, replace = false }: NavigateProps) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, replace, to]);

  return null;
}

export function Route(_props: RouteProps) {
  return null;
}

export function Routes({ children }: RoutesProps) {
  const { pathname } = useLocation();
  const currentPath = normalizePath(pathname);
  const routeChildren = Children.toArray(children).filter(isValidElement) as ReactElement<RouteProps>[];

  for (const child of routeChildren) {
    if (child.props.index && currentPath === "/") {
      return child.props.element ?? null;
    }

    if (!child.props.path) continue;

    if (normalizePath(child.props.path) === currentPath) {
      return child.props.element ?? null;
    }
  }

  return null;
}
