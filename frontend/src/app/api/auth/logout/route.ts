import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  clearOAuthCookie,
  clearSessionCookie,
  getDiscoveryDocument,
  getSsoConfig,
} from "@backend/components/auth/sso";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const config = await getSsoConfig(request);
  let redirectUrl = new URL(config.postLogoutRedirectUri);

  try {
    const discovery = await getDiscoveryDocument(request);
    if (discovery.end_session_endpoint) {
      redirectUrl = new URL(discovery.end_session_endpoint);
      redirectUrl.searchParams.set("client_id", config.clientId);
      redirectUrl.searchParams.set("post_logout_redirect_uri", config.postLogoutRedirectUri);
      redirectUrl.searchParams.set("state", randomUUID());
    }
  } catch {
    // Local logout should still work when provider logout metadata is unavailable.
  }

  await clearSessionCookie();
  await clearOAuthCookie();
  return NextResponse.redirect(redirectUrl);
}
