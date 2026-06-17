import "server-only";

import { NextResponse } from "next/server";

import { hasAdminAccess } from "@/lib/access-control";
import { readDatabaseBackedSession } from "@backend/components/auth/sso";

export async function requireApiSession() {
  const session = await readDatabaseBackedSession();
  if (!session?.user) {
    return {
      session: null,
      response: NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }),
    };
  }

  return { session, response: null };
}

export async function requireAdminApiSession() {
  const result = await requireApiSession();
  if (result.response) return result;

  if (!hasAdminAccess(result.session?.user)) {
    return {
      session: result.session,
      response: NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }),
    };
  }

  return result;
}

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function apiError(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "internal_error";
  return NextResponse.json({ ok: false, error: message }, { status });
}
