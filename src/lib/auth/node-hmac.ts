/**
 * Lazy Node crypto accessors — never statically import `node:crypto` from client graphs.
 */

type NodeCrypto = typeof import("node:crypto");

export function getNodeCrypto(): NodeCrypto {
  if (typeof process === "undefined" || !process.versions?.node) {
    throw new Error("node:crypto is server-only");
  }

  const getBuiltin = (
    process as NodeJS.Process & {
      getBuiltinModule?: (id: string) => unknown;
    }
  ).getBuiltinModule;
  if (typeof getBuiltin === "function") {
    const mod = getBuiltin("crypto") ?? getBuiltin("node:crypto");
    if (mod) return mod as NodeCrypto;
  }

  const { createRequire } = (0, eval)("require")("node:module") as typeof import("node:module");
  return createRequire(import.meta.url)("node:crypto") as NodeCrypto;
}

export function hmacSha256Base64Url(secret: string, payload: string): string {
  const { createHmac } = getNodeCrypto();
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function timingSafeEqualUtf8(a: string, b: string): boolean {
  const { timingSafeEqual } = getNodeCrypto();
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
