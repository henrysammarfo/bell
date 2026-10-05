import { errResult, okResult, type AdapterResult } from "../adapters/types";
import { hmacSha256Base64Url, timingSafeEqualUtf8 } from "./node-hmac";

export type TenantMembership = {
  tenantId: string;
  userId: string;
  role: "owner" | "trader" | "viewer";
  walletAddress: string | null;
  slug: string | null;
  displayName: string | null;
};

export type BellSession = {
  sessionId: string;
  userId: string;
  walletAddress: string | null;
  tenants: TenantMembership[];
  activeTenantId: string | null;
  issuedAt: string;
  expiresAt: string;
};

export type MintSessionInput = {
  userId: string;
  walletAddress?: string | null;
  tenants?: TenantMembership[];
  activeTenantId?: string | null;
  ttlSec?: number;
};

export const BELL_SESSION_COOKIE = "bell_session";

export function resolveActiveTenantId(session: BellSession): string | null {
  const membershipIds = new Set(session.tenants.map((t) => t.tenantId));
  if (session.activeTenantId && membershipIds.has(session.activeTenantId)) {
    return session.activeTenantId;
  }
  return session.tenants[0]?.tenantId ?? null;
}

function sessionSecret(): string | null {
  const s = process.env["BELL_SESSION_SECRET"]?.trim();
  return s && s.length >= 16 ? s : null;
}

export function getSessionAuthStatus(): AdapterResult<{
  sessionSigningConfigured: boolean;
  persistence: "httpOnly-server" | "unavailable";
  note: string;
}> {
  const secret = sessionSecret();
  if (!secret) {
    return errResult(
      "bell.session",
      "session_secret_missing",
      "Set BELL_SESSION_SECRET (≥16 chars) for httpOnly sessions",
    );
  }
  return okResult("mainnet-read", "bell.session", {
    sessionSigningConfigured: true,
    persistence: "httpOnly-server",
    note: "httpOnly HMAC session cookie — no auth secrets in localStorage",
  });
}

export function mintBellSession(
  input: MintSessionInput,
): AdapterResult<{ session: BellSession; cookieValue: string }> {
  const secret = sessionSecret();
  if (!secret) {
    return errResult(
      "bell.session",
      "session_secret_missing",
      "Cannot mint session without BELL_SESSION_SECRET",
    );
  }
  const ttlSec = input.ttlSec ?? 60 * 60 * 24 * 7;
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + ttlSec * 1000);
  const tenants = input.tenants ?? [];
  const session: BellSession = {
    sessionId: crypto.randomUUID(),
    userId: input.userId,
    walletAddress: input.walletAddress ?? null,
    tenants,
    activeTenantId: resolveActiveTenantId({
      sessionId: "",
      userId: input.userId,
      walletAddress: null,
      tenants,
      activeTenantId: input.activeTenantId ?? null,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }),
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  const payloadB64 = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const sig = hmacSha256Base64Url(secret, payloadB64);
  return okResult("mainnet-read", "bell.session", {
    session,
    cookieValue: `${payloadB64}.${sig}`,
  });
}

export function parseBellSessionCookie(
  cookieHeader: string | null | undefined,
): AdapterResult<BellSession> {
  const secret = sessionSecret();
  if (!secret) {
    return errResult(
      "bell.session",
      "session_secret_missing",
      "Cannot verify session without BELL_SESSION_SECRET",
    );
  }
  if (!cookieHeader) {
    return errResult("bell.session", "cookie_missing", "No Cookie header");
  }
  const match = cookieHeader
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${BELL_SESSION_COOKIE}=`));
  if (!match) {
    return errResult("bell.session", "cookie_missing", `${BELL_SESSION_COOKIE} not found`);
  }
  const value = match.slice(BELL_SESSION_COOKIE.length + 1);
  const [payloadB64, sig] = value.split(".");
  if (!payloadB64 || !sig) {
    return errResult("bell.session", "cookie_malformed", "Expected payload.sig");
  }
  const expected = hmacSha256Base64Url(secret, payloadB64);
  if (!timingSafeEqualUtf8(sig, expected)) {
    return errResult("bell.session", "cookie_bad_signature", "HMAC mismatch");
  }
  try {
    const session = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as BellSession;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      return errResult("bell.session", "cookie_expired", session.expiresAt);
    }
    return okResult("mainnet-read", "bell.session", session);
  } catch (e) {
    return errResult(
      "bell.session",
      "cookie_parse_failed",
      e instanceof Error ? e.message : String(e),
    );
  }
}

export function bellSessionSetCookieHeader(cookieValue: string, maxAgeSec = 604800): string {
  return `${BELL_SESSION_COOKIE}=${cookieValue}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

export function bellSessionClearCookieHeader(): string {
  return `${BELL_SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
