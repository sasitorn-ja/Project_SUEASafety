import { NextRequest, NextResponse } from "next/server";
import {
  assertSsoConfigured,
  codeChallenge,
  createOAuthState,
  getDiscoveryDocument,
  getRequestOrigin,
  setOAuthCookie,
} from "@backend/components/auth/sso";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { config, missing } = await assertSsoConfigured(request);
  if (missing.length > 0) {
    const url = new URL("/login", await getRequestOrigin(request));
    url.searchParams.set("sso_error", `missing:${missing.join(",")}`);
    return NextResponse.redirect(url);
  }

  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/";
  const oauthState = createOAuthState(returnTo);
  const discovery = await getDiscoveryDocument(request);

  if (!discovery.authorization_endpoint) {
    const url = new URL("/login", await getRequestOrigin(request));
    url.searchParams.set("sso_error", "missing_authorize_endpoint");
    return NextResponse.redirect(url);
  }

  await setOAuthCookie(oauthState);

  const authorizeUrl = new URL(discovery.authorization_endpoint);
  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("redirect_uri", config.redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", config.scope);
  authorizeUrl.searchParams.set("state", oauthState.state);
  authorizeUrl.searchParams.set("nonce", oauthState.nonce);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge(oauthState.codeVerifier));
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  return NextResponse.redirect(authorizeUrl);
}
