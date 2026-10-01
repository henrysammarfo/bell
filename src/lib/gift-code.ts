/**
 * Pure helpers for BELL gift claim codes (no DB / crypto side effects beyond tests).
 */
export function isValidClaimCode(code: string): boolean {
  const t = code.trim();
  return t.length >= 12 && t.length <= 64 && /^[A-Za-z0-9_-]+$/.test(t);
}

export function claimFingerprint(claimCode: string): string {
  // Lightweight non-crypto fingerprint for UI only — server uses sha256.
  let h = 0;
  for (let i = 0; i < claimCode.length; i++) {
    h = (Math.imul(31, h) + claimCode.charCodeAt(i)) | 0;
  }
  return `gf${(h >>> 0).toString(16).padStart(8, "0")}`;
}

export function publicClaimUrl(origin: string, claimCode: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/gift/claim/${claimCode}`;
}
