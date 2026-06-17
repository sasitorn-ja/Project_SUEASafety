import { cookies, headers } from "next/headers";
import { NextRequest } from "next/server";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { dbUserToSessionUser, getSessionUserBySsoExternalId, getUserAccess, upsertSsoUser } from "@/lib/server/users";

export const SSO_SESSION_COOKIE = "cpac-safety-sso-session";
export const SSO_OAUTH_COOKIE = "cpac-safety-sso-oauth";

const DEFAULT_ISSUER = "https://rmc-sso.cipcloud.net";
const DEFAULT_PROVIDER_SLUG = "rmc-sso";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const OAUTH_MAX_AGE_SECONDS = 10 * 60;

type DiscoveryDocument = {
  authorization_endpoint?: string;
  token_endpoint?: string;
  userinfo_endpoint?: string;
  end_session_endpoint?: string;
  issuer?: string;
};

export type SsoUser = {
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

type OAuthState = {
  state: string;
  nonce: string;
  codeVerifier: string;
  returnTo: string;
};

function base64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function randomToken(bytes = 32) {
  return base64Url(randomBytes(bytes));
}

function envValue(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return "";
}

function getSessionSecret() {
  const secret =
    process.env.APP_SESSION_SECRET ||
    process.env.SSO_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SSO_CLIENT_SECRET ||
    process.env.RMC_SSO_CLIENT_SECRET ||
    "";

  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing APP_SESSION_SECRET or SSO_SESSION_SECRET");
  }
  return "development-only-sso-session-secret";
}

function sign(payload: string) {
  return base64Url(createHmac("sha256", getSessionSecret()).update(payload).digest());
}

function encodeSignedJson(value: unknown) {
  const payload = base64Url(JSON.stringify(value));
  return `${payload}.${sign(payload)}`;
}

