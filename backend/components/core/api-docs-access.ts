import "server-only";

import type { RowDataPacket } from "mysql2/promise";
import { notFound } from "next/navigation";
import { readDatabaseBackedSession, type SsoUser } from "@backend/components/auth/sso";
import { queryRows } from "@backend/components/core/db";
import { hasAdminAccess } from "@/lib/access-control";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function getAllowedIdentifiersFromEnv() {
  const raw = process.env.API_DOCS_ALLOWED_USERS || "";
  return new Set(
    raw
      .split(/[,\n]/)
      .map(normalize)
      .filter(Boolean)
  );
}

function getUserIdentifiers(user?: SsoUser | null) {
  if (!user) return [];

  return [user.id, user.sub, user.email, user.username]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map(normalize);
}

async function hasApiDocsAllowlistAccess(user?: SsoUser | null) {
  const userId = user?.id?.trim();
  if (userId) {
    const rows = await queryRows<RowDataPacket & { user_id: string }>(
      `
        SELECT user_id
        FROM api_docs_access_users
        WHERE user_id = :userId
          AND status = 'ACTIVE'
        LIMIT 1
      `,
      { userId },
    );
    if (rows.length > 0) return true;
  }

  const envAllowlist = getAllowedIdentifiersFromEnv();
  if (envAllowlist.size === 0) return false;
  return getUserIdentifiers(user).some((identifier) => envAllowlist.has(identifier));
}

export async function canAccessApiDocs() {
  const session = await readDatabaseBackedSession();
  const user = session?.user;
  if (!user || !hasAdminAccess(user)) return false;
  return hasApiDocsAllowlistAccess(user);
}

export async function requireApiDocsAccess() {
  if (!(await canAccessApiDocs())) {
    notFound();
  }
}
