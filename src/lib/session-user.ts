"use client";

import { useEffect, useState } from "react";
import { hasAdminAccess } from "@/lib/access-control";

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

    fetch("/api/auth/session", {
      credentials: "include",
      cache: "no-store",
    })
      .then((response) => (response.ok ? response.json() : { user: null }))
      .then((session) => {
        if (!cancelled) setUser(session.user || null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading };
}
