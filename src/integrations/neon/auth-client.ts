import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";

function neonAuthUrl(): string {
  const url =
    (typeof import.meta !== "undefined" &&
      (import.meta as ImportMeta & { env?: Record<string, string> }).env?.[
        "VITE_NEON_AUTH_URL"
      ]) ||
    process.env["VITE_NEON_AUTH_URL"] ||
    process.env["NEON_AUTH_BASE_URL"] ||
    "";
  return url.trim();
}

const url = neonAuthUrl();

/**
 * Neon Managed Better Auth browser client.
 * credentials:include required for cross-origin session + token().
 */
export const authClient = url
  ? createAuthClient(url, {
      adapter: BetterAuthReactAdapter(),
      fetchOptions: { credentials: "include" },
    })
  : null;

export function neonAuthConfigured(): boolean {
  return Boolean(url && url !== "provisioning" && authClient);
}

export function getNeonAuthUrl(): string {
  return url;
}
