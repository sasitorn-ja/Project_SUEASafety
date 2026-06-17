import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForSession, getRequestOrigin } from "@/lib/server/sso-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");
  if (error) {
    const url = new URL("/login", await getRequestOrigin(request));
    url.searchParams.set("sso_error", error);
    return NextResponse.redirect(url);
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    const url = new URL("/login", await getRequestOrigin(request));
    url.searchParams.set("sso_error", "missing_code");
    return NextResponse.redirect(url);
  }

  try {
    const { returnTo } = await exchangeCodeForSession(request, code);
    return NextResponse.redirect(new URL(returnTo, await getRequestOrigin(request)));
  } catch (caught) {
    const url = new URL("/login", await getRequestOrigin(request));
    url.searchParams.set(
      "sso_error",
      caught instanceof Error ? caught.message : "callback_failed"
    );
    return NextResponse.redirect(url);
  }
}
