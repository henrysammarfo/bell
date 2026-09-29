import { createMiddleware } from "@tanstack/react-start";
import { authClient, neonAuthConfigured } from "./auth-client";

/**
 * Attach Neon Auth JWT (or session cookie hint) to every serverFn RPC.
 * Must stay registered in `src/start.ts` functionMiddleware.
 */
export const attachNeonAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    if (!neonAuthConfigured() || !authClient) {
      return next({ headers: {} });
    }
    try {
      const tokenRes = await authClient.token();
      const token =
        tokenRes && typeof tokenRes === "object" && "data" in tokenRes
          ? (tokenRes as { data?: { token?: string } }).data?.token
          : undefined;
      if (token) {
        return next({ headers: { Authorization: `Bearer ${token}` } });
      }
      // Fall back: session cookie still sent same-origin; Bearer absent is ok if server reads cookies.
      return next({ headers: {} });
    } catch {
      return next({ headers: {} });
    }
  },
);