function decodeSignedJson<T>(value?: string): T | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export async function getRequestOrigin(request?: NextRequest) {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  if (request) return request.nextUrl.origin;

  const headerStore = await headers();
  const proto = headerStore.get("x-forwarded-proto") || "https";
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export async function getSsoConfig(request?: NextRequest) {
  const origin = await getRequestOrigin(request);
  const issuer = (envValue("SSO_ISSUER", "RMC_SSO_ISSUER") || DEFAULT_ISSUER).replace(/\/$/, "");
  const providerSlug = process.env.RMC_SSO_PROVIDER_SLUG || DEFAULT_PROVIDER_SLUG;

  return {
    issuer,
    providerSlug,
    clientId: envValue("SSO_CLIENT_ID", "RMC_SSO_CLIENT_ID"),
    clientSecret: envValue("SSO_CLIENT_SECRET", "RMC_SSO_CLIENT_SECRET"),
    redirectUri:
      envValue("SSO_REDIRECT_URI", "RMC_SSO_REDIRECT_URI") ||
      `${origin}/api/auth/callback/${providerSlug}`,
    postLogoutRedirectUri:
      envValue("SSO_POST_LOGOUT_REDIRECT_URI", "RMC_SSO_POST_LOGOUT_REDIRECT_URI") ||
      `${origin}/login`,
    scope: envValue("SSO_SCOPE", "RMC_SSO_SCOPE") || "openid profile email offline_access",
    authorizationEndpoint: envValue("SSO_AUTHORIZE_URL", "RMC_SSO_AUTHORIZE_URL"),
    tokenEndpoint: envValue("SSO_TOKEN_URL", "RMC_SSO_TOKEN_URL"),
    userinfoEndpoint: envValue("SSO_USERINFO_URL", "RMC_SSO_USERINFO_URL"),
    endSessionEndpoint: envValue("SSO_END_SESSION_URL", "RMC_SSO_END_SESSION_URL"),
    tokenAuthMethod: envValue("SSO_TOKEN_AUTH_METHOD", "RMC_SSO_TOKEN_AUTH_METHOD") || "client_secret_post",
  };
}

export async function assertSsoConfigured(request?: NextRequest) {
  const config = await getSsoConfig(request);
  const missing = [
    ["SSO_CLIENT_ID", config.clientId],
    ["SSO_CLIENT_SECRET", config.clientSecret],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  return { config, missing };
}

export async function getDiscoveryDocument(request?: NextRequest): Promise<DiscoveryDocument> {
  const config = await getSsoConfig(request);
  const configuredDocument: DiscoveryDocument = {
    issuer: config.issuer,
    authorization_endpoint: config.authorizationEndpoint || undefined,
    token_endpoint: config.tokenEndpoint || undefined,
    userinfo_endpoint: config.userinfoEndpoint || undefined,
    end_session_endpoint: config.endSessionEndpoint || undefined,
  };

  try {
    const response = await fetch(`${config.issuer}/api/auth/.well-known/openid-configuration`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Unable to load SSO discovery document (${response.status})`);
    }

    return { ...configuredDocument, ...((await response.json()) as DiscoveryDocument) };
  } catch (caught) {
    if (configuredDocument.authorization_endpoint && configuredDocument.token_endpoint) {
      return configuredDocument;
    }
    throw caught;
  }
}

export function createOAuthState(returnTo = "/"): OAuthState {
  return {
    state: randomToken(),
    nonce: randomToken(),
    codeVerifier: randomToken(48),
    returnTo: returnTo.startsWith("/") ? returnTo : "/",
  };
}

export function codeChallenge(verifier: string) {
  return base64Url(createHash("sha256").update(verifier).digest());
}

export async function setOAuthCookie(value: OAuthState) {
  const cookieStore = await cookies();
  cookieStore.set(SSO_OAUTH_COOKIE, encodeSignedJson(value), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_MAX_AGE_SECONDS,
  });
}

export async function readOAuthCookie() {
  const cookieStore = await cookies();
  return decodeSignedJson<OAuthState>(cookieStore.get(SSO_OAUTH_COOKIE)?.value);
}

export async function clearOAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SSO_OAUTH_COOKIE);
}

function normalizeUser(raw: Record<string, unknown>): SsoUser {
  const sub = String(raw.sub || raw.USER || raw.user || raw.id || raw.user_id || raw.username || raw.email || "");
  const firstNameEn = stringClaim(raw.FIRSTNAME_EN);
  const lastNameEn = stringClaim(raw.LASTNAME_EN);
  const firstNameTh = stringClaim(raw.FIRSTNAME_TH);
  const lastNameTh = stringClaim(raw.LASTNAME_TH);
  const displayName =
    stringClaim(raw.name) ||
    [firstNameTh, lastNameTh].filter(Boolean).join(" ") ||
    [firstNameEn, lastNameEn].filter(Boolean).join(" ") ||
    undefined;

  return {
    sub,
    name: displayName,
    email: stringClaim(raw.EMAIL) || stringClaim(raw.email),
    username:
      stringClaim(raw.USER) ||
      stringClaim(raw.preferred_username) ||
      stringClaim(raw.username),
    division: stringClaim(raw.DIVISION),
    firstNameEn,
    firstNameTh,
    lastNameEn,
    lastNameTh,
    lineProfileImageUrl:
      stringClaim(raw.LINE_PROFILE_IMAGE_URL) ||
      stringClaim(raw.picture) ||
      stringClaim(raw.profile_image_url) ||
      stringClaim(raw.avatar_url),
    positionEn: stringClaim(raw.POSITION_EN),
    positionTh: stringClaim(raw.POSITION_TH),
    reportToEmail: stringClaim(raw.REPORTTO_EMAIL),
  };
}

function stringClaim(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function decodeJwtPart<T>(part?: string): T | null {
  if (!part) return null;
  try {
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function decodeJwtPayload(token?: string): Record<string, unknown> | null {
  if (!token) return null;
  const [, payload] = token.split(".");
  return decodeJwtPart<Record<string, unknown>>(payload);
}

function jwtAudienceMatches(aud: unknown, clientId: string) {
  if (typeof aud === "string") return aud === clientId;
  if (Array.isArray(aud)) return aud.includes(clientId);
  return false;
}

function normalizeIssuer(value?: string) {
  return value?.replace(/\/+$/, "");
}

function getAcceptedIssuers(config: Awaited<ReturnType<typeof getSsoConfig>>, discovery: DiscoveryDocument) {
  const configuredIssuer = normalizeIssuer(config.issuer);
  const discoveryIssuer = normalizeIssuer(discovery.issuer);
  const envIssuers = envValue("SSO_ALLOWED_ISSUERS", "RMC_SSO_ALLOWED_ISSUERS")
    .split(",")
    .map((issuer) => normalizeIssuer(issuer.trim()))
    .filter(Boolean) as string[];

  return Array.from(
    new Set(
      [
        configuredIssuer,
        discoveryIssuer,
        configuredIssuer ? `${configuredIssuer}/api/auth` : undefined,
        ...envIssuers,
      ].filter(Boolean) as string[]
    )
  );
}

function verifyHs256JwtSignature(token: string, secret: string) {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return false;

  const expected = base64Url(
    createHmac("sha256", secret).update(`${header}.${payload}`).digest()
  );
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function verifyIdToken(
  token: string | undefined,
  config: Awaited<ReturnType<typeof getSsoConfig>>,
  discovery: DiscoveryDocument,
  nonce: string
) {
  if (!token) throw new Error("SSO id_token is missing");

  const [encodedHeader] = token.split(".");
  const header = decodeJwtPart<{ alg?: string }>(encodedHeader);
  const payload = decodeJwtPayload(token);
  if (!header || !payload) throw new Error("Invalid SSO id_token");
  if (header.alg !== "HS256") {
    throw new Error(`Unsupported SSO id_token alg: ${header.alg || "unknown"}`);
  }
  if (!verifyHs256JwtSignature(token, config.clientSecret)) {
    throw new Error("Invalid SSO id_token signature");
  }

  if (!jwtAudienceMatches(payload.aud, config.clientId)) throw new Error("Invalid SSO audience");

  const issuer = normalizeIssuer(String(payload.iss || ""));
  if (issuer) {
    const acceptedIssuers = getAcceptedIssuers(config, discovery);
    if (!acceptedIssuers.includes(issuer)) {
      console.error("Invalid SSO issuer", {
        issuer,
        acceptedIssuers,
      });
      throw new Error("Invalid SSO issuer");
    }
  } else {
    console.warn("SSO id_token issuer is missing; accepted after signature, audience, expiry, and nonce checks.");
  }

  if (typeof payload.exp !== "number" || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error("SSO id_token has expired");
  }
  if (typeof payload.nbf === "number" && payload.nbf > Math.floor(Date.now() / 1000) + 60) {
    throw new Error("SSO id_token is not active yet");
  }
  if (payload.nonce && payload.nonce !== nonce) throw new Error("Invalid SSO nonce");

  return payload;
}

export async function exchangeCodeForSession(request: NextRequest, code: string) {
  const oauthState = await readOAuthCookie();
  const state = request.nextUrl.searchParams.get("state");
  if (!oauthState || !state || oauthState.state !== state) {
    throw new Error("Invalid SSO state");
  }

  const config = await getSsoConfig(request);
  const discovery = await getDiscoveryDocument(request);
  if (!discovery.token_endpoint) throw new Error("SSO token endpoint is missing");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    code_verifier: oauthState.codeVerifier,
  });

  const headers: Record<string, string> = {
    "content-type": "application/x-www-form-urlencoded",
  };

  if (config.tokenAuthMethod === "client_secret_basic") {
    headers.authorization = `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`;
  } else if (config.tokenAuthMethod !== "none") {
    body.set("client_secret", config.clientSecret);
  }

  const tokenResponse = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    throw new Error(`SSO token exchange failed (${tokenResponse.status})`);
  }

  const tokenSet = (await tokenResponse.json()) as {
    access_token?: string;
    id_token?: string;
    token_type?: string;
  };

  const idTokenPayload = verifyIdToken(tokenSet.id_token, config, discovery, oauthState.nonce);
  let rawUser: Record<string, unknown> | null = null;
  if (tokenSet.access_token && discovery.userinfo_endpoint) {
    const userResponse = await fetch(discovery.userinfo_endpoint, {
      headers: { authorization: `Bearer ${tokenSet.access_token}` },
      cache: "no-store",
    });
    if (userResponse.ok) rawUser = (await userResponse.json()) as Record<string, unknown>;
  }

  rawUser = rawUser ? { ...idTokenPayload, ...rawUser } : idTokenPayload;
  if (!rawUser) throw new Error("Unable to resolve SSO user profile");

  const user = normalizeUser(rawUser);
  if (!user.sub) throw new Error("SSO user profile is missing subject");

  const dbUser = await upsertSsoUser(user, rawUser, config.providerSlug);
  await setSessionCookie(dbUserToSessionUser(dbUser, await getUserAccess(dbUser.id)));
  await clearOAuthCookie();
  return { user, returnTo: oauthState.returnTo };
}

export async function setSessionCookie(user: SsoUser) {
  const cookieStore = await cookies();
  cookieStore.set(
    SSO_SESSION_COOKIE,
    encodeSignedJson({
      user,
      iat: Math.floor(Date.now() / 1000),
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    }
  );
}

export async function readSessionCookie() {
  const cookieStore = await cookies();
  return decodeSignedJson<{ user: SsoUser; iat: number }>(
    cookieStore.get(SSO_SESSION_COOKIE)?.value
  );
}

export async function readDatabaseBackedSession() {
  const session = await readSessionCookie();
  if (!session?.user?.sub) return null;

  try {
    const dbUser = await getSessionUserBySsoExternalId(session.user.sub);
    if (!dbUser) return session;
    return {
      ...session,
      user: dbUser,
    };
  } catch {
    return session;
  }
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SSO_SESSION_COOKIE);
}
