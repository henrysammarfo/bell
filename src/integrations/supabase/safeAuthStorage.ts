/**
 * Production auth storage — prefer sessionStorage over localStorage.
 * Auth tokens in localStorage are durable XSS loot; sessionStorage limits
 * lifetime to the tab. Server truth is still Supabase JWT + httpOnly bell_session.
 * Lovable preview framing still uses brokeredPreviewStorage.
 */

export function safeAuthStorage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    // Prefer sessionStorage when available
    const probe = "__bell_auth_probe__";
    sessionStorage.setItem(probe, "1");
    sessionStorage.removeItem(probe);
    return sessionStorage;
  } catch {
    // Fail closed: in-memory only for this tab (no persistence)
    const map = new Map<string, string>();
    return {
      get length() {
        return map.size;
      },
      clear() {
        map.clear();
      },
      getItem(key: string) {
        return map.has(key) ? (map.get(key) as string) : null;
      },
      key(index: number) {
        return Array.from(map.keys())[index] ?? null;
      },
      removeItem(key: string) {
        map.delete(key);
      },
      setItem(key: string, value: string) {
        map.set(key, value);
      },
    } satisfies Storage;
  }
}
