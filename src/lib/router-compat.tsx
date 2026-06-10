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
  useState,
} from "react";
import { usePathname } from "next/navigation";

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

function readLocation(): LegacyLocation {
  if (typeof window === "undefined") {
    return { pathname: "/", state: null };
  }

  return {
    pathname: window.location.pathname || "/",
    state: window.history.state?.__legacyState ?? null,
  };
}

function normalizePath(path?: string) {
  if (!path || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function BrowserRouter({ children }: BrowserRouterProps) {
  const nextPathname = usePathname();
  const [location, setLocation] = useState(readLocation);

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
    setLocation(readLocation());
  }, [nextPathname]);

  const navigate = useMemo<NavigateFn>(
    () => (to, options = {}) => {
      if (typeof window === "undefined") return;

      if (typeof to === "number") {
        if (to < 0) {
          window.history.go(to);
        }
        return;
      }

      const nextPath = normalizePath(to);
      const nextState = options.state ?? null;
      const method = options.replace ? "replaceState" : "pushState";
      const currentState = window.history.state ?? {};

      window.history[method](
        { ...currentState, __legacyState: nextState },
        "",
        nextPath
      );

      window.dispatchEvent(new Event("legacy-router:navigate"));
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    },
    []
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
