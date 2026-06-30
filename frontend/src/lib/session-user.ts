"use client";

import { useEffect, useState } from "react";
import { hasAdminAccess } from "@/lib/access-control";
import { PROFILE_IMAGE_UPDATED_EVENT } from "@/lib/profile";

export const DEMO_LOGIN_SESSION_KEY = "cpac-safety-login-session";
export const DEMO_LOGIN_PERSISTED_KEY = "cpac-safety-login-persisted";

export type SessionUser = {
  id?: string;
  sub: string;
  name?: string;
  email?: string;
  username?: string;
  division?: string;
  firstNameEn?: string;
  firstNameTh?: string;
  lastNameEn?: string;
  lastNameTh?: string;
  lineProfileImageUrl?: string;
  profileImageUrl?: string;
  positionEn?: string;
  positionTh?: string;
  reportToEmail?: string;
  roles?: string[];
  permissions?: string[];
  isAdmin?: boolean;
};

export { hasAdminAccess };

export const DEMO_ADMIN_USER: SessionUser = {
  sub: "demo-admin",
  name: "Demo Admin",
  email: "demo.admin@localhost",
  roles: ["ADMIN"],
  permissions: ["*"],
  isAdmin: true,
};

export function isLocalDemoLoginHost(hostname?: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
}

export function isDemoLoginActive() {
  if (typeof window === "undefined" || process.env.NODE_ENV === "production") return false;
  try {
    return (
      isLocalDemoLoginHost(window.location.hostname) &&
      (window.sessionStorage.getItem(DEMO_LOGIN_SESSION_KEY) === "true" ||
        window.localStorage.getItem(DEMO_LOGIN_PERSISTED_KEY) === "true")
    );
  } catch {
    return false;
  }
}

export function getSessionDisplayName(user?: SessionUser | null) {
  if (!user) return "ผู้ใช้งาน";
  return (
    user.name ||
    [user.firstNameTh, user.lastNameTh].filter(Boolean).join(" ") ||
    [user.firstNameEn, user.lastNameEn].filter(Boolean).join(" ") ||
    user.username ||
    user.email ||
    "ผู้ใช้งาน"
  );
}

export function getSessionEnglishName(user?: SessionUser | null) {
  if (!user) return "";
  return [user.firstNameEn, user.lastNameEn].filter(Boolean).join(" ");
}

export function getSessionInitials(user?: SessionUser | null) {
  const displayName = getSessionDisplayName(user).trim();
  if (!displayName) return "U";
  const parts = displayName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  return displayName.slice(0, 2).toUpperCase();
}

export function getSessionProfileImage(user?: SessionUser | null) {
  return user?.profileImageUrl || user?.lineProfileImageUrl || "";
}

export function useSessionUser() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let demoLoginAllowed = false;

    try {
      demoLoginAllowed = isDemoLoginActive();
    } catch {
      demoLoginAllowed = false;
    }

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store",
        });
        const session = response.ok ? await response.json().catch(() => ({ user: null })) : { user: null };
        if (!cancelled) setUser(session.user || (demoLoginAllowed ? DEMO_ADMIN_USER : null));
      } catch {
        if (!cancelled) setUser(demoLoginAllowed ? DEMO_ADMIN_USER : null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadSession();
    window.addEventListener(PROFILE_IMAGE_UPDATED_EVENT, loadSession);

    return () => {
      cancelled = true;
      window.removeEventListener(PROFILE_IMAGE_UPDATED_EVENT, loadSession);
    };
  }, []);

  return { user, loading };
}
