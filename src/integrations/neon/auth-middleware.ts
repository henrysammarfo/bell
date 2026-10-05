import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { getNeonSql } from "./db";

function neonAuthBaseUrl(): string | null {
  const u =
    process.env["NEON_AUTH_BASE_URL"]?.trim() ||
    process.env["VITE_NEON_AUTH_URL"]?.trim() ||
    null;
  if (!u || u === "provisioning") return null;
  return u.replace(/\/$/, "");
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(base: string) {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${base}/.well-known/jwks.json`));
  }
  return jwks;
}

async function resolveUserIdFromBearer(token: string, base: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getJwks(base), {
      // Neon Managed Auth issues EdDSA JWTs; audience/issuer vary by branch.
      clockTolerance: 30,
    });
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    return sub;
  } catch {
    // Fallback: ask Managed Auth get-session with Bearer (some tokens are opaque).
    try {
      const res = await fetch(`${base}/get-session`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) return null;
      const json = (await res.json()) as {
        user?: { id?: string };
        session?: { userId?: string };
      } | null;
      return json?.user?.id ?? json?.session?.userId ?? null;
    } catch {
      return null;
    }
  }
}

async function resolveUserIdFromCookie(cookie: string, base: string): Promise<string | null> {
  try {
    const res = await fetch(`${base}/get-session`, {
      headers: {
        Cookie: cookie,
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      user?: { id?: string };
      session?: { userId?: string };
    } | null;
    return json?.user?.id ?? json?.session?.userId ?? null;
  } catch {
    return null;
  }
}

/**
 * Fail-closed Neon Auth gate for server functions.
 * Prefer Bearer JWT (JWKS); else session cookie against Managed Auth.
 */
export const requireNeonAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const base = neonAuthBaseUrl();
    if (!base) {
      throw new Error(
        "NEON_AUTH_BASE_URL missing or still provisioning — connect Neon Auth on Bell Vercel project",
      );
    }

    const request = getRequest();
    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers available");
    }

    const authHeader = request.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice("Bearer ".length).trim();
      if (!token) throw new Error("Unauthorized: Empty bearer token");
      userId = await resolveUserIdFromBearer(token, base);
    } else {
      const cookie = request.headers.get("cookie") ?? "";
      if (cookie) userId = await resolveUserIdFromCookie(cookie, base);
    }

    if (!userId) {
      throw new Error("Unauthorized: Invalid or missing Neon Auth session");
    }

    const sql = getNeonSql();
    return next({
      context: {
        sql,
        userId,
        authProvider: "neon" as const,
      },
    });
  },
);
