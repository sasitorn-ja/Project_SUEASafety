import { NextResponse } from "next/server";
import { readDatabaseBackedSession } from "@/lib/server/sso-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await readDatabaseBackedSession();
  return NextResponse.json({
    authenticated: !!session?.user,
    user: session?.user || null,
  });
}
