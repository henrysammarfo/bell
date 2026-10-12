/**
 * In-process TTL cache for public Binance RWA reads.
 * Goal: 24/7 freshness without hammering Binance or burning free egress.
 * Serverless note: each isolate has its own map — still cuts burst fan-out.
 */

type Entry<T> = { expiresAt: number; value: T };

const store = new Map<string, Entry<unknown>>();

export const RWA_TTL = {
  /** Market open/closed flips slowly — 45s is enough for gift gate honesty. */
  marketStatus: 45_000,
  /** Full token catalogue is large; refresh every 10m. */
  list: 10 * 60_000,
  /** Per-asset dynamic prices — 20s keeps markets alive without N×spam. */
  dynamic: 20_000,
  /** Corporate-action asset status. */
  assetStatus: 60_000,
} as const;

export function rwaCacheGet<T>(key: string): T | undefined {
  const hit = store.get(key) as Entry<T> | undefined;
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return hit.value;
}

export function rwaCacheSet<T>(key: string, value: T, ttlMs: number): T {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export async function rwaCached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = rwaCacheGet<T>(key);
  if (hit !== undefined) return hit;
  const value = await loader();
  return rwaCacheSet(key, value, ttlMs);
}
