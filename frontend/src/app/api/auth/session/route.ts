import { NextResponse } from "next/server";
import { readSessionCookie } from "@backend/components/auth/sso";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await readSessionCookie();
  return NextResponse.json({
    authenticated: !!session?.user,
    user: session?.user || null,
  });
}
